export const routes = {
  home: () => '/',
  search: () => '/search',
  trip: (tripId: string) => `/trips/${tripId}`,
  checkout: () => '/checkout',
  confirmation: (bookingId: string) => `/confirmation/${bookingId}`,
} as const

