import { Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'

type ProtectedRouteProps = {
  children: ReactElement
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isLoading) {
    return (
      <Card className="flex items-center gap-3 p-6">
        <Spinner />
        <div className="text-sm text-slate-700">Checking account...</div>
      </Card>
    )
  }

  if (!auth.isAuthenticated) {
    return <Navigate to={routes.auth()} replace state={{ from: location }} />
  }

  if (adminOnly && auth.user?.role !== 'admin') {
    return <Navigate to={routes.home()} replace />
  }

  return children
}
