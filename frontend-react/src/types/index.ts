// Common types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Bill types
export interface Bill {
  id: string;
  contract_code: string;
  customer_name: string;
  address?: string;
  amount: number;
  period?: string;
  due_date?: string;
  status: 'IN_WAREHOUSE' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  added_to_warehouse_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BillSearchResult {
  success: boolean;
  data: Bill;
  contract_number: string;
  phone_number: string;
  status_code: number;
  content_type?: string;
  encoding?: string;
  fingerprint?: {
    browser: string;
    version: string;
    platform: string;
  };
}

export interface BillSearchResponse {
  success: boolean;
  data: BillSearchResult;
  message?: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  companyName?: string;
  taxCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLIST';
  notes?: string;
  totalBills?: number;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFilters {
  search?: string;
  customerType?: 'all' | 'INDIVIDUAL' | 'COMPANY';
  status?: 'all' | 'ACTIVE' | 'INACTIVE' | 'BLACKLIST';
  phone?: string;
  bankName?: string;
}

// Transaction types
export interface SaleTransaction {
  id: string;
  customerId: string;
  customer: Customer;
  billIds: string[];
  bills: Bill[];
  totalAmount: number;
  profitPercentage: number;
  profitAmount: number;
  customerPayment: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillSale {
  id: string;
  customer_id: number;
  customer: Customer;
  user_id: number;
  user: User;
  bills: Bill[];
  total_bill_amount: number;
  profit_percentage: number;
  profit_amount: number;
  customer_payment: number;
  payment_method: string;
  payment_status: boolean;
  payment_date?: string;
  notes?: string;
  customer_notes?: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

// Filter types
export interface BillFilters {
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  search?: string;
  customerName?: string;
  month?: string;
}

export interface CustomerFilters {
  search?: string;
  phone?: string;
  bankName?: string;
}

export interface TransactionFilters {
  startDate: Date;
  endDate: Date;
  customerId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Form types
export interface BillSearchForm {
  contractCode: string;
  useProxy?: boolean;
}

export interface BatchSearchForm {
  contractCodes: string[];
  useProxy?: boolean;
}

export interface CustomerForm {
  name: string;
  phone: string;
  zalo?: string;
  bankAccount?: string;
  bankName?: string;
  email?: string;
  address?: string;
  note?: string;
}

export interface SaleForm {
  customerId: string;
  billIds: string[];
  profitPercentage: number;
  note?: string;
}

// API Error types
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export interface RevenueData {
  date: string;
  revenue: number;
  transactions: number;
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  totalSpent: number;
  transactionCount: number;
  lastTransaction: Date;
}
