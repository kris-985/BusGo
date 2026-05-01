import { type SelectHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

export type SelectOption<T extends string> = { value: T; label: string }

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-200">
          {label}
        </span>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100',
          'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30',
          error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-400/30' : '',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1 block text-sm text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
})

