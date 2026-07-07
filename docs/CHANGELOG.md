# Changelog

## 2026-07-07 — All sections built

### New pages
- `app/feed/` — social feed with post composer, likes, comments, friends-only view
- `app/friends/` — friend requests, player search, accept/decline/remove
- `app/coaches/` — coach directory with booking/hire + Stripe checkout
- `app/shop/` — product grid with category filter, localStorage cart, Stripe checkout
- `app/shop/order/[id]/` — order confirmation
- `app/messages/` — conversation list + new conversation flow
- `app/messages/[id]/` — real-time chat (3s polling, ready for Pusher upgrade)
- `app/players/[username]/` — public player profile with stats and recent matches
- `app/events/[id]/` — event detail with ticket purchase
- `app/bookings/[id]/` — booking confirmation page
- `app/notifications/` — notification center with mark-all-read
- `app/manage/courts/new` + `[id]` — court CRUD with slot manager
- `app/manage/events/new` + `[id]` — event CRUD
- `app/admin/users/` — user table with roles
- `app/admin/products/` + `new` + `[id]` — full product management (admin-only store)
- `app/admin/orders/` — order history with status

### New API routes
- `POST /api/posts` — create post
- `POST /api/posts/[id]/like` — toggle like
- `POST /api/friends` — send friend request + notification
- `PATCH /api/friends/[id]` — accept/block
- `DELETE /api/friends/[id]` — remove friend
- `GET /api/players/search` — player search
- `POST /api/coaches/hire` — book coach + Stripe
- `POST /api/conversations` — create/reuse 1:1 conversation
- `GET/POST /api/conversations/[id]/messages` — fetch + send messages
- `POST /api/shop/checkout` — cart checkout + Stripe + order creation
- `POST /api/tickets` — ticket purchase + Stripe
- `POST /api/notifications/read` — mark all read
- `POST/PATCH /api/manage/courts` — court CRUD (court manager)
- `POST /api/manage/courts/[id]/slots` — add availability slots
- `POST/PATCH /api/manage/events` — event CRUD (event manager)
- `POST/PATCH /api/admin/products` — product management (admin only)
- `POST /api/uploadthing` — file uploads (avatar, court image, post image)

### Shared components
- `components/nav.tsx` — sticky top nav, role-aware, Clerk UserButton
- Global layout updated to include Nav + consistent page wrapper

### Stripe webhook expanded
- Booking confirmation → notification
- Ticket confirmation
- Order confirmation + stock decrement
- Coach hire confirmation

### Uploadthing
- `lib/uploadthing.ts` — file router for avatar, courtImage, postImage
- `api/uploadthing/route.ts` — handler wired up

## 2026-07-07 — Supabase migration
- Switched DATABASE_URL to Supabase transaction pooler (port 6543)
- Added DIRECT_URL for Prisma migrations (port 5432)
- Updated prisma/schema.prisma with directUrl

## 2026-07-07 — Initial scaffold
- Next.js 15 App Router, Clerk, Prisma schema, middleware, security headers
- Role system, Zod validation, Stripe + Clerk webhooks
- Base pages: home, sign-in, sign-up, onboarding, dashboard, courts, leaderboard, events, scores, settings, manage, admin
