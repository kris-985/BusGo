import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { SeatStatus } from '@/entities/seat/types'
import { useAuth } from '@/features/auth/model/authContext'
import { useSeatAvailabilityByTripQuery } from '@/features/seat-selection/api/queries'
import { useSeatSelectionStore, useSelectedSeatIds } from '@/features/seat-selection/model/useSeatSelectionStore'
import { useTripByIdQuery } from '@/features/search-trips/api/queries'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export function SeatSelectionPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const [searchParams] = useSearchParams()
  const id = tripId ?? ''
  const travelDate = searchParams.get('date')?.trim() || undefined
  const query = useTripByIdQuery(id, Boolean(id), travelDate)
  const { actions } = useBookingStore()
  const seatActions = useSeatSelectionStore((s) => s.actions)
  const selectedSeatIds = useSelectedSeatIds(id)
  const availabilityQuery = useSeatAvailabilityByTripQuery(id, Boolean(id))

  const trip = query.data

  const title = useMemo(() => {
    if (!trip) return 'Seat selection'
    return `${trip.from.name} to ${trip.to.name}`
  }, [trip])

  const derived = useMemo(() => {
    const availability = availabilityQuery.data
    const serverSeats = availability?.seats ?? []
    const occupiedIds = new Set(
      serverSeats.filter((s) => s.status === SeatStatus.Occupied).map((s) => s.id),
    )
    const validSelectedSeatIds = selectedSeatIds.filter((seatId) => !occupiedIds.has(seatId))
    const blockedSelectedSeatIds = selectedSeatIds.filter((seatId) => occupiedIds.has(seatId))
    const freeCount = serverSeats.filter((s) => s.status === SeatStatus.Free).length
    const remainingFreeAfterSelection = Math.max(0, freeCount - validSelectedSeatIds.length)
    const noSeatsAvailable = serverSeats.length > 0 && freeCount === 0
    return {
      serverSeats,
      occupiedIds,
      freeCount,
      remainingFreeAfterSelection,
      validSelectedSeatIds,
      blockedSelectedSeatIds,
      noSeatsAvailable,
    }
  }, [availabilityQuery.data, selectedSeatIds])

  useEffect(() => {
    if (!availabilityQuery.data) return
    if (derived.blockedSelectedSeatIds.length === 0) return

    seatActions.setSeats(id, derived.validSelectedSeatIds)
  }, [
    availabilityQuery.data,
    derived.blockedSelectedSeatIds.length,
    derived.validSelectedSeatIds,
    id,
    seatActions,
  ])

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Live seat map
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Choose seats from the synchronized coach map, then continue to passenger details and payment.
          </p>
        </div>
        <Link
          to={routes.searchResults()}
          className="mt-4 inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
        >
          Back to results
        </Link>
      </div>

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-700">Loading trip...</div>
        </Card>
      ) : query.isError || !trip ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(query.error, 'We could not load this trip. Please try again.')}
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden p-0 lg:col-span-2">
            <div className="border-b border-slate-100 bg-slate-50/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-500">Route</div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {trip.from.name} to {trip.to.name}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {formatDate(trip.departureTime)} - {formatTime(trip.departureTime)} to {formatTime(trip.arrivalTime)}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-800">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  {availabilityQuery.isFetching ? 'Syncing seats...' : 'Live seat updates'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-slate-600">Selected</div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">{derived.validSelectedSeatIds.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs text-slate-600">Remaining</div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {availabilityQuery.isLoading ? '-' : derived.remainingFreeAfterSelection}
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="px-6 pt-5 flex flex-wrap gap-3 text-xs text-slate-700">
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

            <div className="p-6 pt-5">
              {derived.blockedSelectedSeatIds.length > 0 ? (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800">
                  A selected seat was just taken and has been removed from your selection.
                </div>
              ) : null}

              {availabilityQuery.isLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-6">
                  <Spinner />
                  <div className="text-sm text-slate-700">Loading seats...</div>
                </div>
              ) : availabilityQuery.isError || !availabilityQuery.data ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
                  {getUserFriendlyErrorMessage(
                    availabilityQuery.error,
                    'We could not load seat availability. Please try again.',
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-xl rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-inner">
                  {derived.noSeatsAvailable ? (
                    <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
                      No seats are available for this trip. Please choose another departure.
                    </div>
                  ) : null}

                  <div className="mb-3 flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Front of bus
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {derived.serverSeats.map((seat) => {
                      const isOccupied = seat.status === SeatStatus.Occupied
                      const isSelected = selectedSeatIds.includes(seat.id)
                      const canToggle = !isOccupied

                      const seatClass = cn(
                        'h-11 rounded-xl text-sm font-black transition-colors',
                        'ring-1 ring-inset',
                        isOccupied
                          ? 'cursor-not-allowed bg-rose-500/20 text-rose-100 ring-rose-400/30'
                          : isSelected
                            ? 'bg-cyan-400 text-slate-950 ring-cyan-200 hover:bg-cyan-300'
                            : 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30 hover:bg-emerald-400/25',
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

                  <div className="mt-3 flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Rear of bus
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-slate-500">Price per seat</div>
            <div className="mt-1 text-3xl font-black text-slate-950">{formatMoney(trip.price)}</div>
            <div className="mt-2 text-sm text-slate-600">Seats left: {trip.seatsLeft}</div>
            {derived.noSeatsAvailable ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
                This trip is fully booked.
              </div>
            ) : null}
            {!auth.isAuthenticated ? (
              <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-800">
                Login or create an account to continue to checkout and buy tickets.
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              {auth.isAuthenticated ? (
                <Button
                  className="w-full"
                  disabled={derived.validSelectedSeatIds.length === 0}
                  onClick={() => {
                    if (derived.validSelectedSeatIds.length === 0) return
                    actions.setTripId(trip.id)
                    actions.setTravelDate(travelDate ?? null)
                    actions.setSelectedSeatIds(derived.validSelectedSeatIds)
                    navigate(routes.checkout())
                  }}
                >
                  Continue to checkout
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    if (derived.validSelectedSeatIds.length > 0) {
                      actions.setTripId(trip.id)
                      actions.setTravelDate(travelDate ?? null)
                      actions.setSelectedSeatIds(derived.validSelectedSeatIds)
                    }
                    navigate(routes.auth(), { state: { from: location } })
                  }}
                >
                  Login to buy ticket
                </Button>
              )}
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
              Select at least one seat to continue. Your selection is saved locally until checkout.
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

