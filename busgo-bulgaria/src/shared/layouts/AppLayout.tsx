import { Outlet } from 'react-router-dom'

import { Navbar } from '@/shared/components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f6_42%,#e8edf3_100%)]">
      <Navbar />

      <main className="mx-auto max-w-7xl py-6 container-px sm:py-8 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/65 py-8 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-medium text-slate-500 container-px sm:flex-row sm:items-center sm:justify-between">
          <span>BusGo Bulgaria {new Date().getFullYear()}</span>
          <span>Operations console, ticketing, routes, and live seat inventory.</span>
        </div>
      </footer>
    </div>
  )
}
