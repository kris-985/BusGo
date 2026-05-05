import { Link, useParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useBookingByIdQuery } from '@/features/booking/api/mutations'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export function ConfirmationPage() {
  const { bookingId } = useParams()
  const id = bookingId ?? ''
  const query = useBookingByIdQuery(id, Boolean(id))

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Booking confirmed</h1>
        <p className="mt-2 text-sm text-slate-600">Your booking details are below.</p>
      </div>

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-700">Loading booking...</div>
        </Card>
      ) : query.isError || !query.data ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(query.error, 'We could not load this booking confirmation.')}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm text-slate-600">Booking ID</div>
              <div className="mt-1 font-mono text-sm text-slate-950">{query.data.id}</div>

              <div className="mt-4 text-sm text-slate-600">Trip</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {query.data.trip.from.name} to {query.data.trip.to.name}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {formatDate(query.data.trip.departureTime)} - {formatTime(query.data.trip.departureTime)}-{formatTime(query.data.trip.arrivalTime)}
              </div>

              <div className="mt-4 text-sm text-slate-600">Passengers</div>
              <div className="mt-2 grid gap-2 text-sm text-slate-800">
                {query.data.passengers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-xs text-slate-600">{p.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:min-w-64">
              <div className="text-sm text-slate-600">Total</div>
              <div className="mt-1 text-2xl font-semibold text-slate-950">
                {formatMoney(query.data.total)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Payment: <span className="text-slate-800">{query.data.paymentMethod}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Status: <span className="text-slate-800">{query.data.status}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to={routes.search()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 active:bg-slate-100"
            >
              Book another trip
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

