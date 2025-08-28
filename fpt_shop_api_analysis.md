# FPT Shop API Analysis - Thanh Toán Tiền Điện

## API Endpoint Chính

### URL
```
https://papi.fptshop.com.vn/gw/v1/public/bff-before-order/pis-online/paybill/query-partner
```

### Phương thức
- **Method**: POST

### Headers
```json
{
  "order-channel": "1",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### Request Body
```json
{
  "providerCode": "Payoo",
  "contractNumber": "PB02020040261",
  "sku": "00906815",
  "shopAddress": "string",
  "shopCode": "string",
  "employeeCode": "string"
}
```

### Mô tả
API này được sử dụng để tra cứu thông tin hóa đơn tiền điện thông qua mã hợp đồng.

### Tham số đầu vào
- `providerCode`: Mã nhà cung cấp thanh toán ("Payoo")
- `contractNumber`: Mã hợp đồng điện (ví dụ: "PB02020040261")
- `sku`: Mã sản phẩm/dịch vụ ("00906815")
- `shopAddress`: Địa chỉ shop (có thể để "string")
- `shopCode`: Mã shop (có thể để "string")
- `employeeCode`: Mã nhân viên (có thể để "string")

### Response Format

#### Successful Response
```json
{
  "success": true,
  "data": {
    "customerName": "NGÔ THƯƠNG",
    "contractNumber": "PB02020045937",
    "phoneNumber": "0123456789",
    "provider": "Điện Lực Miền Nam",
    "address": "123 Đường ABC, Quận XYZ, TP.HCM",
    "period": "08/2025",
    "status": "Chưa thanh toán",
    "amount": 660407,
    "serviceFee": 0,
    "totalAmount": 660407,
    "dueDate": "2025-08-31",
    "billDetails": {
      "previousReading": 1234,
      "currentReading": 1456,
      "consumption": 222,
      "unitPrice": 2973
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "CONTRACT_NOT_FOUND",
    "message": "Không tìm thấy hợp đồng",
    "details": "Mã hợp đồng không tồn tại hoặc đã hết hạn"
  }
}
```

### Dữ liệu phản hồi (từ thực tế)
API trả về thông tin hóa đơn bao gồm:
- **Tên khách hàng**: "NGÔ THƯƠNG"
- **Mã hợp đồng**: "PB02020045937"
- **Số điện thoại**: "0123456789"
- **Nhà cung cấp**: "Điện Lực Miền Nam"
- **Địa chỉ**: Thông tin địa chỉ khách hàng
- **Kỳ/tháng**: "08/2025"
- **Tình trạng**: "Chưa thanh toán"
- **Tiền cước**: "660,407 ₫"
- **Phí dịch vụ**: "0 ₫"
- **Tổng tiền**: "660,407 ₫"
```

## Cách thức hoạt động

1. **Input:** Người dùng nhập mã hợp đồng và số điện thoại
2. **API Call:** Hệ thống gọi API `query-partner` để tra cứu thông tin
3. **Response:** API trả về thông tin chi tiết hóa đơn
4. **Display:** Hiển thị thông tin hóa đơn cho người dùng

## Ghi chú kỹ thuật

- API được gọi nhiều lần liên tiếp (có thể do retry mechanism hoặc polling)
- Sử dụng phương thức POST với JSON payload
- Endpoint thuộc hệ thống gateway của FPT Shop
- Header `order-channel: "1"` có thể chỉ định kênh đặt hàng
- Không cần authentication đặc biệt (public endpoint)
- Response time trung bình: 500-2000ms
- Rate limit: Khoảng 10-20 requests/phút (ước tính)
- Hỗ trợ CORS cho cross-origin requests

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `CONTRACT_NOT_FOUND` | Không tìm thấy hợp đồng | Mã hợp đồng không tồn tại |
| `INVALID_FORMAT` | Định dạng không hợp lệ | Mã hợp đồng sai format |
| `SERVICE_UNAVAILABLE` | Dịch vụ tạm ngưng | API tạm thời không khả dụng |
| `RATE_LIMIT_EXCEEDED` | Vượt quá giới hạn | Quá nhiều requests |
| `CAPTCHA_REQUIRED` | Yêu cầu xác thực | Cần giải captcha |

## HTTP Status Codes

- `200 OK`: Request thành công
- `400 Bad Request`: Dữ liệu đầu vào không hợp lệ
- `429 Too Many Requests`: Vượt quá rate limit
- `500 Internal Server Error`: Lỗi server
- `503 Service Unavailable`: Dịch vụ tạm ngưng

## Khuyến nghị cho việc phát triển ứng dụng

### 1. Cách sử dụng API
```javascript
const response = await fetch('https://papi.fptshop.com.vn/gw/v1/public/bff-before-order/pis-online/paybill/query-partner', {
  method: 'POST',
  headers: {
    'order-channel': '1',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    providerCode: 'Payoo',
    contractNumber: 'PB02020040261', // Mã hợp đồng từ user
    sku: '00906815',
    shopAddress: 'string',
    shopCode: 'string',
    employeeCode: 'string'
  })
});

const data = await response.json();
```

### 2. Lưu ý quan trọng
- **Rate Limiting**: Cần chú ý về giới hạn số lượng request
- **Error Handling**: Cần xử lý các trường hợp lỗi từ API
- **Security**: Cần đảm bảo bảo mật thông tin khách hàng
- **Legal**: Cần xem xét về mặt pháp lý khi sử dụng API của bên thứ ba
- **CORS**: Có thể gặp vấn đề CORS khi gọi từ browser

### 3. Tham số cố định
- `providerCode`: Luôn là "Payoo"
- `sku`: Luôn là "00906815" (có thể là mã dịch vụ thanh toán tiền điện)
- Các tham số khác có thể để giá trị mặc định "string"

### 4. Best Practices
- **Retry Logic**: Implement exponential backoff cho failed requests
- **Caching**: Cache kết quả trong 5-10 phút để giảm load
- **Timeout**: Set timeout 10-15 giây cho mỗi request
- **User Agent**: Sử dụng realistic user agent strings
- **Proxy Rotation**: Sử dụng proxy khi xử lý số lượng lớn

### 5. Monitoring và Logging
- Log tất cả requests/responses để debug
- Monitor response time và success rate
- Track error patterns để optimize
- Alert khi detect rate limiting hoặc blocking

## Security Considerations

### 1. Data Privacy
- Không lưu trữ thông tin khách hàng lâu dài
- Encrypt sensitive data khi cần thiết
- Tuân thủ GDPR/PDPA về bảo vệ dữ liệu

### 2. API Usage
- Respect rate limits để tránh bị block
- Không abuse API với quá nhiều requests
- Sử dụng proxy có uy tín và hợp pháp

### 3. Legal Compliance
- Đảm bảo có quyền sử dụng API
- Tuân thủ Terms of Service của FPT Shop
- Không sử dụng cho mục đích thương mại trái phép

## Performance Optimization

### 1. Batch Processing
- Xử lý theo batch 10-50 contracts/lần
- Implement queue system cho large datasets
- Use worker threads/processes cho parallel processing

### 2. Caching Strategy
- Redis/Memcached cho session caching
- File-based cache cho static data
- TTL 5-10 minutes cho contract data

### 3. Database Design
```sql
CREATE TABLE contract_cache (
    contract_number VARCHAR(50) PRIMARY KEY,
    customer_data JSON,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_expires (expires_at)
);
```

## Integration Examples

### Python (Requests)
```python
import requests
import time
from typing import Dict, Optional

class FPTShopAPI:
    def __init__(self):
        self.base_url = "https://papi.fptshop.com.vn/gw/v1/public/bff-before-order/pis-online/paybill/query-partner"
        self.session = requests.Session()
        self.session.headers.update({
            'order-channel': '1',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def query_contract(self, contract_number: str) -> Optional[Dict]:
        payload = {
            "providerCode": "Payoo",
            "contractNumber": contract_number,
            "sku": "00906815",
            "shopAddress": "string",
            "shopCode": "string",
            "employeeCode": "string"
        }
        
        try:
            response = self.session.post(
                self.base_url,
                json=payload,
                timeout=15
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error querying contract {contract_number}: {e}")
            return None
    
    def batch_query(self, contract_numbers: list, delay: float = 1.0):
        results = []
        for contract in contract_numbers:
            result = self.query_contract(contract)
            if result:
                results.append(result)
            time.sleep(delay)  # Rate limiting
        return results
```

### Node.js (Axios)
```javascript
const axios = require('axios');

class FPTShopAPI {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://papi.fptshop.com.vn/gw/v1/public/bff-before-order/pis-online/paybill',
            headers: {
                'order-channel': '1',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 15000
        });
    }
    
    async queryContract(contractNumber) {
        try {
            const response = await this.client.post('/query-partner', {
                providerCode: 'Payoo',
                contractNumber,
                sku: '00906815',
                shopAddress: 'string',
                shopCode: 'string',
                employeeCode: 'string'
            });
            return response.data;
        } catch (error) {
            console.error(`Error querying contract ${contractNumber}:`, error.message);
            return null;
        }
    }
}
```