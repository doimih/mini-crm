# Documentație API - Mini CRM

Documentație completă a API-ului REST pentru Mini CRM.

## Base URL

```
Production: https://projects.doimih.net/mini-crm/api
Development: http://localhost:3000/api
```

## Autentificare

API-ul folosește **JWT (JSON Web Tokens)** pentru autentificare.

### Headers necesare

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Obținere Token

Token-ul se obține după login și trebuie inclus în toate request-urile autentificate.

---

## Endpoints

## 📝 Authentication

### Register

Creează un cont nou de utilizator.

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER",
    "emailVerified": false
  }
}
```

**Erori:**
- `400`: User already exists
- `400`: Validation error

---

### Login

Autentificare utilizator.

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER",
    "emailVerified": true
  }
}
```

**Erori:**
- `401`: Invalid credentials
- `401`: Account suspended
- `401`: Email not verified

---

### Verify Email

Verifică adresa de email folosind token-ul din email.

**Endpoint:** `GET /auth/verify-email`

**Query Parameters:**
- `token` (string, required): Token de verificare
- `userId` (number, required): ID-ul utilizatorului

**Response 200:**
```json
{
  "message": "Email verified successfully"
}
```

**Erori:**
- `400`: Invalid or expired token

---

### Forgot Password

Trimite email pentru resetarea parolei.

**Endpoint:** `POST /auth/forgot-password`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password

Resetează parola folosind token-ul din email.

**Endpoint:** `POST /auth/reset-password`

**Body:**
```json
{
  "token": "reset-token-from-email",
  "userId": 1,
  "newPassword": "NewSecure123"
}
```

**Response 200:**
```json
{
  "message": "Password reset successfully"
}
```

---

## 👤 Users

### Get All Users

Obține lista tuturor utilizatorilor (doar SUPERADMIN).

**Endpoint:** `GET /users`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "phone": "+40123456789",
    "emailVerifiedAt": "2026-02-05T10:00:00Z",
    "createdAt": "2026-02-01T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  }
]
```

---

### Create User

Creează un utilizator nou (doar SUPERADMIN).

**Endpoint:** `POST /users`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "USER",
  "status": "ACTIVE",
  "phone": "+40123456789"
}
```

**Response 201:**
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "phone": "+40123456789",
  "emailVerifiedAt": null,
  "createdAt": "2026-02-05T10:00:00Z"
}
```

---

### Update User

Actualizează un utilizator (doar SUPERADMIN).

**Endpoint:** `PUT /users/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "updated@example.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "phone": "+40987654321"
}
```

**Response 200:**
```json
{
  "id": 2,
  "email": "updated@example.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "phone": "+40987654321"
}
```

---

### Delete User

Șterge un utilizator (doar SUPERADMIN).

**Endpoint:** `DELETE /users/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

## 📇 Contacts

### Get Contacts

Obține lista de contacte cu paginare și căutare.

**Endpoint:** `GET /contacts`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1): Numărul paginii
- `limit` (number, default: 10): Număr de rezultate per pagină
- `search` (string, optional): Termen de căutare

**Response 200:**
```json
{
  "contacts": [
    {
      "id": 1,
      "name": "Acme Corp",
      "contactPersonName": "John Doe",
      "email": "john@acme.com",
      "phone": "+40123456789",
      "company": "Acme Corporation",
      "notes": "Important client",
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-05T10:00:00Z",
      "tags": [
        {
          "id": 1,
          "name": "VIP"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalContacts": 47
  }
}
```

---

### Get Contact by ID

Obține detaliile unui contact.

**Endpoint:** `GET /contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "name": "Acme Corp",
  "contactPersonName": "John Doe",
  "email": "john@acme.com",
  "phone": "+40123456789",
  "company": "Acme Corporation",
  "notes": "Important client",
  "tags": [
    {
      "id": 1,
      "name": "VIP"
    }
  ]
}
```

---

### Create Contact

Creează un contact nou.

