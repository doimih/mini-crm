# Arhitectura Aplicației - Mini CRM

Documentație tehnică despre arhitectura și structura aplicației Mini CRM.

## Arhitectură Generală

Mini CRM este o aplicație **full-stack** construită ca **monorepo** cu arhitectură **client-server separată**.

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│              (React + Vite + TypeScript)                │
│                   Port: 80 (Nginx)                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ REST API
┌────────────────────┴────────────────────────────────────┐
│                      Traefik                            │
│                  (Reverse Proxy)                        │
│                  Port: 80, 443                          │
└────────────────────┬────────────────────────────────────┘
                     │
     ┌───────────────┴────────────────┐
     │                                │
┌────┴────────────────┐    ┌──────────┴─────────────┐
│     Backend         │    │      MailHog           │
│  (Node.js+Express)  │    │   (SMTP Server)        │
│    Port: 3000       │    │   Port: 1025, 8025     │
└─────────┬───────────┘    └────────────────────────┘
          │
┌─────────┴────────────┐
│    PostgreSQL        │
│     Port: 5432       │
└──────────────────────┘
```

## Structura de Directoare

```
mini-crm/
├── apps/
│   ├── backend/                 # Aplicația server
│   │   ├── src/
│   │   │   ├── controllers/     # Controllere pentru endpoints
│   │   │   ├── middleware/      # Middleware (auth, validation, error)
│   │   │   ├── routes/          # Definirea rutelor API
│   │   │   ├── services/        # Logică de business
│   │   │   ├── types/           # TypeScript types
│   │   │   ├── app.ts           # Configurare Express
│   │   │   └── server.ts        # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Schema bazei de date
│   │   │   └── migrations/      # Migrări SQL
│   │   ├── uploads/             # Fișiere încărcate
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── frontend/                # Aplicația client
│       ├── src/
│       │   ├── components/      # Componente React
│       │   ├── services/        # API client (axios)
│       │   ├── styles/         # CSS global
│       │   ├── types/          # TypeScript interfaces
│       │   ├── App.tsx         # Root component
│       │   ├── main.tsx        # Entry point
│       │   └── i18n.ts         # Configurare traduceri
│       ├── public/             # Asset-uri statice
│       ├── package.json
│       ├── vite.config.ts
│       ├── nginx.conf          # Configurare Nginx
│       └── Dockerfile
│
├── docker/                      # Configurare Docker
│   ├── docker-compose.yml      # Orchestrare servicii
│   └── traefik/                # Configurare Traefik
│       ├── traefik.yml
│       └── dynamic.yml
│
├── docs/                        # Documentație
├── package.json                 # Root package.json
└── README.md
```

## Stack Tehnologic

### Backend

**Runtime & Framework:**
- **Node.js 20** - Runtime JavaScript
- **Express.js 4** - Framework web minimalist
- **TypeScript 5** - Type safety

**Bază de Date:**
- **PostgreSQL 15** - Bază de date relațională
- **Prisma 5** - ORM pentru Node.js
  - Type-safe query builder
  - Automatic migrations
  - Schema-first design

**Autentificare & Securitate:**
- **jsonwebtoken** - JWT pentru autentificare
- **bcryptjs** - Hashing pentru parole
- **express-validator** - Validare input
- **cors** - Cross-Origin Resource Sharing

**Email:**
- **nodemailer** - Trimitere email
- **MailHog** - SMTP server pentru dezvoltare

**File Upload:**
- **multer** - Middleware pentru multipart/form-data

**Altele:**
- **dotenv** - Gestionare variabile de mediu
- **csv-stringify** - Export CSV

### Frontend

**Framework & Build:**
- **React 18** - UI library
- **Vite 5** - Build tool modern și rapid
- **TypeScript 5** - Type safety

**Routing:**
- **React Router 6** - Client-side routing

**HTTP Client:**
- **Axios** - Promise-based HTTP client

**Internationalization:**
- **i18next** - Framework pentru traduceri
- **react-i18next** - Integrare React

**Styling:**
- **CSS custom** - Fără framework CSS
- Design responsive
- Tema blue modernă

### DevOps

**Containerization:**
- **Docker** - Containerizare aplicații
- **Docker Compose** - Orchestrare multi-container

**Reverse Proxy:**
- **Traefik 2** - Modern reverse proxy
  - Automatic SSL/TLS
  - Load balancing
  - Service discovery

**Web Server (Frontend):**
- **Nginx Alpine** - Servire fișiere statice

## Fluxul de Date

### Autentificare

```
User Input (email/password)
    │
    ↓
