import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useCitiesQuery } from '@/features/search-trips/api/queries'
import { parsePassengers } from '@/features/search-trips/model/searchParams'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { todayYmd } from '@/shared/lib/format'
import heroUrl from '@/assets/hero.png'

function cleanSearchValue(value: string | null, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function resolveCitySelectValue(value: string, cities: Array<{ id: string; name: string }>) {
  const normalized = normalizeSearchValue(value)
  const city = cities.find(
    (item) =>
      normalizeSearchValue(item.id) === normalized ||
      normalizeSearchValue(item.name) === normalized,
  )

  return city?.name ?? value.trim()
}

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citiesQuery = useCitiesQuery()
  const cities = citiesQuery.data ?? []

  const initial = useMemo(() => {
    return {
      fromCityId: cleanSearchValue(searchParams.get('from'), 'Sofia'),
      toCityId: cleanSearchValue(searchParams.get('to'), 'Plovdiv'),
      date: cleanSearchValue(searchParams.get('date'), todayYmd()),
      passengers: parsePassengers(searchParams.get('passengers')),
    }
  }, [searchParams])

  const [values, setValues] = useState(initial)

  return (
    <div className="grid gap-8">
      <section
        className="surface-grid relative overflow-hidden rounded-[2rem] bg-slate-950 px-5 pb-5 pt-20 shadow-[0_28px_70px_rgba(15,23,42,0.25)] sm:px-8 sm:pb-8 lg:min-h-[620px] lg:px-10 lg:pt-24"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2,6,23,0.9), rgba(15,23,42,0.72), rgba(15,23,42,0.18)), url(${heroUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Live Bulgarian departures
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-white text-balance sm:text-6xl lg:text-7xl">
            BusGo Bulgaria
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
            Compare routes, see live seats, book passengers, and hand operators a clear admin view for every trip.
          </p>

          <div className="mt-8 grid gap-3 text-white sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-3xl font-black">20+</div>
              <div className="mt-1 text-sm text-slate-200">daily demo departures</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-3xl font-black">40</div>
              <div className="mt-1 text-sm text-slate-200">seat maps per coach</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-3xl font-black">Live</div>
              <div className="mt-1 text-sm text-slate-200">occupancy and booking state</div>
            </div>
          </div>
        </div>

        <Card className="mt-10 border-white/80 p-4 sm:p-5">
          <form
            className="grid gap-3 md:grid-cols-12 md:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              const nextValues = {
                ...values,
                fromCityId: resolveCitySelectValue(values.fromCityId, cities),
                toCityId: resolveCitySelectValue(values.toCityId, cities),
                date: values.date.trim(),
              }
              const params = new URLSearchParams()
              params.set('from', nextValues.fromCityId)
              params.set('to', nextValues.toCityId)
              params.set('date', nextValues.date)
              params.set('passengers', String(nextValues.passengers))
              navigate(`${routes.searchResults()}?${params.toString()}`)
            }}
          >
            <div className="md:col-span-3">
              <Select
                label="From city"
                value={resolveCitySelectValue(values.fromCityId, cities)}
                onChange={(e) => setValues((v) => ({ ...v, fromCityId: e.target.value }))}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select
                label="To city"
                value={resolveCitySelectValue(values.toCityId, cities)}
                onChange={(e) => setValues((v) => ({ ...v, toCityId: e.target.value }))}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0 md:col-span-2">
              <Input
                label="Date"
                type="date"
                className="min-w-0 max-w-full px-3 text-sm"
                value={values.date}
                onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Passengers"
                type="number"
                min={1}
                max={9}
                value={values.passengers}
                onChange={(e) => setValues((v) => ({ ...v, passengers: parsePassengers(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button className="h-12 w-full" type="submit" disabled={citiesQuery.isLoading}>
                Search trips
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Passenger booking', 'Search by city and date, choose a departure, pick seats, and confirm passenger details.'],
          ['Operator dashboard', 'Monitor route inventory, bookings, revenue, and live seat occupancy from one dense admin view.'],
          ['Persistent routes', 'Create new scheduled routes from the admin panel and store them in the local server database.'],
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
