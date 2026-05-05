import { Outlet } from 'react-router-dom'

import { Navbar } from '@/shared/components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#eef8f2_0%,#f3f6f8_34%,#f3f6f8_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl py-6 container-px sm:py-8 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-8">
        <div className="mx-auto max-w-6xl text-sm font-medium text-slate-500 container-px">
          © {new Date().getFullYear()} BusGo Bulgaria
        </div>
      </footer>
    </div>
  )
}
