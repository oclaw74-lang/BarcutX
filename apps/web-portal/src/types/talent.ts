/**
 * Talent marketplace domain types for the BarcutX web portal.
 */

export type BarberSpecialty =
  | 'Todos'
  | 'Fade'
  | 'Degradado'
  | 'Barba'
  | 'Diseños'
  | 'Coloracion'

export type AvailabilityType =
  | 'Todos'
  | 'Tiempo completo'
  | 'Medio tiempo'
  | 'Freelance'

export interface BarberTalent {
  id: string
  name: string
  specialty: BarberSpecialty | string
  city: string
  bio?: string
  avatarUrl?: string
  availabilityType: Exclude<AvailabilityType, 'Todos'>
  isAvailable: boolean
}

export interface BarberPortfolioItem {
  id: string
  imageUrl: string
  caption?: string
}

export interface BarberTalentDetail extends BarberTalent {
  portfolio: BarberPortfolioItem[]
}

export interface TalentFilters {
  city: string
  specialty: BarberSpecialty
  availabilityType: AvailabilityType
}

export interface SendInvitationPayload {
  barberId: string
  message?: string
}

export interface InvitationResponse {
  id: string
  shopId: string
  barberId: string
  status: 'pending' | 'accepted' | 'rejected'
  sentAt: string
}
