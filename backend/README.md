# TransitOps Backend

Express + Prisma API for fleet operations. The project uses its own JWT authentication; Supabase Auth is not used.

For the full architecture, migration, authorization, and workflow handoff notes, see [docs/BACKEND_CONTEXT.md](docs/BACKEND_CONTEXT.md). Update that document whenever a backend contract or architectural decision changes.

## Setup

Copy `.env.example` to `.env`, provide the database URL and strong JWT secrets, then run:

```powershell
npx prisma migrate deploy
npx prisma generate
npm.cmd run dev
```

## Authentication

- `POST /api/v1/auth/register` — `{ fullName, email, password }` (creates a `DRIVER`; assign staff roles through an admin/seed process)
- `POST /api/v1/auth/login` — `{ email, password }`
- `POST /api/v1/auth/refresh` — `{ refreshToken }`
- `POST /api/v1/auth/logout` — requires access token
- `GET /api/v1/auth/me` — requires access token

Register, login, and refresh return `{ data: { user, accessToken, refreshToken } }`. Send the access token as `Authorization: Bearer <accessToken>`. Refresh tokens rotate on every refresh and are stored hashed in the database.

All remaining API routes are under `/api/v1` and require an access token. Available resources are `vehicles`, `drivers`, `trips`, `maintenance`, `fuel-logs`, `expenses`, `dashboard/kpis`, and `reports/*`.
