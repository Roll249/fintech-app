#!/bin/bash

# =====================================================
# FINTECH APP - QUICK START SCRIPT
# =====================================================

set -e

echo "=========================================="
echo "  FINTECH APP - QUICK START"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is installed
check_ngrok() {
    if ! command -v ngrok &> /dev/null; then
        echo -e "${RED}❌ ngrok chưa được cài đặt!${NC}"
        echo "Cài đặt ngrok:"
        echo "1. Đăng ký tài khoản tại https://ngrok.com"
        echo "2. Download và cài đặt"
        echo "3. Chạy: ngrok config add-authtoken YOUR_TOKEN"
        return 1
    fi
    echo -e "${GREEN}✅ ngrok đã được cài đặt${NC}"
    return 0
}

# Check if docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker chưa chạy!${NC}"
        echo "Chạy: sudo systemctl start docker"
        return 1
    fi
    echo -e "${GREEN}✅ Docker đã chạy${NC}"
    return 0
}

# Start backend
start_backend() {
    echo ""
    echo -e "${BLUE}📦 Khởi động Backend...${NC}"
    
    cd "$(dirname "$0")/backend"
    
    # Check if postgres is running
    if ! docker ps | grep -q fintech_postgres; then
        echo "  - Khởi động PostgreSQL..."
        docker-compose up -d postgres redis
        sleep 5
    else
        echo "  - PostgreSQL đã chạy"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "  - Cài đặt dependencies..."
        npm install
    fi
    
    # Start backend
    echo "  - Khởi động Backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    echo "  - Đợi backend khởi động..."
    sleep 3
    
    # Check if backend is running
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✅ Backend đang chạy tại http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend có thể chưa khởi động xong, đợi thêm...${NC}"
        sleep 5
    fi
}

# Create test users
create_test_users() {
    echo ""
    echo -e "${BLUE}👥 Tạo 30 test users...${NC}"
    
    # Login as admin
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@fintechapp.com","password":"admin123"}')
    
    TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Không thể đăng nhập admin!${NC}"
        return 1
    fi
    
    echo "  - Đăng nhập admin thành công"
    
    # Create 30 test users
    echo "  - Tạo 30 test users..."
    curl -s -X POST http://localhost:3000/api/v1/simulation/create-users \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"count":30}' > /dev/null
    
    echo -e "${GREEN}✅ Đã tạo 30 test users!${NC}"
}

# Start ngrok
start_ngrok() {
    echo ""
    echo -e "${BLUE}🌐 Khởi động ngrok tunnel...${NC}"
    
    # Kill existing ngrok
    pkill ngrok 2>/dev/null || true
    
    # Start ngrok
    ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    
    echo "  - Đợi ngrok khởi động..."
    sleep 5
    
    # Get ngrok URL
    if [ -f /tmp/ngrok.log ]; then
        URL=$(grep -o 'https://[^.]*\.ngrok\.io' /tmp/ngrok.log | head -1)
        if [ -n "$URL" ]; then
            echo ""
            echo "=========================================="
            echo -e "${GREEN}✅ ngrok đang chạy!${NC}"
            echo "=========================================="
            echo ""
            echo -e "${YELLOW}📱 PUBLIC URL: ${NC}$URL"
            echo ""
            echo "Copy URL này vào cấu hình Android app!"
            echo ""
            
            # Save URL to file
            echo "$URL" > /tmp/fintech_backend_url.txt
            
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠️ Không lấy được URL ngrok. Kiểm tra log: /tmp/ngrok.log${NC}"
    return 1
}

# Main menu
show_menu() {
    echo ""
    echo "=========================================="
    echo "  MENU"
    echo "=========================================="
    echo "  1. Start Backend + ngrok + Tạo users"
    echo "  2. Chỉ khởi động Backend"
    echo "  3. Chỉ khởi động ngrok"
    echo "  4. Tạo test users"
    echo "  5. Hiển thị public URL"
    echo "  6. Thoát"
    echo "=========================================="
    echo ""
    read -p "Chọn option (1-6): " choice
    
    case $choice in
        1)
            check_ngrok || exit 1
            check_docker || exit 1
            start_backend
            create_test_users
            start_ngrok
            ;;
        2)
            check_docker || exit 1
            start_backend
            ;;
        3)
            check_ngrok || exit 1
            start_ngrok
            ;;
        4)
            create_test_users
            ;;
        5)
            if [ -f /tmp/fintech_backend_url.txt ]; then
                echo "Public URL: $(cat /tmp/fintech_backend_url.txt)"
            else
                echo "Chưa có URL. Chạy option 1 hoặc 3 trước."
            fi
            ;;
        6)
            echo "Tạm biệt!"
            exit 0
            ;;
        *)
            echo "Option không hợp lệ!"
            ;;
    esac
}

# Run menu
while true; do
    show_menu
    echo ""
    read -p "Nhấn Enter để tiếp tục..."
done
