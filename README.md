# Project & Ticket Management System

Monorepo scaffold for a project and ticket management platform with:

- React + Vite frontend
- Node.js + Express backend
- Prisma-backed relational data model for projects, tickets, bugs, time logs, and developer points
- JWT auth and role-based authorization
- Modules for projects, tickets, workflow history, comments, time tracking, bug analytics, points, and reports

## Implemented PTMS capabilities

- Project lifecycle management with PM assignment, team members, priorities, and dashboard metrics
- Ticket workflow aligned to `Open -> In Progress -> Under Review -> Testing -> Resolved -> Closed`
- Workflow transition enforcement by role for assignees, team leads, QA, PMs, and admins
- Time logging with work date and billable flags
- Bug reopening flow with severity-based point deductions
- Ticket points log and per-user score tracking
- Reporting endpoints for leaderboard, bug analytics, project progress, task-level analytics, and user timeline
- Professionalized dashboard, reports, and ticket detail UI for operational visibility

## Structure

```text
apps/
  api/    Express API + Prisma schema
  web/    React frontend
```

## Quick start

1. Install dependencies in both apps.
2. Copy environment files.
3. Point `DATABASE_URL` to PostgreSQL.
4. Seed demo data.
5. Start API and frontend.

## Backend

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

For local API development, start the bundled Postgres service first:

```bash
docker compose up -d postgres
```

Prisma CLI config now lives in [apps/api/prisma.config.ts](/Users/ankitverma/Projects/Hit_and_try/projectmgt/apps/api/prisma.config.ts) instead of `package.json`, which keeps the project compatible with current Prisma CLI behavior and Render builds.

## Frontend

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## Suggested next steps

- Add real file storage for attachments using S3 or local object storage
- Replace seeded auth with production identity flow and password reset
- Add Socket.IO for real-time ticket comments and notifications
- Extend reports with export endpoints and chart caching
- Migrate the Prisma datasource to MySQL 8.x for production alignment with the PTMS infrastructure document

## Demo account

- Email: `superadmin@example.com`
- Password: `admin123`

## Local origins

The API allows both `127.0.0.1` and `localhost` on Vite ports `5173` and `5174` by default.

## Render Deployment

This project is prepared for a free Render setup using:

- 1 Render Postgres database
- 1 Render web service for the API
- 1 Render static site for the frontend

Backend service settings:

- Root Directory: `apps/api`
- Build Command: `npm install && npm run deploy:render`
- Start Command: `npm run start`

Backend environment variables:

- `DATABASE_URL`: use the Render Postgres `External Database URL`
- `JWT_SECRET`: any long random string
- `CLIENT_URL`: your frontend URL, for example `https://projectmgt-web.onrender.com`
- `PORT`: leave unset on Render

Frontend static site settings:

- Root Directory: `apps/web`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Frontend environment variables:

- `VITE_API_URL`: your backend URL with `/api`, for example `https://projectmgt-api.onrender.com/api`

Static site rewrite:

- Add a rewrite rule from `/*` to `/index.html` in Render so React Router routes work on refresh.

After the backend's first successful deploy, the seed creates these users with password `admin123`:

- `superadmin@example.com`
- `admin@example.com`
- `manager@example.com`
- `lead@example.com`
- `dev@example.com`
- `qa@example.com`
- `user@example.com`
