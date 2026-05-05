import { Card } from '@/shared/components/ui/Card'

export function ProfilePage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Profile management isn’t implemented in this demo yet.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-medium text-slate-950">Coming soon</div>
        <div className="mt-2 text-sm text-slate-600">
          This page is a placeholder for account details, saved passengers, and preferences.
        </div>
      </Card>
    </div>
  )
}

