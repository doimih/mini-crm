import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        emailVerifiedAt: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'User is suspended' });
    }

    // Use fresh role from database instead of token
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: user.role,
    };

    const isLogout = req.originalUrl?.includes('/auth/logout');
    const isResendVerification = req.originalUrl?.includes('/auth/resend-verification');

    if (!user.emailVerifiedAt && !isLogout && !isResendVerification) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
