# Client & Booking Manager

A booking, CRM, and invoicing tool for small service businesses (salons, trainers, contractors, consultants).

## Status: core loop working end to end

Signup → login → add client → book appointment → see it live on the dashboard is fully functional against a real Postgres database (Supabase).

### What's built

**Auth**
- Signup (`/signup`) and login (`/login`) pages, backed by `/api/auth/signup` and `/api/auth/login`
- Passwords hashed with bcrypt, session stored as a signed JWT in an httpOnly cookie
- Logout via `/api/auth/logout`
- Dashboard route is protected server-side — visiting `/dashboard` while logged out redirects to `/login`

**Clients**
- `/dashboard/clients` — list clients, add new ones through a form
- API: `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/[id]`

**Appointments**
- `/dashboard/appointments` — book appointments against a client, pick date/time and duration
- API: `GET/POST /api/appointments`, `PATCH/DELETE /api/appointments/[id]`
- Booking rejects overlapping time slots (returns 409 with a clear error message, surfaced in the UI)

**Invoices (API only, no page yet)**
- API: `GET/POST /api/invoices`, `PATCH /api/invoices/[id]` (mark paid/unpaid)

**Dashboard**
- `/dashboard` — real data: today's appointments, unpaid invoices, revenue this month, total client count
- Empty states for a business with no data yet

### Database

Every table (`Business`, `Client`, `Availability`, `Appointment`, `Invoice`) is scoped by `businessId`, so each signup is a fully isolated tenant — no business can see another's data. See `prisma/schema.prisma`.

## Setup

1. Install dependencies:
```
   npm install
```

2. Create a free Postgres database on [Supabase](https://supabase.com). In the project, click **Connect** (top bar, not Settings) and grab two connection strings:
   - **Transaction pooler** (port 6543) → used by the app at runtime
   - **Session pooler** (port 5432) → used only by Prisma CLI for schema pushes

3. Copy `.env.example` to `.env` and fill in both:
```
   DATABASE_URL="postgresql://postgres.xxxx:password@aws-x-region.pooler.supabase.com:6543/postgres"
   DIRECT_URL="postgresql://postgres.xxxx:password@aws-x-region.pooler.supabase.com:5432/postgres"
   JWT_SECRET="any long random string"
```

4. Push the schema (stop the dev server first if it's running, or you'll hit an EPERM file-lock error on Windows):
```
   npm run db:generate
   npm run db:push
```

5. Run the dev server:
```
   npm run dev
```

6. Visit `http://localhost:3000/signup`, create an account, add a client at `/dashboard/clients`, book an appointment at `/dashboard/appointments`, then check `/dashboard`.

## What to build next (in order)

1. **Invoices UI** — a page to generate an invoice from a completed appointment and mark it paid. This is what will make "Unpaid invoices" and "Revenue this month" on the dashboard mean something real.
2. **Stripe integration** — real payment collection in test mode, tied to invoices.
3. **Public booking page** (`/book/[slug]`) — unauthenticated route where a business's clients can self-book an open slot. This is the strongest differentiator for a portfolio piece — most CRUD tutorials don't have it.
4. **Polish** — responsive design, loading states, seeded demo data, a proper landing page. Do this last, once the features work.

## Known tradeoff: Next.js version

This project is pinned to `next@14.2.35` rather than the current `16.x` line. `npm audit` will show a bundle of high-severity advisories tied to Next 16 — reviewed individually, they apply to self-hosted deployments, custom servers, i18n middleware, and WebSocket upgrades, none of which this app uses (it deploys to Vercel with none of those features). Upgrading to 16 requires adopting async `params`/`searchParams` and the new caching model across every route, which is a deliberate follow-up task rather than something to rush mid-build. Revisit before using this as a template for a client project that does use those features.

## Notes

- Passwords are hashed with bcrypt, never stored in plain text.
- The session is a signed JWT stored in an httpOnly cookie — not accessible to client-side JS, which protects against XSS token theft.
- Appointment booking uses standard interval-overlap logic (`startA < endB AND endA > startB`) to reject double-bookings at the API level, not just in the UI.