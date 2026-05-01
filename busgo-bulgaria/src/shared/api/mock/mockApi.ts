import type { Booking } from '@/entities/booking/types'
import type { PassengerType } from '@/entities/passenger/types'
import type { ApiClient, CreateBookingInput, SearchTripsParams } from '@/shared/api/apiClient'
import type { ApiResult } from '@/shared/api/types'
import { bookings, cities, trips } from '@/shared/api/mock/db'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function fail(message: string, status?: number): ApiResult<never> {
  return { ok: false, error: { code: 'UNKNOWN', message, status } }
}

function dateOnly(iso: string) {
  return iso.slice(0, 10)
}

function passengerMultiplier(type: PassengerType) {
  if (type === 'CHILD') return 0.7
  if (type === 'SENIOR') return 0.85
  return 1
}

export const mockApi: ApiClient = {
  cities: {
    async list() {
      await sleep(150)
      return ok(cities)
    },
  },
  trips: {
    async search(params: SearchTripsParams) {
      await sleep(250)
      const filtered = trips.filter((t) => {
        const sameRoute = t.from.id === params.fromCityId && t.to.id === params.toCityId
        const sameDate = dateOnly(t.departureTime) === params.date
        return sameRoute && sameDate
      })
      return ok(filtered)
    },
    async byId(tripId: string) {
      await sleep(200)
      const trip = trips.find((t) => t.id === tripId)
      if (!trip) return fail('Trip not found', 404)
      return ok(trip)
    },
  },
  bookings: {
    async create(input: CreateBookingInput) {
      await sleep(350)
      const trip = trips.find((t) => t.id === input.tripId)
      if (!trip) return fail('Trip not found', 404)

      const passengers = input.passengers.map((p, idx) => ({
        id: `p-${Date.now()}-${idx}`,
        ...p,
      }))

      const totalAmount = passengers.reduce((sum, p) => {
        return sum + trip.price.amount * passengerMultiplier(p.type)
      }, 0)

      const booking: Booking = {
        id: `b-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'CONFIRMED',
        trip,
        passengers,
        total: { amount: Math.round(totalAmount * 100) / 100, currency: trip.price.currency },
        paymentMethod: input.paymentMethod,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      }

      bookings.unshift(booking)
      return ok(booking)
    },
    async byId(bookingId: string) {
      await sleep(200)
      const booking = bookings.find((b) => b.id === bookingId)
      if (!booking) return fail('Booking not found', 404)
      return ok(booking)
    },
  },
}

