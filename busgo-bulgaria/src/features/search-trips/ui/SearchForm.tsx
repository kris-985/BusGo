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

export function SearchForm({ compact }: SearchFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citiesQuery = useCitiesQuery()

  const initial: TripSearchFormValues = useMemo(
    () => ({
      fromCityId: searchParams.get('from') ?? 'sof',
      toCityId: searchParams.get('to') ?? 'pld',
      date: searchParams.get('date') ?? todayYmd(),
      passengers: parsePassengers(searchParams.get('passengers')),
    }),
    [searchParams],
  )

  const [values, setValues] = useState<TripSearchFormValues>(initial)

  const cities = citiesQuery.data ?? []

  return (
    <form
      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-12 md:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        const params = new URLSearchParams()
        params.set('from', values.fromCityId)
        params.set('to', values.toCityId)
        params.set('date', values.date)
        params.set('passengers', String(values.passengers))
        navigate(`${routes.search()}?${params.toString()}`)
      }}
    >
      <div className={compact ? 'md:col-span-4' : 'md:col-span-3'}>
        <Select
          label="From"
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
      <div className={compact ? 'md:col-span-4' : 'md:col-span-3'}>
        <Select
          label="To"
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
      <div className={compact ? 'md:col-span-2' : 'md:col-span-3'}>
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
      <div className="md:col-span-1">
        <Button className="w-full">Search</Button>
      </div>
    </form>
  )
}

