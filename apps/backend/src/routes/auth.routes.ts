import { Router } from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
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

router.post('/logout', authenticate, logout);

export default router;
