# Fintech App V2 - Quản lý tài chính cá nhân

Ứng dụng quản lý tài chính cá nhân với hệ thống **giả lập 10 ngân hàng**, **QR Code thanh toán**, và **tự động chia tiền vào quỹ**.

## Tính năng chính

### 💰 Giả lập 10 ngân hàng
- Vietcombank (VCB), VietinBank (VTB), BIDV, TPBank, ACB
- MBBank (MB), SHB, OCB, HDBank, VIB
- Mỗi ngân hàng có số dư ban đầu 10 triệu VND

### 📱 QR Code thanh toán
- **QR Nhận tiền**: Tạo mã QR để người khác chuyển tiền cho bạn
- **QR Chuyển tiền**: Quét mã QR để chuyển tiền
- Mã QR có HMAC signature bảo mật
- Hiệu lực trong 5 phút

### 🎯 Quản lý Quỹ thông minh
- Tạo nhiều quỹ: Ăn uống, Di chuyển, Tiết kiệm...
- Nạp tiền vào quỹ
- Rút tiền từ quỹ
- Theo dõi tiến độ đạt mục tiêu

### 🤖 Tự động chia tiền (Auto-allocation)
- Thiết lập quy tắc tự động chia tiền khi nhận
- Ví dụ: Lương → 30% Quỹ tiết kiệm, 20% Quỹ đầu tư
- Xử lý khi quỹ không đủ số dư

### 🔔 Mô phỏng sự kiện (Admin)
- Kích hoạt nhận tiền từ server (mô phỏng lương, chuyển khoản)
- Tạo cảnh báo ngân sách
- Tạo 30 test users cùng lúc

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Android)                          │
│              Kotlin + Jetpack Compose + Hilt DI                   │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────────────┐ │
│  │ Trang chủ│  │ Quỹ      │  │ QR    │  │ Ngân hàng (10)   │ │
│  └─────────┘  └──────────┘  └────────┘  └──────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                     │
│  TypeScript + PostgreSQL + Redis                                 │
│                                                                  │
│  Auth │ Banks │ Funds │ Transactions │ QR │ Allocation │ Notify │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGrok Tunnel (Public URL)                      │
│              https://abc123.ngrok.io -> localhost:3000           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Internet
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    30 User Mobile Phones                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Hướng dẫn nhanh

### Bước 1: Khởi động Backend

```bash
cd /home/khang/khang_lab/fintech-app/backend

# Cài dependencies
npm install

# Khởi động PostgreSQL và Redis
docker-compose up -d postgres redis

# Chờ database khởi động
sleep 5

# Chạy backend
npm run dev
```

Backend sẽ chạy tại `http://localhost:3000`

### Bước 2: Cài đặt ngrok (Publish ra Internet)

```bash
# Đăng ký tài khoản ngrok tại https://ngrok.com

# Cài đặt ngrok
# Download từ https://ngrok.com/download

# Cấu hình authtoken
ngrok config add-authtoken YOUR_TOKEN

# Chạy tunnel (trong terminal mới)
ngrok http 3000
```

Copy URL từ ngrok, ví dụ: `https://abc123.ngrok.io`

### Bước 3: Cập nhật URL trong Android App

Sửa file `android-client/app/build.gradle.kts`:

```kotlin
defaultConfig {
    // ...
    buildConfigField("String", "BASE_URL", "\"https://abc123.ngrok.io/api/v1/\"")
}
```

### Bước 4: Build APK

```bash
cd /home/khang/khang_lab/fintech-app/android-client

# Build debug APK
./gradlew assembleDebug

# APK tại: app/build/outputs/apk/debug/app-debug.apk
```

### Bước 5: Cài đặt trên điện thoại

```bash
# Qua USB
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Hoặc copy file APK sang điện thoại
# Enable "Unknown sources" trong Settings
# Mở APK và cài đặt
```

### Bước 6: Tạo 30 Test Users

```bash
# Login admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fintechapp.com","password":"admin123"}'

# Copy accessToken từ response, sau đó:

curl -X POST http://localhost:3000/api/v1/simulation/create-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"count":30}'
```

---

## 👤 Đăng nhập Test

