import type { ID, ISODateTime } from '@/shared/types/common'

export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: ID
  createdAt: ISODateTime
  email: string
  phone?: string
  firstName: string
  lastName: string
  role: UserRole
}

