import React from 'react'
import { Bill } from '@/types'
import Button from '@/components/common/Button'
import { PlusIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface BillResultsProps {
  bills: Bill[]
  onAddToWarehouse: (bill: Bill) => void
  loading?: boolean
}

const BillResults: React.FC<BillResultsProps> = ({
  bills,
  onAddToWarehouse,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tra cứu...</p>
        </div>
      </div>
    )
  }

  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy kết quả</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vui lòng kiểm tra lại mã hợp đồng hoặc thử mã khác
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Kết Quả Tra Cứu ({bills.length})
        </h3>
        <div className="text-sm text-gray-500">
          Tìm thấy {bills.length} bill
        </div>
      </div>

      <div className="grid gap-4">
        {bills.map((bill, index) => (
          <div
            key={bill.id || index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {bill.contract_code?.substring(0, 2) || 'BI'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {bill.contract_code}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {bill.customer_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                    <p className="text-sm text-gray-900">{bill.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tổng tiền hợp đồng</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {bill.amount?.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kỳ thanh toán</p>
                    <p className="text-sm text-gray-900">
                      {bill.period || 'N/A'}
                    </p>
                  </div>
                </div>

                {bill.status === 'IN_WAREHOUSE' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-green-800">
                        Bill có sẵn trong kho
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Bill ID: {bill.id || 'N/A'}</span>
                  {bill.period && <span>• Kỳ: {bill.period}</span>}
                  {bill.due_date && <span>• Hạn: {bill.due_date}</span>}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  onClick={() => onAddToWarehouse(bill)}
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Thêm vào Kho
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Tổng cộng: <span className="font-medium">{bills.length}</span> bill
          </span>
          <span className="text-gray-600">
            Tổng giá trị: <span className="font-medium">
              {bills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString('vi-VN')} đ
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default BillResults
