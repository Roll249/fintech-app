# BÁO CÁO PHÂN TÍCH CHI TIẾT DỰ ÁN FINTECH APP

> **Đường dẫn dự án**: `/home/khang/khang_lab/fintech-app`
> **Ngày phân tích**: Thứ Sáu, 10 tháng 4 năm 2026
> **Phạm vi phân tích**: `android-client/` + `backend/`

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Phân tích Android Client](#2-phân-tích-android-client)
   - 2.1 [Cấu trúc dự án](#21-cấu-trúc-dự-án)
   - 2.2 [Thiết kế kiến trúc](#22-thiết-kế-kiến-trúc)
   - 2.3 [Các vấn đề bảo mật](#23-các-vấn-đề-bảo-mật)
   - 2.4 [Các vấn đề chất lượng code](#24-các-vấn-đề-chất-lượng-code)
   - 2.5 [Các vấn đề hiệu năng](#25-các-vấn-đề-hiệu-năng)
   - 2.6 [Quản lý dependencies](#26-quản-lý-dependencies)
3. [Phân tích Backend](#3-phân-tích-backend)
   - 3.1 [Cấu trúc dự án](#31-cấu-trúc-dự-án)
   - 3.2 [Thiết kế kiến trúc](#32-thiết-kế-kiến-trúc)
   - 3.3 [Các vấn đề bảo mật](#33-các-vấn-đề-bảo-mật)
   - 3.4 [Các vấn đề chất lượng code](#34-các-vấn-đề-chất-lượng-code)
   - 3.5 [Thiết kế Database](#35-thiết-kế-database)
   - 3.6 [Thiết kế API](#36-thiết-kế-api)
4. [Các vấn đề xuyên module](#4-các-vấn-đề-xuyên-module)
5. [Tổng hợp mức độ ưu tiên](#5-tổng-hợp-mức-độ-ưu-tiên)
6. [Kế hoạch thiết kế lại app Fintech mới](#6-kế-hoạch-thiết-kế-lại-app-fintech-mới)
   - 6.1 [Tầm nhìn và mục tiêu](#61-tầm-nhìn-và-mục-tiêu)
   - 6.2 [Kiến trúc hệ thống](#62-kiến-trúc-hệ-thống)
   - 6.3 [Các tính năng mới chính](#63-các-tính-năng-mới-chính)
   - 6.4 [Giả lập ngân hàng](#64-giả-lập-ngân-hàng)
   - 6.5 [Hệ thống QR Code](#65-hệ-thống-qr-code)
   - 6.6 [Quản lý quỹ và tự động chia tiền](#66-quản-lý-quỹ-và-tự-động-chia-tiền)
   - 6.7 [Lộ trình triển khai](#67-lộ-trình-triển-khai)
7. [Hướng dẫn triển khai cho 30 người dùng](#7-hướng-dẫn-triển-khai-cho-30-người-dùng)

---

## 1. Tổng quan dự án

| Module | Tech Stack | Chức năng chính |
|--------|------------|-----------------|
| **android-client** | Kotlin + Jetpack Compose + MVVM | Quản lý tài chính (tài khoản, giao dịch, ngân sách, quỹ chung, quét hóa đơn, báo cáo) |
| **backend** | Node.js + Express + TypeScript + PostgreSQL | RESTful API, OCR xử lý hóa đơn, push notification, tích hợp ngân hàng OAuth |

```
fintech-app/
├── android-client/          # Ứng dụng Android
│   ├── app/src/main/java/com/group6/fintechapp/
│   │   ├── core/            # Module core (network, auth, settings)
│   │   ├── data/            # Tầng data (API, Model, Repository)
│   │   ├── feature/         # Module tính năng
│   │   └── ui/              # UI theme
│   ├── build.gradle.kts
│   └── AndroidManifest.xml
│
└── backend/                 # Dịch vụ backend Node.js
    ├── src/
    │   ├── index.ts         # Entry point
    │   ├── config/          # Cấu hình
    │   ├── shared/          # Middleware và database dùng chung
    │   ├── services/        # Module business logic
    │   └── gateway/         # Gateway (đang để trống)
    ├── init.sql             # Schema database
    ├── docker-compose.yml
    └── package.json
```

---

## 2. Phân tích Android Client

### 2.1 Cấu trúc dự án

```
android-client/app/src/main/java/com/group6/fintechapp/
├── core/                              # Tầng core
│   ├── auth/TokenStore.kt             # Lưu trữ Token
│   ├── network/
│   │   ├── ApiClient.kt               # Singleton Retrofit
│   │   ├── ApiResponse.kt             # Wrapper kết quả
│   │   └── AuthInterceptor.kt        # Interceptor Token
│   └── settings/SettingsDataStore.kt  # Lưu cài đặt
│
├── data/                              # Tầng data
│   ├── api/                           # Interface API Retrofit (8 cái)
│   │   ├── UserApi.kt, TransactionApi.kt, AccountApi.kt
│   │   ├── BudgetApi.kt, FundApi.kt, BillApi.kt
│   │   ├── ReportApi.kt, NotificationApi.kt
│   ├── model/                         # Data model (8 file)
│   │   ├── UserModels.kt, TransactionModels.kt, AccountModels.kt
│   │   ├── BudgetModels.kt, FundModels.kt, BillModels.kt
│   │   ├── NotificationModels.kt, ReportModels.kt
│   └── repository/                    # Repository (8 cái)
│       ├── UserRepository.kt, TransactionRepository.kt
│       ├── AccountRepository.kt, BudgetRepository.kt
│       ├── FundRepository.kt, BillRepository.kt
│       ├── ReportRepository.kt, NotificationRepository.kt
│
├── feature/                           # Module tính năng (MVVM)
│   ├── auth/LoginScreen.kt + AuthViewModel.kt
│   ├── home/HomeScreen.kt + HomeViewModel.kt
│   ├── transaction/TransactionScreen.kt + TransactionViewModel.kt
│   ├── budget/BudgetScreen.kt + BudgetViewModel.kt
│   ├── account/AccountScreen.kt
│   ├── fund/FundScreen.kt
│   ├── profile/ProfileScreen.kt + ProfileViewModel.kt
│   └── bill/BillScanScreen.kt + BillScanViewModel.kt
│
├── ui/theme/Theme.kt                  # Material3 theme
├── MainActivity.kt                     # Entry point
└── AppNav.kt                           # Navigation graph
```

### 2.2 Thiết kế kiến trúc

**Pattern sử dụng**: MVVM + Clean Architecture (phiên bản đơn giản)

| Tầng | Thành phần | Hiện trạng | Đánh giá |
|------|------------|------------|----------|
| **UI Layer** | Compose Screen | ✅ Dùng Jetpack Compose | Tốt |
| **ViewModel Layer** | ViewModel | ✅ Tách biệt logic UI | Cần cải thiện |
| **Repository Layer** | Repository | ✅ Đóng gói truy cập data | Cần cải thiện |
| **Data Layer** | Retrofit API | ✅ Dùng Retrofit | Cần cải thiện |

**Các vấn đề chính**:

1. **Thiếu Dependency Injection framework** — Không dùng Hilt, Koin hay DI thủ công, ViewModel/Repository tạo dependency trực tiếp trong constructor
2. **Thiếu Use Case layer** — Business logic nằm trong ViewModel
3. **Thiếu local database** — Chỉ dùng API, không có Room/SQLite để cache offline
4. **ApiClient là singleton hardcoded** — BASE_URL viết cứng trong code, không thể đổi môi trường

### 2.3 Các vấn đề bảo mật

#### Mức NGHIÊM TRỌNG (CRITICAL)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| S1 | **Cho phép lưu lượng không mã hóa** | `AndroidManifest.xml` | `android:usesCleartextTraffic="true"` cho phép HTTP, dễ bị tấn công MITM |
| S2 | **BASE_URL viết cứng** | `ApiClient.kt` | URL server viết cứng trong code, cần đặt vào `BuildConfig` |
| S3 | **Demo mode bỏ qua xác thực** | `AuthViewModel.kt` | Khi API lỗi thì tự động đăng nhập thành công, ai cũng có thể bypass |
| S4 | **Ghi log dữ liệu nhạy cảm** | `AuthInterceptor.kt` | `LoggingInterceptor` đặt `Level.BODY`, sẽ in Token ra log |

#### Mức CAO (HIGH)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| H1 | **Refresh token đồng bộ trong interceptor** | `AuthInterceptor.kt` | Gọi `refreshToken()` đồng bộ trong OkHttp Interceptor, có thể gây deadlock |
| H2 | **Parse JSON thủ công** | `AuthInterceptor.kt` | Dùng regex để parse JSON thay vì dùng JSON parser chuẩn, dễ lỗi |
| H3 | **DataStore không mã hóa** | `TokenStore.kt` | Token lưu dạng plain text trong Preferences DataStore |
| H4 | **Thiếu certificate pinning** | `ApiClient.kt` | Không có SSL certificate pinning, không chống được giả mạo certificate |

#### Mức TRUNG BÌNH (MEDIUM)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| M1 | **Logging interceptor không phân biệt build** | `OkHttpClient.Builder` | `addInterceptor(logging)` bật ở cả release lẫn debug |
| M2 | **Không có xác thực sinh trắc học** | `LoginScreen.kt` | Không hỗ trợ vân tay/khuôn mặt |
| M3 | **Session không bao giờ hết hạn** | `TokenStore.kt` | Không có auto logout hay session timeout |

### 2.4 Các vấn đề chất lượng code

#### 2.4.1 Quy tắc đặt tên không nhất quán

| Loại vấn đề | Ví dụ | Nên đổi thành |
|-------------|-------|---------------|
| Đặt tên hỗn hợp | `TransactionScreen.kt` nhưng `HomeViewModel.kt` | Thống nhất suffix |
| Data Class không có suffix | `User`, `Transaction`, `Budget` | `UserModel`, `TransactionModel` |
| API Interface không có suffix | `UserApi`, `TransactionApi` | `UserApiService`, `TransactionApiService` |
| File name không nhất quán | Có chữ thường, có chữ hoa đầu | Thống nhất lowercase underscore hoặc camelCase |

#### 2.4.2 Singleton pattern không chuẩn

```kotlin
// TokenStore.kt — "singleton" không có constructor public
class TokenStore(private val context: Context) {
    // ...
}
```

**Vấn đề**: Class này trông như class thường nhưng mục đích là singleton, cần:
- Dùng `object` để khai báo singleton thực sự
- Hoặc cung cấp method `getInstance()` public
- Hoặc quản lý qua DI framework

#### 2.4.3 ViewModel tạo API instance trực tiếp

```kotlin
// HomeViewModel.kt
class HomeViewModel(
    private val userApi: UserApi = ApiClient.createService()
) : ViewModel() {
    // Mỗi ViewModel tạo mới đều gọi ApiClient.createService()
}
```

**Vấn đề**:
- Dependency được tạo bên trong class, vi phạm nguyên tắc Dependency Inversion
- Không thể inject mock để test
- `ApiClient.createService()` được gọi lặp lại gây lãng phí

#### 2.4.4 Hardcoded Mock Data

```kotlin
// HomeViewModel.kt — getMockUser() method
```

**Vấn đề**: Mock data viết trực tiếp trong ViewModel, nên:
- Dùng Build Variant (debug flavor) để phân biệt
- Tạo MockRepository riêng
- Dùng WireMock/MockWebServer ở tầng network

#### 2.4.5 Xử lý lỗi không đồng nhất

Mỗi Repository xử lý lỗi khác nhau:

| Repository | Cách xử lý lỗi |
|------------|----------------|
| `UserRepository.kt` | try-catch trả Result |
| `TransactionRepository.kt` | try-catch trả Result |
| `BudgetRepository.kt` | try-catch trả Result |

Dù đều dùng `Result`, nhưng kiểu error trong `Result.failure()` không统一, có nơi dùng `Exception`, có nơi dùng `Throwable` tự định nghĩa.

### 2.5 Các vấn đề hiệu năng

| # | Vấn đề | Mô tả | Tác động |
|---|--------|--------|----------|
| P1 | **Tạo Retrofit Service lặp lại** | `ApiClient.createService()` được gọi trong mỗi Repository/ViewModel | Tạo quá nhiều OkHttpClient instance |
| P2 | **Logging interceptor ghi tất cả request body** | Bao gồm ảnh base64 và dữ liệu lớn | Tốn memory, logcat dài không cần thiết |
| P3 | **Không có UI phân trang** | `TransactionScreen` không có pagination/pull-to-refresh | Danh sách giao dịch dài thì render chậm |
| P4 | **Không nén ảnh** | Bill scan lưu nguyên ảnh gốc | Tốn storage, upload chậm |
| P5 | **Không có HTTP cache** | Không có HTTP cache strategy | Request lặp lại tốn data |

### 2.6 Quản lý dependencies

`build.gradle.kts` sử dụng các version:

| Thư viện | Version | Tình trạng |
|----------|---------|------------|
| Compose BOM | 2024.06.00 | ⚠️ Đã cũ (bản mới nhất khoảng 2025.x) |
| Retrofit | 2.11.0 | ⚠️ Đã cũ (bản mới nhất 2.12.x) |
| OkHttp | 4.12.0 | ✅ Mới nhất |
| Navigation Compose | 2.7.7 | ⚠️ Đã cũ |
| Material3 | 1.2.x (BOM) | ⚠️ Đã cũ |

**Vấn đề**:
- Dependencies version lỗi thời, có thể có bug và lỗ hổng bảo mật đã được fix
- Không dùng `dependencyUpdates` hay Renovate để theo dõi cập nhật

---

## 3. Phân tích Backend

### 3.1 Cấu trúc dự án

```
backend/
├── src/
│   ├── index.ts                      # Express entry
│   ├── config/index.ts               # Environment variables
│   ├── shared/
│   │   ├── db.ts                     # PostgreSQL connection pool
│   │   └── middleware/
│   │       ├── auth.middleware.ts    # JWT verification
│   │       └── error.middleware.ts   # Unified error handling
│   ├── services/
│   │   ├── user/                     # User module
│   │   │   ├── user.controller.ts
│   │   │   └── user.routes.ts
│   │   ├── account/                  # Account module
│   │   ├── transaction/              # Transaction module
│   │   ├── budget/                   # Budget module
│   │   ├── bill/                     # OCR bill module
│   │   ├── fund/                     # Fund module
│   │   ├── notification/              # Notification module
│   │   ├── report/                   # Report module
│   │   ├── admin/                    # Admin panel
│   │   ├── integration/              # Bank integration
│   │   ├── queue/                    # Background job queue
│   │   └── scheduler/                # Cron jobs
│   └── gateway/                      # API Gateway (reserved)
│
├── init.sql                          # Full database schema
├── docker-compose.yml                # PostgreSQL + Redis
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

**Thống kê module tính năng**:

| Module | Số endpoint | Tổng cộng |
|--------|------------|----------|
| User | 11 | |
| Account | 11 | |
| Transaction | 8 | |
| Budget | 9 | |
| Bill (OCR) | 11 | |
| Fund | 14 | |
| Notification | 10 | |
| Report | 12 | |
| Admin | 9 | |
| Integration | 5 | |
| **Tổng** | | **100** |

### 3.2 Thiết kế kiến trúc

**Pattern sử dụng**: MVC (Controller + Routes)

```
Request → Middleware → Controller → Service → Database
                 ↓
            (middleware tùy chọn: auth, error, rate-limit)
```

**Ưu điểm**:
- ✅ Cấu trúc thư mục rõ ràng, phân chia theo module tính năng
- ✅ Dùng TypeScript strict mode để tăng type safety
- ✅ RESTful naming convention cơ bản đúng
- ✅ Database connection pool được quản lý tốt
- ✅ JWT authentication mechanism đầy đủ

**Nhược điểm**:
- ❌ Không có Service layer tách biệt, toàn bộ business logic trong Controller
- ❌ Không có Request/Response DTO type definition
- ❌ Không có Repository layer, data query viết trực tiếp trong Controller/Service
- ❌ Không có integration test và unit test file
- ❌ Không có Swagger/OpenAPI documentation

### 3.3 Các vấn đề bảo mật

#### Mức NGHIÊM TRỌNG (CRITICAL)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| BE-S1 | **JWT Secret mặc định cứng** | `config/index.ts` | `secret: process.env.JWT_SECRET \|\| 'dev-secret-change-me'` — Không bắt buộc environment variable, không verify lúc khởi động |
| BE-S2 | **OAuth được giả lập** | `user.controller.ts` (dòng 361-366) | Google OAuth không thực sự verify token, chỉ mock data, ai cũng có thể giả mạo identity |
| BE-S3 | **Webhook Secret có fallback không an toàn** | `bank.service.ts` (dòng 276) | `vcb: process.env.VCB_WEBHOOK_SECRET \|\| 'vcb_webhook_secret'` — Production có thể dùng giá trị mặc định |

#### Mức CAO (HIGH)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| BE-H1 | **Rate limiting chưa được bật** | `index.ts` | `rate-limit` có trong dependencies nhưng chưa áp dụng vào routes |
| BE-H2 | **Thiếu input validation** | Nhiều controller | Dù đã import Zod nhưng phần lớn endpoint không validate input |
| BE-H3 | **Nguy cơ SQL Injection** | Nhiều controller | Dùng string interpolation để build SQL query (ví dụ `SELECT * FROM ${tableName}` không có parameterized) |
| BE-H4 | **Upload file không giới hạn size** | `bill.controller.ts` | `fs.writeFile(filepath, file.buffer)` — Không check kích thước file |
| BE-H5 | **Ghi log dữ liệu nhạy cảm** | `user.controller.ts` (dòng 288) | `console.log(`Password reset token for ${email}: ${resetToken}`)` — Token được in ra console |

#### Mức TRUNG BÌNH (MEDIUM)

| # | Vấn đề | Vị trí | Mô tả |
|---|--------|--------|--------|
| BE-M1 | **CORS mở hoàn toàn** | `index.ts` | `app.use(cors())` — Cho phép tất cả origins cross-domain |
| BE-M2 | **Refresh Token không có rotation** | `user.controller.ts` | Refresh token được dùng rồi không bị revoke ngay |
| BE-M3 | **Không có account lockout policy** | `user.controller.ts` | Không giới hạn số lần đăng nhập thất bại, dễ bị brute force |
| BE-M4 | **Thiếu request timeout** | `index.ts` | Express server không có global request timeout |
| BE-M5 | **Error message leak internal details** | `error.middleware.ts` | Production có thể trả về stack trace |

### 3.4 Các vấn đề chất lượng code

#### 3.4.1 Magic Numbers

```typescript
// account.controller.ts — dòng 96
const initialBalance = Math.floor(Math.random() * 50000000) + 1000000;

// bill.controller.ts — dòng 89
const filename = `${uuidv4()}-${Date.now()}.jpg`;
// UUID đã unique rồi, Date.now() là thừa

// budget.controller.ts — dòng 330
analysisperiod: {  // Nên là analysisPeriod (camelCase)
```

#### 3.4.2 TODO chưa hoàn thành

```typescript
// user.controller.ts — dòng 287
// TODO: Send email with reset link containing resetToken
// ← TODO này tồn tại nhưng chưa bao giờ implement, user không nhận được email

// user.controller.ts — dòng 351-358
// TODO: Verify Google ID token using google-auth-library
// ← Google OAuth là mock, không phải implementation thực sự
```

#### 3.4.3 Code trùng lặp

- `OcrService.preprocessImage()` và `processWithTesseract()` có logic xử lý ảnh trùng lặp
- Nhiều controller có pattern validation giống nhau
- Error handling với console.log pattern lặp lại ở tất cả controller

#### 3.4.4 Thiếu Database Transactions

```typescript
// fund.controller.ts — contribute() method
// Ba câu query độc lập, nên bọc trong transaction:
// 1. INSERT fund_contributions
// 2. UPDATE funds (current_amount)
// 3. UPDATE fund_members (contribution)
// Nếu bước 3 fail, bước 1 và 2 không rollback
```

#### 3.4.5 Response format không đồng nhất

```typescript
// user.controller.ts — login response
res.status(201).json({
  accessToken, refreshToken, expiresIn, user: {...}
});

// transaction.controller.ts — list response
res.json({
  items: [...], page: Number(page), pageSize: Number(pageSize),
});

// fund.controller.ts — contribution list
// Có pagination nhưng không trả về totalItems/totalPages
```

### 3.5 Thiết kế Database

`init.sql` có 18 bảng và 9 indexes, design tổng thể tốt:

**Ưu điểm**:
- ✅ Dùng `uuid-ossp` để generate UUID làm primary key
- ✅ Các bảng quan trọng có indexes phù hợp
- ✅ Dùng foreign key constraints để đảm bảo referential integrity
- ✅ `refresh_tokens` table có cột `revoked` để support token revocation
- ✅ `job_queue` table implement background job queue
- ✅ `bank_webhook_events` table đảm bảo webhook idempotency

**Nhược điểm**:

| # | Vấn đề | Mô tả |
|---|--------|--------|
| D1 | **Thiếu indexes** | Bảng `fund_contributions` không có indexes trên `fund_id` và `user_id` |
| D2 | **Không có soft delete** | Phần lớn bảng không có `deleted_at` hay `is_active` column, không恢复 đã xóa data |
| D3 | **Password hash cost thấp** | bcrypt salt rounds = 12, hardware hiện tại có thể brute force trong thời gian hợp lý |
| D4 | **Thiếu audit table cho tất cả changes** | Chỉ có `audit_logs` record admin operations, user operations không được audit |
| D5 | **OAuth Token thiếu expiration** | Bảng `oauth_accounts` không có `expires_at` column |
| D6 | **Notification không có composite index** | Bảng `notifications` không có composite index trên `user_id + is_read` |

### 3.6 Thiết kế API

**RESTful convention**:

| Convention | Implementation | Status |
|------------|---------------|--------|
| Đặt tên resource bằng danh từ số nhiều | ✅ | `/users`, `/accounts`, `/transactions` |
| Dùng đúng HTTP methods | ✅ | GET/POST/PUT/DELETE phân biệt CRUD |
| Dùng `/me` để lấy current user | ✅ | `GET /users/me` |
| Nested routes | ✅ | `GET /accounts/:id/transactions` |
| Unified response format | ❌ | Mỗi endpoint trả về format khác nhau |
| Unified error response format | ❌ | Không có standard error body format |
| Unified pagination metadata | ❌ | Có endpoint trả totalPages, có endpoint không |
| OpenAPI documentation | ❌ | Hoàn toàn không có |

**HTTP status code usage**:

| Status code | Use case | Đánh giá |
|-------------|----------|----------|
| 200 | Successful get resource | ✅ |
| 201 | Successful create resource | ✅ |
| 204 | Successful delete (no body) | ⚠️ Một số endpoint trả 200 thay vì 204 |
| 400 | Request param error | ⚠️ Đôi khi trả 500 |
| 401 | Not authenticated | ⚠️ Đôi khi trả 400 |
| 403 | Not authorized | ⚠️ Đôi khi trả 401 |
| 404 | Resource not found | ⚠️ Đôi khi không trả 404 |
| 500 | Server error | ⚠️ Đôi khi trả 400 cho client errors |

---

## 4. Các vấn đề xuyên module

### 4.1 Vấn đề tích hợp Frontend-Backend

| # | Vấn đề | Android | Backend | Tác động |
|---|--------|---------|---------|----------|
| C1 | **Error response format không khớp** | `ApiResponse.kt` expect format cố định | Backend trả format không đồng nhất | Lỗi mạng bị xử lý thành lỗi nghiệp vụ |
| C2 | **Date format không đồng nhất** | Dùng Kotlin `LocalDateTime` | Trả về ISO 8601 string hoặc Unix timestamp | Parse date có thể lỗi |
| C3 | **Amount precision** | `Double` | PostgreSQL `DECIMAL` | Nguy cơ mất precision với floating point |
| C4 | **Pagination param không khớp** | `page` bắt đầu từ 1 | Backend bắt đầu từ 1 | Lần request đầu đúng, offset sau đó sai |
| C5 | **File upload format** | multipart/form-data | Xử lý multipart nhưng thiếu validation | Không giới hạn APK size |

### 4.2 Vấn đề nhất quán kiến trúc

| Vấn đề | Android | Backend | Tác động |
|--------|---------|---------|----------|
| Không có unified error code system | Custom `Result<T>` | Trực tiếp throw/sendError | Client không thể xác định chính xác loại lỗi |
| Không có API versioning | Không có version prefix | Không có `/v1/` path | Không thể backward-compatible update |
| Không có request log tracking | Không có request ID | Không có request ID middleware | Khó debug |

---

## 5. Tổng hợp mức độ ưu tiên

### 5.1 Android Client

| Ưu tiên | Số lượng | Issue IDs |
|---------|----------|-----------|
| **CRITICAL (Sửa ngay)** | 4 | S1, S2, S3, S4 |
| **HIGH (Sửa trong ngắn hạn)** | 4 | H1, H2, H3, H4 |
| **MEDIUM (Cải thiện trung hạn)** | 3 | M1, M2, M3 |
| **LOW (Tối ưu dài hạn)** | 5+ | Các vấn đề hiệu năng, cập nhật dependencies |

### 5.2 Backend

| Ưu tiên | Số lượng | Issue IDs |
|---------|----------|-----------|
| **CRITICAL (Sửa ngay)** | 3 | BE-S1, BE-S2, BE-S3 |
| **HIGH (Sửa trong ngắn hạn)** | 5 | BE-H1, BE-H2, BE-H3, BE-H4, BE-H5 |
| **MEDIUM (Cải thiện trung hạn)** | 5 | BE-M1, BE-M2, BE-M3, BE-M4, BE-M5 |
| **LOW (Tối ưu dài hạn)** | 5+ | Code quality, test coverage |

### 5.3 Cross-module

| Ưu tiên | Số lượng | Issue IDs |
|---------|----------|-----------|
| **HIGH** | 3 | C1, C3, C5 |
| **MEDIUM** | 2 | C2, C4 |

---

## 6. Kế hoạch thiết kế lại app Fintech mới

### 6.1 Tầm nhìn và mục tiêu

Dựa trên tài liệu [GROUP 6] SOA.md, tầm nhìn của dự án là:

> **Xây dựng một ứng dụng quản lý tài chính cá nhân hoàn chỉnh, chạy trên thiết bị di động thực, kết nối đến server backend trên laptop, với hệ thống giả lập ngân hàng để test thanh toán và chuyển tiền.**

#### Mục tiêu cụ thể cho phiên bản mới:

| Mục tiêu | Mô tả |
|----------|-------|
| **M1: Di động thực** | Build APK/AAB để cài trên điện thoại thật (không phải giả lập) |
| **M2: Kết nối server laptop** | Backend chạy trên laptop, mobile app kết nối qua địa chỉ có thể truy cập từ điện thoại |
| **M3: Giả lập 10 ngân hàng** | Tạo hệ thống 10 ngân hàng VN với API giả lập |
| **M4: QR thanh toán** | QR nhận tiền, QR chuyển tiền, mỗi loại có format khác nhau |
| **M5: Quản lý quỹ thông minh** | Tự động chia tiền vào quỹ khi nhận, xử lý thiếu tiền |
| **M6: Hỗ trợ 30 người dùng** | Có kế hoạch deploy để 30 sinh viên cùng test |

### 6.2 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (Android)                      │
│  Jetpack Compose + MVVM + Hilt + Room + Retrofit               │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────────────┐  │
│  │ Home    │  │ QR Scan  │  │ Funds  │  │ Bank Connection  │  │
│  └─────────┘  └──────────┘  └────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                  │
│  TypeScript + PostgreSQL + Redis                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────────────┐  │
│  │ Auth Svc │  │ Account   │  │ Fund   │  │ QR Code Svc    │  │
│  └──────────┘  └──────────┘  └────────┘  └────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────────────┐  │
│  │Transaction│ │ Budget    │  │ Report │  │ Bank Simulator │  │
│  └──────────┘  └──────────┘  └────────┘  └────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATED BANKING SYSTEM                      │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ VCB  │ │ VTB  │ │ BIDV │ │ TPB  │ │ ACB  │  ... 10 banks  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                                  │
│  Mỗi bank có: balance, transactions, OAuth flow (mocked)      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Các tính năng mới chính

#### 6.3.1 Hệ thống giả lập ngân hàng (Bank Simulator)

**10 ngân hàng giả lập**:

| Mã | Tên ngân hàng | Mã QR | Màu chủ đạo |
|----|---------------|-------|-------------|
| VCB | Vietcombank | 970436 | 🔴 Đỏ |
| VTB | VietinBank | 970415 | 🟢 Xanh lá |
| BIDV | BIDV | 970418 | 🟡 Vàng |
| TPB | TPBank | 970423 | 🟠 Cam |
| ACB | ACB | 970416 | 🔵 Xanh dương |
| MB | MBBank | 970422 | 🟣 Tím |
| SHB | SHB | 970429 | 🟤 Nâu |
| OCB | OCB | 970448 | 🔷 Xanh coban |
| HDB | HDBank | 970437 | 🟢 Xanh |
| VIB | VIB | 970441 | 🔴 Đỏ đậm |

**Tính năng của mỗi ngân hàng giả lập**:

- **Kết nối OAuth** — User chọn ngân hàng → mock OAuth flow → lưu mock access token
- **Lấy số dư** — Gọi API giả lập trả về số dư ngẫu nhiên
- **Lấy lịch sử giao dịch** — Trả về danh sách giao dịch mock
- **Webhook simulation** — Khi có giao dịch mới, trigger webhook (mocked)

**Database schema cho simulated banks**:

```sql
-- simulated_bank_accounts (tài khoản mock trong mỗi ngân hàng)
CREATE TABLE simulated_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    bank_code VARCHAR(10) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    balance DECIMAL(15,0) DEFAULT 10000000, -- 10 triệu VND ban đầu
    mock_access_token TEXT,
    mock_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, bank_code, account_number)
);

-- simulated_bank_transactions
CREATE TABLE simulated_bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES simulated_bank_accounts(id),
    transaction_ref VARCHAR(50) UNIQUE,
    amount DECIMAL(15,0) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'IN' hoặc 'OUT'
    description TEXT,
    counterparty_account VARCHAR(20),
    counterparty_name VARCHAR(100),
    transaction_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6.3.2 Hệ thống QR Code

**Thiết kế QR Code Format**:

Cấu trúc QR data sử dụng JSON encoding với prefix để phân biệt loại:

```typescript
// Base structure cho tất cả QR
interface BaseQR {
  version: string;      // "1.0"
  type: QRType;         // "RECEIVE" | "TRANSFER" | "BILL"
  timestamp: number;    // Unix timestamp
  signature?: string;  // HMAC-SHA256 signature
}

type QRType = "RECEIVE" | "TRANSFER" | "BILL";
```

**QR Nhận tiền (RECEIVE)**:

```typescript
interface ReceiveQR extends BaseQR {
  type: "RECEIVE";
  userId: string;              // UUID của người nhận
  amount?: number;              // Số tiền cố định (optional)
  message?: string;            // Nội dung chuyển tiền
  autoAllocate: boolean;       // Tự động chia vào quỹ
  allocateRules?: AllocateRule[];
}

interface AllocateRule {
  fundId: string;
  percentage: number;  // 0-100
  priority: number;    // Thứ tự ưu tiên
}

// QR nhận tiền không cố định số tiền
// {
//   "version": "1.0",
//   "type": "RECEIVE",
//   "userId": "550e8400-e29b-41d4-a716-446655440000",
//   "message": "Thanks for lunch!",
//   "autoAllocate": true,
//   "allocateRules": [
//     { "fundId": "food-fund-uuid", "percentage": 100, "priority": 1 }
//   ],
//   "timestamp": 1712659200000
// }
```

**QR Chuyển tiền (TRANSFER)**:

```typescript
interface TransferQR extends BaseQR {
  type: "TRANSFER";
  senderId: string;             // UUID người gửi
  targetUserId: string;         // UUID người nhận
  targetBankCode: string;       // Mã ngân hàng
  amount: number;               // Số tiền (bắt buộc)
  description: string;          // Mô tả
  sourceFundId?: string;         // Quỹ nguồn để trừ (optional)
  autoDebit: boolean;            // Tự động trừ từ quỹ
}

// QR chuyển tiền - khi app scan sẽ hiển thị confirm
// {
//   "version": "1.0",
//   "type": "TRANSFER",
//   "senderId": "user-uuid-1",
//   "targetUserId": "user-uuid-2",
//   "targetBankCode": "VCB",
//   "amount": 50000,
//   "description": "Trả tiền cơm",
//   "autoDebit": true,
//   "timestamp": 1712659200000
// }
```

**QR Thanh toán hóa đơn (BILL)**:

```typescript
interface BillQR extends BaseQR {
  type: "BILL";
  billId: string;               // ID hóa đơn trong hệ thống
  amount: number;               // Số tiền thanh toán
  merchantName: string;         // Tên merchant
  paymentDeadline?: string;      // Hạn thanh toán (ISO date)
}
```

**QR Library sử dụng**:

- **Android**: `com.google.zxing:core` để generate và parse QR
- **Backend**: `qrcode` npm package để generate

**QR Generation Flow**:

```
User muốn nhận tiền
    │
    ▼
App gọi POST /api/v1/qr/generate với type="RECEIVE"
    │
    ▼
Backend tạo QR payload + sign với HMAC
    │
    ▼
Backend trả về QR data string
    │
    ▼
App generate QR image từ string
    │
    ▼
Hiển thị QR cho người khác scan
```

#### 6.3.3 Luồng chuyển tiền với lựa chọn quỹ

```
Người dùng scan QR chuyển tiền
    │
    ▼
App decode QR → parse JSON payload
    │
    ▼
Kiểm tra QR signature (HMAC verify)
    │
    ▼
Hiển thị màn hình xác nhận:
┌─────────────────────────────────────┐
│ Chuyển tiền                        │
│                                     │
│ Người nhận: Nguyen Van B           │
│ Ngân hàng: Vietcombank             │
│ Số tiền: 50,000 VND                │
│ Nội dung: Trả tiền cơm            │
│                                     │
│ Nguồn tiền:                        │
│ ┌─────────────────────────────┐    │
│ │ ○ Quỹ Ăn uống    150,000  ✓│    │
│ │ ○ Quỹ Đi lại      80,000    │    │
│ │ ○ Quỹ Tổng quỹ  500,000     │    │
│ └─────────────────────────────┘    │
│                                     │
│ [Xác nhận chuyển]                  │
└─────────────────────────────────────┘
    │
    ▼
User chọn quỹ → Bấm Xác nhận
    │
    ▼
App gọi POST /api/v1/transactions/transfer
{
  "targetUserId": "...",
  "amount": 50000,
  "sourceFundId": "food-fund-uuid",
  "description": "Trả tiền cơm",
  "qrSignature": "..."
}
    │
    ▼
Backend kiểm tra:
1. Signature hợp lệ
2. User đủ quỹ?
    │
    ├── ĐỦ → Trừ quỹ, tạo transaction, thông báo người nhận
    │
    └── KHÔNG ĐỦ
            │
            ▼
        Hiển thị dialog:
        ┌─────────────────────────────────────┐
        │ Quỹ "Quỹ Ăn uống" chỉ còn 30,000   │
        │ Bạn có muốn trừ đủ {50,000 - 30,000}
        │ từ Quỹ Tổng quỹ không?              │
        │                                     │
        │ [Hủy]  [Trừ đủ từ Quỹ Tổng quỹ]    │
        └─────────────────────────────────────┘
            │
            ├── User chọn "Trừ đủ" → Trừ 30,000 từ Quỹ Ăn uống + 20,000 từ Quỹ Tổng quỹ
            │
            └── User chọn "Hủy" → Không làm gì
```

**Event ghi nhận khi trừ không đủ**:

```typescript
interface InsufficientFundEvent {
  id: string;
  transactionId: string;
  requestedAmount: number;
  availableAmount: number;
  shortfallAmount: number;
  primaryFundId: string;
  secondaryFundId: string | null;
  secondaryAmount: number;
  userDecision: "AUTO_TOPUP" | "DECLINED";
  userId: string;
  createdAt: Date;
}
```

#### 6.3.4 Hệ thống tự động chia tiền vào quỹ (Auto-allocation)

**Cấu hình allocation rule**:

```typescript
// User thiết lập rule cho mỗi nguồn tiền vào
interface AllocationRule {
  id: string;
  userId: string;
  name: string;
  priority: number;
  conditions: {
    minAmount?: number;      // Áp dụng nếu số tiền >= minAmount
    maxAmount?: number;      // Áp dụng nếu số tiền <= maxAmount
    source?: "BANK_TRANSFER" | "QR_RECEIVE" | "SALARY" | "OTHER";
  };
  allocations: {
    fundId: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;          // % hoặc số tiền cố định
  }[];
  isActive: boolean;
}
```

** Ví dụ allocation rules**:

| Rule Name | Điều kiện | Chia tiền |
|-----------|-----------|-----------|
| Lương | Tiền vào >= 5,000,000 | 30% vào Quỹ Tiết kiệm, 20% vào Quỹ Đầu tư |
| Tiền lẻ | Tiền vào < 500,000 | 100% vào Quỹ Chi tiêu hàng ngày |
| Quà tặng | Nguồn = QR_RECEIVE, mô tả chứa "quà" | 50% vào Quỹ Chi tiêu, 50% vào Quỹ Tiết kiệm |

**Luồng xử lý khi nhận tiền**:

```
Nhận được tiền vào tài khoản (từ bank webhook simulation)
    │
    ▼
Gọi trigger: POST /api/v1/simulate/incoming-transfer
{
  "userId": "...",
  "amount": 1000000,
  "source": "SALARY",
  "description": "Lương tháng 4"
}
    │
    ▼
Backend tìm allocation rules phù hợp
    │
    ▼
Với mỗi allocation:
- Kiểm tra fund có đủ số dư?
    │
    ├── ĐỦ → Trừ tiền trong fund
    │
    └── KHÔNG ĐỦ hoặc KHÔNG CÓ FUND
            │
            ▼
        Tạo transaction "Nhận tiền" vào account
        (không auto-allocate, đợi user tự phân bổ)
        │
        ▼
Gửi notification: "Bạn nhận được 1,000,000 VND. 
Thiết lập tự động phân bổ?"
```

#### 6.3.5 Server-side simulation commands

Để test, cần có commands để kích hoạt các sự kiện giả lập:

```typescript
// POST /api/v1/simulate/incoming-transfer
// Mô phỏng tiền vào tài khoản
{
  userId: string;
  amount: number;
  source: "SALARY" | "BONUS" | "REFUND" | "OTHER";
  description: string;
  autoAllocate: boolean;
}

// POST /api/v1/simulate/bank-transfer
// Mô phỏng chuyển khoản từ ngân hàng khác
{
  targetUserId: string;
  amount: number;
  fromBankCode: string;
  fromAccountNumber: string;
  fromAccountName: string;
  description: string;
}

// POST /api/v1/simulate/pay-bill
// Mô phỏng thanh toán hóa đơn tự động
{
  userId: string;
  billId: string;
  amount: number;
}

// POST /api/v1/simulate/budget-warning
// Mô phỏng cảnh báo ngân sách
{
  userId: string;
  budgetId: string;
  percentage: number; // 80, 90, 100...
}

// POST /api/v1/simulate/fund-goal-reached
// Mô phỏng quỹ đạt mục tiêu
{
  fundId: string;
}
```

### 6.4 Giả lập ngân hàng

#### 6.4.1 Bank OAuth Flow (Mocked)

```
┌──────────────────────────────────────────────────────────────┐
│                  MOCKED BANK OAUTH FLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User chọn "Kết nối Vietcombank"                            │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Vietcombank      │                                        │
│  │ Login Screen     │  ← Mocked UI trong app               │
│  │ (user/pwd)       │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Backend nhận credentials, verify (mocked)                  │
│           │                                                  │
│           ▼                                                  │
│  Tạo mock access_token, refresh_token                       │
│  Lưu vào simulated_bank_accounts                           │
│           │                                                  │
│           ▼                                                  │
│  Trả về "Kết nối thành công"                               │
│  Bắt đầu mock webhook simulation                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 6.4.2 Bank Webhook Simulation

```typescript
// Mỗi khi có giao dịch bank (incoming/outgoing),
// trigger webhook simulation để app nhận notification

// Scheduled job: Mỗi 30 giây, random tạo 1 transaction
// HOẶC
// Manual trigger qua admin panel
```

#### 6.4.3 Supported Banks Configuration

```typescript
const MOCKED_BANKS = [
  {
    code: 'VCB',
    name: 'Vietcombank',
    logo: '/assets/banks/vcb.png',
    color: '#E31837',
    qrPrefix: '970436',
    mockBalance: 10000000, // 10 triệu default
  },
  {
    code: 'VTB',
    name: 'VietinBank',
    logo: '/assets/banks/vtb.png',
    color: '#00A651',
    qrPrefix: '970415',
    mockBalance: 8000000,
  },
  // ... 8 banks còn lại
];
```

### 6.5 Hệ thống QR Code

#### 6.5.1 QR Generation

**Android side**:

```kotlin
// QRGenerator.kt
class QRGenerator {
    fun generateReceiveQR(
        userId: String,
        message: String? = null,
        autoAllocate: Boolean = true,
        allocateRules: List<AllocateRule>? = null
    ): Bitmap {
        val payload = ReceiveQRPayload(
            version = "1.0",
            type = QRType.RECEIVE,
            userId = userId,
            message = message,
            autoAllocate = autoAllocate,
            allocateRules = allocateRules,
            timestamp = System.currentTimeMillis()
        )
        
        val jsonString = Json.encodeToString(ReceiveQRPayload.serializer(), payload)
        val signedData = signWithHMAC(jsonString)
        return generateQRImage(signedData)
    }
    
    fun generateTransferQR(
        senderId: String,
        targetUserId: String,
        targetBankCode: String,
        amount: Long,
        description: String
    ): Bitmap {
        val payload = TransferQRPayload(...)
        val signedData = signWithHMAC(Json.encodeToString(...))
        return generateQRImage(signedData)
    }
}
```

**Backend side**:

```typescript
// qr.service.ts
router.post('/generate', authMiddleware, async (req, res) => {
  const { type, targetUserId, amount, message } = req.body;
  
  const qrPayload = {
    version: '1.0',
    type,
    timestamp: Date.now(),
    // ... payload data
  };
  
  // Sign với HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', process.env.QR_SECRET)
    .update(JSON.stringify(qrPayload))
    .digest('hex');
  
  qrPayload.signature = signature;
  
  // Encode base64
  const qrData = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
  
  // Generate QR image
  const qrImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300
  });
  
  res.json({ qrImage, qrData });
});
```

#### 6.5.2 QR Scanning

```kotlin
@Composable
fun QRScannerScreen() {
    val context = context
    val scannerState = remember { mutableStateOf<ScanResult?>(null) }
    
    // Dùng ML Kit CameraX để scan QR
    CameraXScanner(
        onQRCodeDetected = { qrContent ->
            val result = parseAndVerifyQR(qrContent)
            when (result.type) {
                QRType.RECEIVE -> navigateToConfirmReceive(result)
                QRType.TRANSFER -> navigateToConfirmTransfer(result)
                QRType.BILL -> navigateToPayBill(result)
            }
        }
    )
}

suspend fun parseAndVerifyQR(qrContent: String): QRPayload {
    val decoded = Base64.decode(qrContent, Base64.DEFAULT)
    val jsonString = String(decoded)
    val payload = Json.decodeFromString<QRPayload>(jsonString)
    
    // Verify HMAC signature
    val payloadCopy = payload.copy(signature = null)
    val expectedSignature = calculateHMAC(Json.encodeToString(payloadCopy))
    
    if (payload.signature != expectedSignature) {
        throw QRVerificationException("Invalid QR signature")
    }
    
    // Check expiry (QR có hiệu lực 5 phút)
    val fiveMinutesAgo = System.currentTimeMillis() - (5 * 60 * 1000)
    if (payload.timestamp < fiveMinutesAgo) {
        throw QRVerificationException("QR code expired")
    }
    
    return payload
}
```

### 6.6 Quản lý quỹ và tự động chia tiền

#### 6.6.1 Fund Management

```typescript
// fund.model.ts
interface Fund {
  id: string;
  userId: string;
  name: string;
  type: 'PERSONAL' | 'GROUP';
  targetAmount?: number;        // Mục tiêu tiết kiệm
  currentAmount: number;       // Số dư hiện tại
  color: string;                // Màu hiển thị
  icon: string;                 // Icon
  allocations: Allocation[];    // Cách chia tiền
  createdAt: Date;
  isActive: boolean;
}

interface FundContribution {
  id: string;
  fundId: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW';
  sourceTransactionId?: string;
  note?: string;
  createdAt: Date;
}
```

#### 6.6.2 Auto-allocation Engine

```typescript
// allocation.service.ts

async function processIncomingMoney(
  userId: string,
  amount: number,
  source: 'BANK_TRANSFER' | 'QR_RECEIVE' | 'SALARY' | 'OTHER',
  description: string
): Promise<AllocationResult> {
  
  // 1. Lấy tất cả allocation rules của user
  const rules = await getActiveAllocationRules(userId);
  
  // 2. Tìm rule phù hợp nhất
  const matchingRule = findMatchingRule(rules, amount, source, description);
  
  if (!matchingRule) {
    // Không có rule phù hợp → Ghi nhận vào tài khoản chính, đợi user tự phân bổ
    await createIncomingTransaction(userId, amount, source, description);
    return { type: 'PENDING_ALLOCATION', pendingAmount: amount };
  }
  
  // 3. Xử lý phân bổ theo rule
  const results: AllocationItem[] = [];
  let remainingAmount = amount;
  
  for (const allocation of matchingRule.allocations.sort((a, b) => a.priority - b.priority)) {
    const fund = await getFund(allocation.fundId);
    
    if (remainingAmount <= 0) break;
    
    if (allocation.type === 'PERCENTAGE') {
      const allocatedAmount = Math.floor(amount * allocation.value / 100);
      
      if (allocatedAmount <= fund.currentAmount) {
        // Đủ tiền → trừ khỏi quỹ
        await deductFromFund(fund.id, allocatedAmount, `Chuyển: ${description}`);
        results.push({ fundId: fund.id, allocated: allocatedAmount, source: 'FUND' });
      } else {
        // Không đủ → ghi nhận insufficient event
        await createInsufficientFundEvent({
          userId, fundId: fund.id, requestedAmount: allocatedAmount,
          availableAmount: fund.currentAmount
        });
        // Có thể xử lý: trừ hết quỹ + lấy phần thiếu từ quỹ khác
        // Hoặc đợi user xác nhận
      }
    } else {
      // FIXED amount
      // ... xử lý tương tự
    }
  }
  
  // 4. Tạo incoming transaction
  await createIncomingTransaction(userId, amount, source, description);
  
  // 5. Gửi notification
  await notificationService.send({
    userId,
    type: 'MONEY_RECEIVED',
    title: 'Nhận tiền',
    body: `Bạn nhận được ${formatCurrency(amount)} VND`
  });
  
  return { type: 'ALLOCATED', allocations: results };
}
```

### 6.7 Lộ trình triển khai

#### Phase 1: Nền tảng (Tuần 1-2)

| Task | Mô tả | Deliverable |
|------|-------|-------------|
| T1.1 | Thiết lập project mới với Clean Architecture | Cấu trúc thư mục chuẩn |
| T1.2 | Triển khai Backend với Docker | Backend + PostgreSQL + Redis |
| T1.3 | Implement User Service + Auth | JWT authentication |
| T1.4 | Thiết lập Android project với Hilt | DI framework |
| T1.5 | Build shell APK và verify kết nối | APK test trên điện thoại |

#### Phase 2: Tính năng Core (Tuần 3-4)

| Task | Mô tả | Deliverable |
|------|-------|-------------|
| T2.1 | Bank Simulator (10 banks) | API + database cho 10 ngân hàng |
| T2.2 | Kết nối tài khoản ngân hàng | OAuth flow giả lập |
| T2.3 | Quản lý Quỹ (CRUD) | Tạo, xem, cập nhật quỹ |
| T2.4 | Transaction Management | Ghi nhận giao dịch |

#### Phase 3: QR System (Tuần 5-6)

| Task | Mô tả | Deliverable |
|------|-------|-------------|
| T3.1 | QR Generation (Backend) | API tạo QR nhận/chuyển tiền |
| T3.2 | QR Display (Android) | Hiển thị QR trên app |
| T3.3 | QR Scanning (Android) | Camera scan QR + parse |
| T3.4 | Transfer flow với fund selection | Luồng chuyển tiền |

#### Phase 4: Auto-allocation (Tuần 7-8)

| Task | Mô tả | Deliverable |
|------|-------|-------------|
| T4.1 | Allocation Rules Engine | Backend xử lý tự động |
| T4.2 | Insufficient Fund Handler | Xử lý khi quỹ không đủ |
| T4.3 | Simulation Commands | Admin trigger events |
| T4.4 | Push Notifications | Thông báo khi nhận tiền |

#### Phase 5: Polish & Deploy (Tuần 9-10)

| Task | Mô tả | Deliverable |
|------|-------|-------------|
| T5.1 | Security hardening | Certificate pinning, encrypt storage |
| T5.2 | Performance optimization | Pagination, caching |
| T5.3 | Test với 30 users | UAT |
| T5.4 | Deployment documentation | Hướng dẫn deploy |

---

## 7. Hướng dẫn triển khai cho 30 người dùng

### 7.1 Tổng quan kiến trúc triển khai

```
┌──────────────────────────────────────────────────────────────────┐
│                      INTERNET (Public)                            │
│                                                                  │
│  ┌────────────┐     ┌────────────┐     ┌────────────────────┐   │
│  │ User 1    │     │ User 2     │     │ User 30            │   │
│  │ (Phone)   │     │ (Phone)    │     │ (Phone)            │   │
│  └─────┬─────┘     └─────┬─────┘     └─────────┬──────────┘   │
│        │                 │                      │              │
│        └─────────────────┼──────────────────────┘              │
│                          │ HTTPS                                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              LAPTOP (Developer Machine)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Docker Compose Stack                                     │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Backend     │  │ PostgreSQL    │  │ Redis        │   │   │
│  │  │ (Express)   │  │ (Database)    │  │ (Cache/Jobs) │   │   │
│  │  │ Port: 3000  │  │ Port: 5432   │  │ Port: 6379   │   │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          │ localhost:3000                        │
│                          ▼                                       │
│                 ┌─────────────────┐                           │
│                 │ ngrok/cloudflare │ → Public URL              │
│                 │ tunnel           │   (example.ngrok.io)       │
│                 └─────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Cách publish laptop ra internet (3 phương án)

#### Phương án 1: ngrok (ĐƯỢC KHUYẾN NGHỊ)

**Ưu điểm**: Nhanh, dễ, miễn phí (có giới hạn)
**Nhược điểm**: URL thay đổi mỗi lần restart, có thể bị disconnect

```bash
# 1. Cài đặt ngrok
# Download từ https://ngrok.com/download

# 2. Đăng ký tài khoản ngrok (miễn phí)
# Lấy authtoken từ https://dashboard.ngrok.com/

# 3. Cấu hình ngrok
ngrok config add-authtoken YOUR_AUTHTOKEN

# 4. Khởi động backend
cd backend
npm run dev

# 5. Trong terminal khác, mở tunnel
ngrok http 3000

# 6. Lấy public URL (Forwarding)
# Ví dụ: https://abc123.ngrok.io -> http://localhost:3000

# 7. Update Android app config
# Trong ApiClient.kt:
const val BASE_URL = "https://abc123.ngrok.io/api/v1/"
```

#### Phương án 2: Cloudflare Tunnel (THAY THẾ NGOK)

**Ưu điểm**: Ổn định hơn, không cần đăng ký
**Nhược điểm**: Cần tài khoản Cloudflare

```bash
# 1. Cài cloudflared
# Download từ https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/

# 2. Login
cloudflared tunnel login

# 3. Tạo tunnel
cloudflared tunnel create fintech-tunnel

# 4. Cấu hình tunnel
# Tạo file ~/.cloudflared/config.yml:
# tunnel: <tunnel-id>
# credentials-file: /path/to/credentials.json
# ingress:
#   - service: http://localhost:3000

# 5. Chạy tunnel
cloudflared tunnel run fintech-tunnel

# 6. Tạo DNS record
cloudflared tunnel route dns fintech-tunnel fintech.yourdomain.com
```

#### Phương án 3: LocalTunnel (Miễn phí, không cần đăng ký)

```bash
# Cài npm
npm install -g lt-cli

# Chạy
lt --port 3000

# Output: https://your-url.loca.lt
```

### 7.3 Hướng dẫn từng bước triển khai

#### Bước 1: Chuẩn bị laptop (Developer)

```bash
# 1. Clone project
git clone <repo-url>
cd fintech-app

# 2. Cài Docker và Docker Compose
# Linux:
sudo apt update && sudo apt install docker.io docker-compose

# 3. Start database và redis
cd backend
docker-compose up -d postgres redis

# 4. Chạy migrations
npm run db:migrate

# 5. Seed initial data (10 banks, test users)
npm run db:seed

# 6. Start backend
npm run dev
```

#### Bước 2: Public URL với ngrok

```bash
# Trong terminal mới
ngrok http 3000

# Copy URL, ví dụ: https://dead222.ngrok.io
```

#### Bước 3: Build Android APK

```bash
# 1. Mở project trong Android Studio
# HOẶC command line:
cd android-client
./gradlew assembleDebug

# 2. Sửa BASE_URL trong code
# File: app/src/main/java/com/group6/fintechapp/core/network/ApiClient.kt
# Đổi thành URL ngrok của bạn
```

#### Bước 4: Cấu hình cho 30 người dùng

**Tạo test users**:

```typescript
// backend/scripts/create-test-users.js
const users = [];
for (let i = 1; i <= 30; i++) {
  users.push({
    email: `student${i}@university.edu`,
    password: 'Test123456',
    name: `Sinh viên ${i}`,
    phone: `09${String(i).padStart(8, '0')}`
  });
}
// Seed vào database
```

**Export APK**:

```bash
# Debug APK (dễ test)
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release APK (production-ready)
./gradlew assembleRelease
# Cần signing config
```

#### Bước 5: Phân phối APK cho 30 users

**Cách 1: Google Drive / Dropbox**

```bash
# Upload APK lên Google Drive
# Share link với quyền "Anyone with link"

# Users tải APK về, enable "Install from unknown sources"
```

**Cách 2: Firebase App Distribution**

```kotlin
// Thêm vào build.gradle
// app/build.gradle.kts
plugins {
    id("com.google.gms.google-services")
    id("com.google.firebase.appdistribution") version "4.0.0"
}

// Tạo Firebase project, enable App Distribution
// Upload APK, add tester emails
// Users nhận invite email, cài app từ Firebase
```

**Cách 3: Local Web Server**

```bash
# Trên laptop, chạy simple HTTP server
cd android-client/app/build/outputs/apk/debug
python3 -m http.server 8080

# Users truy cập http://<laptop-ip>:8080/app-debug.apk
# Cần đảm bảo cùng mạng LAN hoặc port forwarding
```

### 7.4 Cấu hình mạng

#### Cho phép truy cập từ điện thoại:

**Nếu dùng ngrok (khuyến nghị)**:
- Không cần cấu hình firewall
- Điện thoại chỉ cần internet

**Nếu dùng cùng mạng LAN**:

```bash
# Tìm IP laptop
ip addr show | grep "inet "
# Ví dụ: 192.168.1.100

# Start backend bind to 0.0.0.0
PORT=3000 npm run dev

# Update Android BASE_URL
const val BASE_URL = "http://192.168.1.100:3000/api/v1/"

# Điện thoại phải kết nối cùng WiFi
# Cần enable cleartext traffic trong AndroidManifest (chỉ dev)
```

**Firewall settings**:

```bash
# Ubuntu/Debian - Mở port 3000
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### 7.5 Checklist trước khi bắt đầu

```
☐ 1. Backend chạy thành công
     - curl http://localhost:3000/api/v1/health → 200 OK

☐ 2. Database đã migrate và seed
     - 10 banks đã có trong database
     - Test user đã tạo

☐ 3. ngrok/cloudflare đang chạy
     - Public URL đang hoạt động
     - curl https://your-url.ngrok.io/api/v1/health → 200 OK

☐ 4. Android APK đã build
     - BASE_URL đã đổi thành public URL
     - APK đã tạo thành công

☐ 5. Test trên 1 điện thoại trước
     - Login thành công
     - Kết nối 1 ngân hàng mock
     - Tạo QR nhận tiền
     - Scan QR chuyển tiền

☐ 6. Chuẩn bị tài liệu cho users
     - Hướng dẫn cài đặt APK
     - Tài khoản test (email/password)
     - Cách sử dụng các tính năng chính

☐ 7. Monitoring
     - Backend logs đang hiển thị
     - Database connection ổn định
     - ngrok connection stable
```

### 7.6 Troubleshooting thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Điện thoại không kết nối được | ngrok bị disconnect | Restart ngrok, update URL trong app |
| "Cleartext HTTP not allowed" | Dùng http:// thay vì https:// | Enable usesCleartextTraffic hoặc dùng https |
| Database connection failed | Docker chưa start | `docker-compose up -d postgres` |
| APK install failed | Unknown sources chưa enable | Hướng dẫn user bật trong Settings |
| QR scan không hoạt động | Camera permission | Kiểm tra permission trong AndroidManifest |
| Backend 500 error | Migration chưa chạy | `npm run db:migrate` |

### 7.7 Scaling cho 30 users

Với 30 users đồng thời, cấu hình này là đủ:

```yaml
# docker-compose.yml
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fintech
      POSTGRES_USER: fintech
      POSTGRES_PASSWORD: fintech_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 512M
  
  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  postgres_data:
```

---

## Phụ lục

### A. File quan trọng cần review

#### Android Client

| File | Quan trọng | Cần review trước |
|------|-----------|-----------------|
| `core/network/ApiClient.kt` | ⭐⭐⭐ | ✅ |
| `core/network/AuthInterceptor.kt` | ⭐⭐⭐ | ✅ |
| `core/auth/TokenStore.kt` | ⭐⭐⭐ | ✅ |
| `feature/auth/AuthViewModel.kt` | ⭐⭐⭐ | ✅ |
| `feature/home/HomeViewModel.kt` | ⭐⭐ | |
| `app/build.gradle.kts` | ⭐⭐ | |
| `AndroidManifest.xml` | ⭐⭐ | |

#### Backend

| File | Quan trọng | Cần review trước |
|------|-----------|-----------------|
| `config/index.ts` | ⭐⭐⭐ | ✅ |
| `services/user/user.controller.ts` | ⭐⭐⭐ | ✅ |
| `services/integration/bank.service.ts` | ⭐⭐⭐ | ✅ |
| `services/bill/bill.controller.ts` | ⭐⭐ | |
| `services/bill/ocr.service.ts` | ⭐⭐ | |
| `services/fund/fund.controller.ts` | ⭐⭐ | |
| `init.sql` | ⭐⭐ | |
| `shared/middleware/auth.middleware.ts` | ⭐⭐ | |

### B. Test coverage hiện tại

| Module | Unit Test | Integration Test | E2E Test |
|--------|-----------|-----------------|----------|
| Android | ❌ Không có | ❌ Không có | ❌ Không có |
| Backend | ❌ Không có | ❌ Không có | ❌ Không có |

### C. CI/CD hiện tại

| Project | CI/CD | Linting | Type Check | Security Scan |
|---------|-------|---------|------------|---------------|
| Android | ❌ Không có | ⚠️ Chưa config | ✅ Kotlin compiler | ❌ Không có |
| Backend | ❌ Không có | ⚠️ ESLint (có config chưa chạy) | ✅ TypeScript | ❌ Không có |

---

*Báo cáo này được tạo với sự hỗ trợ của AI, danh sách vấn đề có thể chưa đầy đủ. Đề nghị đội phát triển review thêm dựa trên thực tế triển khai.*
