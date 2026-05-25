# Phase 06: Testing & Verification
Status: ⬜ Pending
Dependencies: [Phase 05](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-05-integration.md)

## Objective
Thực hiện kiểm thử toàn bộ luồng hoạt động của hệ thống, sửa các lỗi phát sinh và hoàn thiện trải nghiệm người dùng (UX).

## Requirements
- [ ] Kiểm thử luồng đặt lịch: Đăng ký ca trống $\rightarrow$ Chờ duyệt $\rightarrow$ Duyệt $\rightarrow$ Bàn giao $\rightarrow$ Trả phòng $\rightarrow$ Đánh giá.
- [ ] Kiểm thử giới hạn nghiệp vụ: Trùng lịch (cùng zone, ngày, giờ) và quá quota (quá 3 ca/tuần/nhóm).
- [ ] Kiểm thử hiển thị trên các thiết bị khác nhau (Responsive) và các trình duyệt phổ biến (Chrome, Edge, Firefox).

## Implementation Steps
1. [ ] Tiến hành các ca kiểm thử thủ công theo kịch bản:
   - **Kịch bản 1:** Đặt lịch thông thường và duyệt lịch thành công.
   - **Kịch bản 2:** Đặt trùng giờ phòng và xem thông báo chặn trùng lịch.
   - **Kịch bản 3:** Đặt quá 3 ca trong một tuần cho nhóm "VEX Team" và xem thông báo quota.
   - **Kịch bản 4:** Hoàn thành ca học và gửi đánh giá 5 sao kèm bình luận.
   - **Kịch bản 5:** Xem dashboard giáo viên cập nhật số liệu biểu đồ sau khi hoàn thành.
2. [ ] Khắc phục các lỗi về CSS layout hoặc logic JavaScript phát hiện trong lúc test.
3. [ ] Viết tài liệu hướng dẫn nhanh (README.md cập nhật) cách vận hành và demo.

## Files to Create/Modify
- [MODIFY] `README.md` - Cập nhật hướng dẫn demo chi tiết

## Test Criteria
- [ ] Mọi kịch bản trên đều chạy đúng mong đợi mà không xuất hiện lỗi JavaScript đỏ trong Console.
- [ ] Trải nghiệm mượt mà, chuyển đổi các màn hình không có độ trễ lớn.
