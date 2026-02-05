import app from './app';
import { ensureSuperAdmin } from './services/superadmin';
import { seedContactsIfEmpty } from './services/seed';

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
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/mini-crm/api`);
    });
  });
