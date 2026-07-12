# TransitOps Figma Analysis

Source: `Transitops - smart transport operations platform - 8 hours.svg`

This file captures the product screens and the access-control direction implied by the design export.

## Screen inventory

The export contains 9 app screens:

0. Authentication (RBAC)
1. Dashboard
2. Vehicle Registry
3. Drivers & Safety Profiles
4. Trip Dispatcher
5. Maintenance
6. Fuel & Expense Management
7. Reports & Analytics
8. Settings & RBAC

## Screen notes

### 0. Authentication (RBAC)

- One login surface for multiple roles.
- The login screen shows a role selector, which means the UI expects role-aware post-login navigation.
- The design strongly suggests token-based auth with role-driven landing pages.

### 1. Dashboard

- KPI tiles shown in the design:
  - active trips
  - pending trips
  - drivers on duty
  - fleet utilization
- Recent trips table is visible.
- This screen is role-aware, not a generic admin dashboard.

### 2. Vehicle Registry

- Vehicles are managed as a dedicated module.
- The design includes a clear "add vehicle" flow and list view.
- One design rule is explicitly called out: registration number must be unique.
- Retired and in-shop vehicles should not be shown in trip assignment flows.

### 3. Drivers & Safety Profiles

- Dedicated driver list and safety profile management.
- The screen notes that expired licenses or suspended status must block trip assignment.

### 4. Trip Dispatcher

- Core trip lifecycle screen.
- Visible lifecycle states:
  - Draft
  - Dispatched
  - Completed
  - Cancelled
- The create-trip form uses available vehicles only and available drivers only.
- The completion flow updates odometer, creates fuel log data, and returns vehicle/driver to available state.

### 5. Maintenance

- Separate service record module.
- The design shows log service record with vehicle, service type, cost, date, and status.

### 6. Fuel & Expense Management

- Fuel logs and expense entry live together.
- The screen suggests quick actions for fuel logging and expense creation.
- The module is meant to feed the analytics view automatically.

### 7. Reports & Analytics

- KPI-style analytics screen with export capability.
- Example metrics shown:
  - fuel efficiency
  - fleet utilization
  - operational cost
  - vehicle ROI

### 8. Settings & RBAC

- This is the access-control control plane.
- It contains general org settings:
  - depot name
  - currency
  - distance unit
- It also contains a role/module matrix for RBAC.

## RBAC matrix from the design

Legend from the design:

- `✓` = allowed
- `view` = read-only
- `–` = no access

| Role | Fleet | Drivers | Trips | Fuel/Exp. | Analytics |
| --- | --- | --- | --- | --- | --- |
| Fleet Manager | ✓ | ✓ | – | – | ✓ |
| Dispatcher | view | – | ✓ | – | – |
| Safety Officer | – | ✓ | view | – | – |
| Financial Analyst | view | – | – | ✓ | ✓ |

## Implementation direction

Recommended backend approach:

1. Keep auth as JWT access + refresh tokens.
2. Add a central RBAC policy map by module and action.
3. Make route guards check module permissions instead of hard-coding role lists in each route.
4. Use the Settings screen as the place where admin-only org settings and RBAC visibility are managed.
5. Keep response envelopes consistent so the frontend can render module-level errors cleanly.

## Important mismatch to resolve

The Figma uses `Dispatcher`, but the backend currently has `DRIVER`.

Two possible paths:

1. Map the UI label `Dispatcher` to the backend `DRIVER` role for speed.
2. Add a real `DISPATCHER` role and keep `DRIVER` for actual vehicle operators.

Recommendation:

- If we want the fastest path, map `Dispatcher` to `DRIVER`.
- If we want the cleanest long-term model, add `DISPATCHER` and update the schema and route guards accordingly.

## Product rules inferred from the design

- Registration number must be unique.
- Retired and in-shop vehicles should not be assignable to trips.
- Drivers with expired licenses or suspended status must be blocked from trip assignment.
- Trip completion should update odometer and create related cost records.
- Analytics should derive from operational records, not separate manual entries.

## Development order I would suggest

1. Finalize the role naming decision for `Dispatcher` vs `Driver`.
2. Add a central RBAC policy map.
3. Split routes by module permissions.
4. Add admin-only settings and RBAC endpoints.
5. Keep the route doc updated after each module.
