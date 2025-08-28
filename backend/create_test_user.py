#!/usr/bin/env python3
"""
Create a test user for development
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import get_db
from models.user import User
import bcrypt

def create_test_user():
    """Create a test user with simple password"""
    try:
        db = next(get_db())
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == 'testuser2').first()
        if existing_user:
            print("User 'testuser2' already exists")
            return
        
        # Create password hash
        password = "password123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = User(
            username='testuser2',
            email='test2@example.com',
            password_hash=password_hash.decode('utf-8'),
            role='user'
        )
        
        db.add(user)
        db.commit()
        
        print(f"✅ Created user 'testuser2' with password '{password}'")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
