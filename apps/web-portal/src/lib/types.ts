/**
 * Web Portal types.
 * Re-exports canonical types from @barcutx/shared-types and adds
 * web-portal-specific shapes that don't belong in the shared package.
 */
export type {
  User,
  UserWithRoles,
  UserRole,
  UserStatus,
} from '@barcutx/shared-types'

export type {
  BarberShop,
  BarberShopWithDistance,
  BarberShopSettings,
  OpeningHours,
  DayHours,
} from '@barcutx/shared-types'

export type {
  Service,
  ServiceCategory,
} from '@barcutx/shared-types'

/**
 * Subset of BarberShop exposed in public-facing pages (slug profile, search).
 * Does not include ownerUserId or internal settings.
 */
export interface BarbershopPublic {
  id: string
  name: string
  slug: string
  description?: string
  phone?: string
  address: string
  city: string
  country: string
  logoUrl?: string
  coverUrl?: string
  isActive: boolean
  rating?: number
  reviewCount?: number
  queueLength?: number
  etaMinutes?: number
}

/** Shape returned by the API for paginated list responses. */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

/** Generic API error shape from the BarcutX backend. */
export interface ApiError {
  statusCode: number
  message: string
  detail?: string
}
