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
    'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-500 disabled:bg-slate-700',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-800 disabled:bg-slate-800/60',
  ghost:
    'bg-transparent text-slate-100 hover:bg-slate-900 active:bg-slate-950 disabled:text-slate-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-600 disabled:bg-slate-700',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
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
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
})

