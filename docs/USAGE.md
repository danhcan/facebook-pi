# 📖 Hướng dẫn sử dụng

Tài liệu hướng dẫn thao tác trên giao diện web từng trang. Giao diện dùng
theme "Midnight" (macOS premium-night, tiếng Việt).

> Yêu cầu: backend đang chạy (`npm run dev`) và đã seed data (`npm run db:seed`).

---

## 1. Đăng nhập

Mở **http://localhost:5173** → trang Login.

**Tài khoản demo:**
```
Email:    demo@vietnamese.ai
Mật khẩu: demo123456
```

- **Đăng nhập**: nhập email + mật khẩu → vào Dashboard.
- **Đăng ký** (tab "Đăng ký"): nhập tên + email + mật khẩu → tạo tài khoản mới.
- **Đăng xuất**: nút avatar ở góc trên-phải Layout → "Đăng xuất".

> Cơ chế: JWT token lưu trong `localStorage` (`fbm_token`). Hết hạn / sai
> token → tự động chuyển về trang Login.

---

## 2. Dashboard (Tổng quan)

Trang chủ sau khi đăng nhập.

**Hiển thị:**
- **Lời chào** theo giờ trong ngày (sáng / trưa / chiều / tối)
- **4 thẻ thống kê**:
  - Đang hoạt động — số cuộc trò chuyện
  - Tổng tin nhắn
  - Phản hồi AI — số câu AI đã trả lời
  - Chờ duyệt — số phản hồi chờ admin duyệt
- **Biểu đồ hoạt động 7 ngày**: cột đôi (AI / tổng tin nhắn)
- **Bảng tổng quan**: số liệu chi tiết kèm trạng thái (chấm xanh=v tốt, vàng=cảnh báo)

> Dữ liệu tải từ `/api/stats/overview` và `/api/stats/activity?days=7`.

---

## 3. Tài khoản (Accounts)

Quản lý tài khoản Facebook đã kết nối.

### Xem danh sách
Mỗi tài khoản hiển thị:
- Trạng thái (chấm xanh ON / xám OFF)
- Tên hiển thị, Facebook User ID
- Ngày kết nối, lần đồng bộ cuối
- Nút thao tác: **Làm mới** (🔄) · **Mở FB** (↗) · **Ngắt kết nối** (🗑)

### Kết nối tài khoản (demo)
1. Nhấn nút **"Kết nối"** (góc trên-phải) → mở modal
2. Nhập **Tên hiển thị** (bắt buộc), vd: "Shop Online VN"
3. (Tùy chọn) Nhập **Facebook User ID** — để trống để tự sinh
4. Nhấn **"Kết nối"** → tạo record trong DB

> ⚠️ Chế độ demo: không gọi Facebook OAuth thật, chỉ tạo record để test UI.
> Khi kết nối thật, cần `FACEBOOK_APP_ID/SECRET` và luồng OAuth.

### Ngắt kết nối
Nhấn 🗑 → xác nhận → xóa khỏi DB.

### Làm mới token
Nhấn 🔄 → làm mới token (demo: chỉ cập nhật `last_sync_at`).

---

## 4. Hội thoại (Conversations)

Trang chat giống Messenger.

### Bố cục
- **Cột trái**: danh sách cuộc trò chuyện + ô tìm kiếm
- **Cột phải**: chi tiết hội thoại + tin nhắn + ô trả lời

### Tìm kiếm
Gõ tên khách vào ô "Tìm khách..." → lọc danh sách realtime.

### Xem tin nhắn
Nhấp vào 1 cuộc trò chuyện → tải tin nhắn từ API. Cuộn tự động xuống cuối.
- Tin khách (inbound): bong bóng xám bên trái
- Tin mình (outbound): bong bóng accent bên phải
- Mỗi tin hiển thị: nội dung · giờ · classification (nếu có)

### Trả lời tay
1. Gõ vào ô "Nhập tin nhắn..." dưới cùng
2. Nhấn Enter hoặc nút ➡
3. Tin gửi lưu DB + hiển thị ngay

### Chế độ trả lời
Header hiển thị chế độ của hội thoại:
- 🤖 **Tự động**: AI trả lời ngay, không cần duyệt
- ⏰ **Chờ duyệt**: AI tạo bản nháp, admin duyệt rồi mới gửi
- **Kết hợp**: tùy tin

> Đổi chế độ: dùng API `PATCH /api/conversations/:id/settings` (chưa có nút UI,
> có thể thêm nếu cần).

---

## 5. Kiến thức (Knowledge)

Cơ sở dữ liệu để AI sinh câu trả lời (FAQ, giá, chính sách...).

### Xem danh sách
Mỗi bài viết hiển thị:
- Icon sách 📕 + tiêu đề
- Danh mục (pricing / policy / faq / product / custom)
- Nội dung (2 dòng)
- Tags
- Nút **Sửa** ✏ · **Xóa** 🗑

### Tìm kiếm
Ô "Tìm kiếm..." phía dưới tiêu đề → lọc theo từ khóa.

### Thêm bài viết
1. Nhấn **"Thêm"** → mở modal
2. Nhập:
   - **Tiêu đề** (bắt buộc) — vd: "Bảng giá dịch vụ"
   - **Nội dung** (bắt buộc) — chi tiết
   - **Danh mục** — chọn từ dropdown
   - **Tags** — cách nhau bởi dấu phẩy, vd: "giá, thanh toán"
3. Nhấn **"Thêm"** → lưu vào DB, danh sách cập nhật

