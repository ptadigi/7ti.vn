#!/bin/bash

echo "🛑 Dừng FPT Bill Manager..."

# Dừng backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "🔄 Dừng Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm backend.pid
else
    echo "🔄 Dừng Backend..."
    pkill -f "python3 app.py" 2>/dev/null
fi

# Dừng frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo "🔄 Dừng Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm frontend.pid
else
    echo "🔄 Dừng Frontend..."
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
fi

# Dừng tất cả process liên quan
echo "🧹 Dọn dẹp process còn sót..."
pkill -f "python3.*app.py" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null

sleep 2
echo "✅ Đã dừng dự án!"
