import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useCreateBookingMutation } from '@/features/booking/api/mutations'
import { useBookingStore } from '@/features/booking/model/useBookingStore'
import { useTripByIdQuery } from '@/features/search-trips/api/queries'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Spinner } from '@/shared/components/ui/Spinner'
import { formatMoney } from '@/shared/lib/format'

export function CheckoutPage() {
  const navigate = useNavigate()
  const booking = useBookingStore()
  const { draft, actions } = booking

  const tripId = draft.tripId
  const tripQuery = useTripByIdQuery(tripId ?? '', Boolean(tripId))
  const createMutation = useCreateBookingMutation()

  const total = useMemo(() => {
    const trip = tripQuery.data
    if (!trip) return null
    const amount = draft.passengers.reduce((sum, p) => {
      const mult = p.type === 'CHILD' ? 0.7 : p.type === 'SENIOR' ? 0.85 : 1
      return sum + trip.price.amount * mult
    }, 0)
    return { amount: Math.round(amount * 100) / 100, currency: trip.price.currency }
  }, [draft.passengers, tripQuery.data])

  if (!tripId) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Checkout</h1>
          <p className="mt-2 text-sm text-slate-400">Select a trip first.</p>
        </div>
        <Card className="p-6">
          <div className="text-sm text-slate-300">
            No trip selected. Go back to search and pick a trip.
          </div>
          <div className="mt-4">
            <Link
              to={routes.search()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 active:bg-slate-800"
            >
              Search trips
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isSubmitting = createMutation.isPending

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Checkout</h1>
          <p className="mt-2 text-sm text-slate-400">Enter passengers and contact details.</p>
        </div>
        <Link
          to={routes.trip(tripId)}
          className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
        >
          Back
        </Link>
      </div>

      {tripQuery.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-300">Loading trip…</div>
        </Card>
      ) : tripQuery.isError || !tripQuery.data ? (
        <Card className="p-6">
          <div className="text-sm text-rose-300">Failed to load trip.</div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="grid gap-6 lg:col-span-2">
            <Card className="p-6">
              <div className="text-sm font-medium text-slate-100">Passengers</div>
              <div className="mt-4 grid gap-3">
                {draft.passengers.map((p, idx) => (
                  <div key={idx} className="grid gap-3 rounded-2xl border border-slate-800 p-4 md:grid-cols-12 md:items-end">
                    <div className="md:col-span-5">
                      <Input
                        label={`First name`}
                        value={p.firstName}
                        onChange={(e) => {
                          const next = [...draft.passengers]
                          next[idx] = { ...next[idx], firstName: e.target.value }
                          actions.setPassengers(next)
                        }}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Input
                        label="Last name"
                        value={p.lastName}
                        onChange={(e) => {
                          const next = [...draft.passengers]
                          next[idx] = { ...next[idx], lastName: e.target.value }
                          actions.setPassengers(next)
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Select
                        label="Type"
                        value={p.type}
                        onChange={(e) => {
                          const next = [...draft.passengers]
                          next[idx] = { ...next[idx], type: e.target.value as typeof p.type }
                          actions.setPassengers(next)
                        }}
                      >
                        <option value="ADULT">Adult</option>
                        <option value="CHILD">Child</option>
                        <option value="SENIOR">Senior</option>
                      </Select>
                    </div>
                    <div className="md:col-span-12">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={draft.passengers.length <= 1}
                          onClick={() => {
                            const next = draft.passengers.filter((_, i) => i !== idx)
                            actions.setPassengers(next)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      actions.setPassengers([
                        ...draft.passengers,
                        { firstName: '', lastName: '', type: 'ADULT' },
                      ])
                    }
                  >
                    Add passenger
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-slate-100">Contact</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => actions.setContact({ email: e.target.value, phone: draft.contactPhone })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={draft.contactPhone}
                  onChange={(e) => actions.setContact({ email: draft.contactEmail, phone: e.target.value })}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-slate-100">Payment</div>
              <div className="mt-4">
                <Select
                  label="Method"
                  value={draft.paymentMethod}
                  onChange={(e) => actions.setPaymentMethod(e.target.value as typeof draft.paymentMethod)}
                >
                  <option value="CARD">Card</option>
                  <option value="CASH_ON_BOARD">Cash on board</option>
                </Select>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6 p-6">
              <div className="text-sm text-slate-400">Trip</div>
              <div className="mt-1 text-sm font-medium text-slate-100">
                {tripQuery.data.from.name} → {tripQuery.data.to.name}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Passengers</span>
                  <span>{draft.passengers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold text-slate-100">
                    {total ? formatMoney(total) : '—'}
                  </span>
                </div>
              </div>

              {createMutation.isError ? (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  Failed to create booking.
                </div>
              ) : null}

              <div className="mt-5">
                <Button
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={async () => {
                    const hasEmptyPassenger = draft.passengers.some(
                      (p) => !p.firstName.trim() || !p.lastName.trim(),
                    )
                    if (hasEmptyPassenger) return
                    if (!draft.contactEmail.trim() || !draft.contactPhone.trim()) return

                    const bookingRes = await createMutation.mutateAsync({
                      tripId,
                      passengers: draft.passengers.map((p) => ({
                        firstName: p.firstName.trim(),
                        lastName: p.lastName.trim(),
                        type: p.type,
                      })),
                      contactEmail: draft.contactEmail.trim(),
                      contactPhone: draft.contactPhone.trim(),
                      paymentMethod: draft.paymentMethod,
                    })

                    actions.reset()
                    navigate(routes.confirmation(bookingRes.id))
                  }}
                >
                  {isSubmitting ? 'Booking…' : 'Confirm booking'}
                </Button>
                <div className="mt-3 text-xs text-slate-500">
                  This is a demo checkout backed by a typed mock API.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

