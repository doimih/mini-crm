import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { getAuditLogs } from '../controllers/auditLog.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(['SUPERADMIN']));

router.get('/', getAuditLogs);

export default router;
