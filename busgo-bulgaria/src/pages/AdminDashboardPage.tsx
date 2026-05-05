import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import type { Booking, BookingStatus } from '@/entities/booking/types'
import { useSeatOccupancySummaryQuery, useAdminRoutesQuery, useCreateRouteMutation } from '@/features/admin/api/queries'
import { useBookingsQuery } from '@/features/booking/api/mutations'
import { useCitiesQuery } from '@/features/search-trips/api/queries'
import type { AdminRouteRecord } from '@/shared/api/apiClient'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

type RouteFormValues = {
  fromCity: string
  toCity: string
  departureTime: string
  arrivalTime: string
  price: string
  totalSeats: string
  distanceKm: string
}

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function initialRouteFormValues(): RouteFormValues {
  const departure = new Date()
  departure.setHours(departure.getHours() + 2, 0, 0, 0)
  const arrival = new Date(departure)
  arrival.setHours(arrival.getHours() + 2)

  return {
    fromCity: 'Sofia',
    toCity: 'Plovdiv',
    departureTime: toDatetimeLocalValue(departure),
    arrivalTime: toDatetimeLocalValue(arrival),
    price: '24.90',
    totalSeats: '40',
    distanceKm: '',
  }
}

function datetimeLocalToIso(value: string) {
  const date = new Date(value)
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const minutes = String(absoluteOffset % 60).padStart(2, '0')
  return `${value}:00${sign}${hours}:${minutes}`
}

