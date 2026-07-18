---
description: "Mẫu danh sách nhiệm vụ cho triển khai tính năng"
---

# Nhiệm Vụ: [TÊN TÍNH NĂNG]

**Đầu Vào**: Tài liệu thiết kế từ `/specs/[###-ten-tinh-nang]/`

**Điều Kiện Tiên Quyết**: plan.md (bắt buộc), spec.md (bắt buộc cho câu chuyện người dùng), research.md, data-model.md, contracts/

**Kiểm Thử**: Các ví dụ bên dưới bao gồm nhiệm vụ kiểm thử. Kiểm thử là TÙY CHỈN - chỉ bao gồm nếu được yêu cầu rõ ràng trong đặc tả tính năng.

**Tổ Chức**: Nhiệm vụ được nhóm theo câu chuyện người dùng để cho phép triển khai và kiểm thử độc lập mỗi câu chuyện.

## Định Dạng: `[ID] [P?] [Câu Chuyện] Mô Tả`

- **[P]**: Có thể chạy song song (tệp khác nhau, không phụ thuộc)
- **[Câu Chuyện]**: Nhiệm vụ này thuộc câu chuyện người dùng nào (ví dụ: US1, US2, US3)
- Bao gồm đường dẫn tệp chính xác trong mô tả

## Quy Ước Đường Dẫn

- **Dự án đơn**: `src/`, `tests/` tại gốc kho
- **Ứng dụng web**: `backend/src/`, `frontend/src/`
- **Di động**: `api/src/`, `ios/src/` hoặc `android/src/`
- Đường dẫn bên dưới giả định dự án đơn - điều chỉnh theo cấu trúc plan.md

<!--
  ============================================================================
  QUAN TRỌNG: Các nhiệm vụ bên dưới là NHIỆM VỤ MẪU chỉ để minh họa.

  Lệnh __SPECKIT_COMMAND_TASKS__ PHẢI thay thế chúng bằng nhiệm vụ thực dựa trên:
  - Câu chuyện người dùng từ spec.md (với ưu tiên P1, P2, P3...)
  - Yêu cầu tính năng từ plan.md
  - Thực thể từ data-model.md
  - Endpoints từ contracts/

  Nhiệm vụ PHẢI được tổ chức theo câu chuyện người dùng để mỗi câu chuyện có thể:
  - Được triển khai độc lập
  - Được kiểm thử độc lập
  - Được giao MVP từng phần

  ĐỪNG giữ các nhiệm vụ mẫu này trong tệp tasks.md được tạo.
  ============================================================================
-->

## Giai Đoạn 1: Thiết Lập (Hạ Tầng Chung)

**Mục Đích**: Khởi tạo dự án và cấu trúc cơ bản

- [ ] T001 Tạo cấu trúc dự án theo kế hoạch triển khai
- [ ] T002 Khởi tạo dự án [ngôn ngữ] với phụ thuộc [framework]
- [ ] T003 [P] Cấu hình công cụ kiểm tra mã và định dạng

---

## Giai Đoạn 2: Cơ Sở (Điều Kiện Tiên Quyết Chặn)

**Mục Đích**: Hạ tầng cốt lõi PHẢI hoàn thành trước khi BẤT KỲ câu chuyện người dùng nào có thể được triển khai

**⚠️ QUAN TRỌNG**: Không thể bắt đầu làm câu chuyện người dùng cho đến khi giai đoạn này hoàn thành

Ví dụ về nhiệm vụ cơ sở (điều chỉnh theo dự án của bạn):

- [ ] T004 Thiết lập lược đồ cơ sở dữ liệu và khuôn khổ di chuyển
- [ ] T005 [P] Triển khai khuôn khổ xác thực/ủy quyền
- [ ] T006 [P] Thiết lập định tuyến API và cấu trúc middleware
- [ ] T007 Tạo mô hình/thực thể cơ bản mà tất cả câu chuyện phụ thuộc vào
- [ ] T008 Cấu hình xử lý lỗi và hạ tầng ghi nhật ký
- [ ] T009 Thiết lập quản lý cấu hình môi trường

