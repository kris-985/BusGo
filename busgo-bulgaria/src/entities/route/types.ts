import type { City } from '@/entities/location/types'
import type { ID } from '@/shared/types/common'

export type RouteStop = {
  city: City
  order: number
}

export interface Route {
  id: ID
  from: City
  to: City
  stops?: RouteStop[]
  distanceKm?: number
  estimatedDurationMinutes?: number
}

