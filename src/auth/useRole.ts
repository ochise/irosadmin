import { useAuth } from './AuthProvider'
export const useHasRole = (roles: string[] | string) => {
  const { user } = useAuth()

  if(!user) return false
  const allowed = Array.isArray(roles) ? roles : [roles]
  return allowed.includes(user.role)
}
