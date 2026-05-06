import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { cn } from '@/shared/lib/cn'

const navLinkBase =
  'rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950'
const mobileNavLinkBase =
  'flex h-11 items-center rounded-xl px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950'

export function Navbar() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', to: routes.home() },
    { label: 'Search', to: routes.searchResults() },
    { label: 'About', to: routes.about() },
    { label: 'My bookings', to: routes.myBookings() },
    ...(auth.user?.role === 'admin' ? [{ label: 'Admin', to: routes.admin() }] : []),
    { label: 'Profile', to: routes.profile() },
  ]

  function handleLogout() {
    auth.logout()
    setIsMenuOpen(false)
    navigate(routes.home())
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl py-3 container-px lg:py-0">
        <div className="flex min-h-14 items-center justify-between gap-3 lg:min-h-20">
        <Link to={routes.home()} className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
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

        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="relative block h-5 w-5">
            <span
              className={cn(
                'absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-slate-950 transition-all duration-300',
                isMenuOpen ? 'translate-y-2 rotate-45' : '',
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-slate-950 transition-all duration-300',
                isMenuOpen ? 'opacity-0' : '',
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-slate-950 transition-all duration-300',
                isMenuOpen ? '-translate-y-1.5 -rotate-45' : '',
              )}
            />
          </span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-slate-100/70 p-1 shadow-inner shadow-slate-200/70 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(navLinkBase, isActive ? 'bg-white text-slate-950 shadow-sm' : '')}
            >
              {link.label}
            </NavLink>
          ))}
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

        <div
          className={cn(
            'grid overflow-hidden transition-all duration-300 ease-out lg:hidden',
            isMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <nav className="min-h-0">
            <div
              className={cn(
                'mt-3 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300',
                isMenuOpen ? 'translate-y-0' : '-translate-y-2',
              )}
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(mobileNavLinkBase, isActive ? 'bg-slate-950 text-white hover:bg-slate-900 hover:text-white' : '')
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              {auth.isAuthenticated ? (
                <button className={cn(mobileNavLinkBase, 'w-full')} type="button" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <NavLink
                  to={routes.auth()}
                  className={({ isActive }) =>
                    cn(mobileNavLinkBase, isActive ? 'bg-slate-950 text-white hover:bg-slate-900 hover:text-white' : '')
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
