import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SeatSelectionState = {
  selectedSeatIdsByTripId: Record<string, string[]>
  actions: {
    toggleSeat(tripId: string, seatId: string): void
    clearTrip(tripId: string): void
    clearAll(): void
  }
}

export const useSeatSelectionStore = create<SeatSelectionState>()(
  persist(
    (set) => ({
      selectedSeatIdsByTripId: {},
      actions: {
        toggleSeat: (tripId, seatId) =>
          set((s) => {
            const current = s.selectedSeatIdsByTripId[tripId] ?? []
            const has = current.includes(seatId)
            const next = has ? current.filter((id) => id !== seatId) : [...current, seatId]
            return {
              ...s,
              selectedSeatIdsByTripId: { ...s.selectedSeatIdsByTripId, [tripId]: next },
            }
          }),
        clearTrip: (tripId) =>
          set((s) => {
            const next = { ...s.selectedSeatIdsByTripId }
            delete next[tripId]
            return { ...s, selectedSeatIdsByTripId: next }
          }),
        clearAll: () => set(() => ({ selectedSeatIdsByTripId: {} })),
      },
    }),
    {
      name: 'busgo:seat-selection',
      partialize: (state) => ({ selectedSeatIdsByTripId: state.selectedSeatIdsByTripId }),
    },
  ),
)

export function useSelectedSeatIds(tripId: string) {
  return useSeatSelectionStore((s) => s.selectedSeatIdsByTripId[tripId] ?? [])
}
