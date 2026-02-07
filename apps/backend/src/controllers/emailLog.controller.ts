import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getEmailLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;

    const where = status ? { status: status as any } : {};

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ]);

    res.json({
      logs,
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

export const getEmailLogById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);

    const log = await prisma.emailLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
};

export const deleteEmailLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.emailLog.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const clearEmailLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { olderThan } = req.body as { olderThan?: string };

    let where = {};
    if (olderThan) {
      const date = new Date(olderThan);
      where = { createdAt: { lt: date } };
    }

    const result = await prisma.emailLog.deleteMany({ where });

    res.json({ deleted: result.count });
  } catch (error) {
    next(error);
  }
};
