import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/shared/layouts/AppLayout'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { ConfirmationPage } from '@/pages/ConfirmationPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'
import { TripPage } from '@/pages/TripPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/trips/:tripId', element: <TripPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/confirmation/:bookingId', element: <ConfirmationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