**Điểm Kiểm Tra**: Hạ tầng sẵn sàng - triển khai câu chuyện người dùng có thể bắt đầu song song

---

## Giai Đoạn 3: Câu Chuyện Người Dùng 1 - [Tiêu Đề] (Ưu Tiên: P1) 🎯 MVP

**Mục Tiêu**: [Mô tả ngắn gọn những gì câu chuyện này mang lại]

**Kiểm Thử Độc Lập**: [Cách xác nhận câu chuyện này hoạt động độc lập]

### Kiểm Thử Cho Câu Chuyện Người Dùng 1 (TÙY CHỈN - chỉ nếu yêu cầu kiểm thử) ⚠️

> **LƯU Ý: Viết các kiểm thử này TRƯỚC, đảm bảo chúng THẤT BẠI trước khi triển khai**

- [ ] T010 [P] [US1] Kiểm thử hợp đồng cho [endpoint] trong tests/contract/test_[ten].py
- [ ] T011 [P] [US1] Kiểm thử tích hợp cho [kịch bản người dùng] trong tests/integration/test_[ten].py

### Triển Khai Cho Câu Chuyện Người Dùng 1

- [ ] T012 [P] [US1] Tạo mô hình [ThucThe1] trong src/models/[thucthe1].py
- [ ] T013 [P] [US1] Tạo mô hình [ThucThe2] trong src/models/[thucthe2].py
- [ ] T014 [US1] Triển khai [DichVu] trong src/services/[dichvu].py (phụ thuộc T012, T013)
- [ ] T015 [US1] Triển khai [endpoint/tinh nang] trong src/[vi tri]/[tep].py
- [ ] T016 [US1] Thêm xác thực và xử lý lỗi
- [ ] T017 [US1] Thêm ghi nhật ký cho các hoạt động câu chuyện người dùng 1

**Điểm Kiểm Tra**: Tại thời điểm này, Câu Chuyện Người Dùng 1 phải hoạt động đầy đủ và có thể kiểm thử độc lập

---

## Giai Đoạn 4: Câu Chuyện Người Dùng 2 - [Tiêu Đề] (Ưu Tiên: P2)

**Mục Tiêu**: [Mô tả ngắn gọn những gì câu chuyện này mang lại]

**Kiểm Thử Độc Lập**: [Cách xác nhận câu chuyện này hoạt động độc lập]

### Kiểm Thử Cho Câu Chuyện Người Dùng 2 (TÙY CHỈN - chỉ nếu yêu cầu kiểm thử) ⚠️

- [ ] T018 [P] [US2] Kiểm thử hợp đồng cho [endpoint] trong tests/contract/test_[ten].py
- [ ] T019 [P] [US2] Kiểm thử tích hợp cho [kịch bản người dùng] trong tests/integration/test_[ten].py

### Triển Khai Cho Câu Chuyện Người Dùng 2

- [ ] T020 [P] [US2] Tạo mô hình [ThucThe] trong src/models/[thucthe].py
- [ ] T021 [US2] Triển khai [DichVu] trong src/services/[dichvu].py
- [ ] T022 [US2] Triển khai [endpoint/tinh nang] trong src/[vi tri]/[tep].py
- [ ] T023 [US2] Tích hợp với các thành phần Câu Chuyện Người Dùng 1 (nếu cần)

**Điểm Kiểm Tra**: Tại thời điểm này, Câu Chuyện Người Dùng 1 VÀ 2 phải hoạt động độc lập

---

## Giai Đoạn 5: Câu Chuyện Người Dùng 3 - [Tiêu Đề] (Ưu Tiên: P3)

**Mục Tiêu**: [Mô tả ngắn gọn những gì câu chuyện này mang lại]

