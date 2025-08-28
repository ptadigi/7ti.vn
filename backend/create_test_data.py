#!/usr/bin/env python3
"""Script để tạo test data cho bills và customers"""

from config.database import engine
from models.bill import Bill, BillStatus
from models.customer import Customer
from models.user import User
from sqlalchemy.orm import sessionmaker
import bcrypt

def main():
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Tạo test customers
        print("=== TẠO TEST CUSTOMERS ===")
        
        # Kiểm tra có user nào không
        user = db.query(User).first()
        if not user:
            print("❌ Không có user nào, tạo user admin trước...")
            hashed_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt())
            user = User(
                username='admin',
                email='admin@example.com',
                password_hash=hashed_password.decode('utf-8'),
                role='admin'
            )
            db.add(user)
            db.commit()
            print(f"✅ Đã tạo user admin với ID: {user.id}")
        
        # Tạo customers
        customer1 = Customer(
            name='Nguyễn Văn A',
            phone='0123456789',
            email='a@example.com',
            zalo='nguyenvana',
            bank_account='1234567890',
            bank_name='Vietcombank',
            address='Hà Nội',
            created_by=user.id
        )
        
        customer2 = Customer(
            name='Trần Thị B',
            phone='0987654321',
            email='b@example.com',
            zalo='tranthib',
            bank_account='0987654321',
            bank_name='BIDV',
            address='TP.HCM',
            created_by=user.id
        )
        
        customer3 = Customer(
            name='Lê Văn C',
            phone='0555666777',
            email='c@example.com',
            zalo='levanc',
            bank_account='1122334455',
            bank_name='Agribank',
            address='Đà Nẵng',
            created_by=user.id
        )
        
        db.add_all([customer1, customer2, customer3])
        db.commit()
        print(f"✅ Đã tạo 3 test customers")
        
        # Tạo test bills
        print("\n=== TẠO TEST BILLS ===")
        
        bill1 = Bill(
            contract_code='PB12345678',
            customer_name='Nguyễn Văn A',
            address='Hà Nội',
            amount=100000,
            period='08/2025',
            status=BillStatus.IN_WAREHOUSE
        )
        
        bill2 = Bill(
            contract_code='PB87654321',
            customer_name='Trần Thị B',
            address='TP.HCM',
            amount=150000,
            period='09/2025',
            status=BillStatus.IN_WAREHOUSE
        )
        
        bill3 = Bill(
            contract_code='PB11223344',
            customer_name='Lê Văn C',
            address='Đà Nẵng',
            amount=200000,
            period='10/2025',
            status=BillStatus.IN_WAREHOUSE
        )
        
        db.add_all([bill1, bill2, bill3])
        db.commit()
        print(f"✅ Đã tạo 3 test bills")
        
        # Kiểm tra kết quả
        print("\n=== KIỂM TRA KẾT QUẢ ===")
        customer_count = db.query(Customer).count()
        bill_count = db.query(Bill).count()
        user_count = db.query(User).count()
        
        print(f"📊 Database hiện tại:")
        print(f"   - Users: {user_count}")
        print(f"   - Customers: {customer_count}")
        print(f"   - Bills: {bill_count}")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
