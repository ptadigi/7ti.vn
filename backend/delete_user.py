#!/usr/bin/env python3
"""Script để xóa user cũ và tạo user mới"""

from config.database import engine
from models.user import User
from sqlalchemy.orm import sessionmaker
import bcrypt

def main():
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Xóa user cũ
        user = db.query(User).filter(User.username == 'admin').first()
        if user:
            db.delete(user)
            db.commit()
            print('✅ Đã xóa user admin cũ')
        else:
            print('ℹ️ Không tìm thấy user admin cũ')
        
        # Tạo user mới với field name đúng
        hashed_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt())
        new_user = User(
            username='admin',
            email='admin@example.com',
            password_hash=hashed_password.decode('utf-8'),
            role='admin'
        )
        
        db.add(new_user)
        db.commit()
        print(f'✅ Đã tạo user admin mới với ID: {new_user.id}')
        print(f'   Username: {new_user.username}')
        print(f'   Password: admin')
        print(f'   Role: {new_user.role}')
        
    except Exception as e:
        print(f'❌ Lỗi: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
