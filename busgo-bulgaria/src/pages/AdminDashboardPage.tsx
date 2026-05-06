import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import type { Booking, BookingStatus } from '@/entities/booking/types'
import { useAdminBookingsQuery, useAdminUsersQuery } from '@/features/admin/api/queries'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

function bookingRouteName(booking: Booking) {
  return `${booking.trip.from.name} - ${booking.trip.to.name}`
}

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

function statusClass(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700'
  if (status === 'PENDING') return 'border-amber-400/30 bg-amber-500/10 text-amber-800'
  return 'border-rose-400/30 bg-rose-500/10 text-rose-700'
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const bookingsQuery = useAdminBookingsQuery()
  const usersQuery = useAdminUsersQuery()
  const [now] = useState(() => Date.now())

  const stats = useMemo(() => {
    const bookings = bookingsQuery.data ?? []
    const paidBookings = bookings.filter((booking) => booking.status !== 'CANCELLED')
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + booking.total.amount, 0)
    const currency = paidBookings[0]?.total.currency ?? 'BGN'
    const upcomingBookings = bookings.filter(
      (booking) => new Date(booking.trip.departureTime).getTime() >= now,
    ).length
    const bookedSeats = paidBookings.reduce((sum, booking) => sum + booking.seatIds.length, 0)

    return {
      totalRevenue: { amount: Math.round(totalRevenue * 100) / 100, currency },
      bookingsCount: bookings.length,
      upcomingBookings,
      bookedSeats,
    }
  }, [bookingsQuery.data, now])

  const sortedBookings = useMemo(
    () =>
      [...(bookingsQuery.data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [bookingsQuery.data],
  )

  const isLoading = bookingsQuery.isLoading || usersQuery.isLoading
  const hasError = bookingsQuery.isError || usersQuery.isError
  const dashboardError = bookingsQuery.error ?? usersQuery.error

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Monitor users, ticket buyers, bookings, and revenue.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-700">Loading admin data...</div>
        </Card>
      ) : hasError ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(dashboardError, 'We could not load admin dashboard data. Please try again.')}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Revenue"
              value={formatMoney(stats.totalRevenue)}
              detail="Confirmed and pending bookings"
            />
            <StatCard
              label="Bookings"
              value={String(stats.bookingsCount)}
              detail={`${stats.upcomingBookings} upcoming trips`}
            />
            <StatCard
              label="Seats sold"
              value={String(stats.bookedSeats)}
              detail="Across current mock bookings"
            />
          </div>

          <Card className="p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">MongoDB users</h2>
              <p className="mt-1 text-sm text-slate-500">Admin access is controlled by the role stored on each user record.</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">User</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(usersQuery.data ?? []).map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 pr-4 font-medium text-slate-950">{user.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{user.email}</td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          'rounded-lg border px-2 py-0.5 text-xs font-medium',
                          user.role === 'admin'
                            ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-800'
                            : 'border-slate-300 bg-slate-100 text-slate-700',
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">Recent bookings with seats and route details.</p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Booking</th>
                      <th className="py-3 pr-4 font-medium">Buyer</th>
                      <th className="py-3 pr-4 font-medium">Route</th>
                      <th className="py-3 pr-4 font-medium">Departure</th>
                      <th className="py-3 pr-4 font-medium">Seats</th>
                      <th className="py-3 pr-4 font-medium">Total</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 text-right font-medium">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="py-3 pr-4">
                          <div className="font-mono text-xs text-slate-950">{booking.id}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {booking.passengers.length} passenger{booking.passengers.length === 1 ? '' : 's'}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-950">{booking.userName ?? 'Guest import'}</div>
                          <div className="mt-1 text-xs text-slate-500">{booking.userEmail ?? booking.contactEmail}</div>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{bookingRouteName(booking)}</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {formatDate(booking.trip.departureTime)} {formatTime(booking.trip.departureTime)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {booking.seatIds.map((seatId) => (
                              <span
                                key={seatId}
                                className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-950"
                              >
                                {seatLabelFromId(seatId)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{formatMoney(booking.total)}</td>
                        <td className="py-3 pr-4">
                          <span className={cn('rounded-lg border px-2 py-0.5 text-xs font-medium', statusClass(booking.status))}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={routes.success(booking.id)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100 active:bg-white"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
