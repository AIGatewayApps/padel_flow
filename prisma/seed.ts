/**
 * Prisma seed — populates baseline data for development and staging.
 * Run: npx prisma db seed
 * (Requires "prisma": { "seed": "ts-node prisma/seed.ts" } in package.json)
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Clubs ──────────────────────────────────────────────────────────────────
  const club = await db.club.upsert({
    where: { slug: "padel-central" },
    update: {},
    create: {
      name: "Padel Central",
      slug: "padel-central",
      description: "The premier padel club in the city.",
      city: "Madrid",
      country: "ES",
      verified: true,
    },
  });

  console.log(`  ✓ Club: ${club.name}`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
