import React, { useState, useMemo } from 'react'
import { BillSale } from '@/types'
import Button from '@/components/common/Button'
import { 
  ArrowTrendingUpIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface SalesReportProps {
  sales: BillSale[]
  dateRange: { startDate: Date; endDate: Date }
  onExport: (format: 'excel' | 'pdf' | 'csv') => void
}

const SalesReport: React.FC<SalesReportProps> = ({
  sales,
  dateRange,
  onExport
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!sales.length) return null

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const totalBills = sales.reduce((sum, sale) => sum + sale.bills.length, 0)
    const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size
    const averageProfit = totalProfit / sales.length
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Group by period
    const groupedData = sales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt)
      let key: string

      if (selectedPeriod === 'daily') {
        key = date.toISOString().split('T')[0]
      } else if (selectedPeriod === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!acc[key]) {
        acc[key] = {
          revenue: 0,
          profit: 0,
          bills: 0,
          sales: 0
        }
      }

      acc[key].revenue += sale.salePrice
      acc[key].profit += sale.profit
      acc[key].bills += sale.bills.length
      acc[key].sales += 1

      return acc
    }, {} as Record<string, { revenue: number; profit: number; bills: number; sales: number }>)

    // Sort by date
    const sortedData = Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        ...data
      }))

    return {
      totalRevenue,
      totalProfit,
      totalBills,
      uniqueCustomers,
      averageProfit,
      profitMargin,
      groupedData: sortedData
    }
  }, [sales, selectedPeriod])

  // Top customers
  const topCustomers = useMemo(() => {
    const customerStats = sales.reduce((acc, sale) => {
      if (!acc[sale.customerId]) {
        acc[sale.customerId] = {
          customerId: sale.customerId,
          customerName: sale.customerName,
          totalRevenue: 0,
          totalProfit: 0,
          totalBills: 0,
          salesCount: 0
        }
      }

      acc[sale.customerId].totalRevenue += sale.salePrice
      acc[sale.customerId].totalProfit += sale.profit
      acc[sale.customerId].totalBills += sale.bills.length
      acc[sale.customerId].salesCount += 1

      return acc
    }, {} as Record<string, any>)

    return Object.values(customerStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  }, [sales])

  // Payment method distribution
  const paymentMethods = useMemo(() => {
    const methods = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 }
      }
      acc[method].count += 1
      acc[method].revenue += sale.salePrice
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return Object.entries(methods)
      .map(([method, data]) => ({
        method,
        ...data,
        percentage: (data.count / sales.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
  }, [sales])

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu bán hàng</h3>
        <p className="mt-1 text-sm text-gray-500">
          Chưa có giao dịch bán bill nào trong khoảng thời gian này.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Báo Cáo Doanh Số</h3>
          <p className="text-sm text-gray-600">
            {dateRange.startDate.toLocaleDateString('vi-VN')} - {dateRange.endDate.toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="daily">Theo ngày</option>
            <option value="weekly">Theo tuần</option>
            <option value="monthly">Theo tháng</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => onExport('excel')}
            leftIcon={<ChartBarIcon className="h-4 w-4" />}
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalRevenue.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Lợi Nhuận</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalProfit.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Bills</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalBills}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Khách Hàng</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.uniqueCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Xu Hướng Doanh Thu</h4>
          <div className="space-y-3">
            {analytics.groupedData.map((item) => (
              <div key={item.period} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {selectedPeriod === 'daily' 
                      ? new Date(item.period).toLocaleDateString('vi-VN')
                      : selectedPeriod === 'weekly'
                      ? `Tuần ${item.period}`
                      : `Tháng ${item.period}`
                    }
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {item.revenue.toLocaleString('vi-VN')} VND
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.sales} giao dịch
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Phương Thức Thanh Toán</h4>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {method.method === 'cash' ? 'Tiền mặt' :
                     method.method === 'bank_transfer' ? 'Chuyển khoản' :
                     method.method === 'credit_card' ? 'Thẻ tín dụng' : method.method}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {method.count} ({method.percentage.toFixed(1)}%)
                  </div>
                  <div className="text-sm text-gray-500">
                    {method.revenue.toLocaleString('vi-VN')} VND
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Top 10 Khách Hàng</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách Hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh Thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lợi Nhuận
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giao Dịch
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={customer.customerId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.customerId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.totalRevenue.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {customer.totalProfit.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalBills}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.salesCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Phân Tích Lợi Nhuận</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.profitMargin.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Tỷ Lệ Lợi Nhuận</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.averageProfit.toLocaleString('vi-VN')} VND
            </div>
            <div className="text-sm text-gray-600">Lợi Nhuận Trung Bình</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {sales.length}
            </div>
            <div className="text-sm text-gray-600">Tổng Giao Dịch</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesReport
