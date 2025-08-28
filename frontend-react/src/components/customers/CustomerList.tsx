import React, { useState } from 'react'
import { Customer } from '@/types'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import CustomerDetailModal from './CustomerDetailModal'
import { EyeIcon, PencilIcon, TrashIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

interface CustomerListProps {
  customers: Customer[]
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  loading?: boolean
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onView,
  onEdit,
  onDelete,
  loading = false
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
  }

  const tableColumns = [
    {
      key: 'name',
      label: 'Tên Khách Hàng',
      sortable: true,
      render: (value: string, customer: Customer) => (
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            customer.customerType === 'COMPANY' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            {customer.customerType === 'COMPANY' ? (
              <BuildingOfficeIcon className="h-4 w-4" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {customer.customerType === 'COMPANY' && customer.companyName && (
              <div className="text-sm text-gray-500">{customer.companyName}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Số Điện Thoại',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <span className="text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => (
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Chưa có'}
        </span>
      )
    },
    {
      key: 'address',
      label: 'Địa Chỉ',
      sortable: false,
      render: (value: string) => (
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Chưa có'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          value === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'ACTIVE' ? 'Hoạt động' : 
           value === 'INACTIVE' ? 'Không hoạt động' : 'Blacklist'}
        </span>
      )
    },
    {
      key: 'totalBills',
      label: 'Tổng Bill',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {value || 0}
        </span>
      )
    },
    {
      key: 'totalAmount',
      label: 'Tổng Giá Trị',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {value ? `${value.toLocaleString('vi-VN')} VND` : '0 VND'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      sortable: false,
      render: (value: any, customer: Customer) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCustomer(customer)}
            leftIcon={<EyeIcon className="h-4 w-4" />}
          >
            Xem
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(customer)}
            leftIcon={<PencilIcon className="h-4 w-4" />}
          >
            Sửa
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(customer)}
            leftIcon={<TrashIcon className="h-4 w-4" />}
          >
            Xóa
          </Button>
        </div>
      )
    }
  ]

  if (customers.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có khách hàng nào</h3>
        <p className="mt-1 text-sm text-gray-500">
          Bắt đầu bằng cách thêm khách hàng đầu tiên.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table
          data={customers}
          columns={tableColumns}
          searchable={false}
          sortable={true}
          pagination={true}
          pageSize={10}
          loading={loading}
        />
      </div>

      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

export default CustomerList
