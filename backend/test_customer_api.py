#!/usr/bin/env python3
"""
Test customer API to verify data format
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json

def test_customer_api():
    """Test customer API and verify data format"""
    try:
        # Login to get token
        print("🔐 Logging in...")
        login_response = requests.post(
            "http://localhost:5001/api/auth/login",
            json={"username": "testuser2", "password": "password123"}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        login_data = login_response.json()
        if not login_data.get('success'):
            print(f"❌ Login failed: {login_data.get('error')}")
            return
        
        token = login_data['access_token']
        print("✅ Login successful")
        
        # Get customers
        print("📋 Getting customers...")
        headers = {"Authorization": f"Bearer {token}"}
        customers_response = requests.get(
            "http://localhost:5001/api/customers/",
            headers=headers
        )
        
        if customers_response.status_code != 200:
            print(f"❌ Get customers failed: {customers_response.status_code}")
            return
        
        customers_data = customers_response.json()
        if not customers_data.get('success'):
            print(f"❌ Get customers failed: {customers_data.get('error')}")
            return
        
        print("✅ Get customers successful")
        print(f"📊 Found {len(customers_data['customers'])} customers")
        
        # Check first customer data structure
        if customers_data['customers']:
            customer = customers_data['customers'][0]
            print("\n🔍 First customer data structure:")
            print(f"   ID: {customer.get('id')}")
            print(f"   Name: {customer.get('name')}")
            print(f"   Phone: {customer.get('phone')}")
            print(f"   Email: {customer.get('email')}")
            print(f"   Address: {customer.get('address')}")
            print(f"   Customer Type: {customer.get('customerType')}")
            print(f"   Company Name: {customer.get('companyName')}")
            print(f"   Status: {customer.get('status')}")
            print(f"   Total Bills: {customer.get('totalBills')}")
            print(f"   Total Amount: {customer.get('totalAmount')}")
            print(f"   Created At: {customer.get('createdAt')}")
            print(f"   Updated At: {customer.get('updatedAt')}")
            
            # Check if required fields are present
            required_fields = ['customerType', 'status', 'totalBills', 'totalAmount']
            missing_fields = [field for field in required_fields if field not in customer]
            
            if missing_fields:
                print(f"\n❌ Missing required fields: {missing_fields}")
            else:
                print("\n✅ All required fields present")
                
                # Check if data looks correct (not mock data)
                if customer.get('totalBills') == 0 and customer.get('totalAmount') == 0:
                    print("⚠️  Data appears to be default values (no sales data)")
                else:
                    print("✅ Data appears to have real sales information")
        
    except Exception as e:
        print(f"❌ Error testing customer API: {e}")

if __name__ == "__main__":
    test_customer_api()
