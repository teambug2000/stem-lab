# 🧪 stem-lab: Smart Lab Management System

Hệ thống đặt lịch và vận hành số hóa phòng học STEM thông minh (Single Page Application).

## 🚀 Demo Trực Tuyến
Trang web được host trực tiếp trên GitHub Pages tại đường dẫn:
👉 **[https://teambug2000.github.io/stem-lab/](https://teambug2000.github.io/stem-lab/)**

---

## 🌟 Tính Năng Nổi Bật (MVP)
1. **Lịch biểu trực quan thời gian thực (Real-time Grid):** Hiển thị lịch ca trống và trạng thái sử dụng của 4 Zone:
   - 🟢 Green Zone (Robot & Cơ khí)
   - 🟡 Yellow Zone (Điện - Điện tử)
   - 🔴 Red Zone (STEM Maker)
   - 🔵 Open Lab (Không gian mở)
2. **Quy trình đặt phòng tự động (Conflict & Quota Engine):**
   - Tự động kiểm tra trùng lịch đăng ký.
   - Kiểm tra định mức sử dụng (tối đa 3 ca/tuần cho mỗi nhóm học sinh).
3. **Trình giả lập vai trò (Role Switcher):** Demo nhanh 3 vai trò trực tiếp trên một giao diện:
   - 🎓 **Học sinh:** Xem lịch, mượn thiết bị, đặt ca, gửi đánh giá 5 sao.
   - ⚡ **Lab Assistant (Học sinh nòng cốt):** Duyệt yêu cầu đặt lịch, thực hiện bàn giao phòng & thiết bị, hoàn thành ca học.
   - 👨‍🏫 **Giáo viên:** Theo dõi biểu đồ báo cáo thống kê hoạt động (Chart.js) và xem phản hồi đánh giá.
4. **Lưu trữ cục bộ (LocalStorage Database):** Giữ lại mọi lịch đặt và trạng thái duyệt ngay cả khi tải lại trang (F5).

---

## 🛠️ Công Nghệ Sử Dụng
- **Giao diện:** HTML5, CSS3 (Premium Glassmorphism, CSS Variables, Responsive Grid, Smooth Animations)
- **Logic điều khiển:** ES6 Vanilla JavaScript (Single Page Architecture)
- **Thư viện ngoài:** Chart.js (CDN)
- **Lưu trữ:** Browser LocalStorage

---

## 📁 Cấu Trúc Thư Mục
```
stem-lab/
├── docs/               # Tài liệu Specs, Design, Brief của dự án
├── js/
│   ├── app.js          # Khởi chạy ứng dụng
│   ├── storage.js      # Storage Engine (LocalStorage)
│   ├── controller.js   # Logic Engine (Check trùng, Quota, Stats)
│   └── ui.js           # UI Engine (DOM Render, Chart.js)
├── index.html          # File giao diện chính
├── styles.css          # Định dạng phong cách thiết kế
└── README.md           # Hướng dẫn dự án
```

---

## 💻 Cách Chạy Offline
1. Tải toàn bộ mã nguồn về máy tính.
2. Click đúp chuột vào file [index.html](file:///c:/Users/Admin/Desktop/stem/index.html) hoặc chạy một máy chủ HTTP tĩnh đơn giản.
3. Trải nghiệm trực tiếp trên mọi trình duyệt web.
