import crypto from 'crypto';

export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { token, tokenHash, expiresAt };
};

export const hashPasswordResetToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
