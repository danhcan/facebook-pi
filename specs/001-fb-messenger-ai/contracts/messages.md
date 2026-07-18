# Hợp Đồng API: Quản Lý Tin Nhắn & Trả Lời

**Phiên Bản**: 1.0.0
**Ngày**: 2026-07-18

## GET /api/conversations

Danh sách cuộc trò chuyện.

**Query Parameters**:
- `account_id`: Lọc theo tài khoản Facebook
- `status`: active, archived
- `page`: Số trang (mặc định: 1)
- `limit`: Số mục mỗi trang (mặc định: 20, tối đa: 100)

**Response (200 OK)**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "participant_name": "string",
      "status": "active",
      "auto_reply_mode": "automatic",
      "last_message": {
        "content": "string",
        "direction": "inbound",
        "created_at": "2026-07-18T05:30:00Z"
      },
      "message_count": 15,
      "created_at": "2026-07-18T05:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

## GET /api/conversations/{conversation_id}/messages

Lịch sử tin nhắn trong cuộc trò chuyện.

**Query Parameters**:
- `before`: UUID tin nhắn trước đó (để phân trang)
- `limit`: Số tin nhắn (mặc định: 50, tối đa: 200)

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "direction": "inbound",
      "content": "string",
      "message_type": "text",
      "classification": "pricing",
      "status": "sent",
      "created_at": "2026-07-18T05:30:00Z"
    }
  ],
  "has_more": true
}
```

---

## POST /api/conversations/{conversation_id}/reply

Gửi tin nhắn trả lời (thủ công).

**Request**:
```json
{
  "content": "string"  // Nội dung tin nhắn
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "direction": "outbound",
  "content": "string",
  "status": "sent",
  "sent_at": "2026-07-18T05:35:00Z"
}
```

---

## PUT /api/conversations/{conversation_id}/settings

Cài đặt chế độ trả lời tự động.

**Request**:
```json
{
  "auto_reply_mode": "automatic"  // automatic, manual, mixed
}
```

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "auto_reply_mode": "automatic"
}
```

---

## POST /api/ai-responses/{response_id}/approve

Duyệt câu trả lời AI và gửi.

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "status": "sent",
  "sent_at": "2026-07-18T05:40:00Z"
}
```

---

## PUT /api/ai-responses/{response_id}

Chỉnh sửa câu trả lời AI trước khi gửi.

**Request**:
```json
{
  "content": "string"  // Nội dung chỉnh sửa
}
```

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "content": "string",
  "status": "pending"
}
```

---

## DELETE /api/ai-responses/{response_id}

Từ chối câu trả lời AI.

**Response (204 No Content)**
