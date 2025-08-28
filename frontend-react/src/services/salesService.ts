import { apiClient, ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { BillSale, SaleFilters, SaleStatistics } from '@/types'

export class SalesService {
  // Get all sales with pagination and filters
  async getSales(filters?: SaleFilters, page = 1, limit = 10): Promise<ApiResponse<{
    sales: BillSale[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>> {
    const params: any = { page, limit }
    
    if (filters) {
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
    }

    return apiClient.get(API_ENDPOINTS.SALES.LIST, params)
  }

  // Get all sales
  async getAllSales(): Promise<ApiResponse<SaleTransaction[]>> {
    return apiClient.get('/api/sales/')
  }

  // Get sale by ID
  async getSale(id: string): Promise<ApiResponse<SaleTransaction>> {
    return apiClient.get(`/api/sales/${id}/`)
  }

  // Create new sale
  async createSale(saleData: Omit<SaleTransaction, 'id' | 'createdAt'>): Promise<ApiResponse<SaleTransaction>> {
    return apiClient.post('/api/sales/', saleData)
  }

  // Update sale
  async updateSale(id: string, saleData: Partial<SaleTransaction>): Promise<ApiResponse<SaleTransaction>> {
    return apiClient.put(`/api/sales/${id}/`, saleData)
  }

  // Delete sale
  async deleteSale(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(API_ENDPOINTS.SALES.DELETE(id))
  }

  // Update sale status
  async updateSaleStatus(id: string, status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'): Promise<ApiResponse<BillSale>> {
    return apiClient.put(API_ENDPOINTS.SALES.STATUS(id), { status })
  }

  // Update payment status
  async updatePaymentStatus(id: string, paymentStatus: boolean, paymentDate?: string): Promise<ApiResponse<BillSale>> {
    return apiClient.put(API_ENDPOINTS.SALES.PAYMENT(id), { paymentStatus, paymentDate })
  }

  // Cancel sale
  async cancelSale(id: string, reason?: string): Promise<ApiResponse<BillSale>> {
    return apiClient.post(API_ENDPOINTS.SALES.CANCEL(id), { reason })
  }

  // Refund sale
  async refundSale(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/sales/${id}/refund/`)
  }

  // Get sales statistics
  async getSalesStatistics(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/sales/statistics/')
  }

  // Export sales
  async exportSales(format: 'csv' | 'excel' = 'csv'): Promise<void> {
    return apiClient.download(API_ENDPOINTS.SALES.EXPORT, `sales.${format}`)
  }

  // Bulk update status
  async bulkUpdateStatus(ids: string[], status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'): Promise<ApiResponse<{
    updated: number
    failed: number
    errors: string[]
  }>> {
    return apiClient.put(API_ENDPOINTS.SALES.BULK_STATUS, { ids, status })
  }

  // Get sales by date range
  async getSalesByDateRange(startDate: string, endDate: string): Promise<ApiResponse<BillSale[]>> {
    return apiClient.get(API_ENDPOINTS.SALES.LIST, { startDate, endDate })
  }

  // Get sales by customer
  async getSalesByCustomer(customerId: string): Promise<ApiResponse<BillSale[]>> {
    return apiClient.get(API_ENDPOINTS.SALES.LIST, { customerId })
  }

  // Confirm customer payment - chuyển từ pending_payment sang paid
  async confirmPayment(saleId: string): Promise<ApiResponse<BillSale>> {
    return apiClient.post(`/api/sales/${saleId}/confirm-payment`)
  }

  // Complete sale - mình đã thanh lại cho khách
  async completeSale(saleId: string): Promise<ApiResponse<BillSale>> {
    return apiClient.post(`/api/sales/${saleId}/complete`)
  }

  // Get sales by payment method
  async getSalesByPaymentMethod(paymentMethod: string): Promise<ApiResponse<BillSale[]>> {
    return apiClient.get(API_ENDPOINTS.SALES.LIST, { paymentMethod })
  }
}

// Export singleton instance
export const salesService = new SalesService()
