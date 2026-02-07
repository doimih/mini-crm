import nodemailer from 'nodemailer';
import { prisma } from '../config/database';

const appUrl = process.env.APP_URL || 'http://localhost:3000/mini-crm';

type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  username?: string | null;
  password?: string | null;
  from?: string | null;
};

const getEmailConfig = async (): Promise<EmailConfig | null> => {
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      username: process.env.SMTP_USER || null,
      password: process.env.SMTP_PASS || null,
      from: process.env.SMTP_FROM || null,
    };
  }

  try {
    const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });
    if (!config) return null;

    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.password,
      from: config.from,
    };
  } catch (error) {
    console.warn('Failed to load email config. Email disabled.', error);
    return null;
  }
};

export const isEmailConfigured = async () => {
  const config = await getEmailConfig();
  return Boolean(config && config.host);
};

const getTransporter = async () => {
  const config = await getEmailConfig();
  if (!config) return null;

  const secure = config.port === 465 ? true : config.secure;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    requireTLS: config.port === 587,
    auth: config.username
      ? {
          user: config.username,
          pass: config.password || undefined,
        }
      : undefined,
  });
};

export const sendVerificationEmail = async (to: string, token: string, userId?: number) => {
  const verifyUrl = `${appUrl}/verify?token=${token}`;
  const transporter = await getTransporter();

  const subject = 'Verify your email';
  const emailLog = await prisma.emailLog.create({
    data: {
      userId: userId || null,
      recipient: to,
      subject,
      status: 'PENDING',
    },
  });

  if (!transporter) {
    console.warn('SMTP not configured. Verification link:', verifyUrl);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage: 'SMTP not configured',
      },
    });
    return;
  }

  const config = await getEmailConfig();
  const fromAddress = config?.from || 'no-reply@localhost';

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: `Please verify your email by opening this link: ${verifyUrl}`,
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `,
    });
    
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.warn('Failed to send verification email.', error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

export const sendPasswordResetEmail = async (to: string, token: string, userId?: number) => {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const transporter = await getTransporter();

  const subject = 'Reset your password';
  const emailLog = await prisma.emailLog.create({
    data: {
      userId: userId || null,
      recipient: to,
      subject,
      status: 'PENDING',
    },
  });

  if (!transporter) {
    console.warn('SMTP not configured. Password reset link:', resetUrl);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage: 'SMTP not configured',
      },
    });
    return;
  }

  const config = await getEmailConfig();
  const fromAddress = config?.from || 'no-reply@localhost';

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: `You requested to reset your password. Please click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <p>You requested to reset your password.</p>
        <p>Please click the link below to reset it:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.warn('Failed to send password reset email.', error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

