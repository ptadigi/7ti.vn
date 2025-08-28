import React, { useState, useEffect } from 'react'
import { Bill } from '@/types'
import { billService } from '@/services/billService'
import { customerService } from '@/services/customerService'
import { salesService } from '@/services/salesService'
import { toast } from 'react-hot-toast'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { 
  PlusIcon, 
  ShoppingCartIcon, 
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface BillWarehouseProps {}

const BillWarehouse: React.FC<BillWarehouseProps> = () => {
  // State
  const [bills, setBills] = useState<Bill[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedBills, setSelectedBills] = useState<Bill[]>([])
  const [allBills, setAllBills] = useState<Bill[]>([]) // New state for all bills
  const [loadingAllBills, setLoadingAllBills] = useState(false) // New loading state for all bills
  const [activeTab, setActiveTab] = useState<'warehouse' | 'all'>('warehouse')
  
  // Modal states
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [showSellBillsModal, setShowSellBillsModal] = useState(false)
  
  // Form states
  const [newBill, setNewBill] = useState({
    contract_code: '',
    customer_name: '',
    amount: 0,
    address: '',
    period: ''
  })
  
  const [sellForm, setSellForm] = useState({
    customerId: '',
    profitPercentage: 20
  })

  // Load bills
  const loadBills = async () => {
    try {
      setLoading(true)
      const response = await billService.getWarehouseBills()

      
      if (response.success && response.data) {
        if (response.data.bills && Array.isArray(response.data.bills)) {
          setBills(response.data.bills)
        } else if (Array.isArray(response.data)) {
          setBills(response.data)
        } else {
          console.warn('Unexpected bills data structure:', response.data)
          setBills([])
        }
      } else {
        console.warn('Bills API failed:', response)
        toast.error(response.error || 'Không thể tải danh sách bills')
        setBills([])
      }
    } catch (error) {
      console.error('Error loading bills:', error)
      toast.error('Lỗi kết nối mạng')
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  // Load all bills (with all statuses)
  const loadAllBills = async () => {
    try {
      setLoadingAllBills(true)
      const response = await billService.getAllBills()
      
      if (response.success && response.data) {
        if (response.data.bills && Array.isArray(response.data.bills)) {
          setAllBills(response.data.bills)
        } else if (Array.isArray(response.data)) {
          setAllBills(response.data)
        } else {
          console.warn('Unexpected all bills data structure:', response.data)
          setAllBills([])
        }
      } else {
        console.warn('All bills API failed:', response)
        toast.error(response.error || 'Không thể tải danh sách tất cả bills')
        setAllBills([])
      }
    } catch (error) {
      console.error('Error loading all bills:', error)
      toast.error('Lỗi kết nối mạng')
      setAllBills([])
    } finally {
      setLoadingAllBills(false)
    }
  }

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await customerService.getAllCustomers()

      
      if (response.success && response.data) {
        // Handle different response structures
        if (Array.isArray(response.data)) {
          setCustomers(response.data)
        } else if (response.data && typeof response.data === 'object' && 'customers' in response.data && Array.isArray((response.data as any).customers)) {
          setCustomers((response.data as any).customers)
        } else {
          console.warn('Unexpected customer data structure:', response.data)
          setCustomers([])
        }
      } else {
        console.warn('Customer API failed:', response)
        setCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadBills()
    loadCustomers()
    loadAllBills() // Load all bills on mount
  }, [])

  // Handle add bill
  const handleAddBill = async () => {
    try {
      const response = await billService.addBillToWarehouse({
        ...newBill,
        status: 'IN_WAREHOUSE'
      })
      
      if (response.success) {
        toast.success('Thêm bill thành công!')
        setShowAddBillModal(false)
        setNewBill({ contract_code: '', customer_name: '', amount: 0, address: '', period: '' })
        loadBills()
      } else {
        toast.error(response.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error adding bill:', error)
      toast.error('Lỗi kết nối mạng')
    }
  }

  // Handle sell bills
  const handleSellBills = async () => {
    if (selectedBills.length === 0) {
      toast.error('Vui lòng chọn bills để bán')
      return
    }
    
    if (!sellForm.customerId) {
      toast.error('Vui lòng chọn khách hàng')
      return
    }

    try {
      const totalAmount = selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
      const profitAmount = (totalAmount * sellForm.profitPercentage) / 100
      const customerPayment = totalAmount - profitAmount

      const saleData = {
        customer_id: parseInt(sellForm.customerId),
        user_id: 1, // TODO: Get from auth context
        bill_ids: selectedBills.map(bill => bill.id),
        total_bill_amount: totalAmount,
        profit_percentage: sellForm.profitPercentage,
        profit_amount: profitAmount,
        customer_payment: customerPayment,
        payment_method: 'cash',
        notes: `Bán ${selectedBills.length} bills`
      }

      const saleResponse = await salesService.createSale(saleData)
      
      if (saleResponse.success) {
        // TODO: Update bill statuses (tạm thời tắt do CORS issue)
        const billIds = selectedBills.map(bill => bill.id)

        // await billService.bulkUpdateBillStatus(billIds, 'PENDING_PAYMENT')
        
        toast.success(`Bán ${selectedBills.length} bills thành công!`)
        setShowSellBillsModal(false)
        setSelectedBills([])
        setSellForm({ customerId: '', profitPercentage: 20 })
        loadBills()
      } else {
        toast.error(saleResponse.error || 'Có lỗi xảy ra khi tạo sale')
      }
    } catch (error) {
      console.error('Error selling bills:', error)
      toast.error('Lỗi kết nối mạng')
    }
  }

  // Handle delete bill
  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bill này?')) return
    
    try {
      const response = await billService.removeBillFromWarehouse(billId)
      if (response.success) {
        toast.success('Xóa bill thành công!')
        loadBills()
      } else {
        toast.error(response.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      toast.error('Lỗi kết nối mạng')
    }
  }

  // Handle bill selection
  const handleBillSelection = (bill: Bill, checked: boolean) => {
    if (checked) {
      setSelectedBills(prev => [...prev, bill])
    } else {
      setSelectedBills(prev => prev.filter(b => b.id !== bill.id))
    }
  }

  // Calculate stats
  const stats = {
    total: bills.length,
    inWarehouse: bills.filter(b => b.status === 'IN_WAREHOUSE').length,
    pendingPayment: bills.filter(b => b.status === 'PENDING_PAYMENT').length,
    paid: bills.filter(b => b.status === 'PAID').length,
    completed: bills.filter(b => b.status === 'COMPLETED').length,
    totalValue: bills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho Bill</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý và bán bill thông minh
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowAddBillModal(true)}
          >
            Thêm Bill Mới
          </Button>
          
          {selectedBills.length > 0 && (
          <Button
              variant="success"
              leftIcon={<ShoppingCartIcon className="h-4 w-4" />}
              onClick={() => setShowSellBillsModal(true)}
          >
              Bán Các Bill Đã Chọn ({selectedBills.length})
          </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Bill</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Có Sẵn</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inWarehouse}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chờ Thanh Toán</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingPayment}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Giá Trị</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalValue.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'warehouse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bills Trong Kho ({bills.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tất Cả Bills ({allBills.length})
            </button>
          </nav>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'warehouse' ? 'Bills Trong Kho' : 'Tất Cả Bills'} ({activeTab === 'warehouse' ? bills.length : allBills.length})
          </h3>
        </div>
        
        {loading || (activeTab === 'all' && loadingAllBills) ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : (activeTab === 'warehouse' && bills.length === 0) || (activeTab === 'all' && allBills.length === 0) ? (
          <div className="p-6 text-center">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bills</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách thêm bill mới vào kho.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'warehouse' && (
                      <input
                        type="checkbox"
                        checked={selectedBills.length === bills.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBills(bills)
                          } else {
                            setSelectedBills([])
                          }
                        }}
                      />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Hợp Đồng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa Chỉ
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
                    {activeTab === 'warehouse' ? 'Thao Tác' : 'Ngày Tạo'}
                  </th>
                </tr>
              </thead>
                              <tbody className="bg-white divide-y divide-y divide-gray-200">
                  {(activeTab === 'warehouse' ? bills : allBills).map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTab === 'warehouse' && (
                        <input
                          type="checkbox"
                          checked={selectedBills.some(b => b.id === bill.id)}
                          onChange={(e) => handleBillSelection(bill, e.target.checked)}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.contract_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {bill.amount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.period || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        bill.status === 'IN_WAREHOUSE' ? 'bg-green-100 text-green-800' :
                        bill.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                        bill.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        bill.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status === 'IN_WAREHOUSE' ? 'Chưa bán' :
                         bill.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' :
                         bill.status === 'PAID' ? 'Đã thanh toán' :
                         bill.status === 'COMPLETED' ? 'Hoàn tất' :
                         'Hết hạn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {activeTab === 'warehouse' ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteBill(bill.id)}
                          >
                            Xóa
                          </Button>
                          {bill.status === 'IN_WAREHOUSE' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedBills([bill])
                                setShowSellBillsModal(true)
                              }}
                            >
                              Bán Bill
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {bill.created_at ? new Date(bill.created_at).toLocaleDateString('vi-VN') : '-'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={showAddBillModal}
        onClose={() => setShowAddBillModal(false)}
        title="Thêm Bill Mới"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mã Hợp Đồng *"
              placeholder="VD: PB12345678"
              value={newBill.contract_code}
              onChange={(e) => setNewBill(prev => ({ ...prev, contract_code: e.target.value }))}
              required
            />
            <Input
              label="Tên Khách Hàng *"
              placeholder="VD: Nguyễn Văn A"
              value={newBill.customer_name}
              onChange={(e) => setNewBill(prev => ({ ...prev, customer_name: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Số Tiền *"
              type="number"
              placeholder="0"
              value={newBill.amount || ''}
              onChange={(e) => setNewBill(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Kỳ Thanh Toán"
              placeholder="VD: 08/2025"
              value={newBill.period}
              onChange={(e) => setNewBill(prev => ({ ...prev, period: e.target.value }))}
            />
          </div>
          
          <Input
            label="Địa Chỉ"
            placeholder="Địa chỉ khách hàng"
            value={newBill.address}
            onChange={(e) => setNewBill(prev => ({ ...prev, address: e.target.value }))}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAddBillModal(false)}
            >
              Hủy
            </Button>
              <Button
              variant="primary"
              onClick={handleAddBill}
            >
              Thêm Bill
              </Button>
            </div>
        </div>
      </Modal>

      {/* Sell Bills Modal */}
      <Modal
        isOpen={showSellBillsModal}
        onClose={() => setShowSellBillsModal(false)}
        title="Bán Bills"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Bills Đã Chọn ({selectedBills.length})
            </h4>
            <div className="text-sm text-blue-700">
              <p>Tổng tiền: {selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString('vi-VN')} đ</p>
              <p>Bills: {selectedBills.map(bill => bill.contract_code).join(', ')}</p>
            </div>
          </div>
          
                     <Select
             label="Chọn Khách Hàng *"
             value={sellForm.customerId}
             onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSellForm(prev => ({ ...prev, customerId: e.target.value }))}
             options={(customers || []).map(customer => ({
               value: customer.id.toString(),
               label: `${customer.name} - ${customer.phone}`
             }))}
             placeholder={loadingCustomers ? "Đang tải..." : "Chọn khách hàng"}
             required
             disabled={loadingCustomers}
           />
          
          <Input
            label="Phần Trăm Lợi Nhuận (%)"
            type="number"
            placeholder="20"
            value={sellForm.profitPercentage}
            onChange={(e) => setSellForm(prev => ({ ...prev, profitPercentage: parseFloat(e.target.value) || 0 }))}
          />
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Thông Tin Giao Dịch</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tổng tiền bills:</span>
                <span>{selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Lợi nhuận ({sellForm.profitPercentage}%):</span>
                <span className="text-green-600 font-medium">
                  {(selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0) * sellForm.profitPercentage / 100).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Khách hàng trả:</span>
                <span className="text-blue-600">
                  {(selectedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0) * (100 - sellForm.profitPercentage) / 100).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowSellBillsModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="success"
              onClick={handleSellBills}
            >
              Bán Bills
            </Button>
          </div>
      </div>
      </Modal>
    </div>
  )
}

export default BillWarehouse
