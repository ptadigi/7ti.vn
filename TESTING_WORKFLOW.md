# 🚀 TESTING COMPLETE BILL WORKFLOW

## **📋 PHASE 5: COMPLETE WORKFLOW TESTING**

### **1. Prerequisites**
- ✅ Backend đang chạy ở port 5001
- ✅ Frontend đang chạy ở port 3002
- ✅ Database connection thành công
- ✅ All API endpoints đã được implement

### **2. Test Flow: Tạo Sale Transaction**

#### **Step 1: Mở Sales Page**
```
URL: http://localhost:3002/sales
```

#### **Step 2: Tạo Sale Transaction**
1. **Chọn Bill**: Click "Chọn Bill" → Chọn 1-2 bills từ warehouse
2. **Chọn Khách Hàng**: Chọn customer từ dropdown
3. **Nhập Profit %**: Ví dụ: 5% (5)
4. **Nhập Notes**: Ghi chú giao dịch
5. **Click "Tạo Giao Dịch Bán"**

#### **Expected Result:**
- ✅ Sale được tạo thành công
- ✅ Bill status chuyển từ `in_warehouse` → `pending_payment`
- ✅ Toast message: "Giao dịch bán bill thành công!"
- ✅ Sales list hiển thị sale mới với status `pending_payment`

### **3. Test Flow: Status Workflow**

#### **Step 3: Xác Nhận Thanh Toán**
1. **Tìm sale** với status `pending_payment`
2. **Click "Xác Nhận Thanh Toán"**
3. **Confirm action**

#### **Expected Result:**
- ✅ Sale status chuyển từ `pending_payment` → `paid`
- ✅ Bill status chuyển từ `pending_payment` → `paid`
- ✅ Toast message: "Xác nhận khách hàng đã thanh toán thành công!"
- ✅ Button "Hoàn Tất Giao Dịch" xuất hiện

#### **Step 4: Hoàn Tất Giao Dịch**
1. **Tìm sale** với status `paid`
2. **Click "Hoàn Tất Giao Dịch"**
3. **Confirm action**

#### **Expected Result:**
- ✅ Sale status chuyển từ `paid` → `completed`
- ✅ Bill status chuyển từ `paid` → `completed`
- ✅ Toast message: "Đã thanh lại cho khách hàng thành công!"
- ✅ Status hiển thị: "✓ Giao dịch đã hoàn tất"

### **4. Test Flow: Bill Warehouse Updates**

#### **Step 5: Kiểm Tra Bill Warehouse**
1. **Mở Bill Warehouse**: http://localhost:3002/bill-warehouse
2. **Kiểm tra stats cards**:
   - Tổng Bill: Tăng theo số bill đã bán
   - Chờ Thanh Toán: Bills với status `pending_payment`
   - Đã Thanh Toán: Bills với status `paid`
   - Hoàn Tất: Bills với status `completed`

#### **Expected Result:**
- ✅ Stats cards cập nhật real-time
- ✅ Bill status hiển thị đúng trong table
- ✅ Filtering theo status hoạt động

### **5. Test Flow: API Endpoints**

#### **Step 6: Test API Endpoints**
```bash
# 1. Get Sales List
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:5001/api/sales/

# 2. Confirm Payment
curl -X POST -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:5001/api/sales/1/confirm-payment

# 3. Complete Sale
curl -X POST -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:5001/api/sales/1/complete
```

### **6. Expected Database State**

#### **After Sale Creation:**
```sql
-- Sale record
INSERT INTO sales (customer_id, user_id, total_bill_amount, profit_percentage, status)
VALUES (1, 1, 100000, 5.00, 'pending_payment');

-- Bill status update
UPDATE bills SET status = 'pending_payment', sale_id = 1 WHERE id IN (1, 2);
```

#### **After Payment Confirmation:**
```sql
-- Sale status update
UPDATE sales SET status = 'paid', payment_status = true WHERE id = 1;

-- Bill status update
UPDATE bills SET status = 'paid' WHERE sale_id = 1;
```

#### **After Sale Completion:**
```sql
-- Sale status update
UPDATE sales SET status = 'completed' WHERE id = 1;

-- Bill status update
UPDATE bills SET status = 'completed' WHERE sale_id = 1;
```

### **7. Error Scenarios to Test**

#### **7.1 Invalid Status Transitions**
- ❌ Confirm payment cho sale `completed`
- ❌ Complete sale cho sale `pending_payment`
- ❌ Expected: Error message với status validation

#### **7.2 Missing Data**
- ❌ Create sale không có customer
- ❌ Create sale không có bills
- ❌ Expected: Validation error messages

#### **7.3 API Errors**
- ❌ Network timeout
- ❌ Database connection error
- ❌ Expected: Graceful error handling

### **8. Success Criteria**

#### **✅ Frontend:**
- Sale creation form hoạt động
- Status workflow buttons hiển thị đúng
- Real-time updates sau mỗi action
- Error handling và loading states

#### **✅ Backend:**
- API endpoints trả về đúng response
- Database updates thành công
- Status validation hoạt động
- Error handling đầy đủ

#### **✅ Integration:**
- Frontend-backend communication
- Data consistency giữa các components
- Status synchronization real-time

### **9. Next Steps After Testing**

#### **Phase 6: Reports & Analytics**
- Sales reports theo thời gian
- Profit tracking và charts
- Customer transaction history

#### **Phase 7: Automation**
- Auto-check bill payment status
- Auto-complete sales after confirmation
- Email/SMS notifications

---

## **🎯 TESTING CHECKLIST**

- [ ] **Sale Creation**: Tạo sale transaction thành công
- [ ] **Status Transition 1**: `pending_payment` → `paid`
- [ ] **Status Transition 2**: `paid` → `completed`
- [ ] **Bill Updates**: Bill status cập nhật đúng
- [ ] **UI Updates**: Frontend hiển thị real-time
- [ ] **Error Handling**: Validation và error messages
- [ ] **API Integration**: Backend endpoints hoạt động
- [ ] **Data Consistency**: Database state đúng

---

**🚀 Ready to test! Open http://localhost:3002/sales and follow the workflow!**
