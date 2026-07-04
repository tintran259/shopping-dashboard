# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**shopping-dashboard** — the Back Office (admin dashboard) for the "LATA'S Đà Lạt" commerce
platform (Đà Lạt specialty foods, B2C + B2B). It is a **standalone ReactJS SPA** that
administers the system by consuming the existing REST API (`shopping-api`, NestJS). It has
**no backend of its own** and shares no code with the other repos — the API is the only
integration point.

Sibling repos (context only, do not import from them):

| Repo | Role |
| ---- | ---- |
| `shopping-api` | NestJS + PostgreSQL commerce backend — **source of truth** |
| `shopping` | Next.js customer storefront |
| `shopping-cms` | Strapi (marketing content only) |

**Golden rule:** the API owns all money and stock logic. The BO **displays and validates for
UX only** — never recompute totals or mutate inventory client-side. Always send the number the
API returns; on conflict, the API wins.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Build | Vite 6 |
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Routing | React Router v7 (`react-router-dom`, data router) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| UI Components | shadcn/ui (Radix + CVA + `lucide-react` icons) |
| Server State | TanStack React Query (+ devtools) |
| Client State | Zustand |
| Forms | react-hook-form + zod (`@hookform/resolvers`) |
| HTTP | axios (single wrapper with auth interceptor) |
| Toasts | sonner |
| Theme | next-themes (dark mode) |

Import alias: `@/*` → `src/*` (tsconfig paths). Dev server runs on port **3003**.

## Commands

| Task | Command |
| ---- | ------- |
| Install | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |

Environment variables (Vite, `import.meta.env`) — access through a typed `env` object in
`src/config/env.ts`, never `import.meta.env` directly:

```
VITE_API_URL=http://localhost:3002/api   # shopping-api base (Swagger at /api/docs)
```

## Architecture — Feature-Based (bulletproof-react)

The most widely-used React convention, and consistent with the storefront's `features/`.

```
src/
├── app/                  # app shell: router, providers, layouts
│   ├── routes/           # route tree (React Router data router)
│   ├── providers.tsx     # QueryClientProvider, ThemeProvider (next-themes), sonner Toaster
│   └── app.tsx
├── features/             # ONE feature = ONE business domain (not one screen)
│   └── orders/
│       ├── api/          # React Query hooks (useOrders, useUpdateOrderStatus…)
│       ├── components/    # UI private to the feature
│       ├── hooks/
│       ├── types/
│       └── index.ts      # the feature's PUBLIC surface (barrel)
├── components/
│   ├── ui/               # shadcn/ui primitives
│   └── shared/           # DataTable, StatusBadge, ConfirmDialog, Pagination, FormField…
├── lib/                  # api-client (axios), utils, dates, query-client
├── hooks/                # shared hooks
├── stores/               # Zustand (auth, ui) — client state only
├── config/               # typed env, constants (enum labels)
└── types/                # global types
```

### Binding rules

- **One feature = one business domain.** A screen is not a feature; `orders`, `catalog`,
  `inventory` are.
- **No deep cross-feature imports.** Features talk to each other only through
  `features/<x>/index.ts`. Dependency direction is one-way: `app → features → components/lib`.
  Never `lib → features` or feature ↔ feature internals.
- **Server state = React Query, client state = Zustand.** Do not duplicate server state in
  Zustand. Flow is always `Component → hook (React Query) → api function → api-client`.
