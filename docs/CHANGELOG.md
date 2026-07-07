# Changelog

## 2026-07-07 — Best practices, all features, coach portal, onboarding

### Architecture fixes
- **All API routes replaced with Server Actions** — no HTTP round trips for mutations
- **`useTransition` everywhere** — optimistic UI, no janky loading states
- **Prisma `select` instead of full `include`** — only fetch fields used in UI
- **`_count` for like/comment counts** — never load all rows just for a number
- **Global `error.tsx` + `not-found.tsx`** — proper error boundaries on every page
- **`next.config.ts` image domains** — Clerk, Uploadthing, Supabase all whitelisted
- **PWA manifest** — installable on iOS/Android home screen
- **Security headers** in middleware — X-Frame-Options, nosniff, referrer policy

### Schema updates
- Added `COACH` role to `Role` enum
- Added `eloRating`, `streak`, `lastPlayedAt`, `onboarded` to `User`
- Added `MatchChallenge` model with `ChallengeStatus` enum
- Added `CoachAvailability` model
- Added `specialties`, `languages`, `stripeAccountId` to `Coach`
- Added `notes` to `CoachHire`

### New features
- **Elo rating system** — `lib/elo.ts`, updated on every score submission
- **Activity streaks** — consecutive days of play tracked on `User.streak`
- **Match challenges** — send/accept/decline challenges, notification on receive
- **Supabase Realtime messages** — replaces 3s polling, instant delivery via `postgres_changes`
- **Rate limiting** — `/api/players/search` rate-limited via Upstash Redis
- **Leaderboard** — Elo rankings with podium (🥇🥈🥉), highlights current user
- **Challenges page** — `/challenges` to view/respond to all challenges

### Onboarding flows
- `/onboarding` — multi-step flow for players (welcome → playing style → location → done)
- `/onboarding` — separate flow for coaches (welcome → coach profile → done)
- Middleware auto-redirects unonboarded users
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding` in env

### Coach portal (`/coach-portal`)
- Dashboard with stats: upcoming, pending, completed sessions, total earned
- Pending booking requests with accept/decline
- Upcoming sessions list with message link
- Weekly availability editor — toggle days, set start/end hours
- `/coach-portal/settings` — edit bio, price, certifications, active status
- `/coach-portal/availability` — visual day grid + hour selectors

### Score actions
- `submitScore` server action now updates Elo, streak, and player profile stats atomically

## 2026-07-07 — Server actions, responsive UI
- All client mutations migrated to Server Actions
- Mobile hamburger nav with animated open/close
- All grids responsive: `grid-cols-1 sm:grid-cols-2`
- `useTransition` replaces manual loading state everywhere

## 2026-07-07 — All sections built
- Feed, Friends, Coaches, Shop, Messages, Players, Bookings, Events detail
- Manage CRUD (courts + events), Admin sub-pages, Notifications
- Stripe webhook handles booking, ticket, order, coach hire
- Uploadthing for avatars, court images, post images

## 2026-07-07 — Supabase integration
- Transaction pooler (port 6543) for runtime, direct URL for migrations
