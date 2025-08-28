import { customerService } from '../customerService'
import { server } from '../../mocks/server'
import { rest } from 'msw'
import { API_ENDPOINTS } from '../../config/api'

describe('CustomerService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('getCustomers', () => {
    it('should fetch customers successfully', async () => {
      const response = await customerService.getCustomers()
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.customers).toHaveLength(2)
      expect(response.data?.total).toBe(2)
    })

    it('should handle API errors', async () => {
      // Override the handler to return an error
      server.use(
        rest.get(API_ENDPOINTS.CUSTOMERS.LIST, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              error: 'Internal server error',
              message: 'Something went wrong',
            })
          )
        })
      )

      const response = await customerService.getCustomers()
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('Internal server error')
    })

    it('should handle network errors', async () => {
      // Override the handler to simulate network error
      server.use(
        rest.get(API_ENDPOINTS.CUSTOMERS.LIST, (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      const response = await customerService.getCustomers()
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('Lỗi không xác định')
    })
  })

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const customerData = {
        name: 'Test Customer',
        phone: '0123456789',
        email: 'test@example.com',
        address: 'Test Address',
      }

      const response = await customerService.createCustomer(customerData)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.name).toBe(customerData.name)
      expect(response.data?.phone).toBe(customerData.phone)
    })

    it('should handle validation errors', async () => {
      // Override the handler to return validation error
      server.use(
        rest.post(API_ENDPOINTS.CUSTOMERS.CREATE, (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'Name is required',
            })
          )
        })
      )

      const response = await customerService.createCustomer({} as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = '1'
      const updateData = {
        name: 'Updated Customer',
        phone: '0987654321',
      }

      const response = await customerService.updateCustomer(customerId, updateData)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.name).toBe(updateData.name)
      expect(response.data?.phone).toBe(updateData.phone)
    })

    it('should handle customer not found', async () => {
      // Override the handler to return not found error
      server.use(
        rest.put(API_ENDPOINTS.CUSTOMERS.UPDATE(':id'), (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              success: false,
              error: 'CUSTOMER_NOT_FOUND',
              message: 'Customer not found',
            })
          )
        })
      )

      const response = await customerService.updateCustomer('999', { name: 'Test' })
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('CUSTOMER_NOT_FOUND')
    })
  })

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = '1'

      const response = await customerService.deleteCustomer(customerId)
      
      expect(response.success).toBe(true)
      expect(response.message).toBe('Customer deleted successfully')
    })

    it('should handle deletion errors', async () => {
      // Override the handler to return error
      server.use(
        rest.delete(API_ENDPOINTS.CUSTOMERS.DELETE(':id'), (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              error: 'DELETE_ERROR',
              message: 'Cannot delete customer with active sales',
            })
          )
        })
      )

      const response = await customerService.deleteCustomer('1')
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('DELETE_ERROR')
    })
  })

  describe('searchCustomers', () => {
    it('should search customers by query', async () => {
      const searchQuery = 'Nguyễn'
      
      const response = await customerService.searchCustomers(searchQuery)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      // Should find customer with name containing "Nguyễn"
      expect(response.data?.customers.some(c => c.name.includes(searchQuery))).toBe(true)
    })
  })

  describe('getCustomerStatistics', () => {
    it('should return customer statistics', async () => {
      const response = await customerService.getCustomerStatistics()
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      // Statistics should include basic metrics
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('active')
      expect(response.data).toHaveProperty('inactive')
    })
  })
})
