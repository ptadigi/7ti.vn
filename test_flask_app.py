#!/usr/bin/env python3
"""
Test Flask App Import
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_flask_app_import():
    """Test Flask app import"""
    print("🚀 Testing Flask App Import...")
    
    try:
        # Test importing app without running
        from app import app, socketio
        
        print("  ✅ Flask app imported successfully")
        print(f"    - App name: {app.name}")
        print(f"    - App config: {app.config['DEBUG']}")
        print(f"    - SocketIO: {socketio}")
        
        # Test blueprints registration
        print("  🔗 Testing blueprints...")
        registered_blueprints = list(app.blueprints.keys())
        print(f"    - Registered blueprints: {registered_blueprints}")
        
        # Test routes
        print("  🛣️ Testing routes...")
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{rule.methods} {rule.rule}")
        
        print(f"    - Total routes: {len(routes)}")
        print("    - Sample routes:")
        for route in routes[:5]:  # Show first 5 routes
            print(f"      {route}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Flask app import error: {str(e)}")
        return False

def test_config_import():
    """Test config import"""
    print("\n⚙️ Testing Config Import...")
    
    try:
        from config.config import get_config, Config
        
        # Test config
        config = get_config()
        print("  ✅ Config imported successfully")
        print(f"    - Environment: {config.__class__.__name__}")
        print(f"    - Debug mode: {config.DEBUG}")
        print(f"    - Database URL: {config.DATABASE_URL}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Config import error: {str(e)}")
        return False

def test_database_config():
    """Test database config"""
    print("\n🗄️ Testing Database Config...")
    
    try:
        from config.database import engine, Base, get_db
        
        print("  ✅ Database config imported successfully")
        print(f"    - Engine: {engine}")
        print(f"    - Base: {Base}")
        print(f"    - Get DB function: {get_db}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Database config error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Flask App Import")
    print("=" * 40)
    
    # Test Flask app
    flask_ok = test_flask_app_import()
    
    # Test config
    config_ok = test_config_import()
    
    # Test database config
    db_config_ok = test_database_config()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"  Flask App: {'✅ PASS' if flask_ok else '❌ FAIL'}")
    print(f"  Config: {'✅ PASS' if config_ok else '❌ FAIL'}")
    print(f"  Database Config: {'✅ PASS' if db_config_ok else '❌ FAIL'}")
    
    if all([flask_ok, config_ok, db_config_ok]):
        print("\n🎉 All Flask app tests passed!")
        print("\n💡 Next step: Setup PostgreSQL database and test full backend")
    else:
        print("\n❌ Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
