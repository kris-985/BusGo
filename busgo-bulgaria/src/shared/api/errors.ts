import type { ApiError, ApiErrorCode } from '@/shared/api/types'

export class ApiRequestError extends Error {
  code: ApiErrorCode
  status?: number
  details?: unknown

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.code = error.code
    this.status = error.status
    this.details = error.details
  }
}

export function throwApiError(error: ApiError): never {
  throw new ApiRequestError(error)
}

export function getUserFriendlyErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback

  const message = error.message.toLowerCase()

  if (message.includes('payment_declined')) {
    return 'Payment was declined. Try another card or choose cash on board.'
  }

  if (message.includes('seat already occupied')) {
    return 'One of your selected seats was just taken. Please choose another available seat.'
  }

  if (message.includes('no seats available')) {
    return 'This trip is fully booked. Please choose another departure.'
  }

  if (message.includes('no seats selected')) {
    return 'Select at least one available seat before continuing.'
  }

  if (message.includes('too many seats')) {
    return 'You can book up to 6 seats at once.'
  }

  if (message.includes('seat map')) {
    return 'Seat availability is temporarily unavailable. Please try again.'
  }

  if (message.includes('trip not found')) {
    return 'We could not find that trip. Please choose another trip.'
  }

  if (message.includes('booking not found')) {
    return 'We could not find that booking. Please check your bookings list.'
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'We could not reach the server. Check your connection and try again.'
  }

  return fallback
}
