# Changelog

## 2026-07-07 - v6: Security, performance & schema fixes

### Security
- Clerk webhook now verifies svix signature using CLERK_WEBHOOK_SECRET — rejects unsigned/forged requests
- Middleware onboarded check fixed: `!onboarded` instead of `=== false` so new users (undefined) redirect correctly
- Permissions-Policy header updated: `camera=(self), microphone=(self)` — was blocking QR scanner and video sessions

### Schema
- Removed orphaned `UserSubscription` model (replaced by Clerk Billing + User.subscription field)
- Removed orphaned `stripeCustomerId` field from User
- Added proper `Score.opponent` relation to User (`scoreOpponent`) — was a plain String with no FK
- Added `PostComment.parentId` + self-relation for threaded replies — parentId was silently ignored before
- Added `Ticket.qrCode @unique` constraint
- Added DB indexes across all heavily-queried FK columns:
  - Booking: userId, courtId, status
  - Score: userId, opponentId, playedAt
  - Notification: userId, read
  - Message: conversationId, createdAt
  - Post: authorId, createdAt
  - PostComment: postId, authorId
  - CourtSlot: courtId, startsAt
  - Ticket: eventId, userId
  - Order: userId, status
  - MatchChallenge: challengerId, challengedId
  - And more across all models

### Performance
- Leaderboard wrapped in `unstable_cache` with 5-minute revalidation — no longer hits DB on every page load
- Recurring slots cron: replaced N+1 loop with batch `findMany` existence check + `createMany` — was 1000+ queries, now ~3
- Admin analytics: all 13 DB queries now in a single `Promise.all` — eliminated sequential revenue aggregates

### Rate limiting
- `createComment`: max 10 per user per minute (in-memory)
- `createPost`: max 5 per user per minute (in-memory)

### UX
- ThemeToggle now uses proper SVG sun/moon icons instead of text labels
- Added `loading.tsx` skeleton screens for: leaderboard, feed, courts, dashboard

## 2026-07-07 - v5: Clerk Billing, all portals, all remaining features
- Subscriptions via Clerk Billing, Court/Event Manager portals, dark mode
- Onboarding flows for all 4 roles, recurring slot crons, streak decay
- Coach video sessions (Daily.co), QR scanner iOS fallback
- Streak + club leaderboards, comment replies, match result sharing
- Admin analytics dashboard

## 2026-07-07 - v4: All features built
- Post reactions, clubs, live scores, PWA push, Pro page, QR scanner, court calendar, AI suggestions

## 2026-07-07 - v3: Best practices, coach portal, onboarding
- Security headers, Supabase Realtime, rate limiting, error boundaries, PWA manifest

## 2026-07-07 - v2: Server actions, responsive UI
- All mutations moved to Server Actions, mobile nav, useTransition everywhere

## 2026-07-07 - v1: Initial build
- All sections, Prisma + Supabase + Clerk + Stripe + Uploadthing
