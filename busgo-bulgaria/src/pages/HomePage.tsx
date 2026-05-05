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
import heroUrl from '@/assets/hero.png'

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
      <section
        className="relative overflow-hidden rounded-lg bg-slate-950 px-4 pb-5 pt-16 shadow-xl shadow-slate-300/70 sm:px-6 sm:pb-6 sm:pt-20 lg:px-8 lg:pt-24"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.86), rgba(15,23,42,0.58), rgba(15,23,42,0.28)), url(${heroUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
            Bulgaria by bus
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Book bus tickets across Bulgaria
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
            Search routes, compare clear prices, choose seats, and finish checkout in one focused flow.
          </p>
        </div>

        <Card className="mt-8 border-white/80 p-4 shadow-2xl shadow-slate-950/20 sm:p-5">
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
          <div className="text-sm font-black text-slate-950">Smart route search</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">Find intercity departures with useful defaults and a fast booking path.</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-black text-slate-950">Clear trip cards</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">Departure times, availability, amenities, and prices are easy to scan.</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-black text-slate-950">Mobile-ready checkout</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">Larger controls and tighter summaries keep the flow usable on every screen.</div>
        </Card>
      </section>
    </div>
  )
}
