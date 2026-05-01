import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { SeatStatus } from '@/entities/seat/types'
import { useSeatAvailabilityByTripQuery } from '@/features/seat-selection/api/queries'
import { useSeatSelectionStore, useSelectedSeatIds } from '@/features/seat-selection/model/useSeatSelectionStore'
import { useTripByIdQuery } from '@/features/search-trips/api/queries'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export function SeatSelectionPage() {
  const navigate = useNavigate()
  const { tripId } = useParams()
  const id = tripId ?? ''
  const query = useTripByIdQuery(id, Boolean(id))
  const { actions } = useBookingStore()
  const seatActions = useSeatSelectionStore((s) => s.actions)
  const selectedSeatIds = useSelectedSeatIds(id)
  const availabilityQuery = useSeatAvailabilityByTripQuery(id, Boolean(id))

  const trip = query.data

  const title = useMemo(() => {
    if (!trip) return 'Seat selection'
    return `${trip.from.name} → ${trip.to.name}`
  }, [trip])

  const derived = useMemo(() => {
    const availability = availabilityQuery.data
    const serverSeats = availability?.seats ?? []
    const occupiedIds = new Set(
      serverSeats.filter((s) => s.status === SeatStatus.Occupied).map((s) => s.id),
    )
    const freeCount = serverSeats.filter((s) => s.status === SeatStatus.Free).length
    const remainingFreeAfterSelection = Math.max(0, freeCount - selectedSeatIds.length)
    return { serverSeats, occupiedIds, freeCount, remainingFreeAfterSelection }
  }, [availabilityQuery.data, selectedSeatIds.length])

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Seat selection is simplified in this demo. Continue to checkout to enter passengers.
          </p>
        </div>
        <Link
          to={routes.searchResults()}
          className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
        >
          Back to results
        </Link>
      </div>

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading trip…</div>
        </Card>
      ) : query.isError || !trip ? (
        <Card className="p-6">
          <div className="text-sm text-rose-300">Trip not found.</div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-400">Route</div>
                <div className="mt-1 text-lg font-semibold text-slate-100">
                  {trip.from.name} → {trip.to.name}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {formatDate(trip.departureTime)} • {formatTime(trip.departureTime)}–{formatTime(trip.arrivalTime)}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                  <div className="text-xs text-slate-400">Selected</div>
                  <div className="mt-0.5 font-medium text-slate-100">{selectedSeatIds.length}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                  <div className="text-xs text-slate-400">Remaining</div>
                  <div className="mt-0.5 font-medium text-slate-100">
                    {availabilityQuery.isLoading ? '—' : derived.remainingFreeAfterSelection}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-500/80 ring-1 ring-emerald-300/40" />
                Free
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-rose-500/80 ring-1 ring-rose-300/40" />
                Occupied
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-sky-500/80 ring-1 ring-sky-300/40" />
                Selected
              </div>
            </div>

            <div className="mt-5">
              {availabilityQuery.isLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
                  <Spinner />
                  <div className="text-sm text-slate-300">Loading seats…</div>
                </div>
              ) : availabilityQuery.isError || !availabilityQuery.data ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Failed to load seat availability.
                </div>
              ) : (
                <div className="mx-auto max-w-xl">
                  <div className="mb-3 flex items-center justify-center text-xs text-slate-400">
                    Front of bus
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {derived.serverSeats.map((seat) => {
                      const isOccupied = seat.status === SeatStatus.Occupied
                      const isSelected = selectedSeatIds.includes(seat.id)
                      const canToggle = !isOccupied

                      const seatClass = cn(
                        'h-10 rounded-xl text-sm font-semibold transition-colors',
                        'ring-1 ring-inset',
                        isOccupied
                          ? 'cursor-not-allowed bg-rose-500/15 text-rose-200 ring-rose-400/30'
                          : isSelected
                            ? 'bg-sky-500/20 text-sky-100 ring-sky-400/40 hover:bg-sky-500/25'
                            : 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30 hover:bg-emerald-500/20',
                      )

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={!canToggle}
                          className={seatClass}
                          onClick={() => {
                            if (!canToggle) return
                            seatActions.toggleSeat(id, seat.id)
                          }}
                          title={isOccupied ? `${seat.label} (occupied)` : seat.label}
                        >
                          {seat.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-center text-xs text-slate-500">
                    Rear of bus
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-slate-400">Price</div>
            <div className="mt-1 text-2xl font-semibold text-slate-100">{formatMoney(trip.price)}</div>
            <div className="mt-2 text-sm text-slate-400">Seats left: {trip.seatsLeft}</div>

            <div className="mt-6 grid gap-3">
              <Button
                className="w-full"
                disabled={selectedSeatIds.length === 0}
                onClick={() => {
                  actions.setTripId(trip.id)
                  navigate(routes.checkout())
                }}
              >
                Continue to checkout
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                disabled={selectedSeatIds.length === 0}
                onClick={() => seatActions.clearTrip(id)}
              >
                Clear selection
              </Button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Seats are stored locally via Zustand. Occupied seats come from the mock API.
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

