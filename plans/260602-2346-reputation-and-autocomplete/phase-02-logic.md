# Phase 02: Business Logic Upgrade (Controller)
Status: ⬜ Pending
Dependencies: [Phase 01: Database & Storage Upgrade](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-01-database.md)

## Objective
Cập nhật `StemLabAPI` trong `js/controller.js` để thực thi logic trừ/cộng điểm uy tín, bắt buộc nhập nhận xét khi xếp loại "Chưa đạt", và kiểm tra chặn đặt lịch khi điểm về 0.

## Requirements
### Functional
- [ ] Cập nhật `validateBooking(newBooking)`:
  - Lấy điểm uy tín hiện tại của nhóm thông qua `StorageEngine.getTeamReputation(newBooking.team_name)`.
  - Nếu điểm uy tín bằng **0**, từ chối đặt lịch và trả về thông báo lỗi chi tiết: `"Nhóm [Tên nhóm] đã bị KHÓA đặt lịch do điểm uy tín đã về 0! Vui lòng liên hệ Giáo viên/Trợ lý để được giải quyết."`.
- [ ] Cập nhật logic đánh giá của Giáo viên (trong `submitTeacherEvaluation` hoặc tương đương):
  - Tham số truyền vào cần có thêm: `evaluation_note` (nhận xét chi tiết).
  - Nếu xếp loại là **Chưa đạt** (`failed` / `chua_dat`):
    - Kiểm tra `evaluation_note` có bị trống hay không. Nếu trống, chặn và trả về lỗi: `"Bắt buộc phải nhập nhận xét lý do khi đánh giá Chưa đạt!"`.
    - Trừ **30 điểm** uy tín của nhóm: `let score = StorageEngine.getTeamReputation(teamName); StorageEngine.setTeamReputation(teamName, score - 30);`.
  - Nếu xếp loại là **Tốt** (`excellent` / `tot`):
    - Cộng **10 điểm** uy tín của nhóm (không vượt quá 100): `let score = StorageEngine.getTeamReputation(teamName); StorageEngine.setTeamReputation(teamName, score + 10);`.
  - Nếu xếp loại là **Đạt** (`passed` / `dat`):
    - Giữ nguyên điểm.
  - Ghi nhận `evaluation_note` vào đối tượng booking tương ứng để lưu trữ.
- [ ] Cập nhật định dạng tin nhắn Telegram gửi đi khi xếp loại ca học: thông báo điểm uy tín hiện tại của nhóm và lý do chưa đạt (nếu có) để tạo tính minh bạch.

### Non-Functional
- [ ] Xử lý loại bỏ khoảng trắng dư thừa trong nhận xét.
- [ ] Điểm uy tín sau khi cập nhật không được vượt quá 100 và không được nhỏ hơn 0.

## Implementation Steps
1. [ ] Sửa đổi hàm `validateBooking` trong `js/controller.js` để kiểm tra uy tín nhóm.
2. [ ] Sửa đổi hàm `submitTeacherEvaluation` (hoặc hàm tương tự để Giáo viên đánh giá) để tích hợp logic trừ/cộng điểm và kiểm tra nhận xét bắt buộc.
3. [ ] Cập nhật logic gửi thông báo Telegram trong controller để đính kèm thông tin điểm số uy tín của nhóm.

## Files to Create/Modify
- `js/controller.js` - [Modify] Tích hợp kiểm tra điểm uy tín và cập nhật điểm uy tín khi xếp loại học tập.

## Test Criteria
- [ ] Gọi `validateBooking` với nhóm có 0 điểm uy tín $\rightarrow$ Trả về `valid: false` cùng thông báo khóa.
- [ ] Thực hiện xếp loại "Chưa đạt" không truyền nhận xét $\rightarrow$ Trả về lỗi yêu cầu nhập lý do.
- [ ] Thực hiện xếp loại "Chưa đạt" có kèm nhận xét $\rightarrow$ Điểm uy tín của nhóm bị trừ đi 30 điểm và booking lưu trữ thành công.
- [ ] Thực hiện xếp loại "Tốt" $\rightarrow$ Điểm uy tín của nhóm được cộng 10 điểm (tối đa 100).

---
Next Phase: [Phase 03: UI Enhancements](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-03-ui.md)
