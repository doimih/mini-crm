import { prisma } from '../config/database';
import { DEFAULT_TRANSLATIONS } from './defaultTranslations';

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
