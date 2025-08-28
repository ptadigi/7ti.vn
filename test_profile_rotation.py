#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script test profile rotation và anti-detection
"""

import time
import json
from final_agent import FinalAgent
from profile_manager import ProfileManager

def test_profile_rotation():
    """Test profile rotation functionality"""
    print("🧪 Testing Profile Rotation System")
    print("=" * 50)
    
    # Test 1: Initialize agent with profile rotation
    print("\n1️⃣ Testing agent initialization with profile rotation...")
    agent = FinalAgent(use_profile_rotation=True)
    
    # Test 2: Check initial profile stats
    print("\n2️⃣ Initial profile statistics:")
    stats = agent.get_profile_stats()
    print(json.dumps(stats, indent=2, default=str))
    
    # Test 3: Test multiple requests to trigger rotation
    print("\n3️⃣ Testing multiple requests (should trigger rotation)...")
    test_contracts = [
        "PB02020040261",
        "PB02020040262", 
        "PB02020040263",
        "PB02020040264",
        "PB02020040265"
    ]
    
    for i, contract in enumerate(test_contracts, 1):
        print(f"\n📋 Request {i}/5: Testing contract {contract}")
        result = agent.query_bill(contract, verbose=True)
        print(f"Result: {'✅ Success' if result.get('success') else '❌ Failed'}")
        
        # Show current profile stats after each request
        current_stats = agent.get_profile_stats()
        current_profile = current_stats.get('current_profile')
        print(f"Current profile: {current_profile}")
        
        # Small delay between requests
        if i < len(test_contracts):
            time.sleep(2)
    
    # Test 4: Final profile statistics
    print("\n4️⃣ Final profile statistics:")
    final_stats = agent.get_profile_stats()
    print(json.dumps(final_stats, indent=2, default=str))
    
    # Test 5: Test profile manager directly
    print("\n5️⃣ Testing ProfileManager directly...")
    pm = ProfileManager()
    print(f"Available profiles: {len(pm.get_available_profiles())}")
    
    # Simulate some usage
    for i in range(3):
        profile = pm.select_profile()
        if profile:
            print(f"Selected profile: {profile['name']} ({profile['id']})")
            pm.record_request(profile['id'])
    
    print("\n6️⃣ ProfileManager usage stats:")
    pm_stats = pm.get_usage_stats()
    print(json.dumps(pm_stats, indent=2, default=str))
    
    print("\n✅ Profile rotation test completed!")

def test_error_handling():
    """Test error handling and profile blocking"""
    print("\n🧪 Testing Error Handling & Profile Blocking")
    print("=" * 50)
    
    agent = FinalAgent(use_profile_rotation=True)
    
    # Simulate errors to test profile blocking
    if agent.profile_manager and agent.current_profile:
        profile_id = agent.current_profile['id']
        print(f"\n🚫 Simulating errors for profile: {profile_id}")
        
        # Record multiple errors
        for i in range(4):
            agent.profile_manager.record_error(profile_id, 'test_error')
            print(f"Error {i+1} recorded")
        
        # Check if profile is blocked
        stats = agent.get_profile_stats()
        profile_details = stats.get('profile_details', {}).get(profile_id, {})
        print(f"Profile blocked until: {profile_details.get('blocked_until')}")
        print(f"Profile available: {profile_details.get('is_available')}")
    
    print("\n✅ Error handling test completed!")

def test_without_profile_rotation():
    """Test agent without profile rotation for comparison"""
    print("\n🧪 Testing Without Profile Rotation (Comparison)")
    print("=" * 50)
    
    agent = FinalAgent(use_profile_rotation=False)
    
    # Test a single request
    result = agent.query_bill("PB02020040261", verbose=True)
    print(f"Result: {'✅ Success' if result.get('success') else '❌ Failed'}")
    
    # Check stats
    stats = agent.get_profile_stats()
    print("Stats:", stats)
    
    print("\n✅ Non-rotation test completed!")

if __name__ == "__main__":
    try:
        # Run all tests
        test_profile_rotation()
        test_error_handling()
        test_without_profile_rotation()
        
        print("\n🎉 All tests completed successfully!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()