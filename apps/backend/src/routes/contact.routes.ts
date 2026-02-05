import { Router } from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  exportContacts,
} from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getContacts);
router.get('/export', exportContacts);
router.get('/:id', getContact);

router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('contactPersonName').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('notes').optional().trim(),
    validate,
  ],
  createContact
);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('contactPersonName').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('notes').optional().trim(),
    validate,
  ],
  updateContact
);

router.delete('/:id', deleteContact);

export default router;
