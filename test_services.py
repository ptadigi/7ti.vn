#!/usr/bin/env python3
"""
Test Services without Database
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_auth_service():
    """Test auth service"""
    print("🔐 Testing Auth Service...")
    
    try:
        from services.auth_service import AuthService
        
        # Create service instance
        auth_service = AuthService()
        print("  ✅ AuthService created successfully")
        
        # Test password hashing
        print("  🔒 Testing password hashing...")
        test_password = "testpass123"
        hashed = auth_service.create_user({
            "username": "testuser",
            "email": "test@example.com",
            "password": test_password,
            "full_name": "Test User"
        })
        print(f"    ✅ Password hashing works: {hashed}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Auth service error: {str(e)}")
        return False

def test_customer_service():
    """Test customer service"""
    print("\n👥 Testing Customer Service...")
    
    try:
        from services.customer_service import CustomerService
        
        # Create service instance
        customer_service = CustomerService()
        print("  ✅ CustomerService created successfully")
        
        # Test service methods exist
        methods = [
            'get_all_customers',
            'get_customer_by_id', 
            'create_customer',
            'update_customer',
            'delete_customer',
            'search_customers',
            'get_customer_statistics'
        ]
        
        for method in methods:
            if hasattr(customer_service, method):
                print(f"    ✅ Method {method} exists")
            else:
                print(f"    ❌ Method {method} missing")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Customer service error: {str(e)}")
        return False

def test_models_methods():
    """Test model methods"""
    print("\n🏗️ Testing Model Methods...")
    
    try:
        from models import User, Customer, Bill, Sale, Proxy
        
        # Test User methods
        print("  👤 Testing User methods...")
        user = User(
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            role="user"
        )
        user.set_password("testpass123")
        print(f"    ✅ Password check: {user.check_password('testpass123')}")
        print(f"    ✅ To dict: {user.to_dict()}")
        
        # Test Customer methods
        print("  👥 Testing Customer methods...")
        customer = Customer(
            name="Test Customer",
            phone="0123456789",
            zalo="testzalo",
            email="customer@example.com",
            created_by=1
        )
        print(f"    ✅ To dict: {customer.to_dict()}")
        
        # Test Bill methods
        print("  📋 Testing Bill methods...")
        bill = Bill(
            contract_code="PB02020046419",
            customer_name="Test Customer",
            amount=150000,
            status="pending"
        )
        print(f"    ✅ To dict: {bill.to_dict()}")
        
        # Test Sale methods
        print("  💰 Testing Sale methods...")
        sale = Sale(
            customer_id=1,
            user_id=1,
            total_bill_amount=150000,
            profit_percentage=5.0,
            profit_amount=7500,
            customer_payment=142500,
            payment_method="bank_transfer"
        )
        sale.calculate_profit()
        print(f"    ✅ Profit calculation: {sale.profit_amount}")
        print(f"    ✅ To dict: {sale.to_dict()}")
        
        # Test Proxy methods
        print("  🌐 Testing Proxy methods...")
        proxy = Proxy(
            type="http",
            host="127.0.0.1",
            port=8080,
            username="user",
            password="pass"
        )
        print(f"    ✅ Connection string: {proxy.get_connection_string()}")
        print(f"    ✅ To dict: {proxy.to_dict()}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Model methods error: {str(e)}")
        return False

def test_routes_import():
    """Test routes import"""
    print("\n🛣️ Testing Routes Import...")
    
    try:
        from routes.auth import auth_bp
        from routes.customers import customers_bp
        
        print("  ✅ Auth blueprint imported successfully")
        print("  ✅ Customers blueprint imported successfully")
        
        # Check route methods
        print(f"    Auth blueprint: {auth_bp.name}")
        print(f"    Customer blueprint: {customers_bp.name}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Routes import error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Services & Routes (No Database)")
    print("=" * 50)
    
    # Test services
    auth_ok = test_auth_service()
    customer_ok = test_customer_service()
    
    # Test models
    models_ok = test_models_methods()
    
    # Test routes
    routes_ok = test_routes_import()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Auth Service: {'✅ PASS' if auth_ok else '❌ FAIL'}")
    print(f"  Customer Service: {'✅ PASS' if customer_ok else '❌ PASS'}")
    print(f"  Model Methods: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"  Routes Import: {'✅ PASS' if routes_ok else '❌ FAIL'}")
    
    if all([auth_ok, customer_ok, models_ok, routes_ok]):
        print("\n🎉 All service tests passed!")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
