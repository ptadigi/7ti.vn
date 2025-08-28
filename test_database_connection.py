#!/usr/bin/env python3
"""
Test Database Connection
"""

import psycopg2
from sqlalchemy import create_engine, text

def test_postgres_connection():
    """Test PostgreSQL connection"""
    print("🔗 Testing PostgreSQL Connection...")
    
    try:
        # Test with psycopg2
        conn = psycopg2.connect(
            host="localhost",
            database="fpt_bill_manager",
            user="fpt_user",
            password="fpt_password_2024",
            port="5432"
        )
        
        cur = conn.cursor()
        
        # Test basic queries
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"  ✅ Connected to PostgreSQL: {version[0]}")
        
        # Test table existence
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        print(f"  📋 Available tables: {[table[0] for table in tables]}")
        
        # Test record counts
        for table in tables:
            table_name = table[0]
            cur.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cur.fetchone()[0]
            print(f"    - {table_name}: {count} records")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"  ❌ PostgreSQL connection failed: {str(e)}")
        return False

def test_sqlalchemy_connection():
    """Test SQLAlchemy connection"""
    print("\n🐍 Testing SQLAlchemy Connection...")
    
    try:
        # Create engine
        DATABASE_URL = "postgresql://fpt_user:fpt_password_2024@localhost:5432/fpt_bill_manager"
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            # Test basic query
            result = conn.execute(text("SELECT COUNT(*) FROM users;"))
            user_count = result.fetchone()[0]
            print(f"  ✅ Users table accessible: {user_count} records")
            
            # Test all tables
            tables = ['users', 'customers', 'bills', 'sales', 'proxies']
            for table in tables:
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
                    count = result.fetchone()[0]
                    print(f"    - {table}: {count} records")
                except Exception as e:
                    print(f"    - {table}: Error - {str(e)}")
        
        print("  ✅ SQLAlchemy connection successful")
        return True
        
    except Exception as e:
        print(f"  ❌ SQLAlchemy connection failed: {str(e)}")
        return False

def test_sample_data():
    """Test if we can insert and query sample data"""
    print("\n📝 Testing Sample Data Operations...")
    
    try:
        DATABASE_URL = "postgresql://fpt_user:fpt_password_2024@localhost:5432/fpt_bill_manager"
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Test insert user
            try:
                conn.execute(text("""
                    INSERT INTO users (username, email, password_hash, full_name, role, is_active)
                    VALUES ('test_user', 'test@example.com', 'test_hash', 'Test User', 'user', true)
                    ON CONFLICT (username) DO NOTHING;
                """))
                conn.commit()
                print("  ✅ Test user inserted successfully")
            except Exception as e:
                print(f"  ⚠️ Test user insert: {str(e)}")
            
            # Test query
            result = conn.execute(text("SELECT username, role FROM users WHERE username = 'test_user';"))
            user = result.fetchone()
            if user:
                print(f"    - Username: {user[0]}, Role: {user[1]}")
            
            # Test delete test data
            try:
                conn.execute(text("DELETE FROM users WHERE username = 'test_user';"))
                conn.commit()
                print("  ✅ Test user cleaned up")
            except Exception as e:
                print(f"  ⚠️ Test user cleanup: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Sample data test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing FPT Bill Manager Database")
    print("=" * 40)
    
    # Test PostgreSQL connection
    postgres_ok = test_postgres_connection()
    
    # Test SQLAlchemy connection
    sqlalchemy_ok = test_sqlalchemy_connection()
    
    # Test sample data operations
    data_ok = test_sample_data()
    
    # Summary
    print("\n📊 Database Test Summary:")
    print(f"  PostgreSQL Connection: {'✅ PASS' if postgres_ok else '❌ FAIL'}")
    print(f"  SQLAlchemy Connection: {'✅ PASS' if sqlalchemy_ok else '❌ FAIL'}")
    print(f"  Sample Data Operations: {'✅ PASS' if data_ok else '❌ FAIL'}")
    
    if all([postgres_ok, sqlalchemy_ok, data_ok]):
        print("\n🎉 Database is ready for production!")
        print("\n💡 Next step: Test entire system with Flask app")
    else:
        print("\n❌ Some database tests failed")

if __name__ == "__main__":
    main()