**Kiểm Thử Độc Lập**: [Cách xác nhận câu chuyện này hoạt động độc lập]

### Kiểm Thử Cho Câu Chuyện Người Dùng 3 (TÙY CHỈN - chỉ nếu yêu cầu kiểm thử) ⚠️

- [ ] T024 [P] [US3] Kiểm thử hợp đồng cho [endpoint] trong tests/contract/test_[ten].py
- [ ] T025 [P] [US3] Kiểm thử tích hợp cho [kịch bản người dùng] trong tests/integration/test_[ten].py

### Triển Khai Cho Câu Chuyện Người Dùng 3

- [ ] T026 [P] [US3] Tạo mô hình [ThucThe] trong src/models/[thucthe].py
- [ ] T027 [US3] Triển khai [DichVu] trong src/services/[dichvu].py
- [ ] T028 [US3] Triển khai [endpoint/tinh nang] trong src/[vi tri]/[tep].py

**Điểm Kiểm Tra**: Tất cả câu chuyện người dùng phải hoạt động độc lập

---

[Thêm giai đoạn câu chuyện người dùng khác nếu cần, theo cùng mẫu]

---

## Giai Đoạn N: Hoàn Chỉnh & Các Vấn Đề Đa Chiều

**Mục Đích**: Cải thiện ảnh hưởng đến nhiều câu chuyện người dùng

- [ ] TXXX [P] Cập nhật tài liệu trong docs/
- [ ] TXXX Dọn dẹp mã và tái cấu trúc
- [ ] TXXX Tối ưu hóa hiệu suất cho tất cả câu chuyện
- [ ] TXXX [P] Kiểm thử đơn vị bổ sung (nếu yêu cầu) trong tests/unit/
- [ ] TXXX Tăng cường bảo mật
- [ ] TXXX Chạy xác nhận quickstart.md

---

## Phụ Thuộc & Thứ Tự Thực Thi

### Phụ Thuộc Giai Đoạn

- **Thiết Lập (Giai Đoạn 1)**: Không phụ thuộc - có thể bắt đầu ngay
- **Cơ Sở (Giai Đoạn 2)**: Phụ thuộc vào Thiết Lập - CHẶN tất cả câu chuyện người dùng
- **Câu Chuyện Người Dùng (Giai Đoạn 3+)**: Tất cả phụ thuộc vào Cơ Sở hoàn thành
  - Câu chuyện người dùng có thể tiến hành song song (nếu có nhân sự)
  - Hoặc tuần tự theo thứ tự ưu tiên (P1 → P2 → P3)
- **Hoàn Chỉnh (Giai Đoạn Cuối)**: Phụ thuộc vào tất cả câu chuyện người dùng mong muốn hoàn thành

### Phụ Thuộc Câu Chuyện Người Dùng

- **Câu Chuyện Người Dùng 1 (P1)**: Có thể bắt đầu sau Cơ Sở (Giai Đoạn 2) - Không phụ thuộc câu chuyện khác
- **Câu Chuyện Người Dùng 2 (P2)**: Có thể bắt đầu sau Cơ Sở (Giai Đoạn 2) - Có thể tích hợp US1 nhưng phải kiểm thử độc lập
- **Câu Chuyện Người Dùng 3 (P3)**: Có thể bắt đầu sau Cơ Sở (Giai Đoạn 2) - Có thể tích hợp US1/US2 nhưng phải kiểm thử độc lập

### Bên Trong Mỗi Câu Chuyện Người Dùng

- Kiểm thử (nếu bao gồm) PHẢI được viết và THẤT BẠI trước khi triển khai
- Mô hình trước dịch vụ
- Dịch vụ trước endpoints
- Triển khai cốt lõi trước tích hợp
- Câu chuyện hoàn thành trước khi chuyển sang ưu tiên tiếp theo

### Cơ Hội Song Song

