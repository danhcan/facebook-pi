# Đặc Tính Tính Năng: Chatbot CSKH Facebook

**Nhánh Tính Năng**: `001-cskh-facebook-chatbot`

**Ngày Tạo**: 2026-07-18

**Trạng Thái**: Bản nháp

**Đầu Vào**: Mô tả của người dùng: "tao web de cskh ho tro ket noi facebook .tra loi bang LLM mien phi ."

## Kịch Bản Người Dùng & Kiểm Thử *(bắt buộc)*

### Câu Chuyện Người Dùng 1 - Kết nối Facebook Page (Ưu Tiên: P1)

Người quản trị trang web CSKH đăng nhập và kết nối tài khoản Facebook Page của doanh nghiệp với hệ thống. Hệ thống yêu cầu quyền truy cập các tin nhắn Messenger trên Page và lưu trữ thông tin xác thực để duy trì kết nối liên tục.

**Tại sao ưu tiên này**: Không thể có chatbot CSKH nếu không kết nối được với Facebook Page. Đây là tiền đề cho mọi chức năng khác.

**Kiểm Thử Độc Lập**: Có thể kiểm thử hoàn toàn bằng cách tạo một Facebook Page test, kết nối với hệ thống, và xác nhận rằng hệ thống nhận được tin nhắn từ Page đó.

**Kịch Bản Chấp Nhận**:

1. **Cho** người quản trị chưa kết nối Facebook Page, **Khi** nhấn nút "Kết nối Facebook", **Thì** hệ thống hiển thị trang xác thực Facebook
2. **Cho** người quản trị đã xác thực Facebook thành công, **Khi** chọn Page cần kết nối, **Thì** hệ thống lưu trữ thông tin Page và hiển thị trạng thái "Đã kết nối"
3. **Cho** kết nối Facebook đã hết hạn, **Khi** có tin nhắn mới đến, **Thì** hệ thống thông báo cho quản trị cần kết nối lại

---

### Câu Chuyện Người Dùng 2 - Trả lời tự động bằng AI (Ưu Tiên: P1)

Khi khách hàng gửi tin nhắn Messenger đến Facebook Page, hệ thống tự động trả lời bằng AI dựa trên tri thức đã được cấu hình. Câu trả lời được tạo bởi mô hình ngôn ngữ miễn phí và gửi về cho khách hàng trong thời gian ngắn.

**Tại sao ưu tiên này**: Đây là cốt lõi của tính năng — giảm tải cho nhân viên CSKH bằng cách tự động trả lời câu hỏi phổ biến.

**Kiểm Thử Độc Lập**: Có thể kiểm thử bằng cách gửi tin nhắn test đến Page đã kết nối và xác nhận nhận được câu trả lời tự động từ hệ thống.

**Kịch Bản Chấp nhận**:

1. **Cho** khách hàng gửi câu hỏi "Giờ mở cửa là mấy giờ?", **Khi** hệ thống nhận tin nhắn, **Thì** trả lời tự động với thông tin giờ mở cửa từ tri thức đã cấu hình
2. **Cho** khách hàng gửi câu hỏi ngoài phạm vi tri thức, **Khi** hệ thống không tìm thấy câu trả lời phù hợp, **Thì** trả lời "Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất có thể"
3. **Cho** hệ thống đang xử lý tin nhắn, **Khi** cùng khách hàng gửi tin nhắn thứ hai, **Thì** hệ thống chờ xử lý tin nhắn trước đó hoàn tất trước khi trả lời tin nhắn mới

---

### Câu Chuyện Người Dùng 3 - Quản lý tri thức CSKH (Ưu Tiên: P2)

Người quản trị có thể thêm, chỉnh sửa và xóa các câu trả lời mẫu, thông tin thường gặp (FAQ) mà AI sẽ sử dụng làm cơ sở để trả lời khách hàng. Các tri thức này được tổ chức theo danh mục để dễ quản lý.

**Tại sao ưu tiên này**: Chất lượng câu trả lời AI phụ thuộc trực tiếp vào chất lượng tri thức được cung cấp. Quản trị cần công cụ để duy trì tri thức luôn cập nhật.

**Kiểm Thử Độc Lập**: Có thể kiểm thử bằng cách thêm một câu trả lời mới, sau đó gửi tin nhắn test liên quan và xác nhận AI sử dụng thông tin mới để trả lời.

**Kịch Bản Chấp Nhận**:

1. **Cho** người quản trị muốn thêm tri thức mới, **Khi** điền tiêu đề và nội dung câu trả lời, **Thì** hệ thống lưu trữ và hiển thị trong danh sách tri thức
2. **Cho** có tri thức đã lưu, **Khi** người quản trị chỉnh sửa nội dung, **Thì** bản cập nhật có hiệu lực cho các tin nhắn tiếp theo
3. **Cho** có tri thức không còn cần thiết, **Khi** người quản trị xóa, **Thì** hệ thống ngừng sử dụng tri thức đó để trả lời

---

### Câu Chuyện Người Dùng 4 - Xem lịch sử trò chuyện (Ưu Tiên: P2)

Người quản trị có thể xem toàn bộ lịch sử trò chuyện giữa AI và khách hàng, bao gồm tin nhắn gốc của khách hàng và câu trả lời tự động. Quản trị có thể theo dõi chất lượng dịch vụ và can thiệp thủ công nếu cần.

**Tại sao ưu tiên này**: Giúp quản trị đánh giá hiệu quả của chatbot và phát hiện các vấn đề cần can thiệp.

**Kiểm Thử Độc Lập**: Có thể kiểm thử bằng cách gửi một số tin nhắn test, sau đó mở trang lịch sử và xác nhận tất cả tin nhắn hiển thị đầy đủ.

