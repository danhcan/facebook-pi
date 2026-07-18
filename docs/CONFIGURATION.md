# ⚙️ Hướng dẫn cấu hình

Tài liệu này hướng dẫn chi tiết cấu hình dự án cho môi trường **development**
(chạy demo) và **production**.

---

## 1. File `.env`

Tất cả cấu hình nằm trong file `.env` ở thư mục gốc. Sao chép từ mẫu:

```bash
cp .env.example .env
```

### Bảng biến môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://...` | Chuỗi kết nối DB |
| `REDIS_URL` | ⚠️ worker | `redis://localhost:6379` | Chuỗi kết nối Redis |
| `PORT` | ❌ | `3000` | Port server backend |
| `NODE_ENV` | ❌ | `development` | `development` / `production` |
| `JWT_SECRET` | ✅ | `dev-jwt-secret...` | Khí bí mật ký JWT |
| `FACEBOOK_APP_ID` | 📱 FB thật | — | Facebook App ID |
| `FACEBOOK_APP_SECRET` | 📱 FB thật | — | Facebook App Secret |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | 📱 FB thật | — | Token xác minh webhook |
| `FACEBOOK_WEBHOOK_URL` | 📱 FB thật | — | URL webhook công khai |
| `LLM_PROVIDER` | ❌ | `openai` | Nhà cung cấp LLM |
| `LLM_API_KEY` | 🤖 AI thật | — | API key của LLM |
| `LLM_MODEL` | ❌ | `gpt-4` | Tên model LLM |
| `ENCRYPTION_KEY` | ✅ | `dev-encryption-key...` | Khóa mã hóa (32 ký tự) |

> **Ký hiệu**: ✅ bắt buộc · ⚠️ chỉ bắt buộc khi chạy worker · 📱 chỉ cần khi
> kết nối Facebook thật · 🤖 chỉ cần khi dùng LLM thật

---

## 2. Cấu hình Development (chạy demo ngay)

Mặc định `.env` đã cấu hình để chạy **ngay không cần PostgreSQL hay Redis**:

```ini
# .env (development)
DATABASE_URL="file:./dev.db"          # SQLite — không cần cài PostgreSQL
REDIS_URL="redis://localhost:6379"    # chỉ cần khi chạy worker
PORT=3000
NODE_ENV=development
JWT_SECRET="dev-jwt-secret-not-for-production"
ENCRYPTION_KEY="dev-encryption-key-32chars!!"

# Các giá trị Facebook/LLM để trống — chạy demo mode
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
FACEBOOK_WEBHOOK_URL=http://localhost:3000/webhook/facebook
LLM_PROVIDER=openai
LLM_API_KEY=your_llm_api_key
LLM_MODEL=gpt-4
```

Sau khi cấu hình:

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

✅ Chạy được **không cần** PostgreSQL, Redis, Facebook App, hay LLM API key.

---

## 3. Database

### SQLite (dev — mặc định)

```ini
DATABASE_URL="file:./dev.db"
```

Không cần cài gì thêm. File `dev.db` tự tạo trong thư mục gốc. **Chỉ phù hợp
cho development**, không dùng cho production.

### PostgreSQL (production)

1. Cài PostgreSQL ≥ 12, tạo database:

```sql
CREATE DATABASE fbmessenger;
CREATE USER fbuser WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE fbmessenger TO fbuser;
```

2. Cập nhật `.env`:

```ini
DATABASE_URL="postgresql://fbuser:strong_password@localhost:5432/fbmessenger"
```

3. Chạy migration:

```bash
npx prisma migrate deploy
npx prisma generate
```

4. (Tùy chọn) Seed production:

```bash
npm run db:seed    # ⚠️ tạo user demo — chỉ chạy môi trường test/staging
```

> 💡 Schema (`prisma/schema.prisma`) dùng `provider = "sqlite"` cho dev. Khi
> chuyển sang PostgreSQL, đổi `provider = "postgresql"` rồi chạy
> `npx prisma migrate dev --name init-postgres`.

---

## 4. Redis (chỉ cần khi chạy worker)

Worker (`npm run worker`) dùng BullMQ + Redis để xử lý hàng đợi tin nhắn.

- **Dev không cần**: Server chính (`npm run dev`) vẫn chạy mà không cần Redis
  — chỉ khi muốn test luồng webhook → queue → AI mới cần.
