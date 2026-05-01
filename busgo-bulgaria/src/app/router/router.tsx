import { createBrowserRouter } from 'react-router-dom'
import { Navigate, useParams } from 'react-router-dom'

import { AppLayout } from '@/shared/layouts/AppLayout'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { MyBookingsPage } from '@/pages/MyBookingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SearchResultsPage } from '@/pages/SearchResultsPage'
import { SeatSelectionPage } from '@/pages/SeatSelectionPage'
import { SuccessPage } from '@/pages/SuccessPage'
import { routes } from '@/app/router/routes'

function LegacyTripRedirect() {
  const { tripId } = useParams()
  return <Navigate to={routes.seatSelection(tripId ?? '')} replace />
}

function LegacyConfirmationRedirect() {
  const { bookingId } = useParams()
  return <Navigate to={routes.success(bookingId ?? '')} replace />
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: routes.searchResults(), element: <SearchResultsPage /> },
      { path: `${routes.seatSelection(':tripId')}`, element: <SeatSelectionPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: `${routes.success(':bookingId')}`, element: <SuccessPage /> },
      { path: routes.myBookings(), element: <MyBookingsPage /> },
      { path: routes.profile(), element: <ProfilePage /> },

      // Legacy paths (redirects)
      { path: routes.search(), element: <Navigate to={routes.searchResults()} replace /> },
      { path: `${routes.trip(':tripId')}`, element: <LegacyTripRedirect /> },
      { path: `${routes.confirmation(':bookingId')}`, element: <LegacyConfirmationRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

