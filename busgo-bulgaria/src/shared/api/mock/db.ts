import type { Booking } from '@/entities/booking/types'
import type { City } from '@/entities/location/types'
import type { Route } from '@/entities/route/types'
import { SeatStatus, type Seat } from '@/entities/seat/types'
import type { Trip } from '@/entities/trip/types'

export const cities: City[] = [
  { id: 'sof', name: 'Sofia', countryCode: 'BG' },
  { id: 'pld', name: 'Plovdiv', countryCode: 'BG' },
  { id: 'var', name: 'Varna', countryCode: 'BG' },
  { id: 'bgs', name: 'Burgas', countryCode: 'BG' },
  { id: 'rse', name: 'Ruse', countryCode: 'BG' },
  { id: 'vtr', name: 'Veliko Tarnovo', countryCode: 'BG' },
]

const operator = { id: 'op-1', name: 'BusGo' }

export const trips: Trip[] = [
  {
    id: 't-1001',
    from: cities[0],
    to: cities[1],
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 150,
    operator,
    amenities: ['WIFI', 'AC', 'WC'],
    price: { amount: 24.9, currency: 'BGN' },
    seatsLeft: 18,
  },
  {
    id: 't-1002',
    from: cities[0],
    to: cities[2],
    departureTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 390,
    operator,
    amenities: ['WIFI', 'POWER', 'AC', 'WC'],
    price: { amount: 39.9, currency: 'BGN' },
    seatsLeft: 9,
  },
  {
    id: 't-1003',
    from: cities[1],
    to: cities[3],
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 240,
    operator,
    amenities: ['AC', 'WC'],
    price: { amount: 29.9, currency: 'BGN' },
    seatsLeft: 22,
  },
]

export const routes: Route[] = [
  {
    id: 'r-sof-pld',
    from: cities[0],
    to: cities[1],
    distanceKm: 146,
    estimatedDurationMinutes: 150,
  },
  {
    id: 'r-sof-var',
    from: cities[0],
    to: cities[2],
    distanceKm: 470,
    estimatedDurationMinutes: 390,
  },
  {
    id: 'r-pld-bgs',
    from: cities[1],
    to: cities[3],
    distanceKm: 253,
    estimatedDurationMinutes: 240,
  },
]

function buildStandardSeatMap(prefix: string): Seat[] {
  // 10 rows, 4 columns (2+2) => 40 seats
  const cols = ['A', 'B', 'C', 'D'] as const
  const seats: Seat[] = []
  for (let row = 1; row <= 10; row++) {
    for (let colIdx = 0; colIdx < cols.length; colIdx++) {
      const label = `${row}${cols[colIdx]}`
      seats.push({
        id: `${prefix}-${label}`,
        label,
        row,
        column: colIdx + 1,
        status: SeatStatus.Free,
      })
    }
  }
  return seats
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function bookingTrip(
  id: string,
  fromIdx: number,
  toIdx: number,
  departureOffsetHours: number,
  durationMinutes: number,
  priceAmount: number,
): Trip {
  return {
    id,
    from: cities[fromIdx],
    to: cities[toIdx],
    departureTime: hoursFromNow(departureOffsetHours),
    arrivalTime: hoursFromNow(departureOffsetHours + durationMinutes / 60),
    durationMinutes,
    operator,
    amenities: ['WIFI', 'AC'],
    price: { amount: priceAmount, currency: 'BGN' },
    seatsLeft: 14,
  }
}

// Stateful availability per trip (in-memory).
export const seatMapsByTripId: Record<string, Seat[]> = {
  't-1001': buildStandardSeatMap('s-t-1001'),
  't-1002': buildStandardSeatMap('s-t-1002'),
  't-1003': buildStandardSeatMap('s-t-1003'),
}

// Seed a few occupied seats for realism
seatMapsByTripId['t-1001']?.forEach((s) => {
  if (['1A', '1B', '3C', '7D'].includes(s.label)) s.status = SeatStatus.Occupied
})
seatMapsByTripId['t-1002']?.forEach((s) => {
  if (['2A', '2B', '2C', '5D', '9A'].includes(s.label)) s.status = SeatStatus.Occupied
})

export const bookings: Booking[] = [
  {
    id: 'b-demo-upcoming-1',
    createdAt: hoursFromNow(-48),
    status: 'CONFIRMED',
    trip: bookingTrip('t-demo-upcoming-1', 0, 2, 26, 390, 39.9),
    seatIds: ['s-t-demo-upcoming-1-4A', 's-t-demo-upcoming-1-4B'],
    passengers: [
      { id: 'p-demo-upcoming-1-1', firstName: 'Nikolay', lastName: 'Ivanov', type: 'ADULT' },
      { id: 'p-demo-upcoming-1-2', firstName: 'Maria', lastName: 'Ivanova', type: 'ADULT' },
    ],
    total: { amount: 79.8, currency: 'BGN' },
    paymentMethod: 'CARD',
    contactEmail: 'nikolay@example.com',
    contactPhone: '+359888123456',
  },
  {
    id: 'b-demo-upcoming-2',
    createdAt: hoursFromNow(-5),
    status: 'PENDING',
    trip: bookingTrip('t-demo-upcoming-2', 1, 3, 74, 240, 29.9),
    seatIds: ['s-t-demo-upcoming-2-7C'],
    passengers: [
      { id: 'p-demo-upcoming-2-1', firstName: 'Elena', lastName: 'Petrova', type: 'ADULT' },
    ],
    total: { amount: 29.9, currency: 'BGN' },
    paymentMethod: 'CASH_ON_BOARD',
    contactEmail: 'elena@example.com',
    contactPhone: '+359887654321',
  },
  {
    id: 'b-demo-past-1',
    createdAt: hoursFromNow(-260),
    status: 'CONFIRMED',
    trip: bookingTrip('t-demo-past-1', 0, 1, -120, 150, 24.9),
    seatIds: ['s-t-demo-past-1-2D'],
    passengers: [
      { id: 'p-demo-past-1-1', firstName: 'Georgi', lastName: 'Dimitrov', type: 'SENIOR' },
    ],
    total: { amount: 24.9, currency: 'BGN' },
    paymentMethod: 'CARD',
    contactEmail: 'georgi@example.com',
    contactPhone: '+359886111222',
  },
]
