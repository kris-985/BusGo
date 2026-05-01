import type { PaymentMethod } from '@/entities/booking/types'
import type { ID, ISODateTime, Money } from '@/shared/types/common'

export const PaymentStatus = {
  Pending: 'PENDING',
  Authorized: 'AUTHORIZED',
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED',
  Refunded: 'REFUNDED',
  Cancelled: 'CANCELLED',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export interface Payment {
  id: ID
  bookingId: ID
  createdAt: ISODateTime
  status: PaymentStatus
  method: PaymentMethod
  amount: Money
  provider?: string // e.g. Stripe, Adyen
  providerPaymentId?: string
}

