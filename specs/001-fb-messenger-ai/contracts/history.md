# Hợp Đồng API: Lịch Sử & Tìm Kiếm

**Phiên Bản**: 1.0.0
**Ngày**: 2026-07-18

## GET /api/history

Lịch sử trò chuyện toàn hệ thống.

**Query Parameters**:
- `account_id`: Lọc theo tài khoản
- `conversation_id`: Lọc theo cuộc trò chuyện
- `from`: Thời gian bắt đầu (ISO 8601)
- `to`: Thời gian kết thúc (ISO 8601)
- `direction`: inbound, outbound
- `classification`: pricing, complaint, support, general
- `search`: Tìm kiếm theo nội dung
- `page`: Số trang
- `limit`: Số tin nhắn mỗi trang

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "participant_name": "string",
      "direction": "inbound",
      "content": "string",
      "classification": "pricing",
      "ai_response": {
        "id": "uuid",
        "content": "string",
        "status": "sent"
      },
      "created_at": "2026-07-18T05:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 50
}
```

---

## GET /api/history/export

Xuất dữ liệu lịch sử.

**Query Parameters**:
- `format`: csv, json, xlsx
- `from`: Thời gian bắt đầu
- `to`: Thời gian kết thúc
- `account_id`: Lọc theo tài khoản

**Response**:
- `202 Accepted`: Đang xử lý, trả về job_id
- `413`: Dữ liệu quá lớn (>10MB), sẽ được chia nhỏ

```json
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 30
}
```

---

## GET /api/history/export/{job_id}

Kiểm tra trạng thái xuất dữ liệu.

**Response (200 OK)**:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "download_url": "string",
  "expires_at": "2026-07-18T06:00:00Z",
  "file_size_bytes": 1024000
}
```

**Status Values**:
- `processing`: Đang xử lý
- `completed`: Hoàn thành, có link tải
- `failed`: Lỗi

---

## GET /api/stats

Thống kê sử dụng.

**Query Parameters**:
- `account_id`: Lọc theo tài khoản
- `from`: Thời gian bắt đầu
- `to`: Thời gian kết thúc

**Response (200 OK)**:
```json
{
  "total_messages": 1500,
  "inbound_messages": 800,
  "outbound_messages": 700,
  "ai_responses": 600,
  "auto_sent": 400,
  "manual_sent": 200,
  "by_classification": {
    "pricing": 300,
    "complaint": 150,
    "support": 250,
    "general": 100
  },
  "avg_response_time_seconds": 25
}
```

---

## Webhook: Facebook Messenger Event

Nhận sự kiện tin nhắn từ Facebook.

**Endpoint**: `POST /webhook/facebook`

**Request**:
```json
{
  "object": "page",
  "entry": [
    {
      "id": "page_id",
      "time": 1234567890,
      "messaging": [
        {
          "sender": {"id": "user_id"},
          "recipient": {"id": "page_id"},
          "timestamp": 1234567890,
          "message": {
            "mid": "message_id",
            "text": "Hello"
          }
        }
      ]
    }
  ]
}
```

**Response**: `200 OK` (luôn trả 200 để Facebook không gửi lại)

**Xử lý**:
1. Verify webhook signature
2. Extract message details
3. Add to processing queue
4. Return 200 immediately
