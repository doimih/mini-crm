# Ghid de Deployment - Mini CRM

Acest ghid oferă instrucțiuni pas cu pas pentru deployment-ul aplicației Mini CRM în producție.

## Cuprins

1. [Pregătire pentru Producție](#pregatire-pentru-productie)
2. [Deployment Docker](#deployment-docker)
3. [Configurare Traefik](#configurare-traefik)
4. [Configurare SSL/TLS](#configurare-ssltls)
5. [Backup și Restore](#backup-si-restore)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Pregătire pentru Producție

### 1. Server Requirements

**Minim:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04 LTS sau superior

**Recomandat:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS

### 2. Instalare Docker

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Configurare Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 4. Creare Utilizator pentru Aplicație

```bash
# Create user
sudo adduser crm-user
sudo usermod -aG docker crm-user

# Switch to user
su - crm-user
```

## Deployment Docker

### 1. Clonare Repository

```bash
cd /home/crm-user
git clone https://github.com/doimih/mini-crm.git
cd mini-crm
```

### 2. Configurare Environment Variables

#### Backend Environment

Editează `docker/docker-compose.yml` și actualizează secțiunea `backend.environment`:

```yaml
backend:
  environment:
    # Database - IMPORTANT: Change credentials!
    DATABASE_URL: postgresql://postgres:STRONG_PASSWORD_HERE@postgres:5432/minicrm
    
    # JWT Secret - IMPORTANT: Generate a strong secret!
    JWT_SECRET: your-super-secret-jwt-key-CHANGE-THIS-IN-PRODUCTION
    
    # Server
    PORT: 3000
    NODE_ENV: production
    
    # App URL - Update with your domain
    APP_URL: https://yourdomain.com/mini-crm
    
    # Superadmin - First user credentials
    SUPERADMIN_EMAIL: admin@yourdomain.com
    SUPERADMIN_PASSWORD: ChangeMe123!
    
    # Seed data (set to false in production)
    SEED_CONTACTS: "false"
    
    # SMTP Configuration
    SMTP_HOST: smtp.yourmailserver.com
    SMTP_PORT: "587"
    SMTP_SECURE: "false"
    SMTP_USER: noreply@yourdomain.com
    SMTP_PASSWORD: your-smtp-password
    SMTP_FROM: "Mini CRM <noreply@yourdomain.com>"
```

#### PostgreSQL Credentials

```yaml
postgres:
  environment:
    POSTGRES_DB: minicrm
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: STRONG_PASSWORD_HERE  # CHANGE THIS!
```

**⚠️ IMPORTANT:**
- Schimbă `POSTGRES_PASSWORD` cu o parolă puternică
- Schimbă `JWT_SECRET` cu un string aleatoriu lung (minim 32 caractere)
- Actualizează `SUPERADMIN_EMAIL` și `SUPERADMIN_PASSWORD`
- Configurează SMTP cu credențiale reale

### 3. Generare JWT Secret

```bash
# Generate a random 64-character secret
openssl rand -hex 32
```

Folosește output-ul ca `JWT_SECRET`.

### 4. Build și Start

```bash
cd docker

# Build images (prima dată)
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Verificare Deployment

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# mini-crm-frontend   Up
# mini-crm-backend    Up
# mini-crm-db         Up (healthy)
# mini-crm-mailhog    Up

# Check backend logs
docker-compose logs backend | tail -50

# Check frontend logs
docker-compose logs frontend | tail -50
```

## Configurare Traefik

### 1. Setup Traefik Network

```bash
# Create external network (if not exists)
docker network create shop-online_web
```

### 2. Configurare Labels

Labels în `docker-compose.yml` sunt deja configurate:

**Frontend:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=shop-online_web"
  - "traefik.http.routers.mini-crm-frontend.rule=Host(`yourdomain.com`) && PathPrefix(`/mini-crm`)"
  - "traefik.http.routers.mini-crm-frontend.entrypoints=websecure"
  - "traefik.http.routers.mini-crm-frontend.tls=true"
  - "traefik.http.services.mini-crm-frontend.loadbalancer.server.port=80"
```

**Backend:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=shop-online_web"
  - "traefik.http.routers.mini-crm-backend.rule=Host(`yourdomain.com`) && PathPrefix(`/mini-crm/api`)"
  - "traefik.http.routers.mini-crm-backend.entrypoints=websecure"
  - "traefik.http.routers.mini-crm-backend.tls=true"
  - "traefik.http.services.mini-crm-backend.loadbalancer.server.port=3000"
```

### 3. Actualizare Domeniu

Înlocuiește `yourdomain.com` cu domeniul tău real în toate label-urile Traefik.

### 4. Restart Services

```bash
docker-compose down
docker-compose up -d
```

## Configurare SSL/TLS

### Opțiune 1: Let's Encrypt (Automat via Traefik)

Traefik poate genera automat certificate SSL/TLS folosind Let's Encrypt.

**Configurare Traefik (`traefik.yml`):**

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

**Update labels să folosească Let's Encrypt:**

```yaml
- "traefik.http.routers.mini-crm-frontend.tls.certresolver=letsencrypt"
```

### Opțiune 2: Certificate Manual

```bash
# Generate self-signed certificate (pentru testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /path/to/certs/minicrm.key \
    -out /path/to/certs/minicrm.crt

# Mount certificates în Traefik config
```

## Backup și Restore

### Backup Database

#### 1. Backup Manual

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker-compose exec postgres pg_dump -U postgres minicrm > ~/backups/minicrm-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip ~/backups/minicrm-*.sql
```

#### 2. Automated Daily Backup

Creează script `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/crm-user/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/minicrm-$DATE.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup database
cd /home/crm-user/mini-crm/docker
docker-compose exec -T postgres pg_dump -U postgres minicrm > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/crm-user/backup.sh >> /home/crm-user/backup.log 2>&1
```

### Restore Database

```bash
# Stop backend to prevent connections
docker-compose stop backend

# Restore from backup
gunzip -c ~/backups/minicrm-YYYYMMDD-HHMMSS.sql.gz | \
    docker-compose exec -T postgres psql -U postgres minicrm

# Restart services
docker-compose start backend
```

### Backup Uploads (Files)

```bash
# Backup uploaded files
cd /home/crm-user/mini-crm/apps/backend
tar -czf ~/backups/uploads-$(date +%Y%m%d).tar.gz uploads/

# Restore uploads
tar -xzf ~/backups/uploads-YYYYMMDD.tar.gz -C /home/crm-user/mini-crm/apps/backend/
```

## Monitoring

### 1. Container Health Checks

```bash
# Check container status
docker-compose ps

# View resource usage
docker stats

# Check logs
docker-compose logs -f --tail=100
```

### 2. Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres

# Save logs to file
docker-compose logs --no-color > app-logs-$(date +%Y%m%d).log
```

### 3. Database Monitoring

```bash
# Connect to database
docker-compose exec postgres psql -U postgres minicrm

# Check database size
SELECT pg_size_pretty(pg_database_size('minicrm'));

# Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check connections
SELECT count(*) FROM pg_stat_activity;
```

### 4. Disk Space Monitoring

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a --volumes
```

### 5. Setup Monitoring Tools (Opțional)

**Prometheus + Grafana:**

```bash
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Updates și Maintenance

### Update Application

```bash
cd /home/crm-user/mini-crm

# Pull latest changes
git pull origin main

# Rebuild and restart
cd docker
docker-compose build
docker-compose up -d

# Run database migrations (if any)
docker-compose exec backend npx prisma migrate deploy
```

### Update Dependencies

```bash
# Backend
cd apps/backend
npm update
npm audit fix

# Frontend
cd apps/frontend
npm update
npm audit fix

# Rebuild containers
cd ../../docker
docker-compose build
docker-compose up -d
```

### Database Migrations

```bash
# After schema changes in prisma/schema.prisma

# Generate migration
docker-compose exec backend npx prisma migrate dev --name migration_name

# Or deploy existing migrations
docker-compose exec backend npx prisma migrate deploy

# Regenerate Prisma client
docker-compose exec backend npx prisma generate

# Restart backend
docker-compose restart backend
```

## Troubleshooting

### Container nu pornește

```bash
# Check logs
docker-compose logs [service_name]

# Check configuration
docker-compose config

# Restart service
docker-compose restart [service_name]

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL

# Test connection manually
docker-compose exec postgres psql -U postgres minicrm
```

### Frontend nu se încarcă

```bash
# Check if Nginx is serving files
docker-compose exec frontend ls -la /usr/share/nginx/html/mini-crm

# Check Nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check Nginx logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Email nu se trimite

```bash
# Check SMTP configuration
docker-compose exec backend env | grep SMTP

# Check email logs in database
docker-compose exec postgres psql -U postgres minicrm \
    -c "SELECT * FROM \"EmailLog\" ORDER BY \"createdAt\" DESC LIMIT 10;"

# Test SMTP manually
docker-compose exec backend node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
transporter.verify((error, success) => {
  console.log(error || 'SMTP Ready');
});
"
```

### Performanță lentă

```bash
# Check resource usage
docker stats

# Check database performance
docker-compose exec postgres psql -U postgres minicrm \
    -c "SELECT * FROM pg_stat_activity;"

# Optimize database
docker-compose exec postgres psql -U postgres minicrm \
    -c "VACUUM ANALYZE;"

# Check logs for slow queries
docker-compose logs backend | grep "slow"
```

### Disk space plin

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# Clean old backups
find ~/backups -name "*.sql.gz" -mtime +30 -delete
```

## Security Best Practices

### 1. Actualizări regulate

```bash
# Set up automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 4. Rate Limiting (TODO)

Implement rate limiting in backend pentru a preveni abuse.

### 5. Regular Audits

```bash
# Check failed login attempts
sudo cat /var/log/auth.log | grep "Failed password"

# Check Docker security
docker scan mini-crm-backend
docker scan mini-crm-frontend
```

## Performance Optimization

### 1. Database Optimization

```bash
# Add indexes (already done in schema)
# Regular VACUUM ANALYZE
docker-compose exec postgres psql -U postgres minicrm \
    -c "VACUUM ANALYZE;"

# Adjust PostgreSQL settings in docker-compose.yml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_WORK_MEM: 8MB
    POSTGRES_MAINTENANCE_WORK_MEM: 64MB
```

### 2. Nginx Caching

Update `nginx.conf`:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Enable Gzip Compression

În `nginx.conf`:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## Rollback Strategy

### Rollback Code

```bash
# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild
docker-compose build
docker-compose up -d
```

### Rollback Database

```bash
# Restore from backup
docker-compose stop backend
gunzip -c ~/backups/minicrm-YYYYMMDD-HHMMSS.sql.gz | \
    docker-compose exec -T postgres psql -U postgres minicrm
docker-compose start backend
```

## Checklist Pre-Deployment

- [ ] Toate variabilele de mediu configurate corect
- [ ] Parole puternice pentru baza de date
- [ ] JWT_SECRET generat aleatoriu
- [ ] Domeniu configurat în Traefik
- [ ] SSL/TLS activat
- [ ] SMTP configurat și testat
- [ ] Firewall activat și configurat
- [ ] Backup automated setup
- [ ] Monitoring configuratConfigurate
- [ ] Documentație citită și înțeleasă

## Checklist Post-Deployment

- [ ] Toate containerele rulează (docker-compose ps)
- [ ] Aplicația accesibilă la URL-ul corect
- [ ] SSL funcționează (HTTPS)
- [ ] Login funcționează
- [ ] SUPERADMIN creat cu succes
- [ ] Email verification funcționează
- [ ] Upload fișiere funcționează
- [ ] Toate funcționalitățile testate
- [ ] Backup test efectuat
- [ ] Monitoring funcționează

---

## Suport

Pentru probleme de deployment:
- Consultă [Troubleshooting](#troubleshooting)
- Vezi [Arhitectura](./ARCHITECTURE.md)
- Deschide un issue pe GitHub
- Contactează echipa de dezvoltare

**Deployment Guide Version:** 1.0  
**Ultima actualizare:** Februarie 2026
