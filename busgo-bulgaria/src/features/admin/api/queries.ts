import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateRouteInput } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { throwApiError } from '@/shared/api/errors'

export const adminKeys = {
  all: ['admin'] as const,
  routes: () => [...adminKeys.all, 'routes'] as const,
  seatOccupancy: () => [...adminKeys.all, 'seatOccupancy'] as const,
}

export function useAdminRoutesQuery() {
  return useQuery({
    queryKey: adminKeys.routes(),
    queryFn: async () => {
      const res = await apiClient.routes.list()
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}

export function useSeatOccupancySummaryQuery() {
  return useQuery({
    queryKey: adminKeys.seatOccupancy(),
    refetchInterval: 3500,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await apiClient.seats.occupancySummary()
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}

export function useCreateRouteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRouteInput) => {
      const res = await apiClient.routes.create(input)
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.routes() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.seatOccupancy() })
      void queryClient.invalidateQueries({ queryKey: ['cities'] })
      void queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
