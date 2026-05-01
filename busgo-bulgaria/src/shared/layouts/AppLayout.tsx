import { Outlet } from 'react-router-dom'

import { Navbar } from '@/shared/components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <Navbar />

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

