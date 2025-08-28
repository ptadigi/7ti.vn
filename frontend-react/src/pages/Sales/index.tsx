import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { Bill, Customer, BillSale } from '@/types'
import { 
  ShoppingCartIcon, 
  UserIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { billService, customerService, salesService } from '@/services'

const Sales: React.FC = () => {
  const [selectedBills, setSelectedBills] = useState<Bill[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [profitPercentage, setProfitPercentage] = useState<number>(10)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showBillSelector, setShowBillSelector] = useState(false)

  const [availableBills, setAvailableBills] = useState<Bill[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<BillSale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null)

  // Load data from API
  useEffect(() => {
    loadAvailableBills()
    loadAvailableCustomers()
    loadSales()
  }, [])

  // Load available bills
  const loadAvailableBills = async () => {
    try {
      const response = await billService.getWarehouseBills({ status: 'IN_WAREHOUSE' })
      if (response.success && response.data) {
        // Đảm bảo response.data.bills là array
        const bills = response.data.bills || []
        setAvailableBills(bills)
      } else {
        setAvailableBills([])
      }
    } catch (error) {
      console.error('Error loading bills:', error)
      setAvailableBills([])
    }
  }

  // Load available customers
  const loadAvailableCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers()
      if (response.success && response.data) {
        // Đảm bảo response.data là array
        const customers = Array.isArray(response.data) ? response.data : ((response.data as any).customers || [])
        setAvailableCustomers(customers)
      } else {
        setAvailableCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setAvailableCustomers([])
    }
  }

  // Load sales data
  const loadSales = async () => {
    try {
      setLoadingSales(true)
      const response = await salesService.getAllSales()
      if (response.success && response.data) {
        // API trả về object với sales array
        const salesData = (response.data as any).sales || []
        setSales(salesData)
      } else {
        setSales([])
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      setSales([])
    } finally {
      setLoadingSales(false)
    }
  }

  const totalBillAmount = selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  const profit = (totalBillAmount * profitPercentage) / 100
  const customerPayment = totalBillAmount - profit // Số tiền trả lại cho khách hàng

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }

  // Get sorted sales
  const getSortedSales = () => {
    if (!sortConfig) return sales

    return [...sales].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.key) {
        case 'id':
          aValue = parseInt(a.id)
          bValue = parseInt(b.id)
          break
        case 'customer_name':
          aValue = a.customer?.name || ''
          bValue = b.customer?.name || ''
          break
        case 'total_bill_amount':
          aValue = a.total_bill_amount || 0
          bValue = b.total_bill_amount || 0
          break
        case 'profit_amount':
          aValue = a.profit_amount || 0
          bValue = b.profit_amount || 0
          break
        case 'customer_payment':
          aValue = a.customer_payment || 0
          bValue = b.customer_payment || 0
          break
        case 'payment_method':
          aValue = a.payment_method || ''
          bValue = b.payment_method || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  useEffect(() => {
    // Không cần set gì, customerPayment sẽ tự động tính từ profitPercentage
  }, [selectedBills, totalBillAmount, profitPercentage])

  const handleSelectBills = (bills: Bill[]) => {
    setSelectedBills(bills)
    setShowBillSelector(false)
    toast.success(`Đã chọn ${bills.length} bill`)
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    toast.success(`Đã chọn khách hàng: ${customer.name}`)
  }

  const handleCreateSale = async () => {
    if (!selectedCustomer || selectedBills.length === 0) {
      toast.error('Vui lòng chọn khách hàng và bill')
      return
    }

    if (profitPercentage < 0 || profitPercentage > 100) {
      toast.error('Phần trăm lợi nhuận phải từ 0-100%')
      return
    }

    setLoading(true)

    try {
      // Tạo sale data để gửi lên API
      const saleData = {
        customer_id: parseInt(selectedCustomer.id),
        user_id: 1, // Assuming user ID 1 (admin)
        bill_ids: selectedBills.map(bill => bill.id),
        total_bill_amount: totalBillAmount,
        profit_percentage: profitPercentage,
        payment_method: paymentMethod,
        notes: notes
      }



      // Gọi API tạo sale
      const saleResponse = await salesService.createSale(saleData)
      
      if (saleResponse.success) {

        
        // TODO: Cập nhật bill status thành PENDING_PAYMENT (tạm thời tắt do CORS issue)
        // const billIds = selectedBills.map(bill => bill.id)

        
        // Tạm thời skip bulkUpdateBillStatus call để tránh CORS error
        // const updateResponse = await billService.bulkUpdateBillStatus(billIds, 'PENDING_PAYMENT')
        
        // Hiển thị success message
          toast.success(`Giao dịch bán bill thành công! Lợi nhuận: ${profit.toLocaleString('vi-VN')} đ, Số tiền trả khách: ${customerPayment.toLocaleString('vi-VN')} đ`)
        
        // Reload sales list to show new transaction
        await loadSales()
        // Reload available bills to update the list  
        await loadAvailableBills()
      } else {
        console.error('Failed to create sale:', saleResponse.error)
        toast.error(saleResponse.error || 'Có lỗi xảy ra khi tạo giao dịch bán')
        return
      }
      
      // Reset form
      setSelectedBills([])
      setSelectedCustomer(null)
      setProfitPercentage(10)
      setPaymentMethod('cash')
      setNotes('')
      
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error('Có lỗi xảy ra khi tạo giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBill = (billId: string) => {
    setSelectedBills(prev => prev.filter(bill => bill.id !== billId))
    toast.success('Đã xóa bill khỏi danh sách')
  }

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null)
    toast.success('Đã xóa khách hàng')
  }

  // Confirm customer payment - chuyển từ PENDING_PAYMENT sang PAID
  const handleConfirmPayment = async (saleId: string) => {
    try {
      setLoadingSales(true)
      const response = await salesService.confirmPayment(saleId)
      
      if (response.success) {
        toast.success('Xác nhận khách hàng đã thanh toán thành công!')
        await loadSales() // Reload sales data
        await loadAvailableBills() // Reload available bills
      } else {
        toast.error(response.error || 'Có lỗi xảy ra khi xác nhận thanh toán')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Có lỗi xảy ra khi xác nhận thanh toán')
    } finally {
      setLoadingSales(false)
    }
  }

  // Complete sale - mình đã thanh lại cho khách
  const handleCompleteSale = async (saleId: string) => {
    try {
      setLoadingSales(true)
      const response = await salesService.completeSale(saleId)
      
      if (response.success) {
        toast.success('Đã thanh lại cho khách hàng thành công!')
        await loadSales() // Reload sales data
        await loadAvailableBills() // Reload available bills
      } else {
        toast.error(response.error || 'Có lỗi xảy ra khi hoàn tất giao dịch')
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      toast.error('Có lỗi xảy ra khi hoàn tất giao dịch')
    } finally {
      setLoadingSales(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bán Bill</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tạo giao dịch bán bill: Khách thanh toán đúng giá bill, chúng ta trả lại = giá bill - % lợi nhuận
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Chọn Bill
          </h2>

          {selectedBills.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bill nào</h3>
              <p className="mt-1 text-sm text-gray-500">Chọn bill để bắt đầu giao dịch</p>
              <Button
                onClick={() => setShowBillSelector(true)}
                variant="primary"
                className="mt-4"
                leftIcon={<ShoppingCartIcon className="h-4 w-4" />}
              >
                Chọn Bill
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{bill.contract_code}</p>
                    <p className="text-sm text-gray-600">{bill.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {bill.amount?.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRemoveBill(bill.id)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<XMarkIcon className="h-4 w-4" />}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  Tổng: {totalBillAmount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              <Button
                onClick={() => setShowBillSelector(true)}
                variant="secondary"
                className="w-full"
                leftIcon={<ShoppingCartIcon className="h-4 w-4" />}
              >
                Thêm Bill
              </Button>
            </div>
          )}
        </div>

        {/* Customer & Sale Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Thông Tin Giao Dịch
          </h2>

          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khách Hàng
            </label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <Button
                  onClick={handleRemoveCustomer}
                  variant="ghost"
                  size="sm"
                  leftIcon={<XMarkIcon className="h-4 w-4" />}
                >
                  Xóa
                </Button>
              </div>
            ) : (
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value && e.target.value !== '') {
                    const customer = availableCustomers.find(c => c.id == e.target.value)
                    if (customer) {
                      handleSelectCustomer(customer)
                    }
                  }
                }}
                className="w-full"
                options={[
                  { value: '', label: 'Chọn khách hàng' },
                  ...(Array.isArray(availableCustomers) ? availableCustomers.map((customer) => ({
                    value: customer.id,
                    label: `${customer.name} - ${customer.phone}`
                  })) : [])
                ]}
              />
            )}
          </div>

          {/* Profit Percentage */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phần Trăm Lợi Nhuận (%)
            </label>
            <Input
              type="number"
              value={profitPercentage}
              onChange={(e) => setProfitPercentage(Number(e.target.value))}
              placeholder="Nhập % lợi nhuận"
              className="w-full"
              min="0"
              max="100"
            />
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương Thức Thanh Toán
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full"
              options={[
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'bank_transfer', label: 'Chuyển khoản' },
                { value: 'credit_card', label: 'Thẻ tín dụng' }
              ]}
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi Chú
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú giao dịch"
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng giá bill:</span>
              <span className="font-medium">{totalBillAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">% Lợi nhuận:</span>
              <span className="font-medium text-blue-600">{profitPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lợi nhuận:</span>
              <span className="font-medium text-green-600">
                {profit.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-600 font-medium">Số tiền trả khách:</span>
              <span className="font-bold text-green-600">
                {customerPayment.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Create Sale Button */}
          <Button
            onClick={handleCreateSale}
            loading={loading}
            disabled={!selectedCustomer || selectedBills.length === 0 || profitPercentage < 0}
            variant="success"
            className="w-full mt-4"
            leftIcon={<CheckCircleIcon className="h-4 w-4" />}
          >
            Tạo Giao Dịch Bán
          </Button>
        </div>
      </div>

      {/* Sales List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Danh Sách Giao Dịch
          </h2>
          <Button
            onClick={loadSales}
            loading={loadingSales}
            variant="secondary"
            size="sm"
          >
            Làm Mới
          </Button>
        </div>
        
        {/* Table Header */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-3">
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">ID</span>
                <button 
                  onClick={() => handleSort('id')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'id' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'id' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Khách hàng</span>
                <button 
                  onClick={() => handleSort('customer_name')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'customer_name' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'customer_name' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Tổng tiền</span>
                <button 
                  onClick={() => handleSort('total_bill_amount')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'total_bill_amount' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'total_bill_amount' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Lợi nhuận</span>
                <button 
                  onClick={() => handleSort('profit_amount')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'profit_amount' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'profit_amount' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Trả khách</span>
                <button 
                  onClick={() => handleSort('customer_payment')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'customer_payment' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'customer_payment' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Phương thức</span>
                <button 
                  onClick={() => handleSort('payment_method')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'payment_method' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'payment_method' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Trạng thái & Thao tác</span>
                <button 
                  onClick={() => handleSort('status')}
                  className={`hover:text-gray-600 transition-colors ${
                    sortConfig?.key === 'status' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {sortConfig?.key === 'status' ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          {loadingSales ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : !Array.isArray(sales) || sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có giao dịch nào</h3>
              <p className="mt-1 text-sm text-gray-500">Tạo giao dịch đầu tiên để xem danh sách</p>
            </div>
          ) : (
            getSortedSales().map((sale) => (
              <div key={sale.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 gap-4 p-3 items-center">
                  {/* ID */}
                  <div className="col-span-1">
                    <p className="font-medium text-gray-900">#{sale.id}</p>
                  </div>
                  
                  {/* Khách hàng */}
                  <div className="col-span-1">
                    <p className="font-medium text-gray-900 truncate" title={sale.customer?.name || 'N/A'}>
                      {sale.customer?.name || 'N/A'}
                    </p>
                  </div>
                  
                  {/* Tổng tiền */}
                  <div className="col-span-1">
                    <p className="font-medium text-gray-900">{sale.total_bill_amount?.toLocaleString('vi-VN')} đ</p>
                  </div>
                  
                  {/* Lợi nhuận */}
                  <div className="col-span-1">
                    <p className="font-medium text-green-600">{sale.profit_amount?.toLocaleString('vi-VN')} đ</p>
                  </div>
                  
                  {/* Trả khách */}
                  <div className="col-span-1">
                    <p className="font-medium text-blue-600">{sale.customer_payment?.toLocaleString('vi-VN')} đ</p>
                  </div>
                  
                  {/* Phương thức */}
                  <div className="col-span-1">
                    <p className="font-medium text-gray-900">{sale.payment_method}</p>
                  </div>
                  
                  {/* Trạng thái & Thao tác */}
                  <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sale.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                      sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.status === 'PENDING_PAYMENT' ? 'Chờ Thanh Toán' :
                       sale.status === 'PAID' ? 'Đã Thanh Toán' :
                       sale.status === 'COMPLETED' ? 'Hoàn Tất' : sale.status}
                    </span>

                {/* Action Buttons */}
                  {sale.status === 'PENDING_PAYMENT' && (
                    <Button
                      onClick={() => handleConfirmPayment(sale.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                          Xác Nhận
                    </Button>
                  )}
                  
                  {sale.status === 'PAID' && (
                    <Button
                      onClick={() => handleCompleteSale(sale.id)}
                      variant="success"
                      size="sm"
                      leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                          Hoàn Tất
                    </Button>
                  )}
                  
                  {sale.status === 'COMPLETED' && (
                    <span className="text-sm text-green-600 font-medium">
                          ✓ Hoàn tất
                    </span>
                  )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bill Selector Modal */}
      {showBillSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Chọn Bill</h3>
              <Button
                onClick={() => setShowBillSelector(false)}
                variant="ghost"
                size="sm"
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Đóng
              </Button>
            </div>

            <div className="space-y-3">
              {Array.isArray(availableBills) && availableBills.length > 0 ? (
                availableBills.map((bill) => (
                <div
                  key={bill.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBills.some(b => b.id === bill.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedBills.some(b => b.id === bill.id)) {
                      setSelectedBills(prev => prev.filter(b => b.id !== bill.id))
                    } else {
                      setSelectedBills(prev => [...prev, bill])
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{bill.contract_code}</p>
                      <p className="text-sm text-gray-600">{bill.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {bill.amount?.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{bill.period}</span>
                      {selectedBills.some(b => b.id === bill.id) && (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Không có bill nào available
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setShowBillSelector(false)}
                variant="ghost"
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  handleSelectBills(selectedBills)
                }}
                variant="primary"
                disabled={selectedBills.length === 0}
              >
                Xác Nhận ({selectedBills.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales
