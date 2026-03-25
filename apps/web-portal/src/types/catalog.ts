import type { Service, ServiceCategory } from '@barcutx/shared-types'

// Re-export Service from shared-types for catalog use
export type { Service, ServiceCategory }

// ---- Product ----------------------------------------------------------------

export type ProductCategory =
  | 'wax'
  | 'shampoo'
  | 'conditioner'
  | 'oil'
  | 'razor'
  | 'other'

export interface Product {
  id: string
  barberId: string
  name: string
  description?: string
  price: number
  stock: number
  category: ProductCategory
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductPayload {
  name: string
  description?: string
  price: number
  stock: number
  category: ProductCategory
  imageUrl?: string
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  isActive?: boolean
}

// ---- Portfolio --------------------------------------------------------------

export interface PortfolioItem {
  id: string
  barberId: string
  imageUrl: string
  caption?: string
  order: number
  createdAt: string
}

export interface CreatePortfolioItemPayload {
  imageUrl: string
  caption?: string
  order?: number
}

export interface ReorderPortfolioPayload {
  items: Array<{ id: string; order: number }>
}

// ---- Barber Service (service assigned to a specific barber) -----------------

export interface BarberService {
  id: string
  barberId: string
  service: Service
  /** Override price set by the barber; null means use the shop default */
  customPrice: number | null
  isActive: boolean
  isInherited: boolean
}

export interface UpdateBarberServicePayload {
  isActive?: boolean
  customPrice?: number | null
}

export interface CreateBarberServicePayload {
  name: string
  description?: string
  price: number
  durationMinutes: number
  category: ServiceCategory
}
