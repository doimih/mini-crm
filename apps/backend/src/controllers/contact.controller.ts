import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { stringify } from 'csv-stringify/sync';
import { logAudit } from '../services/auditLog';

export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: req.user!.userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
        { contactPersonName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      contacts: contacts.map((contact: any) => ({
        ...contact,
        tags: contact.tags.map((ct: any) => ct.tag),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { 
        id: parseInt(id),
        userId: req.user!.userId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({
      ...contact,
      tags: contact.tags.map((ct: any) => ct.tag),
    });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, contactPersonName, email, phone, company, notes } = req.body;

    const contact = await prisma.contact.create({
      data: { 
        userId: req.user!.userId,
        name, 
        contactPersonName, 
        email, 
        phone, 
        company, 
        notes 
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTACT_CREATE',
      entity: 'Contact',
      entityId: contact.id,
      details: { name: contact.name },
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, contactPersonName, email, phone, company, notes } = req.body;

    // Check if contact belongs to user
    const existing = await prisma.contact.findFirst({
      where: { 
        id: parseInt(id),
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const contact = await prisma.contact.update({
      where: { id: parseInt(id) },
      data: { name, contactPersonName, email, phone, company, notes },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTACT_UPDATE',
      entity: 'Contact',
      entityId: contact.id,
      details: { name: contact.name },
    });

    res.json({
      ...contact,
      tags: contact.tags.map((ct: any) => ct.tag),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if contact belongs to user
    const existing = await prisma.contact.findFirst({
      where: { 
        id: parseInt(id),
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id: parseInt(id) },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTACT_DELETE',
      entity: 'Contact',
      entityId: parseInt(id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const exportContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const csv = stringify(
      contacts.map((contact: any) => ({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        contactPersonName: contact.contactPersonName || '',
        notes: contact.notes || '',
        tags: contact.tags.map((ct: any) => ct.tag.name).join(', '),
      })),
      {
        header: true,
        columns: ['name', 'email', 'phone', 'company', 'contactPersonName', 'notes', 'tags'],
      }
    );

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