function durationLabel(minutes?: number) {
  if (!minutes) return '-'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function routeDurationLabel(route: AdminRouteRecord) {
  return durationLabel(
    Math.round((new Date(route.arrivalTime).getTime() - new Date(route.departureTime).getTime()) / 60000),
  )
}

function routeName(route: AdminRouteRecord) {
  return `${route.fromCity} - ${route.toCity}`
}

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
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const routesQuery = useAdminRoutesQuery()
  const bookingsQuery = useBookingsQuery()
  const occupancyQuery = useSeatOccupancySummaryQuery()
  const citiesQuery = useCitiesQuery()
  const createRouteMutation = useCreateRouteMutation()
  const [routeFormValues, setRouteFormValues] = useState<RouteFormValues>(() => initialRouteFormValues())
  const [createdRouteId, setCreatedRouteId] = useState<string | null>(null)
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
  const dashboardError = routesQuery.error ?? bookingsQuery.error ?? occupancyQuery.error
  const cities = citiesQuery.data ?? []

  function updateRouteFormValue(name: keyof RouteFormValues, value: string) {
    setCreatedRouteId(null)
    setRouteFormValues((current) => ({ ...current, [name]: value }))
  }

  async function handleCreateRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const createdRoute = await createRouteMutation.mutateAsync({
        fromCity: routeFormValues.fromCity,
        toCity: routeFormValues.toCity,
        departureTime: datetimeLocalToIso(routeFormValues.departureTime),
        arrivalTime: datetimeLocalToIso(routeFormValues.arrivalTime),
        price: Number(routeFormValues.price),
        totalSeats: Number(routeFormValues.totalSeats),
        distanceKm: routeFormValues.distanceKm.trim() ? Number(routeFormValues.distanceKm) : undefined,
      })

      setCreatedRouteId(createdRoute.id)
      setRouteFormValues(initialRouteFormValues())
    } catch {
      setCreatedRouteId(null)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] sm:flex sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
            Operator workspace
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Manage routes, monitor bookings, and track live seat occupancy.
          </p>
        </div>
        <Button className="mt-4 sm:mt-0" variant="secondary" onClick={() => document.getElementById('new-route-form')?.scrollIntoView({ behavior: 'smooth' })}>
          Add route
        </Button>
      </div>

      <Card id="new-route-form" className="p-6">
        <div>
          <h2 className="text-xl font-black text-slate-950">New route</h2>
          <p className="mt-1 text-sm text-slate-500">Create a scheduled trip and add its seats to inventory.</p>
        </div>

        <form className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-end" onSubmit={handleCreateRoute}>
          <div className="lg:col-span-2">
            <Input
              label="From"
              list="admin-route-cities"
              value={routeFormValues.fromCity}
              onChange={(event) => updateRouteFormValue('fromCity', event.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-2">
            <Input
              label="To"
              list="admin-route-cities"
              value={routeFormValues.toCity}
              onChange={(event) => updateRouteFormValue('toCity', event.target.value)}
              required
            />
          </div>
          <datalist id="admin-route-cities">
            {cities.map((city) => (
              <option key={city.id} value={city.name} />
            ))}
          </datalist>
          <div className="lg:col-span-2">
            <Input
              label="Departure"
              type="datetime-local"
              value={routeFormValues.departureTime}
              onChange={(event) => updateRouteFormValue('departureTime', event.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-2">
            <Input
              label="Arrival"
              type="datetime-local"
              value={routeFormValues.arrivalTime}
              onChange={(event) => updateRouteFormValue('arrivalTime', event.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-1">
            <Input
              label="Price"
              type="number"
              min="0.01"
              step="0.01"
              value={routeFormValues.price}
              onChange={(event) => updateRouteFormValue('price', event.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-1">
            <Input
              label="Seats"
              type="number"
              min="4"
              max="80"
              step="4"
              value={routeFormValues.totalSeats}
              onChange={(event) => updateRouteFormValue('totalSeats', event.target.value)}
              required
            />
          </div>
          <div className="lg:col-span-1">
            <Input
              label="Km"
              type="number"
              min="1"
              step="1"
              value={routeFormValues.distanceKm}
              onChange={(event) => updateRouteFormValue('distanceKm', event.target.value)}
            />
          </div>
          <div className="lg:col-span-1">
            <Button className="w-full" disabled={createRouteMutation.isPending} type="submit">
              {createRouteMutation.isPending ? 'Saving' : 'Save'}
            </Button>
          </div>
        </form>

        {createRouteMutation.isError ? (
          <div className="mt-3 text-sm text-rose-700">
            {getUserFriendlyErrorMessage(createRouteMutation.error, 'Route could not be created. Please check the form.')}
          </div>
        ) : createdRouteId ? (
          <div className="mt-3 text-sm font-medium text-emerald-700">
            Route created: <span className="font-mono">{createdRouteId}</span>
          </div>
        ) : null}
      </Card>

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

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Routes</h2>
                <p className="mt-1 text-sm text-slate-500">Manage route inventory and activity.</p>
              </div>
              <Button size="sm" variant="secondary">Export routes</Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Scheduled trip</th>
                    <th className="py-3 pr-4 font-medium">Distance</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                    <th className="py-3 pr-4 font-medium">Trips</th>
                    <th className="py-3 pr-4 font-medium">Bookings</th>
                    <th className="py-3 pr-4 font-medium">Revenue</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(routesQuery.data ?? []).map((route) => {
                    const metrics = routeMetrics.get(routeName(route))

                    return (
                      <tr key={route.id}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-950">{routeName(route)}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500">{route.id}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(route.departureTime)} {formatTime(route.departureTime)}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {route.distanceKm ? `${route.distanceKm} km` : '-'}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {routeDurationLabel(route)}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{metrics?.trips ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{metrics?.bookings ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">
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
                <h2 className="text-lg font-semibold text-slate-950">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">Recent bookings with seats and route details.</p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
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
                  <tbody className="divide-y divide-slate-100">
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="py-3 pr-4">
                          <div className="font-mono text-xs text-slate-950">{booking.id}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {booking.passengers.length} passenger{booking.passengers.length === 1 ? '' : 's'}
                          </div>
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

            <Card className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Seat occupancy</h2>
                  <p className="mt-1 text-sm text-slate-500">Live mock occupancy by active trip.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {(occupancyQuery.data ?? []).map((row) => (
                  <div key={row.tripId} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-950">{row.route}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDate(row.departureTime)} {formatTime(row.departureTime)}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-950">
                        {row.occupancyRate}%
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full transition-all', occupancyBarClass(row.occupancyRate))}
                        style={{ width: `${row.occupancyRate}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
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
