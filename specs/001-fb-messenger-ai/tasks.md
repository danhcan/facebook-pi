---
description: "Danh sách nhiệm vụ cho Quản Lý Tin Nhắn Facebook Messenger"
---

# Nhiệm Vụ: Quản Lý Tin Nhắn Facebook Messenger

**Đầu Vào**: Tài liệu thiết kế từ `/specs/001-fb-messenger-ai/`

**Điều Kiện Tiên Quyết**: plan.md, spec.md, research.md, data-model.md, contracts/

**Kiểm Thử**: Không yêu cầu TDD trong đặc tả. Các nhiệm vụ kiểm thử được đánh dấu TÙY CHỈN.

**Tổ Chức**: Nhiệm vụ được nhóm theo 4 câu chuyện người dùng (US1-US4) để triển khai và kiểm thử độc lập.

## Định Dạng: `[ID] [P?] [Câu Chuyện] Mô Tả`

- **[P]**: Có thể chạy song song (tệp khác nhau, không phụ thuộc)
- **[Câu Chuyện]**: Nhiệm vụ thuộc câu chuyện người dùng nào (US1, US2, US3, US4)
- Bao gồm đường dẫn tệp chính xác

---

## Giai Đoạn 1: Thiết Lập (Hạ Tầng Chung)

**Mục Đích**: Khởi tạo dự án và cấu trúc cơ bản

- [x] T001 Tạo cấu trúc thư mục theo plan.md (src/, frontend/, tests/)
- [x] T002 Khởi tạo project Node.js + TypeScript với dependencies chính
- [x] T003 [P] Cấu hình ESLint, Prettier, và TypeScript config
- [x] T004 [P] Tạo file .env.example với tất cả biến môi trường cần thiết
- [x] T005 [P] Cấu hình Docker Compose cho PostgreSQL và Redis

---

## Giai Đoạn 2: Cơ Sở (Điều Kiện Tiên Quyết Chặn)

**Mục Đích**: Hạ tầng cốt lõi PHẢI hoàn thành trước khi BẤT KỲ câu chuyện người dùng nào có thể được triển khai

**⚠️ QUAN TRỌNG**: Không thể bắt đầu làm câu chuyện người dùng cho đến khi giai đoạn này hoàn thành

- [x] T006 Thiết lập Prisma schema với tất cả models (FacebookAccount, Conversation, Message, AiResponse, KnowledgeItem, MessageQueue)
- [x] T007 Triển khai database migration và seed data
- [x] T008 [P] Triển khai middleware xác thực JWT
- [x] T009 [P] Triển khai middleware rate limiting
- [x] T010 [P] Triển khai middleware xử lý lỗi toàn cục
- [x] T011 [P] Thiết lập cấu hình Redis connection và BullMQ
- [x] T012 [P] Tạo utility mã hóa token (src/utils/encryption.ts)
- [x] T013 [P] Tạo utility phân loại tin nhắn (src/utils/classifier.ts)
- [x] T014 Thiết lập cấu hình logger và monitoring

**Điểm Kiểm Tra**: Hạ tầng sẵn sàng - triển khai câu chuyện người dùng có thể bắt đầu song song

---

## Giai Đoạn 3: Câu Chuyện Người Dùng 1 - Kết Nối Tài Khoản Facebook (Ưu Tiên: P1) 🎯 MVP

**Mục Tiêu**: Người dùng có thể kết nối và quản lý tài khoản Facebook Messenger

**Kiểm Thử Độc Lập**: Kết nối tài khoản qua OAuth, xác nhận tài khoản hiển thị "Đã kết nối", ngắt kết nối hoạt động

### Triển Khai Cho Câu Chuyện Người Dùng 1

- [x] T015 [P] [US1] Tạo model FacebookAccount trong prisma/schema.prisma
- [x] T016 [P] [US1] Triển khai Facebook OAuth service trong src/services/facebook-auth.ts
- [x] T017 [P] [US1] Triển khai Facebook webhook service trong src/services/facebook-webhook.ts
- [x] T018 [US1] Triển khai routes tài khoản trong src/routes/accounts.ts
- [x] T019 [US1] Triển khai auto-refresh token trong src/workers/token-worker.ts
- [ ] T020 [US1] Tích hợp Facebook Login SDK vào frontend (src/pages/Accounts.tsx)
- [ ] T021 [US1] Tạo component AccountList trong frontend/src/components/AccountList.tsx
- [ ] T022 [US1] Thêm validation và xử lý lỗi cho luồng OAuth

