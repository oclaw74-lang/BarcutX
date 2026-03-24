export type PaymentType = 'deposit' | 'full_payment' | 'membership' | 'refund'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'

export interface Payment {
  id: string
  userId: string
  barberShopId: string
  appointmentId?: string
  queueEntryId?: string
  membershipId?: string
  stripePaymentIntentId: string
  stripeChargeId?: string
  amount: number
  currency: string
  paymentType: PaymentType
  status: PaymentStatus
  createdAt: string
}
