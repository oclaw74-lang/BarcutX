export type ServiceCategory = 'haircut' | 'beard' | 'combo' | 'kids' | 'other'

export interface Service {
  id: string
  barberShopId: string
  barberId?: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  category: ServiceCategory
  isActive: boolean
}
