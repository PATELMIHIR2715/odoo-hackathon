# TransitOps Backend

TransitOps backend is an Express 5 + TypeScript + Prisma API for fleet operations.

It uses custom JWT authentication with access tokens and refresh tokens.
Supabase Auth is not part of the active request path.

## Why this backend exists

The backend is designed to support the operational screens in the Figma and the frontend API contract in `docs/route-doc.md`.

The main product areas are:

- authentication
- RBAC and organization settings
- vehicle management
- driver management
- trip dispatch and lifecycle
- maintenance management
- fuel and expense logs
- dashboard KPIs
- analytics reports

## Architecture decisions

- JWT access + refresh tokens are used so auth is fully controlled by the backend.
- `Profile.moduleAccess` stores module-level permissions, which lets us hide modules even when a user has the same coarse role.
- Every feature module must have:
  - `routes`
  - `controller`
  - `service`
  - `validation`
- Route files stay thin and only wire middleware and controller handlers.
- Shared response helpers keep success and error output consistent.
- Prisma is used for database access and transactions.

For the detailed rules that future contributors must follow, see:

- [docs/BACKEND_CONTEXT.md](docs/BACKEND_CONTEXT.md)
- [docs/ARCHITECTURE_RULES.md](docs/ARCHITECTURE_RULES.md)
- [docs/route-doc.md](docs/route-doc.md)

## Current backend modules

- `auth`
- `settings`
- `dashboard`
- `vehicle`
- `driver`
- `trip`
- `maintenance`
- `finance`
- `analytics`

## Route prefixes

The API is mounted under `/api/v1`.

- `/api/v1/auth`
- `/api/v1/settings`
- `/api/v1/dashboard`
- `/api/v1/vehicles`
- `/api/v1/drivers`
- `/api/v1/trips`
- `/api/v1/maintenance`
- `/api/v1/finance`
- `/api/v1/analytics`

## Key behaviors and why they were added

### Authentication

- `POST /api/v1/auth/register` creates a `DRIVER` account only.
- `POST /api/v1/auth/login` returns access and refresh tokens.
- `POST /api/v1/auth/refresh` rotates refresh tokens.
- `POST /api/v1/auth/logout` clears the stored refresh-token hash.
- `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` implement a secure password reset flow.

Why:

- we need a self-managed auth system
- refresh-token rotation improves session safety
- password reset tokens are stored hashed for security

### RBAC and settings

- `Profile.moduleAccess` stores module access as an array.
- `role` remains for coarse identity and policy.
- Settings includes:
  - org details
  - RBAC access matrix

Why:

- the Figma shows screen-level access control
- module access is more flexible than role-only checks

### Vehicles, drivers, and trips

- vehicles are tracked separately from trips
- drivers are validated against availability and license expiry
- trip dispatch/complete/cancel is transactional

Why:

- these operations must stay consistent across multiple tables
- a trip should not partially update vehicle or driver state

### Finance and analytics

- fuel logs and expenses feed the analytics endpoints
- analytics are derived from operational records

Why:

- analytics should reflect actual operations, not manual summaries

## Development setup

Install dependencies:

```powershell
pnpm install
```

Generate Prisma Client:

```powershell
pnpm prisma generate
```

Run migrations:

```powershell
pnpm prisma migrate deploy
```

Start development server:

```powershell
pnpm dev
```

Build:

```powershell
pnpm build
```

Smoke test:

```powershell
pnpm test:smoke
```

## Environment variables

Minimum auth and database setup:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
PORT=5000
NODE_ENV=development
```

Optional email settings for password reset:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
PASSWORD_RESET_PATH=
```

## CI/CD

The backend uses GitHub Actions for CI/CD.

What it does:

- runs on pushes and pull requests to `master` and `development`
- installs dependencies
- generates Prisma Client
- runs migrations
- type-checks
- builds
- runs smoke tests
- on `master` push, triggers Render deployment and health-checks `/health`

## Deployment

This backend is intended for Render deployment.

The GitHub Actions deploy job uses:

- `RENDER_DEPLOY_HOOK`
- `PRODUCTION_URL`

## Notes for future contributors

- Keep backend changes inside `backend/`.
- Keep route contracts updated in `docs/route-doc.md`.
- Keep architecture rules updated in `docs/ARCHITECTURE_RULES.md`.
- Keep current decisions in `docs/BACKEND_CONTEXT.md`.

