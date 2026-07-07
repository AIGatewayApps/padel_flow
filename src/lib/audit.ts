import { db } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

export async function auditLog(
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>
) {
  // Fire-and-forget: audit failures must never crash the calling action
  await db.auditLog
    .create({
      data: { actorId, action, targetType, targetId, meta: meta ?? {} },
    })
    .catch((err) => console.error("[auditLog] failed to write:", err));
}
