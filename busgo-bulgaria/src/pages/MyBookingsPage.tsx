import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import type { Booking, BookingStatus } from '@/entities/booking/types'
import { useBookingsQuery } from '@/features/booking/api/mutations'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

function bookingTime(booking: Booking) {
  return new Date(booking.trip.departureTime).getTime()
}

function statusClass(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700'
  if (status === 'PENDING') return 'border-amber-400/30 bg-amber-500/10 text-amber-800'
  return 'border-rose-400/30 bg-rose-500/10 text-rose-700'
}

function BookingCard({ booking }: { booking: Booking }) {
  const seats = booking.seatIds.map((seatId, index) => ({
    id: seatId,
    label: seatLabelFromId(seatId),
    passenger: booking.passengers[index],
  }))

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <div className="p-5 lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold text-slate-950">
              {booking.trip.from.name} - {booking.trip.to.name}
            </div>
            <span className={cn('rounded-lg border px-2 py-0.5 text-xs font-medium', statusClass(booking.status))}>
              {booking.status}
            </span>
          </div>
          <div className="mt-2 font-mono text-xs text-slate-500">{booking.id}</div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-slate-500">Date</div>
              <div className="mt-0.5 font-medium text-slate-950">
                {formatDate(booking.trip.departureTime)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Departure</div>
              <div className="mt-0.5 font-medium text-slate-950">
                {formatTime(booking.trip.departureTime)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Arrival</div>
              <div className="mt-0.5 font-medium text-slate-950">
                {formatTime(booking.trip.arrivalTime)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 lg:col-span-4">
          <div className="text-sm text-slate-600">Seats</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {seats.map(({ id, label }) => (
              <span
                key={id}
                className="inline-flex min-w-12 justify-center rounded-lg bg-cyan-500/15 px-3 py-1 text-sm font-semibold text-cyan-800 ring-1 ring-inset ring-cyan-400/30"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-1 text-sm text-slate-700">
            {seats.map(({ id, passenger }) => (
              <div key={id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Passenger not assigned'}
                </span>
                <span className="shrink-0 text-xs text-slate-500">{passenger?.type ?? 'ADULT'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 p-5 lg:col-span-3 lg:border-l lg:border-t-0 lg:text-right">
          <div className="text-sm text-slate-600">Total</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            {formatMoney(booking.total)}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {booking.trip.operator.name} - {booking.paymentMethod}
          </div>
          <div className="mt-4">
            <Link
              to={routes.success(booking.id)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 active:bg-white"
            >
              Open ticket
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

function BookingSection({ title, bookings }: { title: string; bookings: Booking[] }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-5">
          <div className="text-sm text-slate-600">No {title.toLowerCase()} bookings.</div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </section>
  )
}

export function MyBookingsPage() {
  const query = useBookingsQuery()
  const [now] = useState(() => Date.now())

  const grouped = useMemo(() => {
    const bookings = query.data ?? []
    const upcoming = bookings
      .filter((booking) => bookingTime(booking) >= now)
      .sort((a, b) => bookingTime(a) - bookingTime(b))
    const past = bookings
      .filter((booking) => bookingTime(booking) < now)
      .sort((a, b) => bookingTime(b) - bookingTime(a))

    return { upcoming, past }
  }, [now, query.data])

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] sm:flex sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
            Ticket wallet
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">My bookings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Mock booking history with route details, assigned seats, and ticket links.
          </p>
        </div>
        <Link
          to={routes.searchResults()}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15 sm:mt-0"
        >
          Book trip
        </Link>
      </div>

      {query.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-700">Loading bookings...</div>
        </Card>
      ) : query.isError ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(query.error, 'We could not load your bookings. Please try again.')}
          </div>
        </Card>
      ) : (
        <div className="grid gap-8">
          <BookingSection title="Upcoming" bookings={grouped.upcoming} />
          <BookingSection title="Past" bookings={grouped.past} />
        </div>
      )}
    </div>
  )
}
