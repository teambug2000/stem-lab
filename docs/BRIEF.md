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

### 🎁 Phase 2 (Phát triển thêm):
- [ ] Tích hợp camera quét mã QR thật để truy cập nhanh link đặt lịch.
- [ ] Gửi thông báo tự động qua Email/Telegram thật cho học sinh và Lab Assistant.
- [ ] Đồng bộ dữ liệu trực tiếp với Google Sheets.

## 5. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** Trung bình (chủ yếu xử lý logic kiểm tra trùng lịch, quota và vẽ biểu đồ dashboard trực quan).
- **Rủi ro:** Cần đảm bảo trải nghiệm chuyển đổi vai trò (Role Switcher) mượt mà để người dùng dễ hình dung luồng hoạt động đầy đủ.

## 6. BƯỚC TIẾP THEO
→ Chạy `/plan` để bắt đầu thiết kế chi tiết (giao diện, cấu trúc dữ liệu, và danh sách các task cần code).
