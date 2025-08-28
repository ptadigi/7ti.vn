import { apiClient, ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { Customer, CustomerFilters, CustomerStatistics } from '@/types'

export class CustomerService {
  // Get all customers
  async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
    return apiClient.get('/api/customers/')
  }

  // Get customer by ID
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return apiClient.get(`/api/customers/${id}/`)
  }

  // Create new customer
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    return apiClient.post('/api/customers/', customerData)
  }

  // Update customer
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return apiClient.put(`/api/customers/${id}/`, customerData)
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/customers/${id}/`)
  }

  // Search customers
  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    return apiClient.get('/api/customers/search/', { query })
  }

  // Get customer statistics
  async getCustomerStatistics(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/customers/statistics/')
  }

  // Export customers
  async exportCustomers(format: 'csv' | 'excel' = 'csv'): Promise<void> {
    return apiClient.download(`/api/customers/export/${format}/`, `customers.${format}`)
  }

  // Bulk operations
  async bulkDeleteCustomers(ids: string[]): Promise<ApiResponse<{ deleted: number; failed: number }>> {
    return apiClient.post('/api/customers/bulk-delete', { ids })
  }

  async bulkUpdateStatus(ids: string[], status: 'active' | 'inactive' | 'blacklist'): Promise<ApiResponse<{ updated: number; failed: number }>> {
    return apiClient.post('/api/customers/bulk-status-update', { ids, status })
  }
}

// Export singleton instance
export const customerService = new CustomerService()
