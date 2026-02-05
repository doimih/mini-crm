import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  getAttachments,
  deleteAttachment,
} from '../controllers/ticket.controller';

const router = Router();
const prisma = new PrismaClient();

// Setup multer for file uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and Office documents are allowed'));
  },
});

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);

router.post(
  '/',
  [
    body('subject').isString().notEmpty().trim(),
    body('description').isString().notEmpty().trim(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('assignedTo').optional({ nullable: true }).isInt(),
    body('contactId').optional({ nullable: true }).isInt(),
    validate,
  ],
  createTicket
);

router.put(
  '/:id',
  [
    body('subject').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('assignedTo').optional().isInt(),
    validate,
  ],
  updateTicket
);

router.delete('/:id', deleteTicket);

router.post(
  '/:id/comments',
  [body('content').isString().notEmpty().trim(), validate],
  addComment
);

router.get('/:id/attachments', getAttachments);

router.post('/:id/attachments', upload.single('file'), async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (ticket.userId !== userId && ticket.assignedTo !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId,
        filename: req.file.originalname,
        filepath: req.file.filename,
        filesize: req.file.size,
        mimetype: req.file.mimetype,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/attachments/:attachmentId', deleteAttachment);

router.get('/:id/attachments/:attachmentId/download', async (req, res, next) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId);
    const userId = req.user?.userId;

    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check access
    if (attachment.ticket.userId !== userId && attachment.ticket.assignedTo !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(uploadsDir, attachment.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, attachment.filename);
  } catch (error) {
    next(error);
  }
});

export default router;
