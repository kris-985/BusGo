import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/Card'
import { Select } from '@/shared/components/ui/Select'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useCitiesQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { todayYmd } from '@/shared/lib/format'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citiesQuery = useCitiesQuery()

  const cities = citiesQuery.data ?? []

  const initial = useMemo(() => {
    return {
      fromCityId: searchParams.get('from') ?? 'sof',
      toCityId: searchParams.get('to') ?? 'pld',
      date: searchParams.get('date') ?? todayYmd(),
      passengers: parsePassengers(searchParams.get('passengers')),
    }
  }, [searchParams])

  const [values, setValues] = useState(initial)

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

        <Card className="p-5">
          <form
            className="grid gap-3 md:grid-cols-12 md:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              const params = new URLSearchParams()
              params.set('from', values.fromCityId)
              params.set('to', values.toCityId)
              params.set('date', values.date)
              params.set('passengers', String(values.passengers))
              navigate(`${routes.searchResults()}?${params.toString()}`)
            }}
          >
            <div className="md:col-span-4">
              <Select
                label="From city"
                value={values.fromCityId}
                onChange={(e) => setValues((v) => ({ ...v, fromCityId: e.target.value }))}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-4">
              <Select
                label="To city"
                value={values.toCityId}
                onChange={(e) => setValues((v) => ({ ...v, toCityId: e.target.value }))}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-3">
              <Input
                label="Date"
                type="date"
                value={values.date}
                onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              />
            </div>

            <div className="md:col-span-1">
              <Button className="w-full" type="submit" disabled={citiesQuery.isLoading}>
                Search
              </Button>
            </div>
          </form>
        </Card>
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
    </div>
  )
}

