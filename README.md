# ⚡ QuickNote Log v2.0.1

Ứng dụng quản lý tiệm cắt tóc — PWA offline 100%, không cần server.

## Tính năng

| Tính năng | Mô tả |
|---|---|
| 🏠 Trang chủ | Doanh thu & lượt khách hôm nay, 5 lượt gần nhất |
| 📅 Lịch sử | Xem theo ngày/7 ngày/tháng/tất cả |
| 📊 Thống kê | Biểu đồ theo ngày, tháng, **từng dịch vụ** |
| ⚙️ Cài đặt | Quản lý dịch vụ, backup/restore |
| 🌙 Dark/Light | Chuyển theme sáng/tối |
| 📷 Ảnh tóc | Chụp ảnh ngay trong form thêm khách |
| 💾 Export/Import | Backup lượt khách + ảnh, backup dịch vụ |
| ✏️ Sửa lượt | Chỉnh ngày giờ, dịch vụ |
| 🗑️ Xóa lượt | Xóa từng lượt hoặc toàn bộ |

## Cấu trúc source

```
src/
├── index.html              # App shell (HTML + inline styles)
├── sw.js                   # Service Worker (offline)
└── js/
    ├── main.js             # Bootstrap, global APP object
    ├── db.js               # IndexedDB layer
    ├── state.js            # App state
    ├── utils.js            # Helpers (format, uuid, resize...)
    ├── toast.js            # Notifications
    ├── theme.js            # Dark/light toggle
    ├── clock.js            # Live clock
    ├── screens/
    │   ├── home.js         # Màn hình trang chủ
    │   ├── history.js      # Màn hình lịch sử
    │   └── summary.js      # Màn hình thống kê
    └── components/
        ├── add-modal.js    # Modal thêm khách (+ ảnh)
        ├── detail.js       # Modal chi tiết / sửa / xóa
        ├── services.js     # Modal quản lý dịch vụ
        ├── data-io.js      # Export/import sessions
        └── lazy-img.js     # Lazy load ảnh từ IndexedDB

dist/                       # Build output (after npm run build)
├── index.html              # Single file, JS inlined & minified
└── sw.js
```

## Phát triển

```bash
# Cài dependencies
npm install

# Chạy dev (cần serve tĩnh, không mở file:// vì module ES)
npx serve src -l 3000
# mở http://localhost:3000
```

## Build production

```bash
npm run build
# → dist/index.html  (single file, minified)
# → dist/sw.js
```

Deploy bằng cách copy thư mục `dist/` lên bất kỳ static host nào
(Netlify, Vercel, GitHub Pages, nginx...).

## Dữ liệu

- **IndexedDB** – lưu hoàn toàn trên thiết bị, không gửi server
- **3 object store:** `sessions`, `services`, `images`
- **Ảnh:** resize xuống 800px, lưu base64 trong store riêng
- **Backup:** xuất/nhập JSON (sessions kèm images, services riêng)
