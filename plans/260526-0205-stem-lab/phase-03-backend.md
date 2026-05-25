# Phase 03: Backend Mock API & Business Logic
Status: ⬜ Pending
Dependencies: [Phase 02](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-02-database.md)

## Objective
Xây dựng lớp điều khiển logic nghiệp vụ (Controller/Services) làm nhiệm vụ giả lập Backend API. Xử lý các quy tắc ràng buộc quan trọng: kiểm tra trùng lịch và giới hạn định mức đăng ký (quota).

## Requirements
- [ ] Hàm `validateBooking(booking)` kiểm tra tính hợp lệ:
  - Trùng lịch: Không được trùng `zone`, `date`, và `time_slot` với một booking khác đang ở trạng thái active (không phải `rejected`).
  - Quota: Một nhóm (`team_name`) không được đăng ký quá 3 ca trong cùng một tuần học (Thứ 2 - Chủ nhật).
- [ ] API giả lập xử lý các thao tác:
  - `createBooking(bookingData)` -> trả về kết quả thành công hoặc lỗi validate.
  - `updateBookingStatus(id, newStatus)` -> cập nhật trạng thái đặt phòng (`pending` -> `approved`/`rejected` -> `in_use` -> `completed`).
  - `submitReview(id, rating, reviewText)` -> cập nhật đánh giá sau sử dụng.

## Implementation Steps
1. [ ] Trong `js/controller.js`, viết các hàm helper để lấy số tuần từ ngày (date) nhằm phục vụ check quota tuần.
2. [ ] Thực hiện hàm check trùng lịch dựa trên dữ liệu đã lưu trong LocalStorage.
3. [ ] Thực hiện logic quota: nhóm lại bookings theo `team_name` và `weekNumber`, đếm số ca active.
4. [ ] Viết hàm CRUD nghiệp vụ và xuất ra đối tượng `StemLabAPI`.

## Files to Create/Modify
- [MODIFY] `js/controller.js` - Chứa toàn bộ các hàm nghiệp vụ, logic kiểm tra quota và trùng lịch

## Test Criteria
- [ ] Unit test nhanh qua Console:
  - Thử đăng ký ca trùng giờ xem có bị từ chối và báo lỗi phù hợp không.
  - Thử đăng ký ca thứ 4 cho cùng một nhóm trong tuần xem có kích hoạt cảnh báo vượt quota không.

---
Next Phase: [phase-04-frontend.md](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-04-frontend.md)
