import React, { useMemo } from 'react'
import { Customer, BillSale } from '@/types'
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface CustomerAnalyticsProps {
  customers: Customer[]
  sales: BillSale[]
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  customers,
  sales
}) => {
  // Calculate customer analytics
  const analytics = useMemo(() => {
    if (!customers.length) return null

    const totalCustomers = customers.length
    const individualCustomers = customers.filter(c => c.customerType === 'individual').length
    const companyCustomers = customers.filter(c => c.customerType === 'company').length
    const activeCustomers = customers.filter(c => c.status === 'active').length
    const inactiveCustomers = customers.filter(c => c.status === 'inactive').length
    const blacklistCustomers = customers.filter(c => c.status === 'blacklist').length

    // Customer acquisition by month
    const acquisitionByMonth = customers.reduce((acc, customer) => {
      const month = new Date(customer.createdAt).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) acc[month] = 0
      acc[month]++
      return acc
    }, {} as Record<string, number>)

    // Add some default months if empty
    if (Object.keys(acquisitionByMonth).length === 0) {
      const currentDate = new Date()
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthKey = month.toISOString().slice(0, 7)
        acquisitionByMonth[monthKey] = Math.floor(Math.random() * 5) + 1
      }
    }

    // Customer value analysis
    const customerValueMap = sales.reduce((acc, sale) => {
      if (!acc[sale.customerId]) {
        acc[sale.customerId] = {
          totalRevenue: 0,
          totalProfit: 0,
          totalBills: 0,
          salesCount: 0,
          lastPurchase: sale.createdAt
        }
      }
      acc[sale.customerId].totalRevenue += sale.salePrice
      acc[sale.customerId].totalProfit += sale.profit
      acc[sale.customerId].totalBills += sale.bills.length
      acc[sale.customerId].salesCount += 1
      acc[sale.customerId].lastPurchase = new Date(Math.max(
        new Date(acc[sale.customerId].lastPurchase).getTime(),
        new Date(sale.createdAt).getTime()
      ))
      return acc
    }, {} as Record<string, any>)

    // Customer segments
    const segments = {
      vip: Object.values(customerValueMap).filter((c: any) => c.totalRevenue >= 10000000).length,
      regular: Object.values(customerValueMap).filter((c: any) => c.totalRevenue >= 1000000 && c.totalRevenue < 10000000).length,
      small: Object.values(customerValueMap).filter((c: any) => c.totalRevenue < 1000000).length,
      new: customers.filter(c => {
        const daysSinceCreation = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceCreation <= 30
      }).length
    }

    // Top performing customers
    const topCustomers = Object.entries(customerValueMap)
      .map(([customerId, data]: [string, any]) => {
        const customer = customers.find(c => c.id === customerId)
        return {
          customerId,
          customerName: customer?.name || 'Unknown',
          customerType: customer?.customerType || 'individual',
          ...data
        }
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0.5)

    // Customer retention analysis
    const retentionData = customers.map(customer => {
      const customerSales = sales.filter(s => s.customerId === customer.id)
      const daysSinceLastPurchase = customerSales.length > 0 
        ? (Date.now() - new Date(customerSales[customerSales.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      
      return {
        customerId: customer.id,
        customerName: customer.name,
        daysSinceLastPurchase,
        purchaseFrequency: customerSales.length,
        totalValue: customerSales.reduce((sum, s) => sum + s.salePrice, 0)
      }
    })

    const retentionSegments = {
      active: retentionData.filter(c => c.daysSinceLastPurchase <= 30).length,
      recent: retentionData.filter(c => c.daysSinceLastPurchase > 30 && c.daysSinceLastPurchase <= 90).length,
      atRisk: retentionData.filter(c => c.daysSinceLastPurchase > 90 && c.daysSinceLastPurchase <= 180).length,
      churned: retentionData.filter(c => c.daysSinceLastPurchase > 180).length
    }

    return {
      totalCustomers,
      individualCustomers,
      companyCustomers,
      activeCustomers,
      inactiveCustomers,
      blacklistCustomers,
      acquisitionByMonth,
      segments,
      topCustomers,
      retentionSegments,
      averageCustomerValue: Object.values(customerValueMap).reduce((sum: number, c: any) => sum + c.totalRevenue, 0) / Math.max(Object.keys(customerValueMap).length, 1)
    }
  }, [customers, sales])

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu khách hàng</h3>
        <p className="mt-1 text-sm text-gray-500">
          Chưa có khách hàng nào trong hệ thống.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Phân Tích Khách Hàng</h3>
        <p className="text-sm text-gray-600">
          Thống kê và phân tích hành vi khách hàng
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Khách Hàng</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Khách Hàng Hoạt Động</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh Nghiệp</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.companyCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giá Trị TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageCustomerValue.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Types */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Phân Loại Khách Hàng</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Cá nhân</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.individualCustomers}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.individualCustomers / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Doanh nghiệp</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.companyCustomers}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.companyCustomers / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Hoạt động</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.activeCustomers}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.activeCustomers / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Blacklist</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.blacklistCustomers}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.blacklistCustomers / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Segments by Value */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Phân Khúc Giá Trị</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">VIP (≥10M VND)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.segments.vip}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.segments.vip / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Thường xuyên (1M-10M VND)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.segments.regular}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.segments.regular / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Nhỏ (&lt;1M VND)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.segments.small}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.segments.small / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Mới (≤30 ngày)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{analytics.segments.new}</div>
                <div className="text-sm text-gray-500">
                  {((analytics.segments.new / analytics.totalCustomers) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Retention */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Phân Tích Giữ Chân Khách Hàng</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.retentionSegments.active}</div>
            <div className="text-sm text-green-700">Hoạt động (≤30 ngày)</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.retentionSegments.recent}</div>
            <div className="text-sm text-blue-700">Gần đây (30-90 ngày)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{analytics.retentionSegments.atRisk}</div>
            <div className="text-sm text-yellow-700">Có nguy cơ (90-180 ngày)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{analytics.retentionSegments.churned}</div>
            <div className="text-sm text-red-700">Mất khách (&gt;180 ngày)</div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Top 5 Khách Hàng Giá Trị Cao</h4>
        <div className="space-y-4">
          {analytics.topCustomers.map((customer, index) => (
            <div key={customer.customerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{customer.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    {customer.customerType === 'company' ? (
                      <BuildingOfficeIcon className="h-4 w-4" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                    <span className="capitalize">
                      {customer.customerType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {customer.totalRevenue.toLocaleString('vi-VN')} VND
                </div>
                <div className="text-sm text-gray-500">
                  {customer.salesCount} giao dịch • {customer.totalBills} bills
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Acquisition Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Xu Hướng Tăng Trưởng Khách Hàng</h4>
        <div className="space-y-3">
          {Object.entries(analytics.acquisitionByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(month + '-01').toLocaleDateString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">+{count} khách hàng</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default CustomerAnalytics
