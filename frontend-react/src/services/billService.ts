import { apiClient, ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { Bill, BillFilters, BillCombinationRequest, BillStatistics } from '@/types'

export class BillService {
  // Get warehouse bills with pagination and filters
  async getWarehouseBills(filters?: BillFilters, page = 1, per_page = 20): Promise<ApiResponse<{
    bills: Bill[]
    total: number
    page: number
    per_page: number
    pages: number
  }>> {
    const params: any = { page, per_page }
    
    if (filters) {
      if (filters.search) params.search = filters.search
      if (filters.minAmount) params.minAmount = filters.minAmount
      if (filters.maxAmount) params.maxAmount = filters.maxAmount
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.customerName) params.customerName = filters.customerName
      if (filters.month) params.month = filters.month
    }

    return apiClient.get(API_ENDPOINTS.BILLS.WAREHOUSE, params)
  }

  // Get all bills (with all statuses)
  async getAllBills(page = 1, limit = 50): Promise<ApiResponse<{
    bills: Bill[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>> {
    const params: any = { page, limit, all_statuses: true }
    return apiClient.get('/api/bills/all', params)
  }

  // Get bill by ID
  async getBill(id: string): Promise<ApiResponse<Bill>> {
    return apiClient.get(API_ENDPOINTS.BILLS.UPDATE(id))
  }

  // Add bill to warehouse
  async addBillToWarehouse(billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Bill>> {
    return apiClient.post(API_ENDPOINTS.BILLS.CREATE, billData)
  }

  // Update bill
  async updateBill(id: string, billData: Partial<Bill>): Promise<ApiResponse<Bill>> {
    return apiClient.put(API_ENDPOINTS.BILLS.UPDATE(id), billData)
  }

  // Remove bill from warehouse
  async removeBillFromWarehouse(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(API_ENDPOINTS.BILLS.DELETE(id))
  }

  // Find bill combinations
  async findBillCombinations(request: BillCombinationRequest): Promise<ApiResponse<{
    combinations: Bill[][]
    totalCombinations: number
    bestCombination: Bill[]
    bestCombinationAmount: number
  }>> {
    return apiClient.post(API_ENDPOINTS.BILLS.COMBINATIONS, request)
  }

  // Get warehouse statistics
  async getWarehouseStatistics(): Promise<ApiResponse<BillStatistics>> {
    return apiClient.get(API_ENDPOINTS.BILLS.STATISTICS)
  }

  // Export warehouse bills
  async exportWarehouseBills(format: 'csv' | 'excel' = 'csv'): Promise<void> {
    return apiClient.download(API_ENDPOINTS.BILLS.EXPORT, `warehouse_bills.${format}`)
  }

  // Bulk add bills
  async bulkAddBills(bills: Omit<Bill, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<{
    added: number
    failed: number
    errors: string[]
  }>> {
    return apiClient.post(API_ENDPOINTS.BILLS.BULK_ADD, { bills })
  }

  // Search bills by contract code
  async searchBillsByContract(contractCode: string): Promise<ApiResponse<Bill[]>> {
    return apiClient.get(API_ENDPOINTS.BILLS.WAREHOUSE, { contractCode })
  }

  // Check single bill from FPT API (REAL API)
  async checkSingleBill(contractCode: string): Promise<ApiResponse<any>> {
    return apiClient.post('/api/check-single', { contract_code: contractCode })
  }

  // Start batch check from FPT API (REAL API)
  async startBatchCheck(contractCodes: string[]): Promise<ApiResponse<any>> {
    return apiClient.post('/api/batch/start', { 
      contract_codes: contractCodes, 
      use_proxy: true 
    })
  }

  // Get batch check status
  async getBatchStatus(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/batch/status')
  }

  // Update bill status (e.g., from 'IN_WAREHOUSE' to 'PENDING_PAYMENT')
  async updateBillStatus(id: string, status: 'IN_WAREHOUSE' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'): Promise<ApiResponse<Bill>> {
    return apiClient.put(API_ENDPOINTS.BILLS.UPDATE(id), { status })
  }

  // Bulk update bill status
  async bulkUpdateBillStatus(billIds: string[], status: 'IN_WAREHOUSE' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'): Promise<ApiResponse<{
    updated: number
    failed: number
    errors: string[]
  }>> {
    return apiClient.put(API_ENDPOINTS.BILLS.BULK_STATUS, { billIds, status })
  }

  // Get bills by status
  async getBillsByStatus(status: 'IN_WAREHOUSE' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'): Promise<ApiResponse<Bill[]>> {
    return apiClient.get(API_ENDPOINTS.BILLS.WAREHOUSE, { status })
  }

  // Get bills by amount range
  async getBillsByAmountRange(minAmount: number, maxAmount: number): Promise<ApiResponse<Bill[]>> {
    return apiClient.get(API_ENDPOINTS.BILLS.WAREHOUSE, { minAmount, maxAmount })
  }

  // Get bills by customer ID
  async getCustomerBills(customerId: number): Promise<ApiResponse<Bill[]>> {
    return apiClient.get(`/api/bills/customer/${customerId}`)
  }

  // Get sales by customer ID
  async getCustomerSales(customerId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/sales/customer/${customerId}`)
  }
}

// Export singleton instance
export const billService = new BillService()
