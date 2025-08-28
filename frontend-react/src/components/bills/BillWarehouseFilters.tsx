import React, { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { BillFilters } from '@/types'

interface BillWarehouseFiltersProps {
  filters: BillFilters
  onFilterChange: (filters: BillFilters) => void
  onAmountFilter: (targetAmount: number) => void
  totalBills: number
}

const BillWarehouseFilters: React.FC<BillWarehouseFiltersProps> = ({
  filters,
  onFilterChange,
  onAmountFilter,
  totalBills
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [targetAmount, setTargetAmount] = useState('')

  const handleAmountFilter = () => {
    const amount = parseFloat(targetAmount)
    if (amount > 0) {
      onAmountFilter(amount)
    }
  }

  const clearFilters = () => {
    onFilterChange({
      minAmount: undefined,
      maxAmount: undefined,
      status: 'all',
      search: '',
      customerName: '',
      month: ''
    })
    setTargetAmount('')
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== 'all'
  ) || targetAmount !== ''

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Bộ Lọc ({totalBills} bill)
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            leftIcon={<FunnelIcon className="h-4 w-4" />}
          >
            {showAdvancedFilters ? 'Ẩn' : 'Hiện'} Bộ Lọc Nâng Cao
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<XMarkIcon className="h-4 w-4" />}
            >
              Xóa Bộ Lọc
            </Button>
          )}
        </div>
      </div>

      {/* Basic Search */}
      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã hợp đồng, tên khách hàng..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        />
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Input
              label="Số tiền tối thiểu"
              type="number"
              placeholder="0"
              value={filters.minAmount || ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
          <div>
            <Input
              label="Số tiền tối đa"
              type="number"
              placeholder="Không giới hạn"
              value={filters.maxAmount || ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
          <div>
            <Select
              label="Trạng thái"
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'IN_WAREHOUSE', label: 'Có sẵn' },
                { value: 'sold', label: 'Đã bán' },
                { value: 'expired', label: 'Hết hạn' }
              ]}
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Tháng"
              type="month"
              value={filters.month || ''}
              onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Smart Amount Filter */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-3">
          🎯 Tìm Bill Theo Số Tiền (Thuật Toán Thông Minh)
        </h4>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Input
              label="Số tiền mục tiêu"
              type="number"
              placeholder="VD: 1000000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </div>
          <Button
            onClick={handleAmountFilter}
            disabled={!targetAmount || parseFloat(targetAmount) <= 0}
            variant="primary"
            size="md"
          >
            Tìm Bill Gộp
          </Button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Hệ thống sẽ tìm các bill có thể gộp lại để đạt được số tiền mục tiêu với sai số 0-10%
        </p>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Bộ lọc đang áp dụng:</span>
            {filters.search && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Tìm kiếm: {filters.search}
              </span>
            )}
            {filters.minAmount && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Min: {filters.minAmount.toLocaleString('vi-VN')} VND
              </span>
            )}
            {filters.maxAmount && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Max: {filters.maxAmount.toLocaleString('vi-VN')} VND
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Trạng thái: {filters.status}
              </span>
            )}
            {filters.month && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Tháng: {filters.month}
              </span>
            )}
            {targetAmount && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                Mục tiêu: {parseFloat(targetAmount).toLocaleString('vi-VN')} VND
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BillWarehouseFilters
