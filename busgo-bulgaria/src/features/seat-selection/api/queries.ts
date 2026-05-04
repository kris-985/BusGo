import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/apiClient'
import { throwApiError } from '@/shared/api/errors'

export const seatKeys = {
  all: ['seats'] as const,
  availabilityByTrip: (tripId: string) => [...seatKeys.all, 'availabilityByTrip', tripId] as const,
}

export function useSeatAvailabilityByTripQuery(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: seatKeys.availabilityByTrip(tripId),
    enabled,
    refetchInterval: enabled ? 3500 : false,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await apiClient.seats.availabilityByTrip(tripId)
      if (!res.ok) throwApiError(res.error)
      return res.data
    },
  })
}
