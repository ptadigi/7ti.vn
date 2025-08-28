from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from models.bill import Bill, BillStatus
from models.user import User
from config.database import get_db
from datetime import datetime, timedelta
import json

class BillService:
    """Service for bill management operations"""
    
    def get_warehouse_bills(self, page=1, per_page=20, search=None, min_amount=None, max_amount=None, status=None, customer_name=None):
        """Get bills in warehouse with pagination and filters"""
        db = None
        try:
            db = next(get_db())
            
            # Debug: Log the query we're about to execute
            print(f"DEBUG: Querying bills with status IN_WAREHOUSE")
            print(f"DEBUG: BillStatus.IN_WAREHOUSE = {BillStatus.IN_WAREHOUSE}")
            
            # Build query - Use string comparison to avoid enum issues
            query = db.query(Bill).filter(Bill.status == 'IN_WAREHOUSE')
            
            # Apply filters
            if search:
                search_filter = or_(
                    Bill.contract_code.ilike(f'%{search}%'),
                    Bill.customer_name.ilike(f'%{search}%'),
                    Bill.address.ilike(f'%{search}%')
                )
                query = query.filter(search_filter)
            
            if min_amount is not None:
                query = query.filter(Bill.amount >= min_amount)
            
            if max_amount is not None:
                query = query.filter(Bill.amount <= max_amount)
            
            if status:
                query = query.filter(Bill.status == status)
            
            if customer_name:
                query = query.filter(Bill.customer_name.ilike(f'%{customer_name}%'))
            
            # Get total count
            total = query.count()
            print(f"DEBUG: Found {total} bills")
            
            # Apply pagination and ordering
            bills = query.order_by(desc(Bill.added_to_warehouse_at)).offset(
                (page - 1) * per_page
            ).limit(per_page).all()
            
            # Convert to dict
            bill_list = [bill.to_dict() for bill in bills]
            
            return {
                'success': True,
                'bills': bill_list,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
            
        except Exception as e:
            print(f"ERROR in get_warehouse_bills: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            if db:
                db.close()

    def get_all_bills(self, page=1, limit=50, all_statuses=True):
        """Get all bills with all statuses"""
        db = None
        try:
            db = next(get_db())
            
            # Query all bills regardless of status
            query = db.query(Bill)
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            bills = query.order_by(desc(Bill.added_to_warehouse_at)).offset(
                (page - 1) * limit
            ).limit(limit).all()
            
            # Convert to dict
            bill_list = [bill.to_dict() for bill in bills]
            
            return {
                'success': True,
                'bills': bill_list,
                'total': total,
                'page': page,
                'limit': limit,
                'totalPages': (total + limit - 1) // limit
            }
            
        except Exception as e:
            print(f"ERROR in get_all_bills: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            if db:
                db.close()
    
    def get_bill_by_id(self, bill_id: int) -> Dict[str, Any]:
        """Get bill by ID"""
        try:
            db = next(get_db())
            bill = db.query(Bill).filter(Bill.id == bill_id).first()
            
            if not bill:
                return {
                    'success': False,
                    'error': 'Bill not found'
                }
            
            return {
                'success': True,
                'bill': bill.to_dict()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def add_bill_to_warehouse(self, bill_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Add bill to warehouse"""
        try:
            db = next(get_db())
            
            # Check if bill already exists
            existing_bill = db.query(Bill).filter(
                Bill.contract_code == bill_data['contract_code']
            ).first()
            
            if existing_bill:
                return {
                    'success': False,
                    'error': 'Bill with this contract code already exists'
                }
            
            # Create bill
            bill = Bill(
                contract_code=bill_data['contract_code'],
                customer_name=bill_data['customer_name'],
                address=bill_data.get('address'),
                amount=bill_data['amount'],
                due_date=bill_data.get('due_date'),
                bill_date=bill_data.get('bill_date'),
                meter_number=bill_data.get('meter_number'),
                status=BillStatus.IN_WAREHOUSE,
                raw_response=bill_data.get('raw_response'),
                api_response_time=bill_data.get('api_response_time'),
                api_success=bill_data.get('api_success', True),
                added_to_warehouse_at=datetime.utcnow(),
                added_by=user_id,
                warehouse_notes=bill_data.get('warehouse_notes')
            )
            
            db.add(bill)
            db.commit()
            db.refresh(bill)
            
            return {
                'success': True,
                'bill': bill.to_dict(),
                'message': 'Bill added to warehouse successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_bill(self, bill_id: int, bill_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update bill information"""
        try:
            db = next(get_db())
            bill = db.query(Bill).filter(Bill.id == bill_id).first()
            
            if not bill:
                return {
                    'success': False,
                    'error': 'Bill not found'
                }
            
            # Update allowed fields
            allowed_fields = [
                'customer_name', 'address', 'amount', 'period', 'due_date', 
                'bill_date', 'meter_number', 'warehouse_notes'
            ]
            
            for field in allowed_fields:
                if field in bill_data:
                    setattr(bill, field, bill_data[field])
            
            bill.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'bill': bill.to_dict(),
                'message': 'Bill updated successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def remove_bill_from_warehouse(self, bill_id: int) -> Dict[str, Any]:
        """Remove bill from warehouse (soft delete)"""
        try:
            db = next(get_db())
            bill = db.query(Bill).filter(Bill.id == bill_id).first()
            
            if not bill:
                return {
                    'success': False,
                    'error': 'Bill not found'
                }
            
            # Check if bill is sold
            if bill.status in [BillStatus.PENDING_PAYMENT, BillStatus.PAID, BillStatus.COMPLETED]:
                return {
                    'success': False,
                    'error': 'Cannot remove sold bill'
                }
            
            # Soft delete by changing status
            bill.status = BillStatus.CANCELLED
            bill.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'message': 'Bill removed from warehouse successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def find_bill_combinations(self, target_amount: float, tolerance: float = 0.1) -> Dict[str, Any]:
        """Find bill combinations that sum to target amount"""
        try:
            db = next(get_db())
            
            # Get available bills
            available_bills = db.query(Bill).filter(
                and_(
                    Bill.status == BillStatus.IN_WAREHOUSE,
                    Bill.amount > 0
                )
            ).all()
            
            if not available_bills:
                return {
                    'success': False,
                    'error': 'No bills available in warehouse'
                }
            
            # Find combinations using dynamic programming approach
            combinations = self._find_combinations_dp(
                [bill.amount for bill in available_bills],
                target_amount,
                tolerance
            )
            
            # Map combinations back to bills
            bill_combinations = []
            for combo in combinations:
                combo_bills = []
                for amount in combo:
                    # Find bills with this amount
                    matching_bills = [b for b in available_bills if abs(b.amount - amount) < 0.01]
                    if matching_bills:
                        combo_bills.append(matching_bills[0].to_dict())
                
                if combo_bills:
                    total = sum(b['amount'] for b in combo_bills)
                    bill_combinations.append({
                        'bills': combo_bills,
                        'total_amount': total,
                        'difference': abs(total - target_amount),
                        'count': len(combo_bills)
                    })
            
            # Sort by difference (closest to target first)
            bill_combinations.sort(key=lambda x: x['difference'])
            
            return {
                'success': True,
                'combinations': bill_combinations,
                'target_amount': target_amount,
                'tolerance': tolerance,
                'total_combinations': len(bill_combinations)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def _find_combinations_dp(self, amounts: List[float], target: float, tolerance: float) -> List[List[float]]:
        """Dynamic programming approach to find bill combinations"""
        # Convert to integers (multiply by 100 to avoid float precision issues)
        target_int = int(target * 100)
        amounts_int = [int(amount * 100) for amount in amounts]
        tolerance_int = int(tolerance * 100)
        
        # DP array: dp[i][j] = True if we can make amount j using first i bills
        n = len(amounts_int)
        dp = [[False] * (target_int + tolerance_int + 1) for _ in range(n + 1)]
        
        # Base case: empty set can make amount 0
        for i in range(n + 1):
            dp[i][0] = True
        
        # Fill DP table
        for i in range(1, n + 1):
            for j in range(1, target_int + tolerance_int + 1):
                if j < amounts_int[i - 1]:
                    dp[i][j] = dp[i - 1][j]
                else:
                    dp[i][j] = dp[i - 1][j] or dp[i - 1][j - amounts_int[i - 1]]
        
        # Find all valid combinations
        combinations = []
        for amount in range(target_int - tolerance_int, target_int + tolerance_int + 1):
            if dp[n][amount]:
                # Backtrack to find the combination
                combo = self._backtrack_combination(dp, amounts_int, n, amount)
                if combo:
                    # Convert back to float
                    combo_float = [amount / 100 for amount in combo]
                    combinations.append(combo_float)
        
        return combinations
    
    def _backtrack_combination(self, dp: List[List[bool]], amounts: List[int], i: int, j: int) -> List[int]:
        """Backtrack to find the actual combination"""
        if i == 0 or j == 0:
            return []
        
        if dp[i][j] and not dp[i - 1][j]:
            # Current bill is used
            combo = self._backtrack_combination(dp, amounts, i - 1, j - amounts[i - 1])
            combo.append(amounts[i - 1])
            return combo
        else:
            # Current bill is not used
            return self._backtrack_combination(dp, amounts, i - 1, j)
    
    def get_warehouse_statistics(self) -> Dict[str, Any]:
        """Get warehouse statistics"""
        try:
            db = next(get_db())
            
            # Total bills in warehouse
            total_bills = db.query(Bill).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).count()
            
            # Total value in warehouse
            total_value = db.query(func.sum(Bill.amount)).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).scalar() or 0
            
            # Bills by amount range
            amount_ranges = [
                (0, 100000, '0-100k'),
                (100000, 500000, '100k-500k'),
                (500000, 1000000, '500k-1M'),
                (1000000, float('inf'), '1M+')
            ]
            
            range_stats = []
            for min_amt, max_amt, label in amount_ranges:
                if max_amt == float('inf'):
                    count = db.query(Bill).filter(
                        and_(
                            Bill.status == BillStatus.IN_WAREHOUSE,
                            Bill.amount >= min_amt
                        )
                    ).count()
                else:
                    count = db.query(Bill).filter(
                        and_(
                            Bill.status == BillStatus.IN_WAREHOUSE,
                            Bill.amount >= min_amt,
                            Bill.amount < max_amt
                        )
                    ).count()
                
                range_stats.append({
                    'range': label,
                    'count': count
                })
            
            # Recent additions (last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_additions = db.query(Bill).filter(
                and_(
                    Bill.status == BillStatus.IN_WAREHOUSE,
                    Bill.added_to_warehouse_at >= week_ago
                )
            ).count()
            
            return {
                'success': True,
                'statistics': {
                    'total_bills': total_bills,
                    'total_value': float(total_value),
                    'average_value': float(total_value / total_bills) if total_bills > 0 else 0,
                    'amount_ranges': range_stats,
                    'recent_additions': recent_additions
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def update_bill_status(self, bill_id: int, new_status: str) -> Dict[str, Any]:
        """Update bill status"""
        try:
            db = next(get_db())
            bill = db.query(Bill).filter(Bill.id == bill_id).first()
            
            if not bill:
                return {
                    'success': False,
                    'error': 'Bill not found'
                }
            
            # Validate status
            valid_statuses = ['IN_WAREHOUSE', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'EXPIRED', 'CANCELLED']
            if new_status not in valid_statuses:
                return {
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }
            
            # Update status
            bill.status = new_status
            bill.updated_at = datetime.utcnow()
            
            # Set additional timestamps based on status
            if new_status == 'PENDING_PAYMENT':
                bill.sold_at = datetime.utcnow()
            elif new_status == 'PAID':
                bill.paid_at = datetime.utcnow()
            elif new_status == 'COMPLETED':
                bill.completed_at = datetime.utcnow()
            
            db.commit()
            
            return {
                'success': True,
                'bill': bill.to_dict(),
                'message': f'Bill status updated to {new_status} successfully'
            }
            
        except Exception as e:
            db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()

    def export_warehouse_bills(self, format: str = 'json') -> Dict[str, Any]:
        """Export warehouse bills"""
        try:
            db = next(get_db())
            
            # Get all warehouse bills
            bills = db.query(Bill).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).order_by(desc(Bill.added_to_warehouse_at)).all()
            
            bill_list = [bill.to_dict() for bill in bills]
            
            if format == 'json':
                return {
                    'success': True,
                    'bills': bill_list,
                    'total': len(bill_list),
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

    def get_bills_by_customer(self, customer_id: int) -> Dict[str, Any]:
        """Get all bills for a specific customer"""
        try:
            db = next(get_db())
            
            # Get bills by customer ID
            bills = db.query(Bill).filter(Bill.customer_id == customer_id).order_by(
                desc(Bill.created_at)
            ).all()
            
            bill_list = [bill.to_dict() for bill in bills]
            
            return {
                'success': True,
                'bills': bill_list,
                'total': len(bill_list)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()



# Create global instance
bill_service = BillService()
