# mini-crm

## Overview
mini-crm is a lightweight Customer Relationship Management (CRM) app built as a monorepo with a Node.js/Express API and a React/Vite frontend. It supports user authentication, contact management, tagging, search, pagination, and CSV export.

## Features
- Email/password authentication (JWT)
- Contact CRUD with search and pagination
- Tag management and tag assignment per contact
- CSV export of contacts
- Dockerized deployment with Traefik reverse proxy

## Tech Stack
- **Backend**: Node.js, Express, PostgreSQL, Prisma
- **Frontend**: React, Vite, React Router
- **Containerization**: Docker
- **Reverse Proxy**: Traefik

## Repository Structure
```
mini-crm
├── apps
│   ├── backend
│   └── frontend
├── docker
├── package.json
├── package-lock.json
└── README.md
```

## Requirements
- Node.js 18+ and npm
- PostgreSQL (for local development)
- Docker + Docker Compose (for containerized runs)

## Environment Variables
Create an `.env` file in `apps/backend` (or copy `.env.example` if present) with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_secret_here
PORT=3000
```

## Local Development

### Backend
```
cd apps/backend
npm install
npm run dev
```

### Frontend
```
cd apps/frontend
npm install
npm run dev
```

Open the app at http://localhost:3000 and log in/register.

## Docker (Production-like)
```
cd docker
docker-compose build
docker-compose up
```

Open http://localhost (or your Traefik domain).

## API Overview
Base path: `/mini-crm/api`

### Auth
- `POST /auth/register` — register user
- `POST /auth/login` — login user

### Contacts
- `GET /contacts` — list contacts (query: `page`, `limit`, `search`)
- `GET /contacts/:id` — get contact
- `POST /contacts` — create contact
- `PUT /contacts/:id` — update contact
- `DELETE /contacts/:id` — delete contact
- `GET /contacts/export` — export contacts as CSV

### Tags
- `GET /tags` — list tags
- `POST /tags` — create tag
- `DELETE /tags/:id` — delete tag
- `POST /tags/contact/:contactId/tag/:tagId` — add tag to contact
- `DELETE /tags/contact/:contactId/tag/:tagId` — remove tag from contact

## Notes
- The API is mounted under `/mini-crm/api` and the frontend router under `/mini-crm`.
- 401 responses trigger logout on the frontend.

## Contributing
Issues and pull requests are welcome.

## License
MIT