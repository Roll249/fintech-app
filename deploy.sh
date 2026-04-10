#!/bin/bash
# =====================================================
# FINTECH APP - COMPLETE DEPLOYMENT SCRIPT
# =====================================================

set -e

echo "=========================================="
echo "  FINTECH APP - DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# =====================================================
# FUNCTIONS
# =====================================================

check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker không chạy! Vui lòng khởi động Docker trước.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker đang chạy${NC}"
}

check_ngrok() {
    if ! command -v ngrok &> /dev/null; then
        echo -e "${RED}❌ ngrok chưa cài đặt!${NC}"
        echo "Hãy cài đặt ngrok từ: https://ngrok.com/download"
        return 1
    fi
    echo -e "${GREEN}✅ ngrok đã cài đặt${NC}"
}

start_backend() {
    echo ""
    echo -e "${BLUE}📦 Khởi động Backend...${NC}"
    
    cd "$SCRIPT_DIR/backend"
    
    # Check if docker containers are running
    if ! docker ps | grep -q fintech_postgres; then
        echo "  - Khởi động PostgreSQL và Redis..."
        docker-compose up -d postgres redis
        sleep 5
    else
        echo "  - PostgreSQL và Redis đã chạy"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "  - Cài đặt dependencies..."
        npm install
    fi
    
    # Start backend in background
    echo "  - Khởi động Backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "  - Đợi Backend khởi động..."
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend đang chạy tại http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend có thể cần thêm thời gian để khởi động...${NC}"
        sleep 5
    fi
}

start_ngrok() {
    echo ""
    echo -e "${BLUE}🌐 Khởi động ngrok tunnel...${NC}"
    
    # Kill existing ngrok
    pkill ngrok 2>/dev/null || true
    sleep 1
    
    # Start ngrok
    ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    
    echo "  - Đợi ngrok khởi động..."
    sleep 8
    
    # Get ngrok URL
    if [ -f /tmp/ngrok.log ]; then
        URL=$(grep -o 'https://[^ ]*\.ngrok\.io' /tmp/ngrok.log | head -1)
        if [ -n "$URL" ]; then
            echo ""
            echo -e "${GREEN}✅ ngrok đang chạy!${NC}"
            echo ""
            echo -e "${CYAN}📱 PUBLIC URL: ${NC}${URL}"
            echo ""
            
            # Save URL to file for build script
            echo "$URL" > /tmp/fintech_backend_url.txt
            
            # Update Android BASE_URL
            update_android_url "$URL"
            
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠️ Không lấy được URL ngrok${NC}"
    return 1
}

update_android_url() {
    local BASE_URL="$1/api/v1/"
    local GRADLE_FILE="$SCRIPT_DIR/android-client/app/build.gradle.kts"
    
    if [ -f "$GRADLE_FILE" ]; then
        echo "  - Cập nhật BASE_URL trong Android app..."
        sed -i "s|buildConfigField(\"String\", \"BASE_URL\", \"[^\"]*\")|buildConfigField(\"String\", \"BASE_URL\", \"\\\"${BASE_URL}\\\"\")|g" "$GRADLE_FILE"
        echo -e "${GREEN}  ✅ BASE_URL đã được cập nhật${NC}"
    fi
}

create_test_users() {
    echo ""
    echo -e "${BLUE}👥 Tạo 30 test users...${NC}"
    
    # Login as admin
    local RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@fintechapp.com","password":"admin123"}')
    
    local TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠️ Không thể đăng nhập admin. Backend có thể chưa sẵn sàng.${NC}"
        return 1
    fi
    
    echo "  - Đăng nhập admin thành công"
    
    # Create 30 test users
    echo "  - Đang tạo 30 test users..."
    local CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/simulation/create-users \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"count":30}')
    
    local CREATED=$(echo $CREATE_RESPONSE | grep -o '"created":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$CREATED" ] && [ "$CREATED" -gt 0 ]; then
        echo -e "${GREEN}✅ Đã tạo $CREATED test users!${NC}"
        echo ""
        echo "  Tài khoản đăng nhập:"
        echo "  Email: student1@university.edu đến student30@university.edu"
        echo "  Password: Test123456"
    else
        echo -e "${YELLOW}⚠️ Không thể tạo test users. API có thể chưa có.${NC}"
    fi
}

