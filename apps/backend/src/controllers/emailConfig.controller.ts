import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEmailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });

    if (!config) {
      return res.json({
        host: '',
        port: 587,
        secure: false,
        username: '',
        from: '',
        hasPassword: false,
      });
    }

    res.json({
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username || '',
      from: config.from || '',
      hasPassword: Boolean(config.password),
    });
  } catch (error) {
    next(error);
  }
};

export const upsertEmailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { host, port, secure, username, password, from } = req.body as {
      host: string;
      port: number;
      secure?: boolean;
      username?: string;
      password?: string;
      from?: string;
    };

    const existing = await prisma.emailConfig.findUnique({ where: { id: 1 } });

    const nextPassword =
      typeof password === 'string' && password.length > 0
        ? password
        : existing?.password ?? null;

    const config = await prisma.emailConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        host,
        port,
        secure: Boolean(secure),
        username: username || null,
        password: nextPassword,
        from: from || null,
      },
      update: {
        host,
        port,
        secure: Boolean(secure),
        username: username || null,
        password: nextPassword,
        from: from || null,
      },
    });

    res.json({
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username || '',
      from: config.from || '',
      hasPassword: Boolean(config.password),
    });
  } catch (error) {
    next(error);
  }
};

export const testEmailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { host, port, secure, username, password } = req.body as {
      host: string;
      port: number;
      secure?: boolean;
      username?: string;
      password?: string;
    };

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: Boolean(secure),
      auth: username
        ? {
            user: username,
            pass: password || undefined,
          }
        : undefined,
    });

    await transporter.verify();

    res.json({ success: true, message: 'Connection successful' });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Connection failed',
    });
  }
};
