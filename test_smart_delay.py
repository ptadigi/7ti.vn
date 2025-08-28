#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script cho hệ thống delay thông minh
"""

from final_agent import FinalAgent
import time

def test_smart_delay_system():
    """Test hệ thống delay thông minh"""
    print("🚀 Testing Smart Delay System")
    print("=" * 60)
    
    # Khởi tạo agent
    agent = FinalAgent()
    
    # Danh sách mã hợp đồng để test
    test_contracts = [
        "PB02020046419",
        "PB02020046399", 
        "PB02020047339",
        "PB02020046572"
    ]
    
    print(f"📋 Testing with {len(test_contracts)} contracts")
    print(f"⏰ Initial delay multiplier: {agent.delay_multiplier:.1f}x")
    print(f"📊 Initial rate limit: {agent.max_requests_per_hour}/hour")
    print("=" * 60)
    
    results = []
    start_time = time.time()
    
    for i, contract in enumerate(test_contracts):
        print(f"\n📋 Processing {i+1}/{len(test_contracts)}: {contract}")
        print("-" * 50)
        
        # Query hợp đồng
        result = agent.query_bill(contract, verbose=True)
        results.append(result)
        
        # Thống kê
        success_count = len([r for r in results if r['success']])
        print(f"📊 Progress: {i+1}/{len(test_contracts)} - Success: {success_count}")
        print(f"📊 Current multiplier: {agent.delay_multiplier:.1f}x")
        print(f"📊 Rate limit: {agent.max_requests_per_hour}/hour")
        
        if i < len(test_contracts) - 1:
            print("⏳ Waiting for next request...")
            print("-" * 50)
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # Tổng kết
    print("\n" + "=" * 60)
    print("🎉 TEST COMPLETED!")
    print("=" * 60)
    print(f"⏱️ Total time: {total_time:.1f}s")
    print(f"📊 Total requests: {agent.request_count}")
    print(f"📊 Final multiplier: {agent.delay_multiplier:.1f}x")
    print(f"📊 Final rate limit: {agent.max_requests_per_hour}/hour")
    print(f"✅ Successful: {len([r for r in results if r['success']])}")
    print(f"❌ Failed: {len([r for r in results if not r['success']])}")
    
    # Chi tiết kết quả
    print("\n📋 DETAILED RESULTS:")
    print("-" * 60)
    for i, result in enumerate(results):
        contract = test_contracts[i]
        status = "✅" if result['success'] else "❌"
        error = result.get('error', 'Success')
        print(f"{i+1}. {status} {contract}: {error}")
    
    return results

def test_rate_limiting():
    """Test rate limiting system"""
    print("\n\n🧪 Testing Rate Limiting System")
    print("=" * 60)
    
    agent = FinalAgent()
    
    # Test với nhiều request liên tiếp
    print("📊 Testing rate limiting with multiple requests...")
    
    for i in range(5):
        print(f"\n🔄 Request {i+1}/5")
        print(f"📊 Current rate: {len(agent.hourly_requests)}/{agent.max_requests_per_hour}")
        
        # Simulate request
        agent._record_request()
        
        # Test delay calculation
        delay = agent._calculate_delay()
        print(f"⏰ Calculated delay: {delay:.1f}s")
        
        # Small delay để test
        time.sleep(0.1)
    
    print(f"\n📊 Final rate: {len(agent.hourly_requests)}/{agent.max_requests_per_hour}")

if __name__ == "__main__":
    # Test hệ thống delay thông minh
    results = test_smart_delay_system()
    
    # Test rate limiting
    test_rate_limiting()
    
    print("\n🎯 Smart delay system test completed!")
    print("💡 The system automatically adjusts delays based on:")
    print("   - Number of recent requests")
    print("   - Error patterns")
    print("   - Rate limiting")
    print("   - Bot detection responses")
