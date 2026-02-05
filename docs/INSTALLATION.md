# Ghid de Instalare - Mini CRM

Acest ghid oferă instrucțiuni detaliate pentru instalarea și configurarea aplicației Mini CRM.

## Cerințe de Sistem

### Pentru Dezvoltare Locală

- **Node.js**: versiunea 18.x sau 20.x
- **npm**: versiunea 8.x sau superioară
- **PostgreSQL**: versiunea 15.x
- **Git**: pentru clonarea repository-ului

### Pentru Deployment cu Docker

- **Docker**: versiunea 20.x sau superioară
- **Docker Compose**: versiunea 1.29.x sau superioară
- **Server Linux** (recomandat Ubuntu 20.04+)

## Instalare Locală (Dezvoltare)

### 1. Clonare Repository

```bash
git clone https://github.com/doimih/mini-crm.git
cd mini-crm
```

### 2. Configurare PostgreSQL

Creează o bază de date PostgreSQL:

```bash
# Conectare la PostgreSQL
psql -U postgres

# Creare bază de date
CREATE DATABASE minicrm;

# Creare utilizator (opțional)
CREATE USER minicrm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE minicrm TO minicrm_user;
```

### 3. Configurare Backend

```bash
# Navighează în directorul backend
cd apps/backend

# Instalează dependențele
npm install

# Copiază fișierul de configurare
cp .env.example .env
```

Editează fișierul `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/minicrm

# JWT Secret (generează unul sigur în producție)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please

# Server
PORT=3000
NODE_ENV=development

# App URL
APP_URL=http://localhost:3000

# Superadmin (primul utilizator)
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=ChangeMe123!

# Seed data (opțional)
SEED_CONTACTS=true

# Email Configuration (opțional pentru dezvoltare)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=noreply@minicrm.local
# SMTP_USER=
# SMTP_PASSWORD=
```

### 4. Rulare Migrări Prisma

```bash
# Generează client Prisma
npx prisma generate

# Rulează migrările
npx prisma migrate dev

# Seed database (opțional)
npx prisma db seed
```

### 5. Pornire Backend

```bash
# Mod dezvoltare (cu hot reload)
npm run dev

# Sau build + start
npm run build
npm start
```

Backend-ul va rula pe `http://localhost:3000`

### 6. Configurare Frontend

Deschide un terminal nou:

```bash
# Navighează în directorul frontend
cd apps/frontend

# Instalează dependențele
npm install

# Pornește serverul de dezvoltare
npm run dev
```

Frontend-ul va rula pe `http://localhost:3000/mini-crm/`

## Instalare cu Docker (Producție)

### 1. Clonare Repository

```bash
git clone https://github.com/doimih/mini-crm.git
cd mini-crm
```

### 2. Configurare Docker Compose

Editează `docker/docker-compose.yml` și actualizează variabilele de mediu după necesitate.

Setări importante:

```yaml
backend:
  environment:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/minicrm
    JWT_SECRET: your-super-secret-jwt-key-change-in-production-please
    PORT: 3000
    NODE_ENV: production
    APP_URL: https://your-domain.com/mini-crm
    SUPERADMIN_EMAIL: admin@yourdomain.com
    SUPERADMIN_PASSWORD: ChangeMe123!
```

### 3. Build și Start

```bash
cd docker

# Build imagini
docker-compose build

# Pornește containerele
docker-compose up -d

# Verifică status
docker-compose ps
```

### 4. Verificare Logs

```bash
# Vezi logs pentru toate serviciile
docker-compose logs -f

# Vezi logs pentru un serviciu specific
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Acces la Aplicație

Aplicația va fi disponibilă la adresa configurată în Traefik (de exemplu: https://projects.doimih.net/mini-crm/)

## Configurare Traefik (Reverse Proxy)

Mini CRM folosește Traefik pentru routing și SSL.

### Labels Traefik pentru Frontend:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=shop-online_web"
  - "traefik.http.routers.mini-crm-frontend.rule=Host(`your-domain.com`) && PathPrefix(`/mini-crm`)"
  - "traefik.http.routers.mini-crm-frontend.entrypoints=websecure"
  - "traefik.http.routers.mini-crm-frontend.tls=true"
```

### Labels Traefik pentru Backend:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=shop-online_web"
  - "traefik.http.routers.mini-crm-backend.rule=Host(`your-domain.com`) && PathPrefix(`/mini-crm/api`)"
  - "traefik.http.routers.mini-crm-backend.entrypoints=websecure"
  - "traefik.http.routers.mini-crm-backend.tls=true"
```

## Configurare Email (SMTP)

Pentru funcționalitatea de email (verificare cont, resetare parolă), configurează un server SMTP:

### Opțiuni:

1. **MailHog** (pentru dezvoltare) - deja inclus în docker-compose
2. **Gmail** (pentru producție limitată):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

3. **SendGrid, Mailgun, AWS SES** (pentru producție)

## Comenzi Utile

### Backend

```bash
# Rulează în modul dezvoltare
npm run dev

# Build pentru producție
npm run build

# Start aplicația built
npm start

# Generează Prisma client
npm run prisma:generate

# Rulează migrări
npm run migrate

# Deschide Prisma Studio
npx prisma studio
```

### Frontend

```bash
# Rulează în modul dezvoltare
npm run dev

# Build pentru producție
npm run build

# Preview build local
npm run preview
```

### Docker

```bash
# Build și start
docker-compose up -d

# Stop
docker-compose down

# Rebuild un serviciu specific
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Vezi logs
docker-compose logs -f [service_name]

# Restart serviciu
docker-compose restart [service_name]
```

## Depanare (Troubleshooting)

### Backend nu pornește

1. Verifică dacă PostgreSQL rulează
2. Verifică DATABASE_URL în .env
3. Rulează migrările Prisma: `npx prisma migrate dev`

### Frontend nu se conectează la backend

1. Verifică dacă backend-ul rulează pe portul corect
2. Verifică configurarea proxy în `vite.config.ts`
3. Verifică console-ul browserului pentru erori CORS

### Docker: Container nu pornește

```bash
# Verifică logs
docker-compose logs [service_name]

# Rebuild container
docker-compose build --no-cache [service_name]
docker-compose up -d [service_name]
```

### Erori de permisiuni PostgreSQL

```bash
# În containerul de PostgreSQL
docker-compose exec postgres psql -U postgres -d minicrm
GRANT ALL PRIVILEGES ON DATABASE minicrm TO postgres;
```

## Following Steps

După instalare:
1. Consultă [Ghidul Utilizator](./USER_GUIDE.md) pentru utilizare
2. Vezi [Documentația API](./API_DOCUMENTATION.md) pentru integrări
3. Citește despre [Deployment](./DEPLOYMENT.md) pentru producție

## Suport

Pentru probleme de instalare, deschide un issue pe GitHub sau contactează echipa de dezvoltare.
