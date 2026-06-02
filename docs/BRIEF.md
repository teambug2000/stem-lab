# 💡 BRIEF: stem-lab (Smart Lab Management System)

**Ngày tạo:** 2026-05-26
**Dự án:** Hệ thống đặt lịch và vận hành số hóa phòng STEM

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
- Quản lý phòng STEM thủ công dẫn đến việc dễ bị trùng lịch sử dụng giữa các nhóm.
- Khó kiểm soát định mức (quota) sử dụng phòng của từng nhóm (tối đa 3 ca/tuần, 2 tiếng/ca).
- Giáo viên thiếu dữ liệu thống kê trực quan để đánh giá tần suất và hiệu quả sử dụng phòng.
- Thiếu quy trình bàn giao thiết bị rõ ràng từ các học sinh nòng cốt (Lab Assistant).

## 2. GIẢI PHÁP ĐỀ XUẤT
Xây dựng một **Web App** (Hệ thống quản lý thông minh) giúp số hóa toàn bộ quy trình:
- Học sinh tự xem lịch trống theo Zone và đặt phòng nhanh gọn.
- Hệ thống tự động kiểm tra trùng lịch và khóa đăng ký nếu vượt quá quota quy định.
- Tích hợp Dashboard báo cáo cho Giáo viên.
- Lab Assistant duyệt lịch trực tuyến và quản lý quy trình bàn giao phòng học/thiết bị.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Học sinh (Sinh viên):** Người đặt phòng học, xem lịch trống, sử dụng và gửi đánh giá phản hồi.
- **Lab Assistant (Học sinh nòng cốt):** Người duyệt yêu cầu đăng ký, hỗ trợ vận hành, bàn giao phòng & kiểm tra thiết bị.
- **Giáo viên:** Người giám sát tổng thể, xem biểu đồ báo cáo thống kê tần suất sử dụng phòng lab.

## 4. TÍNH NĂNG CHI TIẾT

### 🚀 MVP (Bản chạy thử ban đầu):
- [ ] **Giao diện Lịch Thời Gian Thực (Real-time Calendar Grid):** Hiển thị lịch biểu 4 Zone (Green, Yellow, Red, Open Lab) trực quan.
- [ ] **Form Đăng Ký Đặt Lịch:** Cho phép học sinh điền thông tin nhóm, chọn Zone, khung giờ, thiết bị và mục đích sử dụng.
- [ ] **Bộ Tự Động Hóa (Automation Engine - Sim):**
  - Tự động kiểm tra trùng lịch (không cho phép 2 nhóm đặt cùng Zone trong cùng khung giờ).
  - Tự động kiểm tra định mức (quota) của nhóm (tối đa 3 ca/tuần).
- [ ] **Trình Giả Lập Vai Trò (Role Switcher):** Cho phép demo luồng hoạt động bằng cách chuyển đổi qua lại giữa Học sinh, Lab Assistant và Giáo viên.
- [ ] **Trang Duyệt Lịch (Lab Assistant):** Xem danh sách đăng ký chờ duyệt, duyệt hoặc từ chối và bấm bàn giao phòng.
- [ ] **Form Đánh Giá Sau Sử Dụng:** Đánh giá bằng số sao (1-5★) và bình luận sau khi hoàn thành ca học.
- [ ] **Dashboard Thống Kê (Giáo viên):**
  - Biểu đồ tần suất sử dụng theo các ngày trong tuần (cột).
  - Biểu đồ tỷ lệ sử dụng theo từng Zone (tròn).
  - Bảng xếp hạng top các nhóm sử dụng phòng STEM nhiều nhất.
- [ ] **Lưu Trữ Dữ Liệu:** Sử dụng LocalStorage để giữ dữ liệu lịch đặt, trạng thái duyệt và các đánh giá khi F5.

### 🎯 Nâng cấp mới (Kỷ luật & Tối ưu hóa đặt lịch):
- [ ] **Mô hình 100 Điểm Uy Tín (Credit Score) & Chế tài minh bạch:**
  - Mỗi nhóm đăng ký lần đầu sẽ được cấp **100 điểm uy tín mặc định** (được lưu trữ dựa trên Tên nhóm).
  - Khi Giáo viên đánh giá **Chưa đạt** ở ca học trước, nhóm bị trừ **30 điểm**. **Bắt buộc Giáo viên phải điền nhận xét/lý do chưa đạt (không được để trống)**.
  - Nhận xét/ghi chú lý do chưa đạt của Giáo viên sẽ được hiển thị trực tiếp cho học sinh (trên Lịch Grid của ca học đó, trên thanh thông báo chặn đặt lịch hoặc khi tra cứu trạng thái nhóm) để học sinh nắm được lỗi vi phạm.
  - Khi Giáo viên đánh giá **Tốt** ở ca học trước, nhóm được cộng lại **10 điểm** khuyến khích (tối đa không vượt quá 100 điểm).
  - Điểm tín nhiệm dưới 40 điểm: Hệ thống hiển thị cảnh báo đỏ nguy cơ bị khóa.
  - Điểm tín nhiệm về 0 điểm: **Khóa tự động quyền đặt lịch** của nhóm đó. Form đăng ký sẽ bị chặn kèm hiển thị lý do vi phạm gần nhất của nhóm.
- [ ] **Cơ chế Tự động gợi ý & Ghi nhớ (Autocomplete & Autofill):**
  - Khi học sinh gõ ký tự đầu tiên tại ô Tên nhóm, form sẽ gợi ý danh sách các tên nhóm đã có trong lịch sử để tránh gõ sai chính tả.
  - Khi click chọn nhóm gợi ý, hệ thống tự điền luôn tên **Người đại diện** đã đăng ký gần nhất của nhóm đó.
  - Ghi nhớ thông tin đặt lịch gần nhất trên trình duyệt của thiết bị cá nhân để điền nhanh trong các lần sau.

## 5. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** Trung bình (cần cập nhật cấu trúc database để lưu điểm uy tín theo nhóm, xử lý logic autocompletion của ô input, và tích hợp bộ kiểm tra chặn đặt lịch).
- **Rủi ro:** Cần đồng bộ chính xác dữ liệu điểm uy tín của nhóm dựa trên tên nhóm viết hoa/viết thường để tránh bị qua mặt bằng việc đổi chữ hoa/thường (cần chuẩn hóa chuỗi về lowercase khi kiểm tra).

## 6. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên kế hoạch triển khai chi tiết các tính năng nâng cấp này.
