# 🎨 DESIGN: stem-lab (Smart Lab Management System)

**Ngày tạo:** 2026-05-26
**Dựa trên:** [docs/SPECS.md](file:///c:/Users/Admin/Desktop/stem/docs/SPECS.md)

---

## 1. Cách Lưu Thông Tin (Database Schema - LocalStorage)

Dữ liệu được tổ chức dưới dạng các mảng JSON lưu trong `localStorage`:

### 1.1. Bảng Đặt Lịch (`stem_lab_bookings`)
Lưu trữ toàn bộ thông tin đăng ký của các nhóm.
- `id` (string, khóa chính): Tự động tạo dựa trên timestamp `book_1716652800000`.
- `team_name` (string): Tên nhóm học sinh (ví dụ: `VEX Team 12A1`).
- `representative` (string): Họ tên học sinh đại diện đăng ký.
- `zone` (string): `green` (Robot & Cơ khí), `yellow` (Điện), `red` (STEM Maker), `open` (Open Lab).
- `date` (string): Ngày đăng ký (định dạng `YYYY-MM-DD`).
- `time_slot` (string): Khung giờ sử dụng (`07:00-09:00`, `09:00-11:00`, `13:30-15:30`, `15:30-17:30`, `17:30-19:30`).
- `devices` (array of strings): Danh sách thiết bị mượn kèm.
- `purpose` (string): Mục đích sử dụng.
- `status` (string): Trạng thái của ca học (`pending` | `approved` | `rejected` | `in_use` | `completed`).
- `rating` (number, 1-5): Đánh giá số sao (chỉ có khi trạng thái là `completed`).
- `review` (string): Nhận xét phản hồi của học sinh.
- `created_at` (string): Thời gian tạo yêu cầu đặt lịch.

### 1.2. Bảng Thiết Bị (`stem_lab_devices`)
Lưu trữ thông tin các thiết bị có sẵn trong phòng STEM.
- `id` (string, khóa chính): Ví dụ `dev_1`.
- `name` (string): Tên thiết bị (ví dụ: `Robot Kit VEX`).
- `zone` (string): Thuộc Zone nào quản lý (`green` | `yellow` | `red` | `open`).
- `status` (string): `available` (sẵn sàng) | `in_use` (đang được mượn).

---

## 2. Danh Sách Màn Hình (Single Page Application Components)

| # | Tên Component / Phân Hệ | Mục đích | Các phần tử hiển thị |
|---|-------------------------|----------|----------------------|
| 1 | **Role Switcher Widget** | Chuyển đổi nhanh vai trò | Menu dropdown ở Header: Học sinh, Lab Assistant, Giáo viên. |
| 2 | **Lịch biểu 4 Zone (Student View)** | Xem lịch và đăng ký phòng | Grid 4 cột (Zone) x 5 hàng (Ca học), Form đặt lịch (Modal), Form đánh giá (Modal). |
| 3 | **Quản lý phê duyệt (LA View)** | Lab Assistant duyệt và bàn giao | Bảng danh sách các ca `pending` (Duyệt/Từ chối), các ca `approved` (Bấm Bàn giao), các ca `in_use` (Bấm Trả phòng/Hoàn thành). |
| 4 | **Báo cáo thống kê (Teacher View)** | Giáo viên giám sát hoạt động | 2 Biểu đồ Chart.js (Tần suất tuần, tỷ lệ Zone) và Bảng xếp hạng Top nhóm sử dụng nhiều nhất. |

---

## 3. Luồng Hoạt Động (User Journey)

### 3.1. Hành trình Đặt phòng & Duyệt phòng
1. **Học sinh** quét mã QR $\rightarrow$ Mở Web App $\rightarrow$ Mặc định ở giao diện lịch biểu của Học sinh.
2. Học sinh click vào một ca học có trạng thái **Trống** trên Grid lịch.
3. Form đăng ký mở ra $\rightarrow$ Học sinh nhập tên nhóm, người đại diện, thiết bị, mục đích $\rightarrow$ Nhấn **Xác nhận**.
4. Hệ thống kiểm tra:
   - Nếu bị đặt trùng bởi nhóm khác $\rightarrow$ Báo lỗi.
   - Nếu nhóm đã đặt $\ge 3$ ca trong tuần $\rightarrow$ Báo lỗi quota.
   - Nếu hợp lệ $\rightarrow$ Tạo bản ghi status `pending`, ô lịch chuyển sang màu Vàng (Chờ duyệt).
5. **Lab Assistant** đổi vai trò $\rightarrow$ Vào tab **Chờ duyệt** $\rightarrow$ Nhấn **Phê duyệt** $\rightarrow$ Ô lịch chuyển sang màu Xanh lá (Đã duyệt).
6. Khi nhóm học sinh đến nhận phòng $\rightarrow$ Lab Assistant nhấn **Bàn giao** $\rightarrow$ Trạng thái chuyển sang `in_use` (màu xanh dương).
7. Khi hết giờ sử dụng $\rightarrow$ Lab Assistant nhấn **Hoàn thành** $\rightarrow$ Trạng thái chuyển sang `completed`. Học sinh sẽ được hiển thị form đánh giá số sao (1-5★).

---

## 4. Checklist Kiểm Tra & Kịch Bản Test (Test Cases)

### TC-01: Happy Path - Đặt lịch & Phê duyệt thành công
- **Given:** Người dùng ở giao diện Học sinh, ô lịch Green Zone lúc 07:00-09:00 ngày hôm nay đang trống.
- **When:** Điền Form đặt lịch (Nhóm: `VEX Team`, Đại diện: `Nguyễn Văn A`, Thiết bị: `Robot Kit VEX`) và bấm gửi.
- **Then:**
  - ✓ Ô lịch chuyển sang trạng thái "Chờ duyệt" (màu Vàng).
  - ✓ Chuyển sang vai trò Lab Assistant, bấm "Duyệt" $\rightarrow$ trạng thái chuyển sang "Đã duyệt" (màu Xanh lá).
  - ✓ Bấm tiếp "Bàn giao" $\rightarrow$ trạng thái chuyển sang "Đang sử dụng" (màu Xanh dương).

### TC-02: Chặn đặt lịch trùng
- **Given:** Khung giờ Green Zone lúc 07:00-09:00 ngày hôm nay đã có nhóm `VEX Team` đặt và được phê duyệt.
- **When:** Một học sinh khác bấm vào đúng ô lịch đó và gửi yêu cầu đăng ký cho nhóm `Drone Team`.
- **Then:**
  - ✓ Hệ thống chặn không cho gửi, hiển thị thông báo: "Khung giờ này đã được nhóm khác đăng ký sử dụng!".

### TC-03: Kiểm tra định mức (Quota 3 ca/tuần)
- **Given:** Nhóm `IoT Team` đã đăng ký thành công 3 ca trong tuần hiện tại (bất kỳ Zone nào).
- **When:** Nhóm `IoT Team` thực hiện đăng ký thêm ca thứ 4 trong tuần đó.
- **Then:**
  - ✓ Hệ thống hiển thị thông báo lỗi: "Nhóm của bạn đã vượt quá giới hạn đặt lịch trong tuần này (Tối đa 3 ca/tuần)!".

### TC-04: Đánh giá trải nghiệm & Đồng bộ Dashboard
- **Given:** Ca học của nhóm `VEX Team` đã hoàn thành (`status = completed`).
- **When:** Học sinh điền đánh giá 5 sao kèm bình luận "Rất tốt" và gửi.
- **Then:**
  - ✓ Dữ liệu đánh giá được lưu lại trong LocalStorage.
  - ✓ Chuyển sang vai trò Giáo viên, Dashboard cập nhật số liệu: Tần suất tuần, Tỷ lệ Zone, và xếp hạng của nhóm `VEX Team`.
