import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  ArchiveBoxIcon, 
  UsersIcon, 
  ShoppingCartIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { reportsService } from '@/services'
// ApiResponse có thể được sử dụng trong tương lai
// import { ApiResponse } from '@/services/apiClient'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { name: 'Tổng Bill trong Kho', value: '0', change: '+0%', changeType: 'increase' },
    { name: 'Khách Hàng', value: '0', change: '+0%', changeType: 'increase' },
    { name: 'Giao Dịch Tháng', value: '0', change: '+0%', changeType: 'increase' },
    { name: 'Doanh Thu Tháng', value: '0', change: '+0%', changeType: 'increase' },
  ])
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await reportsService.getDashboardSummary()
      
      if (response.success && response.data) {
        const dashboardStats = [
          { 
            name: 'Tổng Bill trong Kho', 
            value: response.data.totalBills?.toString() || '0', 
            change: '+0%', 
            changeType: 'increase' 
          },
          { 
            name: 'Khách Hàng', 
            value: response.data.totalCustomers?.toString() || '0', 
            change: '+0%', 
            changeType: 'increase' 
          },
          { 
            name: 'Giao Dịch Tháng', 
            value: response.data.monthlySales?.toString() || '0', 
            change: '+0%', 
            changeType: 'increase' 
          },
          { 
            name: 'Doanh Thu Tháng', 
            value: response.data.monthlyRevenue ? `${(response.data.monthlyRevenue / 1000000).toFixed(1)}M` : '0', 
            change: '+0%', 
            changeType: 'increase' 
          },
        ]
        setStats(dashboardStats)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      name: 'Tra Cứu Bill',
      description: 'Tra cứu thông tin bill điện',
      href: '/bill-search',
      icon: MagnifyingGlassIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Thêm vào Kho',
      description: 'Thêm bill mới vào kho',
      href: '/warehouse',
      icon: ArchiveBoxIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Quản lý KH',
      description: 'Thêm/sửa thông tin khách hàng',
      href: '/customers',
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Bán Bill',
      description: 'Tạo giao dịch bán bill',
      href: '/sales',
      icon: ShoppingCartIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Xem Báo Cáo',
      description: 'Thống kê và báo cáo',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tổng quan hệ thống quản lý bill điện FPT
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:px-6"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 rounded-lg p-3 ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <PlusIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hoạt Động Gần Đây</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                        <PlusIcon className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          Thêm <span className="font-medium text-gray-900">5 bill mới</span> vào kho
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        3 phút trước
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <ShoppingCartIcon className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          Bán bill cho <span className="font-medium text-gray-900">Nguyễn Văn A</span>
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        1 giờ trước
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                        <UsersIcon className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          Thêm khách hàng <span className="font-medium text-gray-900">Trần Thị B</span>
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        2 giờ trước
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
