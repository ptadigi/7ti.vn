#!/usr/bin/env python3
"""
Migration script to create customer_transactions table
"""

import psycopg2
import os
from dotenv import load_dotenv

# Use correct database connection
DATABASE_URL = 'postgresql://fpt_user:password@localhost:5432/fpt_bill_manager'

print(f"🔗 Connecting to database: {DATABASE_URL}")

def create_customer_transactions_table():
    """Create customer_transactions table"""
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🔄 Creating customer_transactions table...")
        
        # Create enum types
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE transaction_type_enum AS ENUM (
                    'PAYMENT_RECEIVED',
                    'PAYMENT_SENT', 
                    'REFUND'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)
        
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE transaction_status_enum AS ENUM (
                    'PENDING',
                    'COMPLETED',
                    'FAILED',
                    'CANCELLED'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)
        
        # Create customer_transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_transactions (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
                transaction_type transaction_type_enum NOT NULL,
                amount NUMERIC(15,2) NOT NULL,
                payment_method VARCHAR(50),
                bank_name VARCHAR(100),
                bank_account VARCHAR(50),
                reference_number VARCHAR(100),
                status transaction_status_enum DEFAULT 'PENDING',
                notes TEXT,
                admin_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                processed_at TIMESTAMP WITH TIME ZONE
            );
        """)
        
        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_customer_transactions_sale_id 
            ON customer_transactions(sale_id);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_customer_transactions_type 
            ON customer_transactions(transaction_type);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_customer_transactions_status 
            ON customer_transactions(status);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_customer_transactions_created_at 
            ON customer_transactions(created_at);
        """)
        
        # Commit changes
        conn.commit()
        print("✅ customer_transactions table created successfully!")
        
        # Verify table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'customer_transactions' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\n📋 Table structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_customer_transactions_table()
