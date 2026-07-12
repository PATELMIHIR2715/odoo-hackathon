# TransitOps API Contract

Base URL: `http://localhost:4000/api/v1` by default. Responses are `{ "data": ... }`; errors are `{ "error": { "code", "message" } }`.

## Authentication

| Method and URL | Body | Result |
| --- | --- | --- |
| `POST /auth/register` | `{ fullName, email, password }` | Creates a `DRIVER` and returns user + tokens. |
| `POST /auth/login` | `{ email, password }` | Returns user + tokens. |
| `POST /auth/refresh` | `{ refreshToken }` | Rotates refresh token and returns a new token pair. |
| `POST /auth/forgot-password` | `{ email }` | Always returns `202`; creates a 15-minute reset token for an existing account. |
| `POST /auth/reset-password` | `{ token, newPassword }` | Changes password and revokes active refresh token. |
| `POST /auth/logout` | none | Revokes the current user's refresh token. |
| `GET /auth/me` | none | Returns the authenticated profile. |
| `PATCH /auth/me` | `{ fullName }` | Updates the authenticated user's display name. |
| `POST /auth/change-password` | `{ currentPassword, newPassword }` | Changes password and revokes active refresh token. |

Login/register/refresh response shape:

```json
{
  "data": {
    "user": { "id": "uuid", "fullName": "...", "email": "...", "role": "DRIVER" },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

For every non-auth route, send `Authorization: Bearer <accessToken>`. When the access token expires, call `/auth/refresh` and replace both saved tokens.

In development, `forgot-password` also returns `data.resetToken` so the frontend can complete reset testing without an email provider. In production this field is omitted; connect an email provider to deliver the token or a reset link. Never display or persist reset tokens in application logs.

## Fleet resources

### Vehicles

- `GET /vehicles?status=&type=&region=` — every authenticated role
- `GET /vehicles/available` — every authenticated role
- `GET /vehicles/:id` — every authenticated role
- `POST /vehicles` — `ADMIN`, `FLEET_MANAGER`
- `PATCH /vehicles/:id` — `ADMIN`, `FLEET_MANAGER`
- `DELETE /vehicles/:id` — `ADMIN`, `FLEET_MANAGER`; soft-retires by setting `status: "RETIRED"`

Create/update fields: `registrationNumber`, `name`, `type`, `maxLoadCapacityKg`, `odometerKm?`, `acquisitionCost`, `region?`.

### Drivers

- `GET /drivers?status=` and `GET /drivers/available` — every authenticated role
- `GET /drivers/:id` — every authenticated role
- `POST /drivers`, `PATCH /drivers/:id` — `ADMIN`, `SAFETY_OFFICER`

Create/update fields: `name`, `licenseNumber`, `licenseCategory`, `licenseExpiryDate` (ISO date), `contactNumber`, `safetyScore?`, `status?`.

### Trips

- `GET /trips?status=&driverId=&vehicleId=` and `GET /trips/:id` — every authenticated role
- `POST /trips`, `PATCH /trips/:id/dispatch`, `PATCH /trips/:id/complete`, `PATCH /trips/:id/cancel` — `ADMIN`, `DRIVER`

Create body:

```json
{
  "source": "Colombo",
  "destination": "Kandy",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "cargoWeightKg": 500,
  "plannedDistance": 120
}
```

Complete body: `{ "actualDistance": 125, "fuelConsumedL": 18.5, "fuelCost": 6200 }`. `fuelCost` is optional; if fuel data is supplied, the API creates a fuel log.

Status flow: `DRAFT → DISPATCHED → COMPLETED` or `DRAFT/DISPATCHED → CANCELLED`. Frontend must not assume it can manually update `status`.

## Costs, maintenance, dashboard, and reports

- `GET /maintenance?vehicleId=&status=`; `POST /maintenance`; `PATCH /maintenance/:id/close` — `ADMIN`, `FLEET_MANAGER`. Create body: `{ vehicleId, description, cost? }`.
- `GET /fuel-logs?vehicleId=` — all operational/financial roles. `POST /fuel-logs` — `ADMIN`, `FLEET_MANAGER`, `DRIVER`. Body: `{ vehicleId, liters, cost, date? }`.
- `GET /expenses?vehicleId=&type=` — all operational/financial roles. `POST /expenses` — `ADMIN`, `FLEET_MANAGER`, `DRIVER`. Body: `{ vehicleId, type, amount, note?, date? }`.
- `GET /vehicles/:id/total-cost` — every authenticated role.
- `GET /dashboard/kpis` — every authenticated role.
- `GET /reports/fuel-efficiency?vehicleId=`, `GET /reports/fleet-utilization`, and `GET /reports/operational-cost?vehicleId=` — `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`.

Enums: vehicle `AVAILABLE | ON_TRIP | IN_SHOP | RETIRED`; driver `AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED`; trip `DRAFT | DISPATCHED | COMPLETED | CANCELLED`; expense `TOLL | MAINTENANCE | OTHER`.
