import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useCitiesQuery } from '@/features/search-trips/api/queries'
import { parsePassengers, type TripSearchFormValues } from '@/features/search-trips/model/searchParams'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { todayYmd } from '@/shared/lib/format'

export type SearchFormProps = {
  compact?: boolean
}

const emptyCities: Array<{ id: string; name: string }> = []

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

export function SearchForm({ compact }: SearchFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citiesQuery = useCitiesQuery()

  const initial: TripSearchFormValues = useMemo(
    () => ({
      fromCityId: cleanSearchValue(searchParams.get('from'), 'Sofia'),
      toCityId: cleanSearchValue(searchParams.get('to'), 'Plovdiv'),
      date: cleanSearchValue(searchParams.get('date'), todayYmd()),
      passengers: parsePassengers(searchParams.get('passengers')),
    }),
    [searchParams],
  )

  const [values, setValues] = useState<TripSearchFormValues>(initial)

  const cities = citiesQuery.data ?? emptyCities

  return (
    <form
      className="grid gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-12 md:items-end"
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
        console.debug('[BusGo SearchForm] submit', nextValues)
        navigate(`${routes.searchResults()}?${params.toString()}`)
      }}
    >
      <div className={compact ? 'md:col-span-3' : 'md:col-span-3'}>
        <Select
          label="From"
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
      <div className={compact ? 'md:col-span-3' : 'md:col-span-3'}>
        <Select
          label="To"
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
      <div className={compact ? 'md:col-span-2' : 'md:col-span-2'}>
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
      </div>
      <div className={compact ? 'md:col-span-2' : 'md:col-span-2'}>
        <Input
          label="Passengers"
          type="number"
          min={1}
          max={9}
          value={values.passengers}
          onChange={(e) =>
            setValues((v) => ({ ...v, passengers: parsePassengers(e.target.value) }))
          }
        />
      </div>
      <div className="md:col-span-2">
        <Button className="w-full" type="submit">Search</Button>
      </div>
    </form>
  )
}
