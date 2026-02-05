import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
};

export const isEmailConfigured = async () => Boolean(await getEmailConfig());

const getTransporter = async () => {
  const config = await getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.username
      ? {
          user: config.username,
          pass: config.password || undefined,
        }
      : undefined,
  });
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyUrl = `${appUrl}/verify?token=${token}`;
  const transporter = await getTransporter();

  if (!transporter) {
    console.warn('SMTP not configured. Verification link:', verifyUrl);
    return;
  }

  const config = await getEmailConfig();
  const fromAddress = config?.from || 'no-reply@localhost';

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: 'Verify your email',
    text: `Please verify your email by opening this link: ${verifyUrl}`,
    html: `
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `,
  });
};
