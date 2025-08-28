#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proxy Agent cho xử lý số lượng lớn mã hợp đồng FPT Shop
Hỗ trợ proxy rotation và rate limiting
"""

import requests
import json
import random
import time
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from final_agent import FinalAgent

class ProxyAgent(FinalAgent):
    """Agent với hỗ trợ proxy cho xử lý số lượng lớn"""
    
    def __init__(self, proxy_list: List[str] = None):
        """
        Khởi tạo ProxyAgent
        
        Args:
            proxy_list: Danh sách proxy theo format:
                       ['http://user:pass@ip:port', 'socks5://ip:port', ...]
        """
        self.proxy_list = proxy_list or []
        self.current_proxy_index = 0
        self.proxy_failures = {}  # Track failed proxies
        self.request_count = 0
        self.last_request_time = 0
        
        # Khởi tạo với proxy đầu tiên (nếu có)
        current_proxy = self._get_next_proxy() if self.proxy_list else None
        super().__init__(proxy=current_proxy)
        
        print(f"🌐 ProxyAgent initialized with {len(self.proxy_list)} proxies")
    
    def _get_next_proxy(self) -> Optional[str]:
        """Lấy proxy tiếp theo từ danh sách"""
        if not self.proxy_list:
            return None
            
        # Tìm proxy khả dụng
        attempts = 0
        while attempts < len(self.proxy_list):
            proxy = self.proxy_list[self.current_proxy_index]
            
            # Kiểm tra proxy có bị fail quá nhiều không
            if proxy not in self.proxy_failures or self.proxy_failures[proxy] < 3:
                self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxy_list)
                return proxy
            
            self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxy_list)
            attempts += 1
        
        print("⚠️ All proxies have failed, using direct connection")
        return None
    
    def _mark_proxy_failed(self, proxy: str):
        """Đánh dấu proxy bị lỗi"""
        if proxy:
            self.proxy_failures[proxy] = self.proxy_failures.get(proxy, 0) + 1
            print(f"❌ Proxy failed: {proxy} (failures: {self.proxy_failures[proxy]})")
    
    def _rotate_proxy(self):
        """Chuyển sang proxy khác"""
        if not self.proxy_list:
            return
            
        new_proxy = self._get_next_proxy()
        if new_proxy != self.proxy:
            print(f"🔄 Rotating proxy: {new_proxy or 'Direct'}")
            self.proxy = new_proxy
            self._setup_session()  # Tạo lại session với proxy mới
    
    def _should_rotate_proxy(self) -> bool:
        """Kiểm tra có nên rotate proxy không"""
        # Rotate sau mỗi 10-20 requests
        if self.request_count > 0 and self.request_count % random.randint(10, 20) == 0:
            return True
        
        # Rotate nếu quá lâu không đổi (30-60 phút)
        if time.time() - self.last_request_time > random.randint(1800, 3600):
            return True
            
        return False
    
    def _adaptive_delay(self, is_error: bool = False) -> float:
        """Tính delay thích ứng dựa trên tình huống"""
        base_delay = 2.0
        
        if is_error:
            # Delay dài hơn khi gặp lỗi
            return random.uniform(10, 20)
        
        # Delay ngắn hơn khi dùng proxy
        if self.proxy:
            return random.uniform(1, 3)
        else:
            # Delay dài hơn khi không dùng proxy
            return random.uniform(3, 7)
    
    def query_bill_with_retry(self, contract_number: str, max_retries: int = 3, verbose: bool = True) -> Dict[str, Any]:
        """Query với retry và proxy rotation"""
        self.request_count += 1
        
        for attempt in range(max_retries):
            if verbose:
                proxy_info = self.proxy or "Direct"
                print(f"\n🔄 Attempt {attempt + 1}/{max_retries} - Proxy: {proxy_info}")
            
            # Rotate proxy nếu cần
            if attempt > 0 or self._should_rotate_proxy():
                self._rotate_proxy()
            
            # Thực hiện request
            result = self.query_bill(contract_number, verbose=verbose)
            
            if result['success']:
                self.last_request_time = time.time()
                return result
            
            # Xử lý lỗi
            status_code = result.get('status_code', 0)
            error = result.get('error', '')
            
            if status_code == 400 and 'reCAPTCHA' in str(result.get('raw_response', '')):
                print("🤖 reCAPTCHA detected, rotating proxy...")
                if self.proxy:
                    self._mark_proxy_failed(self.proxy)
                self._rotate_proxy()
                delay = self._adaptive_delay(is_error=True)
                print(f"⏰ Waiting {delay:.1f}s before retry...")
                time.sleep(delay)
            elif status_code in [403, 429, 503]:  # Rate limiting or blocking
                print(f"🚫 Rate limited (HTTP {status_code}), rotating proxy...")
                if self.proxy:
                    self._mark_proxy_failed(self.proxy)
                self._rotate_proxy()
                delay = self._adaptive_delay(is_error=True)
                print(f"⏰ Waiting {delay:.1f}s before retry...")
                time.sleep(delay)
            else:
                # Lỗi khác, delay ngắn hơn
                delay = self._adaptive_delay()
                print(f"⏰ Waiting {delay:.1f}s before retry...")
                time.sleep(delay)
        
        return {
            'success': False,
            'error': f'Failed after {max_retries} attempts',
            'status_code': 0,
            'data': None
        }
    
    def batch_query_with_proxy(self, contracts: List[str], max_workers: int = 1, verbose: bool = True) -> List[Dict[str, Any]]:
        """Xử lý batch với proxy rotation"""
        results = []
        successful = 0
        failed = 0
        
        print(f"🚀 Starting batch processing: {len(contracts)} contracts")
        print(f"🌐 Available proxies: {len(self.proxy_list)}")
        print("=" * 60)
        
        for i, contract in enumerate(contracts):
            print(f"\n📋 Processing {i+1}/{len(contracts)}: {contract}")
            print("-" * 50)
            
            # Query với retry
            result = self.query_bill_with_retry(contract, verbose=verbose)
            results.append({
                'contract': contract,
                'result': result,
                'timestamp': datetime.now().isoformat()
            })
            
            if result['success']:
                successful += 1
                if verbose:
                    data = result['data']['data']
                    amount = data['totalContractAmount']
                    customer = data['bills'][0]['customerName'] if data['bills'] else 'N/A'
                    print(f"✅ Success: {customer} - {amount:,} VND")
            else:
                failed += 1
                print(f"❌ Failed: {result['error']}")
            
            # Delay giữa các request
            if i < len(contracts) - 1:
                delay = self._adaptive_delay()
                print(f"⏳ Waiting {delay:.1f}s before next request...")
                time.sleep(delay)
        
        # Tổng kết
        print("\n" + "=" * 60)
        print("📊 BATCH PROCESSING RESULTS")
        print("=" * 60)
        print(f"✅ Successful: {successful}/{len(contracts)} ({successful/len(contracts)*100:.1f}%)")
        print(f"❌ Failed: {failed}/{len(contracts)} ({failed/len(contracts)*100:.1f}%)")
        print(f"🌐 Proxy failures: {dict(self.proxy_failures)}")
        
        # Lưu kết quả
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"batch_results_{timestamp}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'summary': {
                    'total': len(contracts),
                    'successful': successful,
                    'failed': failed,
                    'success_rate': successful/len(contracts)*100,
                    'proxy_failures': dict(self.proxy_failures),
                    'timestamp': datetime.now().isoformat()
                },
                'results': results
            }, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Results saved to: {filename}")
        return results

def demo_proxy_usage():
    """Demo sử dụng proxy agent"""
    print("🚀 Proxy Agent Demo")
    print("=" * 50)
    
    # Danh sách proxy mẫu (thay bằng proxy thật)
    proxy_list = [
        # "http://username:password@proxy1.example.com:8080",
        # "http://username:password@proxy2.example.com:8080",
        # "socks5://proxy3.example.com:1080",
    ]
    
    if not proxy_list:
        print("⚠️ No proxies configured, using direct connection")
        print("💡 Add proxies to proxy_list for better performance")
    
    # Tạo agent
    agent = ProxyAgent(proxy_list=proxy_list)
    
    # Test contracts
    test_contracts = [
        "PB02020045937",
        # Thêm các mã khác để test
    ]
    
    # Chạy batch
    results = agent.batch_query_with_proxy(test_contracts, verbose=True)
    
    return results

def create_proxy_config_template():
    """Tạo file config mẫu cho proxy"""
    config = {
        "proxies": [
            {
                "type": "http",
                "host": "proxy1.example.com",
                "port": 8080,
                "username": "your_username",
                "password": "your_password",
                "note": "Proxy provider 1"
            },
            {
                "type": "socks5",
                "host": "proxy2.example.com",
                "port": 1080,
                "username": "",
                "password": "",
                "note": "Proxy provider 2"
            }
        ],
        "settings": {
            "max_retries": 3,
            "rotation_interval": 15,
            "delay_range": [1, 3],
            "error_delay_range": [10, 20]
        }
    }
    
    with open("proxy_config.json", 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("📝 Created proxy_config.json template")
    print("💡 Edit this file with your actual proxy details")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "config":
            create_proxy_config_template()
        elif sys.argv[1] == "demo":
            demo_proxy_usage()
        else:
            print("Usage: python3 proxy_agent.py [config|demo]")
    else:
        demo_proxy_usage()