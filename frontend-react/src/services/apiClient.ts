import { API_CONFIG, ERROR_MESSAGES } from '@/config/api'

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  status: number
}

// API Client Class
class ApiClient {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  // Get headers with auth token
  private getHeaders(): HeadersInit {
    const token = this.getAuthToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  // Handle response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
          message: data.message,
          status: response.status,
        }
      } else {
        return {
          success: false,
          error: data.error || data.message || ERROR_MESSAGES.UNKNOWN_ERROR,
          message: data.message,
          status: response.status,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNKNOWN_ERROR,
        status: response.status,
      }
    }
  }

  // Handle network errors
  private handleNetworkError(error: any): ApiResponse {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: ERROR_MESSAGES.TIMEOUT,
        status: 408,
      }
    }
    
    if (!navigator.onLine) {
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK_ERROR,
        status: 0,
      }
    }
    
    return {
      success: false,
      error: ERROR_MESSAGES.UNKNOWN_ERROR,
      status: 0,
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(this.baseURL + endpoint)
      
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, String(params[key]))
          }
        })
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseURL + endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseURL + endpoint, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseURL + endpoint, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseURL + endpoint, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // Upload file
  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseURL + endpoint, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          // Remove Content-Type for FormData
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleNetworkError(error)
    }
  }

  // Download file
  async download(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(this.baseURL + endpoint, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }
