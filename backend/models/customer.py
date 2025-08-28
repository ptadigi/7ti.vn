from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from enum import Enum as PyEnum

class CustomerType(PyEnum):
    """Customer type enumeration"""
    INDIVIDUAL = "INDIVIDUAL"
    COMPANY = "COMPANY"

class CustomerStatus(PyEnum):
    """Customer status enumeration"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLACKLIST = "BLACKLIST"

class Customer(Base):
    """Customer model for managing customer information"""
    
    __tablename__ = 'customers'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    zalo = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # New fields for frontend compatibility
    customer_type = Column(Enum(CustomerType, name='customer_type_enum'), default=CustomerType.INDIVIDUAL)
    company_name = Column(String(200), nullable=True)
    tax_code = Column(String(50), nullable=True)
    status = Column(Enum(CustomerStatus, name='customer_status_enum'), default=CustomerStatus.ACTIVE)
    
    # Legacy field (keep for backward compatibility)
    is_active = Column(Boolean, default=True)
    
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_by_user = relationship("User", back_populates="customers")
    sales = relationship("Sale", back_populates="customer")
    bills = relationship("Bill", back_populates="customer")
    
    def to_dict(self):
        """Convert to dictionary with calculated fields"""
        # Tính từ bills trực tiếp liên kết với customer
        direct_bills_count = len(self.bills) if self.bills else 0
        direct_bills_amount = sum(float(bill.amount) for bill in self.bills) if self.bills else 0.0
        
        # Tính từ sales (giao dịch bán)
        sales_count = len(self.sales) if self.sales else 0
        sales_amount = sum(float(sale.total_bill_amount) for sale in self.sales) if self.sales else 0.0
        
        # Tổng hợp - bills trực tiếp + sales
        total_bills = direct_bills_count + sales_count
        total_amount = direct_bills_amount + sales_amount
        
        # Map legacy is_active to new status
        if hasattr(self, 'status') and self.status:
            status = self.status.value if hasattr(self.status, 'value') else str(self.status)
        else:
            # Fallback to legacy is_active
            status = CustomerStatus.ACTIVE.value if self.is_active else CustomerStatus.INACTIVE.value
        
        # Map legacy fields to new structure
        customer_type = self.customer_type.value if hasattr(self.customer_type, 'value') else str(self.customer_type) if self.customer_type else CustomerType.INDIVIDUAL.value
        
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'zalo': self.zalo,
            'email': self.email,
            'bank_account': self.bank_account,
            'bank_name': self.bank_name,
            'address': self.address,
            'notes': self.notes,
            
            # New fields for frontend
            'customerType': customer_type,
            'companyName': self.company_name,
            'taxCode': self.tax_code,
            'status': status,
            'totalBills': total_bills,
            'totalAmount': total_amount,
            
            # Legacy fields (keep for backward compatibility)
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            
            # Frontend expects these field names
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}', phone='{self.phone}')>"
