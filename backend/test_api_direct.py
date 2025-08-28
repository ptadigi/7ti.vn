#!/usr/bin/env python3
"""
Test API endpoint directly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_api_direct():
    """Test API endpoint directly"""
    try:
        print("🔍 Testing API endpoint directly...")
        
        # Import customer service
        from services.customer_service import customer_service
        
        print("✅ Customer service imported successfully")
        
        # Test get_all_customers method
        result = customer_service.get_all_customers()
        
        if result.get('success'):
            customers = result.get('customers', [])
            print(f"✅ Found {len(customers)} customers")
            
            if customers:
                customer = customers[0]
                print(f"\n🔍 First customer data:")
                print(f"   ID: {customer.get('id')}")
                print(f"   Name: {customer.get('name')}")
                print(f"   Customer Type: {customer.get('customerType')}")
                print(f"   Status: {customer.get('status')}")
                print(f"   Total Bills: {customer.get('totalBills')}")
                print(f"   Total Amount: {customer.get('totalAmount')}")
                
                # Check if data is correct
                if customer.get('customerType') == 'INDIVIDUAL' and customer.get('status') == 'ACTIVE':
                    print("✅ API is working correctly!")
                else:
                    print("❌ API still has issues")
        else:
            print(f"❌ API call failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_direct()
