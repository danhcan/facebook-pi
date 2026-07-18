# 🤖 FB Messenger AI — Quản lý trả lời khách tự động bằng AI

Hệ thống quản lý Facebook Messenger với AI trả lời khách hàng tự động, dành cho
chăm sóc khách hàng (CSKH) bằng tiếng Việt.

![Tech](https://img.shields.io/badge/Stack-Express%20%7C%20React%2019%20%7C%20Prisma%20%7C%20SQLite-blue)
![Status](https://img.shields.io/badge/Status-v1.0.0%20Demo-success)

---

## ✨ Tính năng chính

| Module | Mô tả |
|---|---|
| 🔐 **Auth** | Đăng ký / đăng nhập JWT, bảo vệ route frontend |
| 📊 **Dashboard** | Tổng quan hoạt động 7 ngày, số liệu realtime |
| 👤 **Tài khoản FB** | Kết nối / ngắt kết nối / làm mới tài khoản (demo) |
| 💬 **Hội thoại** | Danh sách chat, xem tin nhắn, gửi trả lời tay |
| 📚 **Kiến thức** | CRUD bài viết + tìm kiếm keyword (cơ sở cho AI) |
| ✨ **Phản hồi AI** | Duyệt / từ chối / sửa câu trả lời AI trước khi gửi |
| 📈 **Thống kê** | Biểu đồ hoạt động, tỷ lệ AI, số liệu tổng |
| 🕓 **Lịch sử** | Tra cứu + xuất CSV/JSON toàn bộ tin nhắn |
| 🔗 **Webhook** | Nhận tin nhắn từ Facebook Messenger |

> **Chế độ demo**: AI trả lời dùng rule-based (dựa trên classification + kiến
> thức), không cần LLM API key. Webhook Facebook có thể mô phỏng bằng curl.

---

## 🛠️ Công nghệ

**Backend** — Express 4 + TypeScript 5 + Prisma 5 (SQLite dev / PostgreSQL prod)
+ BullMQ/Redis (queue) + JWT + Zod + Pino

**Frontend** — React 19 + Vite 8 + Tailwind 4 + React Router 7 + Axios +
Lucide Icons. Theme "Midnight" (macOS premium-night, màu OKLCH).

**Test** — Vitest + Supertest (43 test integration, 6 file)

---

## 📁 Cấu trúc dự án

```
vietnamese-demo/
├── prisma/
│   ├── schema.prisma        # 7 model: User, FacebookAccount, Conversation, Message, AiResponse, KnowledgeItem, MessageHistory
│   └── seed.ts              # Data demo (user + accounts + conversations + ...)
├── src/
│   ├── app.ts               # Express app (routes, middleware)
│   ├── index.ts             # Khởi động server
│   ├── config/              # config, prisma, redis, queues
│   ├── middleware/          # auth (JWT), error-handler
│   ├── routes/              # 8 route group: auth, accounts, conversations, knowledge, history, ai-responses, stats, webhook
│   ├── services/            # ai-responder, message-processor, knowledge-manager, history-exporter, facebook-webhook
│   ├── workers/             # message-worker (BullMQ)
│   └── utils/               # logger, classifier, encryption
├── tests/
│   └── integration/         # 6 file test, 43 test case
├── frontend/
│   ├── src/
│   │   ├── pages/           # 7 trang: Login, Dashboard, Accounts, Conversations, Knowledge, AiResponses, Stats
│   │   ├── components/      # Layout (sidebar + header + logout)
│   │   ├── context/         # AuthContext
│   │   └── services/        # api.ts (axios + token interceptor)
│   └── vite.config.ts       # Proxy /api, /webhook → :3000
├── .env                     # Cấu hình (KHÔNG commit lên git)
├── .env.example             # Mẫu cấu hình
└── package.json
```

---

## 🚀 Bắt đầu nhanh (Quickstart)

### Yêu cầu

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Redis** (chỉ bắt buộc khi chạy worker; dev không cần)

### 1. Cài đặt

```bash
git clone <repo> vietnamese-demo
cd vietnamese-demo
npm install              # backend
cd frontend && npm install && cd ..   # frontend
```

### 2. Cấu hình

```bash
cp .env.example .env
# Mặc định .env dùng SQLite (file:./dev.db) — chạy được ngay không cần PostgreSQL
# Xem chi tiết: docs/CONFIGURATION.md
```

### 3. Khởi tạo database + seed demo

```bash
npx prisma generate          # sinh Prisma Client
npx prisma migrate dev       # tạo schema trong dev.db
npm run db:seed              # tạo data demo
```

> Kết quả seed:
> - User: `demo@vietnamese.ai` / `demo123456`
> - 5 mục kiến thức, 3 tài khoản FB, 7 hội thoại, 14 tin nhắn, 6 phản hồi AI

### 4. Chạy ứng dụng

```bash
# Terminal 1 — Backend (port 3000)
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Mở **http://localhost:5173** → đăng nhập bằng tài khoản demo.

---

## 👤 Tài khoản demo

```
Email:    demo@vietnamese.ai
Mật khẩu: demo123456
```

---

## 📜 Các lệnh (npm scripts)

### Backend
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server ở chế độ watch (tsx) |
| `npm run build` | Build TypeScript → `dist/` |
| `npm start` | Chạy bản build (`node dist/index.js`) |
| `npm run worker` | Chạy worker xử lý queue (cần Redis) |
| `npm run db:migrate` | Tạo/áp dụng migration |
| `npm run db:generate` | Sinh lại Prisma Client |
| `npm run db:seed` | Tạo data demo |
| `npm test` | Chạy test (watch mode) |
| `npm run test:run` | Chạy test 1 lần |
| `npm run lint` | ESLint |

### Frontend
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Vite dev server (:5173, proxy → :3000) |
| `npm run build` | Build production → `frontend/dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | OxLint |

---

## 🔗 API Endpoints

Tất cả endpoint (trừ auth) yêu cầu header `Authorization: Bearer <token>`.

| Nhóm | Method | Endpoint | Mô tả |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Đăng ký |
| Auth | POST | `/api/auth/login` | Đăng nhập → nhận JWT |
| Accounts | GET | `/api/accounts` | Danh sách tài khoản FB |
| Accounts | POST | `/api/accounts/connect` | Kết nối (demo) |
| Accounts | DELETE | `/api/accounts/:id` | Ngắt kết nối |
| Accounts | POST | `/api/accounts/:id/refresh` | Làm mới token |
| Conversations | GET | `/api/conversations` | Danh sách (+ search) |
| Conversations | GET | `/api/conversations/:id/messages` | Tin nhắn trong 1 hội thoại |
| Conversations | POST | `/api/conversations/:id/reply` | Gửi trả lời tay |
| Conversations | PATCH | `/api/conversations/:id/settings` | Đổi chế độ (automatic/manual/mixed) |
| Knowledge | GET | `/api/knowledge` | Danh sách (+ search) |
| Knowledge | POST | `/api/knowledge` | Tạo bài viết |
| Knowledge | PUT | `/api/knowledge/:id` | Cập nhật |
| Knowledge | DELETE | `/api/knowledge/:id` | Xóa |
| Knowledge | POST | `/api/knowledge/search` | Tìm kiếm keyword |
| Ai-responses | GET | `/api/ai-responses` | Danh sách (+ filter status) |
| Ai-responses | POST | `/api/ai-responses/:id/approve` | Duyệt & gửi |
| Ai-responses | POST | `/api/ai-responses/:id/reject` | Từ chối |
| Ai-responses | PUT | `/api/ai-responses/:id` | Sửa nội dung |
| Stats | GET | `/api/stats/overview` | Tổng quan |
| Stats | GET | `/api/stats/activity?days=7` | Hoạt động theo ngày |
| History | GET | `/api/history` | Tra cứu tin nhắn |
| History | GET | `/api/history/export?format=csv|json` | Xuất file |
| Webhook | GET | `/webhook/facebook` | Xác minh webhook |
| Webhook | POST | `/webhook/facebook` | Nhận tin nhắn từ FB |

> 📖 Chi tiết body request/response: `specs/001-fb-messenger-ai/contracts/`

---

## 🧪 Test

```bash
npm run test:run
```

```
Test Files  6 passed (6)
     Tests  43 passed (43)
```

Test integration dùng SQLite in-memory + Supertest. Vitest cấu hình
`fileParallelism: false` (chia sẻ 1 DB).

---

## 📚 Tài liệu thêm

- [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) — Hướng dẫn cấu hình chi tiết (`.env`, production, PostgreSQL, Redis, Facebook, LLM)
- [`docs/USAGE.md`](docs/USAGE.md) — Hướng dẫn sử dụng giao diện từng trang
- [`specs/001-fb-messenger-ai/`](specs/001-fb-messenger-ai/) — Spec & kế hoạch gốc

---

## ⚠️ Lưu ý quan trọng

1. **Demo mode**: AI trả lời dùng rule-based, không gọi LLM thật. Để dùng LLM
   thật (OpenAI), điền `LLM_API_KEY` vào `.env` và tích hợp vào `src/services/ai-responder.ts`.
2. **Facebook OAuth**: Trang Accounts nút "Kết nối" chỉ mô phỏng (tạo record DB),
   không gọi Facebook Graph API thật. Để kết nối thật cần `FACEBOOK_APP_ID/SECRET`
   và luồng OAuth thật.
3. **`.env` KHÔNG commit**: Luôn thêm `.env` vào `.gitignore`. Dùng giá trị mạnh
   cho `JWT_SECRET` và `ENCRYPTION_KEY` ở production.
4. **SQLite**: Mặc định dùng SQLite (`dev.db`) để chạy demo nhanh. Production
   nên chuyển sang PostgreSQL (xem `CONFIGURATION.md`).

---

## 📄 Giấy phép

Dự án demo — dùng nội bộ / học tập.
