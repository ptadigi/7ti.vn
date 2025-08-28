#!/usr/bin/env python3
"""
Test script for FPT Bill Manager Backend APIs
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5001/api"
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User"
}

def test_auth_apis():
    """Test authentication APIs"""
    print("🔐 Testing Authentication APIs...")
    
    # Test registration
    print("  📝 Testing user registration...")
    response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER)
    print(f"    Register: {response.status_code} - {response.json()}")
    
    # Test login
    print("  🔑 Testing user login...")
    login_data = {
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"    Login: {response.status_code} - {response.json()}")
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        # Test protected endpoint
        print("  🛡️ Testing protected endpoint...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
        print(f"    Profile: {response.status_code} - {response.json()}")
        
        return access_token
    else:
        print("    ❌ Login failed, cannot test protected endpoints")
        return None

def test_customer_apis(access_token):
    """Test customer management APIs"""
    if not access_token:
        print("❌ Skipping customer APIs - no access token")
        return
    
    print("\n👥 Testing Customer Management APIs...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test create customer
    print("  ➕ Testing create customer...")
    customer_data = {
        "name": "John Doe",
        "phone": "0123456789",
        "zalo": "johndoe",
        "email": "john@example.com",
        "bank_account": "1234567890",
        "bank_name": "Vietcombank"
    }
    response = requests.post(f"{BASE_URL}/customers/", json=customer_data, headers=headers)
    print(f"    Create: {response.status_code} - {response.json()}")
    
    if response.status_code == 201:
        customer = response.json()['customer']
        customer_id = customer['id']
        
        # Test get customer
        print("  📖 Testing get customer...")
        response = requests.get(f"{BASE_URL}/customers/{customer_id}", headers=headers)
        print(f"    Get: {response.status_code} - {response.json()}")
        
        # Test update customer
        print("  ✏️ Testing update customer...")
        update_data = {"name": "John Smith"}
        response = requests.put(f"{BASE_URL}/customers/{customer_id}", json=update_data, headers=headers)
        print(f"    Update: {response.status_code} - {response.json()}")
        
        # Test search customers
        print("  🔍 Testing search customers...")
        response = requests.get(f"{BASE_URL}/customers/search?q=John", headers=headers)
        print(f"    Search: {response.status_code} - {response.json()}")
        
        # Test get all customers
        print("  📋 Testing get all customers...")
        response = requests.get(f"{BASE_URL}/customers/", headers=headers)
        print(f"    List: {response.status_code} - {response.json()}")
        
        # Test customer statistics
        print("  📊 Testing customer statistics...")
        response = requests.get(f"{BASE_URL}/customers/statistics", headers=headers)
        print(f"    Stats: {response.status_code} - {response.json()}")
        
        # Test export customers
        print("  📤 Testing export customers...")
        response = requests.get(f"{BASE_URL}/customers/export", headers=headers)
        print(f"    Export: {response.status_code} - {response.json()}")
        
        # Test delete customer
        print("  🗑️ Testing delete customer...")
        response = requests.delete(f"{BASE_URL}/customers/{customer_id}", headers=headers)
        print(f"    Delete: {response.status_code} - {response.json()}")
    else:
        print("    ❌ Create customer failed")

def test_existing_apis():
    """Test existing APIs"""
    print("\n🔍 Testing Existing APIs...")
    
    # Test single contract check
    print("  📋 Testing single contract check...")
    response = requests.post(f"{BASE_URL}/check-single", json={"contract_code": "PB02020046419"})
    print(f"    Single Check: {response.status_code} - {response.json()}")
    
    # Test proxy list
    print("  🌐 Testing proxy list...")
    response = requests.get(f"{BASE_URL}/proxy/list")
    print(f"    Proxy List: {response.status_code} - {response.json()}")
    
    # Test batch status
    print("  📊 Testing batch status...")
    response = requests.get(f"{BASE_URL}/batch/status")
    print(f"    Batch Status: {response.status_code} - {response.json()}")

def main():
    """Main test function"""
    print("🚀 FPT Bill Manager Backend - API Test Suite")
    print("=" * 50)
    
    try:
        # Test authentication
        access_token = test_auth_apis()
        
        # Test customer management
        test_customer_apis(access_token)
        
        # Test existing APIs
        test_existing_apis()
        
        print("\n✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Make sure the backend server is running on http://localhost:5001")
        print("   Run: cd backend && python3 app.py")
    except Exception as e:
        print(f"\n❌ Test Error: {str(e)}")

if __name__ == "__main__":
    main()
