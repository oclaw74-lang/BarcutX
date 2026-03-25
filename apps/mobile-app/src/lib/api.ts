const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

// --- Types ---

export interface NearbyShop {
  id: string
  name: string
  slug: string
  city: string
  address: string
  lat: number
  lng: number
  distance_km: number
  barber_count: number
  is_open: boolean
  cover_image_url: string | null
}

export interface Barber {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  barber_code: string
  queue_count: number
  estimated_wait_minutes: number
  is_accepting: boolean
}

export interface ShopDetail {
  id: string
  name: string
  slug: string
  address: string
  city: string
  cover_image_url: string | null
  working_hours: Record<string, { open: string; close: string } | null>
  barbers: Barber[]
}

export interface QueueEntry {
  position: number
  display_name: string
  is_current_user: boolean
}

export interface QueueStatus {
  barber_code: string
  barber_name: string
  queue_count: number
  estimated_wait_minutes: number
  is_accepting: boolean
  entries: QueueEntry[]
  my_position: number | null
  my_token: string | null
}

export interface JoinQueueRequest {
  display_name: string
}

export interface JoinQueueResponse {
  token: string
  position: number
  estimated_wait_minutes: number
}

// --- Helpers ---

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// --- API Client ---

export const apiClient = {
  getNearby: async (lat: number, lng: number, radiusKm = 5): Promise<NearbyShop[]> => {
    const res = await fetch(
      `${API_BASE}/api/v1/geo/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`,
    )
    return handleResponse<NearbyShop[]>(res)
  },

  searchByCity: async (city: string): Promise<NearbyShop[]> => {
    const res = await fetch(
      `${API_BASE}/api/v1/geo/search?city=${encodeURIComponent(city)}`,
    )
    return handleResponse<NearbyShop[]>(res)
  },

  getShopDetail: async (shopId: string): Promise<ShopDetail> => {
    const res = await fetch(`${API_BASE}/api/v1/barber-shops/${shopId}/public`)
    return handleResponse<ShopDetail>(res)
  },

  getQueueStatus: async (barberCode: string): Promise<QueueStatus> => {
    const res = await fetch(`${API_BASE}/api/v1/queue-public/${barberCode}`)
    return handleResponse<QueueStatus>(res)
  },

  joinQueue: async (
    barberCode: string,
    payload: JoinQueueRequest,
  ): Promise<JoinQueueResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/queue-public/${barberCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse<JoinQueueResponse>(res)
  },

  leaveQueue: async (barberCode: string, token: string): Promise<void> => {
    const res = await fetch(
      `${API_BASE}/api/v1/queue-public/${barberCode}/leave?token=${token}`,
      { method: 'DELETE' },
    )
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
  },
}

export const getWebSocketUrl = (barberCode: string): string => {
  const wsBase = API_BASE.replace(/^http/, 'ws')
  return `${wsBase}/api/v1/queue-public/${barberCode}/ws`
}
