import { useMutation, useQuery } from '@tanstack/react-query'

import type { CreateBookingInput } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'

export const bookingKeys = {
  all: ['bookings'] as const,
  list: () => [...bookingKeys.all, 'list'] as const,
  byId: (bookingId: string) => [...bookingKeys.all, 'byId', bookingId] as const,
}

export function useBookingsQuery() {
  return useQuery({
    queryKey: bookingKeys.list(),
    queryFn: async () => {
      const res = await apiClient.bookings.list()
      if (!res.ok) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useCreateBookingMutation() {
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const res = await apiClient.bookings.create(input)
      if (!res.ok) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useBookingByIdQuery(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: bookingKeys.byId(bookingId),
    enabled,
    queryFn: async () => {
      const res = await apiClient.bookings.byId(bookingId)
      if (!res.ok) throw new Error(res.error.message)
      return res.data
    },
  })
}
