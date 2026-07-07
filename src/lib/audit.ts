import { db } from "@/lib/db";
import type { AuditAction } from "@prisma/client";

export async function auditLog(
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>
) {
  await db.auditLog.create({
    data: { actorId, action, targetType, targetId, meta: meta ?? {} },
  });
}
