import { PrismaClient } from '@prisma/client';
import { DEFAULT_TRANSLATIONS } from './defaultTranslations';

const prisma = new PrismaClient();

export const seedTranslations = async () => {
  try {
    const existingCount = await prisma.translation.count();

    if (existingCount === 0) {
      console.log('Seeding default translations...');
      await prisma.translation.createMany({
        data: DEFAULT_TRANSLATIONS,
        skipDuplicates: true,
      });
      console.log('Translations seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding translations:', error);
  }
};
