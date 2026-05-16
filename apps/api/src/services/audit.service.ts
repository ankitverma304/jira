import { prisma } from "../lib/prisma.js";
import { serializeMetadata } from "../lib/transformers.js";

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: serializeMetadata(input.metadata)
    }
  });
}
