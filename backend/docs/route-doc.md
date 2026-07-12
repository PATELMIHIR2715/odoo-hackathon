# TransitOps Route Doc

Base URL: `http://localhost:4000/api/v1`

All success responses use:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": ...
}
```

All errors use:

```json
{
  "success": false,
  "error": "Readable message",
  "code": "ERROR_CODE"
}
```

Validation errors return:

```json
{
  "success": false,
  "error": "Validation message",
  "field": ["body", "fieldName"],
  "message": "Readable message"
}
```

`field` appears only for validation errors.

The response examples below show the `data` payload content for readability. The actual HTTP response always includes the envelope shown above.

## Auth Routes

### `POST /auth/register`

Creates a `DRIVER` account.

Body:

```json
{
  "fullName": "John Driver",
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

Success `201`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Driver",
      "email": "john@example.com",
      "role": "DRIVER",
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

### `POST /auth/login`

Body:

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

Success `200`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Driver",
      "email": "john@example.com",
      "role": "DRIVER",
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

### `POST /auth/refresh`

Body:

```json
{
  "refreshToken": "jwt"
}
```

You can also send the refresh token in the `refreshToken` cookie.

Success `200`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Driver",
      "email": "john@example.com",
      "role": "DRIVER",
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    },
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

### `POST /auth/forgot-password`

Body:

```json
{
  "email": "john@example.com"
}
```

Success `202`:

```json
{
  "data": {
    "message": "If an account exists, password-reset instructions have been issued.",
    "resetToken": "dev-only-token"
  }
}
```

`resetToken` is included only in non-production environments.

### `POST /auth/reset-password`

Body:

```json
{
  "token": "reset-token",
  "newPassword": "NewPassword123!"
}
```

Success `200`:

```json
{
  "data": null
}
```

### `POST /auth/logout`

Success `200`:

```json
{
  "data": null
}
```

### `GET /auth/me`

Success `200`:

```json
{
  "data": {
    "id": "uuid",
    "fullName": "John Driver",
    "email": "john@example.com",
    "role": "DRIVER",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

### `PATCH /auth/me`

Body:

```json
{
  "fullName": "John Updated"
}
```

Success `200`:

```json
{
  "data": {
    "id": "uuid",
    "fullName": "John Updated",
    "email": "john@example.com",
    "role": "DRIVER",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

### `POST /auth/change-password`

Body:

```json
{
  "currentPassword": "StrongPassword123!",
  "newPassword": "NewPassword123!"
}
```

Success `200`:

```json
{
  "data": null
}
```

## Vehicle Routes

Authorization: any authenticated role for reads, `ADMIN` or `FLEET_MANAGER` for writes.

### `GET /vehicles`

Query params: `status`, `type`, `region`

Success `200`: array of vehicles.

### `GET /vehicles/available`

Success `200`: array of available vehicles.

### `GET /vehicles/:id`

Success `200`: one vehicle object.

### `POST /vehicles`

Body:

```json
{
  "registrationNumber": "ABC-1234",
  "name": "Truck 1",
  "type": "TRUCK",
  "maxLoadCapacityKg": 8000,
  "odometerKm": 12000,
  "acquisitionCost": 4500000,
  "region": "Western"
}
```

Success `201`: created vehicle.

### `PATCH /vehicles/:id`

Body: any subset of the create fields.

Success `200`: updated vehicle.

### `DELETE /vehicles/:id`

Soft retires the vehicle by setting `status` to `RETIRED`.

Success `200`: updated vehicle.

### `GET /vehicles/:id/total-cost`

Success `200`:

```json
{
  "data": {
    "vehicleId": "uuid",
    "fuelCost": 0,
    "maintenanceCost": 0,
    "expenseCost": 0,
    "totalCost": 0
  }
}
```

## Driver Routes

Authorization: any authenticated role for reads, `ADMIN` or `SAFETY_OFFICER` for writes.

### `GET /drivers`

Query params: `status`

### `GET /drivers/available`

### `GET /drivers/:id`

### `POST /drivers`

Body:

```json
{
  "name": "Kamal Perera",
  "licenseNumber": "B1234567",
  "licenseCategory": "Heavy",
  "licenseExpiryDate": "2030-12-31T00:00:00.000Z",
  "contactNumber": "0771234567",
  "safetyScore": 98,
  "status": "AVAILABLE"
}
```

### `PATCH /drivers/:id`

Body: any subset of the create fields.

## Trip Routes

Authorization: any authenticated role for reads, `ADMIN` or `DRIVER` for writes.

### `GET /trips`

Query params: `status`, `driverId`, `vehicleId`

### `GET /trips/:id`

### `POST /trips`

Body:

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

Success `201`: created trip.

### `PATCH /trips/:id/dispatch`

Success `200`: dispatched trip.

### `PATCH /trips/:id/complete`

Body:

```json
{
  "actualDistance": 125,
  "fuelConsumedL": 18.5,
  "fuelCost": 6200
}
```

`fuelConsumedL` and `fuelCost` are optional.

### `PATCH /trips/:id/cancel`

Success `200`: cancelled trip.

## Maintenance Routes

Authorization: `ADMIN` or `FLEET_MANAGER`.

### `GET /maintenance`

Query params: `vehicleId`, `status`

### `POST /maintenance`

Body:

```json
{
  "vehicleId": "uuid",
  "description": "Oil change",
  "cost": 12000
}
```

### `PATCH /maintenance/:id/close`

Success `200`: closed maintenance record.

## Financial Routes

Authorization varies by route:

- `GET /fuel-logs` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`, `DRIVER`
- `POST /fuel-logs` - `ADMIN`, `FLEET_MANAGER`, `DRIVER`
- `GET /expenses` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`, `DRIVER`
- `POST /expenses` - `ADMIN`, `FLEET_MANAGER`, `DRIVER`
- `GET /dashboard/kpis` - any authenticated role
- `GET /reports/fuel-efficiency` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`
- `GET /reports/fleet-utilization` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`
- `GET /reports/operational-cost` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`

### `POST /fuel-logs`

Body:

```json
{
  "vehicleId": "uuid",
  "liters": 20,
  "cost": 6000,
  "date": "2026-07-12T00:00:00.000Z"
}
```

### `POST /expenses`

Body:

```json
{
  "vehicleId": "uuid",
  "type": "MAINTENANCE",
  "amount": 15000,
  "note": "Brake pads",
  "date": "2026-07-12T00:00:00.000Z"
}
```

### `GET /dashboard/kpis`

Success `200`: KPI object.

### `GET /reports/fuel-efficiency`

Query param: `vehicleId`

### `GET /reports/fleet-utilization`

### `GET /reports/operational-cost`

Query param: `vehicleId`

## Enums

- Vehicle status: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`
- Driver status: `AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`
- Trip status: `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`
- Maintenance status: `OPEN`, `CLOSED`
- Expense type: `TOLL`, `MAINTENANCE`, `OTHER`
