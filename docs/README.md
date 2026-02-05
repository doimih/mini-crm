# Mini CRM - Documentație

Bine ai venit la documentația Mini CRM! Această documentație oferă informații complete despre instalare, configurare, utilizare și dezvoltare.

## Cuprins

1. [Prezentare Generală](#prezentare-generala)
2. [Ghiduri de Instalare](./INSTALLATION.md)
3. [Ghid Utilizator](./USER_GUIDE.md)
4. [Documentație API](./API_DOCUMENTATION.md)
5. [Arhitectura Aplicației](./ARCHITECTURE.md)
6. [Funcționalități Complete](./FEATURES.md)
7. [Deployment](./DEPLOYMENT.md)

## Prezentare Generală

Mini CRM este o aplicație de Customer Relationship Management (CRM) ușor de utilizat, construită cu tehnologii moderne pentru a facilita gestionarea contactelor, ticketelor și activităților.

### Tehnologii Utilizate

**Backend:**
- Node.js 20+
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer pentru email

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- Axios
- i18next pentru traduceri

**DevOps:**
- Docker & Docker Compose
- Traefik (reverse proxy)
- Nginx

### Caracteristici Principale

- ✅ Autentificare securizată cu JWT
- ✅ Gestionare contacte cu CRUD complet
- ✅ Sistem de ticketing (Inbox)
- ✅ Calendar personal pentru evenimente și task-uri
- ✅ Sistem de tag-uri pentru organizare
- ✅ Audit log pentru toate acțiunile importante
- ✅ Gestionare utilizatori (pentru SUPERADMIN)
- ✅ Configurare email SMTP
- ✅ Traduceri multiple (RO/EN)
- ✅ Export CSV
- ✅ Upload fișiere pentru tickete
- ✅ Verificare email
- ✅ Resetare parolă

### Roluri Utilizator

1. **USER** - Utilizator standard, poate gestiona propriile contacte și tickete
2. **ADMIN** - Administrator, are acces la funcții extinse
3. **SUPERADMIN** - Administrator principal, acces complet la sistem

## Link-uri Rapide

- [Instalare locală](./INSTALLATION.md#local-development)
- [Docker Setup](./INSTALLATION.md#docker-deployment)
- [API Endpoints](./API_DOCUMENTATION.md)
- [Ghid de utilizare](./USER_GUIDE.md)

## Suport

Pentru probleme sau întrebări:
- Deschide un issue pe GitHub
- Contactează echipa de dezvoltare

## Licență

Acest proiect este proprietate privată.

---
**Versiune:** 1.0.0  
**Ultima actualizare:** Februarie 2026
