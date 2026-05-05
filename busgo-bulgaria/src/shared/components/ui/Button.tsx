import { type ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/shared/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none',
  secondary:
    'border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 active:bg-blue-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-600',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 disabled:text-slate-600',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-900/15 hover:bg-rose-500 active:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-normal transition-colors disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
})
