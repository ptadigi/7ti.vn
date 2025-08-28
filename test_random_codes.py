#!/usr/bin/env python3
from final_agent import FinalAgent
import random

# Danh sách mã hợp đồng
codes = [
    'PB02020063072', 'PB02020046419', 'PB02020046399', 'PB02020047339',
    'PB02020046572', 'PB02020055780', 'PB02020047177', 'PB02020055786',
    'PB02020073924', 'PB02020050868', 'PB02020073564', 'PB02020045956',
    'PB02020046571', 'PB02020046881', 'PB02020047246'
]

# Chọn ngẫu nhiên 5 mã để test
selected_codes = random.sample(codes, 5)
print(f"🎲 Testing {len(selected_codes)} random contract codes:")
print(f"📋 Selected codes: {', '.join(selected_codes)}")
print("=" * 60)

# Tạo agent và test
agent = FinalAgent()
results = []

for i, code in enumerate(selected_codes, 1):
    print(f"\n[{i}/{len(selected_codes)}] Testing: {code}")
    print("-" * 40)
    
    result = agent.query_bill(code, verbose=True)
    results.append({
        'code': code,
        'success': result['success'],
        'status_code': result.get('status_code', 'N/A'),
        'error': result.get('error', 'N/A') if not result['success'] else None
    })
    
    if result['success']:
        data = result['data']['data']
        print(f"✅ SUCCESS - Amount: {data.get('totalContractAmount', 'N/A')} VND")
        if 'bills' in data and data['bills']:
            bill = data['bills'][0]
            print(f"   Customer: {bill.get('customerName', 'N/A')}")
            print(f"   Month: {bill.get('month', 'N/A')}")
    else:
        print(f"❌ FAILED - {result.get('error', 'Unknown error')}")

print("\n" + "=" * 60)
print("📊 SUMMARY:")
print("=" * 60)
success_count = sum(1 for r in results if r['success'])
fail_count = len(results) - success_count

print(f"✅ Successful: {success_count}/{len(results)}")
print(f"❌ Failed: {fail_count}/{len(results)}")
print(f"📈 Success rate: {(success_count/len(results)*100):.1f}%")

print("\n📋 Detailed Results:")
for result in results:
    status = "✅" if result['success'] else "❌"
    print(f"  {status} {result['code']} - Status: {result['status_code']}")
    if not result['success'] and result['error']:
        print(f"      Error: {result['error']}")