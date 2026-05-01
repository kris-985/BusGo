import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { createQueryClient } from '@/app/query/queryClient'
import { router } from '@/app/router/router'

const queryClient = createQueryClient()

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

