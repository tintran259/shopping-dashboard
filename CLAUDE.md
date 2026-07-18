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
├── routes/               # router.tsx (data router) + paths.ts (ROUTES) + route guards
│                         #   (protected-route, permission-route, not-found-page)
├── providers/            # index.tsx = AppProviders (QueryClientProvider, ThemeProvider, Toaster)
├── layouts/              # dashboard-layout + shell UI (sidebar, topbar, account-menu, theme-toggle)
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

> **No `src/app/` shell** — it was split into `routes/` + `providers/` + `layouts/`
> (router/paths import from `@/routes/*`, providers from `@/providers`, shell from
> `@/layouts/*`). Dependency direction stays one-way: `routes → layouts → features → components/lib`.

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
| Categories | `GET /categories`, `GET /categories/:id`, `POST`*, `PATCH /:id`*, `PATCH /reorder`*, `DELETE /:id`* | old path, per-method guard; tree max 3 levels, cached, see domain rules |
| Category attributes | `GET /categories/:id/attributes`, `POST`*, `PATCH /:id`*, `DELETE /:id`* | filter *templates* for a leaf category, not product values |
| Brands | `GET /brands`, `GET /brands/:id`, `POST`*, `PATCH /:id`*, `DELETE /:id`* | old path, per-method guard |
| Branches | `GET /branches`, `POST /branches`*, `PATCH /branches/:id`*, `DELETE /branches/:id`* | old path, per-method guard; `ghnShopId` = which GHN shop this branch ships from; `ghtkPickupDistrict`/`ghtkPickupWard` = GHTK pickup address |
| Inventory | `GET /branches/inventory/variant/:variantId`, `PUT /branches/inventory`* | stock per variant × branch; PUT upserts |
| Orders | `GET /admin/orders`* (filter/search/sort/paginate), `GET /admin/orders/:id`*, `PATCH /admin/orders/:id/status`*, `POST /admin/orders/:id/confirm-payment`*, `POST /admin/orders/:id/cancel`*, `GET`/`PUT /admin/orders/:id/shipment`*, `POST /admin/orders/:id/shipment/ghn`*, `POST /admin/orders/:id/shipment/ghtk`*, `POST /admin/orders/:id/shipment/mock-webhook`* | class-level admin guard, no ownership check; `shipment/ghn`\|`ghtk` explicitly create a real carrier shipping order (admin-triggered); `mock-webhook` simulates a carrier webhook for local testing (see order/stock rules) |
| GHN/GHTK webhooks | `POST /webhooks/ghn`, `POST /webhooks/ghtk` | public, called by the carrier itself — not admin routes |
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

### Shipment tracking (carrier/tracking no) — supplementary, not a status gate

- `GET`/`PUT /admin/orders/:id/shipment` (`ShipmentsService`, `shopping-api`) is independent
  of `Order.status` — filling in a carrier/tracking number never changes, and is never
  required by, the order's own pending→…→delivered flow. It's purely informational (which
  courier, tracking no, fee), upserted as one row per order.
  `ShipmentStatus` = pending, shipped, delivered is its **own** separate status, auto-stamping
  `shippedAt`/`deliveredAt` the first time it enters that value (not overwritten after).
- `carrier` is free text on the BE by design (not an enum) — the FE offers a preset dropdown
  (Tự giao + common VN couriers: GHN, GHTK, Viettel Post, VNPost, J&T Express, Ninja Van, BEST
  Express, Grab Express, AhaMove) plus "Khác" for anything else, so a new courier never needs
  a BE code change. Manual entry always works for any of these; **GHN and GHTK specifically
  also have real API integrations** — see below.

### Carrier API integrations (GHN, GHTK) — explicit create, webhook status sync

- **Creating a real shipping order is an explicit admin action, not automatic.** `POST
  /admin/orders/:id/shipment/ghn` (`GhnService.createShippingOrder`) and `POST
  /admin/orders/:id/shipment/ghtk` (`GhtkService.createShippingOrder`, `shopping-api`) each
  call that carrier's real API and throw a real error on failure (surfaced verbatim to the
  admin) — the FE only shows these actions once the order has reached `PROCESSING`. This used
  to auto-fire GHN silently on every transition to `PROCESSING`, but that assumed every
  delivery order ships via GHN; once GHTK became a second real option, the admin has to pick
  which carrier to actually call instead of the BE guessing — don't reintroduce an implicit
  auto-fire without re-solving that conflict.
- **The FE shows a confirmation modal before calling either endpoint**
  (`CreateShipmentDialog`, `shipment-card.tsx`) — since this is a real 3rd-party API call, not
  a local record, the admin sees exactly what will be sent first: sender (branch name/phone/
  address/pickup ward-district for GHTK), receiver (recipient name/phone/full address), package
  (item list, declared value, COD amount vs. "already paid"), plus the one carrier-specific
  input (GHTK's delivery district; GHN's optional shipper note). Don't shrink this back down to
  a bare button — the whole point is showing the real payload before it goes out.
