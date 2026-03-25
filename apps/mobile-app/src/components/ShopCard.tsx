import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import type { NearbyShop } from '../lib/api'

interface ShopCardProps {
  shop: NearbyShop
  onPress: (shop: NearbyShop) => void
}

export function ShopCard({ shop, onPress }: ShopCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(shop)}
      activeOpacity={0.8}
    >
      {shop.cover_image_url ? (
        <Image
          source={{ uri: shop.cover_image_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {shop.name}
          </Text>
          <View style={[styles.badge, shop.is_open ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{shop.is_open ? 'Abierto' : 'Cerrado'}</Text>
          </View>
        </View>

        <Text style={styles.city}>{shop.city}</Text>

        <View style={styles.footer}>
          <Text style={styles.meta}>
            {shop.barber_count} {shop.barber_count === 1 ? 'barbero' : 'barberos'}
          </Text>
          {shop.distance_km > 0 && (
            <Text style={styles.distance}>{shop.distance_km.toFixed(1)} km</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#2A2A2A',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOpen: {
    backgroundColor: '#064E3B',
  },
  badgeClosed: {
    backgroundColor: '#3B1212',
  },
  badgeText: {
    color: '#F9FAFB',
    fontSize: 11,
    fontWeight: '500',
  },
  city: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#6B7280',
    fontSize: 12,
  },
  distance: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '500',
  },
})
