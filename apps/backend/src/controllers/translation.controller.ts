import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logAudit } from '../services/auditLog';

export const getAllTranslations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const translations = await prisma.translation.findMany({
      orderBy: { key: 'asc' },
    });
    res.json(translations);
  } catch (error) {
    next(error);
  }
};

export const getTranslationByLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const language = req.params.language as string;
    const translations = await prisma.translation.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value format for the specified language
    const result: Record<string, string> = {};
    translations.forEach((t) => {
      result[t.key] = language === 'ro' ? t.ro : t.en;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateTranslation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { en, ro } = req.body;

    if (!en && !ro) {
      return res.status(400).json({ message: 'At least one translation is required' });
    }

    const translation = await prisma.translation.update({
      where: { id: parseInt(id) },
      data: {
        ...(en && { en }),
        ...(ro && { ro }),
      },
    });

    await logAudit({
      userId: req.user?.userId || 0,
      action: 'TRANSLATION_UPDATE',
      entity: 'Translation',
      entityId: translation.id,
      details: {
        key: translation.key,
        en,
        ro,
      },
    });

    res.json(translation);
  } catch (error) {
    next(error);
  }
};

export const createTranslation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key, en, ro } = req.body;

    if (!key || !en || !ro) {
      return res.status(400).json({ message: 'Key, English, and Romanian translations are required' });
    }

    const translation = await prisma.translation.create({
      data: { key, en, ro },
    });

    await logAudit({
      userId: req.user?.userId || 0,
      action: 'TRANSLATION_CREATE',
      entity: 'Translation',
      entityId: translation.id,
      details: { key, en, ro },
    });

    res.status(201).json(translation);
  } catch (error) {
    next(error);
  }
};