**Kịch Bản Chấp Nhận**:

1. **Cho** đã có tin nhắn được xử lý, **Khi** quản trị mở trang lịch sử, **Thì** hiển thị danh sách cuộc trò chuyện theo thời gian
2. **Cho** quản trị chọn một cuộc trò chuyện, **Khi** xem chi tiết, **Thì** hiển thị đầy đủ tin nhắn của khách hàng và câu trả lời của AI
3. **Cho** quản trị muốn can thiệp thủ công, **Khi** nhập và gửi tin nhắn trả lời, **Thì** tin nhắn thủ công được gửi đến khách hàng thay vì câu trả lời AI

---

### Trường Hợp Ngoại Lệ

- Facebook API bị gián đoạn hoặc bảo trì — hệ thống thông báo cho quản trị và暫停止 trả lời tự động
- Khách hàng gửi tin nhắn bằng ngôn ngữ ngoài phạm vi hỗ trợ — hệ thống trả lời bằng ngôn ngữ mặc định (tiếng Việt)
- Facebook Page vượt quá giới hạn tin nhắn API — hệ thống ghi log lỗi và thông báo cho quản trị
- Token xác thực Facebook hết hạn — hệ thống yêu cầu quản trị kết nối lại
- Mô hình AI miễn phí bị quá tải hoặc không khả dụng — hệ thống trả lời mặc định và thông báo cho quản trị

## Yêu Cầu *(bắt buộc)*

### Yêu Cầu Chức Năng

- **FR-001**: Hệ thống PHẢI cho phép quản trị kết nối Facebook Page qua quy trình xác thực OAuth
- **FR-002**: Hệ thống PHẢI lưu trữ và tự động làm mới token truy cập Facebook
- **FR-003**: Hệ thống PHẢI nhận tin nhắn Messenger từ Facebook Page đã kết nối
- **FR-004**: Hệ thống PHẢI tự động trả lời tin nhắn khách hàng bằng AI dựa trên tri thức đã cấu hình
- **FR-005**: Hệ thống PHẢI sử dụng mô hình ngôn ngữ miễn phí để sinh câu trả lời
- **FR-006**: Hệ thống PHẢI cho phép quản trị CRUD (tạo, đọc, cập nhật, xóa) tri thức CSKH
- **FR-007**: Hệ thống PHẢI hiển thị lịch sử trò chuyện giữa AI và khách hàng
- **FR-008**: Hệ thống PHẢI cho phép quản trị can thiệp thủ công vào cuộc trò chuyện
- **FR-009**: Hệ thống PHẢI hiển thị trạng thái kết nối Facebook (đã/không kết nối)
- **FR-010**: Hệ thống PHẢI ghi log tất cả tin nhắn gửi và nhận để debugging
- **FR-011**: Hệ thống PHẢI xử lý tin nhắn đa ngôn ngữ, ưu tiên tiếng Việt
- **FR-012**: Hệ thống PHẢO thông báo cho quản trị khi có lỗi kết nối Facebook hoặc AI

### Thực Thể Chính

- **Facebook Page**: Đại diện trang Facebook được kết nối, bao gồm Page ID, tên Page, token truy cập, trạng thái kết nối
- **Cuộc trò chuyện (Conversation)**: Đại diện cuộc trò chuyện giữa khách hàng và hệ thống, liên kết với một khách hàng và nhiều tin nhắn
- **Tin nhắn (Message)**: Đại diện một tin nhắn trong cuộc trò chuyện, bao gồm nội dung, người gửi (khách hàng hoặc AI), thời gian
- **Tri thức (Knowledge)**: Đại diện thông tin CSKH được sử dụng làm cơ sở cho AI trả lời, bao gồm tiêu đề, nội dung, danh mục
- **Quản trị (Admin)**: Đại diện người quản lý hệ thống, có quyền kết nối Facebook và quản lý tri thức

## Tiêu Chí Thành Công *(bắt buộc)*

### Kết Quả Có Thể Đo Lường

- **SC-001**: Khách hàng nhận được câu trả lời tự động trong vòng 10 giây sau khi gửi tin nhắn
- **SC-002**: Hệ thống xử lý được tối thiểu 100 tin nhắn đồng thời mà không bị chậm trễ
- **SC-003**: 80% câu trả lời AI được khách hàng đánh giá là hữu ích hoặc chính xác
- **SC-004**: Quản trị có thể kết nối Facebook Page và bắt đầu trả lời tự động trong vòng 5 phút
- **SC-005**: Hệ thống hoạt động ổn định 99% thời gian trong giờ làm việc
- **SC-006**: Quản trị có thể quản lý tri thức CSKH mà không cần kiến thức kỹ thuật

## Giả Định

- Người dùng mục tiêu là quản trị viên/doanh nghiệp nhỏ có tài khoản Facebook Page
- Facebook Page đã được tạo và hoạt động bình thường
- Mô hình AI miễn phí được sử dụng (ví dụ: từ các dịch vụ như Hugging Face Inference, hoặc các API miễn phí có giới hạn)
- Phạm vi hỗ trợ ban đầu: tiếng Việt, có thể mở rộng thêm ngôn ngữ sau
- Tri thức CSKH ban đầu do quản trị nhập thủ công
- Không yêu cầu tích hợp thanh toán hay quản lý khách hàng phức tạp — đây là hệ thống CSKH cơ bản
- Người dùng có kết nối internet ổn định
- Phản hồi AI không cần chính xác 100% — chấp nhận sai sót nhỏ, quan trọng là phản hồi nhanh và có ý nghĩa
