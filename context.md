# Project Context

## Project Overview
- Tech stack: React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, Zustand, React Hook Form, Zod, Axios, Sonner.
- Core frontend structure is organized by feature-oriented folders under src.
- State management uses Zustand for auth state and shared UI state.
- API communication is split between api (raw Axios), services (business logic), and store (application state).
- Authentication is login-first and uses an access token stored in localStorage.
- Routing is based on React Router with protected routes and an authenticated app shell.
- Permissions are derived from the authenticated user’s moduleAccess and should never be hardcoded.
- The app uses a purple-and-white design system with light/dark support.

## Folder Responsibilities
- api: Raw Axios requests and request configuration.
- services: Business-logic wrappers around API calls.
- store: Zustand stores for shared app state.
- routes: Route definitions, route guards, and navigation structure.
- lib: Shared helpers such as storage, permissions, and error formatting.
- types: Shared TypeScript interfaces and response types.
- constants: Shared constants, including module names.
- components: Reusable UI components and layout primitives.
- pages: Route-level page components.

## Authentication Flow
1. Login
2. Receive tokens and user data
3. Store the access token in localStorage
4. Redirect to /dashboard
5. Call /auth/me to verify the current user and fetch module access
6. Save the returned user into Zustand
7. Render the authenticated application shell

## Permission System
- Module names are centralized in shared constants under src/constants/modules.ts.
- Sidebar visibility, route guards, and permission checks must use these constants.
- Permission helpers are available in src/lib/permissions.ts.
- The single source of truth for permissions is user.moduleAccess.

## Theme
- The global design system is defined in src/index.css via CSS variables.
- The visual language uses a purple-and-white palette with rounded corners and soft shadows.
- Dark mode is supported through the CSS variables.
- Reusable shadcn components are preferred for UI pieces.

## API Conventions
- Axios is configured from a shared instance in src/api/axios.ts.
- The Authorization header is attached automatically using the stored access token.
- API responses use a success/data or success/error envelope.
- Backend errors are normalized through shared error helpers and surfaced using Sonner.

## Coding Rules
- Prefer composition over abstraction.
- Avoid duplicated code and magic strings.
- Keep components focused and strongly typed.
- Reuse shared helpers and constants instead of introducing extra wrappers.
- Modify only the files required for the requested feature.

## Future Modules
- Vehicles
- Drivers
- Trips
- Maintenance
- Expenses
- Reports
