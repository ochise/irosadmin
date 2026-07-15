import React from 'react'
import {useHasRole} from '../auth/useRole'
import { Navigate } from 'react-router-dom'
export default function PrivateRoute({ children } : { children: JSX.Element }){
  const token = localStorage.getItem('iros_token')
  // const hasRole = useHasRole(['admin', 'merchant'])
  if(!token) return <Navigate to="/login" replace />
  // if(!hasRole) return <Navigate to="/login" replace />
  
  return children
}
