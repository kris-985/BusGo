import { type HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800 bg-slate-950/60 shadow-sm shadow-black/20',
        className,
      )}
      {...props}
    />
  )
}

