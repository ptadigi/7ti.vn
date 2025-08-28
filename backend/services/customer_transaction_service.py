from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from models.customer_transaction import CustomerTransaction, TransactionType, TransactionStatus
from models.sale import Sale
from config.database import get_db
from datetime import datetime
import json

class CustomerTransactionService:
    """Service for managing customer transactions"""
    
    def create_transaction(self, 
                          sale_id: int,
                          transaction_type: str,
                          amount: float,
                          payment_method: str = None,
                          bank_name: str = None,
                          bank_account: str = None,
                          reference_number: str = None,
                          notes: str = None) -> Dict[str, Any]:
        """Create a new customer transaction"""
        try:
            db = next(get_db())
            
            # Validate sale exists
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Create transaction
            transaction = CustomerTransaction(
                sale_id=sale_id,
                transaction_type=transaction_type,
                amount=amount,
                payment_method=payment_method,
                bank_name=bank_name,
                bank_account=bank_account,
                reference_number=reference_number,
                notes=notes,
                status=TransactionStatus.PENDING
            )
            
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            return {
                'success': True,
                'transaction': transaction.to_dict()
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_transactions_by_sale(self, sale_id: int) -> Dict[str, Any]:
        """Get all transactions for a specific sale"""
        try:
            db = next(get_db())
            
            transactions = db.query(CustomerTransaction).filter(
                CustomerTransaction.sale_id == sale_id
            ).order_by(desc(CustomerTransaction.created_at)).all()
            
            transaction_list = [t.to_dict() for t in transactions]
            
            return {
                'success': True,
                'transactions': transaction_list,
                'count': len(transaction_list)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_transaction_status(self, 
                                transaction_id: int,
                                status: str,
                                admin_notes: str = None) -> Dict[str, Any]:
        """Update transaction status"""
        try:
            db = next(get_db())
            
            transaction = db.query(CustomerTransaction).filter(
                CustomerTransaction.id == transaction_id
            ).first()
            
            if not transaction:
                return {
                    'success': False,
                    'error': 'Transaction not found'
                }
            
            # Update status
            transaction.status = status
            if status == TransactionStatus.COMPLETED:
                transaction.processed_at = datetime.utcnow()
            
            if admin_notes:
                transaction.admin_notes = admin_notes
            
            transaction.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                'success': True,
                'transaction': transaction.to_dict()
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_transaction_summary(self, sale_id: int) -> Dict[str, Any]:
        """Get transaction summary for a sale"""
        try:
            db = next(get_db())
            
            # Get all transactions for the sale
            transactions = db.query(CustomerTransaction).filter(
                CustomerTransaction.sale_id == sale_id
            ).all()
            
            # Calculate totals by type
            summary = {
                'total_payments_received': 0,
                'total_payments_sent': 0,
                'total_refunds': 0,
                'net_amount': 0,
                'transaction_count': len(transactions)
            }
            
            for t in transactions:
                if t.transaction_type == TransactionType.PAYMENT_RECEIVED:
                    summary['total_payments_received'] += float(t.amount or 0)
                elif t.transaction_type == TransactionType.PAYMENT_SENT:
                    summary['total_payments_sent'] += float(t.amount or 0)
                elif t.transaction_type == TransactionType.REFUND:
                    summary['total_refunds'] += float(t.amount or 0)
            
            # Calculate net amount
            summary['net_amount'] = (
                summary['total_payments_received'] - 
                summary['total_payments_sent'] - 
                summary['total_refunds']
            )
            
            return {
                'success': True,
                'summary': summary,
                'transactions': [t.to_dict() for t in transactions]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def create_payment_received_transaction(self, 
                                          sale_id: int,
                                          amount: float,
                                          payment_method: str,
                                          reference_number: str = None,
                                          notes: str = None) -> Dict[str, Any]:
        """Create transaction when customer pays"""
        return self.create_transaction(
            sale_id=sale_id,
            transaction_type=TransactionType.PAYMENT_RECEIVED,
            amount=amount,
            payment_method=payment_method,
            reference_number=reference_number,
            notes=notes
        )
    
    def create_payment_sent_transaction(self, 
                                       sale_id: int,
                                       amount: float,
                                       payment_method: str,
                                       bank_name: str = None,
                                       bank_account: str = None,
                                       reference_number: str = None,
                                       notes: str = None) -> Dict[str, Any]:
        """Create transaction when sending money to customer"""
        return self.create_transaction(
            sale_id=sale_id,
            transaction_type=TransactionType.PAYMENT_SENT,
            amount=amount,
            payment_method=payment_method,
            bank_name=bank_name,
            bank_account=bank_account,
            reference_number=reference_number,
            notes=notes
        )

# Create global instance
customer_transaction_service = CustomerTransactionService()
