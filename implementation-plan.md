# Kế hoạch triển khai chi tiết (Implementation Plan)

Tài liệu này chuyển hóa yêu cầu trong [GROUP 6] SOA.md thành kế hoạch triển khai thực thi theo kiến trúc SOA/Microservices, có lớp tích hợp ESB và pipeline triển khai cloud.

## 1. Mục tiêu triển khai

- Xây dựng ứng dụng quản lý tài chính cá nhân cho mobile.
- Đảm bảo đủ 8 service nghiệp vụ: User, Account, Transaction, Budget, Bill, Fund, Notification, Report.
- Áp dụng tiêu chuẩn công nghệ đã chốt:
  - Microservices: Spring Boot/Node.js
  - API: REST + OpenAPI (Swagger)
  - Integration: WSO2/Mule ESB + Kafka
  - Security: OAuth2 + JWT
  - Deployment: Docker + Kubernetes
  - Cloud: AWS/GCP/Azure
  - CI/CD: GitHub Actions

## 2. Kiến trúc triển khai (để code và vận hành)

### 2.1 Mô hình khuyến nghị (Hybrid, dễ đạt yêu cầu đồ án)

1. Client Mobile gọi vào API Gateway/ESB.
2. ESB xử lý xác thực JWT/OAuth2, routing, transform dữ liệu khi cần.
3. Request đồng bộ đi đến các microservice qua REST.
4. Event bất đồng bộ giữa service đi qua Kafka.
5. Notification/Report/Budget react theo event để tránh coupling.

### 2.2 Vai trò từng lớp

- Gateway/ESB (WSO2 hoặc Mule): single entry point, policy, protocol mediation, integration orchestration.
- Domain Services: xử lý nghiệp vụ độc lập theo bounded context.
- Kafka: event bus cho async workflow (retry, DLQ).
- Databases: ưu tiên database-per-service, Redis cache.

## 3. Kế hoạch 7 bước (SOAD + Delivery)

## Bước 1: Chốt phạm vi và quyết định kiến trúc

### Công việc
- Chốt MVP: đăng ký/đăng nhập, đồng bộ tài khoản mô phỏng, quản lý giao dịch, ngân sách, quỹ chung, thông báo, báo cáo.
- Chốt mô hình tích hợp:
  - Option A (khuyến nghị): Gateway + Kafka + ESB cho luồng cần mediation.
  - Option B (ESB-first): tất cả ingress qua ESB, Kafka xử lý domain events.
- Chốt SLO kỹ thuật: p95 <= 2s, uptime mục tiêu >= 99.9%.

### Deliverable
- Tài liệu kiến trúc baseline.
- Danh sách scope in/out chính thức.

## Bước 2: Thiết kế domain và hợp đồng dịch vụ

### Công việc
- Thiết kế entity/lifecycle cho từng service.
- Viết OpenAPI spec cho toàn bộ REST API.
- Chuẩn hóa event contract Kafka:
  - TransactionCreated
  - BudgetExceeded
  - FundContributed
  - ReportGenerated
- Chuẩn hóa error model, idempotency, correlation id.

### Deliverable
- Bộ file OpenAPI.
- Bộ schema sự kiện và naming convention topic.

## Bước 3: Dựng nền tảng kỹ thuật (platform foundation)

### Công việc
- Khởi tạo mã nguồn các service (Spring Boot/Node.js).
- Dựng Gateway/ESB (WSO2/Mule): auth policy, routing, transform.
- Dựng Kafka + retry topic + dead-letter queue.
- Dựng DB cho từng service + Redis.
- Thiết lập logging/tracing/metrics chuẩn.

### Deliverable
- Môi trường local chạy bằng Docker Compose.
- Môi trường staging cơ bản (K8s namespace + config).

## Bước 4: Phát triển nghiệp vụ cốt lõi

