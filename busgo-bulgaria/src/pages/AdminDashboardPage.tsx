import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import type { Booking, BookingStatus } from '@/entities/booking/types'
import type { Route } from '@/entities/route/types'
import { useSeatOccupancySummaryQuery, useAdminRoutesQuery } from '@/features/admin/api/queries'
import { useBookingsQuery } from '@/features/booking/api/mutations'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

function durationLabel(minutes?: number) {
  if (!minutes) return '-'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function routeName(route: Route) {
  return `${route.from.name} - ${route.to.name}`
}

function bookingRouteName(booking: Booking) {
  return `${booking.trip.from.name} - ${booking.trip.to.name}`
}

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

function statusClass(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
  if (status === 'PENDING') return 'border-amber-400/30 bg-amber-500/10 text-amber-200'
  return 'border-rose-400/30 bg-rose-500/10 text-rose-200'
}

function occupancyBarClass(rate: number) {
  if (rate >= 80) return 'bg-rose-400'
  if (rate >= 55) return 'bg-amber-400'
  return 'bg-emerald-400'
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
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const routesQuery = useAdminRoutesQuery()
  const bookingsQuery = useBookingsQuery()
  const occupancyQuery = useSeatOccupancySummaryQuery()
  const [now] = useState(() => Date.now())

  const stats = useMemo(() => {
    const bookings = bookingsQuery.data ?? []
    const occupancy = occupancyQuery.data ?? []
    const paidBookings = bookings.filter((booking) => booking.status !== 'CANCELLED')
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + booking.total.amount, 0)
    const currency = paidBookings[0]?.total.currency ?? 'BGN'
    const upcomingBookings = bookings.filter(
      (booking) => new Date(booking.trip.departureTime).getTime() >= now,
    ).length
    const bookedSeats = paidBookings.reduce((sum, booking) => sum + booking.seatIds.length, 0)
    const averageOccupancy = occupancy.length
      ? Math.round(occupancy.reduce((sum, row) => sum + row.occupancyRate, 0) / occupancy.length)
      : 0

    return {
      totalRevenue: { amount: Math.round(totalRevenue * 100) / 100, currency },
      bookingsCount: bookings.length,
      upcomingBookings,
      bookedSeats,
      averageOccupancy,
    }
  }, [bookingsQuery.data, now, occupancyQuery.data])

  const routeMetrics = useMemo(() => {
    const bookings = bookingsQuery.data ?? []
    const occupancy = occupancyQuery.data ?? []
    const byRoute = new Map<string, { bookings: number; revenue: number; trips: number }>()

    for (const booking of bookings) {
      const key = bookingRouteName(booking)
      const current = byRoute.get(key) ?? { bookings: 0, revenue: 0, trips: 0 }
      current.bookings += 1
      current.revenue += booking.status === 'CANCELLED' ? 0 : booking.total.amount
      byRoute.set(key, current)
    }

    for (const row of occupancy) {
      const current = byRoute.get(row.route) ?? { bookings: 0, revenue: 0, trips: 0 }
      current.trips += 1
      byRoute.set(row.route, current)
    }

    return byRoute
  }, [bookingsQuery.data, occupancyQuery.data])

  const sortedBookings = useMemo(
    () =>
      [...(bookingsQuery.data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [bookingsQuery.data],
  )

  const isLoading = routesQuery.isLoading || bookingsQuery.isLoading || occupancyQuery.isLoading
  const hasError = routesQuery.isError || bookingsQuery.isError || occupancyQuery.isError

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Admin dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage routes, monitor bookings, and track live seat occupancy.
          </p>
        </div>
        <Button variant="secondary">Add route</Button>
      </div>

      {isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading admin data...</div>
        </Card>
      ) : hasError ? (
        <Card className="p-6">
          <div className="text-sm text-rose-300">Failed to load admin dashboard data.</div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <StatCard
              label="Occupancy"
              value={`${stats.averageOccupancy}%`}
              detail="Average across active trips"
            />
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Routes</h2>
                <p className="mt-1 text-sm text-slate-500">Manage route inventory and activity.</p>
              </div>
              <Button size="sm" variant="secondary">Export routes</Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Route</th>
                    <th className="py-3 pr-4 font-medium">Distance</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                    <th className="py-3 pr-4 font-medium">Trips</th>
                    <th className="py-3 pr-4 font-medium">Bookings</th>
                    <th className="py-3 pr-4 font-medium">Revenue</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {(routesQuery.data ?? []).map((route) => {
                    const metrics = routeMetrics.get(routeName(route))

                    return (
                      <tr key={route.id}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-100">{routeName(route)}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500">{route.id}</div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {route.distanceKm ? `${route.distanceKm} km` : '-'}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {durationLabel(route.estimatedDurationMinutes)}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{metrics?.trips ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-300">{metrics?.bookings ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-300">
                          {formatMoney({ amount: metrics?.revenue ?? 0, currency: 'BGN' })}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost">Edit</Button>
                            <Button size="sm" variant="secondary">Pause</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-5">
            <Card className="p-5 xl:col-span-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">Recent bookings with seats and route details.</p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Booking</th>
                      <th className="py-3 pr-4 font-medium">Route</th>
                      <th className="py-3 pr-4 font-medium">Departure</th>
                      <th className="py-3 pr-4 font-medium">Seats</th>
                      <th className="py-3 pr-4 font-medium">Total</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 text-right font-medium">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="py-3 pr-4">
                          <div className="font-mono text-xs text-slate-100">{booking.id}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {booking.passengers.length} passenger{booking.passengers.length === 1 ? '' : 's'}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{bookingRouteName(booking)}</td>
                        <td className="py-3 pr-4 text-slate-300">
                          {formatDate(booking.trip.departureTime)} {formatTime(booking.trip.departureTime)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {booking.seatIds.map((seatId) => (
                              <span
                                key={seatId}
                                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-medium text-slate-100"
                              >
                                {seatLabelFromId(seatId)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{formatMoney(booking.total)}</td>
                        <td className="py-3 pr-4">
                          <span className={cn('rounded-lg border px-2 py-0.5 text-xs font-medium', statusClass(booking.status))}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={routes.success(booking.id)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-900 active:bg-slate-950"
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

            <Card className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Seat occupancy</h2>
                  <p className="mt-1 text-sm text-slate-500">Live mock occupancy by active trip.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {(occupancyQuery.data ?? []).map((row) => (
                  <div key={row.tripId} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{row.route}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDate(row.departureTime)} {formatTime(row.departureTime)}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-100">
                        {row.occupancyRate}%
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={cn('h-full rounded-full transition-all', occupancyBarClass(row.occupancyRate))}
                        style={{ width: `${row.occupancyRate}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                      <span>{row.occupiedSeats} occupied</span>
                      <span>{row.freeSeats} free</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