Frontend (Login Component)
    │
    ↓
POST /api/auth/login
    │
    ↓
Backend (auth.controller)
    │
    ├→ Validate input
    ├→ Check user exists
    ├→ Verify password (bcrypt)
    ├→ Generate JWT token
    │
    ↓
Response { token, user }
    │
    ↓
Frontend stores token
    │
    ↓
Subsequent requests include:
Authorization: Bearer <token>
```

### Request Autentificat

```
Frontend Request + JWT
    │
    ↓
Backend Middleware
    │
    ├→ auth.middleware.ts
    │   ├→ Extract token
    │   ├→ Verify JWT
    │   ├→ Attach user to req.user
    │   └→ Next()
    │
    ↓
Controller
    │
    ├→ Business logic
    ├→ Prisma queries
    │
    ↓
Database (PostgreSQL)
    │
    ↓
Response to Frontend
```

## Structura Bazei de Date

### Modele Principale

**User**
```prisma
model User {
  id                    Int
  email                 String  @unique
  password              String
  role                  Role    @default(USER)
  status                UserStatus @default(ACTIVE)
  phone                 String?
  timezone              String  @default("UTC")
  language              String  @default("en")
  emailVerifiedAt       DateTime?
  
  // Relations
  contacts              Contact[]
  tickets               Ticket[]
  calendarEvents        CalendarEvent[]
  auditLogs             AuditLog[]
}
```

**Contact**
```prisma
model Contact {
  id                Int
  userId            Int
  name              String
  contactPersonName String?
  email             String?
  phone             String?
  company           String?
  notes             String?
  
  // Relations
  user              User
  tags              ContactTag[]
  tickets           Ticket[]
}
```

**Ticket**
```prisma
model Ticket {
  id          Int
  userId      Int
  assignedTo  Int?
  contactId   Int?
  subject     String
  description String
  status      TicketStatus @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  
  // Relations
  user             User
  assignedUser     User?
  contact          Contact?
  comments         TicketComment[]
  attachments      TicketAttachment[]
}
```

**CalendarEvent**
```prisma
model CalendarEvent {
  id        Int
  userId    Int
  title     String
  type      CalendarEventType
  notes     String?
  startAt   DateTime
  endAt     DateTime
  allDay    Boolean @default(false)
  
  // Relations
  user User
}
```

### Relații

```
User 1──────┬─────→ n Contact
            ├─────→ n Ticket (creator)
            ├─────→ n Ticket (assigned)
            ├─────→ n CalendarEvent
            └─────→ n AuditLog

Contact 1───┬─────→ n ContactTag
            └─────→ n Ticket

Ticket 1────┬─────→ n TicketComment
            └─────→ n TicketAttachment

Tag 1───────└─────→ n ContactTag
```

## Middleware Chain

### Backend Request Pipeline

```
Incoming Request
    │
    ↓
1. CORS Middleware
    │ (Allow cross-origin requests)
    ↓
2. express.json()
    │ (Parse JSON body)
    ↓
3. Routes
    │
    ├─→ Public Routes (/auth/login, /auth/register)
    │
    └─→ Protected Routes
        │
        ↓
    4. auth.middleware
        │ (Verify JWT, attach user)
        ↓
    5. validation.middleware
        │ (Validate input with express-validator)
        ↓
    6. Controller
        │ (Business logic)
        ↓
    7. Response
        │
        ↓
ERROR → error.middleware
    │ (Centralized error handling)
    ↓
Response to Client
```

## Componente Frontend

### Structură Componente

```
App.tsx
 ├─→ Router
      ├─→ Login
      ├─→ Register
      ├─→ ForgotPassword
      ├─→ ResetPassword
      ├─→ EmailVerify
      │
      ├─→ ContactList (Main Dashboard)
      │    ├─→ ContactForm (Modal)
      │    └─→ TagManager
      │
      ├─→ Inbox (Tickets)
      │    └─→ Ticket Details Modal
      │         ├─→ Comments section
      │         └─→ Attachments section
      │
      ├─→ PersonalPanel
      │    ├─→ Profile section
      │    ├─→ Password change
      │    └─→ Calendar
      │
      └─→ UserAdmin (SUPERADMIN)
           ├─→ User Management
           ├─→ TagManager
           ├─→ TranslationManager
           └─→ EmailLogViewer
```

### State Management

**Approach:** Component-level state cu React hooks

- `useState` - Local state
- `useEffect` - Side effects (API calls)
- `useCallback` - Memoized callbacks
- `useMemo` - Memoized values

**No global state library** (Redux, Zustand) pentru simplitate.

### API Service Layer

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor - add JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/mini-crm/login';
    }
    return Promise.reject(error);
  }
);
```

