# CLAUDE.md

Guide for humans and AI agents working on CURaise. Keep this file authoritative; update it when conventions or infra change.

## What this is

CURaise is a fundraising platform built by Cornell DTI. Buyers browse organization fundraisers and place orders; sellers manage organizations, items, pickup events, and orders. Money is collected off-platform (Venmo) and reconciled in-app.

Repo: `cornell-dti/curaise` (default branch `main`, working branch `dev`).

## Monorepo layout

pnpm workspace with three packages:

| Package | Stack | Notes |
|---|---|---|
| `backend/` | Node + Express 4 + TypeScript, Prisma, Supabase Auth | Deployed to Heroku |
| `frontend/` | Next.js 15 (App Router) + React 19 + TypeScript, Tailwind, shadcn/ui | Deployed to Vercel |
| `common/` | TypeScript + Zod | Shared schemas; published to other packages as `workspace:*` |

Also: `e2e/` (Playwright scaffold; no committed tests).

## Quickstart

New devs: follow `docs/ONBOARDING.md` (prereqs, clone, env files, Windows/WSL2 notes).

```bash
pnpm assemble        # install deps, build common, generate Prisma client
```

Then run backend and frontend in two separate terminals (`cd backend && pnpm dev`, `cd frontend && pnpm dev`). Root `pnpm dev` runs both in one terminal with interleaved logs; the team convention is two terminals.

Requirements: Node 20.6+ (22 LTS recommended; backend dev script uses `node --env-file`), pnpm 9+ (lockfile v9). Windows must use WSL2 because the scripts use `cp`.

Per-package:

```bash
# backend (port from .env, nodemon + ts-node)
cd backend
pnpm dev             # uses .env.dev
pnpm prod            # uses .env.prod
pnpm build           # tsc + copies src/generated to dist
pnpm test            # jest
pnpm prisma:generate
pnpm migrate:dev     # prisma migrate dev (uses .env.dev)
pnpm migrate:prod    # prisma migrate deploy (uses .env.prod)
pnpm seed:dev        # ts-node prisma/seed.ts
pnpm switch:dev | switch:prod  # copy env file to .env

# frontend (port 8080, Turbopack)
cd frontend
pnpm dev             # copies .env.dev -> .env.local
pnpm prod            # copies .env.prod -> .env.local
pnpm build           # next build
pnpm lint            # next lint

# common (must rebuild after schema changes)
cd common && pnpm build
```

`pnpm heroku-postbuild` (root) builds common, generates Prisma, builds backend.

## Architecture

### Backend (`backend/src/`)

```
server.ts         # express setup (cors, json, router)
router.ts         # mounts /api/<module> routers
api/<module>/
  <module>.router.ts     # routes; chain validate -> authenticate -> asyncHandler(handler)
  <module>.handlers.ts   # request/response orchestration
  <module>.services.ts   # Prisma calls
  <module>.types.ts      # local TypeScript types (e.g. route param schemas)
  index.ts               # re-exports router as default
middleware/
  authenticate.ts        # validates Supabase JWT; attaches user to res.locals.user. authenticateOptional variant exists.
  validate.ts            # Zod-based params/query/body validator (modified express-zod-safe)
  handlePrismaErrors.ts  # asyncHandler wrapper + 4-arg error middleware mapping Prisma codes to HTTP
utils/
  prisma.ts              # singleton Prisma client
  email.ts               # Mailgun integration
  memjs.ts               # memcached client (Heroku Memcachier)
generated/client/        # Prisma client output (gitignored; run prisma:generate; copied into dist on build)
```

Current API modules: `email`, `fundraiser`, `order`, `organization`, `user`. (The `Referral` model exists in Prisma but is not yet exposed via routes.)

Response shape (always): `{ message: string, data?: T }`. Prisma errors are translated centrally:

