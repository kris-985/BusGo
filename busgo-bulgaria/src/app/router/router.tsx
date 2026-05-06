import { createBrowserRouter } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

import { AppLayout } from '@/shared/layouts/AppLayout'
import { LegacyConfirmationRedirect, LegacyTripRedirect } from '@/app/router/LegacyRedirects'
import { AboutPage } from '@/pages/AboutPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AuthPage } from '@/pages/AuthPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { MyBookingsPage } from '@/pages/MyBookingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SearchResultsPage } from '@/pages/SearchResultsPage'
import { SeatSelectionPage } from '@/pages/SeatSelectionPage'
import { SuccessPage } from '@/pages/SuccessPage'
import { routes } from '@/app/router/routes'
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: routes.about(), element: <AboutPage /> },
      { path: routes.auth(), element: <AuthPage /> },
      { path: routes.searchResults(), element: <SearchResultsPage /> },
      { path: `${routes.seatSelection(':tripId')}`, element: <SeatSelectionPage /> },
      { path: '/checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: `${routes.success(':bookingId')}`, element: <ProtectedRoute><SuccessPage /></ProtectedRoute> },
      { path: routes.myBookings(), element: <ProtectedRoute><MyBookingsPage /></ProtectedRoute> },
      { path: routes.admin(), element: <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute> },
      { path: routes.profile(), element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },

      // Legacy paths (redirects)
      { path: routes.search(), element: <Navigate to={routes.searchResults()} replace /> },
      { path: `${routes.trip(':tripId')}`, element: <LegacyTripRedirect /> },
      { path: `${routes.confirmation(':bookingId')}`, element: <LegacyConfirmationRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
