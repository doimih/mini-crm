import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  exportCalendarEvents,
} from '../controllers/calendar.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCalendarEvents);
router.get('/export', exportCalendarEvents);

router.post(
  '/',
  [
    body('title').notEmpty().trim(),
    body('type').isIn(['TASK', 'MEETING']),
    body('startAt').notEmpty(),
    body('endAt').notEmpty(),
    body('notes').optional().isString(),
    body('allDay').optional().isBoolean(),
    validate,
  ],
  createCalendarEvent
);

router.put(
  '/:id',
  [
    body('title').optional().isString(),
    body('type').optional().isIn(['TASK', 'MEETING']),
    body('startAt').optional(),
    body('endAt').optional(),
    body('notes').optional().isString(),
    body('allDay').optional().isBoolean(),
    validate,
  ],
  updateCalendarEvent
);

router.delete('/:id', deleteCalendarEvent);

export default router;
