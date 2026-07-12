# FleetOS Project Context - Frontend Workspace Guidelines

This document provides a comprehensive overview of the **FleetOS** codebase, conventions, and implemented modules for any developer or AI agent continuing this project.

---

## 1. Tech Stack & Architectural Conventions

- **Frontend Core**: React 18, Vite, TypeScript, TailwindCSS.
- **State & Form Management**: React Hook Form with Zod schema resolvers.
- **Routing**: React Router DOM (protected layout mapped via `<AppLayout>` shell).
- **UI Primitives**: shadcn base-lyra components styled with `@base-ui/react`.
  - Trigger components in base-lyra (e.g. `DialogClose`, `DropdownMenuTrigger`) do **NOT** support `asChild`. Instead, they use the `render` prop (e.g., `render={<Button ... />}`).
- **Error Handling**: Wrapped in a global `ErrorBoundary.tsx` located inside `main.tsx` (nested inside `ThemeProvider` so the error page supports light/dark themes).
- **List Pagination**: Supported globally using `PaginationMetadata` and `PaginatedListData<T>` generic wrappers from `src/types/api.ts`. Current page synchronizes with URL query param `?page=N` and filter/search changes reset the page param back to `1`.

---

## 2. Design System & Aesthetics

FleetOS is designed to look modern, clean, and highly premium in both light and dark modes:

- **Typography**: Uses clean, highly readable fonts (e.g., JetBrains Mono for system codes, registration numbers, and prices; Outfit/Inter for labels and headers).
- **Aesthetic Tone**: Glassmorphism highlights, soft shadows (`shadow-sm`, `shadow-lg`), and clean rounded corners (`rounded-xl` for forms, `rounded-2xl` for dashboard cards, `rounded-3xl` for error boundaries).
- **Accents & Colors**: Consistent purple/indigo main accents (`text-primary`, `bg-primary`, `hover:bg-primary/95`).
- **Status Indicators (Colored Badges)**: Status items follow a clear semantic coloring convention across all tables:
  - **Green / Emerald**: `AVAILABLE` (vehicles/drivers), `COMPLETED` (trips), `CLOSED` (maintenance).
  - **Blue**: `ON_TRIP` (vehicles/drivers), `DISPATCHED` (trips).
  - **Amber / Yellow**: `IN_SHOP` (vehicles), `SUSPENDED` (drivers), `OPEN` (maintenance).
  - **Red / Rose**: `RETIRED` (vehicles), `CANCELLED` (trips), `EXPIRED` (license warning).
  - **Grey**: `OFF_DUTY` (drivers), `DRAFT` (trips).
- **Table Design**: Condensed space layout with tracking-wider, semibold uppercase headings, alternating row layouts, and subtle borders (`border-border/80`).

---

## 3. Implemented Modules & Envelopes

### A. Vehicles/Fleet Module (`/fleet`)
- **Types**: `src/types/vehicle.ts`
- **API/Services**: `src/api/vehicles.api.ts` & `src/services/vehicles.service.ts`
- **UI Component**: `src/pages/vehicles/VehiclesPage.tsx`
- **Features**: List table with type/status filters, creation modal, edit modal pre-populating details from GET by ID, and soft-delete/retire confirmation changing vehicle status to `RETIRED`.

### B. Drivers Module (`/drivers`)
- **Types**: `src/types/driver.ts`
- **API/Services**: `src/api/drivers.api.ts` & `src/services/drivers.service.ts`
- **UI Component**: `src/pages/drivers/DriversPage.tsx`
- **Features**: List table with search filter, details view modal, creation/edit modals (with date converters for HTML datepicker), and soft-delete/suspend confirmations. Displays expired license warning labels (`MM/YYYY EXPIRED` in bold red).

### C. Trips Module (`/trips`)
- **Types**: `src/types/trip.ts`
- **API/Services**: `src/api/trips.api.ts` & `src/services/trips.service.ts`
- **UI Component**: `src/pages/trips/TripsPage.tsx`
- **Features**:
  - Trip lifecycle: `DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`.
  - Dropdown options fetch active `AVAILABLE` vehicles and drivers when modal opens.
  - **Constraint-Based Dispatch Warning**: Exceeding the selected vehicle capacity displays a red alert and disables the Dispatch submit button, blocking dispatch but permitting draft saves.
  - **Complete Modal**: Collects actual distance and optional fuel stats, validating positive values.

### D. Maintenance Module (`/maintenance`)
- **Types**: `src/types/maintenance.ts`
- **API/Services**: `src/api/maintenance.api.ts` & `src/services/maintenance.service.ts`
- **UI Component**: `src/pages/maintenance/MaintenancePage.tsx`
- **Features**: Tracks workshop logs. Forms select active non-retired vehicles, validating cost inputs. Confirms closing open workshop records to mark as `CLOSED` and stamps completion time.

---

## 4. Important Implementation Gotchas

- **Date Inputs**: HTML `<input type="date">` requires `YYYY-MM-DD` strings. We parse ISO timestamps to `YYYY-MM-DD` when pre-filling fields, and transform inputs back to ISO strings on submit payload delivery.
- **Optional Form Numbers**: To avoid Zod failures on optional empty number fields (which evaluate to `NaN` when using `{ valueAsNumber: true }`), we register fields without `valueAsNumber` (allowing them to pass as strings/empty values) and validate them using `z.union([z.string(), z.number()])` coupled with helper `refine` checks, casting them to numbers in form handlers.
- **Select Trigger Text**: To avoid displaying raw UUIDs when select fields are closed and dropdown list items are unmounted, inject children nodes dynamically into `<SelectValue>` to render custom display names corresponding to the active selected ID.
