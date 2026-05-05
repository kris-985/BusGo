import { Link, NavLink } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { cn } from '@/shared/lib/cn'

const navLinkBase =
  'rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 py-3 container-px sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <Link to={routes.home()} className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 shadow-sm shadow-emerald-900/20">
            <span className="text-sm font-black text-white">BG</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-black text-slate-950">BusGo Bulgaria</div>
            <div className="text-xs font-medium text-slate-500">Bus tickets</div>
          </div>
        </Link>

        <nav className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          <NavLink
            to={routes.searchResults()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-blue-50 text-blue-700' : '')}
          >
            Search
          </NavLink>
          <NavLink
            to={routes.myBookings()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-blue-50 text-blue-700' : '')}
          >
            My bookings
          </NavLink>
          <NavLink
            to={routes.admin()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-blue-50 text-blue-700' : '')}
          >
            Admin
          </NavLink>
          <NavLink
            to={routes.profile()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-blue-50 text-blue-700' : '')}
          >
            Profile
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
