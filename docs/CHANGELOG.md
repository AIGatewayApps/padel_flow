# PadelFlow Changelog

## [0.7.3] - 2026-07-10

### Fixed (Critical 🔴 — Security)
- **`ads.actions.ts`** — Added `auth()` guard on all exports. `createAd` and `updateAdStatus` now verify the caller is the owning vendor (`vendor.userId === dbUser.id`) or `SUPER_ADMIN` before mutating. Previously any request could create or modify ads without authentication.
- **`vendor.actions.ts`** — Removed `clerkId` parameter from `getVendorProfile`, `getVendorProducts`, and `createProduct`. Caller identity is now always derived from `auth()` server-side, preventing one vendor from operating as another by passing a spoofed ID.
- **`org.actions.ts`** — All read queries (`getOrgById`, `getOrgMembers`, `getOrgCourts`, `getOrgRevenue`) now run `auth()` + `hasOrgAccess(userId, orgId)` before returning data. Previously any authenticated (or unauthenticated) request could enumerate members and revenue for any org.
- **`ticket.actions.ts`** — Replaced legacy `event.manager.userId` ownership check (dead — `Event` has no `managerId`) with `requireOrgRole(userId, event.orgId, ["ORG_ADMIN"])`. All events are now org-owned; the old path would have thrown `Forbidden` for every org-managed event.

### Fixed (High Priority 🟠 — Bugs)
- **`onboarding.actions.ts`** — `playerProfile` and `coach` upserts now use `dbUser.id` (internal cuid) as the FK key instead of the Clerk `userId` string. Previously every upsert was writing the wrong ID type, causing FK violations or silent duplicate rows. Removed dead `COURT_MANAGER` and `EVENT_MANAGER` branches (roles not in schema `Role` enum).
- **`challenge.actions.ts`** — `sendChallenge` now resolves `dbUser.id` before writing `challengerId` to `MatchChallenge`. The old code stored the Clerk string directly against an internal-id FK column. `respondToChallenge` similarly resolves `dbUser.id` for the ownership check instead of comparing against `clerkId`.
- **`score.actions.ts`** — Action now returns `ActionResult` instead of throwing raw `Error`. Rate-limit, not-found, and validation paths all return structured `{ success, error, code }` objects — no more unhandled 500s reaching the UI.
- **`post.actions.ts`** — Rate-limit hit and auth failure paths now return `ActionResult` instead of throwing. `deletePost` also returns `ActionResult` consistently.

### Fixed (Medium 🟡 — Consistency / Correctness)
- **`validations.ts`** — `scoreSchema` set score cap raised from `max(7)` to `max(10)` to support padel super-tiebreaks (first to 10). `courtSchema` and `eventSchema` field names aligned with Prisma schema (`isIndoor` not `indoor`, `startTime`/`endTime` not `startsAt`/`endsAt`, removed `address/city/country/surface` not in `Court` model, `maxPlayers` not `capacity`).
- **`ads.actions.ts` / `org.actions.ts` / `vendor.actions.ts`** — Migrated from `import { prisma } from '@/lib/prisma'` to `import { db } from '@/lib/db'`. Single Prisma client instance across all server code — no more risk of multiple clients in dev hot-reload.
- **`ads/serve/route.ts` / `ads/track/route.ts`** — Same `@/lib/prisma` → `@/lib/db` migration.
- **`getUserOrgs`** — No longer accepts a `userId` parameter; derives identity from `auth()` to be consistent with all other actions.

---

## [0.7.2] - 2026-07-07

### Fixed (High Priority 🔴)
- **`court-form.tsx`** — Added `orgId` prop; `upsertCourt.bind(null, orgId, courtId)` now correctly passes org scope to the server action.
- **`event-form.tsx`** — Added `orgId` prop; `upsertEvent.bind(null, orgId, eventId)` now correctly passes org scope to the server action.
- **`manage/courts/page.tsx`** — Replaced broken `requireRole("COURT_MANAGER", "ADMIN")` (wrong import, wrong signature) with `auth()` + `db.orgMember.findFirst` + `requireOrgRole(userId, orgId, ["ORG_ADMIN"])`. Courts fetched directly by `orgId` — no longer depends on removed `CourtManagerProfile`.
- **`manage/courts/new/page.tsx`** — Same guard fix; passes resolved `orgId` to `<CourtForm>`.
- **`manage/courts/[id]/page.tsx`** — Same guard fix; validates `court.orgId === membership.orgId` before rendering. Passes `orgId` to `<CourtForm>` and `<SlotManager>`.
- **`manage/events/page.tsx`** — Replaced broken `requireRole("EVENT_MANAGER", "ADMIN")` with org-scoped guard; events fetched by `orgId`.
- **`manage/events/new/page.tsx`** — Same guard fix; passes resolved `orgId` to `<EventForm>`.
- **`manage/events/[id]/page.tsx`** — Same guard fix; validates `event.orgId === membership.orgId` before rendering.

