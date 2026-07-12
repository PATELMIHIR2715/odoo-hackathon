# TransitOps Backend

Express + Prisma API for fleet operations. The project uses its own JWT authentication; Supabase Auth is not used.

For the full architecture, migration, authorization, and workflow handoff notes, see [docs/BACKEND_CONTEXT.md](docs/BACKEND_CONTEXT.md). The frontend request/response reference is [docs/API_CONTRACT.md](docs/API_CONTRACT.md). Update these documents whenever a backend contract or architectural decision changes.

## Setup

Copy `.env.example` to `.env`, provide the database URL and strong JWT secrets, then run:

```powershell
npx prisma migrate deploy
npx prisma generate
npm.cmd run dev
```

To enable forgot-password emails, configure SMTP settings in `.env`:

```powershell
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM="TransitOps <no-reply@example.com>"
PASSWORD_RESET_PATH=/reset-password
```

To create the first administrator, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in the shell or `.env`, then run `npm.cmd run db:seed`.

## Authentication

- `POST /api/v1/auth/register` — `{ fullName, email, password }` (creates a `DRIVER`; assign staff roles through an admin/seed process)
- `POST /api/v1/auth/login` — `{ email, password }`
- `POST /api/v1/auth/refresh` — `{ refreshToken }`
- `POST /api/v1/auth/logout` — requires access token
- `GET /api/v1/auth/me` — requires access token
- `PATCH /api/v1/auth/me` — update display name; requires access token
- `POST /api/v1/auth/change-password` — requires access token
- `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`

`POST /api/v1/auth/forgot-password` sends a reset email when SMTP is configured. In non-production environments, the generated reset token is also returned in the response to simplify local testing.

Register, login, and refresh return `{ data: { user, accessToken, refreshToken } }`. Send the access token as `Authorization: Bearer <accessToken>`. Refresh tokens rotate on every refresh and are stored hashed in the database.

All remaining API routes are under `/api/v1` and require an access token. Available resources are `vehicles`, `drivers`, `trips`, `maintenance`, `fuel-logs`, `expenses`, `dashboard/kpis`, and `reports/*`.
