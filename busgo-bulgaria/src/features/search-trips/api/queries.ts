import { useQuery } from '@tanstack/react-query'

import type { SearchTripsParams } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { throwApiError } from '@/shared/api/errors'

export const searchTripsKeys = {
  all: ['trips'] as const,
  search: (params: SearchTripsParams) => [...searchTripsKeys.all, 'search', params] as const,
  byId: (tripId: string, travelDate?: string) => [...searchTripsKeys.all, 'byId', tripId, travelDate ?? ''] as const,
}

export const citiesKeys = {
  all: ['cities'] as const,
}

export function useCitiesQuery() {
  return useQuery({
    queryKey: citiesKeys.all,
    queryFn: async () => {
      const res = await apiClient.cities.list()
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}

export function useSearchTripsQuery(params: SearchTripsParams, enabled: boolean) {
  return useQuery({
    queryKey: searchTripsKeys.search(params),
    enabled,
    queryFn: async () => {
      const res = await apiClient.trips.search(params)
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}

export function useTripByIdQuery(tripId: string, enabled: boolean, travelDate?: string) {
  return useQuery({
    queryKey: searchTripsKeys.byId(tripId, travelDate),
    enabled,
    queryFn: async () => {
      const res = await apiClient.trips.byId(tripId, travelDate)
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}
