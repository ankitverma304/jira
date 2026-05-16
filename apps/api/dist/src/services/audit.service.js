import { prisma } from "../lib/prisma.js";
import { serializeMetadata } from "../lib/transformers.js";
export async function writeAuditLog(input) {
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
