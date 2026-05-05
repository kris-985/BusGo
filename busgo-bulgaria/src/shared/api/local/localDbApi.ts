import type { Booking } from '@/entities/booking/types'
import type { City } from '@/entities/location/types'
import type { Payment } from '@/entities/payment/types'
import { PaymentStatus } from '@/entities/payment/types'
import type { Route } from '@/entities/route/types'
import { SeatStatus, type Seat } from '@/entities/seat/types'
import type { Trip } from '@/entities/trip/types'
import type {
  ApiClient,
  AdminRouteRecord,
  BookSeatsInput,
  CreateBookingInput,
  CreateRouteInput,
  PayInput,
  SearchTripsParams,
  SeatAvailability,
  SeatOccupancySummary,
} from '@/shared/api/apiClient'
import type { ApiErrorCode, ApiResult } from '@/shared/api/types'

import database from './db.json'

type RouteRecord = {
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

type PersistedSeatAvailability = {
  version: 1
  routes: Array<{
    id: string
    availableSeats: number
    occupiedSeatIds: string[]
  }>
}

const storageKey = 'busgo:local-seat-availability:v1'
const routeRecords: RouteRecord[] = database.routes
const operator = { id: 'op-busgo', name: 'BusGo Bulgaria' }
const currency = 'BGN'

const distanceByRoute = new Map<string, number>([
  ['Sofia-Plovdiv', 146],
  ['Sofia-Varna', 470],
  ['Plovdiv-Burgas', 253],
  ['Varna-Burgas', 133],
  ['Sofia-Stara Zagora', 231],
])

const cityIdByName = new Map<string, string>([
  ['Sofia', 'sof'],
  ['Plovdiv', 'pld'],
  ['Varna', 'var'],
  ['Burgas', 'bgs'],
  ['Stara Zagora', 'szg'],
])

const cityOrder = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora']

const citiesByName = new Map<string, City>()
for (const record of routeRecords) {
  for (const name of [record.fromCity, record.toCity]) {
    if (!citiesByName.has(name)) {
      citiesByName.set(name, {
        id: cityIdByName.get(name) ?? name.toLowerCase().replace(/\s+/g, '-'),
        name,
        countryCode: 'BG',
      })
    }
  }
}

const cities = cityOrder.map((name) => cityByName(name))
const bookings: Booking[] = []
const seatMapsByTripId = buildSeatMaps(routeRecords)
const citiesBySearchValue = buildCitySearchIndex(cities)

hydrateSeatAvailability()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function errorCodeFromStatus(status?: number): ApiErrorCode {
  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409 || status === 422) return 'VALIDATION'
  return 'UNKNOWN'
}

function fail(message: string, status?: number): ApiResult<never> {
  return { ok: false, error: { code: errorCodeFromStatus(status), message, status } }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function cityByName(name: string): City {
  const city = citiesByName.get(name)
  if (!city) throw new Error(`Unknown city in local database: ${name}`)
  return city
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\p{L}+/gu, (word) => word[0].toLocaleUpperCase() + word.slice(1))
}

function slug(value: string) {
  return normalizeSearchValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildCitySearchIndex(cityList: City[]) {
  const index = new Map<string, City>()

  for (const city of cityList) {
    index.set(normalizeSearchValue(city.id), city)
    index.set(normalizeSearchValue(city.name), city)
  }

  return index
}

function resolveSearchCity(value: string) {
  return citiesBySearchValue.get(normalizeSearchValue(value))
}

function minutesBetween(startIso: string, endIso: string) {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
}

function localDatePart(iso: string) {
  return iso.slice(0, 10)
}

function routeKey(fromCity: string, toCity: string) {
  return `${fromCity}-${toCity}`
}

function ensureCity(name: string) {
  if (citiesByName.has(name)) return cityByName(name)

  const city: City = {
    id: cityIdByName.get(name) ?? slug(name),
    name,
    countryCode: 'BG',
  }
  citiesByName.set(name, city)
  cities.push(city)
  citiesBySearchValue.set(normalizeSearchValue(city.id), city)
  citiesBySearchValue.set(normalizeSearchValue(city.name), city)
  return city
}

function recordToTrip(record: RouteRecord): Trip {
  return {
    id: record.id,
    from: cityByName(record.fromCity),
    to: cityByName(record.toCity),
    departureTime: record.departureTime,
    arrivalTime: record.arrivalTime,
    durationMinutes: minutesBetween(record.departureTime, record.arrivalTime),
    operator,
    amenities: ['WIFI', 'POWER', 'AC', 'WC'],
    price: { amount: record.price, currency },
    seatsLeft: record.availableSeats,
  }
}

function buildStandardSeatMap(record: RouteRecord): Seat[] {
  const columns = ['A', 'B', 'C', 'D'] as const
  const seats: Seat[] = []
  let seatIndex = 0
  const occupiedSeats = Math.max(0, record.totalSeats - record.availableSeats)

  for (let row = 1; row <= record.totalSeats / columns.length; row++) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const label = `${row}${columns[columnIndex]}`
      seats.push({
        id: `${record.id}-${label}`,
        label,
        row,
        column: columnIndex + 1,
        status: seatIndex < occupiedSeats ? SeatStatus.Occupied : SeatStatus.Free,
      })
      seatIndex += 1
    }
  }

  return seats
}

