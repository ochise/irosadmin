import React, { createContext, useContext, useEffect, useState } from 'react'
import api, { setAuthToken } from '../utils/api'
import { jwtDecode } from 'jwt-decode'

type User = { id: number, username: string, role: string, profiles:any } | null
const AuthContext = createContext({ user: null as User, login: async (u: string, p: string) => '', logout: () => { } })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null)
  useEffect(() => {
    const token = localStorage.getItem('iros_token')
    if (token) {
      setAuthToken(token); 
      try { const decoded: any = jwtDecode(token); 
        setUser({ id: decoded.id || 0, username: decoded.unique_name || decoded.name || decoded.sub || 'user', role: decoded['role'] || decoded.role || 'Agent', profiles: decoded['profiles'] || [] }) } catch { }
    }
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password })
    const token = res.data.token
    localStorage.setItem('iros_token', token)
    setAuthToken(token)
    try {
      const decoded: any = jwtDecode(token);    
      setUser({
        id: decoded.id || 0, username: decoded.unique_name ||
          decoded.name || decoded.sub || username, role: decoded['role'] ||
            decoded.role || 'Guest', profiles: decoded['profiles'] || []
      })
    } catch { setUser({ id: 0, username, role: 'Guest', profiles: [] }) }

    return token
  }

  const logout = () => {
    localStorage.removeItem('iros_token')
    setAuthToken(undefined)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
