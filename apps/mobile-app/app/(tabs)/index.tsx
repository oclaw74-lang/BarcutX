import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { ShopCard } from '../../src/components/ShopCard'
import { apiClient, type NearbyShop } from '../../src/lib/api'

type LoadingState = 'idle' | 'location' | 'search'

export default function ExplorarScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState<NearbyShop[]>([])
  const [loading, setLoading] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearchByCity = useCallback(async () => {
    const city = query.trim()
    if (!city) return

    setLoading('search')
    setError(null)

    try {
      const results = await apiClient.searchByCity(city)
      setShops(results)
      setHasSearched(true)
    } catch (err) {
      setError('No se pudieron cargar las barberías. Intenta de nuevo.')
      setShops([])
    } finally {
      setLoading('idle')
    }
  }, [query])

  const handleUseLocation = useCallback(async () => {
    setLoading('location')
    setError(null)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu ubicación para mostrarte barberías cercanas.',
        )
        return
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const results = await apiClient.getNearby(
        position.coords.latitude,
        position.coords.longitude,
      )
      setShops(results)
      setHasSearched(true)
    } catch (err) {
      setError('Error al obtener ubicación. Verifica los permisos.')
      setShops([])
    } finally {
      setLoading('idle')
    }
  }, [])

  const handleShopPress = useCallback(
    (shop: NearbyShop) => {
      router.push(`/barberia/${shop.id}`)
    },
    [router],
  )

  const isLoading = loading !== 'idle'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BarcutX</Text>
        <Text style={styles.subtitle}>Encuentra tu barbería</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar ciudad..."
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchByCity}
          returnKeyType="search"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.searchButton, isLoading && styles.buttonDisabled]}
          onPress={handleSearchByCity}
          disabled={isLoading || !query.trim()}
        >
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.locationButton, loading === 'location' && styles.buttonDisabled]}
        onPress={handleUseLocation}
        disabled={isLoading}
      >
        {loading === 'location' ? (
          <ActivityIndicator size="small" color="#D97706" />
        ) : (
          <Text style={styles.locationButtonText}>Usar mi ubicacion</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading === 'search' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Buscando barberías...</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShopCard shop={item} onPress={handleShopPress} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron barberías</Text>
                <Text style={styles.emptySubtext}>Prueba con otra ciudad o amplía el radio</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Busca una ciudad</Text>
                <Text style={styles.emptySubtext}>o usa tu ubicación para empezar</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#D97706',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F9FAFB',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchButton: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#111111',
    fontWeight: '600',
    fontSize: 14,
  },
  locationButton: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D97706',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  locationButtonText: {
    color: '#D97706',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    backgroundColor: '#3B1212',
    borderRadius: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 13,
  },
})
