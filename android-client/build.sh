#!/bin/bash

# =====================================================
# FINTECH APP - BUILD APK SCRIPT
# =====================================================

set -e

echo "=========================================="
echo "  BUILD APK"
echo "=========================================="
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Check JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    echo "JAVA_HOME chưa được đặt. Thử đặt tự động..."
    
    # Try to find Java 17
    if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    elif [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
    fi
    
    if [ -n "$JAVA_HOME" ]; then
        echo "JAVA_HOME=$JAVA_HOME"
    else
        echo "⚠️ Không tìm thấy Java 17 hoặc 21"
        echo "Vui lòng cài đặt Java 17 hoặc 21"
        echo "Ubuntu/Debian: sudo apt install openjdk-17-jdk"
        exit 1
    fi
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/android-sdk" ]; then
        export ANDROID_HOME="$HOME/android-sdk"
    fi
    
    if [ -n "$ANDROID_HOME" ]; then
        echo "ANDROID_HOME=$ANDROID_HOME"
    else
        echo "⚠️ Không tìm thấy Android SDK"
        echo "Vui lòng cài đặt Android SDK"
        echo "Hoặc đặt ANDROID_HOME"
        exit 1
    fi
fi

# Write local.properties
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Clean
echo ""
echo "🧹 Dọn dẹp..."
./gradlew clean

# Build
echo ""
echo "🔨 Build APK..."
./gradlew assembleDebug

# Check result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ BUILD THÀNH CÔNG!${NC}"
    echo "=========================================="
    echo ""
    echo "📱 APK: app/build/outputs/apk/debug/app-debug.apk"
    
    # Show file size
    SIZE=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    echo "📦 Size: $SIZE"
    
    echo ""
    echo "Cài đặt trên điện thoại:"
    echo "  adb install -r app/build/outputs/apk/debug/app-debug.apk"
    
    # Copy to easy location
    cp app/build/outputs/apk/debug/app-debug.apk ./fintech-app-debug.apk
    echo ""
    echo "📋 Copy sang: ./fintech-app-debug.apk"
else
    echo ""
    echo -e "${RED}❌ BUILD THẤT BẠI!${NC}"
    echo "Kiểm tra lỗi ở trên"
    exit 1
fi
