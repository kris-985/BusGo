import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useSearchTripsQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { SearchForm } from '@/features/search-trips/ui/SearchForm'
import { NoRoutesEmptyState, RouteSearchSkeleton } from '@/features/search-trips/ui/TripsList'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatMoney, formatTime, todayYmd } from '@/shared/lib/format'

function cleanSearchValue(value: string | null, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export function SearchResultsPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const { actions } = useBookingStore()

  const params = useMemo(() => {
    const fromCityId = cleanSearchValue(sp.get('from'), 'Sofia')
    const toCityId = cleanSearchValue(sp.get('to'), 'Plovdiv')
    const date = cleanSearchValue(sp.get('date'), todayYmd())
    const passengers = parsePassengers(sp.get('passengers'))
    const nextParams = { fromCityId, toCityId, date, passengers }
    console.debug('[BusGo SearchResultsPage] search params', nextParams)
    return nextParams
  }, [sp])

  const enabled = Boolean(params.fromCityId && params.toCityId && params.date)
  const query = useSearchTripsQuery(params, enabled)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Search results</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick route, date and passengers. Select a trip to choose seats.
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
        <div className="grid gap-3">
          {(query.data ?? []).length === 0 ? (
            <NoRoutesEmptyState />
          ) : (
            (query.data ?? []).map((trip) => (
              <Card key={trip.id} className="p-5">
                <div className="grid gap-4 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-6">
                    <div className="text-sm text-slate-600">Time</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <div className="text-lg font-semibold text-slate-950">
                        {formatTime(trip.departureTime)}
                      </div>
                      <div className="text-sm text-slate-600">→</div>
                      <div className="text-lg font-semibold text-slate-950">
                        {formatTime(trip.arrivalTime)}
                      </div>
                      <div className="text-sm text-slate-600">
                        • {trip.from.name} → {trip.to.name}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-sm text-slate-600">Price</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950">
                      {formatMoney(trip.price)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-slate-600">Available seats</div>
                    <div className="mt-1 text-sm font-medium text-slate-950">{trip.seatsLeft}</div>
                  </div>

                  <div className="md:col-span-1 md:flex md:justify-end">
                    <Button
                      size="sm"
                      className="w-full md:w-auto"
                      onClick={() => {
                        actions.setTripId(trip.id)
                        navigate(routes.seatSelection(trip.id))
                      }}
                    >
                      Select seats
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
