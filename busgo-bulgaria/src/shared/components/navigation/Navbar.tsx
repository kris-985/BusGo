import { Link, NavLink } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { cn } from '@/shared/lib/cn'

const navLinkBase =
  'rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100'

export function Navbar() {
  return (
    <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between container-px">
        <Link to={routes.home()} className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/30">
            <span className="text-sm font-semibold text-indigo-200">BG</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-100">BusGo Bulgaria</div>
            <div className="text-xs text-slate-400">Bus tickets</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink
            to={routes.searchResults()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-slate-900 text-slate-100' : '')}
          >
            Search
          </NavLink>
          <NavLink
            to={routes.myBookings()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-slate-900 text-slate-100' : '')}
          >
            My bookings
          </NavLink>
          <NavLink
            to={routes.profile()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-slate-900 text-slate-100' : '')}
          >
            Profile
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

