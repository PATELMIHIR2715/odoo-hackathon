# TransitOps Backend Context

This document is the source of context for future contributors and coding agents. Read it before changing backend behavior.

## Current decisions

- Stack: Express 5, TypeScript, Prisma, PostgreSQL, Zod, bcrypt, and `jsonwebtoken`.
- PostgreSQL may be hosted by Supabase, but **Supabase Auth is not used**. The `@supabase/supabase-js` package/config is legacy scaffolding and is not part of the active request path.
- Keep the existing source layout: `config`, `constants`, `lib`, `middlewares`, `modules`, `types`, and `utils`. Do not replace it with the folder layout from the original planning document.
- The current feature routes are split across feature files inside `src/modules/operations/` and are re-exported through `src/modules/operations/operations.routes.ts`. If splitting it further later, retain the public URL and authorization contracts below.
- The application now boots from `src/index.ts` instead of separate `app.ts` and `server.ts` files.
- The frontend-facing route contract is maintained in `docs/route-doc.md`; update it whenever request or response shapes change.

## Delivery phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project foundation, Prisma schema, global Express middleware | Complete |
| 2 | Custom JWT access/refresh authentication, password lifecycle, and controlled admin bootstrap | Complete |
| 3 | Fleet resources and transactional trip/maintenance workflows | Complete |
| 4 | API smoke tests, route-module split, and frontend integration contract | In progress - route split and shared response helpers started |
| 5 | Optional reports/export, seed demo data, and deployment hardening | Pending |

When a phase changes state, update this table and the relevant sections below in the same change.

### Latest completed work

- Full application authentication API: registration, login, refresh, logout, current profile read/update, change password, forgot password, and reset password.
- Password-reset tokens are random, hash-only in the database, single-use, and expire after 15 minutes.
- New migration: `20260712100000_password_reset`.
- Operations routes were split into feature modules for vehicles, drivers, trips, maintenance, and finance while keeping the existing `/api/v1` URLs unchanged.
- Auth routes now use rate limiting on registration, login, refresh, forgot-password, and reset-password endpoints.
- All success responses now go through a shared helper and all errors use the shared error envelope.

## Authentication

`Profile` is the application user model. It owns `passwordHash` and `refreshTokenHash`; no passwords or sessions are stored or verified by Supabase Auth.

1. `POST /api/v1/auth/register` creates a `DRIVER` account. Public registration must never accept an arbitrary role, otherwise a caller could self-register as `ADMIN`.
2. `POST /api/v1/auth/login` checks bcrypt password hashes and returns an access token and refresh token.
3. `POST /api/v1/auth/refresh` verifies and rotates the refresh token. Only its bcrypt hash is saved, so one active refresh session is supported per profile.
4. `POST /api/v1/auth/forgot-password` creates a cryptographically random reset token, saves only its SHA-256 hash, and expires it after 15 minutes. Development responses include the token; production responses do not until an email provider is added.
5. `POST /api/v1/auth/reset-password` and `POST /api/v1/auth/change-password` clear active refresh tokens.
6. Protected routes require `Authorization: Bearer <accessToken>`.
7. `POST /api/v1/auth/logout` clears the saved refresh-token hash.

Tokens use these environment values:

```env
JWT_SECRET=<at least 32 characters>
JWT_REFRESH_SECRET=<different secret, at least 32 characters>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

`JWT_REFRESH_SECRET` falls back to `JWT_SECRET` for local compatibility, but production should set both values.

Staff roles (`ADMIN`, `FLEET_MANAGER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`) should be assigned by a controlled seed/admin process, not by public registration.

### Bootstrap administrator

Phase 2 provides `prisma/seed.ts` for the initial administrator. It intentionally requires explicit environment values and does not contain a default production password:

```powershell
$env:SEED_ADMIN_EMAIL = 'admin@example.com'
$env:SEED_ADMIN_PASSWORD = 'use-a-unique-password'
npm.cmd run db:seed
```

Running the seed again updates that account's password, keeps it as `ADMIN`, and revokes its prior refresh token. Do not run it with a shared/demo password in production.

## Database and migrations

The Prisma model remains named `Profile` to avoid needless table renames. Migration `20260712090000_jwt_auth` adds `passwordHash` and `refreshTokenHash`.

Migration `20260712100000_password_reset` adds hashed, expiring password-reset token fields. It must be applied before using the forgot/reset-password endpoints.

The previous schema described profiles as Supabase Auth mirrors. That assumption is obsolete. If an existing database contains Supabase-only profiles, those users need a password reset/recreation flow before they can use the custom login endpoint.

Do not apply migrations automatically against the shared/production database. After reviewing `.env`, an operator runs:

```powershell
npx prisma migrate deploy
npx prisma generate
```

## API and permissions

All business endpoints are prefixed with `/api/v1` and require a valid access token.

| Area | Routes | Write access |
| --- | --- | --- |
| Vehicles | `/vehicles`, `/vehicles/available`, `/vehicles/:id` | `ADMIN`, `FLEET_MANAGER` |
| Drivers | `/drivers`, `/drivers/available`, `/drivers/:id` | `ADMIN`, `SAFETY_OFFICER` |
| Trips | `/trips`, `/trips/:id`, `/:id/dispatch`, `/:id/complete`, `/:id/cancel` | `ADMIN`, `DRIVER` |
| Maintenance | `/maintenance`, `/maintenance/:id/close` | `ADMIN`, `FLEET_MANAGER` |
| Fuel logs | `/fuel-logs` | Write: `ADMIN`, `FLEET_MANAGER`, `DRIVER` |
| Expenses | `/expenses` | Write: `ADMIN`, `FLEET_MANAGER`, `DRIVER` |
| Costs | `/vehicles/:id/total-cost` | Any authenticated role |
| Dashboard | `/dashboard/kpis` | Any authenticated role |
| Reports | `/reports/fuel-efficiency`, `/reports/fleet-utilization`, `/reports/operational-cost` | `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER` |

Responses use `{ "data": ... }` for success and `{ "error": { "code", "message" } }` for failures. Zod validation failures additionally include `details`.

The frontend-ready request/response contract is maintained in [route-doc.md](route-doc.md). Update it whenever a route, authorization rule, input, output, or enum changes.

## Critical workflow rules

These transitions are implemented with Prisma transactions and must stay transactional:

- Dispatch: only `DRAFT` trips; vehicle and driver must both be `AVAILABLE`; both become `ON_TRIP`.
- Complete: only `DISPATCHED` trips; vehicle and driver return to `AVAILABLE`; a fuel log is created when `fuelConsumedL` is supplied.
- Cancel: only `DRAFT` or `DISPATCHED` trips; a dispatched trip returns its vehicle and driver to `AVAILABLE`.
- Maintenance open: a non-retired, non-trip vehicle becomes `IN_SHOP`.
- Maintenance close: an open log becomes `CLOSED`; its vehicle becomes `AVAILABLE` unless it is `RETIRED`.

Trip creation validates vehicle availability, driver availability/license expiry, and cargo capacity, but keeps a newly created draft's vehicle and driver available until dispatch.

## Verification

Run `npm.cmd run build` after TypeScript changes and `npx.cmd prisma validate` after Prisma changes. Both passed after the initial JWT conversion.
