import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiClient, type ShopDetail, type Barber } from '../../src/lib/api'

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
}

function BarberItem({
  barber,
  onJoin,
}: {
  barber: Barber
  onJoin: (barber: Barber) => void
}) {
  return (
    <View style={styles.barberCard}>
      <View style={styles.barberLeft}>
        {barber.avatar_url ? (
          <Image source={{ uri: barber.avatar_url }} style={styles.barberAvatar} />
        ) : (
          <View style={styles.barberAvatarPlaceholder}>
            <Text style={styles.barberAvatarInitial}>
              {barber.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.barberInfo}>
          <Text style={styles.barberName}>{barber.display_name}</Text>
          <Text style={styles.barberQueue}>
            {barber.queue_count} {barber.queue_count === 1 ? 'persona' : 'personas'} en cola
          </Text>
          {barber.estimated_wait_minutes > 0 && (
            <Text style={styles.barberWait}>
              ~{barber.estimated_wait_minutes} min de espera
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, !barber.is_accepting && styles.joinButtonDisabled]}
        onPress={() => onJoin(barber)}
        disabled={!barber.is_accepting}
      >
        <Text style={styles.joinButtonText}>
          {barber.is_accepting ? 'Unirme' : 'No disponible'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default function BarberiaDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [shop, setShop] = useState<ShopDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchShop = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.getShopDetail(slug)
        setShop(data)
      } catch (err) {
        setError('No se pudo cargar la barberia. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    fetchShop()
  }, [slug])

  const handleJoin = (barber: Barber) => {
    Alert.prompt(
      `Unirte a la cola de ${barber.display_name}`,
      'Ingresa tu nombre para la cola',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Unirme',
          onPress: (name) => {
            if (!name?.trim()) return
            router.push(
              `/cola/${barber.barber_code}?name=${encodeURIComponent(name.trim())}`,
            )
          },
        },
      ],
      'plain-text',
      '',
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Cargando barberia...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Barberia no encontrada'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        {shop.cover_image_url ? (
          <Image
            source={{ uri: shop.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{'< Volver'}</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          {/* Shop info */}
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopAddress}>{shop.address}</Text>
          <Text style={styles.shopCity}>{shop.city}</Text>

          {/* Working hours */}
          {shop.working_hours && Object.keys(shop.working_hours).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horarios</Text>
              {Object.entries(shop.working_hours).map(([day, hours]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day] ?? day}</Text>
                  <Text style={styles.hoursValue}>
                    {hours ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Barbers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Barberos ({shop.barbers.length})
            </Text>
            {shop.barbers.length === 0 ? (
              <Text style={styles.emptyText}>Sin barberos disponibles</Text>
            ) : (
              shop.barbers.map((barber) => (
                <BarberItem key={barber.id} barber={barber} onJoin={handleJoin} />
              ))
            )}
          </View>
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
  errorText: {
    color: '#FCA5A5',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#D97706',
    fontWeight: '600',
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  coverPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#1C1C1C',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#F9FAFB',
    fontWeight: '500',
  },
  body: {
    padding: 16,
  },
  shopName: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  shopAddress: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  shopCity: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  dayLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  hoursValue: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '500',
  },
  barberCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  barberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberAvatarInitial: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
  barberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  barberName: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  barberQueue: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  barberWait: {
    color: '#D97706',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
  joinButtonText: {
    color: '#111111',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
  },
})
