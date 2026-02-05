import { Router } from 'express';
import {
  getAllTranslations,
  getTranslationByLanguage,
  updateTranslation,
  createTranslation,
} from '../controllers/translation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Public endpoint to get translations for a specific language (for frontend)
router.get('/:language', getTranslationByLanguage);

// Admin only endpoints
router.get(
  '/admin/all',
  authenticate,
  authorizeRoles(['ADMIN', 'SUPERADMIN']),
  getAllTranslations
);

router.post(
  '/admin/create',
  authenticate,
  authorizeRoles(['ADMIN', 'SUPERADMIN']),
  [
    body('key').isString().notEmpty(),
    body('en').isString().notEmpty(),
    body('ro').isString().notEmpty(),
    validate,
  ],
  createTranslation
);

router.put(
  '/admin/:id',
  authenticate,
  authorizeRoles(['ADMIN', 'SUPERADMIN']),
  [
    body('en').optional().isString(),
    body('ro').optional().isString(),
    validate,
  ],
  updateTranslation
);

export default router;
