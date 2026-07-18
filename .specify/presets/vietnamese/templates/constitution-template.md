# Hiến Pháp [TÊN_DỰ_ÁN]
<!-- Ví dụ: Hiến Pháp Spec, Hiến Pháp TaskFlow, v.v. -->

## Nguyên Tắc Cốt Lõi

### [TÊN_NGUYÊN_TẮC_1]
<!-- Ví dụ: I. Thư Viện Là Đầu Tiên -->
[MÔ_TẢ_NGUYÊN_TẮC_1]
<!-- Ví dụ: Mọi tính năng bắt đầu như một thư viện độc lập; Thư viện phải tự chứa, có thể kiểm thử độc lập, có tài liệu; Yêu cầu mục đích rõ ràng - không có thư viện chỉ tổ chức -->

### [TÊN_NGUYÊN_TẮC_2]
<!-- Ví dụ: II. Giao Diện CLI -->
[MÔ_TẢ_NGUYÊN_TẮC_2]
<!-- Ví dụ: Mọi thư viện hiển thị chức năng qua CLI; Giao thức văn bản vào/ra: stdin/args → stdout, lỗi → stderr; Hỗ trợ định dạng JSON + có thể đọc bởi người -->

### [TÊN_NGUYÊN_TẮC_3]
<!-- Ví dụ: III. Kiểm Thử Trước (KHÔNG THỂ ĐàM PHÁN) -->
[MÔ_TẢ_NGUYÊN_TẮC_3]
<!-- Ví dụ: TDD bắt buộc: Viết kiểm thử → Người dùng duyệt → Kiểm thử thất bại → Sau đó triển khai; Chu kỳ Đỏ-Xanh-Tái Cấu Trúc được thực thi nghiêm ngặt -->

### [TÊN_NGUYÊN_TẮC_4]
<!-- Ví dụ: IV. Kiểm Thử Tích Hợp -->
[MÔ_TẢ_NGUYÊN_TẮC_4]
<!-- Ví dụ: Vùng tập trung yêu cầu kiểm thử tích hợp: Kiểm thử hợp đồng thư viện mới, Thay đổi hợp đồng, Giao tiếp liên dịch vụ, Schema chung -->

### [TÊN_NGUYÊN_TẮC_5]
<!-- Ví dụ: V. Khả Quan Sat, VI. Phiên Bản & Thay Đổi Breaking, VII. Đơn Giản Hóa -->
[MÔ_TẢ_NGUYÊN_TẮC_5]
<!-- Ví dụ: I/O văn bản đảm bảo khả năng gỡ lỗi; Yêu cầu ghi nhật ký có cấu trúc; Hoặc: Định dạng MAJOR.MINOR.BUILD; Hoặc: Bắt đầu đơn giản, nguyên tắc YAGNI -->

## [TÊN_PHẦN_2]
<!-- Ví dụ: Hạn Chế Bổ Sung, Yêu Cầu Bảo Mật, Tiêu Chuệu Hiệu Suất, v.v. -->

[NỘI_DUNG_PHẦN_2]
<!-- Ví dụ: Yêu cầu ngăn xếp công nghệ, tiêu chuẩn tuân thủ, chính sách triển khai, v.v. -->

## [TÊN_PHẦN_3]
<!-- Ví dụ: Quy Trình Phát Triển, Quy Trình Duyệt, Cổng Chất Lượng, v.v. -->

[NỘI_DUNG_PHẦN_3]
<!-- Ví dụ: Yêu cầu kiểm tra mã, cổng kiểm thử, quy trình phê duyệt triển khai, v.v. -->

## Quản Trị
<!-- Ví dụ: Hiến pháp có ưu tiên hơn tất cả các thực hành khác; Sửa đổi yêu cầu tài liệu, phê duyệt, kế hoạch di chuyển -->

[QUY_TẮC_QUẢN_TRỊ]
<!-- Ví dụ: Tất cả PR/kiểm tra phải xác nhận tuân thủ; Độ phức tạp phải được biện minh; Sử dụng [TỆP_HƯỚNG_DẪN] để hướng dẫn phát triển thời gian chạy -->

**Phiên Bản**: [PHIÊN_BẢN_HIẾN_PHÁP] | **Ban Hành**: [NGÀY_BAN_HÀNH] | **Sửa Đổi Lần Cuối**: [NGÀY_SỬAĐỔI_CUỐI]
<!-- Ví dụ: Phiên Bản: 2.1.1 | Ban Hành: 2025-06-13 | Sửa Đổi Lần Cuối: 2025-07-16 -->
