# Kiến trúc & Phân tích Công Nghệ Dự Án Fintech

Tài liệu này đề xuất kiến trúc, lựa chọn công nghệ cho hệ thống Quản lý tài chính cá nhân, đồng thời giải thích chi tiết về khái niệm ESB (Enterprise Service Bus) cùng các ví dụ thực tế để đối chiếu.

---

## Phần 1: Đề xuất Kiến trúc & Tech Stack cho Fintech App

Dựa trên yêu cầu của hệ thống (hướng đối tượng người trẻ, tự động hoá cao, quản lý quỹ nhóm, cảnh báo realtime) và xu hướng công nghệ hiện đại, hệ thống không nên sử dụng kiến trúc nguyên khối (Monolith) hay ESB truyền thống, mà nên áp dụng **Microservices kết hợp API Gateway và Event-Driven Architecture (Kiến trúc hướng sự kiện)**.

### 1. Kiến trúc tổng thể
- **API Gateway (Spring Cloud Gateway hoặc Kong):** Đóng vai trò là cửa ngõ duy nhất (Single Entry Point) cho ứng dụng Mobile. Chịu trách nhiệm xác thực (Authentication - OAuth2/JWT), giới hạn yêu cầu (Rate Limiting) và điều hướng (Routing) tới các service nội bộ.
- **Event-Driven Microservices:** Các service không gọi API trực tiếp (synchronous) cho những tác vụ không cần phản hồi ngay (ví dụ: gửi thông báo, tạo file báo cáo). Chúng giao tiếp qua Message Broker để đảm bảo tính chịu lỗi và phản hồi nhanh cho người dùng.

### 2. Lựa chọn Công nghệ (Tech Stack)
- **Frontend (Mobile App): Flutter (Dart)**
  - *Lý do:* Phát triển đa nền tảng (iOS & Android) từ một mã nguồn. Hiệu năng UI tốt (60fps), hỗ trợ rất nhiều thư viện vẽ biểu đồ quản lý chi tiêu mượt mà, phù hợp với yêu cầu ứng dụng gamification cho Gen Z.
- **Backend (Microservices): Kotlin (Spring Boot)**
  - *Lý do:* Kotlin là ngôn ngữ hiện đại, chạy trên máy ảo Java (JVM) nhưng cú pháp ngắn gọn hơn. Đặc biệt tính năng **Null Safety** của Kotlin giúp ngăn chặn triệt để lỗi NullPointerException – một yêu cầu mang tính sống còn đối với các ứng dụng tính toán tiền bạc/tài chính.
- **Cơ sở dữ liệu (Databases):** 
  - *PostgreSQL/MySQL:* Dùng cho các service cần rành mạch về ACID (giao dịch, số dư tài khoản).
  - *MongoDB:* Dùng cho Bill Service để lưu trữ dữ liệu hoá đơn OCR linh hoạt không cố định cấu trúc.
  - *Redis:* Caching thông tin user, session, tỷ giá, danh mục chi tiêu.
- **Message Broker:** Apache Kafka hoặc RabbitMQ (Giao tiếp bất đồng bộ, ví dụ: sau khi ghi nhận giao dịch thành công -> ném một event vào Kafka -> Notification Service nhận event và gửi push notification về điện thoại người dùng).

---

## Phần 2: ESB (Enterprise Service Bus) là gì?

**ESB (Trục tích hợp dịch vụ doanh nghiệp)** là một mô hình kiến trúc phần mềm (thịnh hành đầu những năm 2000 đến 2010), trong đó một hệ thống phần mềm trung tâm (gọi là "Bus" - Trục/Đường dẫn) đóng vai trò điều phối, giao tiếp, chuyển đổi dữ liệu và định tuyến thông điệp giữa các ứng dụng/dịch vụ khác nhau trong một doanh nghiệp.

Thay vì các hệ thống kết nối trực tiếp với nhau (Point-to-Point) tạo thành một mớ bòng bong (Spaghetti integration), tất cả sẽ chỉ kết nối vào hệ thống ESB trung tâm.

### Các chức năng lõi của ESB:
1. **Định tuyến (Routing):** Nhận tin nhắn và quyết định chuyển nó cho hệ thống nào dựa trên nội dung tin nhắn hoặc luật (Rules).
2. **Dịch giao thức (Protocol Conversion):** Giao tiếp với hệ thống A bằng HTTP/REST và gọi điện thoại cho hệ thống B bằng TCP/IP hay SOAP.
3. **Chuyển đổi dữ liệu (Transformation):** Hệ thống A gửi file JSON, ESB tự động nhào nặn và biến nó thành file XML phục vụ cho hệ thống B.
4. **Điều phối (Orchestration):** Nhận 1 yêu cầu nhưng điều chuyển và gộp kết quả từ 3-4 hệ thống khác nhau trước khi trả về.

---

## Phần 3: Các ví dụ thực tế về ESB

