# Hướng Dẫn Nhanh: Quản Lý Tin Nhắn Facebook Messenger

**Tính Năng**: `001-fb-messenger-ai`
**Ngày**: 2026-07-18

## Yêu Cầu

- Node.js 18+ hoặc Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Tài khoản Facebook Developer
- API key từ nhà cung cấp LLM (OpenAI/Anthropic)

---

## Bước 1: Cài Đặt

```bash
# Clone và cài đặt dependencies
git clone <repo-url>
cd fb-messenger-ai
npm install  # hoặc pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Chạy database migration
npm run db:migrate  # hoặc alembic upgrade head
```

---

## Bước 2: Cấu Hình

Chỉnh sửa `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fbmessenger

# Redis
REDIS_URL=redis://localhost:6379

# Facebook App
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_WEBHOOK_URL=https://your-domain.com/webhook/facebook

# LLM API
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4
```

---

## Bước 3: Chạy Hệ Thống

```bash
# Khởi chạy server
npm start  # hoặc python -m app

# Khởi chạy worker xử lý tin nhắn
npm run worker  # hoặc python -m worker
```

---

## Bước 4: Kiểm Thử Tính Năng

### 4.1 Kết Nối Tài Khoản Facebook

1. Truy cập `http://localhost:3000/accounts`
2. Nhấn "Kết nối Facebook"
3. Đăng nhập Facebook và cấp quyền
4. Xác nhận tài khoản xuất hiện trong danh sách

### 4.2 Gửi Tin Nhắn Thử Nghiệm

```bash
# Gửi webhook mô phỏng tin nhắn
curl -X POST http://localhost:3000/webhook/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "test_page",
      "time": 1234567890,
      "messaging": [{
        "sender": {"id": "test_user"},
        "recipient": {"id": "test_page"},
        "timestamp": 1234567890,
        "message": {"mid": "test_msg_1", "text": "Giá bao nhiêu?"}
      }]
    }]
  }'
```

### 4.3 Kiểm Tra AI Response

```bash
# Xem danh sách câu trả lời chờ duyệt
curl http://localhost:3000/api/ai-responses?status=pending

# Duyệt và gửi
curl -X POST http://localhost:3000/api/ai-responses/{response_id}/approve
```

### 4.4 Quản Lý Tri Thức

```bash
# Thêm mục tri thức
curl -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bảng giá dịch vụ",
    "content": "Gói cơ bản: 100k/tháng, Gói nâng cao: 500k/tháng",
    "category": "pricing",
    "tags": ["giá", "bảng giá"]
  }'

# Tìm kiếm tri thức
curl -X POST http://localhost:3000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "giá bao nhiêu"}'
```

### 4.5 Xem Lịch Sử

```bash
# Lấy lịch sử trò chuyện
curl "http://localhost:3000/api/history?from=2026-07-01&to=2026-07-18"

# Xuất dữ liệu
curl "http://localhost:3000/api/history/export?format=csv&from=2026-07-01"
```

---

## Kết Quả Mong Đợi

| Tính Năng | Kết Quả |
|-----------|---------|
| Kết nối Facebook | Tài khoản hiển thị "Đã kết nối" |
| Tin nhắn thử | AI trả lời trong 30 giây |
| Chế độ chờ duyệt | Câu trả lời xuất hiện trong hàng đợi |
| Thêm tri thức | AI sử dụng tri thức khi trả lời |
| Tìm kiếm lịch sử | Hiển thị tin nhắn phù hợp |
| Xuất dữ liệu | Tải tệp CSV/JSON |

---

## Xử Lí Lỗi

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| `401 Unauthorized` | Token hết hạn | Nhấn "Làm mới token" hoặc kết nối lại |
| `502 Bad Gateway` | Lỗi Facebook API | Kiểm tra FACEBOOK_APP_ID/SECRET |
| `503 Service Unavailable` | Lỗi LLM API | Kiểm tra LLM_API_KEY |
| `429 Too Many Requests` | Vượt rate limit | Giảm tần suất gửi tin nhắn |
