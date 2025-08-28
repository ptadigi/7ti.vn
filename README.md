# FPT Bill Manager System

## 📋 Tổng Quan Dự Án

**FPT Bill Manager** là hệ thống quản lý và bán bill điện thông minh, được phát triển để tự động hóa quy trình kiểm tra, quản lý và bán các hóa đơn điện từ FPT Shop.

## 🏗️ Kiến Trúc Hệ Thống

### **Backend (Flask + PostgreSQL)**
- **Framework**: Flask với SQLAlchemy ORM
- **Database**: PostgreSQL với các enum types
- **Authentication**: JWT (JSON Web Tokens)
- **CORS**: Hỗ trợ cross-origin requests
- **Port**: 5001

### **Frontend (React + TypeScript)**
- **Framework**: React 18 với TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **Port**: 3000

## 🗄️ Cấu Trúc Database

### **Bảng Chính**

#### **1. Users**
```sql
- id (Primary Key)
- username, email, password_hash
- role, is_active
- created_at, updated_at
```

#### **2. Customers**
```sql
- id (Primary Key)
- name, phone, email, address
- customer_type (ENUM: 'INDIVIDUAL', 'COMPANY')
- company_name, tax_code
- status (ENUM: 'ACTIVE', 'INACTIVE', 'BLACKLIST')
- bank_name, bank_account
- created_at, updated_at
```

#### **3. Bills**
```sql
- id (Primary Key)
- contract_code, customer_name, address
- amount, period, due_date, bill_date
- status (ENUM: 'IN_WAREHOUSE', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED')
- meter_number, raw_response
- customer_id (Foreign Key)
- sale_id (Foreign Key)
- created_at, updated_at
```

#### **4. Sales**
```sql
- id (Primary Key)
- customer_id, user_id
- total_bill_amount, profit_amount, profit_percentage
- payment_method (ENUM: 'CASH', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY')
- status (ENUM: 'PENDING_PAYMENT', 'PAID', 'COMPLETED')
- created_at, updated_at
```

#### **5. CustomerTransactions**
```sql
- id (Primary Key)
- sale_id (Foreign Key)
- transaction_type (ENUM: 'PAYMENT_RECEIVED', 'PAYMENT_SENT', 'REFUND')
- amount, payment_method, bank_name, bank_account
- status (ENUM: 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')
- notes, admin_notes
- created_at, updated_at, processed_at
```

## 🔌 API Endpoints

### **Authentication**
```
POST /api/auth/login          - Đăng nhập
POST /api/auth/register       - Đăng ký
POST /api/auth/refresh        - Refresh token
```

### **Bills Management**
```
GET  /api/bills/warehouse     - Lấy bills trong kho (với filters)
GET  /api/bills/all           - Lấy tất cả bills (mọi trạng thái)
POST /api/bills/warehouse     - Thêm bill vào kho
PUT  /api/bills/warehouse/:id - Cập nhật bill
DELETE /api/bills/warehouse/:id - Xóa bill
PUT  /api/bills/warehouse/bulk-status - Cập nhật trạng thái nhiều bills
GET  /api/bills/customer/:id  - Lấy bills của customer
```

### **Sales Management**
```
GET  /api/sales               - Lấy danh sách sales
POST /api/sales               - Tạo sale mới
GET  /api/sales/:id           - Lấy sale theo ID
POST /api/sales/:id/confirm-payment - Xác nhận thanh toán
POST /api/sales/:id/complete  - Hoàn tất sale
GET  /api/sales/customer/:id  - Lấy sales của customer
```

### **Customers Management**
```
GET  /api/customers           - Lấy danh sách customers
POST /api/customers           - Tạo customer mới
PUT  /api/customers/:id       - Cập nhật customer
DELETE /api/customers/:id     - Xóa customer
GET  /api/customers/:id       - Lấy customer theo ID
```

### **Reports & Analytics**
```
GET  /api/reports/sales       - Báo cáo doanh số
GET  /api/reports/customers   - Báo cáo khách hàng
GET  /api/reports/bills       - Báo cáo bills
```

## 🔄 Quy Trình Hoạt Động

### **1. Quy Trình Bill Management**
```
1. Kiểm tra bill từ FPT API → 2. Lưu vào kho (IN_WAREHOUSE) → 3. Bán cho khách hàng → 4. Chuyển trạng thái PENDING_PAYMENT → 5. Khách thanh toán → 6. Chuyển trạng thái PAID → 7. Hoàn tất (COMPLETED)
```

