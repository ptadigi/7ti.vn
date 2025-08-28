#!/usr/bin/env python3
"""
Database Setup Script for FPT Bill Manager
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def setup_database():
    """Setup database tables and initial data"""
    print("🗄️ Setting up FPT Bill Manager Database...")
    
    try:
        # Database connection string
        DATABASE_URL = "postgresql://fpt_user:fpt_password_2024@localhost:5432/fpt_bill_manager"
        
        # Create engine
        engine = create_engine(DATABASE_URL, echo=True)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()
            print(f"  ✅ Connected to PostgreSQL: {version[0]}")
        
        # Import models and create tables
        from backend.models.user import User
        from backend.models.customer import Customer
        from backend.models.bill import Bill
        from backend.models.sale import Sale
        from backend.models.proxy import Proxy
        
        print("  📋 Creating database tables...")
        
        # Create tables manually in correct order (no foreign key dependencies first)
        User.__table__.create(engine, checkfirst=True)
        Proxy.__table__.create(engine, checkfirst=True)
        Customer.__table__.create(engine, checkfirst=True)
        Sale.__table__.create(engine, checkfirst=True)
        Bill.__table__.create(engine, checkfirst=True)
        
        print("  ✅ All tables created successfully")
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Create admin user
        print("  👤 Creating admin user...")
        from backend.services.auth_service import AuthService
        
        admin_data = {
            'username': 'admin',
            'email': 'admin@fpt.com',
            'password': 'admin123',
            'full_name': 'System Administrator',
            'role': 'admin'
        }
        
        auth_service = AuthService()
        admin_result = auth_service.create_user(admin_data)
        
        if admin_result['success']:
            print("  ✅ Admin user created successfully")
            print(f"    - Username: {admin_data['username']}")
            print(f"    - Password: {admin_data['password']}")
        else:
            print(f"  ⚠️ Admin user creation: {admin_result.get('error', 'Unknown error')}")
        
        # Create sample customer
        print("  👥 Creating sample customer...")
        from backend.services.customer_service import CustomerService
        
        customer_data = {
            'name': 'Sample Customer',
            'phone': '0123456789',
            'zalo': 'sample_zalo',
            'email': 'customer@example.com',
            'bank_account': '1234567890',
            'bank_name': 'Vietcombank',
            'address': 'Hanoi, Vietnam',
            'notes': 'Sample customer for testing'
        }
        
        customer_service = CustomerService()
        customer_result = customer_service.create_customer(customer_data)
        
        if customer_result['success']:
            print("  ✅ Sample customer created successfully")
        else:
            print(f"  ⚠️ Sample customer creation: {customer_result.get('error', 'Unknown error')}")
        
        # Create sample proxy
        print("  🔒 Creating sample proxy...")
        from backend.services.enhanced_proxy_service import EnhancedProxyService
        
        proxy_data = [{
            'type': 'HTTP',
            'host': '127.0.0.1',
            'port': 8080,
            'username': 'test_user',
            'password': 'test_pass',
            'country': 'Vietnam',
            'city': 'Hanoi',
            'isp': 'FPT Telecom',
            'note': 'Sample proxy for testing'
        }]
        
        proxy_service = EnhancedProxyService()
        proxy_result = proxy_service.bulk_add_proxies(proxy_data, 1)  # user_id = 1 (admin)
        
        if proxy_result['success']:
            print("  ✅ Sample proxy created successfully")
        else:
            print(f"  ⚠️ Sample proxy creation: {proxy_result.get('error', 'Unknown error')}")
        
        db.close()
        
        print("\n🎉 Database setup completed successfully!")
        print("\n📊 Database Summary:")
        print(f"  - Database: fpt_bill_manager")
        print(f"  - User: fpt_user")
        print(f"  - Admin credentials: admin/admin123")
        print(f"  - Sample data: Customer, Proxy")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Database setup error: {str(e)}")
        return False

def test_database_connection():
    """Test database connection"""
    print("\n🔗 Testing Database Connection...")
    
    try:
        DATABASE_URL = "postgresql://fpt_user:fpt_password_2024@localhost:5432/fpt_bill_manager"
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Test basic queries
            result = conn.execute(text("SELECT COUNT(*) FROM users;"))
            user_count = result.fetchone()[0]
            print(f"  ✅ Users table: {user_count} records")
            
            result = conn.execute(text("SELECT COUNT(*) FROM customers;"))
            customer_count = result.fetchone()[0]
            print(f"  ✅ Customers table: {customer_count} records")
            
            result = conn.execute(text("SELECT COUNT(*) FROM proxies;"))
            proxy_count = result.fetchone()[0]
            print(f"  ✅ Proxies table: {proxy_count} records")
            
            result = conn.execute(text("SELECT COUNT(*) FROM bills;"))
            bill_count = result.fetchone()[0]
            print(f"  ✅ Bills table: {bill_count} records")
            
            result = conn.execute(text("SELECT COUNT(*) FROM sales;"))
            sale_count = result.fetchone()[0]
            print(f"  ✅ Sales table: {sale_count} records")
        
        print("  ✅ All database tables accessible")
        return True
        
    except Exception as e:
        print(f"  ❌ Database connection test failed: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🚀 FPT Bill Manager - Database Setup")
    print("=" * 40)
    
    # Setup database
    setup_ok = setup_database()
    
    if setup_ok:
        # Test connection
        test_ok = test_database_connection()
        
        if test_ok:
            print("\n🎉 Database is ready for production!")
            print("\n💡 Next step: Test entire system")
        else:
            print("\n❌ Database connection test failed")
    else:
        print("\n❌ Database setup failed")

if __name__ == "__main__":
    main()