**Endpoint:** `POST /contacts`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "New Company",
  "contactPersonName": "Jane Smith",
  "email": "jane@newcompany.com",
  "phone": "+40987654321",
  "company": "New Company Ltd",
  "notes": "Prospect",
  "tagIds": [1, 2]
}
```

**Response 201:**
```json
{
  "id": 2,
  "name": "New Company",
  "contactPersonName": "Jane Smith",
  "email": "jane@newcompany.com",
  "phone": "+40987654321",
  "company": "New Company Ltd",
  "notes": "Prospect"
}
```

---

### Update Contact

Actualizează un contact existent.

**Endpoint:** `PUT /contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Updated Company",
  "email": "updated@company.com",
  "tagIds": [1, 3]
}
```

**Response 200:**
```json
{
  "id": 2,
  "name": "Updated Company",
  "email": "updated@company.com"
}
```

---

### Delete Contact

Șterge un contact.

**Endpoint:** `DELETE /contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

### Export Contacts

Exportă contactele în format CSV.

**Endpoint:** `GET /contacts/export`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="contacts-2026-02-05.csv"

Name,Contact Person,Email,Phone,Company,Tags
Acme Corp,John Doe,john@acme.com,+40123456789,Acme Corporation,VIP
```

---

## 🏷️ Tags

### Get All Tags

Obține lista tuturor tag-urilor.

**Endpoint:** `GET /tags`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "VIP"
  },
  {
    "id": 2,
    "name": "Prospect"
  }
]
```

---

### Create Tag

Creează un tag nou (doar SUPERADMIN).

**Endpoint:** `POST /tags`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Partner"
}
```

**Response 201:**
```json
{
  "id": 3,
  "name": "Partner"
}
```

---

### Delete Tag

Șterge un tag (doar SUPERADMIN).

**Endpoint:** `DELETE /tags/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

## 🎫 Tickets

### Get Tickets

Obține lista de tickete cu filtre.

**Endpoint:** `GET /tickets`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string, optional): OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `priority` (string, optional): LOW, MEDIUM, HIGH, URGENT
- `assignedTo` (number, optional): User ID

**Response 200:**
```json
{
  "tickets": [
    {
      "id": 1,
      "subject": "Issue with product",
      "description": "Customer reported a problem",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2026-02-05T10:00:00Z",
      "updatedAt": "2026-02-05T10:00:00Z",
      "user": {
        "id": 1,
        "email": "user@example.com"
      },
      "assignedUser": {
        "id": 2,
        "email": "admin@example.com"
      },
      "contact": {
        "id": 1,
        "name": "Acme Corp",
        "email": "john@acme.com"
      },
      "commentCount": 3,
      "attachmentCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "totalTickets": 25
  }
}
```

---

### Get Ticket by ID

Obține detaliile complete ale unui ticket.

**Endpoint:** `GET /tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "subject": "Issue with product",
  "description": "Customer reported a problem",
  "status": "OPEN",
  "priority": "HIGH",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "assignedUser": {
    "id": 2,
    "email": "admin@example.com"
  },
  "contact": {
    "id": 1,
    "name": "Acme Corp"
  },
  "comments": [
    {
      "id": 1,
      "content": "Working on this issue",
      "createdAt": "2026-02-05T11:00:00Z",
      "user": {
        "id": 2,
        "email": "admin@example.com"
      }
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "screenshot.png",
      "filesize": 245678,
      "createdAt": "2026-02-05T10:30:00Z"
    }
  ]
}
```

---

### Create Ticket

Creează un ticket nou.

