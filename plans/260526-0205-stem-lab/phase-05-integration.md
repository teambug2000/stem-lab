# Phase 05: Integration (State Binding & Switcher)
Status: ⬜ Pending
Dependencies: [Phase 03](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-03-backend.md), [Phase 04](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-04-frontend.md)

## Objective
Kết nối giao diện HTML với logic xử lý JavaScript. Triển khai render lịch biểu động, xử lý thao tác gửi form đặt lịch, duyệt lịch, đổi vai trò và hiển thị biểu đồ thống kê Chart.js bằng dữ liệu thực từ LocalStorage.

## Requirements
- [ ] Render bảng lịch 4 Zone tự động dựa trên ngày hiện tại và danh sách booking trong bộ nhớ.
- [ ] Hiển thị thông tin đăng ký chi tiết trong các ô lịch đã được đặt.
- [ ] Bắt các sự kiện click trên Widget Switcher để hiển thị/ẩn các phân vùng vai trò tương ứng và gọi hàm render lại.
- [ ] Tích hợp Chart.js để vẽ 2 biểu đồ: Tần suất đặt lịch theo thứ (Bar Chart) và tỷ lệ sử dụng của các Zone (Pie Chart).
- [ ] Xử lý sự kiện gửi form đăng ký, gọi `StemLabAPI.createBooking` và hiển thị thông báo thành công hoặc lỗi validate (nếu trùng hoặc quá quota).

## Implementation Steps
1. [ ] Trong `js/ui.js`, viết các hàm kết nối DOM: `renderCalendar()`, `renderLADashboard()`, `renderTeacherDashboard()`, `showModal()`, `hideModal()`.
2. [ ] Viết hàm khởi tạo các biểu đồ `initCharts()` sử dụng thư viện Chart.js.
3. [ ] Trong `js/app.js`, viết hàm `initApp()` gắn các sự kiện click, submit form và gọi render lần đầu.
4. [ ] Viết hàm giả lập quét mã QR (ví dụ: click vào nút "Quét QR để đặt lịch" sẽ giả lập mở camera quét hoặc trực tiếp trỏ đến form đăng ký với zone tương ứng).

## Files to Create/Modify
- [MODIFY] `js/ui.js` - Thêm logic render động và tương tác DOM
- [MODIFY] `js/app.js` - Kết nối sự kiện khởi chạy ứng dụng

## Test Criteria
- [ ] Đổi vai trò hoạt động mượt mà, đổi sang Giáo viên sẽ thấy biểu đồ hiển thị đúng số liệu.
- [ ] Đặt thử một ca học thành công, bảng lịch chuyển trạng thái "Chờ duyệt". Chuyển sang Lab Assistant duyệt ca đó, bảng lịch đổi màu "Đã duyệt".

---
Next Phase: [phase-06-testing.md](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-06-testing.md)
