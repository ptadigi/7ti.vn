from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, extract
from models.sale import Sale, SaleStatus
from models.customer import Customer
from models.bill import Bill, BillStatus
from models.user import User
from config.database import get_db
from datetime import datetime, timedelta
import json

class ReportsService:
    """Service for reports and analytics operations"""
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get dashboard summary statistics"""
        try:
            db = next(get_db())
            
            # Get current date info
            now = datetime.utcnow()
            today = now.date()
            month_start = now.replace(day=1).date()
            year_start = now.replace(month=1, day=1).date()
            
            # Today's statistics
            today_sales = db.query(Sale).filter(
                func.date(Sale.created_at) == today
            ).all()
            
            today_revenue = sum(sale.profit_amount for sale in today_sales)
            today_count = len(today_sales)
            
            # This month's statistics
            month_sales = db.query(Sale).filter(
                func.date(Sale.created_at) >= month_start
            ).all()
            
            month_revenue = sum(sale.profit_amount for sale in month_sales)
            month_count = len(month_sales)
            
            # This year's statistics
            year_sales = db.query(Sale).filter(
                func.date(Sale.created_at) >= year_start
            ).all()
            
            year_revenue = sum(sale.profit_amount for sale in year_sales)
            year_count = len(year_sales)
            
            # Warehouse statistics
            warehouse_bills = db.query(Bill).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).count()
            
            warehouse_value = db.query(func.sum(Bill.amount)).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).scalar() or 0
            
            # Customer statistics
            total_customers = db.query(Customer).filter(Customer.is_active == True).count()
            
            # Recent activity (last 7 days)
            week_ago = now - timedelta(days=7)
            recent_sales = db.query(Sale).filter(
                Sale.created_at >= week_ago
            ).count()
            
            return {
                'success': True,
                'summary': {
                    'today': {
                        'sales_count': today_count,
                        'revenue': float(today_revenue),
                        'average_profit': float(today_revenue / today_count) if today_count > 0 else 0
                    },
                    'this_month': {
                        'sales_count': month_count,
                        'revenue': float(month_revenue),
                        'average_profit': float(month_revenue / month_count) if month_count > 0 else 0
                    },
                    'this_year': {
                        'sales_count': year_count,
                        'revenue': float(year_revenue),
                        'average_profit': float(year_revenue / year_count) if year_count > 0 else 0
                    },
                    'warehouse': {
                        'bill_count': warehouse_bills,
                        'total_value': float(warehouse_value)
                    },
                    'customers': {
                        'total_active': total_customers
                    },
                    'recent_activity': {
                        'sales_last_7_days': recent_sales
                    }
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_sales_analytics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get detailed sales analytics"""
        try:
            db = next(get_db())
            
            # Build base query
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
                    'analytics': {
                        'total_sales': 0,
                        'total_revenue': 0,
                        'total_profit': 0,
                        'average_profit_percentage': 0,
                        'sales_by_status': {},
                        'revenue_by_month': {},
                        'revenue_by_day': {},
                        'top_customers': [],
                        'profit_distribution': {}
                    }
                }
            
            # Calculate basic statistics
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
            
            # Revenue by day (last 30 days)
            revenue_by_day = {}
            now = datetime.utcnow()
            thirty_days_ago = now - timedelta(days=30)
            recent_sales = [s for s in sales if s.created_at >= thirty_days_ago]
            
            for sale in recent_sales:
                day_key = sale.created_at.strftime('%Y-%m-%d')
                revenue_by_day[day_key] = revenue_by_day.get(day_key, 0) + sale.profit_amount
            
            # Top customers by revenue
            customer_revenue = {}
            for sale in sales:
                customer_name = sale.customer.name if sale.customer else 'Unknown'
                customer_revenue[customer_name] = customer_revenue.get(customer_name, 0) + sale.profit_amount
            
            top_customers = sorted(
                [{'name': name, 'revenue': revenue, 'sales_count': 0} for name, revenue in customer_revenue.items()],
                key=lambda x: x['revenue'],
                reverse=True
            )[:10]
            
            # Add sales count for top customers
            for customer in top_customers:
                customer['sales_count'] = len([s for s in sales if s.customer and s.customer.name == customer['name']])
            
            # Profit distribution by percentage ranges
            profit_distribution = {
                '0-2%': 0,
                '2-5%': 0,
                '5-10%': 0,
                '10-15%': 0,
                '15%+': 0
            }
            
            for sale in sales:
                percentage = float(sale.profit_percentage)
                if percentage <= 2:
                    profit_distribution['0-2%'] += 1
                elif percentage <= 5:
                    profit_distribution['2-5%'] += 1
                elif percentage <= 10:
                    profit_distribution['5-10%'] += 1
                elif percentage <= 15:
                    profit_distribution['10-15%'] += 1
                else:
                    profit_distribution['15%+'] += 1
            
            return {
                'success': True,
                'analytics': {
                    'total_sales': total_sales,
                    'total_revenue': float(total_revenue),
                    'total_profit': float(total_profit),
                    'average_profit_percentage': float(average_profit_percentage),
                    'sales_by_status': sales_by_status,
                    'revenue_by_month': revenue_by_month,
                    'revenue_by_day': revenue_by_day,
                    'top_customers': top_customers,
                    'profit_distribution': profit_distribution
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_customer_analytics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get customer analytics and insights"""
        try:
            db = next(get_db())
            
            # Build base query for sales
            sales_query = db.query(Sale)
            
            # Apply date filter
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                sales_query = sales_query.filter(Sale.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                sales_query = sales_query.filter(Sale.created_at <= end_dt)
            
            # Get sales in period
            sales = sales_query.all()
            
            # Get all customers
            customers = db.query(Customer).filter(Customer.is_active == True).all()
            
            if not customers:
                return {
                    'success': True,
                    'analytics': {
                        'total_customers': 0,
                        'active_customers': 0,
                        'new_customers': 0,
                        'customer_retention': 0,
                        'average_customer_value': 0,
                        'customer_segments': {},
                        'acquisition_by_month': {},
                        'top_performing_customers': []
                    }
                }
            
            # Basic customer statistics
            total_customers = len(customers)
            active_customers = len([c for c in customers if c.sales])
            new_customers = len([c for c in customers if c.created_at and (now - c.created_at).days <= 30])
            
            # Customer retention (customers with multiple sales)
            customers_with_sales = [c for c in customers if c.sales]
            repeat_customers = len([c for c in customers_with_sales if len(c.sales) > 1])
            customer_retention = (repeat_customers / len(customers_with_sales)) * 100 if customers_with_sales else 0
            
            # Average customer value
            total_customer_revenue = sum(sale.profit_amount for sale in sales)
            average_customer_value = total_customer_revenue / total_customers if total_customers > 0 else 0
            
            # Customer segments by revenue
            customer_segments = {
                'High Value (>1M)': 0,
                'Medium Value (500K-1M)': 0,
                'Low Value (<500K)': 0,
                'No Sales': 0
            }
            
            for customer in customers:
                customer_revenue = sum(sale.profit_amount for sale in customer.sales)
                if customer_revenue > 1000000:
                    customer_segments['High Value (>1M)'] += 1
                elif customer_revenue > 500000:
                    customer_segments['Medium Value (500K-1M)'] += 1
                elif customer_revenue > 0:
                    customer_segments['Low Value (<500K)'] += 1
                else:
                    customer_segments['No Sales'] += 1
            
            # Customer acquisition by month
            acquisition_by_month = {}
            for customer in customers:
                if customer.created_at:
                    month_key = customer.created_at.strftime('%Y-%m')
                    acquisition_by_month[month_key] = acquisition_by_month.get(month_key, 0) + 1
            
            # Top performing customers
            customer_performance = []
            for customer in customers:
                total_revenue = sum(sale.profit_amount for sale in customer.sales)
                sales_count = len(customer.sales)
                if total_revenue > 0:
                    customer_performance.append({
                        'id': customer.id,
                        'name': customer.name,
                        'total_revenue': float(total_revenue),
                        'sales_count': sales_count,
                        'average_sale_value': float(total_revenue / sales_count) if sales_count > 0 else 0,
                        'last_sale_date': max(sale.created_at for sale in customer.sales).isoformat() if customer.sales else None
                    })
            
            # Sort by revenue
            top_performing_customers = sorted(
                customer_performance,
                key=lambda x: x['total_revenue'],
                reverse=True
            )[:10]
            
            return {
                'success': True,
                'analytics': {
                    'total_customers': total_customers,
                    'active_customers': active_customers,
                    'new_customers': new_customers,
                    'customer_retention': float(customer_retention),
                    'average_customer_value': float(average_customer_value),
                    'customer_segments': customer_segments,
                    'acquisition_by_month': acquisition_by_month,
                    'top_performing_customers': top_performing_customers
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def get_warehouse_analytics(self) -> Dict[str, Any]:
        """Get warehouse analytics"""
        try:
            db = next(get_db())
            
            # Get warehouse bills
            warehouse_bills = db.query(Bill).filter(
                Bill.status == BillStatus.IN_WAREHOUSE
            ).all()
            
            if not warehouse_bills:
                return {
                    'success': True,
                    'analytics': {
                        'total_bills': 0,
                        'total_value': 0,
                        'average_bill_value': 0,
                        'bills_by_amount_range': {},
                        'bills_by_customer': {},
                        'recent_additions': 0,
                        'warehouse_efficiency': 0
                    }
                }
            
            # Basic statistics
            total_bills = len(warehouse_bills)
            total_value = sum(bill.amount for bill in warehouse_bills)
            average_bill_value = total_value / total_bills if total_bills > 0 else 0
            
            # Bills by amount range
            bills_by_amount_range = {
                '0-100k': 0,
                '100k-500k': 0,
                '500k-1M': 0,
                '1M-5M': 0,
                '5M+': 0
            }
            
            for bill in warehouse_bills:
                amount = float(bill.amount)
                if amount <= 100000:
                    bills_by_amount_range['0-100k'] += 1
                elif amount <= 500000:
                    bills_by_amount_range['100k-500k'] += 1
                elif amount <= 1000000:
                    bills_by_amount_range['500k-1M'] += 1
                elif amount <= 5000000:
                    bills_by_amount_range['1M-5M'] += 1
                else:
                    bills_by_amount_range['5M+'] += 1
            
            # Bills by customer
            bills_by_customer = {}
            for bill in warehouse_bills:
                customer_name = bill.customer_name or 'Unknown'
                bills_by_customer[customer_name] = bills_by_customer.get(customer_name, 0) + 1
            
            # Recent additions (last 7 days)
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            recent_additions = len([b for b in warehouse_bills if b.added_to_warehouse_at and b.added_to_warehouse_at >= week_ago])
            
            # Warehouse efficiency (bills sold vs total added)
            total_bills_added = db.query(Bill).count()
            total_bills_sold = db.query(Bill).filter(Bill.status.in_([
                BillStatus.PENDING_PAYMENT, 
                BillStatus.PAID, 
                BillStatus.COMPLETED
            ])).count()
            warehouse_efficiency = (total_bills_sold / total_bills_added) * 100 if total_bills_added > 0 else 0
            
            return {
                'success': True,
                'analytics': {
                    'total_bills': total_bills,
                    'total_value': float(total_value),
                    'average_bill_value': float(average_bill_value),
                    'bills_by_amount_range': bills_by_amount_range,
                    'bills_by_customer': bills_by_customer,
                    'recent_additions': recent_additions,
                    'warehouse_efficiency': float(warehouse_efficiency)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            db.close()
    
    def export_comprehensive_report(self, format: str = 'json', start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Export comprehensive report with all analytics"""
        try:
            # Get all analytics
            dashboard_summary = self.get_dashboard_summary()
            sales_analytics = self.get_sales_analytics(start_date, end_date)
            customer_analytics = self.get_customer_analytics(start_date, end_date)
            warehouse_analytics = self.get_warehouse_analytics()
            
            # Check if all analytics were successful
            if not all([
                dashboard_summary['success'],
                sales_analytics['success'],
                customer_analytics['success'],
                warehouse_analytics['success']
            ]):
                return {
                    'success': False,
                    'error': 'Failed to generate some analytics'
                }
            
            # Combine all analytics
            now = datetime.utcnow()
            comprehensive_report = {
                'report_generated_at': now.isoformat(),
                'date_range': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'dashboard_summary': dashboard_summary['summary'],
                'sales_analytics': sales_analytics['analytics'],
                'customer_analytics': customer_analytics['analytics'],
                'warehouse_analytics': warehouse_analytics['analytics']
            }
            
            if format == 'json':
                return {
                    'success': True,
                    'report': comprehensive_report,
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

# Create global instance
reports_service = ReportsService()
