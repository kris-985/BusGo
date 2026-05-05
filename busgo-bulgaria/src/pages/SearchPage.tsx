import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useSearchTripsQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { SearchForm } from '@/features/search-trips/ui/SearchForm'
import { RouteSearchSkeleton, TripsList } from '@/features/search-trips/ui/TripsList'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Card } from '@/shared/components/ui/Card'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { todayYmd } from '@/shared/lib/format'

function cleanSearchValue(value: string | null, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export function SearchPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const { actions } = useBookingStore()

  const params = useMemo(() => {
    const fromCityId = cleanSearchValue(sp.get('from'), 'Sofia')
    const toCityId = cleanSearchValue(sp.get('to'), 'Plovdiv')
    const date = cleanSearchValue(sp.get('date'), todayYmd())
    const passengers = parsePassengers(sp.get('passengers'))
    const nextParams = { fromCityId, toCityId, date, passengers }
    console.debug('[BusGo SearchPage] search params', nextParams)
    return nextParams
  }, [sp])

  const enabled = Boolean(params.fromCityId && params.toCityId && params.date)
  const query = useSearchTripsQuery(params, enabled)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Search trips
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick route, date and passengers. Select a trip to proceed to checkout.
        </p>
      </div>

      <SearchForm key={sp.toString()} compact />

      {query.isLoading ? (
        <RouteSearchSkeleton />
      ) : query.isError ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(query.error, 'We could not load trips. Please try again.')}
          </div>
        </Card>
      ) : (
        <TripsList
          trips={query.data ?? []}
          onSelect={(tripId) => {
            actions.setTripId(tripId)
            navigate(routes.trip(tripId))
          }}
        />
      )}
    </div>
  )
}
