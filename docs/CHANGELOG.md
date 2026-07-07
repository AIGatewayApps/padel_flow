# Changelog

## 2026-07-07 — Initial scaffold

- Next.js 15 App Router project initialized
- Clerk authentication wired up (sign-in, sign-up, onboarding)
- Prisma schema: User, PlayerProfile, CourtManagerProfile, EventManagerProfile, UserSettings, Friendship, Conversation, Message, Post, Court, CourtSlot, Booking, Score, Coach, CoachHire, Event, Ticket, Product, Order, OrderItem, Notification
- Role system: PLAYER / COURT_MANAGER / EVENT_MANAGER / ADMIN via Clerk publicMetadata
- Middleware: route-level role enforcement
- Security headers: CSP, HSTS, X-Frame-Options, Permissions-Policy in next.config.ts
- Zod validation schemas for all mutations
- Stripe checkout flow for court bookings (atomic slot locking)
- Stripe + Clerk webhooks with signature verification
- Pages: home, sign-in, sign-up, onboarding, dashboard, courts, leaderboard, events, scores, settings, manage/courts, manage/events, admin
- API routes: /api/onboarding, /api/bookings, /api/scores, /api/settings, /api/webhooks/clerk, /api/webhooks/stripe
