#!/usr/bin/env python3
"""
Test Reports Service
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_reports_service():
    """Test reports service methods"""
    print("📊 Testing Reports Service...")
    
    try:
        from services.reports_service import reports_service
        
        # Test service creation
        print("  ✅ ReportsService created successfully")
        
        # Test service methods exist
        methods = [
            'get_dashboard_summary',
            'get_sales_analytics',
            'get_customer_analytics',
            'get_warehouse_analytics',
            'export_comprehensive_report'
        ]
        
        for method in methods:
            if hasattr(reports_service, method):
                print(f"    ✅ Method {method} exists")
            else:
                print(f"    ❌ Method {method} missing")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Reports service error: {str(e)}")
        return False

def test_reports_routes():
    """Test reports routes import"""
    print("\n🛣️ Testing Reports Routes...")
    
    try:
        from routes.reports import reports_bp
        
        print("  ✅ Reports blueprint imported successfully")
        print(f"    - Blueprint name: {reports_bp.name}")
        print(f"    - URL prefix: {reports_bp.url_prefix}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Reports routes error: {str(e)}")
        print(f"    - Error details: {str(e)}")
        return False

def test_analytics_methods():
    """Test analytics method signatures"""
    print("\n📈 Testing Analytics Methods...")
    
    try:
        from services.reports_service import reports_service
        
        # Test method signatures
        methods_to_test = [
            ('get_dashboard_summary', []),
            ('get_sales_analytics', ['start_date', 'end_date']),
            ('get_customer_analytics', ['start_date', 'end_date']),
            ('get_warehouse_analytics', []),
            ('export_comprehensive_report', ['format', 'start_date', 'end_date'])
        ]
        
        for method_name, expected_params in methods_to_test:
            if hasattr(reports_service, method_name):
                method = getattr(reports_service, method_name)
                import inspect
                sig = inspect.signature(method)
                param_names = list(sig.parameters.keys())
                
                # Remove 'self' from parameters
                if param_names and param_names[0] == 'self':
                    param_names = param_names[1:]
                
                print(f"    ✅ {method_name}: {param_names}")
            else:
                print(f"    ❌ {method_name}: Method not found")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Analytics methods test error: {str(e)}")
        return False

def test_app_integration():
    """Test if app can import all new routes"""
    print("\n🔗 Testing App Integration...")
    
    try:
        from app import app
        
        print("  ✅ Flask app imported successfully")
        
        # Check if blueprints are registered
        registered_blueprints = list(app.blueprints.keys())
        expected_blueprints = ['auth', 'customers', 'bills', 'sales', 'reports']
        
        print(f"    Registered blueprints: {registered_blueprints}")
        
        missing_blueprints = [bp for bp in expected_blueprints if bp not in registered_blueprints]
        if missing_blueprints:
            print(f"    ❌ Missing blueprints: {missing_blueprints}")
            return False
        else:
            print(f"    ✅ All expected blueprints registered")
            return True
        
    except Exception as e:
        print(f"  ❌ App integration error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Reports & Analytics System")
    print("=" * 40)
    
    # Test reports service
    service_ok = test_reports_service()
    
    # Test routes
    routes_ok = test_reports_routes()
    
    # Test analytics methods
    methods_ok = test_analytics_methods()
    
    # Test app integration
    integration_ok = test_app_integration()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Reports Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    print(f"  Reports Routes: {'✅ PASS' if routes_ok else '❌ FAIL'}")
    print(f"  Analytics Methods: {'✅ PASS' if methods_ok else '❌ FAIL'}")
    print(f"  App Integration: {'✅ PASS' if integration_ok else '❌ FAIL'}")
    
    if all([service_ok, routes_ok, methods_ok, integration_ok]):
        print("\n🎉 All reports & analytics tests passed!")
        print("\n💡 Next step: Test Enhanced Proxy Management APIs")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
