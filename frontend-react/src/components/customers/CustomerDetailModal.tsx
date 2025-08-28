import React, { useState, useEffect } from 'react'
import { Customer, BillSale } from '@/types'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { XMarkIcon, UserIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { billService } from '@/services'

interface CustomerDetailModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [sales, setSales] = useState<BillSale[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customer && isOpen) {
      loadCustomerData()
    }
  }, [customer, isOpen])

  const loadCustomerData = async () => {
    if (!customer) return
    
    setLoading(true)
    try {
      // Load sales của khách hàng (bao gồm cả bills)
      const salesResponse = await billService.getCustomerSales(customer.id)
      if (salesResponse.data) {
        const salesData = Array.isArray(salesResponse.data) ? salesResponse.data : salesResponse.data.sales || []
        setSales(salesData)
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!customer) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'BLACKLIST': 'bg-red-100 text-red-800'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
  }

  const getCustomerTypeIcon = () => {
    return customer.customerType === 'COMPANY' ? (
      <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
    ) : (
      <UserIcon className="h-6 w-6 text-green-600" />
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getCustomerTypeIcon()}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-500">
                {customer.customerType === 'COMPANY' ? 'Doanh nghiệp' : 'Cá nhân'}
                {customer.customerType === 'COMPANY' && customer.companyName && ` - ${customer.companyName}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<XMarkIcon className="h-5 w-5" />}
          >
            Đóng
          </Button>
        </div>

        {/* Customer Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Liên Hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Tài Chính</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(customer.status)}`}>
                  {customer.status === 'ACTIVE' ? 'Hoạt động' : 
                   customer.status === 'INACTIVE' ? 'Không hoạt động' : 'Blacklist'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tổng số bill:</span>
                <span className="font-semibold text-gray-900">{customer.totalBills || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tổng giá trị:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(customer.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
              Danh Sách Bill ({sales.length})
            </button>
            <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Lịch Sử Giao Dịch ({sales.length})
            </button>
          </nav>
        </div>

        {/* Bills Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Danh Sách Bill
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã Bill Điện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nợ Cước
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kỳ Thanh Toán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng Thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày Tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    sale.bills && Array.isArray(sale.bills) ? 
                    sale.bills.map((bill: any) => (
                      <tr key={`${sale.id}-${bill.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bill.contract_code || `#${bill.id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.customer_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bill.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.period || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            bill.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                            bill.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                            bill.status === 'IN_WAREHOUSE' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.status === 'COMPLETED' ? 'Hoàn thành' : 
                             bill.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' :
                             bill.status === 'PAID' ? 'Đã thanh toán' :
                             bill.status === 'IN_WAREHOUSE' ? 'Trong kho' : bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.created_at ? formatDate(bill.created_at) : 'N/A'}
                        </td>
                      </tr>
                    )) : 
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{sale.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        N/A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sale.total_bill_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        N/A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          sale.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status === 'COMPLETED' ? 'Hoàn thành' : 
                           sale.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.created_at ? formatDate(sale.created_at) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bill nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Khách hàng này chưa có bill nào.
              </p>
            </div>
          )}
        </div>

        {/* Giao Dịch Table - Hiển thị cả mã giao dịch và mã bill điện */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Lịch Sử Giao Dịch
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã Giao Dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã Bill Điện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày Giao Dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số Tiền Bill
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lợi Nhuận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phương Thức Thanh Toán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng Thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    sale.bills && Array.isArray(sale.bills) ? 
                    sale.bills.map((bill: any) => (
                      <tr key={`${sale.id}-${bill.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.contract_code || `#${bill.id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.created_at ? formatDate(sale.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bill.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(sale.profit_amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            sale.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.status === 'COMPLETED' ? 'Hoàn thành' : 
                             sale.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : sale.status}
                          </span>
                        </td>
                      </tr>
                    )) : 
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{sale.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        N/A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.created_at ? formatDate(sale.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sale.total_bill_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sale.profit_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          sale.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status === 'COMPLETED' ? 'Hoàn thành' : 
                           sale.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có giao dịch nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Khách hàng này chưa có giao dịch nào.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CustomerDetailModal
