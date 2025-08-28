// API Configuration
// TEMP: lock base URL to backend for production-like testing
const resolveBaseUrl = (): string => 'http://localhost:5001'

export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    USERS: '/api/auth/users',
  },
  
  // Customers
  CUSTOMERS: {
    LIST: '/api/customers',
    CREATE: '/api/customers',
    UPDATE: (id: string) => `/api/customers/${id}`,
    DELETE: (id: string) => `/api/customers/${id}`,
    SEARCH: '/api/customers/search',
    STATISTICS: '/api/customers/statistics',
    EXPORT: '/api/customers/export',
  },
  
  // Bills
  BILLS: {
    WAREHOUSE: '/api/bills/warehouse',
    CREATE: '/api/bills/warehouse',
    UPDATE: (id: string) => `/api/bills/warehouse/${id}`,
    DELETE: (id: string) => `/api/bills/warehouse/${id}`,
    COMBINATIONS: '/api/bills/warehouse/combinations',
    STATISTICS: '/api/bills/warehouse/statistics',
    EXPORT: '/api/bills/warehouse/export',
    BULK_ADD: '/api/bills/warehouse/bulk-add',
    BULK_STATUS: '/api/bills/warehouse/bulk-status',
  },
  
  // Sales
  SALES: {
    LIST: '/api/sales',
    CREATE: '/api/sales',
    UPDATE: (id: string) => `/api/sales/${id}`,
    DELETE: (id: string) => `/api/sales/${id}`,
    STATUS: (id: string) => `/api/sales/${id}/status`,
    PAYMENT: (id: string) => `/api/sales/${id}/payment`,
    CANCEL: (id: string) => `/api/sales/${id}/cancel`,
    STATISTICS: '/api/sales/statistics',
    EXPORT: '/api/sales/export',
    BULK_STATUS: '/api/sales/bulk-status-update',
  },
  
  // Reports
  REPORTS: {
    DASHBOARD: '/api/reports/dashboard',
    SALES_ANALYTICS: '/api/reports/sales-analytics',
    CUSTOMER_ANALYTICS: '/api/reports/customer-analytics',
    WAREHOUSE_ANALYTICS: '/api/reports/warehouse-analytics',
    COMPREHENSIVE: '/api/reports/comprehensive',
    EXPORT: '/api/reports/export',
    REAL_TIME: '/api/reports/real-time',
    TRENDS: '/api/reports/trends',
  },
  
  // Enhanced Proxy
  PROXY: {
    BULK_ADD: '/api/enhanced-proxy/bulk-add',
    BULK_TEST: '/api/enhanced-proxy/bulk-test',
    ROTATE: '/api/enhanced-proxy/rotate',
    STATISTICS: '/api/enhanced-proxy/statistics',
    CLEANUP: '/api/enhanced-proxy/cleanup',
    EXPORT: '/api/enhanced-proxy/export',
    HEALTH_CHECK: '/api/enhanced-proxy/health-check',
    PERFORMANCE: '/api/enhanced-proxy/performance',
  },
}

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
}

// Response Status
export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  UNAUTHORIZED: 'Không có quyền truy cập',
  FORBIDDEN: 'Truy cập bị từ chối',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  SERVER_ERROR: 'Lỗi máy chủ',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  TIMEOUT: 'Hết thời gian chờ',
  UNKNOWN_ERROR: 'Lỗi không xác định',
}
