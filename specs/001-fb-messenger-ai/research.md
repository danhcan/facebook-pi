# Nghiên Cứu: Quản Lý Tin Nhắn Facebook Messenger

**Tính Năng**: `001-fb-messenger-ai`
**Ngày**: 2026-07-18

## Tóm Tắt

Nghiên cứu các quyết định kỹ thuật cần thiết để triển khai ứng dụng quản lý tin nhắn Facebook Messenger với AI auto-reply.

---

## Quyết Định 1: Xác Thực Facebook OAuth

**Quyết Định**: Sử dụng Facebook Login SDK với flow Authorization Code + PKCE

**Lý Do**:
- Facebook yêu cầu bắt buộc sử dụng SDK chính thức hoặc OAuth 2.0 với PKCE
- Flow này an toàn hơn implicit flow và phù hợp cho ứng dụng web
- Hỗ trợ làm mới token tự động

**Các Phương Án Đã Xem Xét**:
| Phương Án | Ưu Điểm | Nhược Điểm |
|-----------|---------|------------|
| Facebook Login SDK | Chính thức, dễ tích hợp | Phụ thuộc SDK của bên thứ 3 |
| OAuth 2.0 + PKCE | linh hoạt, không phụ thuộc SDK | Cần triển khai thủ công |
| Session-based login | Đơn giản | Không an toàn cho API Messenger |

**Kết Luận**: Sử dụng OAuth 2.0 + PKCE để linh hoạt hơn và không phụ thuộc SDK lớn.

---

## Quyết Định 2: Mô Hình AI Cho Phân Loại & Tạo Câu Trả Lời

**Quyết Định**: Sử dụng LLM API (OpenAI/Anthropic) với prompt engineering

**Lý Do**:
- Khả năng phân loại tin nhắn tốt với zero-shot classification
- Tạo câu trả lời tự nhiên, phù hợp ngữ cảnh
- Có thể fine-tune sau nếu cần

**Các Phương Án Đã Xem Xét**:
| Phương Án | Ưu Điểm | Nhược Điểm |
|-----------|---------|------------|
| LLM API (GPT/Claude) | linh hoạt, chất lượng cao | Chi phí API, độ trễ |
| Rule-based matching | Nhanh, miễn phí | Không linh hoạt |
| Traditional ML (BERT) | Chi phí thấp hơn | Cần dữ liệu huấn luyện |

**Kết Luận**: LLM API phù hợp nhất cho MVP. Có thể thêm rule-based cho các câu hỏi đơn giản để giảm chi phí.

---

## Quyết Định 3: Lưu Trữ Dữ Liệu

**Quyết Định**: PostgreSQL cho dữ liệu cấu trúc, Redis cho cache và hàng đợi

**Lý Do**:
- PostgreSQL: ACID, JSONB cho dữ liệu linh hoạt, phù hợp với dữ liệu trò chuyện
- Redis: Hàng đợi tin nhắn, cache token, rate limiting
- Kết hợp này xử lý được yêu cầu 100 tài khoản đồng thời

**Các Phương Án Đã Xem Xét**:
| Phương Án | Ưu Điểm | Nhược Điểm |
|-----------|---------|------------|
| PostgreSQL + Redis | linh hoạt, scalable | Complexity cao hơn |
| MongoDB | Schema linh hoạt | Threading issues, less ACID |
| SQLite | Đơn giản | Không scalable cho 100 tài khoản |

**Kết Luận**: PostgreSQL + Redis là lựa chọn tốt nhất cho yêu cầu về hiệu suất và độ tin cậy.

---

## Quyết Định 4: Kiến Trúc Xử Lý Tin Nhắn

**Quyết Định**: Hàng đợi tin nhắn bất đồng bộ với worker pool

**Lý Do**:
- Xử lý đồng thời nhiều tin nhắn từ nhiều tài khoản
- Tách biệt receiving → processing → responding
- Dễ scale và retry khi có lỗi

**Luồng Xử Lý**:
```
Facebook Webhook → Message Queue → Worker Pool → AI Processing → Response Queue → Send to Facebook
```

---

## Quyết Định 5: Quản lý Tri Thức

**Quyết Định**: Vector embedding + semantic search

**Lý Do**:
- Tìm kiếm ngữ nghĩa chính xác hơn keyword search
- Phù hợp cho việc匹配 câu hỏi với tri thức liên quan
- Có thể scale lên RAG pipeline sau này

**Triển Khai**:
- Embed each knowledge item → vector store
- When processing message: embed message → find top-k similar knowledge items → use as context for LLM

---

## Tổng Hợp

| Lĩnh vực | Quyết Định | Lý Do Chính |
|----------|-----------|-------------|
| Xác thực | OAuth 2.0 + PKCE | An toàn, linh hoạt |
| AI | LLM API | Chất lượng cao, linh hoạt |
| Lưu trữ | PostgreSQL + Redis | ACID, scalable |
| Xử lý | Async queue + workers | Đáng tin cậy, song song |
| Tri thức | Vector embedding | Tìm kiếm ngữ nghĩa |
