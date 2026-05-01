import type { Seat } from '@/entities/seat/types'
import type { ID } from '@/shared/types/common'

export type BusAmenity = 'WIFI' | 'POWER' | 'AC' | 'WC'

export interface Bus {
  id: ID
  operatorId: ID
  label: string // e.g. "BusGo Express"
  registrationNumber?: string
  model?: string
  amenities?: BusAmenity[]
  seats: Seat[]
}

