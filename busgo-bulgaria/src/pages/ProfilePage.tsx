import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { useBookingsQuery } from '@/features/booking/api/mutations'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

export function ProfilePage() {
  const auth = useAuth()
  const bookingsQuery = useBookingsQuery()
  const bookings = bookingsQuery.data ?? []

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
          Account center
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          {auth.user?.name} - {auth.user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Role', auth.user?.role ?? 'user'],
          ['Tickets', String(bookings.length)],
          ['Account created', auth.user?.createdAt ? formatDate(auth.user.createdAt) : '-'],
        ].map(([title, detail]) => (
          <Card key={title} className="p-6">
            <div className="text-sm font-black uppercase tracking-wide text-cyan-700">{title}</div>
            <div className="mt-3 text-lg font-semibold text-slate-950">{detail}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Purchased tickets</h2>
          <p className="mt-1 text-sm text-slate-500">Tickets bought while logged in with this account.</p>
        </div>

        {bookingsQuery.isLoading ? (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <Spinner />
            Loading tickets...
          </div>
        ) : bookingsQuery.isError ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
            {getUserFriendlyErrorMessage(bookingsQuery.error, 'We could not load your tickets.')}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            You have no purchased tickets yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="font-semibold text-slate-950">
                    {booking.trip.from.name} - {booking.trip.to.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {formatDate(booking.trip.departureTime)} {formatTime(booking.trip.departureTime)} - Seats{' '}
                    {booking.seatIds.map(seatLabelFromId).join(', ')}
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{booking.id}</div>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <div className="text-sm font-semibold text-slate-950">{formatMoney(booking.total)}</div>
                  <Link
                    to={routes.success(booking.id)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 active:bg-white"
                  >
                    Open ticket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
