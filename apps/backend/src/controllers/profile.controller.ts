import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logAudit } from '../services/auditLog';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        notificationPreference: true,
        timezone: true,
        language: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { phone, avatarUrl, notificationPreference, timezone, language } = req.body as {
      phone?: string;
      avatarUrl?: string | null;
      notificationPreference?: 'PUSH' | 'EMAIL' | 'NONE';
      timezone?: string;
      language?: string;
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        notificationPreference: notificationPreference ?? undefined,
        timezone: timezone ?? undefined,
        language: language ?? undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        notificationPreference: true,
        timezone: true,
        language: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      entityId: userId,
      details: {
        phone: user.phone,
        notificationPreference: user.notificationPreference,
        timezone: user.timezone,
        language: user.language,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getMyAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};
