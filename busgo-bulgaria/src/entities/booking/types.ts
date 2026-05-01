import type { Passenger } from '@/entities/passenger/types'
import type { Trip } from '@/entities/trip/types'
import type { ID, ISODateTime, Money } from '@/shared/types/common'

export type PaymentMethod = 'CARD' | 'CASH_ON_BOARD'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export type Booking = {
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

