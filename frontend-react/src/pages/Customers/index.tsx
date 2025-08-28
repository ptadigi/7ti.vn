import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import CustomerForm from '@/components/customers/CustomerForm'
import CustomerList from '@/components/customers/CustomerList'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { Customer, CustomerFilters } from '@/types'
import { MagnifyingGlassIcon, FunnelIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { customerService } from '@/services'


const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customerType: 'all',
    status: 'all'
  })
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)

  // Load customers from API
  useEffect(() => {
    loadCustomers()
  }, [])

  // Load customers function
  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerService.getAllCustomers()
      
      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const customerData = Array.isArray(response.data) ? response.data : (response.data as any).customers || []
        setCustomers(customerData)
        setFilteredCustomers(customerData)
      } else {
        toast.error(response.error || 'Không thể tải danh sách khách hàng')
        // Fallback to empty array
        setCustomers([])
        setFilteredCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Lỗi kết nối mạng')
      setCustomers([])
      setFilteredCustomers([])
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...customers]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(customer =>
        (customer.name || '').toLowerCase().includes(searchLower) ||
        (customer.phone || '').includes(filters.search || '') ||
        (customer.email || '').toLowerCase().includes(searchLower) ||
        (customer.companyName || '').toLowerCase().includes(searchLower)
      )
    }

    if (filters.customerType && filters.customerType !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === filters.customerType)
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === filters.status)
    }

    setFilteredCustomers(filtered)
  }, [customers, filters])

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleViewCustomer = (customer: Customer) => {
    toast.success(`Xem thông tin khách hàng: ${customer.name}`)
    // TODO: Show customer detail modal
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Bạn có chắc muốn xóa khách hàng "${customer.name}"?`)) {
      try {
        setLoading(true)
        const response = await customerService.deleteCustomer(customer.id)
        
        if (response.success) {
          setCustomers(prev => prev.filter(c => c.id !== customer.id))
          setFilteredCustomers(prev => prev.filter(c => c.id !== customer.id))
          toast.success('Đã xóa khách hàng thành công')
        } else {
          toast.error(response.error || 'Không thể xóa khách hàng')
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast.error('Lỗi kết nối mạng')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmitCustomer = async (customerData: Partial<Customer>) => {
    setLoading(true)
    
    try {
      if (editingCustomer) {
        // Update existing customer
        const response = await customerService.updateCustomer(editingCustomer.id, customerData)
        
        if (response.success && response.data) {
          setCustomers(prev => prev.map(c => 
            c.id === editingCustomer.id ? response.data! : c
          ))
          setFilteredCustomers(prev => prev.map(c => 
            c.id === editingCustomer.id ? response.data! : c
          ))
          toast.success('Cập nhật khách hàng thành công')
          setShowForm(false)
          setEditingCustomer(null)
        } else {
          toast.error(response.error || 'Không thể cập nhật khách hàng')
        }
      } else {
        // Add new customer
        const response = await customerService.createCustomer(customerData as Omit<Customer, 'id' | 'created_at' | 'updated_at'>)
        
        if (response.success && response.data) {
          setCustomers(prev => [...prev, response.data!])
          setFilteredCustomers(prev => [...prev, response.data!])
          toast.success('Thêm khách hàng mới thành công')
          setShowForm(false)
        } else {
          toast.error(response.error || 'Không thể thêm khách hàng mới')
        }
      }
    } catch (error) {
      console.error('Error submitting customer:', error)
      toast.error('Lỗi kết nối mạng')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  const handleExportCustomers = async () => {
    try {
      setLoading(true)
      await customerService.exportCustomers('excel')
      toast.success('Xuất dữ liệu thành công')
    } catch (error) {
      console.error('Error exporting customers:', error)
      toast.error('Không thể xuất dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const customerTypeOptions = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'INDIVIDUAL', label: 'Cá nhân' },
    { value: 'COMPANY', label: 'Doanh nghiệp' }
  ]

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'BLACKLIST', label: 'Blacklist' }
  ]

  const stats = {
    total: customers.length,
    individual: customers.filter(c => c.customerType === 'INDIVIDUAL').length,
    company: customers.filter(c => c.customerType === 'COMPANY').length,
    active: customers.filter(c => c.status === 'ACTIVE').length,
    totalValue: customers.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingCustomer ? 'Chỉnh Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {editingCustomer ? 'Cập nhật thông tin khách hàng' : 'Nhập thông tin khách hàng mới'}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancelForm}
          >
            Quay Lại
          </Button>
        </div>

        <CustomerForm
          customer={editingCustomer || undefined}
          onSubmit={handleSubmitCustomer}
          onCancel={handleCancelForm}
          loading={loading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý thông tin khách hàng và danh sách liên hệ
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleExportCustomers}
            loading={loading}
          >
            Xuất Excel
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserPlusIcon className="h-4 w-4" />}
            onClick={handleAddCustomer}
          >
            Thêm Khách Hàng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Khách Hàng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cá Nhân</p>
              <p className="text-2xl font-bold text-gray-900">{stats.individual}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh Nghiệp</p>
              <p className="text-2xl font-bold text-gray-900">{stats.company}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hoạt Động</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Giá Trị</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalValue.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Tìm kiếm theo tên, SĐT, email..."
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              value={filters.customerType}
              onChange={(e) => setFilters(prev => ({ ...prev, customerType: e.target.value as 'all' | 'INDIVIDUAL' | 'COMPANY' }))}
              options={customerTypeOptions}
            />
          </div>
          <div className="w-48">
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'ACTIVE' | 'INACTIVE' | 'BLACKLIST' }))}
              options={statusOptions}
            />
          </div>
          <Button
            variant="ghost"
            leftIcon={<FunnelIcon className="h-4 w-4" />}
            onClick={() => setFilters({ search: '', customerType: 'all', status: 'all' })}
          >
            Xóa Bộ Lọc
          </Button>
        </div>
      </div>

      {/* Customers List */}
      <CustomerList
        customers={filteredCustomers}
        onView={handleViewCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        loading={loading}
      />
    </div>
  )
}

export default Customers