- Tất cả nhiệm vụ Thiết Lập đánh dấu [P] có thể chạy song song
- Tất cả nhiệm vụ Cơ Sở đánh dấu [P] có thể chạy song song (trong Giai Đoạn 2)
- Sau khi Cơ Sở hoàn thành, tất cả câu chuyện người dùng có thể bắt đầu song song (nếu đội ngũ cho phép)
- Tất cả kiểm thử cho câu chuyện người dùng đánh dấu [P] có thể chạy song song
- Mô hình trong câu chuyện đánh dấu [P] có thể chạy song song
- Các câu chuyện người dùng khác nhau có thể được thực hiện song song bởi các thành viên khác nhau

---

## Ví Dụ Song Song: Câu Chuyện Người Dùng 1

```bash
# Chạy tất cả kiểm thử cho Câu Chuyện Người Dùng 1 cùng lúc (nếu yêu cầu kiểm thử):
Nhiệm vụ: "Kiểm thử hợp đồng cho [endpoint] trong tests/contract/test_[ten].py"
Nhiệm vụ: "Kiểm thử tích hợp cho [kịch bản người dùng] trong tests/integration/test_[ten].py"

# Chạy tất cả mô hình cho Câu Chuyện Người Dùng 1 cùng lúc:
Nhiệm vụ: "Tạo mô hình [ThucThe1] trong src/models/[thucthe1].py"
Nhiệm vụ: "Tạo mô hình [ThucThe2] trong src/models/[thucthe2].py"
```

---

## Chiến Lược Triển Khai

### MVP Đầu Tiên (Chỉ Câu Chuyện Người Dùng 1)

1. Hoàn thành Giai Đoạn 1: Thiết Lập
2. Hoàn thành Giai Đoạn 2: Cơ Sở (QUAN TRỌNG - chặn tất cả câu chuyện)
3. Hoàn thành Giai Đoạn 3: Câu Chuyện Người Dùng 1
4. **DỪNG LẠI VÀ XÁC NHẬN**: Kiểm thử Câu Chuyện Người Dùng 1 độc lập
5. Triển khai/trình diễn nếu sẵn sàng

### Giao Hàng Từng Phần

1. Hoàn thành Thiết Lập + Cơ Sở → Hạ tầng sẵn sàng
2. Thêm Câu Chuyện Người Dùng 1 → Kiểm thử độc lập → Triển khai/Trình diễn (MVP!)
3. Thêm Câu Chuyện Người Dùng 2 → Kiểm thử độc lập → Triển khai/Trình diễn
4. Thêm Câu Chuyện Người Dùng 3 → Kiểm thử độc lập → Triển khai/Trình diễn
5. Mỗi câu chuyện mang lại giá trị mà không phá vỡ câu chuyện trước

### Chiến Lược Đội Ngũ Song Song

Với nhiều nhà phát triển:

1. Đội hoàn thành Thiết Lập + Cơ Sở cùng nhau
2. Sau khi Cơ Sở xong:
   - Nhà Phát Triển A: Câu Chuyện Người Dùng 1
   - Nhà Phát Triển B: Câu Chuyện Người Dùng 2
   - Nhà Phát Triển C: Câu Chuyện Người Dùng 3
3. Các câu chuyện hoàn thành và tích hợp độc lập

---

## Ghi Chú

- Nhiệm vụ [P] = tệp khác nhau, không phụ thuộc
- Nhãn [Câu Chuyện] gắn nhiệm vụ với câu chuyện người dùng cụ thể để truy xuất nguồn gốc
- Mỗi câu chuyện người dùng phải có thể hoàn thành và kiểm thử độc lập
- Xác nhận kiểm thử thất bại trước khi triển khai
- Commit sau mỗi nhiệm vụ hoặc nhóm logic
- Dừng lại tại bất kỳ điểm kiểm tra nào để xác nhận câu chuyện độc lập
- Tránh: nhiệm vụ mờ nhạt, xung đột tệp giống nhau, phụ thuộc đa câu chuyện phá vỡ tính độc lập
