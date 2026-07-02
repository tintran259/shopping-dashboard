# LATA's Đà Lạt · Back Office (BO)

Admin panel (ReactJS) để quản trị hệ thống thương mại điện tử **LATA's Đà Lạt**.
BO tiêu thụ REST API NestJS có sẵn (port **3002**) — không tự tạo backend.

## Tech stack

- React 19 + Vite + TypeScript (strict)
- React Router (data router) — routing + route protection
- Tailwind CSS v4 + shadcn/ui (design system)
- TanStack React Query — toàn bộ server state
- Zustand — client state (auth token, UI) — không duplicate server state
- react-hook-form + zod — form & validation
- axios wrapper với interceptor Bearer + xử lý 401

## Bắt đầu

```bash
cp .env.example .env          # VITE_API_URL=http://localhost:3002/api
npm install
npm run dev                   # http://localhost:3003
```

> Nếu `npm install` báo lỗi `EACCES` ở `~/.npm/_cacache` (cache lẫn quyền user
> khác), chạy 1 lần: `sudo chown -R $(whoami) ~/.npm` — hoặc thêm cờ
> `--cache <thư-mục-ghi-được>`.

Scripts: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`.

## Kiến trúc (feature-based, bulletproof-react)

```
src/
  app/         router, providers, layouts, ProtectedRoute, sidebar/topbar
  components/  ui/ (shadcn)  shared/ (DataTable, StatusBadge, FormField, …)
  config/      env, query-client, nav
  lib/         api-client (axios interceptors), api-error, format, utils
  stores/      auth-store, ui-store (Zustand)
  types/       enums mirror BE + PaginatedResult<T>
  features/<domain>/  api · hooks · components · pages · types · index.ts
```

Luật: 1 feature = 1 domain; không import chéo sâu (chỉ qua `index.ts`);
server state = React Query, client state = Zustand;
flow: `Component → hook (React Query) → api function → api-client`.

## Trạng thái các module

| Feature | Mức độ | Ghi chú |
|---|---|---|
| auth | ✅ đầy đủ | login + `/auth/me`, chỉ role `admin` vào được BO |
| orders | ✅ **end-to-end** | list · detail · đổi trạng thái · confirm-payment · hủy |
| catalog (products) | ✅ **end-to-end** | list · create/edit + options + variants + images |
| catalog (categories/brands) | ✅ | list + tạo + xóa |
| dashboard | ✅ | tổng hợp từ `/orders/admin/all` (BE chưa có endpoint riêng) |
| inventory (branches) | ✅ | CRUD chi nhánh |
| inventory (stock) | ✅ | tra cứu & chỉnh tồn theo variant × branch (reserve→commit) |
| vouchers | ✅ | list + tạo + xóa |
| locations | ✅ | provinces/wards + sync |
| customers | 🟡 khung | BE mới có `/me/*`, chưa có admin list |
| reviews | 🟡 khung | BE chưa có endpoint duyệt/ẩn cho admin |

## Nguyên tắc nghiệp vụ được tôn trọng

- **BE là chân lý về tiền & tồn kho** — FE chỉ hiển thị/validate, không tự tính lại.
- Tồn kho theo **reserve → commit → release**: `available = quantity − reserved`.
  BO chỉ gọi đúng endpoint (đổi trạng thái đơn, confirm-payment, cancel); tồn
  kho do BE tự điều chỉnh.
- Hủy đơn chỉ hợp lệ khi chưa giao — BE chặn nếu không hợp lệ; BO **hiển thị
  message BE nguyên văn** (toast / ErrorState).

## Lệch so với đề bài (phát hiện từ source BE, BE là source of truth)

1. Admin list đơn: `GET /orders/admin/all`, DTO chỉ nhận `page/limit/q`
   (`forbidNonWhitelisted`) → filter status/payment/branch làm **client-side**.
2. Sort products dùng `sort=field:DIR` (không phải `sortBy/sortOrder`);
   `GET /products` trả `{ items, pagination, facets }` (không phải `{data, meta}`).
3. `customers`/`reviews` chưa có endpoint admin → tạo khung + chú thích.
