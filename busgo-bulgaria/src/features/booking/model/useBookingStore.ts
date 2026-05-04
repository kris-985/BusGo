import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { PassengerType } from '@/entities/passenger/types'
import type { PaymentMethod } from '@/entities/booking/types'

export type DraftPassenger = {
  firstName: string
  lastName: string
  type: PassengerType
}

export type BookingDraft = {
  tripId: string | null
  selectedSeatIds: string[]
  passengers: DraftPassenger[]
  contactEmail: string
  contactPhone: string
  paymentMethod: PaymentMethod
}

type BookingState = {
  draft: BookingDraft
  actions: {
    setTripId(tripId: string | null): void
    setSelectedSeatIds(seatIds: string[]): void
    setPassengers(passengers: DraftPassenger[]): void
    setContact(details: { email: string; phone: string }): void
    setPaymentMethod(method: PaymentMethod): void
    reset(): void
  }
}

const createInitialDraft = (): BookingDraft => ({
  tripId: null,
  selectedSeatIds: [],
  passengers: [{ firstName: '', lastName: '', type: 'ADULT' }],
  contactEmail: '',
  contactPhone: '',
  paymentMethod: 'CARD',
})

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      draft: createInitialDraft(),
      actions: {
        setTripId: (tripId) =>
          set((s) => ({ ...s, draft: { ...s.draft, tripId } })),
        setSelectedSeatIds: (seatIds) =>
          set((s) => ({ ...s, draft: { ...s.draft, selectedSeatIds: Array.from(new Set(seatIds)) } })),
        setPassengers: (passengers) =>
          set((s) => ({ ...s, draft: { ...s.draft, passengers } })),
        setContact: ({ email, phone }) =>
          set((s) => ({
            ...s,
            draft: { ...s.draft, contactEmail: email, contactPhone: phone },
          })),
        setPaymentMethod: (method) =>
          set((s) => ({ ...s, draft: { ...s.draft, paymentMethod: method } })),
        reset: () => set(() => ({ draft: createInitialDraft() })),
      },
    }),
    {
      name: 'busgo:booking-draft',
      partialize: (state) => ({ draft: state.draft }),
    },
  ),
)
