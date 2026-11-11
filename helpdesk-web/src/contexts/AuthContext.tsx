import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'
import { disconnectEcho } from '../lib/echo'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadUser() {
      if (!getToken()) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        if (active) setUser(response.data.data)
      } catch {
        clearToken()
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadUser()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    setToken(response.data.data.token)
    setUser(response.data.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // token mungkin sudah tidak valid; tetap bersihkan sesi lokal
    } finally {
      disconnectEcho()
      clearToken()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const response = await api.get('/auth/me')
    setUser(response.data.data)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }

  return context
}
