import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
} from '../services/emailVerification';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../services/passwordReset';
import { isEmailConfigured, sendVerificationEmail, sendPasswordResetEmail } from '../services/mailer';
import { logAudit } from '../services/auditLog';

const prisma = new PrismaClient();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailConfigured = await isEmailConfigured();

    if (!emailConfigured) {
      return res.status(503).json({
        message: 'Email configuration is required to register accounts.',
      });
    }

    const { token, tokenHash, expiresAt } = generateEmailVerificationToken();

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: expiresAt,
      },
    });

    await sendVerificationEmail(email, token, newUser.id);

    res.status(201).json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'User is suspended' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.query.token as string | undefined;

    if (!token) {
      return res.status(400).json({ message: 'Missing token' });
    }

    const tokenHash = hashEmailVerificationToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerifiedAt) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const { token, tokenHash, expiresAt } = generateEmailVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: expiresAt,
      },
    });

    await sendVerificationEmail(user.email, token, user.id);

    res.json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { lastLogoutAt: new Date() },
    });

    await logAudit({
      userId: req.user.userId,
      action: 'LOGOUT',
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    // Always return success to prevent email enumeration
    if (!user || user.status === 'SUSPENDED') {
      return res.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const { token, tokenHash, expiresAt } = generatePasswordResetToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetTokenExpires: expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, token, user.id);

    await logAudit({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
    });

    res.json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const tokenHash = hashPasswordResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