**Endpoint:** `POST /tickets`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "subject": "New issue",
  "description": "Detailed description of the issue",
  "priority": "MEDIUM",
  "assignedTo": 2,
  "contactId": 1
}
```

**Response 201:**
```json
{
  "id": 2,
  "subject": "New issue",
  "description": "Detailed description of the issue",
  "status": "OPEN",
  "priority": "MEDIUM"
}
```

---

### Update Ticket

Actualizează un ticket.

**Endpoint:** `PUT /tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assignedTo": 3
}
```

**Response 200:**
```json
{
  "id": 2,
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

---

### Delete Ticket

Șterge un ticket.

**Endpoint:** `DELETE /tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

### Add Comment to Ticket

Adaugă un comentariu la un ticket.

**Endpoint:** `POST /tickets/:id/comments`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "This is a comment"
}
```

**Response 201:**
```json
{
  "id": 2,
  "content": "This is a comment",
  "createdAt": "2026-02-05T12:00:00Z",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

### Upload Attachment

Încarcă un fișier la un ticket.

**Endpoint:** `POST /tickets/:id/attachments`

**Headers:** 
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
file: [binary data]
```

**Response 201:**
```json
{
  "id": 2,
  "filename": "document.pdf",
  "filesize": 1234567,
  "mimetype": "application/pdf",
  "createdAt": "2026-02-05T12:00:00Z"
}
```

**Limite:**
- Max file size: 10MB
- Allowed types: .jpg, .jpeg, .png, .pdf, .doc, .docx, .xls, .xlsx, .txt

---

### Download Attachment

Descarcă un atașament.

**Endpoint:** `GET /tickets/:ticketId/attachments/:attachmentId/download`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```
Content-Type: [file mimetype]
Content-Disposition: attachment; filename="[filename]"
[binary file data]
```

---

### Delete Attachment

Șterge un atașament.

**Endpoint:** `DELETE /tickets/:ticketId/attachments/:attachmentId`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

## 📅 Calendar Events

### Get Calendar Events

Obține evenimentele personale.

**Endpoint:** `GET /calendar`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start` (string, optional): ISO date - data de început
- `end` (string, optional): ISO date - data de sfârșit

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Meeting with client",
    "type": "MEETING",
    "notes": "Discuss project requirements",
    "startAt": "2026-02-10T10:00:00Z",
    "endAt": "2026-02-10T11:00:00Z",
    "allDay": false,
    "createdAt": "2026-02-05T10:00:00Z"
  }
]
```

---

### Create Calendar Event

Creează un eveniment nou.

**Endpoint:** `POST /calendar`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Follow-up call",
  "type": "TASK",
  "notes": "Call client for feedback",
  "startAt": "2026-02-12T14:00:00Z",
  "endAt": "2026-02-12T14:30:00Z",
  "allDay": false
}
```

**Response 201:**
```json
{
  "id": 2,
  "title": "Follow-up call",
  "type": "TASK",
  "startAt": "2026-02-12T14:00:00Z",
  "endAt": "2026-02-12T14:30:00Z"
}
```

---

### Update Calendar Event

Actualizează un eveniment.

**Endpoint:** `PUT /calendar/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Updated meeting",
  "startAt": "2026-02-12T15:00:00Z"
}
```

**Response 200:**
```json
{
  "id": 2,
  "title": "Updated meeting",
  "startAt": "2026-02-12T15:00:00Z"
}
```

---

### Delete Calendar Event

Șterge un eveniment.

**Endpoint:** `DELETE /calendar/:id`

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No Content

---

### Export Calendar (iCal)

Exportă calendar-ul în format iCal.

**Endpoint:** `GET /calendar/export`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```
Content-Type: text/calendar
Content-Disposition: attachment; filename="calendar.ics"

BEGIN:VCALENDAR
VERSION:2.0
...
END:VCALENDAR
```

---

## 📊 Audit Logs

### Get Audit Logs

Obține log-urile de audit (doar SUPERADMIN).

**Endpoint:** `GET /audit-logs`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `action` (string, optional): Tipul de acțiune
- `userId` (number, optional): ID utilizator
- `startDate` (string, optional): ISO date
- `endDate` (string, optional): ISO date

**Response 200:**
```json
{
  "logs": [
    {
      "id": 1,
      "action": "USER_CREATE",
      "entity": "User",
      "entityId": 2,
      "details": {
        "email": "newuser@example.com",
        "role": "USER"
      },
      "createdAt": "2026-02-05T10:00:00Z",
      "user": {
        "id": 1,
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 10,
    "totalLogs": 500
  }
}
```

---

## 🌐 Translations

### Get Translations

Obține traducerile pentru interfață.

**Endpoint:** `GET /translations`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
[
  {
    "id": 1,
    "key": "welcome.message",
    "en": "Welcome to Mini CRM",
    "ro": "Bine ai venit la Mini CRM"
  }
]
```

---

### Create Translation

Creează o traducere nouă (doar SUPERADMIN).

**Endpoint:** `POST /translations`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "key": "button.save",
  "en": "Save",
  "ro": "Salvează"
}
```

**Response 201:**
```json
{
  "id": 2,
  "key": "button.save",
  "en": "Save",
  "ro": "Salvează"
}
```

---

### Update Translation

Actualizează o traducere (doar SUPERADMIN).

**Endpoint:** `PUT /translations/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "en": "Save Changes",
  "ro": "Salvează Modificările"
}
```

**Response 200:**
```json
{
  "id": 2,
  "key": "button.save",
  "en": "Save Changes",
  "ro": "Salvează Modificările"
}
```

---

## 👤 Profile

### Get Profile

Obține profilul utilizatorului curent.

**Endpoint:** `GET /profile`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "phone": "+40123456789",
  "timezone": "Europe/Bucharest",
  "language": "ro",
  "notificationPreference": "EMAIL",
  "emailVerifiedAt": "2026-02-01T10:00:00Z"
}
```

