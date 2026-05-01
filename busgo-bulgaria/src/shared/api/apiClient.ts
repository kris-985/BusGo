import type { Booking } from '@/entities/booking/types'
import type { City } from '@/entities/location/types'
import type { Trip } from '@/entities/trip/types'
import type { ApiResult } from '@/shared/api/types'
import { mockApi } from '@/shared/api/mock/mockApi'

export type SearchTripsParams = {
  fromCityId: string
  toCityId: string
  date: string // YYYY-MM-DD
  passengers: number
}

export type CreateBookingInput = {
  tripId: string
  passengers: Array<{
    firstName: string
    lastName: string
    type: 'ADULT' | 'CHILD' | 'SENIOR'
  }>
  contactEmail: string
  contactPhone: string
  paymentMethod: 'CARD' | 'CASH_ON_BOARD'
}

export type ApiClient = {
  cities: {
    list(): Promise<ApiResult<City[]>>
  }
  trips: {
    search(params: SearchTripsParams): Promise<ApiResult<Trip[]>>
    byId(tripId: string): Promise<ApiResult<Trip>>
  }
  bookings: {
    create(input: CreateBookingInput): Promise<ApiResult<Booking>>
    byId(bookingId: string): Promise<ApiResult<Booking>>
  }
}

export const apiClient: ApiClient = mockApi

