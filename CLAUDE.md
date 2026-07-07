# PadelFlow — Claude Code Project Memory

**Read this file completely before writing any code.**
This is your full memory for this project. Completed work lives in `docs/CHANGELOG.md`.

---

## What we're building

**PadelFlow** — a social platform for padel players.

Features: player profiles, social feed, friends, messaging, court booking, scores, leaderboards, coaches, events, tickets, shop.

**Owner:** Asis (AIGatewayApps). He makes product decisions. You make technical decisions.

---

## Account types

| Role | Scope |
|---|---|
| PLAYER | Default — profile, feed, booking, shop, scores |
| COURT_MANAGER | Everything above + court listings + booking dashboard |
| EVENT_MANAGER | Everything above + event creation + ticketing |
| ADMIN | Everything — store management is admin-only |

Role is stamped on Clerk `publicMetadata.role` at onboarding and enforced in:
1. `src/middleware.ts` — route-level
2. `src/lib/auth.ts#requireRole` — server action / API level

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Deployed on Vercel |
| Auth | Clerk | `@clerk/nextjs` v6 |
| DB | Prisma + Supabase (PostgreSQL) | Two URLs required — see below |
| Styling | Tailwind CSS v4 | System font — no extra download |
| Payments | Stripe Checkout | Webhooks for confirmation |
| Real-time | Pusher | Chat only |
| Storage | Uploadthing | Avatars, court images, event media |
| Validation | Zod | Every mutation |

### Supabase / Prisma connection

Supabase uses PgBouncer (connection pooler). Prisma requires two separate URLs:

```
DATABASE_URL  = Transaction pooler, port 6543, ?pgbouncer=true  ← runtime (Vercel)
DIRECT_URL    = Direct connection,  port 5432                   ← migrations only
```

Both are set in `prisma/schema.prisma` as `url` and `directUrl`.
Both must be set in Vercel environment variables.

**Never** use the direct URL at runtime — it exhausts Supabase connection limits on serverless.

---

## Repo layout

```
src/
  app/
    (auth)/            # Clerk sign-in / sign-up
    onboarding/        # First-run role selection
    dashboard/         # Authenticated home
    feed/              # Social feed
    friends/           # Friend requests + list
    courts/            # Browse + detail + booking
    scores/            # Log + history
    leaderboard/       # Top players
    coaches/           # Coach directory + hire
    events/            # Browse + detail + tickets
    shop/              # Products + cart + checkout
    messages/          # Conversations
    settings/          # All settings in one place
    manage/
      courts/          # COURT_MANAGER only
      events/          # EVENT_MANAGER only
    admin/             # ADMIN only — users, store, orders
    api/
      bookings/        # POST — create booking + Stripe session
      scores/          # POST — log match
      settings/        # PATCH — save user settings
      onboarding/      # POST — create DB user + set Clerk role
      webhooks/
        clerk/         # Clerk user events
        stripe/        # Payment confirmations
  components/          # Shared UI (future: extract here)
  lib/
    db.ts              # Prisma singleton
    auth.ts            # getDbUser, requireRole, upsertUserFromClerk
    stripe.ts          # Stripe singleton
    validations.ts     # Zod schemas
prisma/
  schema.prisma        # Full data model
```

---

## Security non-negotiables

1. Every API route / server action calls `auth()` first — no exceptions
2. Role checks via `requireRole()` for protected endpoints
3. Stripe webhook verified with signature before any DB write
4. Clerk webhook verified with svix before any DB write
5. No secrets in any `NEXT_PUBLIC_` env var except publishable keys
6. Zod validation on every user-supplied input
7. Security headers set in `next.config.ts`
8. Slot availability atomically marked taken before Stripe session creation

---

## Ponytail rules (follow always)

Before writing any code, stop at the first rung that holds:
1. Does this need to exist? → no: skip (YAGNI)
2. Stdlib / Next.js built-in does it? → use it
3. Native HTML element does it? → use it (`<input type="date">` not a picker library)
4. Installed dependency does it? → use it
5. One line? → one line
6. Only then: the minimum that works

Mark every shortcut with a `// ponytail: <upgrade path>` comment.
Security, data-loss prevention, and accessibility are never skipped.

---

## Pages still to build (open workstream)

- `app/feed/` — social feed + post composer
- `app/friends/` — friend requests + player search
- `app/coaches/` — coach directory + hire flow
- `app/shop/` — product listing + cart + checkout
- `app/messages/` — Pusher-powered conversations
- `app/players/[username]/` — public player profile
- `app/bookings/[id]/` — booking confirmation
- `app/manage/courts/new` and `[id]` — court CRUD
- `app/manage/events/new` and `[id]` — event CRUD
- `app/events/[id]/` — event detail + ticket purchase
- `app/admin/users`, `products`, `orders` — admin sub-pages
- Uploadthing integration for avatars + media
- Pusher integration for real-time chat

---

## Known debt (tracked)

- Email field in DB user is empty at onboarding — Clerk webhook fills it; acceptable for now
- No rate limiting on API routes yet — add Upstash Ratelimit when needed
- No pagination on leaderboard / courts / events — add cursor pagination when lists grow
- Stripe currency is hard-coded USD — make configurable when international rollout begins