---

### Update Profile

Actualizează profilul curent.

**Endpoint:** `PUT /profile`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "timezone": "UTC",
  "language": "en",
  "notificationPreference": "PUSH"
}
```

**Response 200:**
```json
{
  "id": 1,
  "timezone": "UTC",
  "language": "en",
  "notificationPreference": "PUSH"
}
```

---

### Change Password

Schimbă parola curentă.

**Endpoint:** `PUT /profile/password`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecure456"
}
```

**Response 200:**
```json
{
  "message": "Password changed successfully"
}
```

---

## 📧 Email Configuration

### Get Email Config

Obține configurația email (doar SUPERADMIN).

**Endpoint:** `GET /email-config`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "username": "noreply@example.com",
  "from": "noreply@example.com"
}
```

---

### Update Email Config

Actualizează configurația email (doar SUPERADMIN).

**Endpoint:** `PUT /email-config`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "host": "smtp.sendgrid.net",
  "port": 587,
  "secure": false,
  "username": "apikey",
  "password": "SG.xxx",
  "from": "noreply@mycrm.com"
}
```

**Response 200:**
```json
{
  "message": "Email configuration updated successfully"
}
```

---

## 📨 Email Logs

### Get Email Logs

Obține log-urile de email (doar SUPERADMIN).

**Endpoint:** `GET /email-logs`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `status` (string, optional): PENDING, SENT, FAILED

**Response 200:**
```json
{
  "logs": [
    {
      "id": 1,
      "recipient": "user@example.com",
      "subject": "Email Verification",
      "status": "SENT",
      "sentAt": "2026-02-05T10:00:00Z",
      "errorMessage": null,
      "user": {
        "id": 1,
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "totalLogs": 150
  }
}
```

---

## 🔄 Error Responses

### Coduri de Status

- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Format Eroare

```json
{
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Erori Comune

**401 Unauthorized:**
```json
{
  "message": "No token provided" 
}
```

**403 Forbidden:**
```json
{
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "An unexpected error occurred"
}
```

---

## 📌 Rate Limiting

Momentan nu există rate limiting implementat, dar se recomandă:
- Max 100 requests/minut per utilizator
- Max 1000 requests/oră per utilizator

---

## 🔒 Securitate

### Best Practices

1. **Token Storage**: Stochează token-urile JWT în `localStorage` sau `sessionStorage`
2. **HTTPS**: Folosește întotdeauna HTTPS în producție
3. **Token Expiration**: Token-urile JWTexpiră după 24 ore
4. **Password Requirements**: Minim 8 caractere

### CORS

API-ul acceptă cereri de la:
- Frontend-ul aplicației
- Domenii configurate în variabila CORS_ORIGIN

---

## 📝 Exemple de Cod

### JavaScript/Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://projects.doimih.net/mini-crm/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor pentru token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

// Get contacts
const getContacts = async (page = 1) => {
  const response = await api.get('/contacts', {
    params: { page, limit: 10 }
  });
  return response.data;
};
```

### cURL

```bash
# Login
curl -X POST https://projects.doimih.net/mini-crm/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

# Get contacts (cu token)
curl -X GET https://projects.doimih.net/mini-crm/api/contacts?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create contact
curl -X POST https://projects.doimih.net/mini-crm/api/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Company","email":"test@company.com"}'
```

---

## 📖 Versioning

Versiunea curentă: **v1.0**

API-ul nu folosește versioning în URL, dar se recomandă includerea unui header `API-Version` în viitor.

---

## 🆘 Suport

Pentru probleme sau întrebări despre API:
- Consultă [Ghidul de Instalare](./INSTALLATION.md)
- Vezi [Arhitectura](./ARCHITECTURE.md)
- Deschide un issue pe GitHub