- **Cài Redis**:
  - **Windows**: dùng [Memurai](https://www.memurai.com/) hoặc WSL2 `sudo apt install redis`
  - **macOS**: `brew install redis && brew services start redis`
  - **Linux**: `sudo apt install redis-server && sudo systemctl start redis`
  - **Docker**: `docker run -d -p 6379:6379 redis:7`

Kiểm tra Redis chạy:

```bash
redis-cli ping    # → PONG
```

---

## 5. Facebook (tùy chọn — chỉ khi dùng Messenger thật)

### 5.1. Tạo Facebook App

1. Vào https://developers.facebook.com/apps → **Create App**
2. Chọn loại **Business** → thêm sản phẩm **Messenger**
3. Lấy thông tin:
   - **App ID** → `FACEBOOK_APP_ID`
   - **App Secret** (Settings → Basic) → `FACEBOOK_APP_SECRET`
4. Tạo **Page Access Token** (Messenger → Settings → Add or Remove Pages)
5. Cấu hình **Webhook**:
   - Callback URL: `https://<domain>/webhook/facebook` (cần HTTPS công khai)
   - Verify Token: tự đặt chuỗi bí mật → `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
   - Subscribe fields: `messages`, `messaging_postbacks`

### 5.2. Cập nhật `.env`

```ini
FACEBOOK_APP_ID=1234567890
FACEBOOK_APP_SECRET=abc123...
FACEBOOK_WEBHOOK_VERIFY_TOKEN=my_secret_verify_token_2024
FACEBOOK_WEBHOOK_URL=https://your-domain.com/webhook/facebook
```

### 5.3. Webhook local (dev)

Webhook cần URL công khai. Dùng **ngrok** để tunnel localhost:

```bash
ngrok http 3000
# → lấy URL https://xxxx.ngrok.io
# Cập nhật FACEBOOK_WEBHOOK_URL và cấu hình trên Facebook App
```

> ⚠️ Khi dùng Facebook thật, luồng là: FB gửi tin → webhook → queue →
> message-worker → ai-responder → AiResponse (status=pending) → admin duyệt
> hoặc tự động gửi. Đảm bảo `npm run worker` đang chạy.

---

## 6. LLM / AI (tùy chọn — chỉ khi muốn AI thông minh hơn)

### Demo mode (mặc định)

`ai-responder.ts` dùng **rule-based**: sinh câu trả lời dựa trên classification
(question / complaint / pricing / ...) + nội dung từ Knowledge. **Không cần
LLM_API_KEY**. Phù hợp demo và test luồng.

### Dùng OpenAI thật

1. Lấy API key tại https://platform.openai.com/api-keys
2. Cập nhật `.env`:

```ini
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4          # hoặc gpt-4o-mini, gpt-3.5-turbo
```

3. Sửa `src/services/ai-responder.ts` — thay logic rule-based bằng lời gọi
   OpenAI API (dùng `node-fetch` đã cài). Ví dụ:

```typescript
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${config.llm.apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: config.llm.model,
    messages: [
      { role: 'system', content: `Bạn là CSKH tiếng Việt. Dùng thông tin: ${knowledgeContext}` },
      { role: 'user', content: message }
    ]
  })
})
```

---

## 7. Bảo mật — Production Checklist

Trước khi deploy, kiểm tra:

- [ ] **`JWT_SECRET`**: chuỗi ngẫu nhiên ≥ 64 ký tự. Tạo bằng:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- [ ] **`ENCRYPTION_KEY`**: đúng 32 ký tự, giữ bí mật.
  ```bash
  node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  ```
- [ ] **`NODE_ENV=production`**
- [ ] **`DATABASE_URL`** trỏ PostgreSQL (không dùng SQLite)
- [ ] **`.env` KHÔNG commit** — thêm vào `.gitignore`
- [ ] **CORS**: cấu hình `origin` chỉ cho domain frontend thật (trong `src/app.ts`)
- [ ] **HTTPS**: dùng Nginx/Caddy reverse proxy với TLS
- [ ] **Rate limiting**: thêm middleware (chưa có trong demo)
- [ ] **Backup DB** định kỳ

---

## 8. Kiểm tra cấu hình

Sau khi cấu hình, kiểm tra server nhận đúng config:

```bash
npm run dev
# Console phải in:
#   Server running on port 3000
#   Redis connected       (nếu Redis chạy)
#   Prisma Client đã sinh
```

Smoke test API:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vietnamese.ai","password":"demo123456"}'
# → { "token": "eyJ...", "user": {...} }

# Dùng token gọi API
curl http://localhost:3000/api/stats/overview \
  -H "Authorization: Bearer <TOKEN>"
# → { "totalConversations":7, "totalMessages":14, ... }
```

---

## 9. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Khắc phục |
|---|---|---|
| `PrismaClientInitializationError` | Chưa chạy `prisma generate` | `npx prisma generate` |
| `P1003: Database does not exist` | DB chưa tạo (PostgreSQL) | Tạo DB rồi `prisma migrate deploy` |
| `Can't reach database server` | Sai `DATABASE_URL` | Kiểm tra chuỗi kết nối |
| `ECONNREFUSED 127.0.0.1:6379` | Redis không chạy (chỉ lỗi khi worker) | Khởi động Redis hoặc bỏ qua worker |
| `401 Unauthorized` | Token sai / hết hạn | Đăng nhập lại, kiểm tra `JWT_SECRET` |
| `403 Forbidden` | Webhook verify token sai | Khớp `FACEBOOK_WEBHOOK_VERIFY_TOKEN` với cấu hình FB App |
| `ENCRYPTION_KEY` phải 32 ký tự | Sai độ dài khóa | Đặt đúng 32 ký tự ASCII |

---

## 10. Cấu hình Frontend

Frontend Vite (`frontend/vite.config.ts`) đã cấu hình proxy:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
    '/webhook': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

- **Dev**: frontend gọi `/api/*` → Vite proxy → backend `:3000`. Không cần CORS.
- **Production**: build frontend (`npm run build`) → serve `frontend/dist/`
  bằng Nginx, hoặc cấu hình Express serve static. Lúc này cần CORS hoặc cùng
  domain.

Production server API URL (nếu tách domain):

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || ''
// Thêm VITE_API_URL=https://api.your-domain.com trong frontend/.env
```