### Công việc theo service
- User Service: auth, profile, admin controls.
- Account Service: connect/disconnect ngân hàng mô phỏng, sync số dư/giao dịch.
- Transaction Service: manual/auto nhập giao dịch, phân loại, lọc/tìm kiếm.
- Budget Service: đặt ngân sách theo danh mục, cảnh báo vượt.
- Fund Service: tạo quỹ, mời thành viên, đóng góp/rút, quyền truy cập.
- Bill Service: OCR upload, parse, confidence, chỉnh sửa thủ công.
- Notification Service: push/email template, preference, history.
- Report Service: tổng hợp tháng/năm, xu hướng, export, admin dashboard data.

### Deliverable
- API chạy end-to-end cho user flow chính.
- Event pipeline chạy ổn định trên Kafka.

## Bước 5: Bảo mật, độ tin cậy, quan sát hệ thống

### Công việc
- Áp RBAC theo vai trò User/Admin.
- Mã hóa TLS và mã hóa dữ liệu nhạy cảm khi lưu trữ.
- Audit log cho các thao tác nhạy cảm.
- Circuit breaker, timeout, retry backoff.
- Fallback cho tích hợp ngoài (OCR/Firebase/Open Banking).

### Deliverable
- Security checklist pass.
- Dashboard observability (metrics/log/traces) có cảnh báo cơ bản.

## Bước 6: CI/CD, container, cloud

### Công việc
- Dockerize tất cả thành phần.
- Viết manifest/Helm cho Kubernetes.
- GitHub Actions pipeline:
  - lint/test/build
  - security scan
  - push image
  - deploy staging
- Triển khai cloud (AWS/GCP/Azure) + secret management + backup job.

### Deliverable
- Pipeline CI/CD hoạt động tự động.
- Có khả năng rollback bản phát hành.

## Bước 7: Kiểm thử tổng hợp, UAT, bàn giao

### Công việc
- Unit test + integration test + contract test.
- E2E cho các kịch bản chính:
  - giao dịch mới -> cập nhật ngân sách -> cảnh báo
  - đóng góp quỹ -> thông báo nhóm
  - tạo báo cáo -> gửi thông báo
- Test phi chức năng: load, failover, chaos đơn giản.
- UAT với nhóm người dùng mục tiêu.
- Hoàn thiện tài liệu vận hành và runbook.

### Deliverable
- Biên bản test và bằng chứng đạt tiêu chí.
- Gói bàn giao đồ án (docs + kiến trúc + hướng dẫn chạy).

## 4. Lộ trình đề xuất theo sprint

- Sprint 1 (tuần 1-2): Bước 1-2
- Sprint 2 (tuần 3-4): Bước 3
- Sprint 3-4 (tuần 5-8): Bước 4
- Sprint 5 (tuần 9): Bước 5
- Sprint 6 (tuần 10): Bước 6
- Sprint 7 (tuần 11-12): Bước 7

## 5. Rủi ro chính và phương án xử lý

1. ESB trở thành bottleneck
- Giải pháp: giới hạn trách nhiệm ESB ở policy/integration mediation; domain event vẫn qua Kafka.

2. Lỗi từ third-party API gây gián đoạn
- Giải pháp: timeout + retry + DLQ + fallback/manual mode.

3. Dữ liệu tài chính nhạy cảm
- Giải pháp: OAuth2/JWT, RBAC, encryption, audit trail.

4. Chậm tiến độ do quá nhiều service
- Giải pháp: ưu tiên MVP flow trước (User, Transaction, Budget, Notification), sau đó mở rộng Bill/Fund/Report nâng cao.

## 6. Tiêu chí hoàn thành (Definition of Done)

- 8 service hoạt động theo kiến trúc đã chốt.
- API có tài liệu OpenAPI đầy đủ.
- Event Kafka có schema và được kiểm thử.
- CI/CD chạy thành công từ commit đến deploy staging.
- Kịch bản nghiệp vụ chính chạy end-to-end ổn định.
- Có tài liệu triển khai, vận hành và slide kiến trúc phục vụ bảo vệ đồ án.