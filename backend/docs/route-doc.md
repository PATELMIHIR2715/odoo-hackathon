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

In development, Prisma known-request errors may also include a `meta` object, and Prisma validation errors may include the original validation message for easier debugging. Production responses keep the same structured error envelope but omit extra internal details.

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

The response examples below show the `data` payload content for readability. The actual HTTP response always includes the `success` and `message` fields around that payload, as shown above.

Auth payloads also include `moduleAccess`, an array of module names such as `dashboard`, `fleet`, `drivers`, `trips`, `maintenance`, `fuel_expenses`, `analytics`, and `settings`.

List endpoints that support pagination return:

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

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
      "moduleAccess": ["dashboard", "trips"],
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
      "moduleAccess": ["dashboard", "trips"],
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
      "moduleAccess": ["dashboard", "trips"],
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
    "moduleAccess": ["dashboard", "trips"],
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
    "moduleAccess": ["dashboard", "trips"],
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

## Settings / RBAC

### `GET /settings/org`

Admin-only. Returns the singleton organization settings record.

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "id": 1,
    "orgName": "TransitOps",
    "depotName": "Main Depot",
    "currency": "LKR",
    "distanceUnit": "KM",
    "timezone": "Asia/Colombo",
    "contactEmail": null,
    "contactPhone": null,
    "address": null,
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

### `PATCH /settings/org`

Admin-only.

Body:

```json
{
  "orgName": "TransitOps Pvt Ltd",
  "depotName": "Colombo Central Depot",
  "currency": "LKR",
  "distanceUnit": "KM",
  "timezone": "Asia/Colombo",
  "contactEmail": "ops@example.com",
  "contactPhone": "0112345678",
  "address": "Colombo, Sri Lanka"
}
```

You may send any subset of these fields.

Success `200`: same shape as `GET /settings/org`.

### `GET /settings/rbac`

Admin-only. Returns the module catalog, default role matrix, and all profiles with their current access arrays.

Success `200`:

```json
{
  "data": {
    "availableModules": ["dashboard", "fleet", "drivers", "trips", "maintenance", "fuel_expenses", "analytics", "settings"],
    "roleDefaults": {
      "ADMIN": ["dashboard", "fleet", "drivers", "trips", "maintenance", "fuel_expenses", "analytics", "settings"],
      "FLEET_MANAGER": ["dashboard", "fleet", "drivers", "maintenance", "analytics"],
      "DRIVER": ["dashboard", "trips"],
      "SAFETY_OFFICER": ["dashboard", "drivers", "trips"],
      "FINANCIAL_ANALYST": ["dashboard", "fleet", "fuel_expenses", "analytics"]
    },
    "profiles": []
  }
}
```

### `PATCH /settings/rbac/:profileId`

Admin-only. Body:

```json
{
  "role": "FLEET_MANAGER",
  "moduleAccess": ["dashboard", "fleet", "drivers", "maintenance", "analytics"]
}
```

If `moduleAccess` is omitted, the backend applies the default module list for the selected role.

## Vehicle Routes

Authorization: any authenticated role for reads, `ADMIN` or `FLEET_MANAGER` for writes.

### `GET /vehicles`

