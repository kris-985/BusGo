import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { SearchForm } from '@/features/search-trips/ui/SearchForm'
import { Card } from '@/shared/components/ui/Card'

export function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
          Book bus tickets across Bulgaria
        </h1>
        <p className="max-w-2xl text-slate-300">
          Fast search, clear prices, and a smooth checkout flow. Demo data is included so the
          project runs end-to-end immediately.
        </p>
        <SearchForm />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm font-medium text-slate-100">Feature-based architecture</div>
          <div className="mt-2 text-sm text-slate-400">Clean separation: entities, features, shared.</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-medium text-slate-100">Typed API layer</div>
          <div className="mt-2 text-sm text-slate-400">Swappable client: mock today, HTTP tomorrow.</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-medium text-slate-100">State + data fetching</div>
          <div className="mt-2 text-sm text-slate-400">Zustand for draft booking, React Query for server.</div>
        </Card>
      </section>

      <div>
        <Link
          to={routes.searchResults()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 active:bg-slate-800"
        >
          Go to search
        </Link>
      </div>
    </div>
  )
}