function buildSeatMaps(records: RouteRecord[]) {
  return Object.fromEntries(records.map((record) => [record.id, buildStandardSeatMap(record)]))
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getPersistedSeatAvailability(): PersistedSeatAvailability | null {
  if (!canUseLocalStorage()) return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as PersistedSeatAvailability
    if (parsed.version !== 1 || !Array.isArray(parsed.routes)) return null
    return parsed
  } catch (error) {
    console.debug('[BusGo localDbApi] failed to read persisted seat availability', error)
    return null
  }
}

function persistSeatAvailability() {
  if (!canUseLocalStorage()) return

  const payload: PersistedSeatAvailability = {
    version: 1,
    routes: routeRecords.map((record) => {
      const seatMap = seatMapsByTripId[record.id] ?? []
      return {
        id: record.id,
        availableSeats: record.availableSeats,
        occupiedSeatIds: seatMap
          .filter((seat) => seat.status === SeatStatus.Occupied)
          .map((seat) => seat.id),
      }
    }),
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
    console.debug('[BusGo localDbApi] persisted seat availability', payload)
  } catch (error) {
    console.debug('[BusGo localDbApi] failed to persist seat availability', error)
  }
}

function hydrateSeatAvailability() {
  const persisted = getPersistedSeatAvailability()
  if (!persisted) return

  for (const routeState of persisted.routes) {
    const record = routeRecords.find((route) => route.id === routeState.id)
    const seatMap = seatMapsByTripId[routeState.id]
    if (!record || !seatMap) continue

    const occupiedSeatIds = new Set(routeState.occupiedSeatIds)
    for (const seat of seatMap) {
      seat.status = occupiedSeatIds.has(seat.id) ? SeatStatus.Occupied : SeatStatus.Free
    }

    updateAvailableSeats(routeState.id)
  }

  console.debug('[BusGo localDbApi] hydrated persisted seat availability', persisted)
}

function updateAvailableSeats(tripId: string) {
  const record = routeRecords.find((route) => route.id === tripId)
  const seatMap = seatMapsByTripId[tripId]
  if (!record || !seatMap) return

  record.availableSeats = seatMap.filter((seat) => seat.status === SeatStatus.Free).length
}

function occupySeats(tripId: string, seatIds: string[]): ApiResult<{ tripId: string; bookedSeatIds: string[] }> {
  const map = seatMapsByTripId[tripId]
  if (!map) return fail('Seat map not found', 404)

  const uniqueSeatIds = Array.from(new Set(seatIds)).filter(Boolean)
  if (uniqueSeatIds.length === 0) return fail('No seats selected', 422)

  const byId = new Map(map.map((seat) => [seat.id, seat]))
  for (const seatId of uniqueSeatIds) {
    const seat = byId.get(seatId)
    if (!seat) return fail(`Seat not found: ${seatId}`, 404)
    if (seat.status === SeatStatus.Occupied) return fail(`Seat already occupied: ${seat.label}`, 409)
  }

  for (const seatId of uniqueSeatIds) {
    byId.get(seatId)!.status = SeatStatus.Occupied
  }

  updateAvailableSeats(tripId)
  persistSeatAvailability()

  console.debug('[BusGo localDbApi] occupied seats', {
    tripId,
    seatIds: uniqueSeatIds,
    availableSeats: routeRecords.find((route) => route.id === tripId)?.availableSeats,
  })

  return ok({ tripId, bookedSeatIds: uniqueSeatIds })
}

