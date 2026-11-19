# QurilishHub — System Architecture & Implementation Blueprint

## 1. Platform Overview
QurilishHub is a multi-role construction marketplace and project management platform designed for the Uzbekistan construction market (`UZ`, `RU`, `EN` localization, `UZ` default, all prices in `UZS`).

## 2. Core Modules
- **Auth & RBAC (`server/auth.ts`, `server/routes/auth.ts`)**: `bcryptjs` password hashing, JWT access tokens + rotating refresh tokens stored hashed in `refresh_tokens`, and backend role enforcement across `CUSTOMER`, `SELLER`, `CONTRACTOR`, `ARCHITECT`, `COMPANY`, and `ADMIN`.
- **Marketplace (`server/routes/marketplace.ts`)**: Product catalog, inventory tracking, region/category/price filtering, price comparison across Uzbekistan suppliers, services & contractor portfolios, companies & employees, architects, favorites, and verified reviews.
- **Construction Project Management (`server/routes/projects.ts`)**: Project creation, member/contractor assignment, task workflow (`TODO -> IN_PROGRESS -> REVIEW -> COMPLETED -> CANCELLED`), progress photo updates, expense ledger, contracts, and documents.
- **Smart Construction Estimate Calculator (`server/calculator.ts`)**: Regional Uzbekistan cost multipliers, itemized material quantities & UZS pricing, editable admin/company coefficients, PDF export (`jspdf`), and clear preliminary-estimate disclaimers.
- **Orders & Sandbox Payments (`server/routes/orders.ts`)**: Multi-seller atomic checkout with stock deduction, order status lifecycle (`PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`), and extensible Click / Payme / Uzum Bank sandbox payment + HMAC webhook verification (zero raw card storage).
- **Real-Time Chat & Notifications (`server/socket.ts`, `server/routes/chat.ts`)**: Socket.IO WebSocket server on port 3000 with JWT handshake, room isolation (`conv:<id>`), live presence, read receipts, and unread counters.
- **Admin & Moderation (`server/routes/admin.ts`)**: Platform analytics, user/role administration, company verification, product moderation, complaint resolution, platform settings, and audit logging.
- **OpenAPI 3.0 Documentation (`server/openapi.ts`)**: Served live at `/api/docs` and `/api/openapi.json`.
