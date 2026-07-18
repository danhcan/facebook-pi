# Đặc Tính Tính Năng: [TÊN TÍNH NĂNG]

**Nhánh Tính Năng**: `[###-ten-tinh-nang]`

**Ngày Tạo**: [NGÀY]

**Trạng Thái**: Bản nháp

**Đầu Vào**: Mô tả của người dùng: "$ARGUMENTS"

## Kịch Bản Người Dùng & Kiểm Thử *(bắt buộc)*

<!--
  QUAN TRỌNG: Các câu chuyện người dùng nên được ƯU TIÊN theo thứ tự quan trọng.
  Mỗi câu chuyện/kịch bản phải được KIỂM THỬ ĐỘC LẬP - nghĩa là nếu bạn triển khai chỉ MỘT trong số đó,
  bạn vẫn nên có một MVP (Sản Phẩm Khả Thi Tối Thiểu) mang lại giá trị.

  Gán ưu tiên (P1, P2, P3, v.v.) cho mỗi câu chuyện, trong đó P1 là quan trọng nhất.
  Hãy coi mỗi câu chuyện như một lát cắt chức năng độc lập có thể:
  - Được phát triển độc lập
  - Được kiểm thử độc lập
  - Được triển khai độc lập
  - Được giới thiệu cho người dùng độc lập
-->

### Câu Chuyện Người Dùng 1 - [Tiêu Đề Ngắn Gọn] (Ưu Tiên: P1)

[Mô tả kịch bản người dùng này bằng ngôn ngữ đơn giản]

**Tại sao ưu tiên này**: [Giải thích giá trị và tại sao nó có mức ưu tiên này]

**Kiểm Thử Độc Lập**: [Mô tả cách kiểm thử độc lập - ví dụ: "Có thể kiểm thử hoàn toàn bằng [hành động cụ thể] và mang lại [giá trị cụ thể]"]

**Kịch Bản Chấp Nhận**:

1. **Cho** [trạng thái ban đầu], **Khi** [hành động], **Thì** [kết quả mong đợi]
2. **Cho** [trạng thái ban đầu], **Khi** [hành động], **Thì** [kết quả mong đợi]

---

### Câu Chuyện Người Dùng 2 - [Tiêu Đề Ngắn Gọn] (Ưu Tiên: P2)

[Mô tả kịch bản người dùng này bằng ngôn ngữ đơn giản]

**Tại sao ưu tiên này**: [Giải thích giá trị và tại sao nó có mức ưu tiên này]

**Kiểm Thử Độc Lập**: [Mô tả cách kiểm thử độc lập]

**Kịch Bản Chấp Nhận**:

1. **Cho** [trạng thái ban đầu], **Khi** [hành động], **Thì** [kết quả mong đợi]

---

### Câu Chuyện Người Dùng 3 - [Tiêu Đề Ngắn Gọn] (Ưu Tiên: P3)

[Mô tả kịch bản người dùng này bằng ngôn ngữ đơn giản]

**Tại sao ưu tiên này**: [Giải thích giá trị và tại sao nó có mức ưu tiên này]

**Kiểm Thử Độc Lập**: [Mô tả cách kiểm thử độc lập]

**Kịch Bản Chấp Nhận**:

1. **Cho** [trạng thái ban đầu], **Khi** [hành động], **Thì** [kết quả mong đợi]

---

[Thêm câu chuyện người dùng khác nếu cần, mỗi câu có ưu tiên được gán]

### Trường Hợp Ngoại Lệ

<!--
  HÀNH ĐỘNG YÊU CẦU: Nội dung trong phần này là các placeholder.
  Hãy điền đúng các trường hợp ngoại lệ.
-->

- Điều gì xảy ra khi [điều kiện biên]?
- Hệ thống xử lý [kịch bản lỗi] như thế nào?

## Yêu Cầu *(bắt buộc)*

<!--
  HÀNH ĐỘNG YÊU CẦU: Nội dung trong phần này là các placeholder.
  Hãy điền đúng các yêu cầu chức năng.
-->

### Yêu Cầu Chức Năng

- **FR-001**: Hệ thống PHẢI [khả năng cụ thể, ví dụ: "cho phép người dùng tạo tài khoản"]
- **FR-002**: Hệ thống PHẢI [khả năng cụ thể, ví dụ: "xác thực địa chỉ email"]
- **FR-003**: Người dùng PHẢI có thể [tương tác chính, ví dụ: "đặt lại mật khẩu"]
- **FR-004**: Hệ thống PHẢI [yêu cầu dữ liệu, ví dụ: "lưu trữ tùy chọn người dùng"]
- **FR-005**: Hệ thống PHẢI [hành vi, ví dụ: "ghi lại tất cả sự kiện bảo mật"]

*Ví dụ đánh dấu yêu cầu chưa rõ ràng:*

- **FR-006**: Hệ thống PHẢI xác thực người dùng qua [CẦN LÀM RÕ: phương thức xác thực chưa được chỉ định - email/mật khẩu, SSO, OAuth?]
- **FR-007**: Hệ thống PHẢI lưu giữ dữ liệu người dùng trong [CẦN LÀM RÕ: thời gian lưu giữ chưa được chỉ định]

### Thực Thể Chính *(bao gồm nếu tính năng liên quan đến dữ liệu)*

- **[Thực Thể 1]**: [Nó đại diện cho gì, thuộc tính chính không bao gồm triển khai]
- **[Thực Thể 2]**: [Nó đại diện cho gì, mối quan hệ với các thực thể khác]

## Tiêu Chí Thành Công *(bắt buộc)*

<!--
  HÀNH ĐỘNG YÊU CẦU: Định nghĩa tiêu chí thành công có thể đo lường.
  Chúng phải không phụ thuộc vào công nghệ và có thể đo lường.
-->

### Kết Quả Có Thể Đo Lường

- **SC-001**: [Chỉ số có thể đo lường, ví dụ: "Người dùng có thể hoàn tất tạo tài khoản trong vòng 2 phút"]
- **SC-002**: [Chỉ số có thể đo lường, ví dụ: "Hệ thống xử lý 1000 người dùng đồng thời mà không bị giảm hiệu suất"]
- **SC-003**: [Chỉ số hài lòng người dùng, ví dụ: "90% người dùng hoàn thành nhiệm vụ chính trong lần thử đầu tiên"]
- **SC-004**: [Chỉ số kinh doanh, ví dụ: "Giảm 50% yêu cầu hỗ trợ liên quan đến [X]"]

## Giả Định

<!--
  HÀNH ĐỘNG YÊU CẦU: Nội dung trong phần này là các placeholder.
  Hãy điền đúng các giả định dựa trên mặc định hợp lý
  được chọn khi mô tả tính năng không chỉ rõ một số chi tiết.
-->

- [Giả định về người dùng mục tiêu, ví dụ: "Người dùng có kết nối internet ổn định"]
- [Giả định về phạm vi, ví dụ: "Hỗ trợ di động nằm ngoài phạm vi v1"]
- [Giả định về dữ liệu/môi trường, ví例: "Hệ thống xác thực hiện có sẽ được tái sử dụng"]
- [Phụ thuộc vào hệ thống/dịch vụ hiện có, ví dụ: "Yêu cầu truy cập API hồ sơ người dùng hiện có"]