### **2. Quy Trình Sale**
```
1. Chọn bills từ kho → 2. Chọn khách hàng → 3. Tạo sale với profit percentage → 4. Cập nhật trạng thái bills → 5. Tạo CustomerTransaction → 6. Xác nhận thanh toán → 7. Hoàn tất giao dịch
```

### **3. Quy Trình CustomerTransaction**
```
1. Sale được tạo → 2. Tạo transaction PAYMENT_RECEIVED → 3. Khách thanh toán → 4. Cập nhật transaction status → 5. Tạo transaction PAYMENT_SENT (nếu cần)
```

## 🎯 Tính Năng Chính

### **1. Bill Warehouse Management**
- **Thêm bills** từ FPT API hoặc nhập thủ công
- **Tìm kiếm và lọc** bills theo nhiều tiêu chí
- **Bulk operations** để cập nhật nhiều bills cùng lúc
- **Tabs hiển thị**: "Bills Trong Kho" và "Tất Cả Bills"

### **2. Sales Management**
- **Tạo giao dịch bán** với bills đã chọn
- **Tính toán lợi nhuận** theo percentage
- **Quản lý trạng thái** thanh toán
- **Xác nhận và hoàn tất** giao dịch

### **3. Customer Management**
- **Quản lý thông tin** khách hàng cá nhân và doanh nghiệp
- **Modal xem chi tiết** khách hàng với bills và transactions
- **Phân loại khách hàng** theo type và status

### **4. Reports & Analytics**
- **Thống kê doanh số** theo thời gian
- **Phân tích khách hàng** và bills
- **Export dữ liệu** ra các định dạng khác nhau

## 🛠️ Cài Đặt và Chạy Dự Án

### **1. Yêu Cầu Hệ Thống**
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- macOS/Linux/Windows

### **2. Cài Đặt Backend**
```bash
cd backend
pip install -r requirements.txt
```

### **3. Cài Đặt Frontend**
```bash
cd frontend-react
npm install
```

### **4. Cấu Hình Database**
```bash
# Tạo database
createdb fpt_bill_manager

# Chạy migrations
python3 migrate_customer_model.py
python3 migrate_bills_add_customer_id.py
python3 migrate_customer_transactions.py
```

### **5. Khởi Động Dự Án**

#### **Sử dụng Scripts (Khuyến nghị):**
```bash
# Khởi động toàn bộ
./start_project.sh

# Dừng dự án
./stop_project.sh

# Restart dự án
./restart_project.sh
```

#### **Khởi động thủ công:**
```bash
# Terminal 1 - Backend
cd backend
python3 app.py

# Terminal 2 - Frontend
cd frontend-react
npm run dev
```

## 🔧 Scripts Quản Lý

### **start_project.sh**
- Dọn dẹp process cũ
- Xóa Python cache
- Khởi động backend và frontend
- Kiểm tra health status
- Hiển thị logs

### **stop_project.sh**
- Dừng backend và frontend
- Dọn dẹp process còn sót
- Xóa PID files

### **restart_project.sh**
- Dừng và khởi động lại toàn bộ dự án

## 📊 Cấu Trúc Frontend

### **Pages**
- **Dashboard**: Tổng quan hệ thống
- **BillWarehouse**: Quản lý kho bills với tabs
- **Sales**: Quản lý giao dịch bán
- **Customers**: Quản lý khách hàng
- **Reports**: Báo cáo và thống kê

### **Components**
- **Common**: Button, Input, Select, Modal, Table
- **Bills**: BillSearchForm, BillWarehouseFilters, SellBillsModal
- **Customers**: CustomerForm, CustomerList, CustomerDetailModal
- **Sales**: BillSellingWorkflow

### **Services**
- **apiClient**: HTTP client với Axios
- **authService**: Quản lý authentication
- **billService**: API calls cho bills
- **customerService**: API calls cho customers
- **salesService**: API calls cho sales

## 🔐 Authentication & Security

### **JWT Implementation**
- Access token với expiration time
- Refresh token mechanism
- Secure cookie handling
- CORS configuration

### **Authorization**
- Role-based access control
- Protected routes
- API endpoint security

## 📈 Performance & Optimization

