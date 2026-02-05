import { Request, Response, NextFunction } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateEmailVerificationToken } from '../services/emailVerification';
import { isEmailConfigured, sendVerificationEmail } from '../services/mailer';
import { logAudit } from '../services/auditLog';

const prisma = new PrismaClient();

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      users.map(({ password, ...user }) => user)
    );
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, role, status, phone, avatarUrl, notificationPreference } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailConfigured = await isEmailConfigured();

    const data: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
    };

    let verificationToken: string | null = null;

    if (emailConfigured) {
      const { token, tokenHash, expiresAt } = generateEmailVerificationToken();
      verificationToken = token;
      data.emailVerificationToken = tokenHash;
      data.emailVerificationTokenExpires = expiresAt;
    } else {
      data.emailVerifiedAt = new Date();
    }

    if (role) {
      data.role = role;
    }

    if (status) {
      data.status = status;
    }

    if (phone) {
      data.phone = phone;
    }

    const user = await prisma.user.create({
      data,
    });

    if (verificationToken) {
      await sendVerificationEmail(email, verificationToken, user.id);
    }

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    const { password: _password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email, password, role, status, phone, avatarUrl, notificationPreference } = req.body;

    // Superadmin can edit anyone except themselves for role/status
    const isSelf = req.user?.userId === parseInt(id);
    
    const data: Record<string, unknown> = {};

    if (email && !isSelf) {
      data.email = email;
    }

    if (status && !isSelf) {
      data.status = status;
    }

    if (role && !isSelf) {
      data.role = role;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (phone) {
      data.phone = phone;
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_UPDATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role, status: user.status },
    });

    const { password: _password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (req.user?.userId === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_DELETE',
      entity: 'User',
      entityId: parseInt(id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user?.userId === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_STATUS',
      entity: 'User',
      entityId: user.id,
      details: { status: user.status },
    });

    const { password: _password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const updateUserVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { verified } = req.body as { verified: boolean };

    if (req.user?.userId === parseInt(id) && !verified) {
      return res
        .status(400)
        .json({ message: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        emailVerifiedAt: verified ? new Date() : null,
        emailVerificationToken: verified ? null : undefined,
        emailVerificationTokenExpires: verified ? null : undefined,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_VERIFY',
      entity: 'User',
      entityId: user.id,
      details: { verified },
    });

    const { password: _password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};
