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
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">
          {label}
        </span>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-12 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 text-slate-950 shadow-sm',
          'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100',
          error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-400/30' : '',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1.5 block text-sm text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
})
