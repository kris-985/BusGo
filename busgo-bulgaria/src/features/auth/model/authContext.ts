import { createContext, useContext } from 'react'

import type { AuthUser, LoginInput, SignupInput } from '@/shared/api/apiClient'

export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login(input: LoginInput): Promise<void>
  signup(input: SignupInput): Promise<void>
  logout(): void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
