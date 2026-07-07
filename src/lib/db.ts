import { PrismaClient } from "@prisma/client";

// ponytail: Next.js hot-reload creates multiple instances — global singleton prevents that
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Alias so legacy imports of `prisma` from this file also work
export { db as prisma };
