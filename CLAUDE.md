# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CURaise is a monorepo fundraising platform with three packages:
- **backend**: Express.js + TypeScript + Prisma ORM
- **frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **common**: Shared Zod schemas for type-safe API contracts

## Development Commands

### Initial Setup
```bash
pnpm assemble  # Install deps, build common, generate Prisma client
```

### Running the Application
```bash
# Run both frontend and backend concurrently
pnpm dev

# Run individually
cd backend && pnpm dev    # Backend dev server with nodemon
cd frontend && pnpm dev   # Frontend dev server on port 8080
```

### Backend Commands
```bash
cd backend

# Database
pnpm prisma:generate      # Generate Prisma client after schema changes
pnpm migrate:dev          # Run migrations (uses .env.dev)
pnpm migrate:prod         # Deploy migrations to prod (uses .env.prod)
pnpm seed:dev             # Seed database

# Build & Test
pnpm build                # TypeScript compilation
pnpm test                 # Run Jest tests
pnpm start                # Run production build

# Environment switching
pnpm switch:dev           # Copy .env.dev to .env
pnpm switch:prod          # Copy .env.prod to .env
```

### Frontend Commands
```bash
cd frontend

pnpm dev     # Dev server (copies .env.dev to .env.local, runs on port 8080)
pnpm build   # Production build
pnpm lint    # ESLint
pnpm start   # Start production server
```

### Common Package
```bash
cd common
pnpm build   # Build TypeScript to /dist (required after schema changes)
```

## Architecture

### Backend API Structure

The backend follows a **modular router pattern** with consistent file organization:

```
/api/{module}/
  ├── {module}.router.ts    # Route definitions
  ├── {module}.handlers.ts  # Request/response orchestration
  ├── {module}.services.ts  # Database operations (Prisma)
  ├── {module}.types.ts     # TypeScript interfaces
  └── index.ts              # Module exports
```

**Current modules**: email, fundraiser, order, organization, referral, user

**Request flow**:
1. Route matched in router
2. Middleware runs: `authenticate` (JWT validation) → `validate` (Zod schema validation)
3. Handler extracts data, calls service functions
4. Service queries Prisma database
5. Handler validates response with Zod schema, returns `{ message, data }`

### Authentication & Authorization

**Stack**: Supabase Auth (JWT-based)

**Flow**:
1. Frontend: User logs in via Supabase → JWT stored in browser
2. Frontend: Sends requests with `Authorization: Bearer {token}` header
3. Backend: `authenticate` middleware validates JWT with Supabase service key
4. Backend: Attaches user to `res.locals.user` for handlers

**Middleware**:
- `authenticate.ts`: Requires valid JWT, returns 401 if missing/invalid
- `authenticateOptional.ts`: Allows requests with or without auth
- `validate.ts`: Validates request params/query/body against Zod schemas

### Frontend-Backend Communication

**Fetcher Pattern** (`/frontend/src/lib/fetcher.ts`):
- `authFetcher(schema)`: For authenticated requests, validates response with Zod
- `noAuthFetcher(schema)`: For public endpoints
- Used with SWR: `useSWR(url, authFetcher(CompleteSchema))`

**Response Format**: Backend always returns `{ message: string, data: T }`

### Shared Schemas (Common Package)

All API contracts defined in `/common/schemas/` using Zod:
- **Basic schemas**: Minimal fields for list responses (e.g., `BasicFundraiserSchema`)
- **Complete schemas**: Full relations for detail views (e.g., `CompleteFundraiserSchema`)
- **Body schemas**: Request validation (e.g., `CreateOrderBody`, `UpdateFundraiserBody`)

**Important**: After changing schemas in `common/`, run `cd common && pnpm build` to recompile.

### Database Schema (Prisma)

**Location**: `/backend/prisma/schema.prisma`

**Core entities**:
- `User`: Authenticated users (links to Supabase user ID)
- `PendingUser`: Users invited but not yet registered
- `Organization`: Fundraiser organizations (requires authorization)
- `Fundraiser`: Fundraising campaigns (belongs to organization)
- `Item`: Products sold in fundraisers
- `Order`: Customer purchases (has `PaymentStatus` enum)
- `OrderItems`: Junction table for Order ↔ Item
- `PickupEvent`: Collection times/locations for orders
- `Announcement`: Updates posted to fundraisers
- `Referral`: Referral program tracking (new feature)

**Patterns**:
- UUID primary keys
- Decimal.js for money fields (`@db.Money`)
- Cascade deletes for cleanup
- Snake_case in database, camelCase in Prisma client

### Frontend Routing (Next.js App Router)

```
/app/
  ├── /auth           # Login/logout
  ├── /buyer          # Customer-facing routes
  │   ├── /browse     # Browse fundraisers
  │   ├── /fundraiser/:id
  │   ├── /order      # Order management
  │   └── /account    # User profile
  ├── /seller         # Organization admin routes
  │   ├── /fundraiser # Create/manage fundraisers
  │   ├── /order      # View orders
  │   └── /org        # Organization settings
  └── /page.tsx       # Landing page
```

**Protected routes**: `/buyer/**` and `/seller/**` require authentication (enforced by middleware)

### State Management

- **Zustand**: Shopping cart state (`/frontend/src/lib/store/useCartStore.ts`)
  - Persists to localStorage
  - Methods: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `prepareOrderItems`
  - Organized per fundraiser (Map: `fundraiserId → CartItem[]`)
- **SWR**: Data fetching and caching

### UI Components

- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Styling
- **shadcn/ui pattern**: Components in `/frontend/src/components/ui/`
- **React Hook Form**: Form state management
- **TanStack React Table**: Data tables

## Development Patterns

### Adding a New API Endpoint

1. Define schemas in `/common/schemas/{module}.ts`
2. Build common: `cd common && pnpm build`
3. Create handler in `/backend/src/api/{module}/{module}.handlers.ts`
4. Create service function in `/backend/src/api/{module}/{module}.services.ts`
5. Add route to `/backend/src/api/{module}/{module}.router.ts`
6. Use `authenticate` and `validate` middleware as needed
7. Frontend: Use `authFetcher` or `noAuthFetcher` with appropriate schema

### Database Changes

1. Modify `/backend/prisma/schema.prisma`
2. Run `cd backend && pnpm migrate:dev` (creates migration + regenerates client)
3. Update seed file if needed: `/backend/prisma/seed.ts`
4. Run `pnpm seed:dev` to apply seed data

### Adding Shared Types

1. Add Zod schema to `/common/schemas/{module}.ts`
2. Export from `/common/src/index.ts`
3. Build: `cd common && pnpm build`
4. Use in frontend: `import { SchemaName } from 'common'`
5. Use in backend: `import { SchemaName } from 'common'`

## Environment Variables

Each package has environment files:
- **Backend**: `.env.dev`, `.env.prod` (copy to `.env` via switch scripts)
- **Frontend**: `.env.dev`, `.env.local` (auto-copied by dev script)

**Key variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_API_URL`: Backend API URL (frontend)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase project config
- `SUPABASE_SERVICE_ROLE_KEY`: Backend-only (for JWT validation)
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`: Email service

## Testing

Backend tests use Jest:
```bash
cd backend && pnpm test
```

## Deployment

**Backend**: Heroku (automatic via `heroku-postbuild` script in root `package.json`)
**Frontend**: Netlify (status badge in README.md)
