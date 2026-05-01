import type { Trip } from '@/entities/trip/types'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export type TripsListProps = {
  trips: Trip[]
  onSelect(tripId: string): void
}

export function TripsList({ trips, onSelect }: TripsListProps) {
  if (trips.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-sm text-slate-300">No trips found.</div>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {trips.map((t) => (
        <Card key={t.id} className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="font-medium text-slate-100">
                  {t.from.name} → {t.to.name}
                </span>
                <span className="text-slate-500">•</span>
                <span>
                  {formatDate(t.departureTime)} • {formatTime(t.departureTime)}–{formatTime(t.arrivalTime)}
                </span>
                <span className="text-slate-500">•</span>
                <span>{t.operator.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-900 px-2 py-1">
                  {t.durationMinutes} min
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-1">
                  Seats left: {t.seatsLeft}
                </span>
                {t.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-slate-900 px-2 py-1">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <div className="text-right">
                <div className="text-sm text-slate-400">from</div>
                <div className="text-lg font-semibold text-slate-100">
                  {formatMoney(t.price)}
                </div>
              </div>
              <Button onClick={() => onSelect(t.id)} size="md">
                Select
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

