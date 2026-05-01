import { Link, NavLink, Outlet } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { cn } from '@/shared/lib/cn'

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between container-px">
          <Link to={routes.home()} className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/30">
              <span className="text-sm font-semibold text-indigo-200">BG</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-100">
                BusGo Bulgaria
              </div>
              <div className="text-xs text-slate-400">Bus tickets</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to={routes.search()}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive ? 'bg-slate-900 text-slate-100' : '',
                )
              }
            >
              Search
            </NavLink>
            <a
              href="https://www.busgo.bg"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-100"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl py-10 container-px">
        <Outlet />
      </main>

      <footer className="border-t border-slate-900 py-8">
        <div className="mx-auto max-w-6xl text-sm text-slate-500 container-px">
          © {new Date().getFullYear()} BusGo Bulgaria
        </div>
      </footer>
    </div>
  )
}

