import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ---- Types ------------------------------------------------------------------

export interface ShopSearchResult {
  id: string
  name: string
  slug: string | null
  city: string
  address: string | null
  logo_url: string | null
  cover_url: string | null
  accent_color: string | null
  is_active: boolean
}

export interface ShopNearbyResult {
  id: string
  name: string
  slug: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  distance_km: number
  rating: number | null
  is_open: boolean
  accent_color: string | null
  logo_url: string | null
  barber_count: number
}

export interface ShopPublicProfile {
  id: string
  name: string
  slug: string | null
  description: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  accent_color: string | null
  tagline: string | null
  instagram_url: string | null
  whatsapp: string | null
  logo_url: string | null
  cover_url: string | null
  gallery_urls: string[]
  is_active: boolean
  created_at: string
}

export interface BarberPublicProfile {
  id: string
  profile_id: string
  specialty: string | null
  bio: string | null
  avatar_url: string | null
  rating: number | null
  total_reviews: number | null
  is_available_for_hire: boolean
  hire_type: string | null
  target_city: string | null
  qr_code: string | null
  shop: {
    id: string
    name: string
    city: string
  } | null
}

export interface BarberListItem {
  id: string
  shop_id: string
  profile_id: string
  bio: string | null
  is_active: boolean
  created_at: string
}

// ---- Query key factories ----------------------------------------------------

const exploreKeys = {
  search: (city: string) => ['explore', 'search', city] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    ['explore', 'nearby', lat, lng, radius] as const,
  shopPublic: (shopId: string) => ['explore', 'shop', shopId] as const,
  shopBarbers: (shopId: string) => ['explore', 'shop-barbers', shopId] as const,
  barberPublic: (barberId: string) => ['explore', 'barber', barberId] as const,
  barberPortfolio: (barberId: string) =>
    ['explore', 'barber-portfolio', barberId] as const,
}

// ---- Hooks ------------------------------------------------------------------

/**
 * useSearchShops — fetches barber shops by city name.
 * Endpoint: GET /api/v1/geo/search?city=
 */
export function useSearchShops(city: string) {
  return useQuery<ShopSearchResult[]>({
    queryKey: exploreKeys.search(city),
    queryFn: async () => {
      const { data } = await apiClient.get<ShopSearchResult[]>(
        '/api/v1/geo/search',
        { params: { city, limit: 50 } },
      )
      return data
    },
    enabled: city.trim().length > 1,
    staleTime: 30_000,
  })
}

/**
 * useNearbyShops — fetches barber shops near a geo coordinate.
 * Endpoint: GET /api/v1/geo/nearby?lat=&lng=&radius_km=
 */
export function useNearbyShops(lat: number, lng: number, radius_km = 5) {
  return useQuery<ShopNearbyResult[]>({
    queryKey: exploreKeys.nearby(lat, lng, radius_km),
    queryFn: async () => {
      const { data } = await apiClient.get<ShopNearbyResult[]>(
        '/api/v1/geo/nearby',
        { params: { lat, lng, radius_km } },
      )
      return data
    },
    enabled: lat !== 0 && lng !== 0,
    staleTime: 60_000,
  })
}

/**
 * useShopPublicProfile — fetches the full public profile of a barbershop.
 * Endpoint: GET /api/v1/barber-shops/{shopId}/public
 */
export function useShopPublicProfile(shopId: string) {
  return useQuery<ShopPublicProfile>({
    queryKey: exploreKeys.shopPublic(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<ShopPublicProfile>(
        `/api/v1/barber-shops/${shopId}/public`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

/**
 * useShopBarbers — fetches the barber list for a shop.
 * Endpoint: GET /api/v1/barber-shops/{shopId}/barbers
 */
export function useShopBarbers(shopId: string) {
  return useQuery<BarberListItem[]>({
    queryKey: exploreKeys.shopBarbers(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberListItem[]>(
        `/api/v1/barber-shops/${shopId}/barbers`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

/**
 * useBarberPublicProfile — fetches the public profile of a barber.
 * Endpoint: GET /api/v1/barbers/{barberId}/public
 */
export function useBarberPublicProfile(barberId: string) {
  return useQuery<BarberPublicProfile>({
    queryKey: exploreKeys.barberPublic(barberId),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberPublicProfile>(
        `/api/v1/barbers/${barberId}/public`,
      )
      return data
    },
    enabled: !!barberId,
  })
}

/**
 * useBarberPortfolio — fetches the ordered portfolio for a barber.
 * Endpoint: GET /api/v1/barbers/{barberId}/portfolio
 */
export interface PortfolioItem {
  id: string
  barber_id: string
  image_url: string
  caption: string | null
  order: number
  created_at: string
}

export function useBarberPortfolioPublic(barberId: string) {
  return useQuery<PortfolioItem[]>({
    queryKey: exploreKeys.barberPortfolio(barberId),
    queryFn: async () => {
      const { data } = await apiClient.get<PortfolioItem[]>(
        `/api/v1/barbers/${barberId}/portfolio`,
      )
      return data
    },
    enabled: !!barberId,
  })
}