| Email | Password |
|-------|----------|
| admin@fintechapp.com | admin123 |
| student1@university.edu | Test123456 |
| student2@university.edu | Test123456 |
| ... | ... |
| student30@university.edu | Test123456 |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/v1/auth/register` | Đăng ký |
| POST | `/api/v1/auth/login` | Đăng nhập |
| POST | `/api/v1/auth/refresh` | Refresh token |

### Banks (Simulated)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/v1/banks` | Danh sách 10 ngân hàng |
| POST | `/api/v1/banks/connect` | Kết nối tài khoản ngân hàng |

### Funds
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/v1/funds` | Danh sách quỹ |
| POST | `/api/v1/funds` | Tạo quỹ mới |
| POST | `/api/v1/funds/contribute` | Nạp/Rút tiền |

### Transactions
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/v1/transactions` | Danh sách giao dịch |
| POST | `/api/v1/transactions` | Tạo giao dịch |
| POST | `/api/v1/transactions/transfer` | Chuyển tiền |

### QR Code
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/v1/qr/generate-receive` | Tạo QR nhận tiền |
| POST | `/api/v1/qr/process` | Xử lý QR (scan) |
| POST | `/api/v1/qr/confirm-transfer` | Xác nhận chuyển tiền |

### Simulation (Admin)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/v1/simulation/create-users` | Tạo test users |
| POST | `/api/v1/simulation/incoming-transfer` | Mô phỏng nhận tiền |

---

## 🔧 Cấu hình

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fintech
DB_USER=fintech
DB_PASSWORD=fintech_dev
JWT_SECRET=your-jwt-secret-change-me
QR_SECRET=qr-signing-secret-change-me
```

### Android

```kotlin
// app/build.gradle.kts
defaultConfig {
    // Debug ( emulator )
    buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
    
    // Production ( ngrok )
    buildConfigField("String", "BASE_URL", "\"https://your-ngrok-url/api/v1/\"")
}
```

---

## 📁 Cấu trúc dự án

```
fintech-app/
├── android-client/          # Android App (Kotlin + Compose + Hilt)
│   ├── app/
│   │   ├── src/main/java/com/group6/fintechapp/
│   │   │   ├── di/           # Dependency Injection
│   │   │   ├── data/         # API, Models, Repository
│   │   │   └── ui/          # Screens (Auth, Home, Fund, QR...)
│   │   └── build.gradle.kts
│   └── build.sh             # Build script
│
├── backend/                 # Backend Server
│   ├── src/
│   │   ├── services/        # Auth, Bank, Fund, Transaction, QR...
│   │   └── shared/          # Database, Middleware
│   ├── init_v2.sql          # Database Schema mới
│   └── docker-compose.yml
│
├── quickstart.sh            # Script khởi động nhanh
├── BUILD_GUIDE.md          # Hướng dẫn build chi tiết
└── PROJECT_ANALYSIS_VI.md  # Báo cáo phân tích
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile | Kotlin, Jetpack Compose, Hilt, Retrofit |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| QR Code | ZXing (Android), qrcode (Node) |
| Auth | JWT |
| Tunnel | ngrok |
| Container | Docker |

---

## ⚠️ Troubleshooting

### "Database connection failed"
```bash
docker-compose restart postgres
```

### "ngrok disconnecting"
- Đăng ký tài khoản ngrok (miễn phí)
- Sử dụng persistent tunnel với config

### "APK install failed on phone"
- Enable "Unknown sources" trong Settings → Security
- Hoặc: Settings → Apps → Special access → Install unknown apps

### "Backend URL not working"
- Kiểm tra ngrok đang chạy
- Đảm bảo BASE_URL có `/api/v1/` ở cuối
- Thử restart ngrok

---

## 📞 Test Users cho 30 người

Sau khi chạy `simulation/create-users`:

| STT | Email | Password |
|-----|-------|----------|
| 1 | student1@university.edu | Test123456 |
| 2 | student2@university.edu | Test123456 |
| ... | ... | ... |
| 30 | student30@university.edu | Test123456 |

Mỗi user được tự động tạo 4 quỹ mặc định:
- Quỹ Ăn uống
- Quỹ Di chuyển
- Quỹ Tiết kiệm
- Quỹ Chi tiêu chung

---

## License

MIT License
