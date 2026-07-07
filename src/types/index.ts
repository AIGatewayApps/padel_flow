/**
 * Shared TypeScript types across the PadelFlow app.
 * Domain-specific types live in their own files; shared primitives go here.
 */

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole =
  | "player"
  | "coach"
  | "court_manager"
  | "event_manager"
  | "vendor"
  | "admin";

export interface ClerkSessionMeta {
  onboarded: boolean;
  role: UserRole;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  level: number;
  xp: number;
  rating: number;
  wins: number;
  losses: number;
  createdAt: Date;
}

// ─── Court ────────────────────────────────────────────────────────────────────

export type CourtSurface = "indoor" | "outdoor" | "covered";
export type CourtStatus = "available" | "booked" | "maintenance";

export interface Court {
  id: string;
  name: string;
  clubId: string;
  surface: CourtSurface;
  status: CourtStatus;
  pricePerHour: number;
  imageUrl: string | null;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  courtId: string;
  playerId: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  totalPrice: number;
  stripePaymentIntentId: string | null;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export type EventType = "tournament" | "league" | "social" | "training";
export type EventStatus = "draft" | "open" | "full" | "ongoing" | "completed" | "cancelled";

export interface PadelEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  maxParticipants: number;
  currentParticipants: number;
  pricePerPlayer: number;
  imageUrl: string | null;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "event_joined"
  | "event_reminder"
  | "friend_request"
  | "match_result"
  | "achievement"
  | "message";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  actionUrl: string | null;
}
