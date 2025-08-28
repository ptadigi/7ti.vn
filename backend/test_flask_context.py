#!/usr/bin/env python3
"""
Test Customer model within Flask context
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_flask_context():
    """Test Customer model within Flask context"""
    try:
        print("🔍 Testing Customer model within Flask context...")
        
        # Import Flask app
        from app import app
        
        with app.app_context():
            print("✅ Flask app context created")
            
            # Import models within Flask context
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
                    print("✅ Model is working correctly in Flask context!")
                else:
                    print("❌ Model still has issues in Flask context")
            else:
                print("❌ No customers found in database")
                
            db.close()
            
    except Exception as e:
        print(f"❌ Error testing Flask context: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_flask_context()
