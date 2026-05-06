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
    'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:active:bg-cyan-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400',
  secondary:
    'border border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100 active:bg-cyan-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200 dark:hover:border-cyan-300/50 dark:hover:bg-cyan-400/15 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500',
  ghost:
    'bg-transparent text-slate-700 hover:bg-white/80 hover:text-slate-950 active:bg-white disabled:text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-800 dark:disabled:text-slate-500',
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
