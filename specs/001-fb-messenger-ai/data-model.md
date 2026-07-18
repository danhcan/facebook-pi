# Mô Hình Dữ Liệu: Quản Lý Tin Nhắn Facebook Messenger

**Tính Năng**: `001-fb-messenger-ai`
**Ngày**: 2026-07-18

## Tổng Quan

Mô hình dữ liệu cho ứng dụng quản lý tin nhắn Facebook Messenger với AI auto-reply.

---

## Các Thực Thể

### 1. FacebookAccount (Tài Khoản Facebook)

Đại diện cho tài khoản Facebook được kết nối vào hệ thống.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| user_id | UUID | ID người dùng sở hữu |
| facebook_user_id | String | ID người dùng Facebook |
| display_name | String | Tên hiển thị Facebook |
| access_token | Text | Token truy cập (mã hóa) |
| token_expires_at | Timestamp | Thời hạn token |
| status | Enum | active, expired, disconnected |
| connected_at | Timestamp | Thời điểm kết nối |
| last_sync_at | Timestamp | Lần đồng bộ cuối |

**Trạng Thái**:
```
connected → active → expired → disconnected
                  ↓
              reconnected
```

---

### 2. Conversation (Cuộc Trò Chuyện)

Nhóm các tin nhắn liên quan đến một người对话 trên Facebook.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| account_id | UUID | FK → FacebookAccount |
| facebook_conversation_id | String | ID cuộc trò chuyện trên Facebook |
| participant_name | String | Tên người对话 |
| participant_facebook_id | String | ID Facebook người对话 |
| status | Enum | active, archived |
| auto_reply_mode | Enum | automatic, manual, mixed |
| created_at | Timestamp | Thời điểm tạo |
| updated_at | Timestamp | Cập nhật cuối |

---

### 3. Message (Tin Nhắn)

Một tin nhắn đơn lẻ trong cuộc trò chuyện.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| conversation_id | UUID | FK → Conversation |
| direction | Enum | inbound, outbound |
| content | Text | Nội dung tin nhắn |
| message_type | Enum | text, image, video, audio |
| classification | Enum | pricing, complaint, support, general |
| sender_id | String | ID người gửi |
| facebook_message_id | String | ID tin nhắn trên Facebook |
| status | Enum | received, processing, sent, failed |
| created_at | Timestamp | Thời điểm gửi/nhận |
| sent_at | Timestamp | Thời điểm gửi (nếu là outbound) |

---

### 4. AiResponse (Câu Trả Lời AI)

Kết quả AI tạo ra cho một tin nhắn.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| message_id | UUID | FK → Message |
| content | Text | Nội dung câu trả lời |
| confidence | Float | Độ tin cậy (0-1) |
| knowledge_item_id | UUID | FK → KnowledgeItem (nếu dùng tri thức) |
| status | Enum | pending, approved, sent, rejected |
| approved_by | UUID | ID người dùng duyệt |
| approved_at | Timestamp | Thời điểm duyệt |
| sent_at | Timestamp | Thời điểm gửi |
| feedback | Enum | positive, negative, neutral |

---

### 5. KnowledgeItem (Mục Tri Thức)

Thông tin trong kho tri thức.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| user_id | UUID | ID người dùng sở hữu |
| title | String | Tiêu đề |
| content | Text | Nội dung chi tiết |
| category | Enum | product, policy, pricing, faq, custom |
| tags | Array | Các tag phân loại |
| embedding | Vector | Vector embedding (1536 chiều) |
| is_active | Boolean | Có đang sử dụng không |
| created_at | Timestamp | Thời điểm tạo |
| updated_at | Timestamp | Cập nhật cuối |

---

### 6. MessageQueue (Hàng Đợi Tin Nhắn)

Theo dõi tin nhắn đang chờ xử lý.

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | UUID | ID duy nhất |
| message_id | UUID | FK → Message |
| priority | Integer | Mức ưu tiên (1-10) |
| status | Enum | queued, processing, completed, failed |
| retry_count | Integer | Số lần thử lại |
| error_message | Text | Thông báo lỗi (nếu có) |
| created_at | Timestamp | Thời điểm thêm vào hàng đợi |
| processed_at | Timestamp | Thời điểm xử lý xong |

---

## Mối Quan Hệ

```
User (1) ──── (N) FacebookAccount
                 │
                 │ (1)
                 ↓
               (N) Conversation
                     │
                     │ (1)
                     ↓
                   (N) Message ←──── (N) MessageQueue
                     │
                     │ (1)
                     ↓
                   (N) AiResponse
                     │
                     │ (0..1)
                     ↓
               KnowledgeItem

User (1) ──── (N) KnowledgeItem
```

---

## Chỉ Mục

- `FacebookAccount.user_id + facebook_user_id`: unique
- `Conversation.account_id + facebook_conversation_id`: unique
- `Message.conversation_id + created_at`: index cho tìm kiếm theo thời gian
- `Message.classification + created_at`: index cho phân loại
- `KnowledgeItem.user_id + category`: index cho tìm kiếm tri thức
- `KnowledgeItem.embedding`: vector index cho semantic search
- `MessageQueue.status + priority`: index cho xử lý hàng đợi

---

## Quy Tắc Xác Thực

- `access_token`: Phải mã hóa trước khi lưu, kiểm tra hết hạn trước khi sử dụng
- `content`: Không được rỗng, độ dài tối đa 10,000 ký tự
- `confidence`: Phải nằm trong khoảng 0-1
- `priority`: Phải từ 1-10
- `FacebookAccount.facebook_user_id`: Mỗi user_id chỉ có thể có một facebook_user_id duy nhất
