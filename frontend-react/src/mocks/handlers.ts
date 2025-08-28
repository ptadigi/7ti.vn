import { rest } from 'msw'
import { API_ENDPOINTS } from '@/config/api'

// Mock data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@fpt.com',
    full_name: 'System Administrator',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockCustomers = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    zalo: 'nguyenvana',
    email: 'nguyenvana@email.com',
    bank_account: '1234567890',
    bank_name: 'Vietcombank',
    address: 'Hanoi, Vietnam',
    notes: 'Khách hàng VIP',
    is_active: true,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    phone: '0987654321',
    zalo: 'tranthib',
    email: 'tranthib@email.com',
    bank_account: '0987654321',
    bank_name: 'BIDV',
    address: 'Ho Chi Minh City, Vietnam',
    notes: 'Khách hàng thường xuyên',
    is_active: true,
    created_by: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const mockBills = [
  {
    id: '1',
    contract_code: 'PB02020040261',
    customer_name: 'Nguyễn Văn A',
    address: 'Hanoi, Vietnam',
    amount: 1500000,
    due_date: '2024-09-15T00:00:00Z',
    bill_date: '2024-08-01T00:00:00Z',
    meter_number: 'MN001',
    status: 'IN_WAREHOUSE',
    raw_response: '{}',
    api_response_time: '2024-08-01T00:00:00Z',
    api_success: true,
    added_to_warehouse_at: '2024-08-01T00:00:00Z',
    added_by: 1,
    warehouse_notes: 'Bill mới',
    sale_id: null,
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
  },
]

const mockSales = [
  {
    id: '1',
    customer_id: 1,
    user_id: 1,
    total_bill_amount: 1500000,
    profit_percentage: 10,
    profit_amount: 150000,
    customer_payment: 1350000,
    payment_method: 'BANK_TRANSFER',
    payment_status: true,
    payment_date: '2024-08-01T00:00:00Z',
    status: 'COMPLETED',
    notes: 'Giao dịch thành công',
    customer_notes: 'Khách hàng hài lòng',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
    completed_at: '2024-08-01T00:00:00Z',
  },
]

// API Handlers
export const handlers = [
  // Authentication
  rest.post(API_ENDPOINTS.AUTH.LOGIN, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: mockUsers[0],
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
        message: 'Login successful',
      })
    )
  }),

  rest.post(API_ENDPOINTS.AUTH.REGISTER, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: mockUsers[0],
        message: 'User registered successfully',
      })
    )
  }),

  rest.get(API_ENDPOINTS.AUTH.PROFILE, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockUsers[0],
        message: 'Profile retrieved successfully',
      })
    )
  }),

  // Customers
  rest.get(API_ENDPOINTS.CUSTOMERS.LIST, (req, res, ctx) => {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          customers: mockCustomers,
          total: mockCustomers.length,
          page,
          limit,
          totalPages: Math.ceil(mockCustomers.length / limit),
        },
        message: 'Customers retrieved successfully',
      })
    )
  }),

  rest.post(API_ENDPOINTS.CUSTOMERS.CREATE, (req, res, ctx) => {
    const newCustomer = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newCustomer,
        message: 'Customer created successfully',
      })
    )
  }),

  rest.put(API_ENDPOINTS.CUSTOMERS.UPDATE(':id'), (req, res, ctx) => {
    const { id } = req.params
    const updatedCustomer = {
      ...mockCustomers.find(c => c.id === id),
      ...req.body,
      updated_at: new Date().toISOString(),
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: updatedCustomer,
        message: 'Customer updated successfully',
      })
    )
  }),

  rest.delete(API_ENDPOINTS.CUSTOMERS.DELETE(':id'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Customer deleted successfully',
      })
    )
  }),

  // Bills
  rest.get(API_ENDPOINTS.BILLS.WAREHOUSE, (req, res, ctx) => {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          bills: mockBills,
          total: mockBills.length,
          page,
          limit,
          totalPages: Math.ceil(mockBills.length / limit),
        },
        message: 'Bills retrieved successfully',
      })
    )
  }),

  rest.post(API_ENDPOINTS.BILLS.CREATE, (req, res, ctx) => {
    const newBill = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newBill,
        message: 'Bill added to warehouse successfully',
      })
    )
  }),

  // Sales
  rest.get(API_ENDPOINTS.SALES.LIST, (req, res, ctx) => {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          sales: mockSales,
          total: mockSales.length,
          page,
          limit,
          totalPages: Math.ceil(mockSales.length / limit),
        },
        message: 'Sales retrieved successfully',
      })
    )
  }),

  rest.post(API_ENDPOINTS.SALES.CREATE, (req, res, ctx) => {
    const newSale = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newSale,
        message: 'Sale created successfully',
      })
    )
  }),

  // Reports
  rest.get(API_ENDPOINTS.REPORTS.DASHBOARD, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          totalBills: mockBills.length,
          totalCustomers: mockCustomers.length,
          monthlySales: mockSales.length,
          monthlyRevenue: 1500000,
          totalProfit: 150000,
        },
        message: 'Dashboard data retrieved successfully',
      })
    )
  }),

  // Fallback handler
  rest.all('*', (req, res, ctx) => {
    console.warn(`No handler found for ${req.method} ${req.url}`)
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'API endpoint not found',
        message: 'This endpoint is not implemented in the mock server',
      })
    )
  }),
]
