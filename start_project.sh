#!/bin/bash

echo "🚀 Khởi động FPT Bill Manager..."

# Kill tất cả process cũ
echo "🔄 Dọn dẹp process cũ..."
pkill -f "python3 app.py" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
sleep 2

# Xóa cache Python
echo "🧹 Xóa Python cache..."
cd backend
rm -rf __pycache__ 2>/dev/null
rm -rf routes/__pycache__ 2>/dev/null
rm -rf services/__pycache__ 2>/dev/null
rm -rf models/__pycache__ 2>/dev/null
rm -rf config/__pycache__ 2>/dev/null

# Khởi động backend
echo "🐍 Khởi động Backend (Flask)..."
python3 app.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Đợi backend khởi động
echo "⏳ Đợi backend khởi động..."
sleep 5

# Kiểm tra backend
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ Backend đã sẵn sàng!"
else
    echo "❌ Backend khởi động thất bại!"
    exit 1
fi

# Khởi động frontend
echo "⚛️ Khởi động Frontend (React)..."
cd ../frontend-react
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Đợi frontend khởi động
echo "⏳ Đợi frontend khởi động..."
sleep 8

# Kiểm tra frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend đã sẵn sàng!"
else
    echo "❌ Frontend khởi động thất bại!"
    exit 1
fi

echo ""
echo "🎉 Dự án đã khởi động thành công!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:5001"
echo ""
echo "💡 Để dừng dự án, chạy: ./stop_project.sh"
echo "💡 Để restart dự án, chạy: ./restart_project.sh"

# Lưu PID để có thể dừng sau
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

# Giữ script chạy
echo "🔄 Script đang chạy... Nhấn Ctrl+C để dừng"
echo "📊 Để xem logs, mở terminal khác và chạy: tail -f backend/app.log"

# Giữ script chạy và hiển thị logs
tail -f backend/app.log