**Điểm Kiểm Tra**: Tại thời điểm này, Câu Chuyện Người Dùng 1 phải hoạt động đầy đủ - có thể kết nối Facebook và quản lý tài khoản

---

## Giai Đoạn 4: Câu Chuyện Người Dùng 2 - Trả Lời Tin Nhắn Tự Động Bằng AI (Ưu Tiên: P1)

**Mục Tiêu**: Hệ thống tự động phân loại tin nhắn và tạo câu trả lời bằng AI

**Kiểm Thử Độc Lập**: Gửi tin nhắn thử, AI trả lời trong 30 giây, chế độ chờ duyệt hoạt động

### Triển Khai Cho Câu Chuyện Người Dùng 2

- [x] T023 [P] [US2] Tạo model Message và AiResponse trong prisma/schema.prisma
- [x] T024 [P] [US2] Triển khai message processor trong src/services/message-processor.ts
- [x] T025 [P] [US2] Triển khai AI responder service trong src/services/ai-responder.ts
- [x] T026 [P] [US2] Triển khai message queue worker trong src/workers/message-worker.ts
- [x] T027 [US2] Triển khai routes tin nhắn trong src/routes/messages.ts
- [x] T028 [US2] Triển khai routes AI responses trong src/routes/ai-responses.ts
- [x] T029 [US2] Triển khai webhook endpoint trong src/routes/webhook.ts
- [ ] T030 [US2] Tích hợp luồng tin nhắn vào frontend (src/pages/Conversations.tsx)
- [ ] T031 [US2] Tạo component ConversationView trong frontend/src/components/ConversationView.tsx
- [ ] T032 [US2] Tạo component AiResponseQueue trong frontend/src/components/AiResponseQueue.tsx
- [ ] T033 [US2] Thêm logic chờ duyệt và chỉnh sửa câu trả lời AI

**Điểm Kiểm Tra**: Tin nhắn được nhận, phân loại, AI tạo câu trả lời, gửi tự động hoặc chờ duyệt

---

## Giai Đoạn 5: Câu Chuyện Người Dùng 3 - Quản Lý Tri Thức (Ưu Tiên: P2)

**Mục Tiêu**: Người dùng có thể tạo, sửa, xóa kho tri thức để AI trả lời chính xác hơn

**Kiểm Thử Độc Lập**: Thêm mục tri thức, AI sử dụng nó khi trả lời tin nhắn liên quan

### Triển Khai Cho Câu Chuyện Người Dùng 3

- [x] T034 [P] [US3] Tạo model KnowledgeItem trong prisma/schema.prisma
- [x] T035 [P] [US3] Triển khai knowledge manager service trong src/services/knowledge-manager.ts
- [x] T036 [P] [US3] Triển khai vector embedding service (OpenAI/Anthropic)
- [x] T037 [US3] Triển khai routes tri thức trong src/routes/knowledge.ts
- [ ] T038 [US3] Tích hợp semantic search với AI responder (T025)
- [ ] T039 [US3] Tạo component KnowledgeEditor trong frontend/src/components/KnowledgeEditor.tsx
- [ ] T040 [US3] Tích hợp trang tri thức vào frontend (src/pages/Knowledge.tsx)
- [ ] T041 [US3] Thêm validation và xử lý lỗi cho CRUD tri thức

**Điểm Kiểm Tra**: Kho tri thức hoạt động, AI sử dụng tri thức khi trả lời, tìm kiếm ngữ nghĩa chính xác

---

## Giai Đoạn 6: Câu Chuyện Người Dùng 4 - Lịch Sử Trò Chuyện (Ưu Tiên: P2)

**Mục Tiêu**: Người dùng có thể xem lịch sử, tìm kiếm, và xuất dữ liệu

**Kiểm Thử Độc Lập**: Tìm kiếm tin nhắn theo từ khóa, lọc theo thời gian, xuất CSV/JSON

### Triển Khai Cho Câu Chuyện Người Dùng 4

- [x] T042 [P] [US4] Triển khai history service trong src/services/history-exporter.ts
- [x] T043 [P] [US4] Triển khai export worker trong src/workers/export-worker.ts
- [x] T044 [US4] Triển khai routes lịch sử trong src/routes/history.ts
- [x] T045 [US4] Triển khai endpoint statistics trong src/routes/stats.ts
- [ ] T046 [US4] Tạo component HistorySearch trong frontend/src/components/HistorySearch.tsx
- [ ] T047 [US4] Tích hợp trang lịch sử vào frontend (src/pages/History.tsx)
- [ ] T048 [US4] Thêm chức năng xuất dữ liệu với progress tracking

