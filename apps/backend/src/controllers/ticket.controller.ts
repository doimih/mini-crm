import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../services/auditLog';

const prisma = new PrismaClient();

export const getTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = {
      OR: [
        { userId },
        { assignedTo: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              email: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          attachments: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        commentCount: ticket.comments.length,
        attachmentCount: ticket.attachments.length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (ticket.userId !== userId && ticket.assignedTo !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, description, priority, assignedTo, contactId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        subject,
        description,
        priority: priority || 'MEDIUM',
        assignedTo: assignedTo || null,
        contactId: contactId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await logAudit({
      userId,
      action: 'TICKET_CREATE',
      entity: 'Ticket',
      entityId: ticket.id,
      details: { subject, priority, assignedTo },
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const { subject, description, status, priority, assignedTo } = req.body;
    const userId = req.user?.userId;

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (existing.userId !== userId && existing.assignedTo !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        subject,
        description,
        status,
        priority,
        assignedTo: assignedTo !== undefined ? assignedTo : existing.assignedTo,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await logAudit({
      userId,
      action: 'TICKET_UPDATE',
      entity: 'Ticket',
      entityId: ticket.id,
      details: { status, priority },
    });

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only creator or admin can delete
    if (existing.userId !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.ticket.delete({ where: { id } });

    await logAudit({
      userId,
      action: 'TICKET_DELETE',
      entity: 'Ticket',
      entityId: id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user?.userId;

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

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await logAudit({
      userId,
      action: 'TICKET_COMMENT_ADD',
      entity: 'TicketComment',
      entityId: comment.id,
      details: { ticketId },
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user?.userId;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (ticket.userId !== userId && ticket.assignedTo !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(attachments);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    await prisma.ticketAttachment.delete({ where: { id: attachmentId } });

    await logAudit({
      userId,
      action: 'TICKET_ATTACHMENT_DELETE',
      entity: 'TicketAttachment',
      entityId: attachmentId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
