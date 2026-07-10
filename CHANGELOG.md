# padel_flow — CHANGELOG

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.7.4] — 2026-07-10

### Security
- **`post.actions.ts`** — Resolved FK identity bug: `createPost` and `deletePost` previously used the Clerk `userId` string directly as `Post.authorId`, which is a FK to `User.id`. All writes and ownership checks now resolve `dbUser.id` first via `db.user.findUnique({ where: { clerkId } })`.
- **`club.actions.ts`** — Resolved 4× FK identity bugs across `createClub`, `joinClub`, and `postToClub`. All composite keys and FK columns now use internal `dbUser.id`. Imported `ActionResult` from `@/lib/types` instead of re-declaring locally.
- **`ads.actions.ts`** — `getAds` now scoped per caller role: `SUPER_ADMIN` sees all ads; `VENDOR` role sees only their own vendor's ads; all other roles see only `ACTIVE` ads. Previously any authenticated user could enumerate every vendor's ad campaigns, budgets, and impression counts. Removed unused `hasOrgAccess` import.
- **`ticket.actions.ts`** — `scanTicket` ownership check replaced: legacy `event.manager.userId === clerkId` path (broken for org-managed events) replaced with `requireOrgRole(clerkId, event.orgId, ['ORG_ADMIN'])`.
- **`subscription.actions.ts`** — `syncSubscriptionFromClerk` now resolves `clerkId → dbUser.id` before `db.user.update({ where: { id } })`. Previously used `userId` param directly in `where: { id }`, silently no-oping for any caller passing a clerkId.

### Fixed
- **`court.actions.ts`** — Field name mismatch: `indoor` renamed to `isIndoor` in the raw form object to align with `courtSchema`. Previously every court was silently created as outdoor regardless of form input.
- **`event.actions.ts`** — Field name mismatches resolved: form fields `startsAt`/`endsAt`/`ticketPrice`/`capacity` now match `eventSchema` field names. Previously Zod stripped all four fields.
- **`court.actions.ts`** — `addCourtSlot` now validates `startsAt < endsAt` and rejects past slots.
- **`event.actions.ts`** — `upsertEvent` now validates `startsAt < endsAt`.
- **`onboarding.actions.ts`** — All paths return `ActionResult`. Profile upserts use `dbUser.id`.
- **`court.actions.ts` / `event.actions.ts` / `ticket.actions.ts`** — Raw `throw` replaced with `ActionResult` on all paths.
- **`club.actions.ts`** — `createClub` wrapped in `db.$transaction(...)` for atomicity.
- **`vendor.actions.ts`** — `createProduct` validates input via Zod `ProductSchema`.
- **`comment.actions.ts`** — Switched from `postRatelimit` to `commentRatelimit` (dedicated `pf:comment` Redis prefix).
- **`coach.actions.ts`** — `updateCoachProfile` and `upsertAvailability` now resolve `dbUser.id` before `Coach` FK lookups and ownership checks. Previously queried `Coach.userId === clerkId` — would always 404 since `Coach.userId` is a FK to `User.id`.
- **`score.actions.ts`** — `submitScore` resolves caller via `db.user.findUnique({ where: { clerkId } })` and looks up opponent via `db.user.findUnique({ where: { id: parsed.opponentId } })`. Previously mixed clerkId and User.id in opponent lookup.
- **`product.actions.ts`** — `toggleProductActive` returns `ActionResult` instead of `throw new Error('Not found')`.
- **`coach-video.actions.ts`** — `assertHireAccess` now compares `coach.userId === dbUser.id` (User.id) instead of `coach.userId === clerkId`. Previously every coach was forbidden from their own sessions.

### Changed
- **`validations.ts`** — `courtSchema` extended with `address`, `city`, `country`, `surface`. `eventSchema` updated to `startsAt`/`endsAt`/`ticketPrice`/`capacity`.
- **`ratelimit.ts`** — `commentRatelimit` given dedicated Redis prefix `pf:comment`.
- **`club.actions.ts`** — `postToClub` now rate-limited.

---

## [0.7.3] — 2026-07-10

### Security
- **`org.actions.ts`** — Added auth + membership guards to `getOrgMembers`, `getOrgRevenue`, `getOrgById`, `getOrgCourts`.
- **`vendor.actions.ts`** — `clerkId` sourced from `auth()` instead of being passed as parameter.
- **`ads.actions.ts`** — Added `auth()` guard to all ad mutation actions.

### Fixed
- **`challenge.actions.ts`** — `challengerId` resolves via `dbUser.id` before write.
- **`score.actions.ts`** — Returns structured `ActionResult` instead of throwing.
- **`onboarding.actions.ts`** — Profile upserts use `dbUser.id`.

### Changed
- **`validations.ts`** — `scoreSchema` set score cap raised to `max(10)` for padel super-tiebreak.