**Điểm Kiểm Tra**: Lịch sử đầy đủ, tìm kiếm nhanh (< 5 giây), xuất dữ liệu hoạt động

---

## Giai Đoạn 7: Hoàn Chỉnh & Các Vấn Đề Đa Chiều

**Mục Đích**: Cải thiện ảnh hưởng đến nhiều câu chuyện người dùng

- [x] T049 [P] Tạo Dashboard tổng quan trong frontend/src/pages/Dashboard.tsx
- [x] T050 [P] Thêm thông báo real-time (WebSocket) khi có tin nhắn mới
- [x] T051 [P] Tối ưu hóa performance query database
- [x] T052 [P] Thêm logging và monitoring cho production
- [x] T053 Tăng cường bảo mật: input validation, CORS, rate limiting
- [x] T054 Tạo Dockerfile và docker-compose.yml cho production
- [x] T055 Viết tài liệu API (OpenAPI/Swagger)
- [x] T056 Chạy xác nhận quickstart.md và fix các vấn đề

---

## Phụ Thuộc & Thứ Tự Thực Thi

### Phụ Thuộc Giai Đoạn

- **Thiết Lập (Giai Đoạn 1)**: Không phụ thuộc - có thể bắt đầu ngay
- **Cơ Sở (Giai Đoạn 2)**: Phụ thuộc vào Thiết Lập - CHẶN tất cả câu chuyện người dùng
- **US1 Kết Nối FB (Giai Đoạn 3)**: Phụ thuộc vào Cơ Sở
- **US2 AI Reply (Giai Đoạn 4)**: Phụ thuộc vào Cơ Sở, có thể chạy song song US1
- **US3 Tri Thức (Giai Đoạn 5)**: Phụ thuộc vào US2 (cần AI responder)
- **US4 Lịch Sử (Giai Đoạn 6)**: Phụ thuộc vào US2 (cần message data)
- **Hoàn Chỉnh (Giai Đoạn 7)**: Phụ thuộc tất cả câu chuyện

### Thứ Tự Khuyến Nghị

```
Giai Đoạn 1 → Giai Đoạn 2 → [US1 + US2 song song] → US3 → US4 → Giai Đoạn 7
```

### Cơ Hội Song Song

- **US1 + US2**: Có thể chạy song song sau Giai Đoạn 2
- **US3 + US4**: Có thể chạy song song sau US2
- Nhiệm vụ [P] trong cùng giai đoạn: chạy song song

---

## Ví Dụ Song Song: US1 + US2

```bash
# Sau Giai Đoạn 2 hoàn thành, chạy song song:

# Nhóm US1:
T015: Tạo model FacebookAccount
T016: Triển khai Facebook OAuth service
T017: Triển khai Facebook webhook service

# Nhóm US2 (cùng lúc):
T023: Tạo model Message + AiResponse
T024: Triển khai message processor
T025: Triển khai AI responder service
T026: Triển khai message queue worker
```

---

## Chiến Lược Triển Khai

### MVP Đầu Tiên (US1 Kết Nối Facebook)

1. Hoàn thành Giai Đoạn 1: Thiết Lập
2. Hoàn thành Giai Đoạn 2: Cơ Sở
3. Hoàn thành Giai Đoạn 3: US1 Kết Nối Facebook
4. **DỪNG LẠI VÀ XÁC NHẬN**: Kiểm thử US1 độc lập
5. Triển khai/trình diễn tính năng cơ bản

### Giao Hàng Từng Phần

1. Thiết Lập + Cơ Sở → Hạ tầng sẵn sàng
2. US1 Kết Nối FB → MVP cơ bản
3. US2 AI Reply → Tính năng cốt lõi
4. US3 Tri Thức → Cải thiện chất lượng
5. US4 Lịch Sử → Đầy đủ tính năng

---

## Thống Kê Nhiệm Vụ

| Giai Đoạn | Số Nhiệm Vụ | Song Song |
|-----------|-------------|----------|
| Thiết Lập | 5 | 3 |
| Cơ Sở | 9 | 6 |
| US1 Kết Nối FB | 8 | 3 |
| US2 AI Reply | 11 | 4 |
| US3 Tri Thức | 8 | 3 |
| US4 Lịch Sử | 7 | 2 |
| Hoàn Chỉnh | 8 | 4 |
| **Tổng** | **56** | **25** |

**MVP Scope**: Giai Đoạn 1-3 (T001-T022) = 22 nhiệm vụ