## Securitate

### Măsuri Implementate

**Backend:**
1. **Password Hashing** - bcrypt cu salt
2. **JWT Tokens** - Expirare după 24h
3. **Input Validation** - express-validator
4. **SQL Injection Prevention** - Prisma ORM parameterized queries
5. **CORS** - Configurare restrictivă
6. **Rate Limiting** - (TODO: de implementat)

**Frontend:**
1. **XSS Prevention** - React escapes by default
2. **Token Storage** - localStorage (consider httpOnly cookies)
3. **HTTPS** - Enforced via Traefik în producție

### Roluri și Permisiuni

**USER:**
- CRUD pe propriile contacte
- CRUD pe propriile tickete
- Calendar personal
- Profil personal

**ADMIN:**
- Toate permisiunile USER
- Vezi tickete din toată organizația
- Acces Activity Log (limitedread)

**SUPERADMIN:**
- Toate permisiunile ADMIN
- User Management (create/edit/delete)
- Tag Management
- Translation Management
- Email Configuration
- Full Activity Log access

## Performance

### Optimizări Backend

1. **Paginare** - Toate listele mari (contacts, tickets, logs)
2. **Indexare DB** - Index-uri pe:
   - User.email
   - Contact.userId
   - Ticket.userId, status, priority
   - AuditLog.userId, createdAt

3. **Eager Loading** - Include relations în query-uri Prisma

### Optimizări Frontend

1. **Code Splitting** - React.lazy (TODO)
2. **Asset Optimization** - Vite compression
3. **Caching** - Nginx cache headers
4. **Debouncing** - Search input (TODO)

## Scalabilitate

### Limitări Curente

- **Single Instance** - Fără load balancing
- **File Storage** - Local disk (uploads/)
- **Session Storage** - JWT stateless (bun)

### Îmbunătățiri Viitoare

1. **Horizontal Scaling**
   - Multiple backend instances
   - Load balancer (Traefik)
   - Redis pentru session/cache

2. **Database**
   - Connection pooling
   - Read replicas
   - Query optimization

3. **File Storage**
   - S3 / MinIO pentru attachments
   - CDN pentru static assets

4. **Monitoring**
   - Application logs (Winston/Pino)
   - Error tracking (Sentry)
   - Performance monitoring (New Relic/DataDog)

## Testing

### Backend (TODO)

```bash
# Unit tests - Jest
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Frontend (TODO)

```bash
# Unit tests - Vitest
npm test

# Component tests - React Testing Library
npm run test:components

# E2E tests - Playwright
npm run test:e2e
```

## CI/CD Pipeline (TODO)

```
GitHub Actions
    │
    ├→ On Push to main
    │   ├→ Run tests
    │   ├→ Build Docker images
    │   ├→ Push to registry
    │   └→ Deploy to production
    │
    └→ On Pull Request
        ├→ Run tests
        ├→ Lint code
        └→ Build check
```

## Logging și Monitoring

### Logs Actuale

**Backend:**
```javascript
console.log() // Simple stdout logs
```

**Docker Compose:**
```bash
docker-compose logs -f [service]
```

### Audit Trail

- Toate acțiunile importante sunt logged în `AuditLog` table
- Include: userId, action, entity, entityId, details, timestamp

## Configurare Mediu

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
NODE_ENV=production
APP_URL=https://...
SUPERADMIN_EMAIL=...
SUPERADMIN_PASSWORD=...
SMTP_HOST=...
SMTP_PORT=...
```

**Frontend:**
- Vite proxy configuration în `vite.config.ts`
- Base path `/mini-crm/` hardcoded

## Deployment Pipeline

```
Development → Git Push → GitHub
                            │
                            ↓
                    SSH to Server
                            │
                            ↓
                       Git Pull
                            │
                            ↓
              docker-compose build
                            │
                            ↓
               docker-compose up -d
                            │
                            ↓
                   Live on Production
```

## Compatibilitate Browser

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features used:**
- ES6+ JavaScript
- CSS Grid & Flexbox
- Fetch API
- LocalStorage

## Documentație Cod

**Backend:**
- JSDoc comments pentru funcții complexe
- TypeScript interfaces pentru type safety

**Frontend:**
- Prop types via TypeScript
- Component-level comments

## Contributing Guidelines

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

**Code Style:**
- ESLint configuration
- Prettier formatting
- TypeScript strict mode

---

**Arhitectura este în evoluție constantă și va fi actualizată pe măsură ce aplicația crește.**