### Ví dụ 1: Ứng dụng Giao món ăn (như Grab Food) thiết kế với ESB
Nếu toàn bộ hệ thống Grab Food được xây dựng xoay quanh ESB kiến trúc sẽ như sau:
- **Các hệ thống độc lập:** App Đặt món, Hệ thống Nhà hàng (nhận món), Hệ thống Tài xế (nhận điều phối), Hệ thống Thanh toán (trừ tiền thẻ), Hệ thống CRM (tích điểm).
- **Kịch bản:** Người dùng hoàn tất order 1 ly trà sữa.
- **Luồng đi qua ESB:**
  1. Người dùng bấm "Đặt hàng" -> Gửi 1 request JSON đến **ESB**.
  2. **ESB** thực hiện **Điều phối (Orchestration)**: Gọi API sang Hệ thống Thanh toán để giữ tiền/trừ tiền.
  3. Sau khi Thanh toán báo thành công về ESB, **ESB** thực hiện **Chuyển đổi & Định tuyến**:
     - ESB dịch tin nhắn sang chuẩn API của "Hệ thống Nhà hàng" và gửi lệnh "Chuẩn bị đơn hàng".
     - Đồng thời, ESB gửi lệnh sang "Hệ thống Tài xế" để tìm kiếm tài xế gần đó.
     - Cuối cùng, ESB gửi một gói dữ liệu về "Hệ thống CRM" để cộng điểm đổi quà cho khách.
- **Nhược điểm:** Mọi logic phối hợp cực kỳ nặng nề nằm ở khối ESB. Nếu cục ESB chết, không khách hàng nào đặt được, không tài xế nào chạy được.

### Ví dụ 2 (Chi tiết hơn): Hệ thống Lõi Viễn thông (Telecom - Viettel/VNPT)
Trong các tập đoàn cực lớn, cũ kỹ với các công nghệ chồng chéo, ESB là vị cứu tinh duy nhất kết nối thế giới công nghệ cũ và mới.
- **Các hệ thống lõi:** 
  - Hệ thống CRM (Quản lý khách - Công nghệ mới Java/Frontend, giao tiếp REST/JSON).
  - Hệ thống Billing (Tính cước - Công nghệ cũ C++, giao tiếp SOAP/XML mệt mỏi).
  - Hệ thống Provisioning (Kích hoạt tổng đài/lõi mạng - Giao tiếp TCP Socket / Text thuần băm bit).
  - Hệ thống SMS Gateway (Gửi tin nhắn thông báo).
- **Kịch bản:** Sinh viên ra quầy giao dịch Viettel đăng ký gói cước 4G (ST90).
- **Luồng kiến trúc ESB:**
  1. Giao dịch viên nhập thông tin trên hệ thống mới **CRM**. CRM bắn 1 thông điệp RESTful (JSON) duy nhất vào **ESB**: `{"action": "register_4G", "package": "ST90", "msisdn": "098xxx"}`.
  2. **ESB xử lý Chuyển đổi (Transformation):** 
     - ESB tự động "dịch" cục JSON này thành một file XML chuẩn SOAP khổng lồ và gọi sang hệ thống **Billing** để bắt đầu chu kỳ trừ tiền tháng.
  3. **ESB xử lý Dịch giao thức (Protocol Conversion):** 
     - Trong khi Billing xử lý cước, ESB dịch yêu cầu thành các dòng lệnh Text thuần (TCP Socket) bắn thẳng vào trung tâm mạng viễn thông toàn quốc **Provisioning** để hệ thống phần cứng cắt/mở băng thông 4G cho cái SIM của khách.
  4. **ESB điều phối (Orchestration):** 
     - Chờ nhận kết quả từ mạng và cước. Nếu cả 2 đều báo "Mở thành công!", ESB tự đóng gói 1 tin nhắn đẩy sang **SMS Gateway** gửi tin nhắn: "Quy khach da dang ky thanh cong goi ST90...".

---

## Phần 4: Kết luận (Tại sao KHÔNG dùng ESB cho Fintech App này?)

Mặc dù ESB rất mạnh mẽ trong việc giải quyết bài toán giao tiếp hệ thống cũ-mới (như hệ thống ngân hàng nhà nước hay viễn thông), nhưng đối với một startup Fintech App xây mới hoàn toàn thì nó **mang lại rủi ro lớn hơn lợi ích**:

1. **Thắt cổ chai (Single Point of Failure):** Mọi logic đều nằm trong ESB. Nếu ESB sập (hoặc xử lý chậm), tất cả các Microservices trong app của bạn đều tê liệt, người dùng không thể chuyển tiền hay tạo ngân sách.
2. **Chi phí và Vận hành cồng kềnh:** ESB như Oracle Service Bus, IBM BizTalk rất nặng, đắt đỏ và yêu cầu cấu hình phức tạp (thường bằng XML), làm lu mờ đi tốc độ phát triển Agile.
3. **Mô hình mới (Smart Endpoints, Dumb Pipes):** Microservice hiện đại chọn cách mỗi Service phải tự thông minh (tự xử lý định dạng, tự tích hợp) và chỉ dùng đường truyền nhúng đơn giản (Dumb Pipe như Kafka/RabbitMQ HTTP API Gateway) để chuyển dữ liệu nhanh nhất có thể.

**=> Quyết định:** Dự án của bạn sẽ chọn cấu trúc linh hoạt: **Flutter (Mobile) -> Spring Cloud API Gateway -> Kotlin Backend Microservices -> Message Broker (Kafka)** thay vì nhồi nhét một trục ESB nặng nề.