### **Backend**
- Database indexing cho các trường thường query
- Connection pooling
- Query optimization
- Caching strategies

### **Frontend**
- Lazy loading components
- Debounced search inputs
- Optimized re-renders
- Bundle splitting

## 🐛 Debugging & Troubleshooting

### **Common Issues**
1. **Port conflicts**: Kiểm tra process đang chạy
2. **Database connection**: Kiểm tra PostgreSQL service
3. **Python cache**: Xóa `__pycache__` directories
4. **Node modules**: Xóa `node_modules` và reinstall

### **Debug Commands**
```bash
# Kiểm tra process
lsof -i :3000
lsof -i :5001

# Kill process
pkill -f "python3 app.py"
pkill -f "npm run dev"

# Xóa cache
rm -rf backend/__pycache__
rm -rf frontend-react/node_modules
```

## 🚀 Deployment

### **Production Setup**
- **Backend**: Gunicorn + Nginx
- **Frontend**: Build production bundle
- **Database**: PostgreSQL với connection pooling
- **Environment**: Production configs

### **Environment Variables**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=production
```

## 📝 Changelog

### **v1.0.0 - Current**
- ✅ Bill warehouse management
- ✅ Sales management system
- ✅ Customer management
- ✅ Authentication system
- ✅ Reports & analytics
- ✅ Customer transaction tracking
- ✅ Tabs system cho BillWarehouse
- ✅ Scripts quản lý dự án

### **Planned Features**
- 🔄 Real-time notifications
- 🔄 Advanced reporting
- 🔄 Mobile app
- 🔄 API rate limiting
- 🔄 Advanced search filters

## 🔍 REVIEW & ĐỀ XUẤT CẢI THIỆN

### **✅ ĐIỂM MẠNH HIỆN TẠI**

1. **🏗️ Kiến Trúc Tốt**
   - Backend: Flask + SQLAlchemy với separation of concerns
   - Frontend: React + TypeScript với component-based architecture
   - Database: PostgreSQL với relationships rõ ràng

2. **🔐 Bảo Mật Cơ Bản**
   - JWT authentication
   - CORS configuration
   - Input validation ở backend

3. **📊 Business Logic Hoàn Chỉnh**
   - Quy trình bill management từ A-Z
   - Customer transaction tracking
   - Sales workflow với profit calculation

4. **🛠️ DevOps & Scripts**
   - Scripts quản lý dự án (start/stop/restart)
   - Health check endpoints
   - Process management

### **⚠️ ĐIỂM YẾU & VẤN ĐỀ CẦN KHẮC PHỤC**

1. **🚨 Bảo Mật & Validation**
   - Thiếu rate limiting thực tế
   - Input sanitization chưa đầy đủ
   - SQL injection protection chưa robust

2. **📱 Frontend Issues**
   - Error handling chưa nhất quán
   - Loading states chưa đồng bộ
   - Type safety chưa strict

3. **🗄️ Database**
   - Thiếu database migrations system
   - Indexing chưa tối ưu
   - Backup strategy chưa có

4. **⚡ Performance**
   - N+1 query problems
   - Caching strategy chưa có
   - Pagination chưa tối ưu

## 🚀 ROADMAP PHÁT TRIỂN CHI TIẾT

### **Phase 1: Security & Performance (Tuần 1-2)**

#### **🔐 Bảo Mật & Validation**
- [ ] **Implement Rate Limiting**
  ```python
  # Thêm vào backend/app.py
  from flask_limiter import Limiter
  limiter = Limiter(app, key_func=get_remote_address)
  ```
- [ ] **Input Sanitization**
  ```python
  # Thêm vào backend/utils/security.py
  import bleach
  def sanitize_input(data): return bleach.clean(data, tags=[], strip=True)
  ```
- [ ] **Enhanced Validation**
  ```python
  # Thêm vào backend/utils/validators.py
  from marshmallow import Schema, fields, validate
  ```

#### **📊 Performance & Database**
- [ ] **Database Indexing**
  ```sql
  CREATE INDEX CONCURRENTLY idx_bills_status_created_at ON bills(status, created_at);
  CREATE INDEX CONCURRENTLY idx_sales_customer_status ON sales(customer_id, status);
  ```
- [ ] **Caching Layer**
  ```python
  # Thêm vào backend/services/cache_service.py
  import redis
  redis_client = redis.Redis(host='localhost', port=6379, db=0)
  ```
- [ ] **Query Optimization**
  ```python
  # Sửa N+1 queries trong services
  bills = db.query(Bill).options(joinedload(Bill.customer)).all()
  ```

### **Phase 2: Testing & Quality (Tuần 3-4)**

#### **🧪 Testing Infrastructure**
- [ ] **Backend Testing**
  ```python
  # Tạo backend/tests/test_integration.py
  import pytest
  def test_create_sale_workflow(client, auth_headers):
      # Test complete sale workflow
  ```
- [ ] **Frontend Testing**
  ```typescript
  // Tạo frontend-react/src/components/__tests__/
  import { render, screen, fireEvent } from '@testing-library/react'
  ```
- [ ] **API Testing**
  ```bash
  # Tạo tests/api/test_endpoints.sh
  curl -X POST http://localhost:5001/api/sales/ -H "Authorization: Bearer $TOKEN"
  ```

#### **📝 Error Handling & Logging**
- [ ] **Structured Logging**
  ```python
  # Thêm vào backend/utils/logger.py
  class StructuredLogger:
      def log_request(self, response_time, status_code, error=None):
  ```
- [ ] **Error Boundaries**
  ```typescript
  // Cải thiện frontend-react/src/components/common/ErrorBoundary.tsx
  class ErrorBoundary extends Component<Props, ErrorBoundaryState>
  ```
- [ ] **Health Checks**
  ```python
  # Cải thiện backend/app.py health endpoint
  @app.route('/api/health', methods=['GET'])
  def health_check():
      # Check database, external APIs, services
  ```

### **Phase 3: Deployment & CI/CD (Tuần 5-6)**

#### **🐳 Docker & Containerization**
- [ ] **Backend Dockerfile**
  ```dockerfile
  FROM python:3.9-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  EXPOSE 5001
  CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
  ```
- [ ] **Frontend Dockerfile**
  ```dockerfile
  FROM node:16-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npm run build
  ```
- [ ] **Docker Compose**
  ```yaml
  # Tạo docker-compose.yml
  version: '3.8'
  services:
    backend: build: .
    frontend: build: ./frontend-react
    db: image: postgres:13
    redis: image: redis:6-alpine
  ```

#### **🔄 CI/CD Pipeline**
- [ ] **GitHub Actions**
  ```yaml
  # Tạo .github/workflows/ci.yml
  name: CI/CD Pipeline
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Run Tests
          run: |
            cd backend && python -m pytest
            cd ../frontend-react && npm test
  ```
- [ ] **Automated Deployment**
  ```yaml
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          docker-compose up -d --build
  ```

### **Phase 4: Advanced Features (Tuần 7-8)**

#### **🔔 Real-time Features**
- [ ] **WebSocket Integration**
  ```python
  # Cải thiện backend/app.py
  from flask_socketio import SocketIO, emit
  socketio = SocketIO(app, cors_allowed_origins="*")
  
  @socketio.on('bill_status_update')
  def handle_bill_update(data):
      emit('bill_updated', data, broadcast=True)
  ```
- [ ] **Push Notifications**
  ```typescript
  // Thêm vào frontend-react/src/services/notificationService.ts
  export class NotificationService {
    async subscribeToUpdates(): Promise<void> {
      // WebSocket connection
    }
  }
  ```

#### **📊 Advanced Analytics**
- [ ] **Real-time Dashboard**
  ```typescript
  // Tạo frontend-react/src/components/dashboard/RealTimeDashboard.tsx
  const RealTimeDashboard: React.FC = () => {
    const [realTimeData, setRealTimeData] = useState<DashboardData>()
    // WebSocket updates
  }
  ```
- [ ] **Advanced Reporting**
  ```python
  # Thêm vào backend/services/analytics_service.py
  class AnalyticsService:
    def get_profit_trends(self, start_date, end_date):
        # Advanced profit analysis
    def get_customer_segments(self):
        # Customer segmentation analysis
  ```

#### **📱 Mobile Optimization**
- [ ] **Responsive Design**
  ```css
  /* Thêm vào frontend-react/src/index.css */
  @media (max-width: 768px) {
    .table-container { overflow-x: auto; }
    .form-grid { grid-template-columns: 1fr; }
  }
  ```
- [ ] **PWA Features**
  ```json
  // Tạo frontend-react/public/manifest.json
  {
    "name": "FPT Bill Manager",
    "short_name": "FPT Bills",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#3B82F6"
    }
  ```

## 🎯 PRIORITY MATRIX

### **🔥 HIGH PRIORITY (Tuần 1-2)**
- Rate limiting implementation
- Database indexing
- Input validation & sanitization
- Basic error handling

### **⚡ MEDIUM PRIORITY (Tuần 3-4)**
- Testing infrastructure
- Logging system
- Performance optimization
- Error boundaries

### **🚀 LOW PRIORITY (Tuần 5-8)**
- Docker deployment
- CI/CD pipeline
- Real-time features
- Mobile optimization

## 💡 IMPLEMENTATION GUIDELINES

### **🔐 Security Best Practices**
```python
# Luôn sử dụng parameterized queries
def get_customer_by_id(customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()

# Không bao giờ sử dụng string formatting
# ❌ WRONG: f"SELECT * FROM customers WHERE id = {customer_id}"
# ✅ CORRECT: db.query(Customer).filter(Customer.id == customer_id)
```

### **📊 Performance Best Practices**
```python
# Sử dụng eager loading để tránh N+1 queries
bills = db.query(Bill).options(
    joinedload(Bill.customer),
    joinedload(Bill.sale)
).all()

# Sử dụng pagination cho large datasets
bills = db.query(Bill).offset(offset).limit(limit).all()
```

### **🧪 Testing Best Practices**
```typescript
// Test user interactions, not implementation details
test('should create customer when form is valid', async () => {
  render(<CustomerForm onSubmit={mockOnSubmit} />)
  
  fireEvent.change(screen.getByLabelText('Tên khách hàng'), {
    target: { value: 'Test Customer' }
  })
  
  fireEvent.click(screen.getByText('Lưu'))
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    name: 'Test Customer'
  })
})
```

## 📊 SUCCESS METRICS

### **Performance Metrics**
- **Response Time**: < 200ms cho 95% requests
- **Database Queries**: < 10 queries per request
- **Memory Usage**: < 512MB cho backend, < 100MB cho frontend
- **Uptime**: > 99.9%

### **Quality Metrics**
- **Test Coverage**: > 80%
- **Bug Rate**: < 5 bugs per 1000 lines of code
- **Security Issues**: 0 critical vulnerabilities
- **User Satisfaction**: > 4.5/5

### **Business Metrics**
- **Bill Processing**: > 1000 bills/day
- **Sales Conversion**: > 85%
- **Customer Retention**: > 90%
- **System Reliability**: > 99.5%

---

## 🔍 REVIEW & ĐỀ XUẤT CẢI THIỆN

### **✅ ĐIỂM MẠNH HIỆN TẠI**

1. **🏗️ Kiến Trúc Tốt**
   - Backend: Flask + SQLAlchemy với separation of concerns
   - Frontend: React + TypeScript với component-based architecture
   - Database: PostgreSQL với relationships rõ ràng

2. **🔐 Bảo Mật Cơ Bản**
   - JWT authentication
   - CORS configuration
   - Input validation ở backend

3. **📊 Business Logic Hoàn Chỉnh**
   - Quy trình bill management từ A-Z
   - Customer transaction tracking
   - Sales workflow với profit calculation

4. **🛠️ DevOps & Scripts**
   - Scripts quản lý dự án (start/stop/restart)
   - Health check endpoints
   - Process management

### **⚠️ ĐIỂM YẾU & VẤN ĐỀ CẦN KHẮC PHỤC**

1. **🚨 Bảo Mật & Validation**
   - Thiếu rate limiting thực tế
   - Input sanitization chưa đầy đủ
   - SQL injection protection chưa robust

2. **📱 Frontend Issues**
   - Error handling chưa nhất quán
   - Loading states chưa đồng bộ
   - Type safety chưa strict

3. **🗄️ Database**
   - Thiếu database migrations system
   - Indexing chưa tối ưu
   - Backup strategy chưa có

4. **⚡ Performance**
   - N+1 query problems
   - Caching strategy chưa có
   - Pagination chưa tối ưu

## 🚀 ROADMAP PHÁT TRIỂN CHI TIẾT

### **Phase 1: Security & Performance (Tuần 1-2)**

#### **🔐 Bảo Mật & Validation**
- [ ] **Implement Rate Limiting**
  ```python
  # Thêm vào backend/app.py
  from flask_limiter import Limiter
  limiter = Limiter(app, key_func=get_remote_address)
  ```
- [ ] **Input Sanitization**
  ```python
  # Thêm vào backend/utils/security.py
  import bleach
  def sanitize_input(data): return bleach.clean(data, tags=[], strip=True)
  ```
- [ ] **Enhanced Validation**
  ```python
  # Thêm vào backend/utils/validators.py
  from marshmallow import Schema, fields, validate
  ```

#### **📊 Performance & Database**
- [ ] **Database Indexing**
  ```sql
  CREATE INDEX CONCURRENTLY idx_bills_status_created_at ON bills(status, created_at);
  CREATE INDEX CONCURRENTLY idx_sales_customer_status ON sales(customer_id, status);
  ```
- [ ] **Caching Layer**
  ```python
  # Thêm vào backend/services/cache_service.py
  import redis
  redis_client = redis.Redis(host='localhost', port=6379, db=0)
  ```
- [ ] **Query Optimization**
  ```python
  # Sửa N+1 queries trong services
  bills = db.query(Bill).options(joinedload(Bill.customer)).all()
  ```

### **Phase 2: Testing & Quality (Tuần 3-4)**

#### **🧪 Testing Infrastructure**
- [ ] **Backend Testing**
  ```python
  # Tạo backend/tests/test_integration.py
  import pytest
  def test_create_sale_workflow(client, auth_headers):
      # Test complete sale workflow
  ```
- [ ] **Frontend Testing**
  ```typescript
  // Tạo frontend-react/src/components/__tests__/
  import { render, screen, fireEvent } from '@testing-library/react'
  ```
- [ ] **API Testing**
  ```bash
  # Tạo tests/api/test_endpoints.sh
  curl -X POST http://localhost:5001/api/sales/ -H "Authorization: Bearer $TOKEN"
  ```

#### **📝 Error Handling & Logging**
- [ ] **Structured Logging**
  ```python
  # Thêm vào backend/utils/logger.py
  class StructuredLogger:
      def log_request(self, response_time, status_code, error=None):
  ```
- [ ] **Error Boundaries**
  ```typescript
  // Cải thiện frontend-react/src/components/common/ErrorBoundary.tsx
  class ErrorBoundary extends Component<Props, ErrorBoundaryState>
  ```
- [ ] **Health Checks**
  ```python
  # Cải thiện backend/app.py health endpoint
  @app.route('/api/health', methods=['GET'])
  def health_check():
      # Check database, external APIs, services
  ```

### **Phase 3: Deployment & CI/CD (Tuần 5-6)**

#### **🐳 Docker & Containerization**
- [ ] **Backend Dockerfile**
  ```dockerfile
  FROM python:3.9-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  EXPOSE 5001
  CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
  ```
- [ ] **Frontend Dockerfile**
  ```dockerfile
  FROM node:16-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npm run build
  ```
- [ ] **Docker Compose**
  ```yaml
  # Tạo docker-compose.yml
  version: '3.8'
  services:
    backend: build: .
    frontend: build: ./frontend-react
    db: image: postgres:13
    redis: image: redis:6-alpine
  ```

#### **🔄 CI/CD Pipeline**
- [ ] **GitHub Actions**
  ```yaml
  # Tạo .github/workflows/ci.yml
  name: CI/CD Pipeline
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Run Tests
          run: |
            cd backend && python -m pytest
            cd ../frontend-react && npm test
  ```
- [ ] **Automated Deployment**
  ```yaml
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          docker-compose up -d --build
  ```

### **Phase 4: Advanced Features (Tuần 7-8)**

#### **🔔 Real-time Features**
- [ ] **WebSocket Integration**
  ```python
  # Cải thiện backend/app.py
  from flask_socketio import SocketIO, emit
  socketio = SocketIO(app, cors_allowed_origins="*")
  
  @socketio.on('bill_status_update')
  def handle_bill_update(data):
      emit('bill_updated', data, broadcast=True)
  ```
- [ ] **Push Notifications**
  ```typescript
  // Thêm vào frontend-react/src/services/notificationService.ts
  export class NotificationService {
    async subscribeToUpdates(): Promise<void> {
      // WebSocket connection
    }
  }
  ```

#### **📊 Advanced Analytics**
- [ ] **Real-time Dashboard**
  ```typescript
  // Tạo frontend-react/src/components/dashboard/RealTimeDashboard.tsx
  const RealTimeDashboard: React.FC = () => {
    const [realTimeData, setRealTimeData] = useState<DashboardData>()
    // WebSocket updates
  }
  ```
- [ ] **Advanced Reporting**
  ```python
  # Thêm vào backend/services/analytics_service.py
  class AnalyticsService:
    def get_profit_trends(self, start_date, end_date):
        # Advanced profit analysis
    def get_customer_segments(self):
        # Customer segmentation analysis
  ```

#### **📱 Mobile Optimization**
- [ ] **Responsive Design**
  ```css
  /* Thêm vào frontend-react/src/index.css */
  @media (max-width: 768px) {
    .table-container { overflow-x: auto; }
    .form-grid { grid-template-columns: 1fr; }
  }
  ```
- [ ] **PWA Features**
  ```json
  // Tạo frontend-react/public/manifest.json
  {
    "name": "FPT Bill Manager",
    "short_name": "FPT Bills",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#3B82F6"
  }
  ```

## 🎯 PRIORITY MATRIX

### **🔥 HIGH PRIORITY (Tuần 1-2)**
- Rate limiting implementation
- Database indexing
- Input validation & sanitization
- Basic error handling

### **⚡ MEDIUM PRIORITY (Tuần 3-4)**
- Testing infrastructure
- Logging system
- Performance optimization
- Error boundaries

### **🚀 LOW PRIORITY (Tuần 5-8)**
- Docker deployment
- CI/CD pipeline
- Real-time features
- Mobile optimization

## 💡 IMPLEMENTATION GUIDELINES

### **🔐 Security Best Practices**
```python
# Luôn sử dụng parameterized queries
def get_customer_by_id(customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()

# Không bao giờ sử dụng string formatting
# ❌ WRONG: f"SELECT * FROM customers WHERE id = {customer_id}"
# ✅ CORRECT: db.query(Customer).filter(Customer.id == customer_id)
```

### **📊 Performance Best Practices**
```python
# Sử dụng eager loading để tránh N+1 queries
bills = db.query(Bill).options(
    joinedload(Bill.customer),
    joinedload(Bill.sale)
).all()

# Sử dụng pagination cho large datasets
bills = db.query(Bill).offset(offset).limit(limit).all()
```

### **🧪 Testing Best Practices**
```typescript
// Test user interactions, not implementation details
test('should create customer when form is valid', async () => {
  render(<CustomerForm onSubmit={mockOnSubmit} />)
  
  fireEvent.change(screen.getByLabelText('Tên khách hàng'), {
    target: { value: 'Test Customer' }
  })
  
  fireEvent.click(screen.getByText('Lưu'))
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    name: 'Test Customer'
  })
})
```

## 📊 SUCCESS METRICS

### **Performance Metrics**
- **Response Time**: < 200ms cho 95% requests
- **Database Queries**: < 10 queries per request
- **Memory Usage**: < 512MB cho backend, < 100MB cho frontend
- **Uptime**: > 99.9%

### **Quality Metrics**
- **Test Coverage**: > 80%
- **Bug Rate**: < 5 bugs per 1000 lines of code
- **Security Issues**: 0 critical vulnerabilities
- **User Satisfaction**: > 4.5/5

### **Business Metrics**
- **Bill Processing**: > 1000 bills/day
- **Sales Conversion**: > 85%
- **Customer Retention**: > 90%
- **System Reliability**: > 99.5%

---

## 🤝 Contributing

### **Development Workflow**
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### **Code Standards**
- Python: PEP 8
- JavaScript: ESLint + Prettier
- TypeScript: Strict mode
- Git: Conventional commits

## 📞 Support

### **Documentation**
- API documentation: `/api/docs`
- Database schema: `database/` folder
- Component library: `frontend-react/src/components`

### **Contact**
- **Developer**: AI Assistant
- **Project**: FPT Bill Manager System
- **Version**: 1.0.0

---

**Lưu ý**: Đây là hệ thống quản lý bill điện thông minh với đầy đủ tính năng CRUD, authentication, và business logic phức tạp. Hãy đọc kỹ documentation trước khi thực hiện thay đổi.

**🚀 Roadmap phát triển đã được cập nhật với các đề xuất cải thiện chi tiết!**
# 7ti.vn
