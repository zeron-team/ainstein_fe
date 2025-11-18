import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '@/api/axios'

type Role = 'admin' | 'medico' | 'viewer'

type User = {
  id: string
  username: string
  role: Role
}

type AuthContextType = {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeJwt(token: string): any {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // rehidratar sesión
  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) {
      const payload = decodeJwt(saved)
      const now = Math.floor(Date.now() / 1000)
      if (payload?.exp && payload.exp > now) {
        setToken(saved)
        setUser({
          id: payload.sub,
          username: payload.username ?? 'user',
          role: payload.role as Role,
        })
      } else {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setError(null)
    const { data } = await api.post('/auth/login', { username, password })
    const tok = data?.access_token as string
    if (!tok) throw new Error('Respuesta de login inválida')

    localStorage.setItem('token', tok)
    setToken(tok)

    const payload = decodeJwt(tok)
    setUser({
      id: payload.sub,
      username: payload.username ?? username,
      role: payload.role as Role,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ token, user, loading, error, login, logout }),
    [token, user, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}