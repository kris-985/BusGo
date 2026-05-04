import type { Booking } from '@/entities/booking/types'
import type { Payment } from '@/entities/payment/types'
import { PaymentStatus } from '@/entities/payment/types'
import { SeatStatus } from '@/entities/seat/types'
import type {
  ApiClient,
  BookSeatsInput,
  CreateBookingInput,
  PayInput,
  SearchTripsParams,
  SeatAvailability,
  SeatOccupancySummary,
} from '@/shared/api/apiClient'
import type { ApiResult } from '@/shared/api/types'
import { bookings, cities, routes, seatMapsByTripId, trips } from '@/shared/api/mock/db'

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

function clone<T>(value: T): T {
  return structuredClone(value)
}

const lastRealtimeSeatUpdateByTripId: Record<string, number> = {}
const realtimeSeatUpdateMs = 3000

function applyRealtimeSeatUpdate(tripId: string) {
  const now = Date.now()
  const lastUpdate = lastRealtimeSeatUpdateByTripId[tripId] ?? 0

  if (lastUpdate === 0) {
    lastRealtimeSeatUpdateByTripId[tripId] = now
    return
  }

  if (now - lastUpdate < realtimeSeatUpdateMs) return
  lastRealtimeSeatUpdateByTripId[tripId] = now

  const map = seatMapsByTripId[tripId]
  if (!map) return

  const freeSeats = map.filter((seat) => seat.status === SeatStatus.Free)
  if (freeSeats.length === 0) return

  const nextSeat = freeSeats[Math.floor(Math.random() * freeSeats.length)]
  nextSeat.status = SeatStatus.Occupied
}

function seatOccupancySummary(): SeatOccupancySummary[] {
  return trips.map((trip) => {
    applyRealtimeSeatUpdate(trip.id)

    const map = seatMapsByTripId[trip.id] ?? []
    const occupiedSeats = map.filter((seat) => seat.status === SeatStatus.Occupied).length
    const totalSeats = map.length
    const freeSeats = Math.max(0, totalSeats - occupiedSeats)

    return {
      tripId: trip.id,
      route: `${trip.from.name} - ${trip.to.name}`,
      departureTime: trip.departureTime,
      totalSeats,
      occupiedSeats,
      freeSeats,
      occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
    }
  })
}

export const mockApi: ApiClient = {
  cities: {
    async list() {
      await sleep(150)
      return ok(cities)
    },
  },
  routes: {
    async list() {
      await sleep(220)
      return ok(routes)
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
  seats: {
    async availabilityByTrip(tripId: string) {
      await sleep(260)
      const trip = trips.find((t) => t.id === tripId)
      if (!trip) return fail('Trip not found', 404)

      const map = seatMapsByTripId[tripId]
      if (!map) return fail('Seat map not found', 404)

      applyRealtimeSeatUpdate(tripId)

      const res: SeatAvailability = {
        tripId,
        updatedAt: new Date().toISOString(),
        seats: clone(map),
      }
      return ok(res)
    },
    async occupancySummary() {
      await sleep(220)
      return ok(seatOccupancySummary())
    },
    async book(input: BookSeatsInput) {
      await sleep(420)
      const trip = trips.find((t) => t.id === input.tripId)
      if (!trip) return fail('Trip not found', 404)

      const map = seatMapsByTripId[input.tripId]
      if (!map) return fail('Seat map not found', 404)

      const uniqueSeatIds = Array.from(new Set(input.seatIds)).filter(Boolean)
      if (uniqueSeatIds.length === 0) return fail('No seats selected', 422)
      if (uniqueSeatIds.length > 6) return fail('Too many seats requested', 422)

      const byId = new Map(map.map((s) => [s.id, s]))
      for (const seatId of uniqueSeatIds) {
        const seat = byId.get(seatId)
        if (!seat) return fail(`Seat not found: ${seatId}`, 404)
        if (seat.status === SeatStatus.Occupied) return fail(`Seat already occupied: ${seat.label}`, 409)
      }

      // Mark as occupied (server-side truth). "Selected" is UI-only state in this demo.
      for (const seatId of uniqueSeatIds) {
        const seat = byId.get(seatId)!
        seat.status = SeatStatus.Occupied
      }

      return ok({ tripId: input.tripId, bookedSeatIds: uniqueSeatIds })
    },
  },
  bookings: {
    async list() {
      await sleep(200)
      return ok(clone(bookings))
    },
    async create(input: CreateBookingInput) {
      await sleep(350)
      const trip = trips.find((t) => t.id === input.tripId)
      if (!trip) return fail('Trip not found', 404)

      const uniqueSeatIds = Array.from(new Set(input.seatIds)).filter(Boolean)
      if (uniqueSeatIds.length === 0) return fail('No seats selected', 422)

      const seatMap = seatMapsByTripId[input.tripId]
      if (!seatMap) return fail('Seat map not found', 404)

      const seatsById = new Map(seatMap.map((seat) => [seat.id, seat]))
      for (const seatId of uniqueSeatIds) {
        const seat = seatsById.get(seatId)
        if (!seat) return fail(`Seat not found: ${seatId}`, 404)
        if (seat.status === SeatStatus.Occupied) return fail(`Seat already occupied: ${seat.label}`, 409)
      }

      for (const seatId of uniqueSeatIds) {
        seatsById.get(seatId)!.status = SeatStatus.Occupied
      }

      const passengers = input.passengers.map((p, idx) => ({
        id: `p-${Date.now()}-${idx}`,
        ...p,
      }))

      const totalAmount = uniqueSeatIds.length * trip.price.amount

      const booking: Booking = {
        id: `b-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'CONFIRMED',
        trip,
        seatIds: uniqueSeatIds,
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
  payments: {
    async pay(input: PayInput) {
      // Simulate "processing" + always-success (for now).
      await sleep(650)
      const booking = bookings.find((b) => b.id === input.bookingId)
      if (!booking) return fail('Booking not found', 404)

      const payment: Payment = {
        id: `pay-${Date.now()}`,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        status: PaymentStatus.Succeeded,
        method: input.method,
        amount: booking.total,
        provider: input.method === 'CARD' ? 'MockPay' : 'Cash',
        providerPaymentId: input.method === 'CARD' ? `mp_${Math.random().toString(16).slice(2)}` : undefined,
      }

      return ok(payment)
    },
  },
}
