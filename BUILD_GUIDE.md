# Hướng dẫn build và chạy ứng dụng Fintech

## Yêu cầu hệ thống

### Backend
- Node.js >= 18.0.0
- Docker Desktop (hoặc PostgreSQL + Redis đang chạy)

### Android
- JDK 17 hoặc 21 (Java 26 chưa được hỗ trợ tốt)
- Android SDK với API level 34
- Gradle 8.5
- Android Studio Hedgehog (2023.1.1) hoặc mới hơn

## Phần 1: Chạy Backend

### Bước 1.1: Khởi động Database với Docker

```bash
cd /home/khang/khang_lab/fintech-app/backend

# Khởi động PostgreSQL và Redis
docker-compose up -d postgres redis

# Chờ database khởi động
sleep 10

# Kiểm tra database đã sẵn sàng
docker-compose ps
```

### Bước 1.2: Khởi tạo Database Schema

Database schema đã được cấu hình tự động trong `docker-compose.yml`.
Nếu cần chạy thủ công:

```bash
# Kết nối vào PostgreSQL container
docker exec -it fintech_postgres psql -U fintech -d fintech

# Chạy init script
\i /app/init_v2.sql

# Thoát
\q
```

### Bước 1.3: Cài đặt dependencies và chạy Backend

```bash
cd /home/khang/khang_lab/fintech-app/backend

# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev
```

Backend sẽ chạy tại `http://localhost:3000`

### Bước 1.4: Publish backend ra internet (cho test trên điện thoại)

```bash
# Cài đặt ngrok
# Tải từ https://ngrok.com/download

# Đăng ký tài khoản ngrok (miễn phí)
# Lấy authtoken từ https://dashboard.ngrok.com/

# Cấu hình ngrok
ngrok config add-authtoken YOUR_AUTHTOKEN

# Chạy ngrok tunnel (trong terminal khác)
ngrok http 3000

# Copy URL từ Forwarding, ví dụ: https://abc123.ngrok.io
```

### Bước 1.5: Tạo test users cho 30 người dùng

Sau khi backend đang chạy, mở terminal mới và chạy:

```bash
# Login với admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fintechapp.com","password":"admin123"}'

# Copy access token từ response

# Tạo 30 test users
curl -X POST http://localhost:3000/api/v1/simulation/create-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"count":30}'
```

## Phần 2: Build Android App

### Bước 2.1: Cài đặt Java 17 (nếu chưa có)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# Kiểm tra Java version
java -version
# Output: openjdk version "17.0.x"

# Đặt JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Bước 2.2: Cài đặt Android SDK

```bash
# Tải Android command line tools
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest

# Cài đặt platform-tools, platforms và build-tools
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses
yes | sdkmanager --licenses

# Cài đặt packages cần thiết
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

### Bước 2.3: Build APK

```bash
cd /home/khang/khang_lab/fintech-app/android-client

# Cài đặt local.properties
echo "sdk.dir=$HOME/android-sdk" > local.properties

# Đổi BASE_URL trong app/build.gradle.kts thành URL ngrok của bạn
# Ví dụ: buildConfigField("String", "BASE_URL", "\"https://abc123.ngrok.io/api/v1/\"")

# Build debug APK
./gradlew assembleDebug

# APK sẽ được tạo tại:
# app/build/outputs/apk/debug/app-debug.apk
```

### Bước 2.4: Build Release APK (tùy chọn)

```bash
# Tạo keystore
keytool -genkey -v -keystore fintech-app.jks -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fintech-app

# Cấu hình signing trong app/build.gradle.kts
# Sau đó build
./gradlew assembleRelease
```

## Phần 3: Cài đặt và Test trên điện thoại

### Bước 3.1: Cài đặt APK

**Cách 1: Qua ADB**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Cách 2: Qua Google Drive**
```bash
# Upload APK lên Google Drive
# Share link cho 30 users

# Mỗi user:
# 1. Tải APK về máy
# 2. Settings > Security > Enable "Unknown sources"
# 3. Mở file APK và cài đặt
```

### Bước 3.2: Test với test users

Mỗi user đăng nhập với:
- Email: `student1@university.edu` đến `student30@university.edu`
- Password: `Test123456`

## Phần 4: Các API Endpoints chính

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh token

### Banks (Simulated)
- `GET /api/v1/banks` - Danh sách 10 ngân hàng
- `POST /api/v1/banks/connect` - Kết nối ngân hàng

### Funds
- `GET /api/v1/funds` - Danh sách quỹ
- `POST /api/v1/funds` - Tạo quỹ mới
- `POST /api/v1/funds/contribute` - Nạp/Rút tiền

### Transactions
- `GET /api/v1/transactions` - Danh sách giao dịch
- `POST /api/v1/transactions` - Tạo giao dịch
- `POST /api/v1/transactions/transfer` - Chuyển tiền

### QR Code
- `POST /api/v1/qr/generate-receive` - Tạo QR nhận tiền
- `POST /api/v1/qr/process` - Xử lý QR
- `POST /api/v1/qr/confirm-transfer` - Xác nhận chuyển tiền

### Simulation (Admin)
- `POST /api/v1/simulation/create-users` - Tạo test users
- `POST /api/v1/simulation/incoming-transfer` - Mô phỏng nhận tiền

## Troubleshooting

### "usesCleartextTraffic" error
- Đảm bảo `BASE_URL` sử dụng `https://` hoặc bật `usesCleartextTraffic="true"` trong AndroidManifest

### Database connection failed
```bash
# Kiểm tra PostgreSQL container
docker-compose ps

# Restart nếu cần
docker-compose restart postgres
```

### Gradle build failed
```bash
# Clean và rebuild
./gradlew clean
./gradlew assembleDebug

# Xóa Gradle cache nếu vấn đề tiếp tục
rm -rf ~/.gradle/caches
```

### Ngrok disconnecting
- Đăng ký tài khoản ngrok (miễn phí)
- Sử dụng persistent tunnel với ngrok config

## Cấu trúc Database Schema mới

Xem file `init_v2.sql` cho chi tiết:
- `users` - Người dùng
- `simulated_banks` - 10 ngân hàng mô phỏng
- `simulated_bank_accounts` - Tài khoản trong ngân hàng mô phỏng
- `funds` - Quỹ tiết kiệm
- `fund_contributions` - Lịch sử nạp/rút quỹ
- `allocation_rules` - Quy tắc tự động chia tiền
- `transactions` - Giao dịch
- `qr_codes` - Lịch sử QR đã tạo
- `notifications` - Thông báo
