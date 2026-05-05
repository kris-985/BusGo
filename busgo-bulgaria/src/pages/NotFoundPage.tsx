import { Link } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/Card'

export function NotFoundPage() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-slate-950 p-8 text-white">
        <div className="text-sm font-black uppercase tracking-wide text-cyan-200">404</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Page not found</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
          The requested screen is not part of the BusGo workspace.
        </p>
      </div>
      <div className="p-6">
        <Link
          to={routes.home()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Go home
        </Link>
      </div>
    </Card>
  )
}
