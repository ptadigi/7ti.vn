#!/bin/bash

echo "🔍 FPT Frontend React Debug Script"
echo "=================================="

echo ""
echo "📊 Server Status:"
echo "-----------------"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Port 3000 is running"
    lsof -i :3000
else
    echo "❌ Port 3000 is not running"
fi

echo ""
echo "📦 NPM Processes:"
echo "-----------------"
ps aux | grep "npm run dev" | grep -v grep || echo "No npm processes found"

echo ""
echo "🌐 Network Status:"
echo "------------------"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 || echo "Cannot connect to localhost:3000"

echo ""
echo "📁 Project Structure:"
echo "---------------------"
ls -la src/components/ | head -10
echo "..."
ls -la src/pages/ | head -10

echo ""
echo "🔧 Package Dependencies:"
echo "------------------------"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
else
    echo "❌ package.json not found"
fi

echo ""
echo "🚀 Ready to debug! Open http://localhost:3000 in your browser"
echo "💡 Use F12 to open DevTools and check Console tab for errors"
