import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
} from '../services/emailVerification';
import { isEmailConfigured, sendVerificationEmail } from '../services/mailer';

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
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
          emailVerificationTokenExpires: null,
        },
      });

      return res.status(201).json({
        message: 'Email verification disabled. Account activated.',
      });
    }

    const { token, tokenHash, expiresAt } = generateEmailVerificationToken();

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpires: expiresAt,
      },
    });

    await sendVerificationEmail(email, token);

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

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
