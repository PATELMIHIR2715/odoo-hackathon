# TransitOps Frontend

TransitOps frontend is a React 19 + TypeScript + Vite application styled with TailwindCSS and shadcn/base-ui primitives.

## Screens

- `/login`
- `/dashboard`
- `/fleet`
- `/drivers`
- `/trips`
- `/maintenance`
- `/fuel-expenses`
- `/analytics`
- `/settings`

## What the UI covers

- authenticated app shell with sidebar and header
- dashboard KPIs, filters, recent trips, and vehicle status breakdown
- vehicle registry with search, filters, add/edit/view/delete flow
- driver registry with search, filters, add/edit/view/delete flow
- trip dispatcher with lifecycle actions and capacity validation
- maintenance logs
- fuel logs and other expenses
- analytics overview with charts
- settings and RBAC management

## Frontend conventions

- React Router DOM for page routing
- React Hook Form + Zod for form validation
- shared API helpers in `src/api`
- shared services in `src/services`
- reusable UI primitives in `src/components/ui`
- consistent API response types in `src/types`

## Useful files

- Frontend context: [`context.md`](context.md)
- App routes: [`src/routes/AppRoutes.tsx`](src/routes/AppRoutes.tsx)
- App shell: [`src/components/layout/AppLayout.tsx`](src/components/layout/AppLayout.tsx)

## Development

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

Lint:

```bash
pnpm lint
```

