# PadelFlow

**The social platform for padel players.** Connect, compete, book, buy, and grow — all in one place.

## What it does

- Player profiles, friends, messaging
- Court discovery and booking
- Event tickets and media
- Product marketplace
- Score tracking and leaderboards
- Coach directory and hiring
- Full settings for every feature

## Account types

| Role | Access |
|---|---|
| Player | Profile, friends, booking, shop, scores, events |
| Court Management | Court listings, availability, bookings dashboard |
| Event/Media Management | Event creation, ticketing, media uploads |
| Admin | Everything above + store management (internal only) |

## Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk
- **Database:** Prisma + Supabase (PostgreSQL)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
- **Payments:** Stripe
- **Real-time:** Pusher (chat)
- **Storage:** Uploadthing (media/avatars)

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in keys — see .env.example for required vars
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **Transaction pooler** URL (port 6543) → `DATABASE_URL`
4. Copy the **Direct connection** URL (port 5432) → `DIRECT_URL`
5. Add `?pgbouncer=true` to the end of `DATABASE_URL`
6. Run `npx prisma migrate dev` to push the schema

> **Why two URLs?** Supabase uses PgBouncer (connection pooler) on port 6543. Prisma needs a direct connection for migrations but the pooler for runtime queries in serverless environments like Vercel.

## Project layout

```
src/
  app/              # Next.js App Router pages
    (auth)/         # Clerk sign-in / sign-up
    (player)/       # Player-facing routes
    (court)/        # Court management routes
    (event)/        # Event/media management routes
    (admin)/        # Admin-only routes
    api/            # Route handlers
  components/       # Shared UI components
  lib/              # Prisma client, utils, auth helpers
  middleware.ts     # Clerk route protection
prisma/
  schema.prisma     # Data model
```

## Security

- All routes protected by Clerk middleware
- Role enforcement via `publicMetadata.role` on every server action
- CSP, HSTS, X-Frame-Options set in `next.config.ts`
- No secrets in client bundles — all API keys server-side only
- Stripe webhooks verified with signature
- Input validated with Zod on every mutation

## Deployment

Push to `main` — Vercel deploys automatically. Set all env vars in the Vercel dashboard (never commit `.env.local`).

**Required Vercel env vars:**
- `DATABASE_URL` — Supabase transaction pooler (port 6543)
- `DIRECT_URL` — Supabase direct connection (port 5432)
- All Clerk, Stripe, Pusher, Uploadthing keys from `.env.example`

---

Built by **AIGatewayApps**
