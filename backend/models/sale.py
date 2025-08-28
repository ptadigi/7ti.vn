from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from enum import Enum as PyEnum

class SaleStatus(PyEnum):
    """Sale status enumeration"""
    PENDING_PAYMENT = "PENDING_PAYMENT"    # Chờ khách thanh toán
    PAID = "PAID"                          # Khách đã thanh toán, chờ mình thanh lại
    COMPLETED = "COMPLETED"                # Mình đã thanh lại cho khách
    CANCELLED = "CANCELLED"                # Giao dịch bị hủy
    REFUNDED = "REFUNDED"                  # Giao dịch bị hoàn tiền

class PaymentMethod(PyEnum):
    """Payment method enumeration"""
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    ZALO_PAY = "ZALO_PAY"
    MOMO = "MOMO"
    OTHER = "OTHER"

class Sale(Base):
    """Sale model for managing bill sales"""
    
    __tablename__ = 'sales'
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Sale details
    total_bill_amount = Column(Numeric(15, 2), nullable=False)  # Total amount of all bills
    profit_percentage = Column(Numeric(5, 2), nullable=False)  # Profit percentage (e.g., 5.00 for 5%)
    profit_amount = Column(Numeric(15, 2), nullable=False)  # Calculated profit amount
    customer_payment = Column(Numeric(15, 2), nullable=False)  # Amount customer pays (total - profit)
    
    # Payment information
    payment_method = Column(Enum(PaymentMethod, name='payment_method_enum'), nullable=False)
    payment_status = Column(Boolean, default=False)  # True if customer has paid
    payment_date = Column(DateTime(timezone=True), nullable=True)
    
    # Sale status
    status = Column(Enum(SaleStatus, name='sale_status_enum'), default=SaleStatus.PENDING_PAYMENT)
    
    # Notes and additional info
    notes = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="sales")
    user = relationship("User", back_populates="sales")
    bills = relationship("Bill", back_populates="sale")
    customer_transactions = relationship("CustomerTransaction", back_populates="sale")
    
    def calculate_profit(self):
        """Calculate profit amount based on percentage"""
        if self.total_bill_amount and self.profit_percentage:
            # Convert Decimal to float for calculations
            total_amount_float = float(self.total_bill_amount) if self.total_bill_amount else 0.0
            profit_percentage_float = float(self.profit_percentage) if self.profit_percentage else 0.0
            
            self.profit_amount = (total_amount_float * profit_percentage_float) / 100
            self.customer_payment = total_amount_float - self.profit_amount
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'user_id': self.user_id,
            'total_bill_amount': float(self.total_bill_amount) if self.total_bill_amount else None,
            'profit_percentage': float(self.profit_percentage) if self.profit_percentage else None,
            'profit_amount': float(self.profit_amount) if self.profit_amount else None,
            'customer_payment': float(self.customer_payment) if self.customer_payment else None,
            'payment_method': self.payment_method.value if hasattr(self.payment_method, 'value') else str(self.payment_method) if self.payment_method else None,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'status': self.status.value if hasattr(self.status, 'value') else str(self.status) if self.status else None,
            'notes': self.notes,
            'customer_notes': self.customer_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            # Include related data
            'customer': self.customer.to_dict() if self.customer else None,
            'user': self.user.to_dict() if self.user else None,
            'bills': [bill.to_dict() for bill in self.bills] if self.bills else [],
            'customer_transactions': [ct.to_dict() for ct in self.customer_transactions] if self.customer_transactions else []
        }
    
    def __repr__(self):
        return f"<Sale(id={self.id}, customer_id={self.customer_id}, total_amount={self.total_bill_amount}, profit={self.profit_amount})>"
