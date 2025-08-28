#!/usr/bin/env python3
"""
Migration script to add customer_id column to bills table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db
from sqlalchemy import text

def migrate_bills_add_customer_id():
    """Add customer_id column to bills table"""
    db = None
    try:
        db = next(get_db())
        
        print("🔄 Starting migration: Add customer_id to bills table...")
        
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'bills' AND column_name = 'customer_id'
        """)
        
        result = db.execute(check_query)
        if result.fetchone():
            print("✅ customer_id column already exists in bills table")
            return
        
        # Add customer_id column
        add_column_query = text("""
            ALTER TABLE bills 
            ADD COLUMN customer_id INTEGER REFERENCES customers(id)
        """)
        
        db.execute(add_column_query)
        db.commit()
        
        print("✅ Successfully added customer_id column to bills table")
        
        # Update existing bills to link with customers based on customer_name
        print("🔄 Linking existing bills with customers based on customer_name...")
        
        update_query = text("""
            UPDATE bills 
            SET customer_id = customers.id 
            FROM customers 
            WHERE bills.customer_name = customers.name 
            AND bills.customer_id IS NULL
        """)
        
        result = db.execute(update_query)
        db.commit()
        
        print(f"✅ Linked {result.rowcount} bills with customers")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if db:
            db.rollback()
        raise
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    migrate_bills_add_customer_id()
    print("🎉 Migration completed!")
