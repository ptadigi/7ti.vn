import React, { useState, useMemo } from 'react'
import { Bill } from '@/types'
import Button from '@/components/common/Button'
import { CheckIcon, CalculatorIcon } from '@heroicons/react/24/outline'

interface BillCombination {
  bills: Bill[]
  totalAmount: number
  difference: number
  percentageDiff: number
}

interface BillCombinationAlgorithmProps {
  bills: Bill[]
  targetAmount: number
  tolerance: number
  onSelectCombination: (combination: BillCombination) => void
}

const BillCombinationAlgorithm: React.FC<BillCombinationAlgorithmProps> = ({
  bills,
  targetAmount,
  tolerance = 0.1, // 10% tolerance
  onSelectCombination
}) => {
  const [selectedCombination, setSelectedCombination] = useState<BillCombination | null>(null)

  // Find all possible bill combinations that match target amount within tolerance
  const combinations = useMemo(() => {
    const availableBills = bills.filter(bill => bill.status === 'IN_WAREHOUSE')
    const result: BillCombination[] = []
    
    // Helper function to find combinations recursively
    const findCombinations = (
      remainingBills: Bill[],
      currentCombination: Bill[],
      currentAmount: number,
      startIndex: number
    ) => {
      // Check if current combination is within tolerance
      const difference = Math.abs(currentAmount - targetAmount)
      const percentageDiff = (difference / targetAmount) * 100
      
      if (percentageDiff <= tolerance * 100) {
        result.push({
          bills: [...currentCombination],
          totalAmount: currentAmount,
          difference,
          percentageDiff
        })
      }
      
      // Try adding more bills
      for (let i = startIndex; i < remainingBills.length; i++) {
        const bill = remainingBills[i]
        const newAmount = currentAmount + (bill.amount || 0)
        
        // Only continue if adding this bill doesn't exceed target by too much
        if (newAmount <= targetAmount * (1 + tolerance)) {
          currentCombination.push(bill)
          findCombinations(remainingBills, currentCombination, newAmount, i + 1)
          currentCombination.pop()
        }
      }
    }
    
    // Start with empty combination
    findCombinations(availableBills, [], 0, 0)
    
    // Sort by percentage difference (best matches first)
    return result.sort((a, b) => a.percentageDiff - b.percentageDiff)
  }, [bills, targetAmount, tolerance])

  const handleSelectCombination = (combination: BillCombination) => {
    setSelectedCombination(combination)
    onSelectCombination(combination)
  }

  if (combinations.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <CalculatorIcon className="mx-auto h-12 w-12 text-yellow-600" />
          <h3 className="mt-2 text-lg font-medium text-yellow-800">
            Không tìm thấy tổ hợp bill phù hợp
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Không có tổ hợp bill nào có thể đạt được số tiền {targetAmount.toLocaleString('vi-VN')} VND 
            với sai số {tolerance * 100}%
          </p>
          <div className="mt-4 text-sm text-yellow-600">
            <p>💡 Gợi ý:</p>
            <ul className="mt-2 space-y-1">
              <li>• Tăng sai số cho phép (hiện tại: {tolerance * 100}%)</li>
              <li>• Thêm bill mới vào kho</li>
              <li>• Thử số tiền mục tiêu khác</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          🎯 Kết Quả Thuật Toán Gộp Bill
        </h3>
        <div className="text-sm text-gray-500">
          Tìm thấy {combinations.length} tổ hợp phù hợp
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Số tiền mục tiêu:</span>
            <p className="text-blue-900 font-semibold">
              {targetAmount.toLocaleString('vi-VN')} VND
            </p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Sai số cho phép:</span>
            <p className="text-blue-900 font-semibold">{tolerance * 100}%</p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Tổ hợp tốt nhất:</span>
            <p className="text-blue-900 font-semibold">
              {combinations[0].percentageDiff.toFixed(2)}% sai số
            </p>
          </div>
        </div>
      </div>

      {/* Combinations List */}
      <div className="space-y-3">
        {combinations.slice(0, 10).map((combination, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-all ${
              selectedCombination === combination
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Tổ hợp #{index + 1}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    combination.percentageDiff <= 2
                      ? 'bg-green-100 text-green-800'
                      : combination.percentageDiff <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {combination.percentageDiff.toFixed(2)}% sai số
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tổng tiền:</span>
                    <p className="font-semibold text-gray-900">
                      {combination.totalAmount.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chênh lệch:</span>
                    <p className={`font-semibold ${
                      combination.difference === 0
                        ? 'text-green-600'
                        : combination.difference > 0
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}>
                      {combination.difference > 0 ? '+' : ''}{combination.difference.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                </div>

                {/* Bill List */}
                <div className="mt-3">
                  <span className="text-sm text-gray-500">Bills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {combination.bills.map((bill, billIndex) => (
                      <span
                        key={billIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {bill.contract_code} ({bill.amount?.toLocaleString('vi-VN')} đ)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ml-4">
                <Button
                  onClick={() => handleSelectCombination(combination)}
                  variant={selectedCombination === combination ? "primary" : "ghost"}
                  size="sm"
                  leftIcon={
                    selectedCombination === combination ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CalculatorIcon className="h-4 w-4" />
                    )
                  }
                >
                  {selectedCombination === combination ? 'Đã chọn' : 'Chọn'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Combination Details */}
      {selectedCombination && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-3">
            ✅ Tổ Hợp Đã Chọn
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Tổng tiền:</span>
              <p className="font-semibold text-green-900">
                {selectedCombination.totalAmount.toLocaleString('vi-VN')} VND
              </p>
            </div>
            <div>
              <span className="text-green-700">Sai số:</span>
              <p className="font-semibold text-green-900">
                {selectedCombination.percentageDiff.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-green-700">Bills được chọn:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedCombination.bills.map((bill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
                >
                  {bill.contract_code}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagination for large results */}
      {combinations.length > 10 && (
        <div className="text-center text-sm text-gray-500">
          Hiển thị 10 tổ hợp đầu tiên trong tổng số {combinations.length} tổ hợp
        </div>
      )}
    </div>
  )
}

export default BillCombinationAlgorithm
