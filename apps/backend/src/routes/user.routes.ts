import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserVerification,
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(['SUPERADMIN']));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPERADMIN']),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED']),
    validate,
  ],
  createUser
);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('role').optional().isIn(['USER', 'ADMIN', 'SUPERADMIN']),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED']),
    validate,
  ],
  updateUser
);

router.patch(
  '/:id/status',
  [body('status').isIn(['ACTIVE', 'SUSPENDED']), validate],
  updateUserStatus
);

router.patch(
  '/:id/verification',
  [body('verified').isBoolean(), validate],
  updateUserVerification
);

router.delete('/:id', deleteUser);

export default router;
