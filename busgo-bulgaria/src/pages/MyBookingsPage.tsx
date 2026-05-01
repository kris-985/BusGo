import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/Card'

function readStoredBookingIds(): string[] {
  try {
    const raw = localStorage.getItem('busgo:bookingIds')
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function MyBookingsPage() {
  const bookingIds = readStoredBookingIds()

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">My bookings</h1>
        <p className="mt-2 text-sm text-slate-400">
          This demo stores your recent booking IDs locally on this device.
        </p>
      </div>

      {bookingIds.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-slate-300">No bookings yet.</div>
          <div className="mt-4">
            <Link
              to={routes.searchResults()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 active:bg-slate-800"
            >
              Search trips
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bookingIds.map((id) => (
            <Card key={id} className="flex items-center justify-between gap-3 p-5">
              <div>
                <div className="text-sm text-slate-400">Booking</div>
                <div className="mt-1 font-mono text-sm text-slate-100">{id}</div>
              </div>
              <Link
                to={routes.success(id)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-900 active:bg-slate-950"
              >
                Open
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

