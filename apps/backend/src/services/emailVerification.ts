import crypto from 'crypto';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  return { token, tokenHash, expiresAt };
};

export const hashEmailVerificationToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
