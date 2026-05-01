import type { City } from '@/entities/location/types'
import type { ID, ISODateTime, Money } from '@/shared/types/common'

export type Amenity = 'WIFI' | 'POWER' | 'AC' | 'WC'

export type Operator = {
  id: ID
  name: string
}

export type Trip = {
  id: ID
  from: City
  to: City
  departureTime: ISODateTime
  arrivalTime: ISODateTime
  durationMinutes: number
  operator: Operator
  amenities: Amenity[]
  price: Money
  seatsLeft: number
}

