import type { Booking } from '@/entities/booking/types'
import type { City } from '@/entities/location/types'
import type { Route } from '@/entities/route/types'
import type { Payment } from '@/entities/payment/types'
import type { SeatStatus } from '@/entities/seat/types'
import type { Trip } from '@/entities/trip/types'
import type { ApiResult } from '@/shared/api/types'
import { httpApi } from '@/shared/api/httpApi'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type AdminUserRecord = AuthUser

export type SearchTripsParams = {
  fromCityId: string
  toCityId: string
  date: string // YYYY-MM-DD
  passengers: number
}

export type CreateRouteInput = {
  fromCity: string
  toCity: string
  departureTime: string
  arrivalTime: string
  price: number
  totalSeats: number
  distanceKm?: number
}

export type AdminRouteRecord = {
  id: string
  fromCity: string
  toCity: string
  departureTime: string
  arrivalTime: string
  price: number
  availableSeats: number
  totalSeats: number
  distanceKm?: number
}

export type CreateBookingInput = {
  tripId: string
  travelDate?: string
  seatIds: string[]
  passengers: Array<{
    firstName: string
    lastName: string
    type: 'ADULT' | 'CHILD' | 'SENIOR'
  }>
  contactEmail: string
  contactPhone: string
  paymentMethod: 'CARD' | 'CASH_ON_BOARD'
}

export type SeatAvailability = {
  tripId: string
  updatedAt: string
  seats: Array<{
    id: string
    label: string
    row: number
    column: number
    status: SeatStatus
  }>
}

export type SeatOccupancySummary = {
  tripId: string
  route: string
  departureTime: string
  totalSeats: number
  occupiedSeats: number
  freeSeats: number
  occupancyRate: number
}

export type BookSeatsInput = {
  tripId: string
  seatIds: string[]
}

export type BookSeatsResult = {
  tripId: string
  bookedSeatIds: string[]
}

export type PayInput = {
  bookingId: string
  method: 'CARD' | 'CASH_ON_BOARD'
}

export type ApiClient = {
  auth: {
    login(input: LoginInput): Promise<ApiResult<AuthResponse>>
    signup(input: SignupInput): Promise<ApiResult<AuthResponse>>
    me(): Promise<ApiResult<AuthUser>>
  }
  cities: {
    list(): Promise<ApiResult<City[]>>
  }
  routes: {
    list(): Promise<ApiResult<Route[]>>
    adminList(): Promise<ApiResult<AdminRouteRecord[]>>
    create(input: CreateRouteInput): Promise<ApiResult<Trip>>
  }
  trips: {
    search(params: SearchTripsParams): Promise<ApiResult<Trip[]>>
    byId(tripId: string, travelDate?: string): Promise<ApiResult<Trip>>
  }
  seats: {
    availabilityByTrip(tripId: string): Promise<ApiResult<SeatAvailability>>
    occupancySummary(): Promise<ApiResult<SeatOccupancySummary[]>>
    book(input: BookSeatsInput): Promise<ApiResult<BookSeatsResult>>
  }
  bookings: {
    list(): Promise<ApiResult<Booking[]>>
    adminList(): Promise<ApiResult<Booking[]>>
    create(input: CreateBookingInput): Promise<ApiResult<Booking>>
    byId(bookingId: string): Promise<ApiResult<Booking>>
  }
  users: {
    adminList(): Promise<ApiResult<AdminUserRecord[]>>
  }
  payments: {
    pay(input: PayInput): Promise<ApiResult<Payment>>
  }
}

export const apiClient: ApiClient = httpApi
