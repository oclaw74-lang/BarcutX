export interface Barber {
  id: string
  barberShopId: string
  userId?: string
  displayName: string
  bio?: string
  specialization?: string
  averageServiceMinutes: number
  isActive: boolean
  createdAt: string
}

export interface BarberPortfolioItem {
  id: string
  barberId: string
  title: string
  description?: string
  imageUrl: string
  styleTag?: string
  createdAt: string
}
