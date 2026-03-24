export interface BarberShop {
  id: string
  ownerUserId: string
  name: string
  slug: string
  description?: string
  phone?: string
  email?: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  logoUrl?: string
  coverUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BarberShopSettings {
  id: string
  barberShopId: string
  openingHours: OpeningHours
  queueEnabled: boolean
  appointmentsEnabled: boolean
  membershipEnabled: boolean
  depositRequired: boolean
  defaultCurrency: string
  timezone: string
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string  // "09:00"
  close: string // "19:00"
  isOpen: boolean
}

export interface BarberShopWithDistance extends BarberShop {
  distanceKm: number
  queueLength: number
  etaMinutes: number
  rating?: number
}
