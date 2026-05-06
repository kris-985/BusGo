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
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-slate-950 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
          'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20',
          error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-400/30' : '',
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-sm text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
})
