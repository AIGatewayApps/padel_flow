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
- **Database:** Prisma + PostgreSQL (Neon or Supabase)
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
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Push to `main` — Vercel deploys automatically. Set all env vars in Vercel dashboard (never commit `.env.local`).

---

Built by **AIGatewayApps**
