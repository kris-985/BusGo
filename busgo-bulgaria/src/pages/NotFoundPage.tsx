import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/Card'

export function NotFoundPage() {
  return (
    <Card className="p-6">
      <div className="text-sm font-medium text-slate-100">Page not found</div>
      <div className="mt-2 text-sm text-slate-400">The page you requested does not exist.</div>
      <div className="mt-4">
        <Link
          to={routes.home()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 active:bg-slate-800"
        >
          Go home
        </Link>
      </div>
    </Card>
  )
}

