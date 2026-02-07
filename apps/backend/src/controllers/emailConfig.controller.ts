import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logAudit } from '../services/auditLog';

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

    await logAudit({
      userId: req.user?.userId,
      action: 'EMAIL_CONFIG_UPDATE',
      entity: 'EmailConfig',
      entityId: config.id,
      details: { host: config.host, port: config.port, secure: config.secure },
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
    const { host, port, secure, username, password, testEmail } = req.body as {
      host: string;
      port: number;
      secure?: boolean;
      username?: string;
      password?: string;
      testEmail?: string;
    };

    const nodemailer = require('nodemailer');

    const useSecure = port === 465 ? true : Boolean(secure);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: useSecure,
      requireTLS: port === 587,
      auth: username
        ? {
            user: username,
            pass: password || undefined,
          }
        : undefined,
    });

    // First verify connection
    await transporter.verify();

    // If testEmail is provided, send a test email
    if (testEmail) {
      const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });
      const fromAddress = config?.from || username || 'test@localhost';

      await transporter.sendMail({
        from: fromAddress,
        to: testEmail,
        subject: 'Test Email Configuration',
        text: 'This is a test email to verify your email configuration is working correctly.',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this email, your SMTP settings are configured properly.</p>
          <hr>
          <p><small>Server: ${host}:${port}</small></p>
        `,
      });

      res.json({ 
        success: true, 
        message: 'Connection successful and test email sent to ' + testEmail 
      });
    } else {
      res.json({ success: true, message: 'Connection successful (no test email sent)' });
    }
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Connection failed',
    });
  }
};
