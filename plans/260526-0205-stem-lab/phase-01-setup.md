# Phase 01: Project Setup
Status: ⬜ Pending
Dependencies: None

## Objective
Khởi tạo cấu trúc dự án Web App tĩnh bằng HTML, CSS, JavaScript cơ bản và cấu hình liên kết các tệp tin cơ sở.

## Requirements
- [ ] Cấu trúc dự án sạch sẽ, phân tách rõ giao diện (HTML), định dạng (CSS), logic (JS).
- [ ] Liên kết thư viện ngoài (Chart.js) qua CDN chính thức.
- [ ] Đảm bảo các tệp tin tham chiếu đúng đường dẫn tương đối.

## Implementation Steps
1. [ ] Tạo file `index.html` cơ bản chứa khung HTML5 và thẻ liên kết.
2. [ ] Tạo file `styles.css` chứa các biến màu (color tokens) cơ bản và reset css.
3. [ ] Tạo file `app.js` rỗng làm điểm khởi đầu cho JavaScript logic.
4. [ ] Tạo thư mục `js/` để chứa các module con (storage, controller, ui).
5. [ ] Thiết lập liên kết CDN Chart.js trong `index.html`.

## Files to Create/Modify
- [NEW] `index.html` - Trang giao diện chính của ứng dụng
- [NEW] `styles.css` - Định dạng kiểu dáng giao diện
- [NEW] `js/app.js` - Tệp khởi chạy logic JavaScript
- [NEW] `js/storage.js` - Logic lưu trữ LocalStorage
- [NEW] `js/controller.js` - Logic kiểm tra trùng lịch & xử lý nghiệp vụ
- [NEW] `js/ui.js` - Logic render giao diện lịch và cập nhật DOM

## Test Criteria
- [ ] Mở file `index.html` trên trình duyệt không xuất hiện lỗi liên kết tệp tin (404).
- [ ] Kiểm tra Console Log hiển thị thông báo khởi tạo thành công.

---
Next Phase: [phase-02-database.md](file:///c:/Users/Admin/Desktop/stem/plans/260526-0205-stem-lab/phase-02-database.md)
