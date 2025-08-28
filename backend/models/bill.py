from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from enum import Enum as PyEnum

class BillStatus(PyEnum):
    """Bill status enumeration"""
    IN_WAREHOUSE = "IN_WAREHOUSE"          # Bill đã lưu vào kho (có sẵn)
    PENDING_PAYMENT = "PENDING_PAYMENT"    # Bill đã bán, chờ khách thanh toán
    PAID = "PAID"                          # Khách đã thanh toán, chờ mình thanh lại
    COMPLETED = "COMPLETED"                # Mình đã thanh lại cho khách
    EXPIRED = "EXPIRED"                    # Bill hết hạn
    CANCELLED = "CANCELLED"                # Giao dịch bị hủy

class Bill(Base):
    """Bill model for managing electricity bills"""
    
    __tablename__ = 'bills'
    
    id = Column(Integer, primary_key=True, index=True)
    contract_code = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)  # Bill amount in VND
    period = Column(String(10), nullable=True)  # Payment period (e.g., "08/2025")
    due_date = Column(DateTime(timezone=True), nullable=True)
    bill_date = Column(DateTime(timezone=True), nullable=True)
    meter_number = Column(String(50), nullable=True)
    status = Column(Enum(BillStatus, name='bill_status_enum'), default=BillStatus.IN_WAREHOUSE)
    
    # FPT API response data
    raw_response = Column(Text, nullable=True)
    api_response_time = Column(DateTime(timezone=True), nullable=True)
    api_success = Column(Boolean, default=False)
    
    # Warehouse management
    added_to_warehouse_at = Column(DateTime(timezone=True), nullable=True)
    added_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    warehouse_notes = Column(Text, nullable=True)
    
    # Customer information
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=True)
    
    # Sale information
    sale_id = Column(Integer, ForeignKey('sales.id'), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    added_by_user = relationship("User")
    customer = relationship("Customer")
    sale = relationship("Sale", back_populates="bills")
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'contract_code': self.contract_code,
            'customer_name': self.customer_name,
            'address': self.address,
            'amount': float(self.amount) if self.amount else None,
            'period': self.period,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'bill_date': self.bill_date.isoformat() if self.bill_date else None,
            'meter_number': self.meter_number,
            'status': self.status.value if hasattr(self.status, 'value') else str(self.status) if self.status else None,
            'raw_response': self.raw_response,
            'api_response_time': self.api_response_time.isoformat() if self.api_response_time else None,
            'api_success': self.api_success,
            'added_to_warehouse_at': self.added_to_warehouse_at.isoformat() if self.added_to_warehouse_at else None,
            'added_by': self.added_by,
            'warehouse_notes': self.warehouse_notes,
            'customer_id': self.customer_id,
            'sale_id': self.sale_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f"<Bill(id={self.id}, contract_code='{self.contract_code}', amount={self.amount}, status='{self.status}')>"