| Prisma code | HTTP | Message |
|---|---|---|
| P2002 | 409 | A record with this value already exists |
| P2025 | 404 | Record not found |
| P2003 | 400 | Related record not found |
| ZodValidationError | 400 | Invalid data provided |

### Database (Prisma, PostgreSQL via Supabase)

Schema at `backend/prisma/schema.prisma`. Conventions: UUID primary keys, snake_case in DB (`@map`), camelCase in client, `Decimal` for money columns (`@db.Money`), cascade deletes on child records that should not outlive their parent (e.g. `PickupEvent`, `Announcement`, `Referral` cascade from `Fundraiser`).

Models: `User`, `PendingUser` (invited but unregistered), `Organization`, `Fundraiser`, `Item`, `Order`, `OrderItems`, `PickupEvent`, `Announcement`, `Referral`. Enums: `PaymentMethod`, `PaymentStatus`.

### Common (`common/`)

Zod schemas exported from `common/index.ts`: `fundraiser`, `item`, `order`, `organization`, `user`, `decimal`. Convention per entity:

- `Basic*Schema`: minimal fields for list views
- `Complete*Schema`: full relations for detail views
- `Create*Body` / `Update*Body`: request payload schemas

Always run `cd common && pnpm build` after editing any schema; both apps consume the compiled `dist/`.

### Frontend (`frontend/src/`)

```
app/                  # Next.js App Router
  page.tsx            # landing
  auth/, login/, logout/, account/, account-actions/
  buyer/              # browse, fundraiser/[id], order/, ...
  seller/             # fundraiser/, order/, org/, components/
  privacy-policy/, global-error.tsx, layout.tsx
components/
  ui/                 # shadcn primitives (new-york style, zinc base, lucide icons)
  custom/             # app-specific composites (Navbar, ShoppingCart, OrderCard, ...)
  auth/
hooks/
lib/
  fetcher.ts          # authFetcher, noAuthFetcher (SWR), serverFetch (RSC), mutationFetch
  store/useCartStore.ts  # Zustand cart, persisted to localStorage, keyed by fundraiserId
  auth-actions.ts, auth-redirect.ts, capacity.ts, utils.ts
utils/supabase/
  client.ts, server.ts, middleware.ts   # SSR-aware Supabase clients
  storage/client.ts                     # uploadImage / removeImage helpers (bucket: "images")
middleware.ts         # invokes Supabase session middleware on protected matchers
```

Auth flow: user signs in via Supabase on the frontend; `authFetcher` attaches `Authorization: Bearer <jwt>`; backend `authenticate` validates with the service role key. Protected route prefixes: `/login`, `/buyer`, `/buyer/order/*`, `/account`, `/account-actions`, `/seller/*`.

State: Zustand for cart (persisted), SWR for server state. Forms: React Hook Form + Zod via `@hookform/resolvers`. Tables: TanStack Table. Toasts: Sonner. Tailwind theme uses HSL CSS variables; fonts `--font-dm-sans` (sans) and `--font-roboto-mono` (mono).

## Infrastructure

- **Backend host**: Heroku. `Procfile` is `web: pnpm --filter 'backend' start`. `heroku-postbuild` script builds the workspace.
- **Frontend host**: Vercel.
- **Database + Auth + Storage**: Supabase. Two projects:
  - `curaise-dev` (`zrpllsbiklrzsufbbumw`, US-East Ohio)
  - `curaise-prod` (`zrqmplfsrshsdockyyjt`, US-East N.Virginia)
- **Supabase storage**: bucket `images` with folders like `fundraisers/`, `items/`. Uploads go through `frontend/src/utils/supabase/storage/client.ts`.
- **Email**: Mailgun (backend).
- **Cache**: Memcachier (memjs) on backend.
- **CI**: none currently. PRs are reviewed manually on GitHub.

## Environment variables

Per-package env files (never commit production secrets). The dev/prod scripts copy the right file into the active env:

- `backend/.env.dev`, `backend/.env.prod` -> copied to `backend/.env`
- `frontend/.env.dev`, `frontend/.env.prod` -> copied to `frontend/.env.local`

