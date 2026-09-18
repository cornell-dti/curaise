# CURaise dev setup

## 1. Install prerequisites

You need Git, Node 20.6 or newer (22 LTS recommended), and pnpm 9 or newer (10 recommended). If you already have versions that meet those floors, skip ahead. Node 20.6 is the floor because the backend dev script uses `node --env-file`; pnpm 9 is the floor because of the lockfile format.

**macOS**

```bash
brew install git nvm
nvm install 22 && nvm use 22
npm install -g pnpm@10
```

**Windows**

Native Windows (PowerShell or cmd) works fine. No WSL2 required.

1. Install Git from https://git-scm.com/download/win (includes Git Bash).
2. Install Node 22 LTS from https://nodejs.org (use the Windows Installer `.msi`).
3. In PowerShell or cmd:

```powershell
npm install -g pnpm@10
```

Check versions: `node -v` (20.6+), `pnpm -v` (9+), `git --version`.

## 2. Clone the repo

```bash
git clone https://github.com/cornell-dti/curaise.git
cd curaise
git checkout dev
```

`dev` is the working branch. `main` is production and only receives periodic merge PRs from `dev`.

## 3. Add environment files

Env files are gitignored. TPM should have sent them in Slack. Download them and drop them in place:

| File                 | Purpose                                | Keys                                                                                                                  |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `backend/.env.dev`   | backend, dev Supabase project          | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, `PORT`     |
| `backend/.env.prod`  | backend, prod Supabase project         | same keys, prod values                                                                                                |
| `frontend/.env.dev`  | frontend, dev Supabase project         | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`, `NEXT_PUBLIC_API_URL` |
| `frontend/.env.prod` | frontend, prod Supabase project        | same keys, prod values                                                                                                |

You only need the two `.env.dev` files to run locally. `pnpm dev` copies `.env.dev` to `.env` (backend) and `.env.local` (frontend); `pnpm prod` does the same with `.env.prod` and points your local app at the production database, so only use it when you mean to. `PORT` is `3000` and `NEXT_PUBLIC_API_URL` is `http://localhost:3000/api`. Never commit any `.env*` file.

## 4. Install and run

```bash
pnpm assemble   # installs deps, builds common, generates the Prisma client
```

Run the backend and frontend in **two separate terminals**:

```bash
# Terminal 1: backend (port 3000)
cd backend && pnpm dev

# Terminal 2: frontend (port 8080)
cd frontend && pnpm dev
```

Open http://localhost:8080. You should see the landing page, and http://localhost:3000/api/fundraiser should return JSON.

pnpm will print a warning about ignored build scripts (prisma, esbuild, sharp). It is safe to ignore; everything still works.

## 5. Day-to-day commands

```bash
cd backend && pnpm dev            # terminal 1
cd frontend && pnpm dev           # terminal 2
cd common && pnpm build           # required after editing any schema in common/
cd backend && pnpm migrate:dev    # after editing prisma/schema.prisma
cd backend && pnpm seed:dev       # seed the dev database
cd frontend && pnpm lint
```

Branch off `dev` as `<name>-<short-description>` and open a PR into `dev`. Never push to `main` directly. See `CLAUDE.md` for architecture and conventions.

## Troubleshooting

- **Backend returns 500 and logs `tenant/user postgres.<ref> not found`**: the free-tier dev Supabase project has been paused for inactivity. Ask a TPM to restore it from the Supabase dashboard (Project Settings > General > Restore project). It takes 2 to 4 minutes.
- **Prisma client missing / import errors from `src/generated`**: run `cd backend && pnpm prisma:generate`. The generated client is gitignored and must be built locally.
- **Types from `common` are stale**: run `cd common && pnpm build`.
- **Memcached**: the backend uses Memcachier in production only. Locally it runs fine without memcached installed.
- **`pnpm test` in backend fails with `jest: not found`**: there are no backend tests yet and jest is not installed. This is expected.
