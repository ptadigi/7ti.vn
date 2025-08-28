#!/usr/bin/env python3
"""
Test Customer model directly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_customer_model():
    """Test Customer model directly"""
    try:
        print("🔍 Testing Customer model directly...")
        
        # Import after clearing cache
        from models.customer import Customer, CustomerType, CustomerStatus
        from config.database import get_db
        
        print(f"✅ CustomerType.INDIVIDUAL = {CustomerType.INDIVIDUAL}")
        print(f"✅ CustomerStatus.ACTIVE = {CustomerStatus.ACTIVE}")
        
        # Test database connection
        db = next(get_db())
        customer = db.query(Customer).first()
        
        if customer:
            print(f"✅ Found customer: {customer.name}")
            print(f"   Raw customer_type: {customer.customer_type}")
            print(f"   Raw status: {customer.status}")
            
            # Test to_dict method
            data = customer.to_dict()
            print(f"\n📊 to_dict() output:")
            print(f"   customerType: {data.get('customerType')}")
            print(f"   status: {data.get('status')}")
            print(f"   totalBills: {data.get('totalBills')}")
            print(f"   totalAmount: {data.get('totalAmount')}")
            
            # Check if data is correct
            if data.get('customerType') == 'INDIVIDUAL' and data.get('status') == 'ACTIVE':
                print("✅ Model is working correctly!")
            else:
                print("❌ Model still has issues")
        else:
            print("❌ No customers found in database")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Error testing model: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_customer_model()
