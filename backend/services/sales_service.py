from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from models.sale import Sale, SaleStatus, PaymentMethod
from models.bill import Bill, BillStatus
from models.customer import Customer
from models.user import User
# from models.customer_transaction import TransactionType  # Model doesn't exist
from config.database import get_db
from datetime import datetime, timedelta
import json

class SalesService:
    """Service for sales management operations"""
    
    def create_sale(self, sale_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Create a new sale transaction"""
        try:
            db = next(get_db())
            
            # Validate required fields
            required_fields = ['customer_id', 'bill_ids', 'profit_percentage']
            for field in required_fields:
                if not sale_data.get(field):
                    return {
                        'success': False,
                        'error': f'{field} is required'
                    }
            
            # Validate customer exists
            customer = db.query(Customer).filter(Customer.id == sale_data['customer_id']).first()
            if not customer:
                return {
                    'success': False,
                    'error': 'Customer not found'
                }
            
            # Validate bills exist and are available
            bill_ids = sale_data['bill_ids']
            bills = db.query(Bill).filter(
                and_(
                    Bill.id.in_(bill_ids),
                    Bill.status == BillStatus.IN_WAREHOUSE
                )
            ).all()
            
            if len(bills) != len(bill_ids):
                return {
                    'success': False,
                    'error': 'Some bills are not available or not found'
                }
            
            # Calculate amounts
            total_bill_amount = sum(bill.amount for bill in bills)
            profit_percentage = float(sale_data['profit_percentage'])
            # Convert Decimal to float for calculations
            total_bill_amount_float = float(total_bill_amount) if total_bill_amount else 0.0
            profit_amount = (total_bill_amount_float * profit_percentage) / 100
            customer_payment = total_bill_amount_float - profit_amount
            
            # Create sale
            # Convert payment_method string to enum
            payment_method_str = sale_data.get('payment_method', 'cash')
            # Map frontend values to enum values
            payment_method_map = {
                'cash': PaymentMethod.CASH,
                'bank_transfer': PaymentMethod.BANK_TRANSFER,
                'zalo_pay': PaymentMethod.ZALO_PAY,
                'momo': PaymentMethod.MOMO,
                'other': PaymentMethod.OTHER
            }
            payment_method = payment_method_map.get(payment_method_str.lower(), PaymentMethod.CASH)
            
            sale = Sale(
                customer_id=sale_data['customer_id'],
                user_id=user_id,
                total_bill_amount=total_bill_amount,
                profit_percentage=profit_percentage,
                profit_amount=profit_amount,
                customer_payment=customer_payment,
                payment_method=payment_method,
                payment_status=sale_data.get('payment_status', False),
                status=SaleStatus.PENDING_PAYMENT,  # Chờ khách thanh toán
                notes=sale_data.get('notes'),
                customer_notes=sale_data.get('customer_notes')
            )
            
            db.add(sale)
            db.flush()  # Get sale ID
            
            # Update bills status and link to sale
            for bill in bills:
                bill.status = BillStatus.PENDING_PAYMENT  # Chờ khách thanh toán
                bill.sale_id = sale.id
                bill.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(sale)
            
            return {
                'success': True,
                'sale': sale.to_dict(),
                'message': 'Sale created successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def confirm_payment(self, sale_id: int) -> Dict[str, Any]:
        """Confirm customer has paid - chuyển từ pending_payment sang paid"""
        try:
            db = next(get_db())
            
            # Get sale
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Check if sale is in pending_payment status
            if sale.status != SaleStatus.PENDING_PAYMENT:
                return {
                    'success': False,
                    'error': f'Sale status must be pending_payment, current: {sale.status}'
                }
            
            # Update sale status to paid (khách đã thanh)
            sale.status = SaleStatus.PAID
            sale.payment_status = True
            sale.payment_date = datetime.utcnow()
            sale.updated_at = datetime.utcnow()
            
            # Update bills status to paid
            bills = db.query(Bill).filter(Bill.sale_id == sale_id).all()
            for bill in bills:
                bill.status = BillStatus.PAID
                bill.updated_at = datetime.utcnow()
            
            # Create transaction record for payment received
            from services.customer_transaction_service import customer_transaction_service
            transaction_result = customer_transaction_service.create_payment_received_transaction(
                sale_id=sale_id,
                amount=float(sale.total_bill_amount),
                payment_method=sale.payment_method.value if hasattr(sale.payment_method, 'value') else str(sale.payment_method),
                notes=f"Khách hàng đã thanh toán {sale.total_bill_amount} đ"
            )
            
            if not transaction_result['success']:
                print(f"Warning: Failed to create payment transaction: {transaction_result['error']}")
            
            db.commit()
            db.refresh(sale)
            
            return {
                'success': True,
                'sale': sale.to_dict(),
                'message': 'Khách hàng đã thanh toán thành công'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

    def complete_sale(self, sale_id: int) -> Dict[str, Any]:
        """Complete sale - mình đã thanh lại cho khách"""
        try:
            db = next(get_db())
            
            # Get sale
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Check if sale is in paid status (khách đã thanh)
            if sale.status != SaleStatus.PAID:
                return {
                    'success': False,
                    'error': f'Sale status must be paid, current: {sale.status}'
                }
            
            # Update sale status to completed (mình đã thanh lại)
            sale.status = SaleStatus.COMPLETED
            sale.completed_at = datetime.utcnow()
            sale.updated_at = datetime.utcnow()
            
            # Update bills status to completed
            bills = db.query(Bill).filter(Bill.sale_id == sale_id).all()
            for bill in bills:
                bill.status = BillStatus.COMPLETED
                bill.updated_at = datetime.utcnow()
            
            # Create transaction record for payment sent to customer
            # from services.customer_transaction_service import customer_transaction_service
            # transaction_result = customer_transaction_service.create_payment_sent_transaction(
            #     sale_id=sale_id,
            #     amount=float(sale.customer_payment),
            #     payment_method=sale.payment_method.value if hasattr(sale.payment_method, 'value') else str(sale.payment_method),
            #     notes=f"Đã thanh lại cho khách hàng {sale.customer_payment} đ"
            # )
            
            # if not transaction_result['success']:
            #     print(f"Warning: Failed to create payment transaction: {transaction_result['error']}")
            
            # Tạm thời bỏ qua tạo transaction để fix lỗi
            print(f"Sale {sale_id} completed, transaction creation temporarily disabled")
            
            db.commit()
            db.refresh(sale)
            
            return {
                'success': True,
                'sale': sale.to_dict(),
                'message': 'Đã thanh lại cho khách hàng thành công'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

    def get_sale_by_id(self, sale_id: int) -> Dict[str, Any]:
        """Get sale by ID with details"""
        try:
            db = next(get_db())
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Get related data
            sale_dict = sale.to_dict()
            sale_dict['customer'] = sale.customer.to_dict() if sale.customer else None
            sale_dict['user'] = sale.user.to_dict() if sale.user else None
            sale_dict['bills'] = [bill.to_dict() for bill in sale.bills] if sale.bills else []
            
            return {
                'success': True,
                'sale': sale_dict
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_all_sales(self, 
                      page: int = 1, 
                      per_page: int = 20,
                      status: str = None,
                      customer_id: int = None,
                      start_date: str = None,
                      end_date: str = None) -> Dict[str, Any]:
        """Get all sales with filtering and pagination"""
        try:
            db = next(get_db())
            
            # Build query
            query = db.query(Sale)
            
            # Apply filters
            if status:
                query = query.filter(Sale.status == status)
            
            if customer_id:
                query = query.filter(Sale.customer_id == customer_id)
            
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at <= end_dt)
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            sales = query.order_by(desc(Sale.created_at)).offset(
                (page - 1) * per_page
            ).limit(per_page).all()
            
            # Convert to dict with related data
            sale_list = []
            for sale in sales:
                sale_dict = sale.to_dict()
                sale_dict['customer'] = sale.customer.to_dict() if sale.customer else None
                sale_dict['bills_count'] = len(sale.bills) if sale.bills else 0
                sale_list.append(sale_dict)
            
            return {
                'success': True,
                'sales': sale_list,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_sale_status(self, sale_id: int, status: str, notes: str = None) -> Dict[str, Any]:
        """Update sale status"""
        try:
            db = next(get_db())
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Validate status transition
            valid_transitions = {
                        SaleStatus.PENDING_PAYMENT: [SaleStatus.PAID, SaleStatus.CANCELLED],
        SaleStatus.PAID: [SaleStatus.COMPLETED, SaleStatus.CANCELLED],
        SaleStatus.COMPLETED: [SaleStatus.COMPLETED],  # Final state
        SaleStatus.CANCELLED: [SaleStatus.CANCELLED],  # Final state
                SaleStatus.REFUNDED: [SaleStatus.REFUNDED]  # Final state
            }
            
            if status not in valid_transitions.get(sale.status, []):
                return {
                    'success': False,
                    'error': f'Invalid status transition from {sale.status} to {status}'
                }
            
            # Update status
            old_status = sale.status
            sale.status = status
            
            # Set completion date if completed
            if status == SaleStatus.COMPLETED:
                sale.completed_at = datetime.utcnow()
            
            # Update notes
            if notes:
                sale.notes = notes
            
            sale.updated_at = datetime.utcnow()
            
            # Update bills status if cancelled
            if status == SaleStatus.CANCELLED and old_status != SaleStatus.CANCELLED:
                for bill in sale.bills:
                    bill.status = BillStatus.IN_WAREHOUSE
                    bill.sale_id = None
                    bill.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                'success': True,
                'sale': sale.to_dict(),
                'message': f'Sale status updated to {status}'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_payment_status(self, sale_id: int, payment_status: str, payment_date: str = None) -> Dict[str, Any]:
        """Update payment status"""
        try:
            db = next(get_db())
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Update payment status
            sale.payment_status = payment_status
            
            if payment_date:
                sale.payment_date = datetime.fromisoformat(payment_date.replace('Z', '+00:00'))
            elif payment_status == 'paid':
                sale.payment_date = datetime.utcnow()
            
            sale.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'sale': sale.to_dict(),
                'message': f'Payment status updated to {payment_status}'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_sales_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get sales statistics"""
        try:
            db = next(get_db())
            
            # Base query
            query = db.query(Sale)
            
            # Apply date filter
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at <= end_dt)
            
            # Get all sales in period
            sales = query.all()
            
            if not sales:
                return {
                    'success': True,
                    'statistics': {
                        'total_sales': 0,
                        'total_revenue': 0,
                        'total_profit': 0,
                        'average_profit_percentage': 0,
                        'sales_by_status': {},
                        'revenue_by_month': {},
                        'top_customers': []
                    }
                }
            
            # Calculate statistics
            total_sales = len(sales)
            total_revenue = sum(sale.profit_amount for sale in sales)
            total_profit = sum(sale.profit_amount for sale in sales)
            average_profit_percentage = sum(sale.profit_percentage for sale in sales) / total_sales
            
            # Sales by status
            sales_by_status = {}
            for sale in sales:
                status = sale.status.value if hasattr(sale.status, 'value') else str(sale.status)
                sales_by_status[status] = sales_by_status.get(status, 0) + 1
            
            # Revenue by month
            revenue_by_month = {}
            for sale in sales:
                month_key = sale.created_at.strftime('%Y-%m')
                revenue_by_month[month_key] = revenue_by_month.get(month_key, 0) + sale.profit_amount
            
            # Top customers
            customer_revenue = {}
            for sale in sales:
                customer_name = sale.customer.name if sale.customer else 'Unknown'
                customer_revenue[customer_name] = customer_revenue.get(customer_name, 0) + sale.profit_amount
            
            top_customers = sorted(
                [{'name': name, 'revenue': revenue} for name, revenue in customer_revenue.items()],
                key=lambda x: x['revenue'],
                reverse=True
            )[:10]
            
            return {
                'success': True,
                'statistics': {
                    'total_sales': total_sales,
                    'total_revenue': float(total_revenue),
                    'total_profit': float(total_profit),
                    'average_profit_percentage': float(average_profit_percentage),
                    'sales_by_status': sales_by_status,
                    'revenue_by_month': revenue_by_month,
                    'top_customers': top_customers
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def export_sales(self, format: str = 'json', start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Export sales data"""
        try:
            db = next(get_db())
            
            # Build query
            query = db.query(Sale)
            
            # Apply date filter
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Sale.created_at <= end_dt)
            
            # Get sales
            sales = query.order_by(desc(Sale.created_at)).all()
            
            # Convert to dict with related data
            sale_list = []
            for sale in sales:
                sale_dict = sale.to_dict()
                sale_dict['customer'] = sale.customer.to_dict() if sale.customer else None
                sale_dict['user'] = sale.user.to_dict() if sale.user else None
                sale_dict['bills'] = [bill.to_dict() for bill in sale.bills] if sale.bills else []
                sale_list.append(sale_dict)
            
            if format == 'json':
                return {
                    'success': True,
                    'sales': sale_list,
                    'total': len(sale_list),
                    'format': 'json'
                }
            else:
                return {
                    'success': False,
                    'error': f'Unsupported format: {format}'
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def cancel_sale(self, sale_id: int, reason: str = None) -> Dict[str, Any]:
        """Cancel a sale and return bills to warehouse"""
        try:
            db = next(get_db())
            sale = db.query(Sale).filter(Sale.id == sale_id).first()
            
            if not sale:
                return {
                    'success': False,
                    'error': 'Sale not found'
                }
            
            # Check if sale can be cancelled
            if sale.status in [SaleStatus.COMPLETED, SaleStatus.CANCELLED]:
                return {
                    'success': False,
                    'error': f'Sale cannot be cancelled in status: {sale.status}'
                }
            
            # Update sale status
            sale.status = SaleStatus.CANCELLED
            sale.notes = f"Cancelled: {reason}" if reason else "Cancelled by user"
            sale.updated_at = datetime.utcnow()
            
            # Return bills to warehouse
            for bill in sale.bills:
                bill.status = BillStatus.IN_WAREHOUSE
                bill.sale_id = None
                bill.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {
                'success': True,
                'message': 'Sale cancelled successfully',
                'bills_returned': len(sale.bills)
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

    def get_sales_by_customer(self, customer_id: int) -> Dict[str, Any]:
        """Get all sales for a specific customer"""
        try:
            db = next(get_db())
            
            # Get sales by customer ID
            sales = db.query(Sale).filter(Sale.customer_id == customer_id).order_by(
                desc(Sale.created_at)
            ).all()
            
            # Convert to dict with related data
            sale_list = []
            for sale in sales:
                sale_dict = sale.to_dict()
                sale_dict['customer'] = sale.customer.to_dict() if sale.customer else None
                sale_dict['user'] = sale.user.to_dict() if sale.user else None
                sale_dict['bills'] = [bill.to_dict() for bill in sale.bills] if sale.bills else []
                sale_list.append(sale_dict)
            
            return {
                'success': True,
                'sales': sale_list,
                'total': len(sale_list)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

# Create global instance
sales_service = SalesService()
