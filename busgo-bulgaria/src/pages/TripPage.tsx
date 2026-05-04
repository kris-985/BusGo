import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useTripByIdQuery } from '@/features/search-trips/api/queries'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export function TripPage() {
  const navigate = useNavigate()
  const { tripId } = useParams()
  const id = tripId ?? ''
  const query = useTripByIdQuery(id, Boolean(id))
  const { actions } = useBookingStore()

  const trip = query.data

  const title = useMemo(() => {
    if (!trip) return 'Trip'
    return `${trip.from.name} → ${trip.to.name}`
  }, [trip])

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">Review details and proceed to checkout.</p>
        </div>
        <Link
          to={routes.search()}
          className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
        >
          Back to search
        </Link>
      </div>

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading trip…</div>
        </Card>
      ) : query.isError || !trip ? (
        <Card className="p-6">
          <div className="text-sm text-rose-300">
            {getUserFriendlyErrorMessage(query.error, 'We could not load this trip. Please try again.')}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm text-slate-400">Route</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {trip.from.name} → {trip.to.name}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-slate-400">Departure</div>
                  <div className="mt-1 text-sm text-slate-100">
                    {formatDate(trip.departureTime)} • {formatTime(trip.departureTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Arrival</div>
                  <div className="mt-1 text-sm text-slate-100">
                    {formatDate(trip.arrivalTime)} • {formatTime(trip.arrivalTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Operator</div>
                  <div className="mt-1 text-sm text-slate-100">{trip.operator.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Amenities</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-200">
                    {trip.amenities.map((a) => (
                      <span key={a} className="rounded-full bg-slate-900 px-2 py-1">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-sm text-slate-400">Price</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {formatMoney(trip.price)}
              </div>
              <div className="mt-2 text-sm text-slate-400">Seats left: {trip.seatsLeft}</div>
              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    actions.setTripId(trip.id)
                    navigate(routes.checkout())
                  }}
                >
                  Continue to checkout
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
