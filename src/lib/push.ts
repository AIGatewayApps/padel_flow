import webpush from "web-push";
import { db } from "./db";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@padelflow.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // push not configured
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      )
    )
  );
  // Clean up expired subscriptions
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      await db.pushSubscription.deleteMany({ where: { endpoint: subs[i].endpoint } }).catch(() => null);
    }
  }
}
