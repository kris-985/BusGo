import { Navigate, useParams } from 'react-router-dom'

import { routes } from '@/app/router/routes'

export function LegacyTripRedirect() {
  const { tripId } = useParams()
  return <Navigate to={routes.seatSelection(tripId ?? '')} replace />
}

export function LegacyConfirmationRedirect() {
  const { bookingId } = useParams()
  return <Navigate to={routes.success(bookingId ?? '')} replace />
}
