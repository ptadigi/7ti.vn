import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import BillSearchForm from '@/components/bills/BillSearchForm'
import BillResults from '@/components/bills/BillResults'
import { Bill } from '@/types'
import { billService } from '@/services/billService'

const BillSearch: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Bill[]>([])

  const handleSingleSearch = async (contractCode: string) => {
    setIsSearching(true)
    try {
      // Gọi FPT API thật để tra cứu bill
      const response = await billService.checkSingleBill(contractCode)
      
      if (response.success && response.data) {
        // Chuyển đổi data từ FPT API sang format frontend
        const fptBill = response.data
        const bill: Bill = {
          id: `fpt_${Date.now()}`,
          contractNumber: fptBill.contractNumber || contractCode,
          customerName: fptBill.customerName || 'Không có tên',
          customerAddress: fptBill.address || 'Không có địa chỉ',
          totalContractAmount: fptBill.amount || fptBill.totalAmount || 0,
          totalPaid: 0, // Chưa có thông tin thanh toán
          totalFee: fptBill.serviceFee || 0,
          billId: `BILL_${fptBill.contractNumber || contractCode}`,
          month: fptBill.period || 'Không có kỳ',
          expiredDate: fptBill.dueDate || 'Không có hạn',
          status: fptBill.status === 'Chưa thanh toán' ? 'IN_WAREHOUSE' : 'EXPIRED',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        setSearchResults([bill])
        toast.success('Tra cứu thành công từ FPT API!')
      } else {
        toast.error(response.message || 'Không tìm thấy bill')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Có lỗi xảy ra khi tra cứu')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleBatchSearch = async (contractCodes: string[]) => {
    setIsSearching(true)
    try {
      // Gọi FPT API thật để tra cứu hàng loạt
      const response = await billService.startBatchCheck(contractCodes)
      
      if (response.success) {
        toast.success(`Bắt đầu tra cứu ${contractCodes.length} bill từ FPT API!`)
        
        // Poll status để lấy kết quả
        let attempts = 0
        const maxAttempts = 30 // 30 giây
        
        const pollStatus = async () => {
          if (attempts >= maxAttempts) {
            toast.error('Tra cứu hàng loạt timeout')
            setIsSearching(false)
            return
          }
          
          try {
            const statusResponse = await billService.getBatchStatus()
            if (statusResponse.success && statusResponse.data) {
              const status = statusResponse.data
              
              if (status.running) {
                // Vẫn đang chạy, đợi thêm
                attempts++
                setTimeout(pollStatus, 1000)
                return
              }
              
              // Hoàn thành, xử lý kết quả
              if (status.results && status.results.length > 0) {
                const bills: Bill[] = status.results.map((result: any) => ({
                  id: `fpt_${Date.now()}_${Math.random()}`,
                  contractNumber: result.contractNumber || 'Không có mã',
                  customerName: result.customerName || 'Không có tên',
                  customerAddress: result.address || 'Không có địa chỉ',
                  totalContractAmount: result.amount || result.totalAmount || 0,
                  totalPaid: 0,
                  totalFee: result.serviceFee || 0,
                  billId: `BILL_${result.contractNumber || 'Unknown'}`,
                  month: result.period || 'Không có kỳ',
                  expiredDate: result.dueDate || 'Không có hạn',
                  status: result.status === 'Chưa thanh toán' ? 'IN_WAREHOUSE' : 'EXPIRED',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }))
                
                setSearchResults(bills)
                toast.success(`Tra cứu thành công ${bills.length} bill!`)
              } else {
                toast.error('Không có kết quả từ batch check')
                setSearchResults([])
              }
            }
          } catch (error) {
            console.error('Status poll error:', error)
          }
          
          setIsSearching(false)
        }
        
        // Bắt đầu poll status
        pollStatus()
      } else {
        toast.error(response.message || 'Không thể bắt đầu batch check')
        setSearchResults([])
        setIsSearching(false)
      }
    } catch (error) {
      console.error('Batch search error:', error)
      toast.error('Có lỗi xảy ra khi tra cứu hàng loạt')
      setSearchResults([])
      setIsSearching(false)
    }
  }

  const handleAddToWarehouse = async (bill: Bill) => {
    try {
      // Gọi API thật để thêm vào warehouse
      const response = await billService.addBillToWarehouse({
        contract_code: bill.contractNumber,
        customer_name: bill.customerName,
        amount: bill.totalContractAmount,
        status: 'IN_WAREHOUSE',
        due_date: bill.expiredDate !== 'Chưa có' ? bill.expiredDate : undefined,
        description: `Bill từ tra cứu: ${bill.billId}`
      } as any)
      
      if (response.success) {
        toast.success(`Đã thêm bill ${bill.contractNumber} vào kho!`)

      } else {
        toast.error(response.message || 'Không thể thêm bill vào kho')
      }
    } catch (error) {
      console.error('Add to warehouse error:', error)
      toast.error('Có lỗi xảy ra khi thêm vào kho')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tra Cứu Mã Điện</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tra cứu thông tin bill điện đơn lẻ hoặc hàng loạt
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <BillSearchForm
          onSingleSearch={handleSingleSearch}
          onBatchSearch={handleBatchSearch}
          isSearching={isSearching}
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <BillResults
            bills={searchResults}
            onAddToWarehouse={handleAddToWarehouse}
            loading={isSearching}
          />
        </div>
      )}
    </div>
  )
}

export default BillSearch
