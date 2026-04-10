#!/bin/bash

# =====================================================
# FINTECH APP - UPDATE ANDROID URL SCRIPT
# =====================================================

set -e

echo "=========================================="
echo "  CẬP NHẬT ANDROID APP URL"
echo "=========================================="
echo ""

# Check if URL file exists
if [ -f /tmp/fintech_backend_url.txt ]; then
    CURRENT_URL=$(cat /tmp/fintech_backend_url.txt)
    echo "URL hiện tại: $CURRENT_URL"
    echo ""
fi

# Ask for new URL
read -p "Nhập ngrok URL mới (VD: https://abc123.ngrok.io): " NEW_URL

if [ -z "$NEW_URL" ]; then
    echo "URL không được để trống!"
    exit 1
fi

# Remove trailing slash
NEW_URL=${NEW_URL%/}

# Create proper BASE_URL with /api/v1/
BASE_URL="${NEW_URL}/api/v1/"

echo ""
echo "BASE_URL mới: $BASE_URL"
echo ""

# Update build.gradle.kts
BUILD_FILE="app/build.gradle.kts"

if [ -f "$BUILD_FILE" ]; then
    # Backup original
    cp "$BUILD_FILE" "${BUILD_FILE}.backup"
    
    # Update BASE_URL for debug
    sed -i "s|buildConfigField(\"String\", \"BASE_URL\", \"[^\"]*\")|buildConfigField(\"String\", \"BASE_URL\", \"\\\"${BASE_URL}\\\"\")|g" "$BUILD_FILE"
    
    echo "✅ Đã cập nhật BASE_URL trong app/build.gradle.kts"
else
    echo "❌ Không tìm thấy app/build.gradle.kts"
    exit 1
fi

# Save URL for later use
echo "$NEW_URL" > /tmp/fintech_backend_url.txt

echo ""
echo "=========================================="
echo "  TIẾP THEO"
echo "=========================================="
echo ""
echo "1. Build APK:"
echo "   ./gradlew assembleDebug"
echo ""
echo "2. APK sẽ được tạo tại:"
echo "   app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "3. Cài đặt trên điện thoại:"
echo "   adb install -r app/build/outputs/apk/debug/app-debug.apk"
echo ""