### Sửa bài viết
Nhấn ✏ trên bài → modal mở với nội dung cũ → sửa → **"Cập nhật"**.

### Xóa bài viết
Nhấn 🗑 → xác nhận → xóa khỏi DB.

> Dữ liệu dùng cho AI: khi khách hỏi, `ai-responder` tìm bài viết phù hợp qua
> `knowledgeApi` rồi ghép vào câu trả lời.

---

## 6. Phản hồi AI (AiResponses)

Quản lý câu trả lời AI — **trang quan trọng nhất** cho CSKH.

### Bộ lọc (tab)
4 tab phía trên:
- **Tất cả** — mọi trạng thái
- **Chờ duyệt** — cần admin xử lý
- **Đã gửi** — đã gửi thành công
- **Từ chối** — đã bị reject

### Mỗi phản hồi hiển thị
- **Badge trạng thái**: chờ duyệt (vàng) / đã duyệt (xanh dương) / đã gửi (xanh lá) / từ chối (đỏ)
- **Khách hàng** + **classification** tin gốc
- **Độ tin cậy** (confidence %)
- **Thời gian** tạo
- **Tin nhắn khách** (gốc)
- **Câu trả lời AI** (đề xuất)

### Duyệt & gửi
Khi status = `pending`:
1. Đọc tin khách + câu AI đề xuất
2. Nếu OK → nhấn **"Duyệt & gửi"** → AI chuyển `sent`, gửi tới khách
3. Nếu cần sửa → nhấn **"Sửa"** → textarea → chỉnh → **"Lưu"** → rồi duyệt
4. Nếu không phù hợp → nhấn **"Từ chối"** → chuyển `rejected`

> Luồng đầy đủ: webhook nhận tin → AI sinh câu → status=pending → admin
> duyệt → gửi → status=sent.

---

## 7. Thống kê (Stats)

Trang số liệu chi tiết.

**Hiển thị:**
- **4 thẻ số liệu**: cuộc trò chuyện · tin nhắn · AI trả lời · tri thức
- **Biểu đồ hoạt động 7 ngày** (cột đôi AI/tổng)
- **Tỷ lệ AI**: thanh tiến trình % AI trên tổng tin
- **Chờ duyệt**: thanh tiến trình số chờ trên tổng AI
- **3 thẻ hiệu suất**: phản hồi AI · chờ duyệt · tri thức

> Dữ liệu từ `/api/stats/overview` + `/api/stats/activity?days=7`.

---

## 8. Lịch sử (History) — qua API

Giao diện chưa có trang riêng, nhưng API sẵn sàng. Tra cứu:

```bash
curl "http://localhost:3000/api/history?page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

Xuất file:

```bash
# CSV (mở được bằng Excel)
curl "http://localhost:3000/api/history/export?format=csv" \
  -H "Authorization: Bearer <TOKEN>" -o history.csv

# JSON
curl "http://localhost:3000/api/history/export?format=json" \
  -H "Authorization: Bearer <TOKEN>" -o history.json
```

File CSV có cột: `id, participant_name, direction, content, classification, created_at`.

---

## 9. Webhook — test bằng curl

Khi dùng Facebook thật, FB gọi webhook. Test thủ công:

```bash
# Xác minh webhook (GET)
curl "http://localhost:3000/webhook/facebook?\
hub.mode=subscribe&\
hub.verify_token=your_webhook_verify_token&\
hub.challenge=CHALLENGE123"

# Giả lập tin nhắn đến (POST)
curl -X POST http://localhost:3000/webhook/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "PAGE_ID",
      "messaging": [{
        "sender": {"id": "CUSTOMER_ID"},
        "recipient": {"id": "PAGE_ID"},
        "message": {"text": "Cho mình hỏi giá dịch vụ"}
      }]
    }]
  }'
```

> ⚠️ Webhook cần `FACEBOOK_WEBHOOK_VERIFY_TOKEN` khớp cấu hình Facebook App.
> Worker (`npm run worker`) phải chạy để xử lý queue.

---

## 10. Luồng hoạt động tổng thể

```
Khách gửi tin trên Messenger
        │
        ▼
   Facebook → POST /webhook/facebook
        │
        ▼
   message-processor
   ├── phân loại (classifier)
   ├── lưu Message (inbound)
   ├── tạo Conversation nếu mới
   └── gọi ai-responder
              │
              ▼
         sinh câu trả lời
         (rule-based / LLM)
              │
              ▼
         lưu AiResponse (status=pending)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
 automatic           manual/mixed
    │                   │
 gửi ngay          chờ admin duyệt
 status=sent     (trang Phản hồi AI)
    │                   │
    └─────► admin xem ◄─┘
              │
         Duyệt → gửi (status=sent)
         Từ chối → (status=rejected)
```

---

## 11. Mẹo & lưu ý

- **Token hết hạn**: nếu thấy chuyển về Login đột ngột → đăng nhập lại.
- **Dữ liệu không cập nhật**: refresh trang (F5) hoặc đăng xuất rồi vào lại.
- **Test nhanh**: dùng `npm run db:seed` để reset data demo.
- **Xóa DB làm lại**:
  ```bash
  rm dev.db
  npx prisma migrate dev
  npm run db:seed
  ```
- **Chạy 2 terminal**: backend (`npm run dev`) + frontend (`cd frontend && npm run dev`).
- **Production build**: `cd frontend && npm run build` → serve `frontend/dist/`.