### Changed
- **Role contract enforced end-to-end**:
  - `ORG_ADMIN` — manages courts + events **for their org only** (scoped via `requireOrgRole`)
  - `SUPER_ADMIN` — platform-wide access, bypasses all org checks (via `requireSuperAdmin`)
  - All old `requireRole("COURT_MANAGER" | "EVENT_MANAGER" | "ADMIN")` calls removed from `/manage` routes
- **`court.actions.ts`** / **`event.actions.ts`** — `orgId` is first param; ownership verified via `court.orgId !== orgId` / `event.orgId !== orgId` before any mutation.

---

## [0.7.1] - 2026-07-07

### Fixed (High Priority 🔴)
- **`score.actions.ts`** — All DB writes (score create, playerProfile upsert, user update) are now wrapped in a single `db.$transaction([])`. Redundant second `findUnique` for streak removed. User now fetched once using `clerkId` key instead of `id`.
- **`onboarding.actions.ts`** — `where: { id: userId }` corrected to `where: { clerkId: userId }` — onboarding was silently failing for every user. Per-role Zod schemas added (`PlayerSchema`, `CoachSchema`, `CourtManagerSchema`, `EventManagerSchema`) replacing unsafe raw `parseFloat` calls.
- **`court.actions.ts`** — `requireRole` was called with two role strings and no `clerkId`. Fixed to `requireRole(userId, "ORG_ADMIN")` matching the actual function signature.
- **`post.actions.ts`** — In-memory `Map`-based rate limiter replaced with `postRatelimit` (Upstash Redis). The old implementation was ineffective on Vercel serverless since each invocation may run in a fresh instance. Duplicate inline `PostSchema` removed; now imports shared `postSchema` from `validations.ts`.

### Fixed (Medium Priority 🟡)
- **`audit.ts`** — Added `.catch()` so audit write failures log to console but never crash the calling action.
- **`page.tsx`** — Duplicate inline SVG logo extracted to shared `src/components/padel-flow-logo.tsx` component. Both header and footer now import `<PadelFlowLogo>`.
- **`onboarding.actions.ts`** — Per-role Zod schemas with `z.coerce.number()` prevent `NaN` being written to the DB when numeric fields are missing.
- **`post.actions.ts`** / **`validations.ts`** — Duplicate `PostSchema` definition removed from `post.actions.ts`; single source of truth in `validations.ts`.

### Fixed (Minor 🟢)
- **`src/lib/types.ts`** — New shared file. `ActionResult<T>` type moved here; removed duplicate definitions from `challenge.actions.ts` and `comment.actions.ts`.
- **`elo.ts`** — Added `Math.max(100, ...)` floor to prevent Elo ratings going negative after a loss streak.
- **`notification.actions.ts`** — Added `revalidatePath("/", "layout")` so the unread notification badge in the nav updates immediately after marking all read.

---

## [0.7.0] - 2026-07-07

### Added
- **Ads System**: Full ad management with serve/track API routes, admin panel, and ad-banner component
- **Org Dashboard**: Multi-org support with `[orgId]` dynamic routes — dashboard, locations, revenue, staff pages
- **Vendor Portal**: Vendor page and products page with Supabase-backed server actions
- **Permissions Layer**: Role-based access control (`src/lib/permissions.ts`) for player, coach, org_admin, vendor, super_admin
- **Auth Utility**: Centralised `src/lib/auth.ts` with Clerk + Supabase session helpers
- **Loading States**: Skeleton loaders for coaches, events, messages, notifications routes
- **Nav Component**: Unified navigation with role-aware links
- **Org Actions**: Server actions for org CRUD and membership management
- **Vendor Actions**: Server actions for product and inventory management
- **Ads Actions**: Server actions for ad campaign management
- **next.config.ts**: Updated with image domains, security headers, and env validation
- **Prisma Schema**: Full schema — User, Org, OrgMember, Court, Booking, Event, Coach, Message, Notification, Vendor, Product, Ad, AdImpression

### Changed
- `.env.example` updated with all required keys (Supabase, Clerk, DB, App)

## [0.6.0] - 2026-07-06
### Added
- Initial Next.js + Clerk + Supabase scaffold
- Base routing structure