- **GHN also accepts an optional shipper note** (`CreateGhnShipmentDto.note`, GHN's own `note`
  field) — the only thing GHN's create form asks the admin for, since everything else is
  derived automatically (address resolver, branch shop id, item weights/prices/SKUs).
- **Both throw `BadRequestException`/`BadGatewayException` on failure** (missing token, branch
  not configured, carrier API down) — unlike a webhook, an explicit click has an admin waiting
  for the result, so don't wrap these in try/catch-and-log; let errors propagate to the
  controller.
- **Each carrier's webhook status vocabulary is far richer than our 3-value `ShipmentStatus`**
  — `Shipment.carrierStatusRaw` always records the carrier's exact status string/id verbatim;
  only some values map onto our coarse enum (`GHN_STATUS_MAP`/`GHTK_STATUS_MAP` in
  `carrier-status-maps.ts`, passed into `ShipmentsService.handleCarrierUpdate`) so a parcel is
  never silently marked "delivered" when the truth is more nuanced (a failed delivery attempt,
  a return in progress, etc).
- **Weight comes from `ProductVariant.weightGram`** (admin-entered, per variant — or
  `singleWeightGram` for a no-variant product), summed across order items with a
  `DEFAULT_ITEM_WEIGHT_GRAM` (200g) fallback for anything not yet filled in, so an order can
  still ship rather than blocking on missing data. GHTK wants kilograms, GHN wants grams —
  each service does its own conversion.
- **GHN's request/response shapes are transcribed straight from GHN's own "Create Order" docs**
  (`ghn-client.ts`, fetched from api.ghn.vn — not guessed), not just the minimal fields: also
  sends `from_name/from_phone/from_address` (sender), `length/width/height` (package dims —
  no per-product dimension data exists anywhere in this system, so a fixed small-parcel
  default is used, same fallback spirit as the weight default), `insurance_value` (declared
  value), and per-item `code`/`price` (SKU/unit price). The response type mirrors GHN's real
  schema too (`sort_code`, `trans_type`, `fee` breakdown, etc), not just `order_code`/`total_fee`.
- **GHN**: address resolution is a real architecture bridge, not a simplification you can
  remove — this codebase models Vietnam's 2025 2-tier administrative reform (province → ward,
  no district — see `locations` module), while GHN's own API still expects a `district_id`.
  `GhnAddressResolver` brute-force-searches every district in the matched province for a
  ward-name match (cached per province after the first resolution) — there is no district data
  to look it up directly. Ships from whichever GHN "shop id" the branch is configured with
  (`Branch.ghnShopId`) — the pickup address itself lives in GHN's own merchant dashboard
  against that shop id, not in our system. Falls back to `GHN_DEFAULT_SHOP_ID` env var if a
  branch has none.
- **GHTK**: its address fields are plain Vietnamese admin-division **names** (not codes), and
  its pickup fields (`pick_name/address/tel`) come straight from the branch — but it still
  needs a **district** name for both pickup and delivery, which our `locations` module can't
  provide at all (same 2025-reform gap as GHN, but GHTK has no numeric-ID resolver to bridge
  it). The pickup side is a per-branch constant, so it's configured once on the branch
  (`Branch.ghtkPickupDistrict`/`ghtkPickupWard`, editable in the branch form); the delivery
  side genuinely varies per order and can't be derived, so it's the one field the admin types
  on the "Tạo vận đơn GHTK" form (`CreateGhtkShipmentDto.district`). Don't try to auto-fill it
  from GHN's master data or any other guess — get it from the admin.
- **Webhooks** (`POST /webhooks/ghn`, `POST /webhooks/ghtk`, both `@Public()`) accept a raw
  object rather than a whitelisted DTO on purpose: each carrier sends many more fields than we
  read, and the global `ValidationPipe`'s `forbidNonWhitelisted: true` would otherwise reject
  the whole payload over fields we don't model. GHTK's docs state it only treats HTTP 200 as
  success (anything else triggers a retry) — hence the explicit `@HttpCode(200)` on that one.
- ⚠️ **Re-verify against a real account before relying on this in production.** GHN's client
  (`ghn-client.ts`) was built without live sandbox access — best-effort from GHN's documented
  v2 API. GHTK's client (`ghtk-client.ts`) was built from GHTK's public docs (a more solid
  starting point), but is still unverified against a real token/account — docs can drift from
  the live API.
