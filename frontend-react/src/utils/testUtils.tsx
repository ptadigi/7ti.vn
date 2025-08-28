import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { Bill, Customer, BillSale } from '../types'

// Mock data generators
export const createMockBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: '1',
  contractNumber: 'PB02020040261',
  customerName: 'Nguyễn Văn A',
  customerAddress: '123 Đường ABC, Quận 1, TP.HCM',
  totalContractAmount: 1500000,
  totalPaid: 1200000,
  totalFee: 300000,
  billId: 'BILL_001',
  month: '08/2024',
  expiredDate: '15/09/2024',
  status: 'available',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: '1',
  name: 'Nguyễn Văn A',
  phone: '0123456789',
  email: 'nguyenvana@email.com',
  address: '123 Đường ABC, Quận 1, TP.HCM',
  customerType: 'individual',
  status: 'active',
  companyName: '',
  taxCode: '',
  notes: 'Khách hàng VIP',
  totalBills: 5,
  totalAmount: 7500000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockBillSale = (overrides: Partial<BillSale> = {}): BillSale => ({
  id: '1',
  customerId: '1',
  customerName: 'Nguyễn Văn A',
  bills: [createMockBill()],
  totalBillAmount: 1500000,
  salePrice: 1800000,
  profit: 300000,
  paymentMethod: 'cash',
  notes: 'Giao dịch thành công',
  status: 'completed',
  createdAt: new Date(),
  ...overrides
})

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    route = '/',
    ...renderOptions
  } = {}
) => {
  window.history.pushState({}, 'Test page', route)

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Common test helpers
export const clickElement = (element: HTMLElement) => {
  fireEvent.click(element)
}

export const typeInInput = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } })
}

export const selectOption = (select: HTMLElement, value: string) => {
  fireEvent.change(select, { target: { value } })
}

export const waitForElementToBeVisible = async (element: HTMLElement) => {
  await waitFor(() => {
    expect(element).toBeVisible()
  })
}

export const waitForElementToDisappear = async (element: HTMLElement) => {
  await waitFor(() => {
    expect(element).not.toBeVisible()
  })
}

// Mock functions
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn()
}

export const mockNavigate = jest.fn()

export const mockUseNavigate = () => mockNavigate

// Test data arrays
export const mockBills = [
  createMockBill({ id: '1', contractNumber: 'PB02020040261' }),
  createMockBill({ id: '2', contractNumber: 'PB02020046419' }),
  createMockBill({ id: '3', contractNumber: 'PB02020046399' })
]

export const mockCustomers = [
  createMockCustomer({ id: '1', name: 'Nguyễn Văn A' }),
  createMockCustomer({ id: '2', name: 'Trần Thị B', customerType: 'company' }),
  createMockCustomer({ id: '3', name: 'Lê Văn C' })
]

export const mockSales = [
  createMockBillSale({ id: '1', customerName: 'Nguyễn Văn A' }),
  createMockBillSale({ id: '2', customerName: 'Trần Thị B', paymentMethod: 'bank_transfer' }),
  createMockBillSale({ id: '3', customerName: 'Lê Văn C', paymentMethod: 'credit_card' })
]

// Common assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled()
}

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).toBeEnabled()
}

// Form testing helpers
export const fillForm = async (formData: Record<string, string>) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(fieldName, 'i'))
    typeInInput(input, value)
  }
}

export const submitForm = async (submitButtonText: string) => {
  const submitButton = screen.getByRole('button', { name: new RegExp(submitButtonText, 'i') })
  clickElement(submitButton)
}

// Table testing helpers
export const expectTableToHaveRows = (table: HTMLElement, expectedRowCount: number) => {
  const rows = table.querySelectorAll('tbody tr')
  expect(rows).toHaveLength(expectedRowCount)
}

export const expectTableToHaveColumn = (table: HTMLElement, columnName: string) => {
  const header = table.querySelector(`th:contains("${columnName}")`)
  expect(header).toBeInTheDocument()
}

// Modal testing helpers
export const expectModalToBeVisible = (modalTitle: string) => {
  const modal = screen.getByRole('dialog')
  expect(modal).toBeVisible()
  expect(screen.getByText(modalTitle)).toBeVisible()
}

export const expectModalToBeHidden = (modalTitle: string) => {
  expect(screen.queryByText(modalTitle)).not.toBeInTheDocument()
}

export const closeModal = (closeButtonText: string = 'Đóng') => {
  const closeButton = screen.getByRole('button', { name: new RegExp(closeButtonText, 'i') })
  clickElement(closeButton)
}

// Navigation testing helpers
export const expectToBeOnPage = (pageTitle: string) => {
  expect(screen.getByRole('heading', { name: new RegExp(pageTitle, 'i') })).toBeVisible()
}

export const expectToHaveActiveTab = (tabName: string) => {
  const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') })
  expect(tab).toHaveAttribute('aria-selected', 'true')
}

// Error handling testing helpers
export const expectErrorToBeVisible = (errorMessage: string) => {
  expect(screen.getByText(errorMessage)).toBeVisible()
}

export const expectSuccessMessageToBeVisible = (message: string) => {
  expect(screen.getByText(message)).toBeVisible()
}

// Loading state testing helpers
export const expectLoadingSpinnerToBeVisible = () => {
  expect(screen.getByRole('progressbar')).toBeVisible()
}

export const expectLoadingSpinnerToBeHidden = () => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
}

// Accessibility testing helpers
export const expectElementToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveAttribute('role', role)
}

export const expectElementToHaveAriaLabel = (element: HTMLElement, ariaLabel: string) => {
  expect(element).toHaveAttribute('aria-label', ariaLabel)
}

export const expectElementToBeAccessible = (element: HTMLElement) => {
  expect(element).toHaveAttribute('tabindex')
  expect(element).not.toHaveAttribute('aria-hidden', 'true')
}
