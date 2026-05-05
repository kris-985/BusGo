import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SeatSelectionState = {
  selectedSeatIdsByTripId: Record<string, string[]>
  actions: {
    toggleSeat(tripId: string, seatId: string): void
    setSeats(tripId: string, seatIds: string[]): void
    clearTrip(tripId: string): void
    clearAll(): void
  }
}

const emptySelectedSeatIds: string[] = []

function uniqueSeatIds(seatIds: string[]) {
  return Array.from(new Set(seatIds)).filter(Boolean)
}

function sameSeatIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((seatId, index) => seatId === b[index])
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
        setSeats: (tripId, seatIds) =>
          set((s) => {
            const nextSeatIds = uniqueSeatIds(seatIds)
            const currentSeatIds = s.selectedSeatIdsByTripId[tripId] ?? emptySelectedSeatIds
            if (sameSeatIds(currentSeatIds, nextSeatIds)) return s

            return {
              ...s,
              selectedSeatIdsByTripId: {
                ...s.selectedSeatIdsByTripId,
                [tripId]: nextSeatIds,
              },
            }
          }),
        clearTrip: (tripId) =>
          set((s) => {
            if (!s.selectedSeatIdsByTripId[tripId]) return s

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
  return useSeatSelectionStore((s) => s.selectedSeatIdsByTripId[tripId] ?? emptySelectedSeatIds)
}
