# Changelog

## 2026-07-07 — v4: All features built

### Schema v3 additions
- `PostReaction` model — emoji reactions on posts (🎾 🔥 💪 🏆 😂)
- `Club` + `ClubMember` + `ClubPost` — full groups / clubs system
- `LiveScore` model — real-time shared scoreboard via Supabase Realtime
- `PushSubscription` model — Web Push endpoint/key storage per user
- `UserSubscription` model — Stripe subscription tracking
- `SubscriptionTier` enum — FREE | PRO on `User.subscription`
- `RecurrenceType` enum on `CourtSlot` — NONE | WEEKLY | BIWEEKLY
- `Ticket.scanned` boolean — for QR scanner
- `User.stripeCustomerId` — for Pro checkout

### New pages & features

#### Post Reactions
- `PostReaction` table with unique constraint per (postId, userId, emoji)
- `toggleReaction` server action — creates or deletes, notifies post author
- Reaction bar component with emoji counts

#### Clubs / Groups (`/clubs`, `/clubs/[id]`)
- Create club, join by invite code
- Club feed with post composer
- Members sidebar with Elo ratings
- Owner sees shareable invite code

#### Live Score Entry (`/live/[id]`)
- Owner controls score with + / - buttons per set
- Supabase Realtime broadcasts every update to spectators in real time
- Add set button (up to 5 sets), end match button
- Shareable URL — send to spectators/opponent

#### PWA Push Notifications
- `public/sw.js` — service worker handles push + notification click
- `PushRegister` client component — subscribes on mount, saves to DB
- `sendPushToUser()` helper — fires web-push to all user devices
- Auto-cleans expired subscriptions

#### PadelFlow Pro (`/pro`)
- Pricing page with feature list
- Stripe Checkout session creation at `/api/stripe/pro-checkout`
- Monthly ($9) and signals yearly ($79) price
- `UserSubscription` model tracks period, cancel status

#### QR Ticket Scanner (`/manage/events/[id]/scan`)
- Camera view using `getUserMedia` + `BarcodeDetector` API
- Scans QR codes, calls `scanTicket` server action
- Green success overlay shows attendee name
- Live attendee list with scanned status

#### Court Availability Calendar (`/courts/[id]/calendar`)
- Week-view grid (06:00–21:00 × 7 days)
- Previous/next week navigation
- Click slot to select → confirm booking panel appears
- No external calendar library needed

#### AI Match Suggestions (`/ai-suggest`)
- Finds players within ±100 Elo in same city
- Shows Elo differential vs you (green = easier, red = harder)
- One-click challenge from the list
- Pro badge shown for non-Pro users

#### Recurring Bookings
- `RecurrenceType` enum on `CourtSlot` (NONE/WEEKLY/BIWEEKLY)
- Calendar passes `recurrence` field through booking form

## 2026-07-07 — v3: Best practices, coach portal, onboarding
- Security headers in middleware
- Supabase Realtime replaces 3s polling
- Upstash rate limiting on search
- Global error.tsx + not-found.tsx
- PWA manifest
- Coach portal with availability editor
- Player & coach onboarding flows
- Elo rating system
- Activity streaks
- Match challenges + leaderboard

## 2026-07-07 — v2: Server actions, responsive UI
- All mutations moved to Server Actions
- Mobile hamburger nav
- useTransition everywhere

## 2026-07-07 — v1: Initial build
- All sections: feed, friends, coaches, shop, messages, courts, events
- Prisma + Supabase + Clerk + Stripe + Uploadthing
