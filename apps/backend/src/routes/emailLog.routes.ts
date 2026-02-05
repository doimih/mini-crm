import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import {
  getEmailLogs,
  getEmailLogById,
  deleteEmailLog,
  clearEmailLogs,
} from '../controllers/emailLog.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(['SUPERADMIN']));

router.get('/', getEmailLogs);
router.get('/:id', getEmailLogById);
router.delete('/:id', deleteEmailLog);
router.post(
  '/clear',
  [body('olderThan').optional().isISO8601(), validate],
  clearEmailLogs
);

export default router;
