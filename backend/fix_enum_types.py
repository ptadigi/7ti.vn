#!/usr/bin/env python3
"""
Fix enum types by dropping and recreating them
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from config.database import DATABASE_URL

def fix_enum_types():
    """Fix enum types by dropping and recreating them"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("🔄 Fixing enum types...")
            
            # First, drop the enum columns and recreate them as VARCHAR
            print("📝 Dropping enum columns...")
            conn.execute(text("ALTER TABLE customers DROP COLUMN IF EXISTS customer_type"))
            conn.execute(text("ALTER TABLE customers DROP COLUMN IF EXISTS status"))
            
            # Drop the old enum types
            print("🗑️ Dropping old enum types...")
            try:
                conn.execute(text("DROP TYPE IF EXISTS customer_type_enum"))
                conn.execute(text("DROP TYPE IF EXISTS customer_status_enum"))
            except Exception as e:
                print(f"Warning: {e}")
            
            # Create new enum types with correct values
            print("➕ Creating new enum types...")
            conn.execute(text("""
                CREATE TYPE customer_type_enum AS ENUM ('INDIVIDUAL', 'COMPANY')
            """))
            
            conn.execute(text("""
                CREATE TYPE customer_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLIST')
            """))
            
            # Add columns back with new enum types
            print("📝 Adding columns back...")
            conn.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN customer_type customer_type_enum DEFAULT 'INDIVIDUAL'
            """))
            
            conn.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN status customer_status_enum DEFAULT 'ACTIVE'
            """))
            
            # Set values based on is_active
            print("🔄 Setting default values...")
            conn.execute(text("""
                UPDATE customers 
                SET customer_type = 'INDIVIDUAL'::customer_type_enum,
                    status = CASE 
                        WHEN is_active = true THEN 'ACTIVE'::customer_status_enum
                        ELSE 'INACTIVE'::customer_status_enum
                    END
            """))
            
            # Commit changes
            conn.commit()
            
            print("✅ Enum types fixed successfully!")
            
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
        print(f"❌ Error fixing enum types: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    fix_enum_types()
