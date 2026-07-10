import { prisma } from "@/lib/db";

export async function recordAudit(
  adminUserId: string,
  entity: string,
  entityId: string,
  action: "create" | "update" | "delete",
) {
  await prisma.auditLog.create({
    data: { adminUserId, entity, entityId, action },
  });
}
