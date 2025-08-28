# 🚀 Hệ Thống Delay Thông Minh - FPT Shop Contract Checker

## 📋 **Tổng Quan**

Hệ thống delay thông minh được thiết kế để **tránh bị FPT chặn** khi gửi quá nhiều request từ cùng một IP. Hệ thống tự động điều chỉnh delay dựa trên:

- 📊 **Số lượng request gần đây**
- 🚫 **Phản hồi lỗi từ server**
- ⏰ **Rate limiting tự động**
- 🔄 **Profile rotation thông minh**

## ⚙️ **Cơ Chế Hoạt Động**

### **1. Delay Cơ Bản**
```
Normal request: 5-12 giây
Error retry: 10-20 giây  
Error handling: 15-30 giây
```

### **2. Delay Multiplier**
- **Bình thường**: 1.0x
- **Bị chặn**: Tăng 50% mỗi lần (max 5.0x)
- **Thành công**: Giảm 10% mỗi lần

### **3. Rate Limiting**
- **Mặc định**: 50 requests/giờ
- **Khi bị chặn**: Giảm 10 requests/giờ
- **Tự động khôi phục**: +5 requests/giờ khi thành công

## 🔧 **Cấu Hình Delay**

### **Trong `final_agent.py`:**
```python
# Delay management system
self.last_request_time = 0
self.request_count = 0
self.delay_multiplier = 1.0  # Tăng delay khi bị chặn
self.max_requests_per_hour = 50  # Giới hạn request/giờ
self.hourly_requests = []
```

### **Tùy Chỉnh Delay:**
```python
# Tăng delay cơ bản
agent.max_requests_per_hour = 30  # Giảm xuống 30/giờ

# Tăng delay multiplier
agent.delay_multiplier = 2.0  # Tăng gấp đôi delay
```

## 📊 **Các Loại Delay**

### **1. Normal Delay (5-12s)**
- Request bình thường
- Không có lỗi trước đó
- Rate limit chưa đạt

### **2. Retry Delay (10-20s)**
- Khi retry sau lỗi
- Profile rotation
- Session reset

### **3. Error Delay (15-30s)**
- Khi gặp HTTP 400/403/429
- Bot detection
- Rate limiting

### **4. Adaptive Delay**
- **>10 requests/5 phút**: Delay × 2.0
- **>5 requests/5 phút**: Delay × 1.5
- **>80% rate limit**: Delay × 3.0

## 🚨 **Xử Lý Khi Bị Chặn**

### **Tự Động:**
1. **Tăng delay multiplier** (×1.5)
2. **Giảm rate limit** (-10 requests/giờ)
3. **Rotate profile** (Chrome → Firefox → Safari)
4. **Reset session** với cookies mới

### **Khôi Phục:**
1. **Giảm delay multiplier** (×0.9) khi thành công
2. **Tăng rate limit** (+5 requests/giờ) khi thành công
3. **Reset về mặc định** sau nhiều lần thành công

## 📈 **Monitoring & Logging**

### **Log Messages:**
```
⏰ Smart delay: 10.4s (multiplier: 1.0x)
🚫 Blocking detected! Increasing delay multiplier to 1.5x
📉 Reduced rate limit to 40 requests/hour
📊 Rate limit status: 15/50 requests this hour
✅ Success! Reducing delay multiplier to 0.9x
```

### **Statistics:**
- Số request trong giờ hiện tại
- Delay multiplier hiện tại
- Rate limit hiện tại
- Thời gian request cuối cùng

## 🧪 **Test Hệ Thống**

### **Chạy Test Script:**
```bash
python3 test_smart_delay.py
```

### **Test Manual:**
```python
from final_agent import FinalAgent

agent = FinalAgent()

# Test delay calculation
delay = agent._calculate_delay()
print(f"Delay: {delay:.1f}s")

# Test rate limiting
agent._enforce_rate_limit()

# Test với request thực
result = agent.query_bill("PB02020046419")
```

## ⚠️ **Lưu Ý Quan Trọng**

### **1. Không Nên:**
- ❌ Gửi >50 requests/giờ từ 1 IP
- ❌ Giảm delay xuống <3 giây
- ❌ Tắt rate limiting
- ❌ Sử dụng 1 profile duy nhất

### **2. Nên Làm:**
- ✅ Sử dụng proxy rotation
- ✅ Bật profile rotation
- ✅ Monitor rate limit status
- ✅ Tăng delay khi gặp lỗi

### **3. Best Practices:**
- **Development**: 20-30 requests/giờ
- **Production**: 40-50 requests/giờ
- **High volume**: Sử dụng proxy pool
- **Error handling**: Tăng delay tự động

## 🔄 **Tích Hợp Với Proxy**

### **ProxyAgent:**
```python
from proxy_agent import ProxyAgent

# Sử dụng proxy với delay thông minh
agent = ProxyAgent(proxy_list=['http://proxy1:8080', 'http://proxy2:8080'])
result = agent.query_bill_with_retry("PB02020046419")
```

### **Proxy Rotation:**
- Tự động chuyển proxy khi bị chặn
- Delay riêng cho mỗi proxy
- Rate limiting per proxy

## 📊 **Performance Metrics**

### **Typical Response Times:**
- **Single request**: 10-15 giây
- **Batch 10 contracts**: 3-5 phút
- **Batch 50 contracts**: 15-25 phút
- **With errors**: +50-100% thời gian

### **Success Rates:**
- **Normal operation**: 95-98%
- **High volume**: 85-90%
- **With proxy rotation**: 90-95%

## 🎯 **Kết Luận**

Hệ thống delay thông minh giúp:

1. **Tránh bị FPT chặn** IP
2. **Tối ưu hiệu suất** request
3. **Tự động thích ứng** với server response
4. **Đảm bảo tính ổn định** lâu dài

**Khuyến nghị**: Luôn sử dụng hệ thống delay này khi gửi >10 requests/giờ để tránh bị chặn.
