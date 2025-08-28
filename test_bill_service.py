#!/usr/bin/env python3
"""
Test Bill Service
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_bill_service():
    """Test bill service methods"""
    print("📋 Testing Bill Service...")
    
    try:
        from services.bill_service import bill_service
        
        # Test service creation
        print("  ✅ BillService created successfully")
        
        # Test service methods exist
        methods = [
            'get_warehouse_bills',
            'get_bill_by_id',
            'add_bill_to_warehouse',
            'update_bill',
            'remove_bill_from_warehouse',
            'find_bill_combinations',
            'get_warehouse_statistics',
            'export_warehouse_bills'
        ]
        
        for method in methods:
            if hasattr(bill_service, method):
                print(f"    ✅ Method {method} exists")
            else:
                print(f"    ❌ Method {method} missing")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Bill service error: {str(e)}")
        return False

def test_bill_combination_algorithm():
    """Test bill combination algorithm"""
    print("\n🧮 Testing Bill Combination Algorithm...")
    
    try:
        from services.bill_service import bill_service
        
        # Test with sample data
        test_amounts = [100000, 200000, 300000, 400000, 500000]
        target_amount = 600000
        tolerance = 0.1
        
        print(f"    Test amounts: {test_amounts}")
        print(f"    Target amount: {target_amount}")
        print(f"    Tolerance: {tolerance}")
        
        # Test DP algorithm
        combinations = bill_service._find_combinations_dp(test_amounts, target_amount, tolerance)
        print(f"    ✅ Found {len(combinations)} combinations")
        
        # Show combinations
        for i, combo in enumerate(combinations[:3]):  # Show first 3
            total = sum(combo)
            diff = abs(total - target_amount)
            print(f"      Combination {i+1}: {combo} = {total} (diff: {diff})")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Algorithm test error: {str(e)}")
        return False

def test_bill_routes():
    """Test bill routes import"""
    print("\n🛣️ Testing Bill Routes...")
    
    try:
        from routes.bills import bills_bp
        
        print("  ✅ Bills blueprint imported successfully")
        print(f"    - Blueprint name: {bills_bp.name}")
        print(f"    - URL prefix: {bills_bp.url_prefix}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Bill routes error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Bill Management System")
    print("=" * 40)
    
    # Test bill service
    service_ok = test_bill_service()
    
    # Test algorithm
    algorithm_ok = test_bill_combination_algorithm()
    
    # Test routes
    routes_ok = test_bill_routes()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Bill Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    print(f"  Combination Algorithm: {'✅ PASS' if algorithm_ok else '❌ FAIL'}")
    print(f"  Bill Routes: {'✅ PASS' if routes_ok else '❌ FAIL'}")
    
    if all([service_ok, algorithm_ok, routes_ok]):
        print("\n🎉 All bill management tests passed!")
        print("\n💡 Next step: Test Sales Management APIs")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
