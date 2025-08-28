from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from models.customer import Customer
from models.user import User
from config.database import get_db
from datetime import datetime

class CustomerService:
    """Service for customer management operations"""
    
    def get_all_customers(self, 
                         page: int = 1, 
                         per_page: int = 20,
                         search: str = None,
                         is_active: bool = None) -> Dict[str, Any]:
        """Get all customers with pagination and filtering"""
        try:
            db = next(get_db())
            
            # Build query
            query = db.query(Customer)
            
            # Apply filters
            if search:
                search_filter = or_(
                    Customer.name.ilike(f'%{search}%'),
                    Customer.phone.ilike(f'%{search}%'),
                    Customer.zalo.ilike(f'%{search}%'),
                    Customer.email.ilike(f'%{search}%')
                )
                query = query.filter(search_filter)
            
            if is_active is not None:
                query = query.filter(Customer.is_active == is_active)
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            customers = query.offset((page - 1) * per_page).limit(per_page).all()
            
            # Convert to dict
            customer_list = [customer.to_dict() for customer in customers]
            
            return {
                'success': True,
                'customers': customer_list,
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
    
    def get_customer_by_id(self, customer_id: int) -> Dict[str, Any]:
        """Get customer by ID"""
        try:
            db = next(get_db())
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            
            if not customer:
                return {
                    'success': False,
                    'error': 'Customer not found'
                }
            
            return {
                'success': True,
                'customer': customer.to_dict()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def create_customer(self, customer_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Create a new customer"""
        try:
            db = next(get_db())
            
            # Check if phone already exists
            existing_customer = db.query(Customer).filter(
                Customer.phone == customer_data['phone']
            ).first()
            
            if existing_customer:
                return {
                    'success': False,
                    'error': 'Phone number already exists'
                }
            
            # Create customer
            customer = Customer(
                name=customer_data['name'],
                phone=customer_data['phone'],
                zalo=customer_data.get('zalo'),
                email=customer_data.get('email'),
                bank_account=customer_data.get('bank_account'),
                bank_name=customer_data.get('bank_name'),
                address=customer_data.get('address'),
                notes=customer_data.get('notes'),
                customer_type=customer_data.get('customerType', 'individual'),
                company_name=customer_data.get('companyName'),
                tax_code=customer_data.get('taxCode'),
                status=customer_data.get('status', 'active'),
                created_by=user_id
            )
            
            db.add(customer)
            db.commit()
            db.refresh(customer)
            
            return {
                'success': True,
                'customer': customer.to_dict(),
                'message': 'Customer created successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_customer(self, customer_id: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update customer information"""
        try:
            db = next(get_db())
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            
            if not customer:
                return {
                    'success': False,
                    'error': 'Customer not found'
                }
            
            # Check if phone is being changed and if it already exists
            if 'phone' in customer_data and customer_data['phone'] != customer.phone:
                existing_customer = db.query(Customer).filter(
                    and_(
                        Customer.phone == customer_data['phone'],
                        Customer.id != customer_id
                    )
                ).first()
                
                if existing_customer:
                    return {
                        'success': False,
                        'error': 'Phone number already exists'
                    }
            
            # Update fields
            allowed_fields = [
                'name', 'phone', 'zalo', 'email', 'bank_account', 
                'bank_name', 'address', 'notes', 'is_active',
                'customer_type', 'company_name', 'tax_code', 'status'
            ]
            
            for field in allowed_fields:
                if field in customer_data:
                    setattr(customer, field, customer_data[field])
            
            customer.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'customer': customer.to_dict(),
                'message': 'Customer updated successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def delete_customer(self, customer_id: int) -> Dict[str, Any]:
        """Delete customer (soft delete by setting is_active to False)"""
        try:
            db = next(get_db())
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            
            if not customer:
                return {
                    'success': False,
                    'error': 'Customer not found'
                }
            
            # Check if customer has any sales
            if customer.sales:
                return {
                    'success': False,
                    'error': 'Cannot delete customer with existing sales'
                }
            
            # Soft delete
            customer.is_active = False
            customer.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'message': 'Customer deleted successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def search_customers(self, search_term: str) -> Dict[str, Any]:
        """Search customers by name, phone, or email"""
        try:
            db = next(get_db())
            
            # Build search query
            search_filter = or_(
                Customer.name.ilike(f'%{search_term}%'),
                Customer.phone.ilike(f'%{search_term}%'),
                Customer.zalo.ilike(f'%{search_term}%'),
                Customer.email.ilike(f'%{search_term}%')
            )
            
            customers = db.query(Customer).filter(
                and_(search_filter, Customer.is_active == True)
            ).limit(10).all()
            
            customer_list = [customer.to_dict() for customer in customers]
            
            return {
                'success': True,
                'customers': customer_list,
                'count': len(customer_list)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_customer_statistics(self) -> Dict[str, Any]:
        """Get customer statistics"""
        try:
            db = next(get_db())
            
            # Total customers
            total_customers = db.query(Customer).count()
            active_customers = db.query(Customer).filter(Customer.is_active == True).count()
            
            # Customers by month (last 12 months)
            from sqlalchemy import extract, func
            from datetime import datetime, timedelta
            
            monthly_stats = []
            for i in range(12):
                month_date = datetime.utcnow() - timedelta(days=30*i)
                month = month_date.month
                year = month_date.year
                
                count = db.query(Customer).filter(
                    and_(
                        extract('month', Customer.created_at) == month,
                        extract('year', Customer.created_at) == year
                    )
                ).count()
                
                monthly_stats.append({
                    'month': month_date.strftime('%Y-%m'),
                    'count': count
                })
            
            return {
                'success': True,
                'statistics': {
                    'total_customers': total_customers,
                    'active_customers': active_customers,
                    'inactive_customers': total_customers - active_customers,
                    'monthly_growth': monthly_stats
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

# Create global instance
customer_service = CustomerService()