function uniqueRoutes(): Route[] {
  const byPair = new Map<string, Route>()

  for (const record of routeRecords) {
    const key = routeKey(record.fromCity, record.toCity)
    if (byPair.has(key)) continue

    byPair.set(key, {
      id: `route-${cityByName(record.fromCity).id}-${cityByName(record.toCity).id}`,
      from: cityByName(record.fromCity),
      to: cityByName(record.toCity),
      distanceKm: record.distanceKm ?? distanceByRoute.get(key),
      estimatedDurationMinutes: minutesBetween(record.departureTime, record.arrivalTime),
    })
  }

  return Array.from(byPair.values())
}

function createRouteId(route: Pick<RouteRecord, 'fromCity' | 'toCity' | 'departureTime'>) {
  const departure = new Date(route.departureTime)
  const ymd = departure.toISOString().slice(0, 10).replaceAll('-', '')
  const hm = departure.toISOString().slice(11, 16).replace(':', '')
  const baseId = `bg-${slug(route.fromCity).slice(0, 12)}-${slug(route.toCity).slice(0, 12)}-${ymd}-${hm}`
  let candidate = baseId
  let suffix = 2

  while (routeRecords.some((item) => item.id === candidate)) {
    candidate = `${baseId}-${suffix}`
    suffix += 1
  }

  return candidate
}

function createRouteRecord(input: CreateRouteInput): ApiResult<Trip> {
  const fromCity = titleCase(input.fromCity)
  const toCity = titleCase(input.toCity)
  const departureMs = Date.parse(input.departureTime)
  const arrivalMs = Date.parse(input.arrivalTime)
  const price = Number(input.price)
  const totalSeats = Number(input.totalSeats)
  const distanceKm = input.distanceKm === undefined ? undefined : Number(input.distanceKm)

  if (!fromCity || !toCity) return fail('Origin and destination are required', 422)
  if (normalizeSearchValue(fromCity) === normalizeSearchValue(toCity)) {
    return fail('Origin and destination must be different', 422)
  }
  if (!Number.isFinite(departureMs) || !Number.isFinite(arrivalMs)) {
    return fail('Departure and arrival times are required', 422)
  }
  if (arrivalMs <= departureMs) return fail('Arrival must be after departure', 422)
  if (!Number.isFinite(price) || price <= 0) return fail('Price must be greater than zero', 422)
  if (!Number.isInteger(totalSeats) || totalSeats < 4 || totalSeats > 80 || totalSeats % 4 !== 0) {
    return fail('Total seats must be a multiple of 4 between 4 and 80', 422)
  }
  if (distanceKm !== undefined && (!Number.isFinite(distanceKm) || distanceKm <= 0)) {
    return fail('Distance must be greater than zero', 422)
  }

  const record: RouteRecord = {
    id: createRouteId({ fromCity, toCity, departureTime: input.departureTime }),
    fromCity,
    toCity,
    departureTime: input.departureTime,
    arrivalTime: input.arrivalTime,
    price: Math.round(price * 100) / 100,
    availableSeats: totalSeats,
    totalSeats,
    ...(distanceKm === undefined ? {} : { distanceKm: Math.round(distanceKm) }),
  }

  ensureCity(fromCity)
  ensureCity(toCity)
  routeRecords.push(record)
  seatMapsByTripId[record.id] = buildStandardSeatMap(record)
  return ok(recordToTrip(record))
}

function seatOccupancySummary(): SeatOccupancySummary[] {
  return routeRecords.map((record) => {
    const map = seatMapsByTripId[record.id] ?? []
    const occupiedSeats = map.filter((seat) => seat.status === SeatStatus.Occupied).length
    const totalSeats = record.totalSeats
    const freeSeats = Math.max(0, totalSeats - occupiedSeats)

    return {
      tripId: record.id,
      route: `${record.fromCity} - ${record.toCity}`,
      departureTime: record.departureTime,
      totalSeats,
      occupiedSeats,
      freeSeats,
      occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
    }
  })
}

