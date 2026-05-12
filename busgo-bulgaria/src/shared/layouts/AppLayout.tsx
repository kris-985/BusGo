import { Link, Outlet } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { Navbar } from '@/shared/components/navigation/Navbar'
import { todayYmd } from '@/shared/lib/format'

const cityLinks = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora']

const popularRoutes = [
  ['Sofia', 'Plovdiv'],
  ['Sofia', 'Varna'],
  ['Plovdiv', 'Burgas'],
  ['Varna', 'Burgas'],
  ['Stara Zagora', 'Sofia'],
] as const

const publicHelpLinks = [
  { label: 'Home', to: routes.home() },
  { label: 'Search trips', to: routes.searchResults() },
  { label: 'About', to: routes.about() },
  { label: 'Account profile', to: routes.profile() },
]

function searchLink(from: string, to: string) {
  const params = new URLSearchParams({
    from,
    to,
    date: todayYmd(),
    passengers: '1',
  })
  return `${routes.searchResults()}?${params.toString()}`
}

function citySearchLink(city: string) {
  const destination = city === 'Sofia' ? 'Plovdiv' : 'Sofia'
  return searchLink(city, destination)
}

export function AppLayout() {
  const auth = useAuth()
  const helpLinks = [
    ...publicHelpLinks,
    ...(auth.isAuthenticated ? [{ label: 'My bookings', to: routes.myBookings() }] : []),
  ]

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f6_42%,#e8edf3_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#111827_100%)]">
      <Navbar />

      <main className="mx-auto max-w-7xl py-6 container-px sm:py-8 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/75 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto max-w-7xl py-10 container-px">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_2fr]">
            <div>
              <Link to={routes.home()} className="inline-flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                  <span className="text-sm font-black text-white">BG</span>
                </div>
                <div>
                  <div className="text-base font-black text-slate-950">BusGo Bulgaria</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Intercity routes and seat booking</div>
                </div>
              </Link>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-600">
                Compare departures, choose seats, and manage bookings for Bulgaria's main intercity routes.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                  <div className="text-xl font-black text-slate-950">5</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Cities</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                  <div className="text-xl font-black text-slate-950">20</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">City pairs</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                  <div className="text-xl font-black text-slate-950">Live</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Seats</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <div className="text-sm font-black text-slate-950">Popular routes</div>
                <div className="mt-4 grid gap-2">
                  {popularRoutes.map(([from, to]) => (
                    <Link
                      key={`${from}-${to}`}
                      to={searchLink(from, to)}
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-cyan-700"
                    >
                      {from} to {to}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-950">Cities</div>
                <div className="mt-4 grid gap-2">
                  {cityLinks.map((city) => (
                    <Link
                      key={city}
                      to={citySearchLink(city)}
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-cyan-700"
                    >
                      Bus from {city}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-950">Useful links</div>
                <div className="mt-4 grid gap-2">
                  {helpLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-cyan-700"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>BusGo Bulgaria {new Date().getFullYear()}</span>
            <span>Operations console, ticketing, routes, and live seat inventory.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
