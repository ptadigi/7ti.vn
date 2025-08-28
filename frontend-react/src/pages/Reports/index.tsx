import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import SalesReport from '@/components/reports/SalesReport'
import CustomerAnalytics from '@/components/reports/CustomerAnalytics'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { BillSale, Customer } from '@/types'
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { salesService, customerService } from '@/services'

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'customers'>('sales')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  })
  const [sales, setSales] = useState<BillSale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  const [showFilters, setShowFilters] = useState(true)

  // Load data from API
  useEffect(() => {
    loadData()
  }, [dateRange])

  // Load data function
  const loadData = async () => {
    try {
      // Load sales data
      const salesResponse = await salesService.getSales({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      })
      
      if (salesResponse.success && salesResponse.data) {
        setSales(salesResponse.data.sales)
      }
      
      // Load customers data
      const customersResponse = await customerService.getAllCustomers()
      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Lỗi kết nối mạng')
    }
  }
  

  // Filter data by date range
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at)
    return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate
  })

  const filteredCustomers = customers.filter(customer => {
    const customerDate = new Date(customer.createdAt)
    return customerDate >= dateRange.startDate && customerDate <= dateRange.endDate
  })

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    toast.success(`Đang xuất báo cáo ${format.toUpperCase()}...`)
    // TODO: Implement actual export functionality
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = new Date(value)
    setDateRange(prev => ({
      ...prev,
      [field]: date
    }))
  }

  const quickDateRanges = [
    { label: '7 ngày qua', days: 7 },
    { label: '30 ngày qua', days: 30 },
    { label: '90 ngày qua', days: 90 },
    { label: '1 năm qua', days: 365 }
  ]

  const setQuickDateRange = (days: number) => {
    setDateRange({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date()
    })
  }

  // Calculate summary stats
  const summaryStats = {
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total_bill_amount, 0),
    totalProfit: filteredSales.reduce((sum, sale) => sum + sale.profit_amount, 0),
    totalSales: filteredSales.length,
    totalCustomers: filteredCustomers.length,
    averageOrderValue: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total_bill_amount, 0) / filteredSales.length 
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Phân Tích</h1>
          <p className="mt-2 text-sm text-gray-600">
            Thống kê doanh số, phân tích khách hàng và xu hướng kinh doanh
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={showFilters ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          >
            {showFilters ? 'Ẩn Bộ Lọc' : 'Hiện Bộ Lọc'}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
            onClick={() => handleExport('excel')}
          >
            Xuất Báo Cáo
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ Lọc Thời Gian</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ Ngày
              </label>
              <Input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến Ngày
              </label>
              <Input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng Thời Gian Nhanh
              </label>
              <div className="flex flex-wrap gap-2">
                {quickDateRanges.map((range) => (
                  <button
                    key={range.days}
                    onClick={() => setQuickDateRange(range.days)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.totalRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Lợi Nhuận</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.totalProfit.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Giao Dịch</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Khách Hàng</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giá Trị TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.averageOrderValue.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Báo Cáo Doanh Số
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Phân Tích Khách Hàng
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sales' ? (
            <SalesReport
              sales={filteredSales}
              dateRange={dateRange}
              onExport={handleExport}
            />
          ) : (
            <CustomerAnalytics
              customers={filteredCustomers}
              sales={filteredSales}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
