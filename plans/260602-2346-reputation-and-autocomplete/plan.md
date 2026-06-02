# Plan: Reputation System & Autocomplete
Created: 2026-06-02T23:46:00Z
Status: 🟡 In Progress

## Overview
Nâng cấp hệ thống stem-lab với hai tính năng cốt lõi:
1. **Mô hình 100 Điểm Uy Tín (Credit Score):** Ràng buộc kỷ luật thực hành phòng Lab, tự động khóa đặt lịch nếu uy tín về 0 và bắt buộc giáo viên ghi chú lý do khi xếp loại "Chưa đạt" để thông báo cho học sinh.
2. **Cơ chế Autocomplete & Autofill:** Tự động gợi ý tên các nhóm đã đăng ký trong lịch sử và tự điền tên người đại diện gần nhất để tăng tốc độ đăng ký và giữ đồng nhất tên nhóm.

## Tech Stack
- Frontend UI: HTML/CSS/Vanilla JS (phát triển trực tiếp trên `index.html`, `styles.css` và `js/ui.js`)
- Business Logic: JS Engine (`js/controller.js`, `js/storage.js` sử dụng `LocalStorage`)

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Database & Storage Upgrade | ⬜ Pending | 0% |
| 02 | Business Logic Upgrade (Controller) | ⬜ Pending | 0% |
| 03 | UI Enhancements (ui.js & forms) | ⬜ Pending | 0% |
| 04 | Integration & Verification | ⬜ Pending | 0% |

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
