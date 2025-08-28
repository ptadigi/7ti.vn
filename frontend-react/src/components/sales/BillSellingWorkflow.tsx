import React, { useState, useEffect } from 'react'
import { Bill, Customer, BillSale } from '@/types'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { 
  ShoppingCartIcon, 
  UserIcon, 
  CalculatorIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface BillSellingWorkflowProps {
  selectedBills: Bill[]
  onComplete: (sale: BillSale) => void
  onCancel: () => void
}

const BillSellingWorkflow: React.FC<BillSellingWorkflowProps> = ({
  selectedBills,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [salePrice, setSalePrice] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Calculate totals
  const totalBillAmount = selectedBills.reduce((sum, bill) => sum + (bill.totalContractAmount || 0), 0)
  const totalFee = selectedBills.reduce((sum, bill) => sum + (bill.totalFee || 0), 0)
  const profit = salePrice - totalBillAmount
  const profitPercentage = totalBillAmount > 0 ? (profit / totalBillAmount) * 100 : 0

  // Mock customers for demo
  const mockCustomers: Customer[] = [
    { id: '1', name: 'Nguyễn Văn A', phone: '0123456789', customerType: 'individual' } as Customer,
    { id: '2', name: 'Trần Thị B', phone: '0987654321', customerType: 'company' } as Customer,
    { id: '3', name: 'Lê Văn C', phone: '0369852147', customerType: 'individual' } as Customer
  ]

  useEffect(() => {
    // Set default sale price to total bill amount
    setSalePrice(totalBillAmount)
  }, [totalBillAmount])

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCompleteSale = async () => {
    if (!selectedCustomer || salePrice <= 0) {
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const sale: BillSale = {
        id: Date.now().toString(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        bills: selectedBills,
        totalBillAmount,
        salePrice,
        profit,
        paymentMethod,
        notes,
        status: 'completed',
        createdAt: new Date()
      }
      
      onComplete(sale)
    } catch (error) {
      console.error('Error completing sale:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedBills.length > 0
      case 2: return selectedCustomer !== null
      case 3: return salePrice > 0
      case 4: return true
      default: return false
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              step
            )}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Xác Nhận Bills Đã Chọn</h3>
              <p className="mt-2 text-sm text-gray-600">
                Kiểm tra danh sách bills sẽ bán
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Bills Đã Chọn ({selectedBills.length})</h4>
              <div className="space-y-3">
                {selectedBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium text-gray-900">{bill.contractNumber}</div>
                      <div className="text-sm text-gray-500">{bill.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {(bill.totalContractAmount || 0).toLocaleString('vi-VN')} VND
                      </div>
                      <div className="text-sm text-gray-500">
                        Phí: {(bill.totalFee || 0).toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-800">Tổng Bills:</span>
                  <p className="text-blue-900 font-semibold">{selectedBills.length}</p>
                </div>
                <div>
                  <span className="text-blue-800">Tổng Giá Trị:</span>
                  <p className="text-blue-900 font-semibold">
                    {totalBillAmount.toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <div>
                  <span className="text-blue-800">Tổng Phí:</span>
                  <p className="text-blue-900 font-semibold">
                    {totalFee.toLocaleString('vi-VN')} VND
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserIcon className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Chọn Khách Hàng</h3>
              <p className="mt-2 text-sm text-gray-600">
                Chọn khách hàng mua bills
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn Khách Hàng <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedCustomer?.id || ''}
                  onChange={(value) => {
                    const customer = mockCustomers.find(c => c.id === value)
                    setSelectedCustomer(customer || null)
                  }}
                  options={[
                    { value: '', label: 'Chọn khách hàng...' },
                    ...mockCustomers.map(c => ({
                      value: c.id,
                      label: `${c.name} (${c.phone}) - ${c.customerType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}`
                    }))
                  ]}
                />
              </div>

              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Thông Tin Khách Hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Tên:</span>
                      <p className="text-green-900 font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <span className="text-green-700">SĐT:</span>
                      <p className="text-green-900 font-medium">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <span className="text-green-700">Loại:</span>
                      <p className="text-green-900 font-medium">
                        {selectedCustomer.customerType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CalculatorIcon className="mx-auto h-12 w-12 text-yellow-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Định Giá & Thanh Toán</h3>
              <p className="mt-2 text-sm text-gray-600">
                Nhập giá bán và phương thức thanh toán
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá Bán (VND) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={salePrice.toString()}
                    onChange={(value) => setSalePrice(Number(value) || 0)}
                    placeholder="Nhập giá bán"
                    type="number"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương Thức Thanh Toán
                  </label>
                  <Select
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    options={[
                      { value: 'cash', label: 'Tiền mặt' },
                      { value: 'bank_transfer', label: 'Chuyển khoản' },
                      { value: 'credit_card', label: 'Thẻ tín dụng' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi Chú
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú về giao dịch"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Tóm Tắt Giao Dịch</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng giá bills:</span>
                      <span className="font-medium">{totalBillAmount.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá bán:</span>
                      <span className="font-medium text-blue-600">{salePrice.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lợi nhuận:</span>
                      <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ lợi nhuận:</span>
                      <span className={`font-medium ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {profit < 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">!</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Cảnh báo: Lỗ vốn
                        </h3>
                        <p className="mt-1 text-sm text-red-700">
                          Giá bán thấp hơn giá gốc. Bạn có chắc muốn tiếp tục?
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Xác Nhận Giao Dịch</h3>
              <p className="mt-2 text-sm text-gray-600">
                Kiểm tra thông tin cuối cùng trước khi hoàn tất
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-medium text-green-800 mb-4">Thông Tin Giao Dịch</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-green-700 mb-2">Khách Hàng</h5>
                  <p className="text-green-900">{selectedCustomer?.name}</p>
                  <p className="text-green-700 text-sm">{selectedCustomer?.phone}</p>
                </div>
                <div>
                  <h5 className="font-medium text-green-700 mb-2">Bills</h5>
                  <p className="text-green-900">{selectedBills.length} bills</p>
                  <p className="text-green-700 text-sm">
                    Tổng: {totalBillAmount.toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-green-700 mb-2">Giá Bán</h5>
                  <p className="text-green-900 font-semibold">
                    {salePrice.toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-green-700 mb-2">Lợi Nhuận</h5>
                  <p className={`font-semibold ${profit >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                    {profit.toLocaleString('vi-VN')} VND ({profitPercentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Bạn có chắc muốn hoàn tất giao dịch này?
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? onCancel : handlePrevStep}
          disabled={loading}
        >
          {currentStep === 1 ? 'Hủy' : 'Quay Lại'}
        </Button>

        <div className="flex space-x-3">
          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={handleNextStep}
              disabled={!canProceedToNext() || loading}
            >
              Tiếp Theo
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleCompleteSale}
              loading={loading}
              disabled={!selectedCustomer || salePrice <= 0}
              leftIcon={<CurrencyDollarIcon className="h-4 w-4" />}
            >
              Hoàn Tất Giao Dịch
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BillSellingWorkflow