Key vars:

| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | backend | Postgres (pooled + direct for migrations) |
| `PORT` | backend | Express listen port |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | backend | JWT validation |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend | Client auth + storage URLs |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | backend | Outgoing email |
| `MEMCACHIER_*` | backend | Cache client |

## Conventions

### Adding an API endpoint

1. Define / extend Zod schemas in `common/schemas/<module>.ts` (Basic, Complete, body).
2. `cd common && pnpm build`.
3. Service in `backend/src/api/<module>/<module>.services.ts` (Prisma only, no Express).
4. Handler in `<module>.handlers.ts` reads from `req.params/query/body` (already typed by `validate`) and `res.locals.user`, calls service, validates response with the Complete schema, returns `{ message, data }`.
5. Route in `<module>.router.ts` chained as `validate(...) -> authenticate -> asyncHandler(handler)`. Use `authenticateOptional` for endpoints that work logged-out.
6. Mount in `backend/src/router.ts` if it is a new module.
7. Frontend: call via `authFetcher(CompleteSchema)` (SWR) or `mutationFetch` (POST/PUT/DELETE), or `serverFetch` from RSC.

### Database changes

1. Edit `backend/prisma/schema.prisma`.
2. `cd backend && pnpm migrate:dev` (creates migration + regenerates client).
3. Update `prisma/seed.ts` if needed; `pnpm seed:dev`.
4. Reflect any new fields in `common/schemas/*` and rebuild common.
5. Apply to prod with `pnpm migrate:prod` after merge.

### Code style

- TypeScript strict; no `any` in new code unless interfacing with untyped libs.
- Filenames: `camelCase.ts` for libs/utilities, `PascalCase.tsx` for React components, `kebab-case` for App Router segments.
- Backend module files: `<module>.<role>.ts` (router/handlers/services/types).
- Imports: `common` package via bare specifier (`import { CompleteFundraiserSchema } from "common"`).
- React: prefer Server Components; mark Client Components with `"use client"` only when needed (state, effects, browser APIs, Zustand, SWR).
- Forms: validate with the same Zod body schema the backend uses.
- Money: `decimal.js` everywhere. Never use JS `number` for prices.
- Dates: `date-fns`. Persist as ISO strings / `DateTime` columns.
- Errors: throw plain `Error` from services; `asyncHandler` + `handlePrismaErrors` will surface a sane HTTP response. Reserve `res.status(...).json(...)` for handler-specific responses.
- Comments: explain the non-obvious (constraints, Venmo workflow quirks). Do not narrate what the code does.
- No em dashes in user-visible copy.

### Git and PRs

- Branch off `dev`, name like `<name>-<short-description>` (existing pattern).
- One logical change per PR. PR title is what shows on the merge commit.
- Never push without explicit approval. Never add `Co-authored-by` trailers.
- `dev` -> `main` is done via a periodic merge PR (e.g. PR #147).

### When working with AI agents

- Skim this file first; the answers to "where does X live" are above.
- Trust generated `backend/src/generated/client/` only as Prisma output; do not hand-edit.
- If a change spans `common/` and consumers, rebuild common before running typechecks.
- Match the existing module shape (router/handlers/services/types) rather than introducing new patterns.
- Surface infra changes (new env var, new Supabase bucket, new external service) by updating this file in the same PR.

## Useful commands

```bash
# Supabase (CLI is signed in)
supabase projects list
supabase link --project-ref <ref>          # zrpllsbiklrzsufbbumw (dev) or zrqmplfsrshsdockyyjt (prod)
supabase db pull                           # mirror remote schema locally
supabase secrets list

# GitHub
gh pr list --state open
gh pr view <num>
gh pr checks <num>

# Heroku (backend)
heroku logs --tail -a <app>
heroku run "pnpm --filter backend prisma migrate deploy" -a <app>
```
