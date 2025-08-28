import { apiClient, ApiResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'
import { DashboardSummary, SalesAnalytics, CustomerAnalytics, WarehouseAnalytics } from '@/types'

export class ReportsService {
  // Get dashboard summary
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return apiClient.get(API_ENDPOINTS.REPORTS.DASHBOARD)
  }

  // Get sales analytics
  async getSalesAnalytics(startDate?: string, endDate?: string): Promise<ApiResponse<SalesAnalytics>> {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    
    return apiClient.get(API_ENDPOINTS.REPORTS.SALES_ANALYTICS, params)
  }

  // Get customer analytics
  async getCustomerAnalytics(): Promise<ApiResponse<CustomerAnalytics>> {
    return apiClient.get(API_ENDPOINTS.REPORTS.CUSTOMER_ANALYTICS)
  }

  // Get warehouse analytics
  async getWarehouseAnalytics(): Promise<ApiResponse<WarehouseAnalytics>> {
    return apiClient.get(API_ENDPOINTS.REPORTS.WAREHOUSE_ANALYTICS)
  }

  // Get comprehensive report
  async getComprehensiveReport(startDate?: string, endDate?: string): Promise<ApiResponse<{
    summary: DashboardSummary
    sales: SalesAnalytics
    customers: CustomerAnalytics
    warehouse: WarehouseAnalytics
  }>> {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    
    return apiClient.get(API_ENDPOINTS.REPORTS.COMPREHENSIVE, params)
  }

  // Export comprehensive report
  async exportComprehensiveReport(format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<void> {
    return apiClient.download(API_ENDPOINTS.REPORTS.EXPORT, `comprehensive_report.${format}`)
  }

  // Get real-time data
  async getRealTimeData(): Promise<ApiResponse<{
    activeUsers: number
    recentSales: number
    pendingBills: number
    systemStatus: 'healthy' | 'warning' | 'error'
  }>> {
    return apiClient.get(API_ENDPOINTS.REPORTS.REAL_TIME)
  }

  // Get trends data
  async getTrendsData(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<ApiResponse<{
    salesTrend: Array<{ date: string; amount: number }>
    customerGrowth: Array<{ date: string; count: number }>
    billVolume: Array<{ date: string; count: number }>
  }>> {
    return apiClient.get(API_ENDPOINTS.REPORTS.TRENDS, { period })
  }

  // Get custom report
  async getCustomReport(filters: {
    startDate?: string
    endDate?: string
    customerType?: string
    billStatus?: string
    saleStatus?: string
    minAmount?: number
    maxAmount?: number
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/api/reports/custom', filters)
  }

  // Schedule report
  async scheduleReport(schedule: {
    reportType: string
    frequency: 'daily' | 'weekly' | 'monthly'
    email: string
    format: 'csv' | 'excel' | 'pdf'
    filters?: any
  }): Promise<ApiResponse<{ scheduleId: string; nextRun: string }>> {
    return apiClient.post('/api/reports/schedule', schedule)
  }
}

// Export singleton instance
export const reportsService = new ReportsService()