export const localDbApi: ApiClient = {
  cities: {
    async list() {
      await sleep(80)
      return ok(clone(cities))
    },
  },
  routes: {
    async list() {
      await sleep(100)
      return ok(uniqueRoutes())
    },
    async adminList() {
      await sleep(100)
      return ok(clone(routeRecords) as AdminRouteRecord[])
    },
    async create(input: CreateRouteInput) {
      await sleep(180)
      return createRouteRecord(input)
    },
  },
  trips: {
    async search(params: SearchTripsParams) {
      await sleep(120)
      const fromCity = resolveSearchCity(params.fromCityId)
      const toCity = resolveSearchCity(params.toCityId)

      if (!fromCity || !toCity) {
        console.debug('[BusGo localDbApi.trips.search] city resolution failed', {
          input: params,
          normalized: {
            from: normalizeSearchValue(params.fromCityId),
            to: normalizeSearchValue(params.toCityId),
          },
          resolved: {
            from: fromCity?.name ?? null,
            to: toCity?.name ?? null,
          },
        })
        return ok([])
      }

      const directMatches = routeRecords.filter((record) => {
          return (
            normalizeSearchValue(record.fromCity) === normalizeSearchValue(fromCity.name) &&
            normalizeSearchValue(record.toCity) === normalizeSearchValue(toCity.name)
          )
        })
      const dateMatches = directMatches.filter((record) => localDatePart(record.departureTime) === params.date)
      const filtered = (dateMatches.length > 0 ? dateMatches : directMatches)
        .map(recordToTrip)

      console.debug('[BusGo localDbApi.trips.search] results', {
        input: params,
        resolved: {
          fromCity: fromCity.name,
          toCity: toCity.name,
        },
        matchCount: filtered.length,
        routeIds: filtered.map((trip) => trip.id),
      })

      return ok(filtered)
    },
    async byId(tripId: string) {
      await sleep(100)
      const record = routeRecords.find((route) => route.id === tripId)
      if (!record) return fail('Trip not found', 404)
      return ok(recordToTrip(record))
    },
  },
  seats: {
    async availabilityByTrip(tripId: string) {
      await sleep(120)
      const record = routeRecords.find((route) => route.id === tripId)
      if (!record) return fail('Trip not found', 404)

      const map = seatMapsByTripId[tripId]
      if (!map) return fail('Seat map not found', 404)

      const res: SeatAvailability = {
        tripId,
        updatedAt: new Date().toISOString(),
        seats: clone(map),
      }
      return ok(res)
    },
    async occupancySummary() {
      await sleep(120)
      return ok(seatOccupancySummary())
    },
    async book(input: BookSeatsInput) {
      await sleep(180)
      return occupySeats(input.tripId, input.seatIds)
    },
  },
  bookings: {
    async list() {
      await sleep(100)
      return ok(clone(bookings))
    },
    async create(input: CreateBookingInput) {
      await sleep(180)
      const record = routeRecords.find((route) => route.id === input.tripId)
      if (!record) return fail('Trip not found', 404)

      const occupiedSeats = occupySeats(input.tripId, input.seatIds)
      if (!occupiedSeats.ok) {
        return fail(occupiedSeats.error.message, occupiedSeats.error.status)
      }

      const trip = recordToTrip(record)
      const passengers = input.passengers.map((passenger, index) => ({
        id: `p-${Date.now()}-${index}`,
        ...passenger,
      }))
      const totalAmount = occupiedSeats.data.bookedSeatIds.length * trip.price.amount

      const booking: Booking = {
        id: `b-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'CONFIRMED',
        trip,
        seatIds: occupiedSeats.data.bookedSeatIds,
        passengers,
        total: { amount: Math.round(totalAmount * 100) / 100, currency: trip.price.currency },
        paymentMethod: input.paymentMethod,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      }

      bookings.unshift(booking)
      return ok(clone(booking))
    },
    async byId(bookingId: string) {
      await sleep(100)
      const booking = bookings.find((item) => item.id === bookingId)
      if (!booking) return fail('Booking not found', 404)
      return ok(clone(booking))
    },
  },
  payments: {
    async pay(input: PayInput) {
      await sleep(180)
      const booking = bookings.find((item) => item.id === input.bookingId)
      if (!booking) return fail('Booking not found', 404)

      const payment: Payment = {
        id: `pay-${Date.now()}`,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
        status: PaymentStatus.Succeeded,
        method: input.method,
        amount: booking.total,
        provider: input.method === 'CARD' ? 'LocalCard' : 'Cash',
        providerPaymentId: input.method === 'CARD' ? `local_${Date.now()}` : undefined,
      }

      return ok(payment)
    },
  },
}
