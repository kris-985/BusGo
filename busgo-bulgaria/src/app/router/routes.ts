export const routes = {
  home: () => '/',
  searchResults: () => '/search-results',
  seatSelection: (tripId: string) => `/seat-selection/${tripId}`,
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
