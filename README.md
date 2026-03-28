# Fintech App - Personal Finance Management

Ứng dụng quản lý tài chính cá nhân được xây dựng theo kiến trúc SOA/Microservices.

## 📱 Tính năng

- **Quản lý tài khoản**: Theo dõi nhiều tài khoản ngân hàng
- **Giao dịch**: Ghi chép thu chi, phân loại theo danh mục
- **Ngân sách**: Đặt hạn mức chi tiêu theo danh mục
- **Quét hóa đơn (OCR)**: Chụp ảnh hóa đơn, tự động nhận dạng thông tin
- **Quỹ nhóm**: Tạo và quản lý quỹ chung với bạn bè/gia đình
- **Báo cáo**: Thống kê chi tiêu, xuất PDF
- **Thông báo**: Cảnh báo vượt ngân sách, nhắc thanh toán

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                     Android Client                           │
│         (Kotlin + Jetpack Compose + Retrofit)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (HTTPS)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│              (Node.js + Express + TypeScript)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  User   │ │ Account │ │ Trans-  │ │ Budget  │           │
│  │ Service │ │ Service │ │ action  │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Bill   │ │  Fund   │ │ Notif-  │ │ Report  │           │
│  │ (OCR)   │ │ Service │ │ ication │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│     PostgreSQL (DB)    │    Redis (Cache)    │   Files      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Cấu trúc dự án

```
fintech-app/
├── android-client/          # Ứng dụng Android
│   ├── app/src/main/java/
│   │   └── com/group6/fintechapp/
│   │       ├── core/        # Network, Auth, Utils
│   │       ├── data/        # Models, API, Repository
│   │       └── feature/     # UI Screens
│   └── build.gradle.kts
│
├── backend/                 # Backend Server
│   ├── src/
│   │   ├── services/        # 8 Microservices
│   │   ├── shared/          # Common utilities
│   │   └── config/          # Configuration
│   ├── docker-compose.yml
│   └── package.json
│
└── docs/                    # Documentation
    └── architecture.md
```

## 🚀 Hướng dẫn chạy

### Yêu cầu

- **Node.js** >= 18.x
- **Docker** & Docker Compose
- **Android Studio** (hoặc JDK 17 + Android SDK)
- **Git**

### 1. Clone dự án

```bash
git clone <repository-url>
cd fintech-app
```

### 2. Chạy Backend

```bash
# Vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Khởi động PostgreSQL và Redis
docker compose up -d

# Đợi database khởi động (5-10 giây)
sleep 5

# Chạy server development
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

**API Endpoints:**
- Health check: `GET /health`
- Auth: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`
- Transactions: `GET/POST /api/v1/transactions`
- Budgets: `GET/POST /api/v1/budgets`
- Bills (OCR): `POST /api/v1/bills/upload`

### 3. Build Android App

```bash
# Vào thư mục android
cd android-client

# Build debug APK
./gradlew assembleDebug

# APK output tại:
# app/build/outputs/apk/debug/app-debug.apk
```

### 4. Cài đặt APK

- Sao chép file APK vào điện thoại Android
- Cài đặt và chạy ứng dụng
- Đăng ký tài khoản mới hoặc đăng nhập

> **Lưu ý:** Để kết nối với backend từ emulator, URL đã được cấu hình là `http://10.0.2.2:3000`. Nếu chạy trên thiết bị thật, cần đổi IP trong `ApiClient.kt`.

## 🔧 Cấu hình

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://fintech:fintech123@localhost:5433/fintech_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# OCR
TESSERACT_LANG=vie+eng
```

### Android (ApiClient.kt)

```kotlin
// Emulator
private const val BASE_URL = "http://10.0.2.2:3000/api/v1/"

// Thiết bị thật (thay IP của máy chạy backend)
private const val BASE_URL = "http://192.168.1.x:3000/api/v1/"
```

## 📋 API Testing

### Đăng ký tài khoản

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Nguyen Van A"
  }'
```

### Đăng nhập

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Tạo giao dịch

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 50000,
    "type": "expense",
    "categoryId": "food",
    "description": "Ăn trưa",
    "date": "2024-03-28"
  }'
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile | Kotlin, Jetpack Compose, Retrofit, Coroutines |
| Backend | Node.js, TypeScript, Express.js |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| OCR | Tesseract.js |
| PDF | PDFKit |
| Auth | JWT (JSON Web Tokens) |
| Container | Docker, Docker Compose |

## 👥 Nhóm phát triển

**Nhóm 6** - Môn học Kiến trúc phần mềm

## 📄 License

MIT License
