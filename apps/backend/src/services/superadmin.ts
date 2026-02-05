import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const ensureSuperAdmin = async () => {
  const email = process.env.SUPERADMIN_EMAIL || 'design@doimih.net';
  const password = process.env.SUPERADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.role !== 'SUPERADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPERADMIN' },
      });
    }
    return;
  }

  if (!password) {
    console.warn('SUPERADMIN_PASSWORD not set. Skipping superadmin creation.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
    },
  });
};
