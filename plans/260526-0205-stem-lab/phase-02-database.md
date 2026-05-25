# Phase 02: Database Schema (LocalStorage Engine)
Status: ⬜ Pending
Dependencies: [Phase 01](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-01-setup.md)

## Objective
Thiết lập cơ sở dữ liệu giả lập sử dụng LocalStorage (Storage Engine). Cung cấp các hàm đọc/ghi (CRUD) cơ bản cho danh sách đặt lịch (`bookings`), trạng thái thiết bị (`devices`), và các thiết lập hệ thống.

## Requirements
- [ ] Khởi tạo dữ liệu mẫu (mock data) nếu LocalStorage trống để người dùng demo ngay lập tức.
- [ ] Xây dựng các hàm helper đọc/ghi dữ liệu an toàn (bọc trong try-catch phòng trường hợp bộ nhớ đầy).
- [ ] Đồng bộ hóa dữ liệu thời gian thực giữa các tab hoặc khi có thay đổi trạng thái.

## Implementation Steps
1. [ ] Trong `js/storage.js`, viết hàm `initStorage()` để nạp dữ liệu mẫu ban đầu (Green, Yellow, Red, Open Lab bookings & devices).
2. [ ] Viết hàm `getBookings()` và `saveBookings(bookings)` để quản lý danh sách đặt lịch.
3. [ ] Viết hàm `getDevices()` và `saveDevices(devices)` để quản lý danh sách thiết bị phòng STEM.
4. [ ] Viết hàm reset dữ liệu `resetStorage()` về trạng thái mặc định ban đầu để thuận tiện chạy thử nhiều lần.

## Files to Create/Modify
- [MODIFY] `js/storage.js` - Viết logic đọc ghi dữ liệu từ LocalStorage

## Test Criteria
- [ ] Chạy hàm khởi tạo và kiểm tra trong Chrome DevTools -> Application -> Local Storage có xuất hiện đúng các khóa `stem_lab_bookings` và `stem_lab_devices`.
- [ ] Thực hiện thêm mới một bản ghi thông qua console và kiểm tra dữ liệu được lưu đúng cấu trúc JSON.

---
Next Phase: [phase-03-backend.md](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-03-backend.md)
