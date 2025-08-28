#!/usr/bin/env python3
"""
Restart Flask server completely
"""

import os
import sys
import subprocess
import time
import signal

def restart_server():
    """Restart Flask server completely"""
    print("🔄 Restarting Flask server...")
    
    # Kill all Python processes
    try:
        subprocess.run(["pkill", "-f", "python3 app.py"], check=False)
        print("✅ Killed existing Python processes")
    except:
        pass
    
    # Wait for processes to die
    time.sleep(3)
    
    # Clear Python cache
    try:
        subprocess.run(["find", ".", "-name", "*.pyc", "-delete"], check=False)
        subprocess.run(["find", ".", "-name", "__pycache__", "-type", "d", "-exec", "rm", "-rf", "{}", "+"], check=False)
        print("✅ Cleared Python cache")
    except:
        pass
    
    # Start server in background
    try:
        process = subprocess.Popen(["python3", "app.py"], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        print(f"✅ Started server with PID: {process.pid}")
        
        # Wait for server to start
        time.sleep(5)
        
        # Test if server is working
        import requests
        try:
            response = requests.post("http://localhost:5001/api/auth/login", 
                                  json={"username": "testuser", "password": "password123"})
            if response.status_code == 200:
                print("✅ Server is working correctly!")
            else:
                print(f"❌ Server returned status: {response.status_code}")
        except Exception as e:
            print(f"❌ Server test failed: {e}")
            
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

if __name__ == "__main__":
    restart_server()
