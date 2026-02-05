import app from './app';
import { ensureSuperAdmin } from './services/superadmin';
import { seedContactsIfEmpty } from './services/seed';
import { seedTranslations } from './services/seedTranslations';

const PORT = process.env.PORT || 3000;

ensureSuperAdmin()
  .catch((error) => {
    console.error('Failed to ensure superadmin:', error);
  })
  .then(async () => {
    if (process.env.SEED_CONTACTS === 'true') {
      try {
        await seedContactsIfEmpty();
      } catch (error) {
        console.error('Failed to seed contacts:', error);
      }
    }

    // Always seed translations on startup
    try {
      await seedTranslations();
    } catch (error) {
      console.error('Failed to seed translations:', error);
    }
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/mini-crm/api`);
    });
  });
