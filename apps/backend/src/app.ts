import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';
import tagRoutes from './routes/tag.routes';
import userRoutes from './routes/user.routes';
import emailConfigRoutes from './routes/emailConfig.routes';
import emailLogRoutes from './routes/emailLog.routes';
import auditLogRoutes from './routes/auditLog.routes';
import calendarRoutes from './routes/calendar.routes';
import profileRoutes from './routes/profile.routes';
import translationRoutes from './routes/translation.routes';
import ticketRoutes from './routes/ticket.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check under API prefix
app.get('/mini-crm/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes with /mini-crm/api prefix
app.use('/mini-crm/api/auth', authRoutes);
app.use('/mini-crm/api/contacts', contactRoutes);
app.use('/mini-crm/api/tags', tagRoutes);
app.use('/mini-crm/api/users', userRoutes);
app.use('/mini-crm/api/email-config', emailConfigRoutes);
app.use('/mini-crm/api/email-logs', emailLogRoutes);
app.use('/mini-crm/api/audit-logs', auditLogRoutes);
app.use('/mini-crm/api/calendar', calendarRoutes);
app.use('/mini-crm/api/profile', profileRoutes);
app.use('/mini-crm/api/translations', translationRoutes);
app.use('/mini-crm/api/tickets', ticketRoutes);

// Error handler
app.use(errorHandler);

export default app;