export const routes = {
  home: () => '/',
  about: () => '/about',
  auth: () => '/login',
  searchResults: () => '/search-results',
  seatSelection: (tripId: string, date?: string) => {
    const path = `/seat-selection/${tripId}`
    return date ? `${path}?date=${encodeURIComponent(date)}` : path
  },
  checkout: () => '/checkout',
  success: (bookingId: string) => `/success/${bookingId}`,
  myBookings: () => '/my-bookings',
  admin: () => '/admin',
  profile: () => '/profile',

  // Legacy aliases (kept for backwards compatibility)
  search: () => '/search',
  trip: (tripId: string) => `/trips/${tripId}`,
  confirmation: (bookingId: string) => `/confirmation/${bookingId}`,
} as const
