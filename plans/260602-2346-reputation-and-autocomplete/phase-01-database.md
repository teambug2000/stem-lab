# Phase 01: Database & Storage Upgrade
Status: ⬜ Pending
Dependencies: None

## Objective
Cấu trúc lại StorageEngine để hỗ trợ lưu trữ điểm uy tín (reputation score) của các nhóm và bổ sung các trường thông tin cần thiết vào dữ liệu booking.

## Requirements
### Functional
- [ ] Định nghĩa cấu trúc dữ liệu uy tín nhóm trong LocalStorage:
  - Khóa: `stem_lab_team_reputation`
  - Giá trị: Bản đồ tên nhóm (chuẩn hóa lowercase khi lưu/tìm) $\rightarrow$ Điểm uy tín (mặc định 100).
- [ ] Bổ sung các phương thức lấy và cập nhật uy tín nhóm trong `StorageEngine` của `js/storage.js`:
  - `getTeamReputation(teamName)`: Trả về điểm uy tín hiện tại của nhóm (mặc định 100 nếu chưa từng ghi nhận).
  - `setTeamReputation(teamName, score)`: Cập nhật điểm uy tín cho nhóm (giới hạn trong khoảng [0, 100]).
  - `getAllTeamsReputation()`: Trả về danh sách tất cả các nhóm kèm điểm uy tín.
- [ ] Bổ sung trường `evaluation_note` (hoặc `reject_reason`) vào cấu trúc booking để lưu trữ ghi chú của giáo viên khi xếp loại "Chưa đạt".

### Non-Functional
- [ ] Chuẩn hóa chuỗi (string normalization): Tên nhóm cần được cắt khoảng trắng (trim) và chuyển thành lowercase khi truy vấn điểm uy tín để tránh việc học sinh lách luật bằng cách thay đổi chữ hoa/thường (ví dụ `Vex Team` và `vex team`).
- [ ] Đảm bảo dữ liệu cũ không bị ảnh hưởng (backward compatibility).

## Implementation Steps
1. [ ] Cập nhật `STORAGE_KEYS` trong `js/storage.js` thêm khóa `TEAM_REPUTATION`.
2. [ ] Viết các helper methods trong `StorageEngine` để thao tác dữ liệu reputation.
3. [ ] Đảm bảo khi lưu booking mới hoặc cập nhật booking, hệ thống hỗ trợ trường `evaluation_note` trong cấu trúc dữ liệu booking.

## Files to Create/Modify
- `js/storage.js` - [Modify] Bổ sung cấu trúc dữ liệu lưu trữ uy tín nhóm và các hàm getter/setter.

## Test Criteria
- [ ] Gọi thử `StorageEngine.getTeamReputation("nhom_test")` trả về 100 điểm mặc định.
- [ ] Gọi thử `StorageEngine.setTeamReputation("nhom_test", 70)` sau đó `StorageEngine.getTeamReputation("nhom_test")` trả về chính xác 70 điểm.
- [ ] Gọi thử `StorageEngine.getTeamReputation("NHOM_TEST")` (chữ in hoa) trả về 70 điểm (không bị phân biệt hoa thường).

---
Next Phase: [Phase 02: Business Logic Upgrade](file:///Users/ttdh/Desktop/stem/plans/260602-2346-reputation-and-autocomplete/phase-02-logic.md)
