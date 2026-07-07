# PadelFlow Changelog

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
