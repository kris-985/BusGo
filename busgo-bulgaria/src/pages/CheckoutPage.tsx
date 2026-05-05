import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { SeatStatus } from '@/entities/seat/types'
import { useCreateBookingMutation } from '@/features/booking/api/mutations'
import { type DraftPassenger, useBookingStore } from '@/features/booking/model/useBookingStore'
import { useSeatAvailabilityByTripQuery } from '@/features/seat-selection/api/queries'
import { useSeatSelectionStore } from '@/features/seat-selection/model/useSeatSelectionStore'
import { useTripByIdQuery } from '@/features/search-trips/api/queries'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Spinner } from '@/shared/components/ui/Spinner'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'
import { formatMoney } from '@/shared/lib/format'

const emptyPassenger: DraftPassenger = {
  firstName: '',
  lastName: '',
  type: 'ADULT',
}

const emptyPaymentForm = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

function seatLabelFromId(seatId: string) {
  const parts = seatId.split('-')
  return parts[parts.length - 1] ?? seatId
}

function simulatePayment(method: string, cardNumber: string) {
  return new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      const cardDigits = cardNumber.replace(/\D/g, '')

      if (method === 'CARD' && cardDigits.endsWith('0000')) {
        reject(new Error('PAYMENT_DECLINED'))
        return
      }

      resolve()
    }, 850)
  })
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const booking = useBookingStore()
  const { draft, actions } = booking
  const seatActions = useSeatSelectionStore((s) => s.actions)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const tripId = draft.tripId
  const tripQuery = useTripByIdQuery(tripId ?? '', Boolean(tripId))
  const seatAvailabilityQuery = useSeatAvailabilityByTripQuery(tripId ?? '', Boolean(tripId))
  const createMutation = useCreateBookingMutation()

  useEffect(() => {
    if (draft.selectedSeatIds.length === 0) return
    if (draft.passengers.length === draft.selectedSeatIds.length) return

    actions.setPassengers(
      draft.selectedSeatIds.map((_, index) => (
        draft.passengers[index] ?? emptyPassenger
      )),
    )
  }, [actions, draft.passengers, draft.selectedSeatIds])

  const passengerRows = useMemo(
    () =>
      draft.selectedSeatIds.map((seatId, index) => ({
        seatId,
        passenger: draft.passengers[index] ?? emptyPassenger,
      })),
    [draft.passengers, draft.selectedSeatIds],
  )

  const total = useMemo(() => {
    const trip = tripQuery.data
    if (!trip) return null

    const amount = trip.price.amount * draft.selectedSeatIds.length
    return { amount: Math.round(amount * 100) / 100, currency: trip.price.currency }
  }, [draft.selectedSeatIds.length, tripQuery.data])

  const seatAvailability = useMemo(() => {
    const seats = seatAvailabilityQuery.data?.seats ?? []
    const seatsById = new Map(seats.map((seat) => [seat.id, seat]))
    const unavailableSeatIds = draft.selectedSeatIds.filter((seatId) => {
      const seat = seatsById.get(seatId)
      return !seat || seat.status === SeatStatus.Occupied
    })
    const freeSeatCount = seats.filter((seat) => seat.status === SeatStatus.Free).length

    return {
      unavailableSeatIds,
      unavailableSeatLabels: unavailableSeatIds.map(seatLabelFromId),
      noSeatsAvailable: seats.length > 0 && freeSeatCount === 0,
    }
  }, [draft.selectedSeatIds, seatAvailabilityQuery.data])

  const isSubmitting = createMutation.isPending
  const isPaymentProcessing = paymentStatus === 'processing'
  const hasSelectedSeats = draft.selectedSeatIds.length > 0
  const hasUnavailableSelectedSeats = seatAvailability.unavailableSeatIds.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    createMutation.reset()

    if (!tripId) {
      setSubmitError('Select a trip before checkout.')
      return
    }

    if (draft.selectedSeatIds.length === 0) {
      setSubmitError('Select at least one seat before checkout.')
      return
    }

    if (hasUnavailableSelectedSeats) {
      setSubmitError('One of your selected seats was just taken. Please choose another available seat.')
      return
    }

    if (seatAvailability.noSeatsAvailable) {
      setSubmitError('This trip is fully booked. Please choose another trip.')
      return
    }

    const passengers = draft.selectedSeatIds.map((_, index) => (
      draft.passengers[index] ?? emptyPassenger
    ))
    const hasEmptyPassenger = passengers.some(
      (p) => !p.firstName.trim() || !p.lastName.trim(),
    )

    if (hasEmptyPassenger) {
      setSubmitError('Enter passenger names before payment.')
      return
    }

    if (!draft.contactEmail.trim() || !draft.contactPhone.trim()) {
      setSubmitError('Enter contact details before payment.')
      return
    }

    if (draft.paymentMethod === 'CARD') {
      const cardDigits = paymentForm.cardNumber.replace(/\D/g, '')
      const cvcDigits = paymentForm.cvc.replace(/\D/g, '')
      const hasValidExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiry.trim())

      if (
        !paymentForm.cardholderName.trim() ||
        cardDigits.length < 12 ||
        !hasValidExpiry ||
        cvcDigits.length < 3
      ) {
        setSubmitError('Enter valid mock card details.')
        return
      }
    }

    try {
      setPaymentStatus('processing')
      await simulatePayment(draft.paymentMethod, paymentForm.cardNumber)
      setPaymentStatus('succeeded')

      const bookingRes = await createMutation.mutateAsync({
        tripId,
        seatIds: draft.selectedSeatIds,
        passengers: passengers.map((p) => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          type: p.type,
        })),
        contactEmail: draft.contactEmail.trim(),
        contactPhone: draft.contactPhone.trim(),
        paymentMethod: draft.paymentMethod,
      })

      try {
        const raw = localStorage.getItem('busgo:bookingIds')
        const prev: string[] = raw ? JSON.parse(raw) : []
        const next = [bookingRes.id, ...prev.filter((id) => id !== bookingRes.id)].slice(0, 20)
        localStorage.setItem('busgo:bookingIds', JSON.stringify(next))
      } catch {
        // ignore storage errors (private mode, etc.)
      }

      actions.reset()
      seatActions.clearTrip(tripId)
      navigate(routes.success(bookingRes.id))
    } catch (error) {
      setPaymentStatus('idle')
      setSubmitError(getUserFriendlyErrorMessage(error, 'We could not complete checkout. Please try again.'))
    }
  }

  if (!tripId) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">Select a trip first.</p>
        </div>
        <Card className="p-6">
          <div className="text-sm text-slate-700">
            No trip selected. Go back to search and pick a trip.
          </div>
          <div className="mt-4">
            <Link
              to={routes.searchResults()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 active:bg-slate-100"
            >
              Search trips
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">Review seats and complete payment.</p>
        </div>
        <Link
          to={routes.trip(tripId)}
          className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950"
        >
          Back
        </Link>
      </div>

      {tripQuery.isLoading ? (
        <Card className="flex items-center gap-3 p-6">
          <Spinner />
          <div className="text-sm text-slate-700">Loading trip...</div>
        </Card>
      ) : tripQuery.isError || !tripQuery.data ? (
        <Card className="p-6">
          <div className="text-sm text-rose-700">
            {getUserFriendlyErrorMessage(tripQuery.error, 'We could not load this trip. Please try again.')}
          </div>
        </Card>
      ) : (
        <form className="grid gap-6 lg:grid-cols-3" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:col-span-2">
            <Card className="p-6">
              <div className="text-sm font-medium text-slate-950">Passengers</div>
              <div className="mt-4 grid gap-3">
                {passengerRows.length === 0 ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
                    Select seats before checkout.
                  </div>
                ) : (
                  passengerRows.map(({ seatId, passenger }, idx) => (
                    <div
                      key={seatId}
                      className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-12 md:items-end"
                    >
                      <div className="md:col-span-12">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Seat {seatLabelFromId(seatId)}
                        </div>
                      </div>
                      <div className="md:col-span-5">
                        <Input
                          label="First name"
                          value={passenger.firstName}
                          onChange={(e) => {
                            const next = [...draft.passengers]
                            next[idx] = { ...(next[idx] ?? emptyPassenger), firstName: e.target.value }
                            actions.setPassengers(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-5">
                        <Input
                          label="Last name"
                          value={passenger.lastName}
                          onChange={(e) => {
                            const next = [...draft.passengers]
                            next[idx] = { ...(next[idx] ?? emptyPassenger), lastName: e.target.value }
                            actions.setPassengers(next)
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Select
                          label="Type"
                          value={passenger.type}
                          onChange={(e) => {
                            const next = [...draft.passengers]
                            next[idx] = {
                              ...(next[idx] ?? emptyPassenger),
                              type: e.target.value as typeof passenger.type,
                            }
                            actions.setPassengers(next)
                          }}
                        >
                          <option value="ADULT">Adult</option>
                          <option value="CHILD">Child</option>
                          <option value="SENIOR">Senior</option>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-medium text-slate-950">Contact</div>
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
              <div className="text-sm font-medium text-slate-950">Mock payment</div>
              <div className="mt-4 grid gap-3">
                <Select
                  label="Method"
                  value={draft.paymentMethod}
                  onChange={(e) => {
                    actions.setPaymentMethod(e.target.value as typeof draft.paymentMethod)
                    setSubmitError(null)
                  }}
                >
                  <option value="CARD">Card</option>
                  <option value="CASH_ON_BOARD">Cash on board</option>
                </Select>

                {draft.paymentMethod === 'CARD' ? (
                  <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <Input
                        label="Cardholder"
                        autoComplete="cc-name"
                        value={paymentForm.cardholderName}
                        onChange={(e) => setPaymentForm((form) => ({ ...form, cardholderName: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-6">
                      <Input
                        label="Card number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm((form) => ({ ...form, cardNumber: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="Expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={paymentForm.expiry}
                        onChange={(e) => setPaymentForm((form) => ({ ...form, expiry: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="CVC"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={paymentForm.cvc}
                        onChange={(e) => setPaymentForm((form) => ({ ...form, cvc: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6 p-6">
              <div className="text-sm text-slate-600">Trip</div>
              <div className="mt-1 text-sm font-medium text-slate-950">
                {tripQuery.data.from.name} - {tripQuery.data.to.name}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Seats</span>
                  <span>{draft.selectedSeatIds.length}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-600">Selected</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {draft.selectedSeatIds.length > 0 ? (
                      draft.selectedSeatIds.map((seatId) => (
                        <span
                          key={seatId}
                          className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-950"
                        >
                          {seatLabelFromId(seatId)}
                        </span>
                      ))
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Price per seat</span>
                  <span>{formatMoney(tripQuery.data.price)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-slate-600">Total</span>
                  <span className="font-semibold text-slate-950">
                    {total ? formatMoney(total) : '-'}
                  </span>
                </div>
              </div>

              {seatAvailabilityQuery.isError ? (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
                  {getUserFriendlyErrorMessage(
                    seatAvailabilityQuery.error,
                    'We could not refresh seat availability. Booking will be checked again before confirmation.',
                  )}
                </div>
              ) : null}

              {hasUnavailableSelectedSeats ? (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
                  Seats {seatAvailability.unavailableSeatLabels.join(', ')} are no longer available.
                </div>
              ) : null}

              {submitError || createMutation.isError ? (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
                  {submitError ?? getUserFriendlyErrorMessage(createMutation.error, 'We could not create your booking. Please try again.')}
                </div>
              ) : null}

              {!hasSelectedSeats ? (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
                  Select at least one seat before checkout.
                </div>
              ) : null}

              <div className="mt-5">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isPaymentProcessing || !hasSelectedSeats || hasUnavailableSelectedSeats}
                >
                  {isPaymentProcessing
                    ? 'Processing payment...'
                    : isSubmitting
                      ? 'Creating booking...'
                      : 'Pay and book'}
                </Button>
                <div className="mt-3 text-xs text-slate-500">
                  {paymentStatus === 'succeeded'
                    ? 'Payment accepted. Creating booking...'
                    : 'Mock payment is simulated locally for this demo.'}
                </div>
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  )
}
