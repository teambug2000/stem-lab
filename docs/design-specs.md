# 🎨 DESIGN SPECIFICATIONS: stem-lab

Tài liệu này xác định các quy chuẩn thiết kế giao diện (UI Design System) cho Web App **stem-lab** nhằm đảm bảo giao diện đẹp mắt, nhất quán và mang phong cách công nghệ cao (Premium Glassmorphism).

---

## 1. Bảng Màu (Color Palette)

Hệ thống sử dụng các biến CSS Custom Properties để định nghĩa bảng màu:

| Tên biến CSS | Mã Màu (Hex / RGBA) | Vai trò |
|--------------|---------------------|---------|
| `--bg-main` | `#080c14` | Nền chính của toàn bộ Web App |
| `--bg-surface` | `rgba(20, 26, 42, 0.6)` | Nền của các thẻ (Card), Bảng biểu (Glassmorphism) |
| `--bg-surface-hover` | `rgba(30, 39, 62, 0.8)` | Trạng thái hover của các thẻ |
| `--border-color` | `rgba(255, 255, 255, 0.08)` | Viền mảnh của các thẻ lớp kính |
| `--border-glow` | `rgba(99, 102, 241, 0.2)` | Đường viền phát sáng khi được focus hoặc chọn |
| `--text-primary` | `#f8fafc` | Màu chữ chính, độ hiển thị cao |
| `--text-secondary` | `#94a3b8` | Màu chữ phụ, mô tả ngắn |
| `--text-muted` | `#64748b` | Chữ bị mờ hoặc chú thích |

### Màu nhận diện các Zone:
- `--zone-green`: `#10b981` (Emerald Green) - Green Zone
- `--zone-yellow`: `#f59e0b` (Amber Yellow) - Yellow Zone
- `--zone-red`: `#ef4444` (Rose Red) - Red Zone
- `--zone-blue`: `#3b82f6` (Royal Blue) - Open Lab

### Màu trạng thái ca học (Booking Statuses):
- `--status-pending`: `#eab308` (Màu vàng - Chờ duyệt)
- `--status-approved`: `#10b981` (Màu xanh lá - Đã duyệt)
- `--status-inuse`: `#06b6d4` (Màu xanh cyan - Đang sử dụng)
- `--status-completed`: `#64748b` (Màu xám - Đã hoàn thành)
- `--status-rejected`: `#f43f5e` (Màu đỏ - Bị từ chối)

---

## 2. Hệ Thống Font & Typography

Sử dụng Google Font **Outfit** hoặc **Inter** mang phong cách công nghệ, bo góc hiện đại.

- **Font Family:** `'Outfit', 'Inter', system-ui, sans-serif`
- **Cỡ chữ & Độ đậm:**
  - `Title chính`: `32px` | Extra Bold (700) | Line-height: `1.2`
  - `Section Heading`: `20px` | Semi Bold (600) | Line-height: `1.4`
  - `Body Text`: `15px` | Regular (400) | Line-height: `1.6`
  - `Small/Label`: `13px` | Medium (500) | Line-height: `1.5`

---

## 3. Quy chuẩn Hiệu ứng (Effects & Glassmorphism)

Để đạt hiệu ứng kính mờ (Glassmorphism) chuẩn, áp dụng các thuộc tính CSS sau:

- **Độ mờ hậu cảnh (Backdrop Blur):** `backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`
- **Bóng đổ (Box Shadow):**
  - Card thường: `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);`
  - Modal nổi: `box-shadow: 0 20px 50px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);`
- **Bo góc (Border Radius):**
  - Thẻ thông tin (Card): `16px` (`border-radius: 16px;`)
  - Nút bấm, ô nhập liệu (Button, Input): `8px` (`border-radius: 8px;`)
  - Ô lịch trên Grid: `12px` (`border-radius: 12px;`)

---

## 4. Hiệu Ứng Chuyển Động (Transitions & Animations)

- **Hover nút/ô lịch:**
  - `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);`
  - Hiệu ứng: Phóng to nhẹ (`transform: scale(1.02);`), tăng độ sáng viền và độ mờ kính.
- **Hiện Modal:**
  - Hiệu ứng Fade In và Scale Up từ `0.95` lên `1` trong `0.3s`.

---

## 5. Bố Cục Trang Trực Quan (Layout CSS Grid & Flex)

### Lịch biểu Grid (Calendar Grid):
```css
.calendar-grid {
  display: grid;
  grid-template-columns: 100px repeat(4, minmax(180px, 1fr)); /* 1 cột giờ + 4 cột Zone */
  gap: 12px;
}
```

### Dashboard Giáo viên Layout:
- Sử dụng CSS Grid 2 cột: Cột trái vẽ biểu đồ hoạt động, cột phải hiển thị biểu đồ tỷ lệ Zone và bảng Top nhóm sử dụng nhiều nhất.
