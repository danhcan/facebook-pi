# Hợp Đồng API: Quản Lý Tri Thức

**Phiên Bản**: 1.0.0
**Ngày**: 2026-07-18

## GET /api/knowledge

Danh sách mục tri thức.

**Query Parameters**:
- `category`: Lọc theo danh mục (product, policy, pricing, faq, custom)
- `search`: Tìm kiếm theo tiêu đề/nội dung
- `page`: Số trang
- `limit`: Số mục mỗi trang

**Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "category": "pricing",
      "tags": ["giá", "bảng giá"],
      "is_active": true,
      "created_at": "2026-07-18T05:00:00Z",
      "updated_at": "2026-07-18T05:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

---

## POST /api/knowledge

Thêm mục tri thức mới.

**Request**:
```json
{
  "title": "string",
  "content": "string",
  "category": "pricing",
  "tags": ["giá", "bảng giá"]
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "category": "pricing",
  "tags": ["giá", "bảng giá"],
  "is_active": true,
  "created_at": "2026-07-18T05:00:00Z"
}
```

**Lỗi**:
- `400`: Thiếu title hoặc content

---

## GET /api/knowledge/{item_id}

Chi tiết một mục tri thức.

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "category": "pricing",
  "tags": ["giá", "bảng giá"],
  "is_active": true,
  "usage_count": 15,
  "created_at": "2026-07-18T05:00:00Z",
  "updated_at": "2026-07-18T05:00:00Z"
}
```

---

## PUT /api/knowledge/{item_id}

Cập nhật mục tri thức.

**Request**:
```json
{
  "title": "string",
  "content": "string",
  "category": "pricing",
  "tags": ["giá", "bảng giá"]
}
```

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "updated_at": "2026-07-18T06:00:00Z"
}
```

---

## DELETE /api/knowledge/{item_id}

Xóa mục tri thức.

**Response (204 No Content)**

---

## POST /api/knowledge/search

Tìm kiếm tri thức theo ngữ nghĩa.

**Request**:
```json
{
  "query": "string",     // Câu hỏi hoặc từ khóa
  "limit": 5,           // Số kết quả tối đa
  "category": "pricing" // Lọc theo danh mục (tùy chọn)
}
```

**Response (200 OK)**:
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "score": 0.95,
      "category": "pricing"
    }
  ]
}
```
