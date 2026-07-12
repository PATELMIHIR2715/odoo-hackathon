# Testing Credentials

- email — mayur@example.com
- password — StrongPassword123!
- role — Admin

# Working Live URLS

- Frontend — odoo-hackathon-beige-xi.vercel.app
- Backend — https://odoo-hackathon-qryn.onrender.com

# TransitOps

TransitOps is a fleet operations platform split into a TypeScript backend and a React frontend.

Repository layout:

- `backend/` — Express + Prisma API
- `frontend/` — Vite + React application
- `backend/docs/` — backend architecture and API contract docs

## What the product covers

- authentication with JWT access/refresh tokens
- role-based and module-based access control
- dashboard KPIs and operations overview
- vehicle registry
- driver registry
- trip dispatch and trip lifecycle
- maintenance logs
- fuel and expense tracking
- analytics reporting
- organization settings and RBAC
- password reset via email

## Quick links

- Backend context: [`backend/docs/BACKEND_CONTEXT.md`](backend/docs/BACKEND_CONTEXT.md)
- Backend API contract: [`backend/docs/route-doc.md`](backend/docs/route-doc.md)
- Frontend context: [`frontend/context.md`](frontend/context.md)

## Main API prefixes

- `/api/v1/auth`
- `/api/v1/settings`
- `/api/v1/dashboard`
- `/api/v1/vehicles`
- `/api/v1/drivers`
- `/api/v1/trips`
- `/api/v1/maintenance`
- `/api/v1/finance`
- `/api/v1/analytics`

## Frontend pages

- `/login`
- `/dashboard`
- `/fleet`
- `/drivers`
- `/trips`
- `/maintenance`
- `/fuel-expenses`
- `/analytics`
- `/settings`
