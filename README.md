# Client & Booking Manager

A booking, CRM, and invoicing tool for small service businesses (salons, trainers, contractors, consultants).

## What's built so far (Phase 1 + start of Phase 2)

- Prisma schema: `businesses`, `clients`, `availability`, `appointments`, `invoices` (see `prisma/schema.prisma`)
- Auth: signup (`/api/auth/signup`) and login (`/api/auth/login`) with hashed passwords + JWT session cookie
- Clients API: list/create (`/api/clients`), get/update/delete (`/api/clients/[id]`)
- Base Next.js app shell (`app/layout.tsx`, `app/page.tsx`)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a free Postgres database — easiest is [Supabase](https://supabase.com) or [Railway](https://railway.app). Copy the connection string.

3. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET`:
   ```
   cp .env.example .env
   ```

4. Push the schema to your database:
   ```
   npm run db:generate
   npm run db:push
   ```

5. Run the dev server:
   ```
   npm run dev
   ```

6. Test the API is working:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Bright Cuts Salon","email":"test@example.com","password":"password123"}'
   ```
   You should get back a JSON response with your new business id and slug.

## What to build next (in order)

1. **Signup/login pages** — `app/signup/page.tsx` and `app/login/page.tsx`. Simple forms that POST to the auth routes above, then redirect to `/dashboard`.
2. **Client list page** — `app/dashboard/clients/page.tsx`. Fetch `/api/clients`, render a table, add a "new client" form/modal that POSTs to the same route.
3. **Availability + appointments API** — mirror the pattern in `app/api/clients/route.ts` for `app/api/appointments/route.ts`. This is the trickiest part logically (checking a slot doesn't overlap an existing appointment) — happy to help design that logic when you get here.
4. **Dashboard page** — build `/api/dashboard/summary` (today's appointments, unpaid total, revenue this month), then wire it to a page using the mockup we designed.
5. **Invoices + Stripe** — generate an invoice from a completed appointment, integrate Stripe Checkout in test mode.
6. **Public booking page** — unauthenticated route at `/book/[slug]` where clients pick an open slot.

## Notes

- Every table has a `businessId` foreign key — this is what makes it multi-tenant. Every API route filters by the logged-in business's id, so businesses can never see each other's data.
- Passwords are hashed with bcrypt, never stored in plain text.
- The session is a signed JWT stored in an httpOnly cookie — not accessible to client-side JS, which protects against XSS token theft.
