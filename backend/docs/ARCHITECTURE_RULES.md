# TransitOps Backend Architecture Rules

These rules are mandatory for all backend work.

## Module structure

Every feature module must use the same layout:

```text
src/modules/<module-name>/
  <module>.routes.ts
  <module>.controller.ts
  <module>.service.ts
  <module>.validation.ts
```

If a module has multiple sub-features, it may also include subfolders, but each sub-feature must still follow the same separation of concerns.

Use this as the default expectation for new backend work:

- `routes` wires Express only.
- `controller` receives the request and returns the response.
- `service` owns business logic, Prisma calls, and transactions.
- `validation` owns Zod schemas and request-shape parsing.
- Shared helpers are allowed, but they do not replace the module layers above.

## Separation of concerns

- `routes` files must only define Express route wiring.
- `controller` files must only translate HTTP request/response objects.
- `service` files must contain business logic and database operations.
- `validation` files must contain Zod schemas and request-shape validation.

## Routing rules

- Do not keep business logic directly inside route files.
- Do not call Prisma directly from a route file.
- Do not put Zod schemas inline inside route files when a module-specific validation file exists.
- Do not add a new feature as a single monolithic route file.

## Response rules

- All success responses must use the shared success helper.
- All errors must use the shared error handler and shared envelope.
- Do not handcraft ad hoc JSON response shapes in individual handlers.

## Access-control rules

- `role` is the identity and coarse policy layer.
- `moduleAccess` is the module-visibility layer.
- Route guards should check `moduleAccess` for module gating.
- Role checks should only be used for role-specific actions, such as admin-only updates.

## Supported module pattern

Current modules should be shaped like this:

- `auth`
- `settings`
- `dashboard`
- `vehicle`
- `driver`
- `trip`
- `maintenance`
- `finance`
- `analytics`

## Hard rule for future changes

If a new route is added, it must be placed into the correct module folder and wired through controller, service, and validation files before the feature is considered complete.

Do not create new all-in-one route files, and do not put business logic directly in routes just to ship faster. If a feature cannot be expressed cleanly with this structure, stop and split it first.
