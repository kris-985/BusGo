import type { ID } from '@/shared/types/common'

export const SeatStatus = {
  Free: 'FREE',
  Occupied: 'OCCUPIED',
  Selected: 'SELECTED',
} as const

export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus]

export interface Seat {
  id: ID
  label: string // e.g. "12A"
  row: number
  column: number
  status: SeatStatus
}

