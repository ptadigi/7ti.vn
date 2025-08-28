import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const location = useLocation()
  
  // Check localStorage for authentication (support legacy + new keys)
  const legacyToken = localStorage.getItem('jwt_token')
  const legacyUser = localStorage.getItem('user_data')
  const accessToken = localStorage.getItem('accessToken')
  const user = localStorage.getItem('user')
  const isAuthenticated = !!((legacyToken && legacyUser) || (accessToken && user))

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but trying to access login page
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard
    return <Navigate to="/" replace />
  }

  // Render children if authentication requirements are met
  return <>{children}</>
}

export default ProtectedRoute
