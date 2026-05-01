import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useSearchTripsQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { SearchForm } from '@/features/search-trips/ui/SearchForm'
import { TripsList } from '@/features/search-trips/ui/TripsList'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { todayYmd } from '@/shared/lib/format'

export function SearchResultsPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const { actions } = useBookingStore()

  const params = useMemo(() => {
    const fromCityId = sp.get('from') ?? 'sof'
    const toCityId = sp.get('to') ?? 'pld'
    const date = sp.get('date') ?? todayYmd()
    const passengers = parsePassengers(sp.get('passengers'))
    return { fromCityId, toCityId, date, passengers }
  }, [sp])

  const enabled = Boolean(params.fromCityId && params.toCityId && params.date)
  const query = useSearchTripsQuery(params, enabled)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Search results</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pick route, date and passengers. Select a trip to choose seats.
        </p>
      </div>

      <SearchForm compact />

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading trips…</div>
        </Card>
      ) : query.isError ? (
        <Card className="p-6">
          <div className="text-sm text-rose-300">Failed to load trips.</div>
        </Card>
      ) : (
        <TripsList
          trips={query.data ?? []}
          onSelect={(tripId) => {
            actions.setTripId(tripId)
            navigate(routes.seatSelection(tripId))
          }}
        />
      )}
    </div>
  )
}

