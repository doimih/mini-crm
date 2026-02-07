import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logAudit } from '../services/auditLog';

export const getTags = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    next(error);
  }
};

export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    const tag = await prisma.tag.create({
      data: { name },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'TAG_CREATE',
      entity: 'Tag',
      entityId: tag.id,
      details: { name: tag.name },
    });

    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.tag.delete({
      where: { id: parseInt(id) },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'TAG_DELETE',
      entity: 'Tag',
      entityId: parseInt(id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addTagToContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId, tagId } = req.params;

    await prisma.contactTag.create({
      data: {
        contactId: parseInt(contactId),
        tagId: parseInt(tagId),
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTACT_TAG_ADD',
      entity: 'Contact',
      entityId: parseInt(contactId),
      details: { tagId: parseInt(tagId) },
    });

    res.status(201).json({ message: 'Tag added to contact' });
  } catch (error) {
    next(error);
  }
};

export const removeTagFromContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId, tagId } = req.params;

    await prisma.contactTag.delete({
      where: {
        contactId_tagId: {
          contactId: parseInt(contactId),
          tagId: parseInt(tagId),
        },
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTACT_TAG_REMOVE',
      entity: 'Contact',
      entityId: parseInt(contactId),
      details: { tagId: parseInt(tagId) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
