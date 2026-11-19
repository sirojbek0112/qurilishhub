# QurilishHub — Uzbekistan Construction Ecosystem

Full-stack construction marketplace, smart cost estimator, real-time messaging, and project management platform built for the Uzbekistan construction industry (Uzbek default, Russian, and English; currency in `UZS`).

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Socket.IO Client, jsPDF
- **Backend**: Express 4, TypeScript, Socket.IO, JWT + Refresh Token Rotation, Zod validation, Helmet, Rate Limiting
- **Database**: Embedded SQLite (`node:sqlite`, WAL mode, foreign keys, zero native build deps) for instant local execution + normalized PostgreSQL blueprint in `prisma/schema.prisma`
- **API Docs**: OpenAPI 3.0 live at `/api/docs` and `/api/openapi.json`

## Local Setup & Commands
```bash
npm install
npm run dev      # Starts full-stack Express + Socket.IO + Vite server on port 3000
npm run lint     # TypeScript type checking (tsc --noEmit)
npm test         # Runs automated API & RBAC integration tests
npm run build    # Builds frontend bundle into dist/
npm start        # Runs production server (NODE_ENV=production)
```

## Demo Accounts (Password: `Password123!`)
- **Customer**: `customer@qurilishhub.uz`
- **Seller**: `seller@qurilishhub.uz`
- **Contractor**: `contractor@qurilishhub.uz`
- **Architect**: `architect@qurilishhub.uz`
- **Company**: `company@qurilishhub.uz`
- **Admin**: `admin@qurilishhub.uz`

## Payment Integration Notice
Click, Payme, and Uzum Bank flows run in **Sandbox Mode** (`PAYMENT_MODE="sandbox"`) with HMAC webhook verification simulation. No raw bank card details are collected or stored.
