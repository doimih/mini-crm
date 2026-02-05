import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

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

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
            { contactPersonName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

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

    const contact = await prisma.contact.findUnique({
      where: { id: parseInt(id) },
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
      data: { name, contactPersonName, email, phone, company, notes },
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

    await prisma.contact.delete({
      where: { id: parseInt(id) },
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
