# TransitOps Backend

Express + Prisma API for fleet operations.

This backend uses its own JWT auth system. Supabase Auth is not part of the request path.

For architectural context, see:

- [docs/BACKEND_CONTEXT.md](docs/BACKEND_CONTEXT.md)
- [docs/route-doc.md](docs/route-doc.md)

Keep those docs updated whenever a backend contract changes.

## Stack

- Node.js
- Express 5
- TypeScript
- Prisma
- PostgreSQL
- Zod
- bcrypt
- jsonwebtoken
- Nodemailer

## Setup

1. Copy the environment file and fill in the values:

```powershell
cp .env.example .env
```

2. Apply migrations and generate Prisma Client:

```powershell
npx prisma migrate deploy
npx prisma generate
```

3. Start the backend:

```powershell
npm.cmd run dev
```

4. Build for verification:

```powershell
npm.cmd run build
```

## Environment Variables

Minimum required values:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-long-secret-minimum-32-characters
FRONTEND_URL=http://localhost:5173
```

Optional JWT values:

```env
JWT_REFRESH_SECRET=another-super-long-secret-minimum-32-characters
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

Password reset email configuration:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-without-spaces
MAIL_FROM="TransitOps <your-email@gmail.com>"
PASSWORD_RESET_PATH=/reset-password
```

Notes:

- `SMTP_SECURE` should be `false` for port `587` and `true` for port `465`.
- For Gmail, `SMTP_PASS` must be a Google App Password, not your normal account password.
- In development, forgot-password requests return the reset token in the response so you can test without opening email.

Initial admin seed:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=use-a-unique-password
```

## Authentication

The auth API lives under `/api/v1/auth`.

### Routes

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /me`
- `PATCH /me`
- `POST /change-password`
- `POST /forgot-password`
- `POST /reset-password`

### Payloads

- `POST /register` → `{ fullName, email, password }`
- `POST /login` → `{ email, password }`
- `POST /refresh` → `{ refreshToken }`
- `PATCH /me` → `{ fullName }`
- `POST /change-password` → `{ currentPassword, newPassword }`
- `POST /forgot-password` → `{ email }`
- `POST /reset-password` → `{ token, newPassword }`

### Auth behavior

- Register creates a `DRIVER` account.
- Login returns `user`, `accessToken`, and `refreshToken`.
- Refresh rotates the refresh token on every request.
- Logout clears the stored refresh token hash.
- Forgot-password stores only a hashed reset token and expires it after 15 minutes.
- Reset-password clears the reset token and invalidates existing refresh tokens.

### Response shape

Successful auth responses use the shared envelope:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "error": "MESSAGE",
  "code": "OPTIONAL_CODE",
  "field": ["optional", "field", "path"]
}
```

## Fleet Module

The vehicle API lives under `/api/v1/vehicles`.

### Vehicle endpoints

- `GET /vehicles`
- `GET /vehicles/available`
- `GET /vehicles/:id`
- `POST /vehicles`
- `PATCH /vehicles/:id`
- `DELETE /vehicles/:id`
- `GET /vehicles/:id/total-cost`

### Vehicle list support

`GET /vehicles` supports:

- pagination
- search
- filtering by `type`
- filtering by `status`
- sorting

Search matches:

- `registrationNumber`
- `vehicleCode`
- `manufacturer`
- `model`

### Vehicle enums

`VehicleStatus`

- `AVAILABLE`
- `ON_TRIP`
- `IN_SHOP`
- `RETIRED`

`VehicleType`

- `VAN`
- `TRUCK`
- `MINI`
- `CAR`
- `BUS`
- `SUV`
- `PICKUP`
- `OTHER`

### Vehicle rules

- `registrationNumber` must be unique.
- `vehicleCode` must be unique.
- Vehicles marked `RETIRED` or `IN_SHOP` are excluded from dispatcher/assignable vehicle queries.
- Status transitions are validated in the service layer.

## Drivers Module

The driver API lives under `/api/v1/drivers`.

### Driver endpoints

- `GET /drivers`
- `GET /drivers/available`
- `GET /drivers/:id`
- `POST /drivers`
- `PATCH /drivers/:id`

### Driver rules

- `GET /drivers/available` returns only available drivers with non-expired licenses.
- `licenseNumber` must be unique.

## Trips / Dispatcher

The trip API lives under `/api/v1/trips`.

### Trip endpoints

- `GET /trips`
- `GET /trips/board`
- `GET /trips/:id`
- `POST /trips`
- `PATCH /trips/:id/dispatch`
- `PATCH /trips/:id/complete`
- `PATCH /trips/:id/cancel`

### Trip list support

`GET /trips` supports:

- search
- filtering by `status`
- filtering by `vehicleId`
- filtering by `driverId`
- pagination
- sorting

Search matches:

- `source`
- `destination`
- vehicle registration number
- vehicle name
- vehicle code
- driver name

### Trip statuses

- `DRAFT`
- `DISPATCHED`
- `COMPLETED`
- `CANCELLED`

### Trip lifecycle rules

- Only `DRAFT` trips can be dispatched.
- Dispatch requires the vehicle and driver to be available.
- Only `DISPATCHED` trips can be completed.
- Completing a trip returns the vehicle and driver to `AVAILABLE`.
- Completing a trip can create a fuel log when fuel data is supplied.
- Draft or dispatched trips can be cancelled.
- Cancelling a dispatched trip returns the vehicle and driver to `AVAILABLE`.

### Dispatcher board

`GET /trips/board` returns a compact dispatcher payload with:

- recent trips
- status counts
- available vehicle count
- available driver count

## Other Modules

Additional APIs currently available:

- `/api/v1/maintenance`
- `/api/v1/fuel-logs`
- `/api/v1/expenses`
- `/api/v1/dashboard/kpis`
- `/api/v1/reports/*`
- `/api/v1/settings`

## Common Development Flow

When you change Prisma schema or migrations:

```powershell
npx prisma generate
npx prisma migrate deploy
```

When you change TypeScript backend code:

```powershell
npm.cmd run build
```

When you need to test password reset locally:

1. Configure SMTP.
2. Call `POST /api/v1/auth/forgot-password`.
3. Use the returned token in development, or open the email link.

## Important Notes

- Keep backend changes inside `backend/` unless the task explicitly asks for frontend work.
- Keep new business behavior documented here and in `docs/route-doc.md`.
- Prefer the existing module pattern: route, controller, service, validation.
- Keep response shapes consistent with `src/lib/response.ts`.
