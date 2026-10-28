# CURaise

Fundraising platform for Cornell student orgs. Sellers set up a fundraiser with items and pickup times, buyers order and pay (Venmo, Zelle, cash), sellers confirm payments and track pickups. Live at [curaise.app](https://curaise.app).

Monorepo: `frontend/` (Next.js), `backend/` (Express + Prisma on Supabase Postgres), `common/` (shared Zod schemas).

## Run locally

Full setup in [docs/ONBOARDING.md](docs/ONBOARDING.md). Short version, once you have Node 22, pnpm 10, and the `.env.dev` files from the TPM:

```bash
pnpm assemble            # install, build common, generate Prisma client
cd backend && pnpm dev   # terminal 1, port 3000
cd frontend && pnpm dev  # terminal 2, port 8080
```

## Links

- [Notion hub](https://app.notion.com/p/9a55cb3ba5834b70bf7ab73777198e31) (DTI members)
- [Production](https://curaise.app)

## Contributors

### Fall 2026
- William Chen (Designer)
- Eddie Hu (TPM)
- Emir Icyer (Developer)
- Jimin Kim (Developer)
- Angela Koo (APM)
- Olivia Lee (Designer)
- Amber Shen (Developer)
- Arsh Singh (TPM)
- Andrew Wilmott (PM)
- Steven Yu (Advisor)

### Spring 2026
- Frank Dai (Developer)
- Eddie Hu (Developer)
- Angela Koo (APM)
- Olivia Lee (Designer)
- William Chen (Designer)
- Chelsea She (Developer)
- Arsh Singh (TPM)
- Eric Weng (Developer)
- Andrew Wilmott (PM)
- Steven Yu (TPM)

### Fall 2025
- Lucy Bazezy (Designer)
- Frank Dai (Developer)
- Olivia Lee (Designer)
- Evelyn Mai (Designer)
- Darian Pan (APM)
- Chelsea She (Developer)
- Arsh Singh (TPM)
- Vicky Wang (PM)
- Eric Weng (Developer)
- Steven Yu (TPM)

### 2024-25
- Lucy Bazezy (Designer)
- Frank Dai (Developer)
- Justina Gerald (Designer)
- Katherine Huang (APM)
- Jasmine Li (PM)
- Evelyn Mai (Designer)
- Chelsea She (Developer)
- Arsh Singh (Developer)
- Eric Weng (Developer)
- Steven Yu (TPM)