build_android() {
    echo ""
    echo -e "${BLUE}📱 Build Android APK...${NC}"
    
    cd "$SCRIPT_DIR/android-client"
    
    # Check Java
    if [ -z "$JAVA_HOME" ]; then
        if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
            export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
        fi
    fi
    
    # Build APK
    echo "  - Đang build APK..."
    ./gradlew assembleDebug --no-daemon 2>&1 | tail -30
    
    # Check result
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        local SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        echo ""
        echo -e "${GREEN}✅ BUILD THÀNH CÔNG!${NC}"
        echo "  APK: app/build/outputs/apk/debug/app-debug.apk"
        echo "  Size: $SIZE"
        
        # Copy to easy location
        cp app/build/outputs/apk/debug/app-debug.apk "$SCRIPT_DIR/fintech-app-debug.apk"
        echo "  Copy sang: $SCRIPT_DIR/fintech-app-debug.apk"
    else
        echo -e "${RED}❌ Build thất bại!${NC}"
        return 1
    fi
}

show_summary() {
    echo ""
    echo "=========================================="
    echo "  DEPLOYMENT COMPLETE"
    echo "=========================================="
    echo ""
    
    local URL=$(cat /tmp/fintech_backend_url.txt 2>/dev/null || echo "Chưa có URL")
    
    echo -e "${CYAN}Backend URL:${NC} $URL"
    echo ""
    echo "Các bước tiếp theo:"
    echo ""
    echo "1. Cài đặt APK trên điện thoại:"
    echo "   adb install fintech-app-debug.apk"
    echo ""
    echo "2. Đăng nhập với:"
    echo "   Email: student1@university.edu"
    echo "   Password: Test123456"
    echo ""
    echo "3. Nếu cần reset URL ngrok mới:"
    echo "   ./update-url.sh"
    echo ""
    echo "4. Để tạo thêm test users (admin):"
    echo "   POST /api/v1/simulation/create-users với auth token"
    echo ""
}

# =====================================================
# MAIN MENU
# =====================================================

show_menu() {
    echo ""
    echo "=========================================="
    echo "  CHỌN HÀNH ĐỘNG"
    echo "=========================================="
    echo "  1. 🚀 Deploy đầy đủ (Backend + ngrok + Users + APK)"
    echo "  2. 💻 Chỉ khởi động Backend"
    echo "  3. 🌐 Chỉ khởi động ngrok"
    echo "  4. 👥 Chỉ tạo test users"
    echo "  5. 📱 Chỉ build APK"
    echo "  6. 📋 Hiển thị thông tin deploy hiện tại"
    echo "  0. ❌ Thoát"
    echo "=========================================="
    echo ""
}

while true; do
    show_menu
    read -p "Chọn (0-6): " choice
    
    case $choice in
        1)
            check_docker
            check_ngrok
            start_backend
            create_test_users
            start_ngrok
            build_android
            show_summary
            ;;
        2)
            check_docker
            start_backend
            ;;
        3)
            check_ngrok
            start_ngrok
            ;;
        4)
            create_test_users
            ;;
        5)
            build_android
            ;;
        6)
            echo ""
            echo "Thông tin hiện tại:"
            if [ -f /tmp/fintech_backend_url.txt ]; then
                echo "  Backend URL: $(cat /tmp/fintech_backend_url.txt)"
            else
                echo "  Backend URL: Chưa khởi động"
            fi
            if [ -f "$SCRIPT_DIR/fintech-app-debug.apk" ]; then
                echo "  APK: $SCRIPT_DIR/fintech-app-debug.apk"
            fi
            ;;
        0)
            echo "Tạm biệt!"
            exit 0
            ;;
        *)
            echo "Lựa chọn không hợp lệ!"
            ;;
    esac
    
    echo ""
    read -p "Nhấn Enter để tiếp tục..."
done