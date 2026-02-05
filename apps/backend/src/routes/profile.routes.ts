import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  getProfile,
  updateProfile,
  getMyAuditLogs,
} from '../controllers/profile.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.get('/me/audit-logs', getMyAuditLogs);

router.put(
  '/me',
  [
    body('phone').optional().isString().trim(),
    body('avatarUrl').optional({ nullable: true }).isString(),
    body('notificationPreference').optional().isIn(['PUSH', 'EMAIL', 'NONE']),
    validate,
  ],
  updateProfile
);

export default router;
