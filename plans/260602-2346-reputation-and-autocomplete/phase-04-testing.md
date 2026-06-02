# Phase 04: Integration & Verification
Status: ⬜ Pending
Dependencies: [Phase 03: UI Enhancements](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-03-ui.md)

## Objective
Kết nối tất cả các thành phần giao diện, logic nghiệp vụ, lưu trữ và thực hiện các kịch bản kiểm thử toàn diện để đảm bảo tính năng vận hành trơn tru, không có lỗi logic hay xung đột.

## Requirements
### Functional
- [ ] Tích hợp trọn vẹn luồng dữ liệu từ giao diện nhập liệu $\rightarrow$ kiểm tra validation $\rightarrow$ lưu trữ `LocalStorage` $\rightarrow$ xếp loại $\rightarrow$ trừ/cộng điểm uy tín.
- [ ] Đảm bảo cơ chế tự động gợi ý và ghi nhớ không gây lỗi khi không có lịch sử booking nào (trường hợp hệ thống trống dữ liệu).
- [ ] Đảm bảo cơ chế tự động điền không đè (overwrite) dữ liệu người đại diện nếu người dùng muốn tự tay đổi người đại diện khác của nhóm.

## Verification Steps & Scenarios

### Kịch bản 1: Mượn phòng lần đầu & Autocomplete / Autofill
1. Đăng ký mượn phòng với nhóm mới: `Vex Team 10A1`, người đại diện: `Nguyễn Văn A`.
2. Xác nhận và duyệt ca học thành công.
3. Bấm đăng ký một ca học khác:
   - Gõ chữ `V` vào ô Tên nhóm $\rightarrow$ Kiểm tra dropdown gợi ý có hiện `Vex Team 10A1` không.
   - Click chọn gợi ý `Vex Team 10A1` $\rightarrow$ Kiểm tra xem ô Người đại diện có tự động điền `Nguyễn Văn A` hay không.

### Kịch bản 2: Giáo viên đánh giá & Trừ điểm uy tín
1. Hoàn thành ca học của nhóm `Vex Team 10A1`.
2. Đăng nhập Giáo viên (`giaovien` / `123456`), bấm vào ca học đó để đánh giá.
3. Chọn xếp loại **"Chưa đạt"** và để trống ô nhận xét $\rightarrow$ Kiểm tra hệ thống có chặn và báo lỗi bắt buộc nhập hay không.
4. Nhập nhận xét: `"Không dọn dẹp vệ sinh phòng Lab sau khi thực hành"` và submit.
5. Kiểm tra:
   - Điểm uy tín của nhóm `Vex Team 10A1` giảm xuống còn **70**.
   - Bảng xếp hạng trên Dashboard giáo viên hiển thị nhóm `Vex Team 10A1` có 70 điểm.
   - Ca học đó trên Grid hiển thị biểu tượng Chưa đạt kèm lý do của giáo viên khi xem chi tiết.
   - Sử dụng Widget tra cứu nhanh nhập `Vex Team 10A1` $\rightarrow$ Kết quả trả về 70 điểm.

### Kịch bản 3: Tích lũy lỗi & Khóa đặt lịch (Điểm uy tín về 0)
1. Thực hiện tiếp tục đánh giá Chưa đạt thêm 2 ca học nữa của nhóm `Vex Team 10A1` (mỗi lần bị trừ 30 điểm $\rightarrow$ tổng điểm uy tín giảm về **10** rồi tiếp tục về **0**).
2. Khi điểm uy tín còn 10:
   - Mở form đặt lịch mới và chọn/nhập `Vex Team 10A1` $\rightarrow$ Kiểm tra xem có hiển thị cảnh báo màu vàng (vùng nguy hiểm) hay không.
3. Khi điểm uy tín về 0:
   - Mở form đặt lịch mới và chọn/nhập `Vex Team 10A1` $\rightarrow$ Kiểm tra xem hệ thống có hiển thị cảnh báo màu đỏ thông báo bị khóa, đồng thời nút xác nhận đặt lịch bị vô hiệu hóa hay không.
   - Nhập tên nhóm khác $\rightarrow$ Kiểm tra xem nút xác nhận đặt lịch có được mở lại bình thường không.

## Output
- Toàn bộ tính năng hoạt động hoàn hảo và sẵn sàng deploy lên production.

---
Next Steps: Quay lại trang kế hoạch chính để cập nhật tiến độ tổng thể.
