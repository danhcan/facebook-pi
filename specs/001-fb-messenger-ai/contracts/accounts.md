# Hợp Đồng API: Quản Lý Tài Khoản Facebook

**Phiên Bản**: 1.0.0
**Ngày**: 2026-07-18

## POST /api/accounts/connect

Kết nối tài khoản Facebook mới.

**Request**:
```json
{
  "code": "string",           // Authorization code từ Facebook OAuth
  "redirect_uri": "string"    // URI đã đăng ký
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "facebook_user_id": "string",
  "display_name": "string",
  "status": "active",
  "connected_at": "2026-07-18T05:00:00Z"
}
```

**Lỗi**:
- `400`: Thiếu code hoặc redirect_uri
- `409`: Tài khoản đã được kết nối
- `502`: Lỗi từ Facebook API

---

## GET /api/accounts

Danh sách tài khoản đã kết nối.

**Query Parameters**:
- `status`: Lọc theo trạng thái (active, expired, disconnected)

**Response (200 OK)**:
```json
{
  "accounts": [
    {
      "id": "uuid",
      "facebook_user_id": "string",
      "display_name": "string",
      "status": "active",
      "connected_at": "2026-07-18T05:00:00Z",
      "last_sync_at": "2026-07-18T05:30:00Z"
    }
  ]
}
```

---

## DELETE /api/accounts/{account_id}

Ngắt kết nối tài khoản Facebook.

**Response (204 No Content)**

**Lỗi**:
- `404`: Không tìm thấy tài khoản

---

## POST /api/accounts/{account_id}/refresh

Làm mới token truy cập.

**Response (200 OK)**:
```json
{
  "status": "active",
  "token_expires_at": "2026-07-19T05:00:00Z"
}
```

**Lỗi**:
- `404`: Không tìm thấy tài khoản
- `502`: Không thể làm mới token từ Facebook
