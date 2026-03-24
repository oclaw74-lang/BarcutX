export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type AppointmentSource = 'mobile' | 'web'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Appointment {
  id: string
  barberShopId: string
  barberId: string
  userId: string
  serviceId: string
  status: AppointmentStatus
  scheduledStart: string
  scheduledEnd: string
  estimatedMinutes: number
  notes?: string
  paymentStatus: PaymentStatus
  source: AppointmentSource
  createdAt: string
}
