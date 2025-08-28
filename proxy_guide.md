# Hướng dẫn sử dụng Proxy cho FPT Shop API

## 🤔 Tại sao cần Proxy?

### Vấn đề khi xử lý số lượng lớn:

1. **Rate Limiting**: API FPT Shop có giới hạn số request/phút từ cùng một IP
2. **reCAPTCHA**: Kích hoạt sau khi có quá nhiều request liên tiếp
3. **IP Blocking**: IP có thể bị block tạm thời hoặc vĩnh viễn
4. **Fingerprint Detection**: Phát hiện pattern request tự động

### Lợi ích của Proxy:

✅ **Phân tán traffic**: Chia request qua nhiều IP khác nhau  
✅ **Tránh rate limit**: Mỗi proxy có quota riêng  
✅ **Tăng throughput**: Xử lý song song nhiều request  
✅ **Backup**: Khi một proxy fail, chuyển sang proxy khác  
✅ **Ẩn danh**: Bảo vệ IP thật của bạn  

## 📊 Phân tích số lượng theo IP

### Không dùng Proxy (1 IP):
- **An toàn**: 10-20 request/giờ
- **Rủi ro**: 50-100 request/giờ
- **Nguy hiểm**: >100 request/giờ

### Dùng Proxy (nhiều IP):
- **10 proxy**: 100-200 request/giờ
- **50 proxy**: 500-1000 request/giờ
- **100 proxy**: 1000-2000 request/giờ

## 🛠️ Cách sử dụng ProxyAgent

### 1. Chuẩn bị danh sách Proxy

```python
proxy_list = [
    "http://username:password@proxy1.com:8080",
    "http://username:password@proxy2.com:8080",
    "socks5://proxy3.com:1080",
]
```

### 2. Khởi tạo ProxyAgent

```python
from proxy_agent import ProxyAgent

agent = ProxyAgent(proxy_list=proxy_list)
```

### 3. Xử lý đơn lẻ với retry

```python
result = agent.query_bill_with_retry("PB02020045937", max_retries=3)
```

### 4. Xử lý hàng loạt

```python
contracts = ["PB02020045937", "PB02020045938", ...]
results = agent.batch_query_with_proxy(contracts)
```

## 🌐 Các loại Proxy khuyên dùng

### 1. **Residential Proxy** (Tốt nhất)
- IP từ ISP thật
- Khó bị phát hiện
- Giá cao (~$10-50/GB)
- Providers: Bright Data, Oxylabs, Smartproxy

### 2. **Datacenter Proxy** (Cân bằng)
- IP từ datacenter
- Tốc độ nhanh
- Giá trung bình (~$1-10/GB)
- Providers: ProxyMesh, Storm Proxies

### 3. **Mobile Proxy** (Chuyên biệt)
- IP từ mạng di động
- Rất khó bị block
- Giá rất cao (~$50-200/GB)
- Providers: Airproxy, Mobile Proxies

## ⚙️ Cấu hình tối ưu

### Cho số lượng nhỏ (< 100 mã/ngày):
```python
settings = {
    "proxy_count": 5-10,
    "delay_range": [2, 5],
    "rotation_interval": 20,
    "max_retries": 3
}
```

### Cho số lượng trung bình (100-1000 mã/ngày):
```python
settings = {
    "proxy_count": 20-50,
    "delay_range": [1, 3],
    "rotation_interval": 15,
    "max_retries": 5
}
```

### Cho số lượng lớn (>1000 mã/ngày):
```python
settings = {
    "proxy_count": 50-100,
    "delay_range": [0.5, 2],
    "rotation_interval": 10,
    "max_retries": 3,
    "concurrent_workers": 5-10
}
```

## 🔧 Troubleshooting

### Proxy không hoạt động:
1. Kiểm tra format proxy đúng chưa
2. Test proxy bằng curl/wget
3. Kiểm tra username/password
4. Thử đổi protocol (http/socks5)

### Rate limit vẫn xảy ra:
1. Tăng delay giữa các request
2. Giảm số request/proxy
3. Thêm nhiều proxy hơn
4. Dùng residential proxy

### Success rate thấp:
1. Kiểm tra chất lượng proxy
2. Tăng số retry
3. Cải thiện fingerprint rotation
4. Thêm delay sau error

## 💡 Best Practices

1. **Luôn test proxy trước khi dùng**
2. **Monitor success rate và adjust**
3. **Backup nhiều provider proxy**
4. **Rotate User-Agent cùng với proxy**
5. **Log và analyze để optimize**
6. **Respect rate limits dù có proxy**
7. **Dùng delay random, không cố định**
8. **Implement circuit breaker cho proxy fail**

## 📈 Monitoring và Analytics

### Metrics cần theo dõi:
- Success rate per proxy
- Response time per proxy
- Error rate và error types
- Throughput (requests/hour)
- Cost per successful request

### Tools:
- Grafana + InfluxDB cho monitoring
- ELK Stack cho log analysis
- Custom dashboard cho business metrics

## 🚨 Lưu ý pháp lý

⚠️ **Quan trọng**: 
- Chỉ query các mã hợp đồng hợp lệ
- Không spam hoặc abuse API
- Tuân thủ Terms of Service của FPT Shop
- Sử dụng cho mục đích hợp pháp
- Respect robots.txt và rate limits

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs chi tiết
2. Test với ít proxy trước
3. Verify proxy quality
4. Adjust delay và retry settings
5. Contact proxy provider nếu cần