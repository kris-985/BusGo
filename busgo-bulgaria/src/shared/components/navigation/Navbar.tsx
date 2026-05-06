import { Link, NavLink, useNavigate } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { cn } from '@/shared/lib/cn'

const navLinkBase =
  'rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950'

export function Navbar() {
  const auth = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    auth.logout()
    navigate(routes.home())
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-col gap-3 py-3 container-px lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <Link to={routes.home()} className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 shadow-[0_14px_30px_rgba(15,23,42,0.22)]">
            <span className="text-sm font-black text-white">BG</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-black text-slate-950">BusGo Bulgaria</div>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              Intercity ticketing platform
            </div>
          </div>
        </Link>

        <nav className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-white/80 bg-slate-100/70 p-1 shadow-inner shadow-slate-200/70 lg:w-auto">
          <NavLink
            to={routes.home()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
          >
            Home
          </NavLink>
          <NavLink
            to={routes.searchResults()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
          >
            Search
          </NavLink>
          <NavLink
            to={routes.about()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
          >
            About
          </NavLink>
          <NavLink
            to={routes.myBookings()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
          >
            My bookings
          </NavLink>
          {auth.user?.role === 'admin' ? (
            <NavLink
              to={routes.admin()}
              className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
            >
              Admin
            </NavLink>
          ) : null}
          <NavLink
            to={routes.profile()}
            className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
          >
            Profile
          </NavLink>
          {auth.isAuthenticated ? (
            <button className={navLinkBase} type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink
              to={routes.auth()}
              className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
