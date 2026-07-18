# Kế Hoạch Triển Khai: [TÍNH NĂNG]

**Nhánh**: `[###-ten-tinh-nang]` | **Ngày**: [NGÀY] | **Đặc Tả**: [liên kết]

**Đầu Vào**: Đặc tả tính năng từ `/specs/[###-ten-tinh-nang]/spec.md`

**Lưu Ý**: Mẫu này được điền bởi lệnh `__SPECKIT_COMMAND_PLAN__`; định nghĩa mô tả quy trình thực thi.

## Tóm Tắt

[Rút gọn từ đặc tả tính năng: yêu cầu chính + cách tiếp cận kỹ thuật từ nghiên cứu]

## Bối Cảnh Kỹ Thuật

<!--
  HÀNH ĐỘNG YÊU CẦU: Thay nội dung phần này bằng các chi tiết kỹ thuật
  cho dự án. Cấu trúc ở đây được trình bày dưới dạng tư vấn để hướng dẫn
  quá trình lặp lại.
-->

**Ngôn ngữ/Phiên Bản**: [ví dụ: Python 3.11, Swift 5.9, Rust 1.75 hoặc CẦN LÀM RÕ]

**Phụ Thuộc Chính**: [ví dụ: FastAPI, UIKit, LLVM hoặc CẦN LÀM RÕ]

**Lưu Trữ**: [nếu áp dụng, ví dụ: PostgreSQL, CoreData, tệp tin hoặc N/A]

**Kiểm Thử**: [ví dụ: pytest, XCTest, cargo test hoặc CẦN LÀM RÕ]

**Nền Tảng Mục Tiêu**: [ví dụ: Linux server, iOS 15+, WASM hoặc CẦN LÀM RÕ]

**Loại Dự Án**: [ví dụ: library/cli/web-service/mobile-app/compiler/desktop-app hoặc CẦN LÀM RÕ]

**Mục Tiêu Hiệu Suất**: [theo lĩnh vực, ví dụ: 1000 req/s, 10k dòng/giây, 60 fps hoặc CẦN LÀM RÕ]

**Hạn Chế**: [theo lĩnh vực, ví dụ: <200ms p95, <100MB bộ nhớ, có thể hoạt động ngoại tuyến hoặc CẦN LÀM RÕ]

**Quy Mô/Phạm Vi**: [theo lĩnh vực, ví dụ: 10k người dùng, 1M LOC, 50 màn hình hoặc CẦN LÀM RÕ]

## Kiểm Tra Hiến Pháp

*CỔNG: Phải vượt qua trước Nghiên Cứu Giai Đoạn 0. Kiểm tra lại sau Thiết Kế Giai Đoạn 1.*

[Cổng được xác định dựa trên tệp hiến pháp]

## Cấu Trúc Dự Án

### Tài Liệu (tính năng này)

```text
specs/[###-tinh-nang]/
├── plan.md              # Tệp này (đầu ra lệnh __SPECKIT_COMMAND_PLAN__)
├── research.md          # Đầu ra Giai Đoạn 0 (lệnh __SPECKIT_COMMAND_PLAN__)
├── data-model.md        # Đầu ra Giai Đoạn 1 (lệnh __SPECKIT_COMMAND_PLAN__)
├── quickstart.md        # Đầu ra Giai Đoạn 1 (lệnh __SPECKIT_COMMAND_PLAN__)
├── contracts/           # Đầu ra Giai Đoạn 1 (lệnh __SPECKIT_COMMAND_PLAN__)
└── tasks.md             # Đầu ra Giai Đoạn 2 (lệnh __SPECKIT_COMMAND_TASKS__ - KHÔNG được tạo bởi __SPECKIT_COMMAND_PLAN__)
```

### Mã Nguồn (gốc kho)

<!--
  HÀNH ĐỘNG YÊU CẦU: Thay cây placeholder bên dưới bằng bố cục
  cụ thể cho tính năng này. Xóa các tùy chọn không sử dụng và mở rộng
  cấu trúc đã chọn với đường dẫn thực (ví dụ: apps/admin, packages/something).
  Kế hoạch deliver không được bao gồm các nhãn Tùy Chọn.
-->

```text
# [XÓA NẾU KHÔNG SỬ DỤNG] Tùy Chọn 1: Dự án đơn (MẶC ĐỊNH)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [XÓA NẾU KHÔNG SỬ DỤNG] Tùy Chọn 2: Ứng dụng web (khi phát hiện "frontend" + "backend")
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [XÓA NẾU KHÔNG SỬ DỤNG] Tùy Chọn 3: Di động + API (khi phát hiện "iOS/Android")
api/
└── [giống backend ở trên]

ios/ or android/
└── [cấu trúc theo nền tảng: module tính năng, luồng UI, kiểm thử nền tảng]
```

**Quyết Định Cấu Trúc**: [Ghi lại cấu trúc đã chọn và tham chiếu các thư mục thực]
đã chụp ở trên]

## Theo Dõi Độ Phức Tạp

> **ĐIỀN CHỈ KHI Kiểm Tra Hiến Pháp có vi phạm cần biện minh**

| Vi Phạm | Tại Sao Cần | Phương Án Đơn Giản Hơn Bị Từ Chór Bởi |
|---------|------------|----------------------------------------|
| [ví dụ: dự án thứ 4] | [nhu cầu hiện tại] | [tại sao 3 dự án không đủ] |
| [ví dụ: Mẫu Repository] | [vấn đề cụ thể] | [tại sao truy cập DB trực tiếp không đủ] |
