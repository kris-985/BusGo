import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { useSearchTripsQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { SearchForm } from '@/features/search-trips/ui/SearchForm'
import { NoRoutesEmptyState, RouteSearchSkeleton } from '@/features/search-trips/ui/TripsList'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatDate, formatMoney, formatTime, todayYmd } from '@/shared/lib/format'

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
    return { fromCityId, toCityId, date, passengers }
  }, [sp])

  const enabled = Boolean(params.fromCityId && params.toCityId && params.date)
  const query = useSearchTripsQuery(params, enabled)

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Route search
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Search results</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {params.fromCityId} to {params.toCityId} on {params.date} for {params.passengers} passenger{params.passengers === 1 ? '' : 's'}.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-slate-300">Matches</div>
              <div className="mt-1 text-2xl font-black">{query.data?.length ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-slate-300">Date</div>
              <div className="mt-1 font-black">{params.date}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div className="text-slate-300">Seats</div>
              <div className="mt-1 text-2xl font-black">{params.passengers}</div>
            </div>
          </div>
        </div>
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
        <div className="grid gap-4">
          {(query.data ?? []).length === 0 ? (
            <NoRoutesEmptyState />
          ) : (
            (query.data ?? []).map((trip) => (
              <Card key={trip.id} className="overflow-hidden p-0 transition-transform hover:-translate-y-0.5">
                <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <span>{formatDate(trip.departureTime)}</span>
                      <span className="h-1 w-1 rounded-full bg-cyan-500" />
                      <span>{trip.operator.name}</span>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-12 md:items-center">
                      <div className="md:col-span-6">
                        <div className="text-sm text-slate-500">Route and time</div>
                        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <div className="text-2xl font-black text-slate-950">{formatTime(trip.departureTime)}</div>
                          <div className="text-sm font-semibold text-slate-400">to</div>
                          <div className="text-2xl font-black text-slate-950">{formatTime(trip.arrivalTime)}</div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-700">
                          {trip.from.name} to {trip.to.name}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <div className="text-sm text-slate-500">Duration</div>
                        <div className="mt-2 text-lg font-black text-slate-950">
                          {Math.floor(trip.durationMinutes / 60)}h {trip.durationMinutes % 60}m
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <div className="text-sm text-slate-500">Available seats</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-lg font-black text-slate-950">{trip.seatsLeft}</div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-cyan-500"
                              style={{ width: `${Math.min(100, (trip.seatsLeft / 40) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {trip.amenities.map((amenity) => (
                        <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
                    <div className="text-sm text-slate-500">Total from</div>
                    <div className="mt-1 text-3xl font-black text-slate-950">{formatMoney(trip.price)}</div>
                    <div className="mt-2 text-sm text-slate-600">per passenger, taxes included</div>
                    <Button
                      className="mt-5 w-full"
                      onClick={() => {
                        actions.setTripId(trip.id)
                        navigate(routes.seatSelection(trip.id, params.date))
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