- **Mock mode — swap in the token, nothing else changes.** With `GHN_TOKEN`/`GHTK_TOKEN` unset,
  `GhnClient`/`GhtkClient` return a canned fake response (`order_code`/`label` prefixed
  `MOCK-GHN-`/`MOCK-GHTK-`) instead of calling the real API — logged loudly every time
  (`[MOCK] ... chưa cấu hình`) so it's never mistaken for a real success in a log stream.
  `GhnAddressResolver` checks `GhnClient.isMockMode` and skips the real province/district/ward
  search entirely (returns a fixed fake `{ districtId: 0, wardCode: 'MOCK_WARD' }`) since those
  fake IDs are only ever fed back into the (also mocked) create-order call. The instant a real
  token is set, both classes call the real API automatically — **no other code needs to
  change** to go live; this is the only thing gating mock vs. real. Don't add a separate
  `GHN_MOCK`/`GHTK_MOCK` flag — the empty token *is* the flag, by design.
- **Simulating the carrier's webhook** (`POST /admin/orders/:id/shipment/mock-webhook`,
  `ShipmentsService.simulateCarrierWebhook`) exists because GHN/GHTK can't reach `localhost` to
  call the real webhook during local dev — it reuses `handleCarrierUpdate` directly (the exact
  same code path a real webhook hits), keyed off `Shipment.carrier` to pick the right status
  map from `CARRIER_STATUS_MAPS`. Throws if the shipment has no `trackingNo` yet, or if
  `carrier` isn't one of the API-integrated ones (e.g. a manual courier — nothing to simulate).
  The FE only shows the trigger (`MockWebhookTrigger` in `shipment-card.tsx`) when
  `trackingNo` starts with `MOCK-`, so it naturally disappears once real shipments start
  flowing in — this is a testing convenience, not a general "replay a missed webhook" tool
  (use the manual-entry fallback for that).

### Categories: tree depth cap, leaf-only products, reordering

- **3 levels max: root → child → grandchild.** A grandchild is always a leaf —
  it can never have its own children. Enforced in `CategoriesService`
  (`shopping-api`, `assertValidParent`), not the schema; the BE also rejects
  re-parenting a category under its own descendant (cycle). The FE mirrors
  the same depth/cycle checks in `lib/category-tree.ts` (`categoryDepth`,
  `isSelfOrDescendant`) purely to grey out invalid parent choices in the
  form — the BE check is the real guard.
- **Products attach only to leaf categories** — whichever node in a branch
  has no children, root included if that branch was never split into
  sub-groups. The product form's category picker only ever offers leaves,
  each labeled with its full breadcrumb path (`categoryPath`) since a bare
  leaf name loses the hierarchy context.
- **`productsCount` on `GET /categories` is direct-only** (0 for non-leaf
  nodes, since products never attach there). The category list page rolls
  this up across a subtree client-side (`productsCountRollup`) — the BE
  intentionally doesn't run a recursive query for this.
- **Reordering is one request for the whole drag-and-drop batch:**
  `PATCH /categories/reorder` with `{ items: [{ id, sortOrder }] }`. Never
  fire one `PATCH /categories/:id` per moved row — that was the original
  (fixed) implementation and it spammed both the network tab and the
  success-toast.
- **Clearing an existing parent (move a category back to root) needs an
  explicit `parentId: null`, not `undefined`.** `JSON.stringify` drops
  `undefined` keys entirely, so the BE never receives the field and leaves
  the old parent untouched — this was a real bug caught by
  `categories.service.spec.ts`'s "leaves the parent untouched when omitted"
  vs "clears parent when null" pair of tests.
- **UI is an inline accordion, not drill-down navigation.** Clicking an
  expandable category (depth < 2) reveals its children indented directly
  below it, with an "add subcategory" row after them — not a breadcrumb/
  replace-the-list navigation. Add/edit is a centered modal (`Dialog`), not
  a slide-over panel.
- **SEO** (`seo.metaTitle`/`seo.metaDescription`) is a loose jsonb bag on
  `Category`, same pattern as `products.seo` — set it via an explicit
  `seo: null` to clear (same `undefined`-gets-dropped gotcha as `parentId`
  above), never `seo: undefined`.
- **Category attribute templates are definitions only, not values.**
  `CategoryAttribute` (`category_attributes` table, `/categories/:id/attributes`)
  lets an admin declare a leaf category's expected filters (e.g. "Size" as a
  SELECT with options S/M/L) — it does **not** feed the product form or the
  storefront yet, and must not be confused with `ProductAttribute` (an
  unrelated, pre-existing free-form key/value already filled in per product).
  Only leaf categories (no children) can have templates — the kebab menu
  hides "Thuộc tính lọc" for anything with subcategories.
- **`GET /categories` is cached in-memory** (`CategoriesService`, single
  process, invalidated synchronously on every write) since the full list is
  read far more often than it's written and pays for a correlated
  `productsCount` subquery per row. Don't add a second cache layer on top of
  this without removing it first — a multi-instance deployment would need a
  shared cache (Redis) instead, not both.

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
