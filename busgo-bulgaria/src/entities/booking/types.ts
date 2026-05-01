import type { Passenger } from '@/entities/passenger/types'
import type { Trip } from '@/entities/trip/types'
import type { ID, ISODateTime, Money } from '@/shared/types/common'

export const PaymentMethodEnum = {
  Card: 'CARD',
  CashOnBoard: 'CASH_ON_BOARD',
} as const

export type PaymentMethod = 'CARD' | 'CASH_ON_BOARD'

export const BookingStatusEnum = {
  Pending: 'PENDING',
  Confirmed: 'CONFIRMED',
  Cancelled: 'CANCELLED',
} as const

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export interface Booking {
  id: ID
  createdAt: ISODateTime
  status: BookingStatus
  trip: Trip
  passengers: Passenger[]
  total: Money
  paymentMethod: PaymentMethod
  contactEmail: string
  contactPhone: string
}

