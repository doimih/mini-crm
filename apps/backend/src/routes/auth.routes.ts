import { Router } from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  login
);

router.get('/verify', verifyEmail);

router.post('/resend-verification', authenticate, resendVerificationEmail);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), validate],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
    validate,
  ],
  resetPassword
);

router.post('/logout', authenticate, logout);

export default router;
