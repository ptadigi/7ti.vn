import React, { useState, useEffect } from 'react'
import { Customer } from '@/types'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { UserIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (customer: Partial<Customer>) => void
  onCancel: () => void
  loading?: boolean
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    taxCode: '',
    customerType: 'individual',
    status: 'active',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        companyName: customer.companyName || '',
        taxCode: customer.taxCode || '',
        customerType: customer.customerType || 'individual',
        status: customer.status || 'active',
        notes: customer.notes || ''
      })
    }
  }, [customer])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên khách hàng là bắt buộc'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc'
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (formData.customerType === 'company' && !formData.companyName?.trim()) {
      newErrors.companyName = 'Tên công ty là bắt buộc cho khách hàng doanh nghiệp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof Customer, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const customerTypeOptions = [
    { value: 'individual', label: 'Cá nhân' },
    { value: 'company', label: 'Doanh nghiệp' }
  ]

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'blacklist', label: 'Blacklist' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
          Thông Tin Cơ Bản
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên Khách Hàng <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name || ''}
              onChange={(value) => handleInputChange('name', value)}
              placeholder="Nhập tên khách hàng"
              error={errors.name}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.phone || ''}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="0123456789"
              error={errors.phone}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              value={formData.email || ''}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="email@example.com"
              error={errors.email}
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại Khách Hàng
            </label>
            <Select
              value={formData.customerType || 'individual'}
              onChange={(value) => handleInputChange('customerType', value)}
              options={customerTypeOptions}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa Chỉ
          </label>
          <Input
            value={formData.address || ''}
            onChange={(value) => handleInputChange('address', value)}
            placeholder="Nhập địa chỉ đầy đủ"
          />
        </div>
      </div>

      {/* Company Information */}
      {formData.customerType === 'company' && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mr-2" />
            Thông Tin Doanh Nghiệp
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Tên Công Ty <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.companyName || ''}
                onChange={(value) => handleInputChange('companyName', value)}
                placeholder="Nhập tên công ty"
                error={errors.companyName}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Mã Số Thuế
              </label>
              <Input
                value={formData.taxCode || ''}
                onChange={(value) => handleInputChange('taxCode', value)}
                placeholder="Nhập mã số thuế"
              />
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Thông Tin Bổ Sung
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng Thái
            </label>
            <Select
              value={formData.status || 'active'}
              onChange={(value) => handleInputChange('status', value)}
              options={statusOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi Chú
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Nhập ghi chú về khách hàng"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {customer ? 'Cập Nhật' : 'Thêm Mới'}
        </Button>
      </div>
    </form>
  )
}

export default CustomerForm
