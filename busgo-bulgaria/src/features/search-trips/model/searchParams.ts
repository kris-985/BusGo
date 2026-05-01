export type TripSearchFormValues = {
  fromCityId: string
  toCityId: string
  date: string // YYYY-MM-DD
  passengers: number
}

export function parsePassengers(value: string | null) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(9, Math.max(1, Math.floor(n)))
}

