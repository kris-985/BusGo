import { Card } from '@/shared/components/ui/Card'

export function AboutPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
          About BusGo
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">About</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          BusGo Bulgaria is a demo intercity ticketing platform for searching departures, choosing seats, buying tickets, and tracking operator revenue.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['For passengers', 'Accounts keep every purchased ticket connected to the profile and booking wallet.'],
          ['For admins', 'MongoDB users with role admin can see bookings, buyers, revenue, and route inventory.'],
          ['For routes', 'The app covers key Bulgarian city pairs with live seat occupancy and checkout status.'],
        ].map(([title, detail]) => (
          <Card key={title} className="p-6">
            <div className="text-sm font-black uppercase tracking-wide text-cyan-700">{title}</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">{detail}</div>
          </Card>
        ))}
      </section>
    </div>
  )
}
