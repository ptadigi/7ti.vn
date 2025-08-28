tiếp import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from backend.services.customer_service import CustomerService
from backend.services.bill_service import BillService
from backend.services.sales_service import SalesService
from backend.models.customer import Customer
from backend.models.bill import Bill
from backend.models.sale import Sale

class TestCustomerService:
    def setup_method(self):
        """Setup method for each test"""
        self.mock_db = Mock()
        self.customer_service = CustomerService(self.mock_db)

    def test_create_customer_success(self):
        """Test successful customer creation"""
        customer_data = {
            'name': 'Test Customer',
            'phone': '0123456789',
            'email': 'test@example.com',
            'address': 'Test Address',
            'notes': 'Test notes'
        }
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock customer object
        mock_customer = Mock()
        mock_customer.to_dict.return_value = {**customer_data, 'id': '1'}
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        with patch('backend.services.customer_service.Customer') as mock_customer_class:
            mock_customer_class.return_value = mock_customer
            
            result = self.customer_service.create_customer(customer_data)
            
            assert result['success'] == True
            assert result['data']['name'] == 'Test Customer'
            assert result['data']['phone'] == '0123456789'

    def test_create_customer_validation_error(self):
        """Test customer creation with validation error"""
        customer_data = {
            'name': '',  # Invalid: empty name
            'phone': '0123456789'
        }
        
        result = self.customer_service.create_customer(customer_data)
        
        assert result['success'] == False
        assert 'validation' in result['error'].lower()

    def test_get_customers_success(self):
        """Test successful customer retrieval"""
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock customer objects
        mock_customers = [
            Mock(id='1', name='Customer 1', to_dict=lambda: {'id': '1', 'name': 'Customer 1'}),
            Mock(id='2', name='Customer 2', to_dict=lambda: {'id': '2', 'name': 'Customer 2'})
        ]
        
        mock_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = mock_customers
        mock_session.query.return_value.filter.return_value.count.return_value = 2
        
        result = self.customer_service.get_customers(page=1, limit=10)
        
        assert result['success'] == True
        assert len(result['data']['customers']) == 2
        assert result['data']['total'] == 2

    def test_get_customer_by_id_success(self):
        """Test successful customer retrieval by ID"""
        customer_id = '1'
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock customer object
        mock_customer = Mock(
            id='1',
            name='Test Customer',
            to_dict=lambda: {'id': '1', 'name': 'Test Customer'}
        )
        mock_session.query.return_value.filter.return_value.first.return_value = mock_customer
        
        result = self.customer_service.get_customer_by_id(customer_id)
        
        assert result['success'] == True
        assert result['data']['id'] == '1'
        assert result['data']['name'] == 'Test Customer'

    def test_get_customer_by_id_not_found(self):
        """Test customer retrieval by ID when not found"""
        customer_id = '999'
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock no customer found
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = self.customer_service.get_customer_by_id(customer_id)
        
        assert result['success'] == False
        assert 'not found' in result['error'].lower()

class TestBillService:
    def setup_method(self):
        """Setup method for each test"""
        self.mock_db = Mock()
        self.bill_service = BillService(self.mock_db)

    def test_add_bill_to_warehouse_success(self):
        """Test successful bill addition to warehouse"""
        bill_data = {
            'contract_code': 'PB02020040261',
            'customer_name': 'Test Customer',
            'address': 'Test Address',
            'amount': 1500000,
            'due_date': '2024-09-15',
            'bill_date': '2024-08-01',
            'meter_number': 'MN001'
        }
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock bill object
        mock_bill = Mock()
        mock_bill.to_dict.return_value = {**bill_data, 'id': '1', 'status': 'IN_WAREHOUSE'}
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        with patch('backend.services.bill_service.Bill') as mock_bill_class:
            mock_bill_class.return_value = mock_bill
            
            result = self.bill_service.add_bill_to_warehouse(bill_data)
            
            assert result['success'] == True
            assert result['data']['contract_code'] == 'PB02020040261'
            assert result['data']['status'] == 'IN_WAREHOUSE'

    def test_get_warehouse_bills_success(self):
        """Test successful warehouse bills retrieval"""
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock bill objects
        mock_bills = [
            Mock(id='1', contract_code='PB001', to_dict=lambda: {'id': '1', 'contract_code': 'PB001'}),
            Mock(id='2', contract_code='PB002', to_dict=lambda: {'id': '2', 'contract_code': 'PB002'})
        ]
        
        mock_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = mock_bills
        mock_session.query.return_value.filter.return_value.count.return_value = 2
        
        result = self.bill_service.get_warehouse_bills(page=1, limit=10)
        
        assert result['success'] == True
        assert len(result['data']['bills']) == 2
        assert result['data']['total'] == 2

class TestSalesService:
    def setup_method(self):
        """Setup method for each test"""
        self.mock_db = Mock()
        self.sales_service = SalesService(self.mock_db)

    def test_create_sale_success(self):
        """Test successful sale creation"""
        sale_data = {
            'customer_id': 1,
            'total_bill_amount': 1500000,
            'profit_percentage': 10,
            'payment_method': 'BANK_TRANSFER',
            'notes': 'Test sale'
        }
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock sale object
        mock_sale = Mock()
        mock_sale.to_dict.return_value = {
            **sale_data,
            'id': '1',
            'profit_amount': 150000,
            'customer_payment': 1350000,
            'status': 'PENDING_PAYMENT'
        }
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        with patch('backend.services.sales_service.Sale') as mock_sale_class:
            mock_sale_class.return_value = mock_sale
            
            result = self.sales_service.create_sale(sale_data)
            
            assert result['success'] == True
            assert result['data']['total_bill_amount'] == 1500000
            assert result['data']['profit_percentage'] == 10
            assert result['data']['profit_amount'] == 150000
            assert result['data']['customer_payment'] == 1350000

    def test_update_sale_status_success(self):
        """Test successful sale status update"""
        sale_id = '1'
        new_status = 'COMPLETED'
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock sale object
        mock_sale = Mock(
            id='1',
            status='PENDING_PAYMENT',
            to_dict=lambda: {'id': '1', 'status': 'COMPLETED'}
        )
        mock_session.query.return_value.filter.return_value.first.return_value = mock_sale
        mock_session.commit.return_value = None
        
        result = self.sales_service.update_sale_status(sale_id, new_status)
        
        assert result['success'] == True
        assert result['data']['status'] == 'COMPLETED'

    def test_update_sale_status_invalid_transition(self):
        """Test sale status update with invalid transition"""
        sale_id = '1'
        new_status = 'INVALID_STATUS'
        
        # Mock database session
        mock_session = Mock()
        self.mock_db.return_value.__enter__.return_value = mock_session
        
        # Mock sale object
        mock_sale = Mock(
            id='1',
            status='PENDING_PAYMENT',
            to_dict=lambda: {'id': '1', 'status': 'PENDING_PAYMENT'}
        )
        mock_session.query.return_value.filter.return_value.first.return_value = mock_sale
        
        result = self.sales_service.update_sale_status(sale_id, new_status)
        
        assert result['success'] == False
        assert 'invalid' in result['error'].lower()
