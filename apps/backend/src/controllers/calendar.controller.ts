import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../services/auditLog';

const prisma = new PrismaClient();

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getCalendarEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const start = parseDate(req.query.start as string | undefined);
    const end = parseDate(req.query.end as string | undefined);

    const where = {
      userId,
      ...(start && end
        ? {
            startAt: { lte: end },
            endAt: { gte: start },
          }
        : {}),
    };

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const createCalendarEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { title, type, notes, startAt, endAt, allDay } = req.body as {
      title: string;
      type: 'TASK' | 'MEETING';
      notes?: string;
      startAt: string;
      endAt: string;
      allDay?: boolean;
    };

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (!title || !type || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid event data' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title,
        type,
        notes,
        startAt: start,
        endAt: end,
        allDay: Boolean(allDay),
      },
    });

    await logAudit({
      userId,
      action: 'CALENDAR_CREATE',
      entity: 'CalendarEvent',
      entityId: event.id,
      details: { title: event.title, type: event.type },
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateCalendarEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const id = parseInt(req.params.id);
    const { title, type, notes, startAt, endAt, allDay } = req.body as {
      title?: string;
      type?: 'TASK' | 'MEETING';
      notes?: string;
      startAt?: string;
      endAt?: string;
      allDay?: boolean;
    };

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (type !== undefined) data.type = type;
    if (notes !== undefined) data.notes = notes;
    if (startAt !== undefined) data.startAt = new Date(startAt);
    if (endAt !== undefined) data.endAt = new Date(endAt);
    if (allDay !== undefined) data.allDay = Boolean(allDay);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data,
    });

    await logAudit({
      userId,
      action: 'CALENDAR_UPDATE',
      entity: 'CalendarEvent',
      entityId: event.id,
      details: { title: event.title, type: event.type },
    });

    res.json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteCalendarEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const id = parseInt(req.params.id);
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    await logAudit({
      userId,
      action: 'CALENDAR_DELETE',
      entity: 'CalendarEvent',
      entityId: id,
      details: { title: event.title, type: event.type },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const formatDate = (value: Date) => {
  const iso = value.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return iso;
};

const formatDateOnly = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

export const exportCalendarEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const start = parseDate(req.query.start as string | undefined);
    const end = parseDate(req.query.end as string | undefined);

    const where = {
      userId,
      ...(start && end
        ? {
            startAt: { lte: end },
            endAt: { gte: start },
          }
        : {}),
    };

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mini CRM//Calendar//EN',
      'CALSCALE:GREGORIAN',
    ];

    for (const event of events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@mini-crm`);
      lines.push(`DTSTAMP:${formatDate(new Date())}`);
      lines.push(`SUMMARY:${event.title}`);
      lines.push(`CATEGORIES:${event.type}`);

      if (event.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.startAt)}`);
        lines.push(`DTEND;VALUE=DATE:${formatDateOnly(event.endAt)}`);
      } else {
        lines.push(`DTSTART:${formatDate(event.startAt)}`);
        lines.push(`DTEND:${formatDate(event.endAt)}`);
      }

      if (event.notes) {
        lines.push(`DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}`);
      }

      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    await logAudit({
      userId,
      action: 'CALENDAR_EXPORT',
      entity: 'CalendarEvent',
      details: { count: events.length },
    });

    res.header('Content-Type', 'text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=calendar.ics');
    res.send(lines.join('\r\n'));
  } catch (error) {
    next(error);
  }
};
