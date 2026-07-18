# Kế Hoạch Triển Khai: Quản Lý Tin Nhắn Facebook Messenger

**Nhánh**: `001-fb-messenger-ai` | **Ngày**: 2026-07-18 | **Đặc Tả**: [spec.md](./spec.md)

**Đầu Vào**: Đặc tả tính năng từ `/specs/001-fb-messenger-ai/spec.md`

## Tóm Tắt

Xây dựng ứng dụng web quản lý tin nhắn Facebook Messenger với khả năng trả lời tự động bằng AI. Hệ thống bao gồm: kết nối OAuth Facebook, phân loại tin nhắn, tạo câu trả lời bằng LLM, quản lý tri thức, và lịch sử trò chuyện.

## Bối Cảnh Kỹ Thuật

**Ngôn ngữ/Phiên Bản**: TypeScript 5.3 + Node.js 20 LTS

**Phụ Thuộc Chính**:
- Backend: Express.js / Fastify
- ORM: Prisma
- Queue: BullMQ
- AI: OpenAI API / Anthropic API
- Auth: Passport.js + Facebook OAuth

**Lưu Trữ**: PostgreSQL 14+ (chính), Redis 7+ (cache + queue)

**Kiểm Thử**: Vitest (unit), Supertest (integration), Playwright (e2e)

**Nền Tảng Mục Tiêu**: Web application, responsive design

**Loại Dự Án**: Web service + Dashboard UI

**Mục Hiệu Suất**: Xử lý < 30 giây/tin nhắn, hỗ trợ 100 tài khoản đồng thời

**Hạn Chế**: < 500ms API response time, < 512MB RAM per worker

**Quy Mô/Phạm Vi**: 100 tài khoản FB, ~10k tin nhắn/ngày

## Kiểm Tra Hiến Pháp

*Hiến pháp chưa được thiết lập. Bỏ qua kiểm tra cổng.*

## Cấu Trúc Dự Án

### Tài Liệu (tính năng này)

```text
specs/001-fb-messenger-ai/
├── plan.md              # Tệp này
├── research.md          # Nghiên cứu kỹ thuật
├── data-model.md        # Mô hình dữ liệu
├── quickstart.md        # Hướng dẫn nhanh
├── contracts/           # Hợp đồng API
│   ├── accounts.md
│   ├── messages.md
│   ├── knowledge.md
│   └── history.md
└── tasks.md             # (Tạo bởi /speckit.tasks)
```

### Mã Nguồn (gốc kho)

```text
src/
├── config/
│   ├── database.ts
│   ├── redis.ts
│   └── facebook.ts
├── models/
│   ├── account.ts
│   ├── conversation.ts
│   ├── message.ts
│   ├── ai-response.ts
│   └── knowledge.ts
├── services/
│   ├── facebook-auth.ts
│   ├── facebook-webhook.ts
│   ├── message-processor.ts
│   ├── ai-responder.ts
│   ├── knowledge-manager.ts
│   └── history-exporter.ts
├── routes/
│   ├── accounts.ts
│   ├── conversations.ts
│   ├── messages.ts
│   ├── ai-responses.ts
│   ├── knowledge.ts
│   ├── history.ts
│   └── webhook.ts
├── workers/
│   ├── message-worker.ts
│   └── export-worker.ts
├── middleware/
│   ├── auth.ts
│   └── rate-limit.ts
└── utils/
    ├── encryption.ts
    └── classifier.ts

tests/
├── unit/
│   ├── services/
│   └── models/
├── integration/
│   ├── routes/
│   └── workers/
└── e2e/
    └── flows/

frontend/
├── src/
│   ├── components/
│   │   ├── AccountList.tsx
│   │   ├── ConversationView.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── AiResponseQueue.tsx
│   │   ├── KnowledgeEditor.tsx
│   │   └── HistorySearch.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Accounts.tsx
│   │   ├── Conversations.tsx
│   │   ├── Knowledge.tsx
│   │   └── History.tsx
│   └── services/
│       └── api.ts
└── tests/
```

**Quyết Định Cấu Trúc**: Ứng dụng web fullstack với backend API và frontend React/Next.js. Tách biệt backend (API + workers) và frontend (dashboard UI).

## Theo Dõi Độ Phức Tạp

Không có vi phạm hiến pháp cần biện minh.
