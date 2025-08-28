import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'
import CustomerList from '../CustomerList'
import { Customer } from '../../../types'

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    zalo: 'nguyenvana',
    email: 'nguyenvana@email.com',
    bank_account: '1234567890',
    bank_name: 'Vietcombank',
    address: 'Hanoi, Vietnam',
    notes: 'Khách hàng VIP',
    is_active: true,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    phone: '0987654321',
    zalo: 'tranthib',
    email: 'tranthib@email.com',
    bank_account: '0987654321',
    bank_name: 'BIDV',
    address: 'Ho Chi Minh City, Vietnam',
    notes: 'Khách hàng thường xuyên',
    is_active: true,
    created_by: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

// Mock functions
const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn()

describe('CustomerList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders customer list correctly', () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    // Check if customers are displayed
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument()
    expect(screen.getByText('0123456789')).toBeInTheDocument()
    expect(screen.getByText('0987654321')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <CustomerList
        customers={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={true}
      />
    )

    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument()
  })

  it('shows empty state when no customers', () => {
    render(
      <CustomerList
        customers={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    expect(screen.getByText('Không có khách hàng nào')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    const editButtons = screen.getAllByText('Sửa')
    fireEvent.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomers[0])
  })

  it('calls onDelete when delete button is clicked', async () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    const deleteButtons = screen.getAllByText('Xóa')
    fireEvent.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(mockCustomers[0])
  })

  it('displays customer information correctly', () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    // Check customer details
    expect(screen.getByText('nguyenvana@email.com')).toBeInTheDocument()
    expect(screen.getByText('Hanoi, Vietnam')).toBeInTheDocument()
    // Bank name might be rendered inside a table cell; use a regex matcher to be lenient
    expect(screen.getByText(/Vietcombank/i)).toBeInTheDocument()
    expect(screen.getByText('Khách hàng VIP')).toBeInTheDocument()
  })

  it('handles multiple customers correctly', () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    // Should have 2 edit buttons and 2 delete buttons
    const editButtons = screen.getAllByText('Sửa')
    const deleteButtons = screen.getAllByText('Xóa')
    
    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('displays customer status correctly', () => {
    render(
      <CustomerList
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        loading={false}
      />
    )

    // Both customers are active
    const statusElements = screen.getAllByText(/Hoạt\sđộng/i)
    expect(statusElements).toHaveLength(2)
  })
})
