import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { Bill, Customer } from '@/types'
import { customerService, salesService, billService } from '@/services'

interface SellBillsModalProps {
  isOpen: boolean
  onClose: () => void
  bills: Bill[]
  onSuccess: () => void
}

interface SaleFormData {
  customerId: string
  profitPercentage: number
  notes: string
}

const SellBillsModal: React.FC<SellBillsModalProps> = ({
  isOpen,
  onClose,
  bills,
  onSuccess
}) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [formData, setFormData] = useState<SaleFormData>({
    customerId: '',
    profitPercentage: 20,
    notes: ''
  })

  // Load customers from database
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true)
        const response = await customerService.getAllCustomers()
  

        
        if (response.success && response.data) {
          // API trả về {customers: Array, pagination: {...}}
          let customerData: Customer[] = []
          if (Array.isArray(response.data)) {
            customerData = response.data
          } else if (response.data && typeof response.data === 'object' && 'customers' in response.data) {
            const dataWithCustomers = response.data as { customers: Customer[] }
            if (Array.isArray(dataWithCustomers.customers)) {
              customerData = dataWithCustomers.customers
            }
          }
          
  
          setCustomers(customerData)
        } else {
  
          setCustomers([])
        }
      } catch (error) {
        console.error('Error loading customers:', error)
        toast.error('Lỗi khi tải danh sách khách hàng')
      } finally {
        setLoadingCustomers(false)
      }
    }

    if (isOpen) {
      loadCustomers()
    }
  }, [isOpen])

  // Debug: Log customers state changes
  useEffect(() => {
    
  }, [customers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng')
      return
    }

    setLoading(true)
    try {
      // 1. Tạo sale transaction
      const saleData = {
        customer_id: parseInt(formData.customerId),  // Backend cần customer_id (integer)
        user_id: 1,  // Giả sử user ID 1 (admin)
        bill_ids: bills.map(bill => bill.id),  // Backend cần bill_ids để liên kết
        total_bill_amount: totalAmount,  // Backend cần total_bill_amount
        profit_percentage: formData.profitPercentage,  // Backend cần profit_percentage
        // Backend sẽ tự tính profit_amount và customer_payment
        payment_method: 'cash',  // Backend cần payment_method
        // KHÔNG gửi status - backend sẽ tự set thành pending_payment
        notes: formData.notes  // Backend cần notes
      }


      
      // 2. Gọi API tạo sale
      const saleResponse = await salesService.createSale(saleData)
      
      if (saleResponse.success) {

        
        // TODO: Cập nhật status của tất cả bills (tạm thời tắt do CORS issue)
        const billIds = bills.map(bill => bill.id)

        
        // Tạm thời skip bulkUpdateBillStatus call để tránh CORS error
        // const updateResponse = await billService.bulkUpdateBillStatus(billIds, 'PENDING_PAYMENT')
        
        // Hiển thị success message
        toast.success(`Bán ${bills.length} bills thành công! Lợi nhuận: ${profitAmount.toLocaleString('vi-VN')} đ`)
        
        // Gọi callback để refresh data
        onSuccess()
        onClose()
      } else {
        console.error('Failed to create sale:', saleResponse.error)
        toast.error(saleResponse.error || 'Có lỗi xảy ra khi tạo giao dịch bán')
      }
    } catch (error) {
      console.error('Error selling bills:', error)
      toast.error('Có lỗi xảy ra khi bán bills')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SaleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  const profitAmount = (totalAmount * formData.profitPercentage) / 100
  const customerPayment = totalAmount - profitAmount  // Số tiền trả khách hàng

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bán Các Bill Đã Chọn"
      size="lg"
    >
      <div className="space-y-6">
        {/* Bills Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Thông Tin Bills</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Số lượng bills:</span> {bills.length}
            </div>
            <div>
              <span className="font-medium">Tổng tiền:</span> {totalAmount.toLocaleString('vi-VN')} đ
            </div>
            <div>
              <span className="font-medium">Mã bills:</span> {bills.map(b => b.contract_code).join(', ')}
            </div>
            <div>
              <span className="font-medium">Khách hàng:</span> {bills.map(b => b.customer_name).join(', ')}
            </div>
          </div>
        </div>

        {/* Sale Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingCustomers ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Đang tải danh sách khách hàng...</div>
            </div>
          ) : (
            <Select
              label="Chọn Khách Hàng *"
              value={formData.customerId}
              onChange={(e) => handleInputChange('customerId', e.target.value)}
              options={[
                { value: '', label: 'Chọn khách hàng...' },
                ...(customers || []).map(customer => ({
                  value: customer.id,
                  label: `${customer.name} - ${customer.phone}`
                }))
              ]}
              // Debug info
              // customers count: {customers?.length || 0}
              // customers data: {JSON.stringify(customers?.slice(0, 2))}
              required
            />
          )}

          <Input
            label="Phần Trăm Thu Nhập Của Chúng Ta (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.profitPercentage}
            onChange={(e) => handleInputChange('profitPercentage', parseFloat(e.target.value) || 0)}
            placeholder="VD: 10% = chúng ta giữ 10%, khách nhận 90%"
          />

          <Input
            label="Ghi Chú"
            placeholder="Ghi chú về giao dịch..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />

          {/* Calculation Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tính Toán</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tổng tiền bills:</span>
                <span className="font-medium">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Thu nhập của chúng ta ({formData.profitPercentage}%):</span>
                <span className="font-medium text-green-600">{profitAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Số tiền trả khách:</span>
                <span className="font-bold text-lg text-blue-600">{customerPayment.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Bán Bills'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default SellBillsModal
