import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
