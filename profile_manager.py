import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os

class ProfileManager:
    """Quản lý và rotate các profile agent để tránh bị chặn"""
    
    def __init__(self, profiles_file: str = "agent_profiles.json"):
        self.profiles_file = profiles_file
        self.profiles = []
        self.current_profile = None
        self.profile_usage = {}  # Track usage for each profile
        self.last_rotation = None
        self.load_profiles()
    
    def load_profiles(self):
        """Load profiles from JSON file"""
        try:
            if os.path.exists(self.profiles_file):
                with open(self.profiles_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.profiles = [p for p in data.get('profiles', []) if p.get('enabled', True)]
                    self.rotation_settings = data.get('rotation_settings', {})
                    
                    # Initialize usage tracking
                    for profile in self.profiles:
                        profile_id = profile['id']
                        if profile_id not in self.profile_usage:
                            self.profile_usage[profile_id] = {
                                'requests_count': 0,
                                'last_used': None,
                                'errors_count': 0,
                                'blocked_until': None
                            }
                    
                    print(f"✅ Loaded {len(self.profiles)} agent profiles")
            else:
                print(f"⚠️ Profile file {self.profiles_file} not found")
                self.profiles = []
                self.rotation_settings = {}
        except Exception as e:
            print(f"❌ Error loading profiles: {e}")
            self.profiles = []
            self.rotation_settings = {}
    
    def get_available_profiles(self) -> List[Dict]:
        """Get list of available profiles (not blocked)"""
        available = []
        current_time = datetime.now()
        
        for profile in self.profiles:
            profile_id = profile['id']
            usage = self.profile_usage.get(profile_id, {})
            
            # Check if profile is blocked
            blocked_until = usage.get('blocked_until')
            if blocked_until and current_time < blocked_until:
                continue
            
            # Check if profile has exceeded max requests
            max_requests = self.rotation_settings.get('max_requests_per_profile', 50)
            if usage.get('requests_count', 0) >= max_requests:
                # Check if cooldown period has passed
                last_used = usage.get('last_used')
                if last_used:
                    cooldown_minutes = self.rotation_settings.get('cooldown_minutes', 60)
                    if current_time - last_used < timedelta(minutes=cooldown_minutes):
                        continue
                    else:
                        # Reset usage count after cooldown
                        self.profile_usage[profile_id]['requests_count'] = 0
            
            available.append(profile)
        
        return available
    
    def select_profile(self, force_new: bool = False) -> Optional[Dict]:
        """Select a profile for use"""
        available_profiles = self.get_available_profiles()
        
        if not available_profiles:
            print("⚠️ No available profiles, using fallback")
            return self._get_fallback_profile()
        
        # If we need to force a new profile or don't have a current one
        if force_new or not self.current_profile:
            # Select profile with least usage
            best_profile = min(available_profiles, 
                             key=lambda p: self.profile_usage.get(p['id'], {}).get('requests_count', 0))
            self.current_profile = best_profile
            self.last_rotation = datetime.now()
            print(f"🔄 Selected profile: {best_profile['name']} ({best_profile['id']})")
        
        # Check if we need to rotate based on time or usage
        elif self._should_rotate():
            # Exclude current profile from selection
            other_profiles = [p for p in available_profiles if p['id'] != self.current_profile['id']]
            if other_profiles:
                best_profile = min(other_profiles, 
                                 key=lambda p: self.profile_usage.get(p['id'], {}).get('requests_count', 0))
                self.current_profile = best_profile
                self.last_rotation = datetime.now()
                print(f"🔄 Rotated to profile: {best_profile['name']} ({best_profile['id']})")
        
        return self.current_profile
    
    def _should_rotate(self) -> bool:
        """Check if we should rotate to a new profile"""
        if not self.current_profile or not self.last_rotation:
            return True
        
        # Check time-based rotation
        rotate_interval = self.rotation_settings.get('rotate_interval_minutes', 30)
        if datetime.now() - self.last_rotation > timedelta(minutes=rotate_interval):
            return True
        
        # Check usage-based rotation
        profile_id = self.current_profile['id']
        usage = self.profile_usage.get(profile_id, {})
        max_requests = self.rotation_settings.get('max_requests_per_profile', 50)
        
        if usage.get('requests_count', 0) >= max_requests * 0.8:  # Rotate at 80% of max
            return True
        
        return False
    
    def _get_fallback_profile(self) -> Dict:
        """Get a basic fallback profile when no profiles are available"""
        return {
            'id': 'fallback',
            'name': 'Fallback Profile',
            'browser': {
                'name': 'Chrome',
                'version': '120.0.6099.109',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            'platform': {
                'os': 'Windows',
                'version': '10.0',
                'architecture': 'x64'
            },
            'screen': {
                'width': 1920,
                'height': 1080,
                'color_depth': 24
            },
            'timezone': 'Asia/Ho_Chi_Minh',
            'language': 'vi-VN,vi;q=0.9,en;q=0.8'
        }
    
    def record_request(self, profile_id: str):
        """Record a request for the given profile"""
        if profile_id not in self.profile_usage:
            self.profile_usage[profile_id] = {
                'requests_count': 0,
                'last_used': None,
                'errors_count': 0,
                'blocked_until': None
            }
        
        self.profile_usage[profile_id]['requests_count'] += 1
        self.profile_usage[profile_id]['last_used'] = datetime.now()
    
    def record_error(self, profile_id: str, error_type: str = 'general'):
        """Record an error for the given profile"""
        if profile_id not in self.profile_usage:
            self.profile_usage[profile_id] = {
                'requests_count': 0,
                'last_used': None,
                'errors_count': 0,
                'blocked_until': None
            }
        
        self.profile_usage[profile_id]['errors_count'] += 1
        
        # If too many errors, block the profile temporarily
        if self.profile_usage[profile_id]['errors_count'] >= 3:
            block_duration = timedelta(minutes=30)  # Block for 30 minutes
            self.profile_usage[profile_id]['blocked_until'] = datetime.now() + block_duration
            print(f"🚫 Profile {profile_id} blocked for {block_duration} due to errors")
        
        # Force rotation on error if enabled
        if self.rotation_settings.get('rotate_on_error', True):
            self.select_profile(force_new=True)
    
    def get_profile_fingerprint(self, profile: Dict) -> Dict:
        """Generate fingerprint data from profile"""
        return {
            'browser': profile['browser']['name'],
            'version': profile['browser']['version'],
            'platform': profile['platform']['os'],
            'user_agent': profile['browser']['user_agent'],
            'screen_width': profile['screen']['width'],
            'screen_height': profile['screen']['height'],
            'color_depth': profile['screen']['color_depth'],
            'timezone': profile['timezone'],
            'language': profile['language']
        }
    
    def get_usage_stats(self) -> Dict:
        """Get usage statistics for all profiles"""
        stats = {
            'total_profiles': len(self.profiles),
            'available_profiles': len(self.get_available_profiles()),
            'current_profile': self.current_profile['id'] if self.current_profile else None,
            'profile_details': {}
        }
        
        for profile in self.profiles:
            profile_id = profile['id']
            usage = self.profile_usage.get(profile_id, {})
            stats['profile_details'][profile_id] = {
                'name': profile['name'],
                'requests_count': usage.get('requests_count', 0),
                'errors_count': usage.get('errors_count', 0),
                'last_used': usage.get('last_used').isoformat() if usage.get('last_used') else None,
                'blocked_until': usage.get('blocked_until').isoformat() if usage.get('blocked_until') else None,
                'is_available': profile in self.get_available_profiles()
            }
        
        return stats
    
    def reset_profile_usage(self, profile_id: str = None):
        """Reset usage statistics for a profile or all profiles"""
        if profile_id:
            if profile_id in self.profile_usage:
                self.profile_usage[profile_id] = {
                    'requests_count': 0,
                    'last_used': None,
                    'errors_count': 0,
                    'blocked_until': None
                }
                print(f"✅ Reset usage for profile {profile_id}")
        else:
            for pid in self.profile_usage:
                self.profile_usage[pid] = {
                    'requests_count': 0,
                    'last_used': None,
                    'errors_count': 0,
                    'blocked_until': None
                }
            print("✅ Reset usage for all profiles")