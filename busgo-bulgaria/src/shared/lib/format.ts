import type { Money } from '@/shared/types/common'

export function formatMoney(m: Money) {
  const currency = m.currency === 'BGN' ? 'лв.' : m.currency
  return `${m.amount.toFixed(2)} ${currency}`
}

export function formatTime(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('bg-BG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d)
}

export function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

