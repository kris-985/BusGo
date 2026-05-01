import type { ID } from '@/shared/types/common'

export type PassengerType = 'ADULT' | 'CHILD' | 'SENIOR'

export type Passenger = {
  id: ID
  firstName: string
  lastName: string
  type: PassengerType
}

export type ContactDetails = {
  email: string
  phone: string
}

