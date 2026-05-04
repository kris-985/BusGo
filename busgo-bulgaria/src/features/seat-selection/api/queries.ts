import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/apiClient'

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
      if (!res.ok) throw new Error(res.error.message)
      return res.data
    },
  })
}
