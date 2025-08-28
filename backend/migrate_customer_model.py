#!/usr/bin/env python3
"""
Migration script to update customers table with new fields
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config.config import get_config
from config.database import Base
from models.customer import Customer, CustomerType, CustomerStatus

def migrate_customer_model():
    """Migrate customers table to add new fields"""
    try:
        # Create engine using database config
        from config.database import DATABASE_URL
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("🔄 Starting customer model migration...")
            
            # Check if new columns exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'customers' 
                AND column_name IN ('customer_type', 'company_name', 'tax_code', 'status')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add new columns if they don't exist
            if 'customer_type' not in existing_columns:
                print("➕ Adding customer_type column...")
                
                # Create enum type first
                try:
                    conn.execute(text("""
                        CREATE TYPE customer_type_enum AS ENUM ('INDIVIDUAL', 'COMPANY')
                    """))
                except Exception:
                    # Type already exists, continue
                    pass
                
                # Add column without default first
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN customer_type VARCHAR(20)
                """))
                
                # Set default values
                conn.execute(text("""
                    UPDATE customers 
                    SET customer_type = 'INDIVIDUAL'
                """))
                
                # Now change type to enum
                conn.execute(text("""
                    ALTER TABLE customers 
                    ALTER COLUMN customer_type TYPE customer_type_enum 
                    USING customer_type::customer_type_enum
                """))
                
                # Set NOT NULL and default
                conn.execute(text("""
                    ALTER TABLE customers 
                    ALTER COLUMN customer_type SET NOT NULL,
                    ALTER COLUMN customer_type SET DEFAULT 'INDIVIDUAL'
                """))
            
            if 'company_name' not in existing_columns:
                print("➕ Adding company_name column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN company_name VARCHAR(200)
                """))
            
            if 'tax_code' not in existing_columns:
                print("➕ Adding tax_code column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN tax_code VARCHAR(50)
                """))
            
            if 'status' not in existing_columns:
                print("➕ Adding status column...")
                
                # Create enum type first
                try:
                    conn.execute(text("""
                        CREATE TYPE customer_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLIST')
                    """))
                except Exception:
                    # Type already exists, continue
                    pass
                
                # Add column without default first
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN status VARCHAR(20)
                """))
                
                # Set default values based on is_active
                conn.execute(text("""
                    UPDATE customers 
                    SET status = CASE 
                        WHEN is_active = true THEN 'ACTIVE'
                        ELSE 'INACTIVE'
                    END
                """))
                
                # Now change type to enum
                conn.execute(text("""
                    ALTER TABLE customers 
                    ALTER COLUMN status TYPE customer_status_enum 
                    USING status::customer_status_enum
                """))
                
                # Set NOT NULL and default
                conn.execute(text("""
                    ALTER TABLE customers 
                    ALTER COLUMN status SET NOT NULL,
                    ALTER COLUMN status SET DEFAULT 'ACTIVE'
                """))
            
            # Update existing data
            print("🔄 Updating existing customer data...")
            
            # Set customer_type based on existing data (default to individual)
            conn.execute(text("""
                UPDATE customers 
                SET customer_type = 'individual' 
                WHERE customer_type IS NULL
            """))
            
            # Set status based on is_active field
            conn.execute(text("""
                UPDATE customers 
                SET status = CASE 
                    WHEN is_active = true THEN 'active'::customer_status_enum
                    ELSE 'inactive'::customer_status_enum
                END
                WHERE status IS NULL
            """))
            
            # Commit changes
            conn.commit()
            
            print("✅ Customer model migration completed successfully!")
            
            # Verify migration
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total_customers,
                    COUNT(CASE WHEN customer_type IS NOT NULL THEN 1 END) as with_customer_type,
                    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status
                FROM customers
            """))
            
            stats = result.fetchone()
            print(f"📊 Migration verification:")
            print(f"   Total customers: {stats[0]}")
            print(f"   With customer_type: {stats[1]}")
            print(f"   With status: {stats[2]}")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    migrate_customer_model()
