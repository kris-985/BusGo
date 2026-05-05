import { type HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/80',
        className,
      )}
      {...props}
    />
  )
}
