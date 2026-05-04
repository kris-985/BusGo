import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useBookingByIdQuery } from '@/features/booking/api/mutations'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

export function SuccessPage() {
  const { bookingId } = useParams()
  const id = bookingId ?? ''
  const query = useBookingByIdQuery(id, Boolean(id))

  if (query.isLoading) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Booking confirmed</h1>
          <p className="mt-2 text-sm text-slate-400">Preparing your ticket.</p>
        </div>
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading booking...</div>
        </Card>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Booking confirmed</h1>
          <p className="mt-2 text-sm text-slate-400">We could not load this confirmation.</p>
        </div>
        <Card className="p-6">
          <div className="text-sm text-rose-300">Booking not found.</div>
          <div className="mt-4">
            <Link
              to={routes.myBookings()}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-900 active:bg-slate-950"
            >
              View my bookings
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const booking = query.data
  const origin = typeof window === 'undefined' ? 'https://busgo.local' : window.location.origin
  const confirmationUrl = `${origin}${routes.success(booking.id)}`
  const seatRows = booking.seatIds.map((seatId, index) => ({
    seatId,
    label: seatLabelFromId(seatId),
    passenger: booking.passengers[index],
  }))

  return (
    <div className="grid gap-6">
      <div>
        <div className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">
          Confirmed
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">
          Booking confirmation
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Booking ID <span className="font-mono text-slate-200">{booking.id}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="text-sm font-medium text-slate-100">Boarding QR</div>
          <div className="mt-4 flex justify-center">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG
                value={confirmationUrl}
                size={184}
                level="M"
                marginSize={2}
                title={`BusGo booking ${booking.id}`}
              />
            </div>
          </div>
          <div className="mt-4 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
            {booking.id}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm text-slate-400">Trip</div>
              <div className="mt-1 text-xl font-semibold text-slate-100">
                {booking.trip.from.name} - {booking.trip.to.name}
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <div>
                  <div className="text-slate-500">Date</div>
                  <div className="mt-0.5 font-medium text-slate-100">
                    {formatDate(booking.trip.departureTime)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Operator</div>
                  <div className="mt-0.5 font-medium text-slate-100">{booking.trip.operator.name}</div>
                </div>
                <div>
                  <div className="text-slate-500">Departure</div>
                  <div className="mt-0.5 font-medium text-slate-100">
                    {formatTime(booking.trip.departureTime)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Arrival</div>
                  <div className="mt-0.5 font-medium text-slate-100">
                    {formatTime(booking.trip.arrivalTime)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 md:min-w-56">
              <div className="text-sm text-slate-400">Total paid</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {formatMoney(booking.total)}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Payment: <span className="text-slate-200">{booking.paymentMethod}</span>
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Status: <span className="text-slate-200">{booking.status}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-100">Seats</div>
            <div className="mt-1 text-sm text-slate-400">
              {seatRows.length} {seatRows.length === 1 ? 'seat' : 'seats'} assigned
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Contact: <span className="text-slate-200">{booking.contactEmail}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {seatRows.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300">
              No seats assigned.
            </div>
          ) : (
            seatRows.map(({ seatId, label, passenger }) => (
              <div
                key={seatId}
                className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-2">
                  <span className="inline-flex min-w-14 justify-center rounded-lg bg-sky-500/15 px-3 py-1 font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/30">
                    {label}
                  </span>
                </div>
                <div className="text-slate-100 md:col-span-7">
                  {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Passenger not assigned'}
                </div>
                <div className="text-slate-400 md:col-span-3 md:text-right">
                  {passenger?.type ?? 'ADULT'}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to={routes.searchResults()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 active:bg-slate-800"
        >
          Book another trip
        </Link>
        <Link
          to={routes.myBookings()}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-900 active:bg-slate-950"
        >
          View my bookings
        </Link>
      </div>
    </div>
  )
}
