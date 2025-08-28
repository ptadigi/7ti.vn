from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from enum import Enum as PyEnum

class TransactionType(PyEnum):
    """Transaction type enumeration"""
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"    # Khách hàng đã thanh toán
    PAYMENT_SENT = "PAYMENT_SENT"            # Mình đã thanh lại cho khách
    REFUND = "REFUND"                        # Hoàn tiền

class TransactionStatus(PyEnum):
    """Transaction status enumeration"""
    PENDING = "PENDING"                      # Chờ xử lý
    COMPLETED = "COMPLETED"                  # Hoàn thành
    FAILED = "FAILED"                        # Thất bại
    CANCELLED = "CANCELLED"                  # Đã hủy

class CustomerTransaction(Base):
    """Customer transaction model for tracking payment flows"""
    
    __tablename__ = 'customer_transactions'
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey('sales.id'), nullable=False)
    
    # Transaction details
    transaction_type = Column(Enum(TransactionType, name='transaction_type_enum'), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)  # Transaction amount
    
    # Payment information
    payment_method = Column(String(50), nullable=True)  # CASH, BANK_TRANSFER, etc.
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    reference_number = Column(String(100), nullable=True)  # Transaction reference
    
    # Status and notes
    status = Column(Enum(TransactionStatus, name='transaction_status_enum'), default=TransactionStatus.PENDING)
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)  # Notes from admin
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    sale = relationship("Sale", back_populates="customer_transactions")
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'transaction_type': self.transaction_type.value if hasattr(self.transaction_type, 'value') else str(self.transaction_type),
            'amount': float(self.amount) if self.amount else None,
            'payment_method': self.payment_method,
            'bank_name': self.bank_name,
            'bank_account': self.bank_account,
            'reference_number': self.reference_number,
            'status': self.status.value if hasattr(self.status, 'value') else str(self.status),
            'notes': self.notes,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            # Không include sale để tránh recursion
        }
    
    def __repr__(self):
        return f"<CustomerTransaction(id={self.id}, type={self.transaction_type}, amount={self.amount}, status={self.status})>"
