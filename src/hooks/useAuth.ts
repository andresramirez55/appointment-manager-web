import { useState, useCallback } from 'react'
import { authApi, type Professional } from '../api/client'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [professional, setProfessional] = useState<Professional | null>(() => {
    const stored = localStorage.getItem('professional')
    return stored ? (JSON.parse(stored) as Professional) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await authApi.login({ email, password })
      localStorage.setItem('token', resp.token)
      localStorage.setItem('professional', JSON.stringify(resp.professional))
      setToken(resp.token)
      setProfessional(resp.professional)
      return true
    } catch {
      setError('Email o contraseña incorrectos')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('professional')
    setToken(null)
    setProfessional(null)
  }, [])

  return { token, professional, loading, error, login, logout }
}
