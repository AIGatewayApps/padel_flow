import { z } from "zod";

export const bookingSchema = z.object({
  courtId: z.string().cuid(),
  slotId: z.string().cuid(),
});

export const postSchema = z.object({
  body: z.string().min(1).max(1000),
  imageUrl: z.string().url().optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().min(1).max(2000),
});

export const scoreSchema = z.object({
  opponentId: z.string().optional(),
  sets: z.array(z.object({ player: z.number().int().min(0).max(7), opponent: z.number().int().min(0).max(7) })).min(1).max(5),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  courtId: z.string().cuid().optional(),
  playedAt: z.string().datetime().optional(),
});

export const courtSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  imageUrl: z.string().url().optional(),
  pricePerHour: z.number().positive(),
  surface: z.enum(["crystal", "artificial_grass", "concrete"]).optional(),
  indoor: z.boolean().default(false),
});

export const eventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  location: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  ticketPrice: z.number().min(0),
  capacity: z.number().int().positive().optional(),
});

export const settingsSchema = z.object({
  emailBookings: z.boolean().optional(),
  emailMessages: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  pushBookings: z.boolean().optional(),
  pushMessages: z.boolean().optional(),
  pushFriendRequests: z.boolean().optional(),
  profilePublic: z.boolean().optional(),
  showLevel: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  allowFriendRequests: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});
