import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

type Props = {
  roles?: Array<'admin' | 'medico' | 'viewer'>
}

const PrivateRoute: React.FC<Props> = ({ roles }) => {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export default PrivateRoute