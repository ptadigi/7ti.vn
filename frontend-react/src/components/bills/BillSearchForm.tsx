import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { BillSearchForm as BillSearchFormType } from '@/types'

interface BillSearchFormProps {
  onSingleSearch: (contractCode: string) => void
  onBatchSearch: (contractCodes: string[]) => void
  isSearching: boolean
}

const BillSearchForm: React.FC<BillSearchFormProps> = ({
  onSingleSearch,
  onBatchSearch,
  isSearching
}) => {
  const [searchMode, setSearchMode] = useState<'single' | 'batch'>('single')
  const [contractCodes, setContractCodes] = useState<string[]>([''])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BillSearchFormType>()

  const handleSingleSearch = (data: BillSearchFormType) => {
    onSingleSearch(data.contractCode)
    reset()
  }

  const handleBatchSearch = () => {
    const validCodes = contractCodes.filter(code => code.trim() !== '')
    if (validCodes.length > 0) {
      onBatchSearch(validCodes)
    }
  }

  const addContractCode = () => {
    setContractCodes([...contractCodes, ''])
  }

  const removeContractCode = (index: number) => {
    if (contractCodes.length > 1) {
      setContractCodes(contractCodes.filter((_, i) => i !== index))
    }
  }

  const updateContractCode = (index: number, value: string) => {
    const newCodes = [...contractCodes]
    newCodes[index] = value
    setContractCodes(newCodes)
  }

  return (
    <div className="space-y-6">
      {/* Search Mode Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setSearchMode('single')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            searchMode === 'single'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tra Cứu Đơn Lẻ
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('batch')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            searchMode === 'batch'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tra Cứu Hàng Loạt
        </button>
      </div>

      {/* Single Search Form */}
      {searchMode === 'single' && (
        <form onSubmit={handleSubmit(handleSingleSearch)} className="space-y-4">
          <div>
            <Input
              label="Mã Hợp Đồng"
              placeholder="Nhập mã hợp đồng điện (VD: PB02020040261)"
              {...register('contractCode', {
                required: 'Mã hợp đồng là bắt buộc',
                minLength: {
                  value: 5,
                  message: 'Mã hợp đồng phải có ít nhất 5 ký tự'
                }
              })}
              error={errors.contractCode?.message}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              type="submit"
              loading={isSearching}
              disabled={isSearching}
              className="flex-1"
            >
              {isSearching ? 'Đang tra cứu...' : 'Tra Cứu'}
            </Button>
          </div>
        </form>
      )}

      {/* Batch Search Form */}
      {searchMode === 'batch' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh Sách Mã Hợp Đồng
            </label>
            <div className="space-y-3">
              {contractCodes.map((code, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Mã hợp đồng ${index + 1}`}
                    value={code}
                    onChange={(e) => updateContractCode(index, e.target.value)}
                    className="flex-1"
                  />
                  {contractCodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContractCode(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addContractCode}
              className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Thêm Mã Hợp Đồng
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBatchSearch}
              loading={isSearching}
              disabled={isSearching || contractCodes.every(code => code.trim() === '')}
              className="flex-1"
            >
              {isSearching ? 'Đang tra cứu...' : 'Tra Cứu Hàng Loạt'}
            </Button>
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Mẹo tra cứu:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Mã hợp đồng thường bắt đầu bằng PB, HD, hoặc các ký tự tương tự</li>
          <li>• Tra cứu hàng loạt hỗ trợ tối đa 50 mã cùng lúc</li>
          <li>• Kết quả tra cứu sẽ hiển thị thông tin chi tiết về bill</li>
          <li>• Bạn có thể chọn bill để thêm vào kho sau khi tra cứu</li>
        </ul>
      </div>
    </div>
  )
}

export default BillSearchForm
