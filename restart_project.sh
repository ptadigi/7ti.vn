#!/bin/bash

echo "🔄 Restart FPT Bill Manager..."

# Dừng dự án
./stop_project.sh

# Đợi một chút
sleep 3

# Khởi động lại
./start_project.sh
