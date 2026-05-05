import type { Trip } from '@/entities/trip/types'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { formatDate, formatMoney, formatTime } from '@/shared/lib/format'

export type TripsListProps = {
  trips: Trip[]
  onSelect(tripId: string): void
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200 ${className}`} />
}

export function RouteSearchSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Loading routes">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="p-4 sm:p-5">
          <div className="grid gap-5 md:grid-cols-12 md:items-center">
            <div className="md:col-span-6">
              <SkeletonLine className="h-4 w-20" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SkeletonLine className="h-5 w-36" />
                <SkeletonLine className="h-4 w-28" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonLine className="h-7 w-20" />
                <SkeletonLine className="h-7 w-24" />
                <SkeletonLine className="h-7 w-16" />
              </div>
            </div>
            <div className="md:col-span-3">
              <SkeletonLine className="h-4 w-16" />
              <SkeletonLine className="mt-3 h-5 w-24" />
            </div>
            <div className="md:col-span-2">
              <SkeletonLine className="h-4 w-28" />
              <SkeletonLine className="mt-3 h-5 w-10" />
            </div>
            <div className="md:col-span-1 md:flex md:justify-end">
              <SkeletonLine className="h-11 w-full md:w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function NoRoutesEmptyState() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[1fr_auto] md:items-stretch">
        <div className="p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700 ring-1 ring-blue-100">
            No match
          </div>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">
            No routes available
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            We could not find departures for this city pair. Try another destination or switch
            the direction of travel.
          </p>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 p-6 md:w-72 md:border-l md:border-t-0">
          <div className="text-sm font-black text-slate-950">Available route pairs</div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <span>Sofia {'->'} Plovdiv</span>
            <span>Sofia {'->'} Varna</span>
            <span>Plovdiv {'->'} Burgas</span>
            <span>Varna {'->'} Burgas</span>
            <span>Sofia {'->'} Stara Zagora</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function TripsList({ trips, onSelect }: TripsListProps) {
  if (trips.length === 0) {
    return <NoRoutesEmptyState />
  }

  return (
    <div className="grid gap-4">
      {trips.map((t) => (
        <Card key={t.id} className="p-4 transition-shadow hover:shadow-md hover:shadow-slate-200/90 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="text-base font-black text-slate-950">
                  {t.from.name} → {t.to.name}
                </span>
                <span className="text-slate-500">•</span>
                <span>
                  {formatDate(t.departureTime)} • {formatTime(t.departureTime)}–{formatTime(t.arrivalTime)}
                </span>
                <span className="text-slate-500">•</span>
                <span>{t.operator.name}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                  {t.durationMinutes} min
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-100">
                  Seats left: {t.seatsLeft}
                </span>
                {t.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <div className="text-right">
                <div className="text-sm text-slate-600">from</div>
                <div className="text-lg font-semibold text-slate-950">
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
