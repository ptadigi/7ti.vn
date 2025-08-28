#!/usr/bin/env python3
"""
Fix existing customer data to match new enum values
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from config.database import DATABASE_URL

def fix_customer_data():
    """Fix existing customer data to match new enum values"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("🔄 Fixing customer data...")
            
            # Update customer_type values
            print("📝 Updating customer_type values...")
            conn.execute(text("""
                UPDATE customers 
                SET customer_type = 'INDIVIDUAL' 
                WHERE customer_type = 'individual'
            """))
            
            conn.execute(text("""
                UPDATE customers 
                SET customer_type = 'COMPANY' 
                WHERE customer_type = 'company'
            """))
            
            # Update status values
            print("📝 Updating status values...")
            conn.execute(text("""
                UPDATE customers 
                SET status = 'ACTIVE' 
                WHERE status = 'active'
            """))
            
            conn.execute(text("""
                UPDATE customers 
                SET status = 'INACTIVE' 
                WHERE status = 'inactive'
            """))
            
            conn.execute(text("""
                UPDATE customers 
                SET status = 'BLACKLIST' 
                WHERE status = 'blacklist'
            """))
            
            # Commit changes
            conn.commit()
            
            print("✅ Customer data fixed successfully!")
            
            # Verify the fix
            result = conn.execute(text("""
                SELECT 
                    customer_type,
                    status,
                    COUNT(*) as count
                FROM customers 
                GROUP BY customer_type, status
            """))
            
            print("📊 Data verification:")
            for row in result:
                print(f"   {row[0]} - {row[1]}: {row[2]}")
            
    except Exception as e:
        print(f"❌ Error fixing customer data: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    fix_customer_data()
