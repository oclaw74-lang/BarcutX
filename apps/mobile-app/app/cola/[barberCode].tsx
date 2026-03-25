import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiClient, getWebSocketUrl, type QueueStatus } from '../../src/lib/api'

type ScreenState = 'joining' | 'in-queue' | 'error'

export default function ColaScreen() {
  const { barberCode, name } = useLocalSearchParams<{
    barberCode: string
    name: string
  }>()
  const router = useRouter()

  const [screenState, setScreenState] = useState<ScreenState>('joining')
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [myPosition, setMyPosition] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)

  // Join the queue on mount
  useEffect(() => {
    if (!barberCode || !name) {
      setError('Parametros invalidos')
      setScreenState('error')
      return
    }

    const join = async () => {
      try {
        const response = await apiClient.joinQueue(barberCode, {
          display_name: decodeURIComponent(name),
        })
        setMyToken(response.token)
        setMyPosition(response.position)
        setScreenState('in-queue')
        fetchInitialStatus()
        connectWebSocket(response.token)
      } catch (err) {
        setError('No se pudo unir a la cola. Intenta de nuevo.')
        setScreenState('error')
      }
    }

    join()

    return () => {
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchInitialStatus = useCallback(async () => {
    if (!barberCode) return
    try {
      const status = await apiClient.getQueueStatus(barberCode)
      setQueueStatus(status)
    } catch {
      // Non-critical: WebSocket will provide updates
    }
  }, [barberCode])

  const connectWebSocket = useCallback(
    (token: string) => {
      if (!barberCode) return

      const url = getWebSocketUrl(barberCode)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        // Send token so server can track our position
        ws.send(JSON.stringify({ type: 'identify', token }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as Partial<QueueStatus> & {
            my_position?: number
          }
          setQueueStatus((prev) => ({ ...(prev ?? {}), ...data } as QueueStatus))
          if (data.my_position !== undefined) {
            setMyPosition(data.my_position)
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onerror = () => {
        setWsConnected(false)
      }

      ws.onclose = () => {
        setWsConnected(false)
      }
    },
    [barberCode],
  )

  const handleLeaveQueue = () => {
    Alert.alert('Salir de la cola', '¿Seguro que quieres salir de la cola?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          if (barberCode && myToken) {
            try {
              await apiClient.leaveQueue(barberCode, myToken)
            } catch {
              // Best-effort: navigate anyway
            }
          }
          wsRef.current?.close()
          router.back()
        },
      },
    ])
  }

  if (screenState === 'joining') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Uniendote a la cola...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const position = myPosition ?? queueStatus?.my_position
  const estimatedWait =
    position != null && queueStatus
      ? position * 15
      : queueStatus?.estimated_wait_minutes ?? 0

  const entriesBeforeMe = (queueStatus?.entries ?? []).filter(
    (e) => !e.is_current_user && e.position < (position ?? 999),
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>En la cola</Text>
          {queueStatus?.barber_name && (
            <Text style={styles.headerSubtitle}>{queueStatus.barber_name}</Text>
          )}
          {!wsConnected && (
            <View style={styles.disconnectedBadge}>
              <Text style={styles.disconnectedText}>Sin conexion en vivo</Text>
            </View>
          )}
        </View>

        {/* Position card */}
        <View style={styles.positionCard}>
          <Text style={styles.positionLabel}>Tu posicion</Text>
          <Text style={styles.positionNumber}>
            #{position ?? '...'}
          </Text>
          <Text style={styles.positionSubtext}>en la cola</Text>
        </View>

        {/* Wait time */}
        <View style={styles.waitCard}>
          <Text style={styles.waitLabel}>Tiempo estimado</Text>
          <Text style={styles.waitTime}>
            ~{estimatedWait > 0 ? `${estimatedWait} minutos` : 'Pronto'}
          </Text>
        </View>

        {/* People before */}
        {entriesBeforeMe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personas antes que tu</Text>
            {entriesBeforeMe.map((entry, idx) => (
              <View key={idx} style={styles.personRow}>
                <View style={styles.personDot} />
                <Text style={styles.personText}>Persona #{entry.position}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Leave button */}
        <View style={styles.leaveSection}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveQueue}>
            <Text style={styles.leaveButtonText}>Salir de la cola</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    gap: 4,
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 26,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '500',
  },
  disconnectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B1212',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  disconnectedText: {
    color: '#FCA5A5',
    fontSize: 11,
  },
  positionCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  positionLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
  positionNumber: {
    color: '#D97706',
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
  },
  positionSubtext: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  waitCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  waitLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  waitTime: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    gap: 10,
  },
  personDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  personText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  leaveSection: {
    marginTop: 8,
  },
  leaveButton: {
    backgroundColor: '#3B1212',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#FCA5A5',
    fontWeight: '600',
    fontSize: 15,
  },
})
