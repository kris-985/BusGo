import type { Booking } from '@/entities/booking/types'
import type { City } from '@/entities/location/types'
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

export const bookings: Booking[] = []

