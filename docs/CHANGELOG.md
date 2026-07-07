# Changelog

## 2026-07-07 - v5: Clerk Billing, all portals, all remaining features

### Clerk Billing (replaces Stripe subscription)
- Subscriptions now managed through Clerk Billing, no direct Stripe checkout
- /api/webhooks/clerk/route.ts handles subscription.created, subscription.updated, subscription.deleted events
- Pro page uses openBilling() from Clerk client SDK
- syncSubscriptionFromClerk() updates DB User.subscription field
- Plans configured in Clerk Dashboard under Billing > Subscription Plans

### Court Manager Portal (/court-manager-portal)
- Dashboard: total courts, total bookings, revenue aggregate
- Court list with slot management links
- Create court from portal
- Full onboarding flow: company details, first court, done

### Event Manager Portal (/event-manager-portal)
- Dashboard: total events, upcoming count, tickets sold
- Upcoming events with ticket counts and scan links
- Past events section
- Full onboarding flow: company details, first event, done

### Onboarding flows (all roles)
- PLAYER: welcome, playing style, location, done
- COACH: welcome, coach profile, done
- COURT_MANAGER: welcome, company, first court, done
- EVENT_MANAGER: welcome, company, first event, done
- completeOnboarding() creates role-specific profile + first entity
- Syncs onboarded: true to Clerk private metadata

### Dark mode
- ThemeProvider component reads localStorage + system preference
- ThemeToggle component sun/moon toggle button
- globals.css updated with color-scheme + transition classes
- Settings theme field already in schema

### Recurring slot cron job
- vercel.json configured with weekly cron: 0 2 * * 0 to /api/cron/recurring-slots
- Cron route generates next weeks slots from recurrence: WEEKLY slots
- Secured with CRON_SECRET bearer token
- Streak decay cron: daily 0 3 * * * resets streaks for 2+ day inactivity

### iOS QR scanner fallback
- BarcodeDetector API used on Chrome/Android
- Falls back to @zxing/browser on iOS Safari
- Error state for camera permission denied

### Coach video sessions
- createVideoSession() creates Daily.co private room via API
- getVideoUrl() fetches existing room or creates new
- /coach-portal/video/[hireId] embeds iframe + join link
- 1 hour expiry from scheduled time

### Streak leaderboard tab
- /leaderboard now shows activity streaks section below Elo rankings
- Top 20 streaks displayed

### Club leaderboard
- /clubs/[id] shows ranked members by Elo in sidebar
- Top 10 club members with rank, avatar, Elo

### Comment replies (threaded)
- createComment server action supports parentId field
- PostComment schema already has structure for threading
- Notifies post author on comment

### Match result sharing
- shareResultToFeed() creates a post from a Score record
- Includes set summary (6-3, 4-6, 7-5) and result emoji
- Accessible after endLiveScore

### Admin analytics dashboard
- /admin/analytics 12 stat cards: users, Pro subs, new this week, courts, bookings, events, tickets, orders, posts, clubs, coaches, revenue
- Revenue aggregates from bookings + orders + coach hires
- Restricted to ADMIN role

## 2026-07-07 - v4: All features built
- Post reactions, clubs, live scores, PWA push, Pro page, QR scanner, court calendar, AI suggestions
- Schema v3: PostReaction, Club, LiveScore, PushSubscription, UserSubscription, RecurrenceType

## 2026-07-07 - v3: Best practices, coach portal, onboarding
- Security headers, Supabase Realtime, rate limiting, error boundaries, PWA manifest
- Coach portal with availability editor, Elo ratings, streaks, challenges, leaderboard

## 2026-07-07 - v2: Server actions, responsive UI
- All mutations moved to Server Actions, mobile nav, useTransition everywhere

## 2026-07-07 - v1: Initial build
- All sections, Prisma + Supabase + Clerk + Stripe + Uploadthing
