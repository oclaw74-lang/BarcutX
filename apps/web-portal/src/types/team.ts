/**
 * Team management domain types for the BarcutX web portal.
 */

export type BarberRole = 'senior' | 'associate'
export type BarberStatus = 'active' | 'inactive'
export type InvitationStatus = 'pending' | 'expired' | 'rejected'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface ShopBarber {
  id: string
  userId: string
  shopId: string
  name: string
  avatarUrl?: string
  role: BarberRole
  status: BarberStatus
  clientsToday: number
  revenueToday: number
  joinedAt: string
}

export interface BarberInvitation {
  id: string
  shopId: string
  email: string
  status: InvitationStatus
  sentAt: string
  expiresAt: string
  message?: string
}

export interface JoinRequest {
  id: string
  shopId: string
  userId: string
  name: string
  avatarUrl?: string
  specialty?: string
  message?: string
  status: JoinRequestStatus
  requestedAt: string
}

export interface InviteBarberPayload {
  email: string
  message?: string
}

export interface ApproveRequestPayload {
  requestId: string
}

export interface RejectRequestPayload {
  requestId: string
}
