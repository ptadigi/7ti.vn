import pytest
from datetime import datetime
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.bill import Bill
from backend.models.sale import Sale
from backend.models.proxy import Proxy

class TestUserModel:
    def test_user_creation(self):
        """Test user model creation"""
        user = User(
            username='testuser',
            email='test@example.com',
            full_name='Test User',
            role='user'
        )
        user.set_password('password123')
        
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.full_name == 'Test User'
        assert user.role == 'user'
        assert user.is_active == True
        assert user.check_password('password123') == True
        assert user.check_password('wrongpassword') == False

    def test_user_to_dict(self):
        """Test user to_dict method"""
        user = User(
            username='testuser',
            email='test@example.com',
            full_name='Test User',
            role='user'
        )
        user.id = 1
        user.created_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        
        user_dict = user.to_dict()
        
        assert 'id' in user_dict
        assert 'username' in user_dict
        assert 'email' in user_dict
        assert 'full_name' in user_dict
        assert 'role' in user_dict
        assert 'is_active' in user_dict
        assert 'created_at' in user_dict
        assert 'updated_at' in user_dict

class TestCustomerModel:
    def test_customer_creation(self):
        """Test customer model creation"""
        customer = Customer(
            name='Test Customer',
            phone='0123456789',
            email='customer@example.com',
            address='Test Address',
            notes='Test notes'
        )
        
        assert customer.name == 'Test Customer'
        assert customer.phone == '0123456789'
        assert customer.email == 'customer@example.com'
        assert customer.address == 'Test Address'
        assert customer.notes == 'Test notes'
        assert customer.is_active == True

    def test_customer_to_dict(self):
        """Test customer to_dict method"""
        customer = Customer(
            name='Test Customer',
            phone='0123456789',
            email='customer@example.com',
            address='Test Address'
        )
        customer.id = '1'
        customer.created_at = datetime.utcnow()
        customer.updated_at = datetime.utcnow()
        
        customer_dict = customer.to_dict()
        
        assert 'id' in customer_dict
        assert 'name' in customer_dict
        assert 'phone' in customer_dict
        assert 'email' in customer_dict
        assert 'address' in customer_dict
        assert 'is_active' in customer_dict

class TestBillModel:
    def test_bill_creation(self):
        """Test bill model creation"""
        bill = Bill(
            contract_code='PB02020040261',
            customer_name='Test Customer',
            address='Test Address',
            amount=1500000,
            due_date=datetime.utcnow(),
            bill_date=datetime.utcnow(),
            meter_number='MN001',
            status='IN_WAREHOUSE'
        )
        
        assert bill.contract_code == 'PB02020040261'
        assert bill.customer_name == 'Test Customer'
        assert bill.address == 'Test Address'
        assert bill.amount == 1500000
        assert bill.meter_number == 'MN001'
        assert bill.status == 'IN_WAREHOUSE'

    def test_bill_to_dict(self):
        """Test bill to_dict method"""
        bill = Bill(
            contract_code='PB02020040261',
            customer_name='Test Customer',
            address='Test Address',
            amount=1500000,
            due_date=datetime.utcnow(),
            bill_date=datetime.utcnow(),
            meter_number='MN001',
            status='IN_WAREHOUSE'
        )
        bill.id = '1'
        bill.created_at = datetime.utcnow()
        bill.updated_at = datetime.utcnow()
        
        bill_dict = bill.to_dict()
        
        assert 'id' in bill_dict
        assert 'contract_code' in bill_dict
        assert 'customer_name' in bill_dict
        assert 'address' in bill_dict
        assert 'amount' in bill_dict
        assert 'status' in bill_dict

class TestSaleModel:
    def test_sale_creation(self):
        """Test sale model creation"""
        sale = Sale(
            customer_id=1,
            user_id=1,
            total_bill_amount=1500000,
            profit_percentage=10,
            profit_amount=150000,
            customer_payment=1350000,
            payment_method='BANK_TRANSFER',
            status='PENDING_PAYMENT'
        )
        
        assert sale.customer_id == 1
        assert sale.user_id == 1
        assert sale.total_bill_amount == 1500000
        assert sale.profit_percentage == 10
        assert sale.profit_amount == 150000
        assert sale.customer_payment == 1350000
        assert sale.payment_method == 'BANK_TRANSFER'
        assert sale.status == 'PENDING_PAYMENT'

    def test_sale_to_dict(self):
        """Test sale to_dict method"""
        sale = Sale(
            customer_id=1,
            user_id=1,
            total_bill_amount=1500000,
            profit_percentage=10,
            profit_amount=150000,
            customer_payment=1350000,
            payment_method='BANK_TRANSFER',
            status='PENDING_PAYMENT'
        )
        sale.id = '1'
        sale.created_at = datetime.utcnow()
        sale.updated_at = datetime.utcnow()
        
        sale_dict = sale.to_dict()
        
        assert 'id' in sale_dict
        assert 'customer_id' in sale_dict
        assert 'user_id' in sale_dict
        assert 'total_bill_amount' in sale_dict
        assert 'profit_percentage' in sale_dict
        assert 'status' in sale_dict

class TestProxyModel:
    def test_proxy_creation(self):
        """Test proxy model creation"""
        proxy = Proxy(
            ip='192.168.1.1',
            port=8080,
            username='user',
            password='pass',
            protocol='http',
            is_active=True
        )
        
        assert proxy.ip == '192.168.1.1'
        assert proxy.port == 8080
        assert proxy.username == 'user'
        assert proxy.password == 'pass'
        assert proxy.protocol == 'http'
        assert proxy.is_active == True

    def test_proxy_to_dict(self):
        """Test proxy to_dict method"""
        proxy = Proxy(
            ip='192.168.1.1',
            port=8080,
            username='user',
            password='pass',
            protocol='http',
            is_active=True
        )
        proxy.id = 1
        proxy.created_at = datetime.utcnow()
        proxy.updated_at = datetime.utcnow()
        
        proxy_dict = proxy.to_dict()
        
        assert 'id' in proxy_dict
        assert 'ip' in proxy_dict
        assert 'port' in proxy_dict
        assert 'username' in proxy_dict
        assert 'protocol' in proxy_dict
        assert 'is_active' in proxy_dict
