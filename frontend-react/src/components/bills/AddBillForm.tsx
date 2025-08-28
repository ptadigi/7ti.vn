import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Modal from '@/components/common/Modal'
import { billService } from '@/services'

interface AddBillFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface BillFormData {
  contract_code: string
  customer_name: string
  amount: number
  address?: string
  period?: string
  due_date?: string
  warehouse_notes?: string
}

const AddBillForm: React.FC<AddBillFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<BillFormData>({
    contract_code: '',
    customer_name: '',
    amount: 0,
    address: '',
    period: '',
    due_date: '',
    warehouse_notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contract_code || !formData.customer_name || formData.amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setLoading(true)
    
    try {
      const response = await billService.addBillToWarehouse({
        contract_code: formData.contract_code,
        customer_name: formData.customer_name,
        amount: formData.amount,
        address: formData.address,
        period: formData.period,
        due_date: formData.due_date,
        status: 'IN_WAREHOUSE',
      })

      if (response.success) {
        toast.success('Thêm bill thành công!')
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          contract_code: '',
          customer_name: '',
          amount: 0,
          address: '',
          period: '',
          due_date: '',
          warehouse_notes: ''
        })
      } else {
        toast.error(response.error || 'Có lỗi xảy ra khi thêm bill')
      }
    } catch (error) {
      console.error('Error adding bill:', error)
      toast.error('Lỗi kết nối mạng')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BillFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Bill Mới"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Mã Hợp Đồng *"
            placeholder="VD: PB12345678"
            value={formData.contract_code}
            onChange={(e) => handleInputChange('contract_code', e.target.value)}
            required
          />
          
          <Input
            label="Tên Khách Hàng *"
            placeholder="VD: Nguyễn Văn A"
            value={formData.customer_name}
            onChange={(e) => handleInputChange('customer_name', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Số Tiền *"
            type="number"
            placeholder="0"
            value={formData.amount || ''}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            required
          />
          
          <Input
            label="Kỳ Thanh Toán"
            placeholder="VD: 08/2025"
            value={formData.period || ''}
            onChange={(e) => handleInputChange('period', e.target.value)}
          />
        </div>

        <Input
          label="Hạn Thanh Toán"
          type="date"
          value={formData.due_date || ''}
          onChange={(e) => handleInputChange('due_date', e.target.value)}
        />

        <Input
          label="Địa Chỉ"
          placeholder="Địa chỉ khách hàng"
          value={formData.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />

        <Input
          label="Ghi Chú"
          placeholder="Ghi chú về bill"
          value={formData.warehouse_notes || ''}
          onChange={(e) => handleInputChange('warehouse_notes', e.target.value)}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Thêm Bill
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddBillForm
