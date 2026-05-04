import { useQuery } from '@tanstack/react-query'

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
