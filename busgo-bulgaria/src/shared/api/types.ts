export type ApiErrorCode =
  | 'NETWORK'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'UNKNOWN'

export type ApiError = {
  code: ApiErrorCode
  message: string
  status?: number
  details?: unknown
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

