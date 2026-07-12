# TransitOps Backend

TransitOps backend is an Express 5 + TypeScript + Prisma API for fleet operations.

It uses custom JWT authentication with access tokens and refresh tokens.

## Core capabilities

- authentication and password reset
- RBAC and organization settings
- dashboard summaries and operational KPIs
- vehicle management
- driver management
- trip dispatch and trip lifecycle
- maintenance management
- fuel and expense logs
- analytics reports

## Architecture decisions

- JWT access + refresh tokens keep auth fully under backend control.
- `Profile.moduleAccess` stores module-level permissions.
- Every feature module follows the same shape:
  - `routes`
  - `controller`
  - `service`
  - `validation`
- Route files stay thin and only wire middleware and handlers.
- Shared response helpers keep success and error output consistent.
- Prisma is used for database access and transactions.

## Modules

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

## Important behaviors

### Authentication

- `POST /api/v1/auth/register` creates a `DRIVER` account only.
- `POST /api/v1/auth/login` returns access and refresh tokens.
- `POST /api/v1/auth/refresh` rotates refresh tokens.
- `POST /api/v1/auth/logout` clears the stored refresh-token hash.
- `POST /api/v1/auth/forgot-password` sends a reset email.
- `POST /api/v1/auth/reset-password` completes the password reset flow.

### Dashboard and reporting

- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/reports/monthly-trend`

### Pagination and filters

- List endpoints return paginated `{ items, pagination }` payloads.
- Vehicles support search, type filtering, status filtering, and sorting.
- Drivers support search and pagination.
- Trips support pagination and dispatcher-friendly lookups.

### Email settings

- `SMTP_SECURE` should be `false` for port `587` and `true` for port `465`.
- For Gmail, `SMTP_PASS` must be a Google App Password.
- In development, forgot-password requests can return reset details for easier testing.

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

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
PORT=5000
NODE_ENV=development
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
PASSWORD_RESET_PATH=
```

## Notes for future contributors

- Keep backend changes inside `backend/`.
- Keep route contracts updated in `docs/route-doc.md`.
- Keep architecture rules updated in `docs/ARCHITECTURE_RULES.md`.
- Keep current decisions in `docs/BACKEND_CONTEXT.md`.

