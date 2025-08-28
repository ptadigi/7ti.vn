#!/usr/bin/env python3
"""
Test Database Connection and Models
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_database_connection():
    """Test database connection"""
    print("🔌 Testing Database Connection...")
    
    try:
        from config.database import engine, init_db
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("  ✅ Database connection successful")
        
        # Test initialization
        print("  🗄️ Testing database initialization...")
        init_db()
        print("  ✅ Database tables created successfully")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Database error: {str(e)}")
        return False

def test_models_import():
    """Test models import"""
    print("\n📦 Testing Models Import...")
    
    try:
        from models import User, Customer, Bill, Sale, Proxy
        
        print("  ✅ All models imported successfully")
        print(f"    - User: {User}")
        print(f"    - Customer: {Customer}")
        print(f"    - Bill: {Bill}")
        print(f"    - Sale: {Sale}")
        print(f"    - Proxy: {Proxy}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Models import error: {str(e)}")
        return False

def test_model_creation():
    """Test model instance creation"""
    print("\n🏗️ Testing Model Creation...")
    
    try:
        from models import User, Customer, Bill, Sale, Proxy
        from datetime import datetime
        
        # Test User model
        print("  👤 Testing User model...")
        user = User(
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            role="user"
        )
        user.set_password("testpass123")
        print("    ✅ User model created successfully")
        
        # Test Customer model
        print("  👥 Testing Customer model...")
        customer = Customer(
            name="Test Customer",
            phone="0123456789",
            zalo="testzalo",
            email="customer@example.com",
            created_by=1
        )
        print("    ✅ Customer model created successfully")
        
        # Test Bill model
        print("  📋 Testing Bill model...")
        bill = Bill(
            contract_code="PB02020046419",
            customer_name="Test Customer",
            amount=150000,
            status="pending"
        )
        print("    ✅ Bill model created successfully")
        
        # Test Sale model
        print("  💰 Testing Sale model...")
        sale = Sale(
            customer_id=1,
            user_id=1,
            total_bill_amount=150000,
            profit_percentage=5.0,
            profit_amount=7500,
            customer_payment=142500,
            payment_method="bank_transfer"
        )
        print("    ✅ Sale model created successfully")
        
        # Test Proxy model
        print("  🌐 Testing Proxy model...")
        proxy = Proxy(
            type="http",
            host="127.0.0.1",
            port=8080,
            username="user",
            password="pass"
        )
        print("    ✅ Proxy model created successfully")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Model creation error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Database & Models")
    print("=" * 40)
    
    # Test database connection
    db_ok = test_database_connection()
    
    # Test models import
    models_ok = test_models_import()
    
    # Test model creation
    creation_ok = test_model_creation()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"  Models Import: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"  Model Creation: {'✅ PASS' if creation_ok else '❌ FAIL'}")
    
    if all([db_ok, models_ok, creation_ok]):
        print("\n🎉 All database tests passed!")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
