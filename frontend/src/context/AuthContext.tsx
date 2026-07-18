import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../services/api'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('fbm_token')
    const savedUser = localStorage.getItem('fbm_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('fbm_token')
        localStorage.removeItem('fbm_user')
      }
    }
    setLoading(false)
  }, [])

  const persist = (data: { user: AuthUser; token: string }) => {
    localStorage.setItem('fbm_token', data.token)
    localStorage.setItem('fbm_user', JSON.stringify(data.user))
    setUser(data.user)
    setToken(data.token)
  }

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    persist(data)
  }

  const register = async (email: string, password: string, name: string) => {
    const data = await authApi.register(email, password, name)
    persist(data)
  }

  const logout = () => {
    localStorage.removeItem('fbm_token')
    localStorage.removeItem('fbm_user')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
