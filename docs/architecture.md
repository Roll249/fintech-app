# Fintech App - System Architecture

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE CLIENT                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Android App (Kotlin/Compose)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   UI     │ │ ViewModel│ │Repository│ │ Network  │ │  Local   │  │   │
│  │  │ Screens  │ │  State   │ │  Layer   │ │  Client  │ │  Cache   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │       ↓            ↓            ↓            ↓            ↓        │   │
│  │  • Login      • StateFlow  • API calls  • Retrofit   • DataStore  │   │
│  │  • Home       • LiveData   • Caching    • OkHttp     • Room DB    │   │
│  │  • Transactions                          • Auth      • Preferences│   │
│  │  • Budgets                               │                         │   │
│  │  • Funds                                 │                         │   │
│  │  • Profile                               │                         │   │
│  │  • Bill Scanner (Camera UI)              │                         │   │
│  └──────────────────────────────────────────│─────────────────────────┘   │
└─────────────────────────────────────────────│─────────────────────────────┘
                                              │
                                              │ HTTPS/REST
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js Gateway Server                         │   │
│  │  • JWT Authentication & Validation                                   │   │
│  │  • Rate Limiting (per user/IP)                                       │   │
│  │  • Request Logging & Tracing                                         │   │
│  │  • Route Forwarding to Microservices                                 │   │
│  │  • Response Transformation                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MICROSERVICES LAYER                                │
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   User      │ │  Account    │ │ Transaction │ │   Budget    │           │
│  │  Service    │ │  Service    │ │   Service   │ │  Service    │           │
│  │─────────────│ │─────────────│ │─────────────│ │─────────────│           │
│  │• Auth/JWT   │ │• Bank sim   │ │• CRUD       │ │• Limits     │           │
│  │• Profile    │ │• Balance    │ │• Categories │ │• Tracking   │           │
│  │• RBAC       │ │• Sync       │ │• Search     │ │• Alerts     │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │               │                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    Bill     │ │    Fund     │ │Notification │ │   Report    │           │
│  │  Service    │ │  Service    │ │   Service   │ │  Service    │           │
│  │─────────────│ │─────────────│ │─────────────│ │─────────────│           │
│  │• OCR        │ │• Group mgmt │ │• Push/Email │ │• Analytics  │           │
│  │• Tesseract  │ │• Members    │ │• Templates  │ │• PDF Export │           │
│  │• Parse bill │ │• Contribute │ │• Preferences│ │• Trends     │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │               │                   │
└─────────┼───────────────┼───────────────┼───────────────┼───────────────────┘
          │               │               │               │
          └───────────────┴───────┬───────┴───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE BROKER (Kafka)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Topics:                                                             │   │
│  │  • transaction.created  → Budget Service checks limits               │   │
│  │  • budget.exceeded      → Notification Service sends alert           │   │
│  │  • fund.contributed     → Notification Service notifies members      │   │
│  │  • report.generated     → Notification Service sends download link   │   │
│  │  • bill.processed       → Transaction Service creates entry          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PostgreSQL    │  │      Redis      │  │   File Storage  │             │
│  │─────────────────│  │─────────────────│  │─────────────────│             │
│  │ • users         │  │ • Session cache │  │ • Bill images   │             │
│  │ • accounts      │  │ • Rate limits   │  │ • Report PDFs   │             │
│  │ • transactions  │  │ • Token blacklist│ │ • User avatars  │             │
│  │ • budgets       │  │ • Hot data      │  │                 │             │
│  │ • funds         │  │                 │  │                 │             │
│  │ • bills         │  │                 │  │                 │             │
│  │ • notifications │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phân chia trách nhiệm Client vs Server

### Mobile Client (Android)
| Chức năng | Mô tả |
|-----------|-------|
| UI/UX | Hiển thị giao diện, animations, navigation |
| State Management | Quản lý trạng thái UI với ViewModel/StateFlow |
| Local Caching | Cache dữ liệu offline với Room/DataStore |
| Camera Capture | Chụp ảnh hóa đơn để upload |
| Image Compression | Nén ảnh trước khi upload |
| Form Validation | Validate input trước khi gửi server |
| Auth Token Storage | Lưu JWT token an toàn |
| Push Notification Receive | Nhận và hiển thị push notification |

### Backend Server (Node.js)
| Service | Chức năng | Tác vụ nặng |
|---------|-----------|-------------|
| **User Service** | Auth, JWT, profile | Password hashing (bcrypt) |
| **Account Service** | Bank simulation | Sync scheduling |
| **Transaction Service** | CRUD, search | Full-text search, aggregation |
| **Budget Service** | Tracking, alerts | Real-time calculation |
| **Bill Service** | **OCR processing** | **Tesseract OCR, image processing** |
| **Fund Service** | Group management | Member permissions |
| **Notification Service** | Push/Email | Firebase Cloud Messaging, SMTP |
| **Report Service** | Analytics | **PDF generation, data aggregation** |

### Tác vụ nặng phải xử lý trên Server

1. **OCR Processing (Bill Service)**
   - Nhận ảnh từ mobile
   - Xử lý ảnh (resize, enhance)
   - Chạy Tesseract OCR
   - Parse text thành structured data
   - Trả về kết quả JSON

2. **Report Generation (Report Service)**
   - Aggregate dữ liệu từ nhiều service
   - Tính toán thống kê phức tạp
   - Generate PDF với charts
   - Lưu file và trả URL download

3. **Real-time Budget Calculation**
   - Subscribe Kafka events
   - Tính toán ngân sách còn lại
   - Trigger alerts khi vượt ngưỡng

4. **Push Notification (Notification Service)**
   - Integrate Firebase Admin SDK
   - Queue và batch notifications
   - Track delivery status

## Cấu trúc thư mục dự án

```
fintech-app/
├── android-client/          # Android App (Kotlin)
│   ├── app/src/main/java/
│   │   └── com/group6/fintechapp/
│   │       ├── core/        # Network, Auth, Utils
│   │       ├── data/        # Models, API, Repository
│   │       └── feature/     # UI Screens
│   └── ...
│
├── backend/                 # Backend Server (Node.js)
│   ├── src/
│   │   ├── gateway/         # API Gateway
│   │   ├── services/        # Microservices
│   │   │   ├── user/
│   │   │   ├── account/
│   │   │   ├── transaction/
│   │   │   ├── budget/
│   │   │   ├── bill/        # OCR processing
│   │   │   ├── fund/
│   │   │   ├── notification/
│   │   │   └── report/      # PDF generation
│   │   ├── shared/          # Common utilities
│   │   └── config/          # Configuration
│   ├── docker-compose.yml   # Local development
│   └── package.json
│
├── docs/                    # Documentation
│   └── architecture.md
│
└── deployment/              # K8s, Helm charts
```

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Mobile | Kotlin, Jetpack Compose, Retrofit, Room |
| Gateway | Express.js, JWT middleware |
| Services | Node.js, TypeScript, Express |
| Database | PostgreSQL (primary), Redis (cache) |
| Message Queue | Apache Kafka |
| OCR | Tesseract.js |
| PDF Generation | PDFKit |
| Push Notifications | Firebase Cloud Messaging |
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes (production) |
