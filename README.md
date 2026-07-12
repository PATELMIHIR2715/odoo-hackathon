# TransitOps

TransitOps is a smart transport operations platform with a TypeScript backend and a separate frontend application.

This repository is organized as:

- `backend/` — Express + Prisma API
- `frontend/` — frontend application
- `docs/` — shared product and API context

## What this project is solving

TransitOps manages the operational flow for a transport business:

- user authentication
- role and module-based access control
- vehicle registry
- driver registry
- trip dispatch and completion
- maintenance logs
- fuel and expense tracking
- dashboard KPIs and analytics
- admin settings and RBAC

## Why the backend is built this way

- JWT access + refresh tokens are used instead of Supabase Auth because we need full control over auth behavior, token rotation, logout, and password reset.
- Module access is stored on the user profile so the app can hide or show screens per module, not just per role.
- Each backend feature lives in its own module folder with `routes`, `controller`, `service`, and `validation` files so the code stays maintainable.
- Shared success/error envelopes are used so the frontend gets consistent API responses everywhere.
- Render is used for deployment, with GitHub Actions handling CI and deployment trigger steps.

## Important docs

- [Backend context](backend/docs/BACKEND_CONTEXT.md)
- [Architecture rules](backend/docs/ARCHITECTURE_RULES.md)
- [Frontend API contract](backend/docs/route-doc.md)
- [Figma analysis](backend/docs/FIGMA_ANALYSIS.md)

## Backend quick links

- Auth: `/api/v1/auth`
- Settings: `/api/v1/settings`
- Dashboard: `/api/v1/dashboard`
- Vehicles: `/api/v1/vehicles`
- Drivers: `/api/v1/drivers`
- Trips: `/api/v1/trips`
- Maintenance: `/api/v1/maintenance`
- Finance: `/api/v1/finance`
- Analytics: `/api/v1/analytics`

