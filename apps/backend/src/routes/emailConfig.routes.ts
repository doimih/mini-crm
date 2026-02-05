import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import {
  getEmailConfig,
  upsertEmailConfig,
  testEmailConfig,
} from '../controllers/emailConfig.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(['SUPERADMIN']));

router.get('/', getEmailConfig);

router.put(
  '/',
  [
    body('host').isString().notEmpty(),
    body('port').isInt({ min: 1, max: 65535 }),
    body('secure').optional().isBoolean(),
    body('username').optional().isString(),
    body('password').optional().isString(),
    body('from').optional().isString(),
    validate,
  ],
  upsertEmailConfig
);

router.post(
  '/test',
  [
    body('host').isString().notEmpty(),
    body('port').isInt({ min: 1, max: 65535 }),
    body('secure').optional().isBoolean(),
    body('username').optional().isString(),
    body('password').optional().isString(),
    validate,
  ],
  testEmailConfig
);

export default router;