Query params: `search`, `status`, `type`, `region`, `page`, `pageSize`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": [
    {
      "id": "uuid",
      "registrationNumber": "ABC-1234",
      "name": "Truck 1",
      "type": "TRUCK",
      "status": "AVAILABLE",
      "maxLoadCapacityKg": 8000,
      "odometerKm": 12000,
      "acquisitionCost": 4500000,
      "region": "Western",
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

Paginated list responses use the standard shape:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

The actual response payload includes pagination metadata:

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /vehicles/available`

Success `200`: same response shape as `GET /vehicles`, filtered to `AVAILABLE` vehicles.

### `GET /vehicles/:id`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "id": "uuid",
    "registrationNumber": "ABC-1234",
    "name": "Truck 1",
    "type": "TRUCK",
    "status": "AVAILABLE",
    "maxLoadCapacityKg": 8000,
    "odometerKm": 12000,
    "acquisitionCost": 4500000,
    "region": "Western",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

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

Success `201`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "id": "uuid",
    "registrationNumber": "ABC-1234",
    "name": "Truck 1",
    "type": "TRUCK",
    "status": "AVAILABLE",
    "maxLoadCapacityKg": 8000,
    "odometerKm": 12000,
    "acquisitionCost": 4500000,
    "region": "Western",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

### `PATCH /vehicles/:id`

Body: any subset of the create fields.

Success `200`: same shape as `POST /vehicles`.

### `DELETE /vehicles/:id`

Soft retires the vehicle by setting `status` to `RETIRED`.

Success `200`: same shape as `PATCH /vehicles/:id`.

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

Query params: `search`, `status`, `page`, `pageSize`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": [
    {
      "id": "uuid",
      "name": "Kamal Perera",
      "licenseNumber": "B1234567",
      "licenseCategory": "Heavy",
      "licenseExpiryDate": "2030-12-31T00:00:00.000Z",
      "contactNumber": "0771234567",
      "safetyScore": 98,
      "status": "AVAILABLE",
      "createdAt": "2026-07-12T10:00:00.000Z",
      "updatedAt": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

Paginated list responses use the standard shape:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /drivers/available`

Success `200`: same response shape as `GET /drivers`, filtered to `AVAILABLE` drivers with a valid license.

### `GET /drivers/:id`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "id": "uuid",
    "name": "Kamal Perera",
    "licenseNumber": "B1234567",
    "licenseCategory": "Heavy",
    "licenseExpiryDate": "2030-12-31T00:00:00.000Z",
    "contactNumber": "0771234567",
    "safetyScore": 98,
    "status": "AVAILABLE",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

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

Success `201`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "id": "uuid",
    "name": "Kamal Perera",
    "licenseNumber": "B1234567",
    "licenseCategory": "Heavy",
    "licenseExpiryDate": "2030-12-31T00:00:00.000Z",
    "contactNumber": "0771234567",
    "safetyScore": 98,
    "status": "AVAILABLE",
    "createdAt": "2026-07-12T10:00:00.000Z",
    "updatedAt": "2026-07-12T10:00:00.000Z"
  }
}
```

### `PATCH /drivers/:id`

Body: any subset of the create fields.

Success `200`: same shape as `POST /drivers`.

## Trip Routes

Authorization: any authenticated role for reads, `ADMIN` or `DRIVER` for writes.

### `GET /trips`

Query params: `search`, `status`, `driverId`, `vehicleId`, `page`, `pageSize`, `sortBy`, `sortOrder`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /trips/board`

Success `200`: dashboard-style trip board payload with recent trips, status counts, and available resource counts.

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

Query params: `vehicleId`, `status`, `page`, `pageSize`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

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

- `GET /finance/summary` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`, `DRIVER`
- `GET /finance/fuel-logs` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`, `DRIVER`
- `POST /finance/fuel-logs` - `ADMIN`, `FLEET_MANAGER`, `DRIVER`
- `GET /finance/expenses` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`, `DRIVER`
- `POST /finance/expenses` - `ADMIN`, `FLEET_MANAGER`, `DRIVER`
- `GET /dashboard/kpis` - any authenticated role
- `GET /analytics/reports/fuel-efficiency` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`
- `GET /analytics/reports/fleet-utilization` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`
- `GET /analytics/reports/operational-cost` - `ADMIN`, `FINANCIAL_ANALYST`, `FLEET_MANAGER`

### `POST /finance/fuel-logs`

Body:

```json
{
  "vehicleId": "uuid",
  "liters": 20,
  "cost": 6000,
  "date": "2026-07-12T00:00:00.000Z"
}
```

Query params for `GET /finance/fuel-logs`: `vehicleId`, `page`, `pageSize`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /finance/summary`

Query params: `vehicleId`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "fuelCost": 0,
    "expenseCost": 0,
    "maintenanceCost": 0,
    "totalOperationalCost": 0
  }
}
```

`GET /fuel-logs` accepts `vehicleId`, `page`, and `pageSize`, and returns the standard paginated list shape.

### `POST /expenses`
### `POST /finance/expenses`

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

Query params for `GET /finance/expenses`: `vehicleId`, `type`, `page`, `pageSize`

Success `200`:

```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /dashboard/kpis`

Success `200`: KPI object.

### `GET /analytics/reports/fuel-efficiency`

Query param: `vehicleId`

### `GET /analytics/reports/fleet-utilization`

### `GET /analytics/reports/operational-cost`

Query param: `vehicleId`

## Enums

- Vehicle status: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`
- Driver status: `AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`
- Trip status: `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`
- Maintenance status: `OPEN`, `CLOSED`
- Expense type: `TOLL`, `MAINTENANCE`, `OTHER`
