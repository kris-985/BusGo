import type { Payment } from '@/entities/payment/types'
import type {
  ApiClient,
  BookSeatsInput,
  CreateBookingInput,
  CreateRouteInput,
  LoginInput,
  PayInput,
  SearchTripsParams,
  SignupInput,
} from '@/shared/api/apiClient'
import type { ApiError, ApiResult } from '@/shared/api/types'

const baseUrl = import.meta.env.PROD
  ? ''
  : import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const authTokenKey = 'busgo:authToken'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

function errorCodeFromStatus(status?: number): ApiError['code'] {
  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409 || status === 422) return 'VALIDATION'
  if (!status) return 'NETWORK'
  return 'UNKNOWN'
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const token = localStorage.getItem(authTokenKey)
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
      ...init,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: errorCodeFromStatus(response.status),
          message: data?.message ?? 'Request failed',
          status: response.status,
          details: data,
        },
      }
    }

    return ok(data as T)
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    }
  }
}

export const httpApi: ApiClient = {
  auth: {
    login(input: LoginInput) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    signup(input: SignupInput) {
      return request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    me() {
      return request('/auth/me')
    },
  },
  cities: {
    list() {
      return request('/cities')
    },
  },
  routes: {
    list() {
      return request('/routes')
    },
    adminList() {
      return request('/admin/routes')
    },
    create(input: CreateRouteInput) {
      return request('/routes', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
  },
  trips: {
    search(params: SearchTripsParams) {
      const searchParams = new URLSearchParams({
        from: params.fromCityId.trim(),
        to: params.toCityId.trim(),
        date: params.date.trim(),
      })
      console.debug('[BusGo httpApi.trips.search]', Object.fromEntries(searchParams))
      return request(`/routes/search?${searchParams.toString()}`)
    },
    byId(tripId: string, travelDate?: string) {
      const searchParams = new URLSearchParams()
      if (travelDate?.trim()) searchParams.set('date', travelDate.trim())
      const query = searchParams.toString()
      return request(`/routes/${encodeURIComponent(tripId)}${query ? `?${query}` : ''}`)
    },
  },
  seats: {
    availabilityByTrip(tripId: string) {
      return request(`/routes/${encodeURIComponent(tripId)}/seats`)
    },
    occupancySummary() {
      return request('/seats/occupancy')
    },
    async book(input: BookSeatsInput) {
      const res = await request<{ seatIds: string[] }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          tripId: input.tripId,
          seatIds: input.seatIds,
          passengers: input.seatIds.map(() => ({
            firstName: 'Seat',
            lastName: 'Hold',
            type: 'ADULT',
          })),
          contactEmail: 'seat-hold@busgo.local',
          contactPhone: '',
          paymentMethod: 'CASH_ON_BOARD',
        }),
      })
      if (!res.ok) return res
      return ok({ tripId: input.tripId, bookedSeatIds: res.data.seatIds })
    },
  },
  bookings: {
    list() {
      return request('/bookings')
    },
    adminList() {
      return request('/admin/bookings')
    },
    create(input: CreateBookingInput) {
      return request('/bookings', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    byId(bookingId: string) {
      return request(`/bookings/${encodeURIComponent(bookingId)}`)
    },
  },
  users: {
    adminList() {
      return request('/admin/users')
    },
  },
  payments: {
    pay(input: PayInput): Promise<ApiResult<Payment>> {
      return request('/payments', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
  },
}
