import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { AuthContext, type AuthContextValue } from '@/features/auth/model/authContext'
import type { AuthUser } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { throwApiError } from '@/shared/api/errors'

const authTokenKey = 'busgo:authToken'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(authTokenKey))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const res = await apiClient.auth.me()
      if (!isMounted) return

      if (res.ok) {
        setUser(res.data)
      } else {
        localStorage.removeItem(authTokenKey)
        setToken(null)
        setUser(null)
      }
      setIsLoading(false)
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [token])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    async login(input) {
      const res = await apiClient.auth.login(input)
      if (!res.ok) throwApiError(res.error)
      localStorage.setItem(authTokenKey, res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
    },
    async signup(input) {
      const res = await apiClient.auth.signup(input)
      if (!res.ok) throwApiError(res.error)
      localStorage.setItem(authTokenKey, res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
    },
    logout() {
      localStorage.removeItem(authTokenKey)
      setToken(null)
      setUser(null)
    },
  }), [isLoading, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