- **Never call the API inside a component.** It goes through a feature `api/` hook.
- **All filtering is server-side — no exceptions.** Search, status/category/branch dropdowns,
  date range, sort, pagination: every one of them is a query param sent to the BE endpoint.
  Never fetch a list then narrow it with client-side `.filter()`/`.sort()`/slicing — if the BE
  doesn't yet support a filter you need, add the query param to the BE first (see
  `admin-order-query.dto.ts` / `admin-order-summary-query.dto.ts` for the pattern), don't
  work around it in the FE. This applies to every list screen (Orders, Products, future Order
  create's product picker, etc.), not just the ones that exist today.
- Files kebab-case; components PascalCase; hooks `useXxx`.

## API Integration

- Base URL `VITE_API_URL` (default `http://localhost:3002/api`). Interactive docs: `/api/docs`
  (Swagger) — the authoritative field reference.
- **Auth:** JWT Bearer. `POST /auth/login` → token; store in Zustand (persisted). The axios
  wrapper attaches `Authorization: Bearer <token>`; a `401` clears auth and redirects to
  `/login`. **Only `role === "admin"` may enter the BO** — gate every route except `/login`,
  and verify the role from `GET /auth/me` after login.
- **Pagination (all list endpoints):** query `page`, `limit`, `sortBy`, `sortOrder`
  (defaults `page=1`, `limit=20`, max `limit=100`). Response:
  `{ data: T[], meta: { page, limit, total, pageCount } }`.
- **Errors:** surface the API message verbatim (it may be a `string` or `string[]` — take the
  first). Business errors (e.g. an order that can't be cancelled) come back as `400` with a
  Vietnamese message.

### Admin route convention (BO ↔ SF separation)

- **New admin endpoints live under `/admin/<resource>`** in their own
  `admin-<resource>.controller.ts`, with the role guard at **class level**
  (`@UseGuards(RolesGuard) @Roles(ADMIN) @ApiBearerAuth()`) so no route can forget it.
  Admin controllers return **raw entities** (edit forms need the raw shape), not
  storefront DTOs. Public/storefront routes stay on their existing paths.
- **Migrate only where it fixes a real problem, not for uniformity.** `orders`
  (`/admin/orders/*`) and `products` (`/admin/products/*`) were split because it fixed
  concrete bugs (admin 403 on order detail/cancel; product form couldn't read raw
  `basePrice`). `categories`, `brands`, `branches`, `inventory`, `vouchers`,
  `locations/sync` deliberately stay on their old paths with per-method `@Roles` —
  they have no such bug, so moving them is pure churn. Standardize one when you next
  touch it, not in bulk.

### Route → endpoint map (admin-relevant)

| BO area | Endpoint(s) | Notes |
| ------- | ----------- | ----- |
| Login | `POST /auth/login`, `GET /auth/me` | admin-only gate |
| Products | `GET /admin/products`*, `GET /admin/products/:id`*, `POST /admin/products`*, `PATCH /admin/products/:id`*, `DELETE /admin/products/:id`* | raw entities; `GET /products*` stays public storefront |
| Categories | `GET /categories`, `GET /categories/:id`, `POST`*, `PATCH /:id`*, `DELETE /:id`* | old path, per-method guard |
| Brands | `GET /brands`, `GET /brands/:id`, `POST`*, `PATCH /:id`*, `DELETE /:id`* | old path, per-method guard |
| Branches | `GET /branches`, `POST /branches`*, `PATCH /branches/:id`*, `DELETE /branches/:id`* | old path, per-method guard |
| Inventory | `GET /branches/inventory/variant/:variantId`, `PUT /branches/inventory`* | stock per variant × branch; PUT upserts |
| Orders | `GET /admin/orders`* (filter/search/sort/paginate), `GET /admin/orders/:id`*, `PATCH /admin/orders/:id/status`*, `POST /admin/orders/:id/confirm-payment`*, `POST /admin/orders/:id/cancel`* | class-level admin guard, no ownership check; see order/stock rules |
| Vouchers | `GET /vouchers`*, `POST`*, `PATCH /:id`*, `DELETE /:id`* | `GET /vouchers/validate` is public |
| Locations | `GET /locations/provinces`, `GET /locations/provinces/:code/wards`, `POST /locations/sync`* | address data |
| Search | `GET /search` | product lookup for pickers |

`*` = requires `@Roles(admin)`.

### Not yet exposed by the API (do NOT invent client-side)

Confirm/extend the BE before building these; stub the UI otherwise:

- **Dashboard aggregates** (revenue, order counts) — no summary endpoint yet; derive from
  `GET /orders/admin/all` only as an interim, or add a BE endpoint.
- **Customer management** — only self endpoints exist (`/me/...`); there is no admin customer
  list. Pending BE.
- **Review moderation** — only `GET /reviews/product/:productId` + `POST /reviews`; no
  approve/hide endpoint. Pending BE.

## Domain Rules (must respect — API is source of truth)

### Inventory: reserve → commit → release

- Two counters per (variant × branch): **`quantity`** (physical) and **`reserved`** (held by
  unfulfilled orders). **`available = quantity − reserved`** — show `available` everywhere;
  never let the admin edit `reserved` directly.
- The BO changes stock **only** via `PUT /branches/inventory` (restock/adjust physical
  quantity). It must **not** try to reconcile reservations by hand.

### Order status ↔ stock (BO triggers, BE moves stock)

- `PATCH /orders/:id/status` and `POST /orders/:id/confirm-payment` change fulfilment/payment;
  the BE moves stock accordingly (DELIVERED / confirm-payment → **commit** → `quantity`
  drops; CANCELLED → **release/restock**). The BO just calls the endpoint and refetches.
- **Cancel** (`POST /orders/:id/cancel`) is only valid before an order ships; the BE rejects
  invalid transitions with a message — display it. On success, invalidate order + product
  queries (stock returned).
- Enum values (label them in `config/`): `OrderStatus` = pending, confirmed, processing,
  shipped, delivered, cancelled · `PaymentStatus` = pending, paid, failed, refunded ·
  `ProductStatus` = active, draft, preorder, out_of_stock, discontinued · `InventoryStatus`
  = in_stock, preorder, out_of_stock · `FulfillmentType` = delivery, pickup.

## UI / UX Conventions

- **Loading:** skeletons for list/detail; hold the loading state until data is ready so stale
  values never flash as errors.
- **Tables:** server-side sort/filter/pagination via the shared `DataTable` — every filter is
  a BE query param, never a client-side narrow of an already-fetched page; always provide
  empty and error states. Debounce free-text search inputs (~300-400ms) before it hits the
  query so typing doesn't fire an API call per keystroke.
- **Mutations:** optimistic update + rollback on error; toast on success/failure; confirm
  destructive actions with `ConfirmDialog`.
- **Forms:** zod schemas, inline field errors, disable submit while pending.
- Responsive + dark mode. All UI copy in **Vietnamese**.

## Code Generation Rules

When generating code:

- Follow the feature-based structure and the one-way dependency rule above.
- One Feature = One Business Domain; expose it via `index.ts`.
- Server state → React Query; client state → Zustand; never call the API in a component.
- TypeScript strict, no `any`; reuse `components/shared` primitives (DataTable, StatusBadge,
  ConfirmDialog, Pagination, FormField).
- Respect the domain rules (reserve→commit, order-status↔stock, admin-only) — the BO never
  owns money/stock logic.
- Production-ready code only. Before scaffolding, print: (a) the folder tree, (b) the route
  list, (c) the route → endpoint mapping.
