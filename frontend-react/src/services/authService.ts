import { apiClient, ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { User, LoginCredentials, RegisterData } from '@/types'

export class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    user: User
    accessToken: string
    refreshToken: string
  }>> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    
    if (response.success && response.data) {
      // Normalize backend keys: support accessToken | access_token | token
      // and refreshToken | refresh_token
      const data: any = response.data
      const accessToken = data.accessToken || data.access_token || data.token
      const refreshToken = data.refreshToken || data.refresh_token
      const user = data.user || data.profile || null

      if (accessToken) localStorage.setItem('accessToken', accessToken)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      // Reflect normalized shape back to caller
      response.data = {
        user,
        accessToken,
        refreshToken,
      } as any
    }
    
    return response
  }

  // Register user
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)
  }

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{
    accessToken: string
    refreshToken: string
  }>> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token found',
        status: 401,
      }
    }

    // Support both payload shapes
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken, refresh_token: refreshToken })
    
    if (response.success && response.data) {
      const data: any = response.data
      const newAccess = data.accessToken || data.access_token || data.token
      const newRefresh = data.refreshToken || data.refresh_token || refreshToken

      if (newAccess) localStorage.setItem('accessToken', newAccess)
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh)

      response.data = {
        accessToken: newAccess,
        refreshToken: newRefresh,
      } as any
    }
    
    return response
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get(API_ENDPOINTS.AUTH.PROFILE)
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put(API_ENDPOINTS.AUTH.PROFILE, userData)
    
    if (response.success && response.data) {
      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...currentUser, ...response.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    
    return response
  }

  // Get all users (admin only)
  async getUsers(page = 1, limit = 10): Promise<ApiResponse<{
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>> {
    return apiClient.get(API_ENDPOINTS.AUTH.USERS, { page, limit })
  }

  // Logout user
  logout(): void {
    // Remove tokens and user data from localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // Redirect to login page
    window.location.href = '/login'
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken')
    return !!token
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }

  // Check if user has role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  // Get token expiration time
  getTokenExpiration(): Date | null {
    const token = localStorage.getItem('accessToken')
    if (!token) return null
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return new Date(payload.exp * 1000)
    } catch {
      return null
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiration = this.getTokenExpiration()
    if (!expiration) return true
    
    return new Date() > expiration
  }

  // Auto refresh token if needed
  async autoRefreshToken(): Promise<boolean> {
    if (this.isTokenExpired()) {
      const response = await this.refreshToken()
      return response.success
    }
    return true
  }
}

// Export singleton instance
export const authService = new AuthService()
