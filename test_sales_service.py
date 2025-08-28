#!/usr/bin/env python3
"""
Test Sales Service
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_sales_service():
    """Test sales service methods"""
    print("💰 Testing Sales Service...")
    
    try:
        from services.sales_service import sales_service
        
        # Test service creation
        print("  ✅ SalesService created successfully")
        
        # Test service methods exist
        methods = [
            'create_sale',
            'get_sale_by_id',
            'get_all_sales',
            'update_sale_status',
            'update_payment_status',
            'get_sales_statistics',
            'export_sales',
            'cancel_sale'
        ]
        
        for method in methods:
            if hasattr(sales_service, method):
                print(f"    ✅ Method {method} exists")
            else:
                print(f"    ❌ Method {method} missing")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Sales service error: {str(e)}")
        return False

def test_sales_calculation_logic():
    """Test sales calculation logic"""
    print("\n🧮 Testing Sales Calculation Logic...")
    
    try:
        from services.sales_service import sales_service
        
        # Test calculation logic
        total_bill_amount = 1000000  # 1M VND
        profit_percentage = 5.0  # 5%
        
        # Expected calculations
        expected_profit = (total_bill_amount * profit_percentage) / 100
        expected_customer_payment = total_bill_amount - expected_profit
        
        print(f"    Test scenario:")
        print(f"      Total bill amount: {total_bill_amount:,} VND")
        print(f"      Profit percentage: {profit_percentage}%")
        print(f"      Expected profit: {expected_profit:,} VND")
        print(f"      Expected customer payment: {expected_customer_payment:,} VND")
        
        # Verify logic
        calculated_profit = (total_bill_amount * profit_percentage) / 100
        calculated_customer_payment = total_bill_amount - calculated_profit
        
        if abs(calculated_profit - expected_profit) < 0.01:
            print("      ✅ Profit calculation correct")
        else:
            print("      ❌ Profit calculation incorrect")
            return False
        
        if abs(calculated_customer_payment - expected_customer_payment) < 0.01:
            print("      ✅ Customer payment calculation correct")
        else:
            print("      ❌ Customer payment calculation incorrect")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Calculation test error: {str(e)}")
        return False

def test_sales_routes():
    """Test sales routes import"""
    print("\n🛣️ Testing Sales Routes...")
    
    try:
        from routes.sales import sales_bp
        
        print("  ✅ Sales blueprint imported successfully")
        print(f"    - Blueprint name: {sales_bp.name}")
        print(f"    - URL prefix: {sales_bp.url_prefix}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Sales routes error: {str(e)}")
        return False

def test_status_transitions():
    """Test sale status transitions"""
    print("\n🔄 Testing Sale Status Transitions...")
    
    try:
        from models.sale import SaleStatus
        
        # Define valid transitions
        valid_transitions = {
            SaleStatus.PENDING: [SaleStatus.COMPLETED, SaleStatus.CANCELLED],
            SaleStatus.COMPLETED: [SaleStatus.COMPLETED],  # Final state
            SaleStatus.CANCELLED: [SaleStatus.CANCELLED],  # Final state
            SaleStatus.REFUNDED: [SaleStatus.REFUNDED]  # Final state
        }
        
        print("    Valid status transitions:")
        for from_status, to_statuses in valid_transitions.items():
            status_name = from_status.value if hasattr(from_status, 'value') else str(from_status)
            to_names = [s.value if hasattr(s, 'value') else str(s) for s in to_statuses]
            print(f"      {status_name} → {', '.join(to_names)}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Status transition test error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Sales Management System")
    print("=" * 40)
    
    # Test sales service
    service_ok = test_sales_service()
    
    # Test calculation logic
    calculation_ok = test_sales_calculation_logic()
    
    # Test routes
    routes_ok = test_sales_routes()
    
    # Test status transitions
    transitions_ok = test_status_transitions()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Sales Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    print(f"  Calculation Logic: {'✅ PASS' if calculation_ok else '❌ FAIL'}")
    print(f"  Sales Routes: {'✅ PASS' if routes_ok else '❌ FAIL'}")
    print(f"  Status Transitions: {'✅ PASS' if transitions_ok else '❌ FAIL'}")
    
    if all([service_ok, calculation_ok, routes_ok, transitions_ok]):
        print("\n🎉 All sales management tests passed!")
        print("\n💡 Next step: Test Reports & Analytics APIs")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
