# Phase 03: UI Enhancements (ui.js & forms)
Status: ⬜ Pending
Dependencies: [Phase 02: Business Logic Upgrade](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-02-logic.md)

## Objective
Cải tiến giao diện người dùng trong `index.html`, `styles.css` và `js/ui.js` để tích hợp tính năng Autocomplete, hiển thị điểm uy tín, bắt buộc ghi chú lý do Chưa đạt và tra cứu điểm uy tín.

## Requirements
### Functional
- [ ] **Autocomplete & Autofill ô Tên nhóm:**
  - Lắng nghe sự kiện `input` và `focus` trên ô nhập `#input-team` trong Form đăng ký.
  - Tạo danh sách tên nhóm độc nhất từ lịch sử bookings.
  - Hiển thị danh sách gợi ý dạng dropdown bên dưới input khi người dùng gõ.
  - Khi click vào gợi ý:
    - Điền tên nhóm đã chọn vào ô `#input-team`.
    - Tìm kiếm booking gần nhất của nhóm đó để lấy tên người đại diện và tự động điền vào ô `#input-representative`.
    - Ẩn dropdown gợi ý.
- [ ] **Cảnh báo và Chặn đặt lịch thời gian thực:**
  - Ngay khi học sinh nhập/chọn tên nhóm, gọi API lấy điểm uy tín và cập nhật giao diện form:
    - Nếu điểm uy tín = **0**: Hiển thị thông báo cảnh báo đỏ *"⚠️ Nhóm này đang bị KHÓA đặt lịch do điểm uy tín đã về 0 (Xem lý do chưa đạt gần nhất: ...)"* và disable nút xác nhận đặt lịch.
    - Nếu điểm uy tín dưới **40**: Hiển thị cảnh báo vàng *"⚠️ Cảnh báo: Điểm uy tín của nhóm hiện tại là [Điểm] (Vùng nguy hiểm). Nếu bị Chưa đạt tiếp theo sẽ bị khóa!"*.
    - Nếu điểm uy tín bình thường ($\ge$ 40): Không hiện cảnh báo hoặc hiện tích xanh uy tín bình thường.
- [ ] **Bắt buộc nhập nhận xét ở giao diện đánh giá của Giáo viên:**
  - Cập nhật modal đánh giá của giáo viên: Khi giáo viên click chọn nút xếp loại "Chưa đạt", thêm thuộc tính `required` và thêm dấu sao đỏ `*` vào nhãn trường nhập nhận xét.
  - Kiểm tra tính hợp lệ trước khi submit form đánh giá ở phía frontend.
- [ ] **Hiển thị điểm uy tín và lý do Chưa đạt:**
  - **Trên Lịch Grid:** Các ca học đã được xếp loại "Chưa đạt" sẽ hiển thị nhãn `🔴 Chưa đạt` kèm theo tooltip hoặc khi click vào sẽ hiện rõ ghi chú lý do của giáo viên.
  - **Trên Dashboard Giáo viên:** Thêm cột "Điểm uy tín" vào bảng xếp hạng các nhóm để giáo viên dễ theo dõi nhóm nào đang ở vùng nguy hiểm.
- [ ] **Widget tra cứu nhanh uy tín nhóm (Lookup):**
  - Thiết kế một khung tra cứu nhỏ bên cạnh Lịch Grid hoặc góc trên màn hình: cho phép học sinh nhập tên nhóm để xem nhanh điểm uy tín hiện tại của nhóm mình mà không cần đăng nhập.

### Non-Functional
- [ ] Giao diện autocomplete dropdown và widget tra cứu phải đồng bộ với thiết kế dark-blue premium (`#050814`) của ứng dụng, sử dụng hiệu ứng glassmorphism và border mềm mại.
- [ ] Đóng dropdown gợi ý khi người dùng click ra ngoài.

## Implementation Steps
1. [ ] Cập nhật CSS trong `styles.css` để tạo kiểu cho dropdown gợi ý autocomplete và widget tra cứu.
2. [ ] Sửa đổi `index.html` để thêm khung tra cứu nhanh điểm uy tín nhóm và điều chỉnh modal đánh giá của giáo viên.
3. [ ] Cập nhật `js/ui.js` để hiện thực hóa logic autocomplete, tự động kiểm tra cảnh báo uy tín trong form đặt lịch, bắt buộc nhập nhận xét khi xếp loại Chưa đạt, hiển thị điểm uy tín trên Dashboard giáo viên và Grid ca học.

## Files to Create/Modify
- `index.html` - [Modify] Thêm widget tra cứu, trường bắt buộc trong modal đánh giá.
- `styles.css` - [Modify] Styling cho autocomplete dropdown, widget tra cứu và cảnh báo.
- `js/ui.js` - [Modify] Thực thi toàn bộ tương tác và cập nhật giao diện cho tính năng mới.

## Test Criteria
- [ ] Khi gõ vào ô Tên nhóm, dropdown gợi ý các nhóm cũ xuất hiện chính xác. Click gợi ý giúp điền nhanh cả Tên nhóm và Người đại diện.
- [ ] Khi nhập tên nhóm có uy tín = 0 $\rightarrow$ Form hiện cảnh báo đỏ và nút đặt lịch bị khóa.
- [ ] Khi Giáo viên đánh giá "Chưa đạt" mà không nhập nhận xét $\rightarrow$ Giao diện báo lỗi đỏ bắt buộc nhập.
- [ ] Click vào ca học "Chưa đạt" trên Grid hiển thị chi tiết lý do Giáo viên ghi nhận.

---
Next Phase: [Phase 04: Integration & Verification](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-04-testing.md)
