import { Router } from 'express';
import {
  getTags,
  createTag,
  deleteTag,
  addTagToContact,
  removeTagFromContact,
} from '../controllers/tag.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTags);
router.post(
  '/',
  authorizeRoles(['SUPERADMIN']),
  [body('name').notEmpty().trim(), validate],
  createTag
);
router.delete('/:id', authorizeRoles(['SUPERADMIN']), deleteTag);

router.post('/contact/:contactId/tag/:tagId', addTagToContact);
router.delete('/contact/:contactId/tag/:tagId', removeTagFromContact);

export default router;
