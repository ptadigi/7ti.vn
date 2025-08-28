#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import random
import time
import hashlib
import uuid
import gzip
import io
from datetime import datetime
from typing import Dict, Any, Optional
import urllib3
from urllib.parse import urlencode
import warnings
from profile_manager import ProfileManager

# Tắt SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

class FinalAgent:
    """Agent giả lập hoàn chỉnh với dấu vân tay và cookie như người thật"""
    
    def __init__(self, proxy: Optional[str] = None, use_profile_rotation: bool = True):
        """Khởi tạo agent với proxy tùy chọn và profile rotation"""
        self.proxy = proxy
        self.use_profile_rotation = use_profile_rotation
        self.session = requests.Session()
        
        # Initialize profile manager
        if use_profile_rotation:
            self.profile_manager = ProfileManager()
            self.current_profile = self.profile_manager.select_profile()
            self.fingerprint = self.profile_manager.get_profile_fingerprint(self.current_profile)
        else:
            self.profile_manager = None
            self.current_profile = None
            self.fingerprint = self._generate_fingerprint()
        
        self.cookies = {}
        self._setup_session()
        
        # Delay management system
        self.last_request_time = 0
        self.request_count = 0
        self.delay_multiplier = 1.0  # Tăng delay khi bị chặn
        self.max_requests_per_hour = 50  # Giới hạn request/giờ
        self.hourly_requests = []
        
        print(f"🤖 FinalAgent initialized")
        print(f"🌐 Proxy: {proxy or 'Direct connection'}")
        if self.current_profile:
            print(f"👤 Profile: {self.current_profile['name']} ({self.current_profile['id']})")
        print(f"🖥️  Platform: {self.fingerprint['platform']}")
        print(f"🔧 Browser: {self.fingerprint['browser']} {self.fingerprint['version']}")
        print(f"⏰ Delay system: Max {self.max_requests_per_hour} requests/hour")
    
    def _generate_fingerprint(self) -> Dict[str, Any]:
        """Tạo browser fingerprint thực tế với đầy đủ thông tin"""
        browsers = [
            {
                "name": "Chrome",
                "version": f"120.0.{random.randint(6000, 6099)}.{random.randint(100, 199)}",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
                "sec_ch_ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "sec_ch_ua_platform": "Windows",
                "platform": "Win32"
            },
            {
                "name": "Chrome",
                "version": f"120.0.{random.randint(6000, 6099)}.{random.randint(100, 199)}",
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
                "sec_ch_ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "sec_ch_ua_platform": "macOS",
                "platform": "MacIntel"
            },
            {
                "name": "Firefox",
                "version": f"121.0",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                "sec_ch_ua": None,
                "sec_ch_ua_platform": None,
                "platform": "Win32"
            }
        ]
        
        browser = random.choice(browsers)
        
        # Screen resolution phổ biến
        resolutions = [
            (1920, 1080), (1366, 768), (1536, 864), (1440, 900),
            (1600, 900), (1280, 720), (1920, 1200), (2560, 1440)
        ]
        width, height = random.choice(resolutions)
        
        # Timezone phổ biến ở Việt Nam
        timezones = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Jakarta"]
        
        return {
            "browser": browser["name"],
            "version": browser["version"],
            "user_agent": browser["user_agent"].format(version=browser["version"]),
            "sec_ch_ua": browser["sec_ch_ua"],
            "sec_ch_ua_platform": browser["sec_ch_ua_platform"],
            "platform": browser["platform"],
            "screen_width": width,
            "screen_height": height,
            "color_depth": random.choice([24, 32]),
            "timezone": random.choice(timezones),
            "language": random.choice(["vi-VN", "vi", "en-US"]),
            "canvas_fingerprint": hashlib.md5(str(random.random()).encode()).hexdigest()[:16],
            "webgl_vendor": random.choice(["Google Inc.", "Mozilla", "WebKit"]),
            "webgl_renderer": random.choice(["ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)", "WebKit WebGL"])
        }
    
    def _calculate_delay(self, is_error: bool = False, is_retry: bool = False) -> float:
        """Tính toán delay thông minh dựa trên tình huống"""
        current_time = time.time()
        
        # Clean up old requests (older than 1 hour)
        self.hourly_requests = [req_time for req_time in self.hourly_requests 
                               if current_time - req_time < 3600]
        
        # Base delay
        if is_error:
            base_delay = random.uniform(15.0, 30.0)  # Delay dài khi gặp lỗi
        elif is_retry:
            base_delay = random.uniform(10.0, 20.0)  # Delay trung bình khi retry
        else:
            base_delay = random.uniform(5.0, 12.0)   # Delay cơ bản
        
        # Tăng delay nếu đã gửi nhiều request gần đây
        recent_requests = len([req_time for req_time in self.hourly_requests 
                              if current_time - req_time < 300])  # 5 phút gần đây
        
        if recent_requests > 10:
            base_delay *= 2.0  # Tăng gấp đôi nếu > 10 request/5 phút
        elif recent_requests > 5:
            base_delay *= 1.5  # Tăng 50% nếu > 5 request/5 phút
        
        # Tăng delay nếu đã gửi nhiều request trong giờ
        if len(self.hourly_requests) > self.max_requests_per_hour * 0.8:
            base_delay *= 3.0  # Tăng gấp 3 nếu gần đạt giới hạn
        
        # Áp dụng delay multiplier (tăng khi bị chặn)
        final_delay = base_delay * self.delay_multiplier
        
        # Giới hạn delay tối đa
        final_delay = min(final_delay, 120.0)  # Max 2 phút
        
        return final_delay
    
    def _enforce_rate_limit(self):
        """Kiểm tra và thực thi rate limiting"""
        current_time = time.time()
        
        # Clean up old requests
        self.hourly_requests = [req_time for req_time in self.hourly_requests 
                               if current_time - req_time < 3600]
        
        # Kiểm tra giới hạn request/giờ
        if len(self.hourly_requests) >= self.max_requests_per_hour:
            oldest_request = min(self.hourly_requests)
            wait_time = 3600 - (current_time - oldest_request)
            if wait_time > 0:
                print(f"⏰ Rate limit reached. Waiting {wait_time:.1f}s until next hour...")
                time.sleep(wait_time)
                self.hourly_requests = []  # Reset sau khi chờ
        
        # Kiểm tra delay tối thiểu giữa các request
        if self.last_request_time > 0:
            time_since_last = current_time - self.last_request_time
            min_delay = 3.0  # Delay tối thiểu 3 giây
            
            if time_since_last < min_delay:
                wait_time = min_delay - time_since_last
                print(f"⏰ Enforcing minimum delay: waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
    
    def _record_request(self):
        """Ghi lại thời gian request để tính rate limiting"""
        current_time = time.time()
        self.hourly_requests.append(current_time)
        self.last_request_time = current_time
        self.request_count += 1
        
        # Log rate limit status
        if self.request_count % 10 == 0:  # Log mỗi 10 request
            print(f"📊 Rate limit status: {len(self.hourly_requests)}/{self.max_requests_per_hour} requests this hour")
    
    def _increase_delay_on_blocking(self):
        """Tăng delay khi bị chặn"""
        self.delay_multiplier = min(self.delay_multiplier * 1.5, 5.0)  # Tăng 50%, max 5x
        print(f"🚫 Blocking detected! Increasing delay multiplier to {self.delay_multiplier:.1f}x")
        
        # Tăng giới hạn request/giờ
        self.max_requests_per_hour = max(self.max_requests_per_hour - 10, 20)
        print(f"📉 Reduced rate limit to {self.max_requests_per_hour} requests/hour")
    
    def _reset_delay_on_success(self):
        """Reset delay khi request thành công"""
        if self.delay_multiplier > 1.0:
            self.delay_multiplier = max(self.delay_multiplier * 0.9, 1.0)  # Giảm 10%
            print(f"✅ Success! Reducing delay multiplier to {self.delay_multiplier:.1f}x")
        
        # Khôi phục giới hạn request/giờ
        if self.max_requests_per_hour < 50:
            self.max_requests_per_hour = min(self.max_requests_per_hour + 5, 50)
            print(f"📈 Restored rate limit to {self.max_requests_per_hour} requests/hour")
    
    def _setup_session(self):
        """Thiết lập session với headers và cookies thực tế"""
        if self.proxy:
            self.session.proxies = {'http': self.proxy, 'https': self.proxy}
        
        # Headers cơ bản giống browser thật
        headers = {
            "User-Agent": self.fingerprint["user_agent"],
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8,en-US;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }
        
        # Thêm headers cho Chrome
        if self.fingerprint["browser"] == "Chrome" and self.fingerprint.get("sec_ch_ua"):
            headers.update({
                "sec-ch-ua": self.fingerprint["sec_ch_ua"],
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": f'"{self.fingerprint.get("sec_ch_ua_platform", "Windows")}"'
            })
        
        self.session.headers.update(headers)
        
        # Tạo cookies thực tế
        self._generate_cookies()
    
    def _generate_cookies(self):
        """Tạo cookies như browser thật với timestamp và session tracking"""
        timestamp = int(time.time())
        session_id = str(uuid.uuid4()).replace('-', '')
        client_id = f"{random.randint(100000000, 999999999)}.{timestamp}"
        
        cookies = {
            # Google Analytics
            "_ga": f"GA1.2.{client_id}",
            "_gid": f"GA1.2.{random.randint(100000000, 999999999)}",
            "_gat": "1",
            
            # Session tracking
            "session_id": session_id[:32],
            "device_id": str(uuid.uuid4()),
            "visitor_id": hashlib.sha256(f"{session_id}{timestamp}".encode()).hexdigest()[:16],
            
            # FPT Shop specific
            "fpt_session": hashlib.md5(f"{timestamp}{session_id}".encode()).hexdigest(),
            "cart_id": str(uuid.uuid4()),
            
            # Browser fingerprint
            "screen_resolution": f"{self.fingerprint.get('screen_width', 1920)}x{self.fingerprint.get('screen_height', 1080)}",
            "timezone_offset": str(random.choice([-420, -480, -540])),  # GMT+7, GMT+8, GMT+9
            
            # Tracking
            "first_visit": str(timestamp),
            "last_activity": str(timestamp),
            "page_views": str(random.randint(1, 5))
        }
        
        # Set cookies với domain và path thích hợp
        for name, value in cookies.items():
            self.session.cookies.set(name, value, domain=".fptshop.com.vn", path="/")
    
    def _decode_response(self, response) -> str:
        """Decode response content, xử lý gzip, deflate và brotli encoding"""
        content = response.content
        
        # Kiểm tra encoding
        encoding = response.headers.get('content-encoding', '').lower()
        
        if encoding == 'gzip':
            try:
                # Decode gzip
                content = gzip.decompress(content)
            except Exception as e:
                print(f"⚠️ Gzip decode error: {e}")
                return response.text
        elif encoding == 'deflate':
            try:
                import zlib
                content = zlib.decompress(content)
            except Exception as e:
                print(f"⚠️ Deflate decode error: {e}")
                return response.text
        elif encoding == 'br':
            try:
                import brotli
                content = brotli.decompress(content)
            except ImportError:
                print("⚠️ Brotli library not installed. Installing...")
                import subprocess
                subprocess.check_call(["pip3", "install", "brotli"])
                import brotli
                content = brotli.decompress(content)
            except Exception as e:
                print(f"⚠️ Brotli decode error: {e}")
                return response.text
        
        # Decode to string
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return content.decode('latin-1')
            except:
                return str(content)
    
    def generate_phone(self) -> str:
        """Tạo số điện thoại Việt Nam hợp lệ"""
        # Đầu số di động Việt Nam
        prefixes = [
            # Viettel
            '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039',
            # Vinaphone  
            '088', '091', '094', '083', '084', '085', '081', '082',
            # Mobifone
            '089', '090', '093', '070', '079', '077', '076', '078',
            # Vietnamobile
            '092', '056', '058',
            # Gmobile
            '099', '059'
        ]
        
        prefix = random.choice(prefixes)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(7)])
        return prefix + suffix
    
    def _simulate_human_behavior(self):
        """Giả lập hành vi người dùng với delay thông minh"""
        # Enforce rate limiting trước khi gửi request
        self._enforce_rate_limit()
        
        # Tính toán delay thông minh
        delay = self._calculate_delay()
        print(f"⏰ Smart delay: {delay:.1f}s (multiplier: {self.delay_multiplier:.1f}x)")
        time.sleep(delay)
        
        # Update cookies timestamp
        timestamp = int(time.time())
        self.session.cookies.set("last_activity", str(timestamp), domain=".fptshop.com.vn")
        
        # Random page views
        current_views = int(self.session.cookies.get("page_views", "1"))
        self.session.cookies.set("page_views", str(current_views + 1), domain=".fptshop.com.vn")
    
    def _reset_session_if_blocked(self):
        """Reset session khi bị chặn"""
        print("🔄 Resetting session due to blocking...")
        
        # Record error for current profile
        if self.profile_manager and self.current_profile:
            self.profile_manager.record_error(self.current_profile['id'], 'blocked')
        
        # Rotate to new profile if using profile rotation
        if self.use_profile_rotation and self.profile_manager:
            self.current_profile = self.profile_manager.select_profile(force_new=True)
            if self.current_profile:
                self.fingerprint = self.profile_manager.get_profile_fingerprint(self.current_profile)
                print(f"👤 Switched to profile: {self.current_profile['name']} ({self.current_profile['id']})")
        else:
            # Tạo fingerprint mới nếu không dùng profile rotation
            self.fingerprint = self._generate_fingerprint()
        
        # Tạo session mới
        self.session = requests.Session()
        self._setup_session()
        
        # Thử đổi proxy nếu có
        self._rotate_proxy_if_available()
        
        # Delay dài hơn sau khi reset
        time.sleep(random.uniform(10.0, 20.0))
    
    def _rotate_proxy_if_available(self):
        """Rotate to next available proxy if possible"""
        try:
            # Nếu có proxy config file, thử load proxy khác
            import json
            import os
            
            proxy_config_path = os.path.join(os.path.dirname(__file__), 'proxy_config.json')
            if os.path.exists(proxy_config_path):
                with open(proxy_config_path, 'r') as f:
                    proxy_config = json.load(f)
                
                if 'proxies' in proxy_config and len(proxy_config['proxies']) > 1:
                    # Tìm proxy khác với proxy hiện tại
                    available_proxies = [p for p in proxy_config['proxies'] if p.get('enabled', True)]
                    
                    if len(available_proxies) > 1:
                        current_proxy_url = None
                        if self.proxy:
                            current_proxy_url = self.proxy
                        
                        for proxy_info in available_proxies:
                            proxy_url = f"http://{proxy_info['host']}:{proxy_info['port']}"
                            if proxy_url != current_proxy_url:
                                print(f"🔄 Switching to proxy: {proxy_info['host']}:{proxy_info['port']}")
                                self.proxy = proxy_url
                                break
                    else:
                        print("⚠️ No alternative proxy available, using direct connection")
                        self.proxy = None
            else:
                print("⚠️ No proxy config found, continuing with current setup")
                
        except Exception as e:
            print(f"⚠️ Error rotating proxy: {e}")
            # Fallback to no proxy
            self.proxy = None
    
    def query_bill(self, contract_number: str, phone_number: str = None, verbose: bool = True, max_retries: int = 3) -> Dict[str, Any]:
        """Query hóa đơn với xử lý response hoàn chỉnh và retry mechanism"""
        url = "https://papi.fptshop.com.vn/gw/v1/public/bff-before-order/pis-online/paybill/query-partner"
        
        if phone_number is None:
            phone_number = self.generate_phone()
        
        # Headers cho request cụ thể - giống người dùng thật hơn
        request_headers = {
            "order-channel": "1",
            "Content-Type": "application/json",
            "Origin": "https://fptshop.com.vn",
            "Referer": "https://fptshop.com.vn/dich-vu/thanh-toan-tien-dien",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site"
        }
        
        payload = {
            "providerCode": "Payoo",
            "contractNumber": contract_number,
            "sku": "00906815",
            "shopAddress": "string",
            "shopCode": "string", 
            "employeeCode": "string"
        }
        
        for attempt in range(max_retries):
            try:
                # Check if we should rotate profile
                if self.use_profile_rotation and self.profile_manager:
                    new_profile = self.profile_manager.select_profile()
                    if new_profile and new_profile['id'] != (self.current_profile['id'] if self.current_profile else None):
                        self.current_profile = new_profile
                        self.fingerprint = self.profile_manager.get_profile_fingerprint(self.current_profile)
                        print(f"🔄 Auto-rotated to profile: {self.current_profile['name']} ({self.current_profile['id']})")
                        # Reset session with new profile
                        self.session = requests.Session()
                        self._setup_session()
                
                if verbose:
                    print(f"🤖 Agent: {self.fingerprint.get('browser', 'Unknown')} {self.fingerprint.get('version', 'Unknown')} (Attempt {attempt + 1}/{max_retries})")
                    print(f"🖥️  Platform: {self.fingerprint.get('platform', 'Unknown')}")
                    print(f"📱 Phone: {phone_number}")
                    print(f"🔍 Contract: {contract_number}")
                    print(f"🌐 Proxy: {self.proxy or 'Direct'}")
                    if self.current_profile:
                        print(f"👤 Profile: {self.current_profile['name']} ({self.current_profile['id']})")
                    print(f"🍪 Cookies: {len(self.session.cookies)} items")
                
                # Record request for current profile
                if self.profile_manager and self.current_profile:
                    self.profile_manager.record_request(self.current_profile['id'])
                
                # Giả lập hành vi người dùng
                self._simulate_human_behavior()
                
                # Ghi lại request để tính rate limiting
                self._record_request()
                
                response = self.session.post(
                    url,
                    headers=request_headers,
                    json=payload,
                    timeout=30
                )
                
                if verbose:
                    print(f"📊 Status: {response.status_code}")
                    print(f"📏 Size: {len(response.content)} bytes")
                    print(f"📋 Content-Type: {response.headers.get('content-type', 'unknown')}")
                    print(f"🗜️  Encoding: {response.headers.get('content-encoding', 'none')}")
                
                # Xử lý response
                if response.status_code == 200:
                    # Decode response content
                    decoded_content = self._decode_response(response)
                    
                    if verbose:
                        print(f"📄 Decoded content preview: {decoded_content[:100]}...")
                    
                    # Parse JSON
                    try:
                        result = json.loads(decoded_content)
                        if verbose:
                            print("✅ JSON response parsed successfully!")
                        
                        # Reset delay khi thành công
                        self._reset_delay_on_success()
                        
                        return {
                            "success": True,
                            "data": result,
                            "contract_number": contract_number,
                            "phone_number": phone_number,
                            "status_code": response.status_code,
                            "content_type": response.headers.get('content-type'),
                            "encoding": response.headers.get('content-encoding'),
                            "fingerprint": {
                                "browser": self.fingerprint.get('browser', 'Unknown'),
                                "version": self.fingerprint.get('version', 'Unknown'),
                                "platform": self.fingerprint.get('platform', 'Unknown')
                            }
                        }
                        
                    except json.JSONDecodeError as e:
                        if verbose:
                            print(f"❌ JSON decode error: {e}")
                            print(f"Decoded content: {decoded_content[:300]}...")
                        
                        return {
                            "success": False,
                            "error": f"JSON decode error: {e}",
                            "raw_response": decoded_content,
                            "contract_number": contract_number,
                            "status_code": response.status_code
                        }
                else:
                    if verbose:
                        print(f"❌ HTTP Error: {response.status_code}")
                    
                    decoded_content = self._decode_response(response)
                    
                    # Nếu bị chặn (HTTP 400, 403, 429), thử reset session và retry
                    if response.status_code in [400, 403, 429] and attempt < max_retries - 1:
                        if verbose:
                            print(f"🚫 Possible bot detection (HTTP {response.status_code}), resetting session and retrying...")
                        
                        # Tăng delay khi bị chặn
                        self._increase_delay_on_blocking()
                        
                        self._reset_session_if_blocked()
                        continue
                    
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "raw_response": decoded_content,
                        "contract_number": contract_number,
                        "status_code": response.status_code
                    }
                    
            except requests.exceptions.RequestException as e:
                if verbose:
                    print(f"🚫 Request Exception (Attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    if verbose:
                        print("🔄 Retrying with new session...")
                    self._reset_session_if_blocked()
                    continue
                return {
                    "success": False,
                    "error": f"Request error: {str(e)}",
                    "contract_number": contract_number
                }
            except Exception as e:
                if verbose:
                    print(f"🚫 Unexpected error (Attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    if verbose:
                        print("🔄 Retrying...")
                    time.sleep(random.uniform(2.0, 5.0))
                    continue
                return {
                    "success": False,
                    "error": f"Unexpected error: {str(e)}",
                    "contract_number": contract_number
                }
        
        # Nếu tất cả attempts đều thất bại
        return {
            "success": False,
            "error": f"All {max_retries} attempts failed",
            "contract_number": contract_number
        }
    
    def get_profile_stats(self) -> Dict:
        """Get profile usage statistics"""
        if self.profile_manager:
            return self.profile_manager.get_usage_stats()
        else:
            return {
                'profile_rotation_enabled': False,
                'current_profile': 'Manual fingerprint'
            }
    
    def reset_profile_usage(self, profile_id: str = None):
        """Reset profile usage statistics"""
        if self.profile_manager:
            self.profile_manager.reset_profile_usage(profile_id)
        else:
            print("⚠️ Profile rotation not enabled")
    
    def batch_query(self, contracts: list, delay_range: tuple = None) -> list:
        """Query nhiều hóa đơn với delay thông minh và rotation"""
        results = []
        
        print(f"🚀 Starting batch processing with {len(contracts)} contracts")
        print(f"⏰ Smart delay system enabled (max {self.max_requests_per_hour} requests/hour)")
        print("=" * 60)
        
        for i, contract in enumerate(contracts):
            print(f"\n📋 Processing {i+1}/{len(contracts)}: {contract}")
            print("-" * 50)
            
            # Tạo phone number mới cho mỗi request
            phone = self.generate_phone()
            result = self.query_bill(contract, phone_number=phone)
            results.append(result)
            
            # Không cần delay thêm vì đã có trong _simulate_human_behavior
            # Chỉ refresh cookies
            if i < len(contracts) - 1:
                self._generate_cookies()
                
                # Log progress
                success_count = len([r for r in results if r['success']])
                print(f"📊 Progress: {i+1}/{len(contracts)} - Success: {success_count}")
        
        print("\n" + "=" * 60)
        print("🎉 Batch processing completed!")
        print(f"✅ Successful: {len([r for r in results if r['success']])}")
        print(f"❌ Failed: {len([r for r in results if not r['success']])}")
        print("=" * 60)
        
        return results
    
    def get_fingerprint_summary(self) -> Dict[str, Any]:
        """Lấy tóm tắt fingerprint"""
        return {
            "browser": f"{self.fingerprint.get('browser', 'Unknown')} {self.fingerprint.get('version', 'Unknown')}",
            "platform": self.fingerprint.get('platform', 'Unknown'),
            "screen": f"{self.fingerprint.get('screen_width', 1920)}x{self.fingerprint.get('screen_height', 1080)}",
            "language": self.fingerprint.get('language', 'Unknown'),
            "timezone": self.fingerprint.get('timezone', 'Unknown'),
            "canvas_id": self.fingerprint.get('canvas_fingerprint', 'Unknown'),
            "cookies_count": len(self.session.cookies)
        }

# Test functions
def test_final_agent():
    """Test agent hoàn chỉnh"""
    print("🚀 Testing Final Agent with Complete Fingerprint")
    print("=" * 60)
    
    agent = FinalAgent()
    
    # Hiển thị fingerprint
    fingerprint = agent.get_fingerprint_summary()
    print("🔍 Agent Fingerprint:")
    for key, value in fingerprint.items():
        print(f"   {key}: {value}")
    print()
    
    # Test với mã hợp đồng
    result = agent.query_bill("PB02020040261")
    
    print("\n" + "=" * 60)
    print("📋 RESULT SUMMARY:")
    print("=" * 60)
    
    if result['success']:
        print("✅ Request successful!")
        if 'data' in result:
            print("📄 Response data:")
            print(json.dumps(result['data'], indent=2, ensure_ascii=False))
    else:
        print(f"❌ Request failed: {result.get('error')}")
        if 'raw_response' in result:
            print(f"📄 Raw response preview: {result['raw_response'][:500]}...")
    
    return result

def test_multiple_agents():
    """Test với nhiều agent khác nhau"""
    print("🚀 Testing Multiple Agents")
    print("=" * 60)
    
    agents = [FinalAgent() for _ in range(3)]
    
    for i, agent in enumerate(agents):
        print(f"\n🤖 Agent {i+1}:")
        fingerprint = agent.get_fingerprint_summary()
        for key, value in fingerprint.items():
            print(f"   {key}: {value}")
        
        result = agent.query_bill("PB02020040261", verbose=False)
        status = "✅" if result['success'] else "❌"
        print(f"   Result: {status} {result.get('error', 'Success')}")
        
        time.sleep(1)  # Delay giữa các agent
    
    return agents

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "multi":
            test_multiple_agents()
        elif sys.argv[1] == "batch":
            agent = FinalAgent()
            contracts = ["PB02020040261", "PB02020040262", "PB02020040263"]
            agent.batch_query(contracts)
    else:
        test_final_agent()