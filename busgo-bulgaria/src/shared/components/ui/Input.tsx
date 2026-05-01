import { type InputHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-200">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 placeholder:text-slate-500',
          'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30',
          error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-400/30' : '',
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-sm text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
})

