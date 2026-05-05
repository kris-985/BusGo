import { Card } from '@/shared/components/ui/Card'

export function ProfilePage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
          Account center
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          A richer account area prepared for saved passengers, preferences, and travel history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Saved passengers', 'Store passenger profiles for faster repeat checkout.'],
          ['Travel preferences', 'Default departure city, seat preferences, and payment mode.'],
          ['Support profile', 'Contact data and booking lookup details for operators.'],
        ].map(([title, detail]) => (
          <Card key={title} className="p-6">
            <div className="text-sm font-black uppercase tracking-wide text-cyan-700">{title}</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">{detail}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
