#!/usr/bin/env python3
"""
Check enum types in database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from config.database import DATABASE_URL

def check_enums():
    """Check enum types in database"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("🔍 Checking enum types...")
            
            # Check customer_type_enum
            try:
                result = conn.execute(text("SELECT unnest(enum_range(NULL::customer_type_enum))"))
                print("📋 Customer type enum values:")
                for row in result:
                    print(f"   - {row[0]}")
            except Exception as e:
                print(f"❌ Error checking customer_type_enum: {e}")
            
            # Check customer_status_enum
            try:
                result = conn.execute(text("SELECT unnest(enum_range(NULL::customer_status_enum))"))
                print("📋 Customer status enum values:")
                for row in result:
                    print(f"   - {row[0]}")
            except Exception as e:
                print(f"❌ Error checking customer_status_enum: {e}")
            
            # Check current customer data
            try:
                result = conn.execute(text("SELECT customer_type, status, COUNT(*) FROM customers GROUP BY customer_type, status"))
                print("📊 Current customer data:")
                for row in result:
                    print(f"   {row[0]} - {row[1]}: {row[2]}")
            except Exception as e:
                print(f"❌ Error checking customer data: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    check_enums()
