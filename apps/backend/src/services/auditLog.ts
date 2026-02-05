import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AuditLogInput = {
  userId?: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: Prisma.InputJsonValue;
};

export const logAudit = async ({
  userId,
  action,
  entity,
  entityId,
  details,
}: AuditLogInput) => {
  if (!userId) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};
