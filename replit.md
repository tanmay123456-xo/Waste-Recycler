# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── waste-recycling/    # React + Vite frontend (Waste Recycling Reward System)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Application: Waste Recycling Reward System

A full-stack DApp for tracking waste recycling and rewarding users with blockchain-based RecycleTokens (RCT).

### Features
- User registration/login with email and password (session-based)
- Waste submission (Plastic, Paper, Metal, Glass, E-waste) with weight and recycling center
- Token reward system: 1 kg = 10 RCT tokens
- Admin dashboard to approve/reject submissions and trigger token issuance
- Blockchain transaction hash generation on approval
- User dashboard with submission history and token balance
- Statistics charts (waste by type, monthly trends)
- Leaderboard for top recyclers
- Wallet address management (Ethereum format)

### Default Accounts (password: `secret123` for all)
- **Admin**: admin@recyclesystem.com
- **User**: alice@example.com, bob@example.com, carol@example.com

### Database Schema
- `users` — name, email, password_hash, wallet_address, role (user/admin), token_balance, total_waste_kg
- `waste_submissions` — user_id, waste_type, weight_kg, recycling_center_id, status, tokens_awarded, transaction_hash, blockchain_timestamp
- `sessions` — session token-based authentication

### API Routes
- `GET/POST /api/auth/*` — me, register, login, logout
- `GET /api/users/profile`, `PUT /api/users/wallet`
- `POST /api/waste/submit`, `GET /api/waste/submissions`
- `GET /api/admin/submissions`, `POST /api/admin/submissions/:id/approve|reject`, `GET /api/admin/users`, `GET /api/admin/stats`
- `GET /api/stats/overview|waste-types|monthly`
- `GET /api/leaderboard`

### Recycling Centers
- RC-001 (Downtown)
- RC-002 (West Side)
- RC-003 (North District)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

### `artifacts/waste-recycling` (`@workspace/waste-recycling`)

React + Vite frontend for the Waste Recycling Reward System. Uses React Query for data fetching, Wouter for routing, Recharts for charts, Framer Motion for animations, and Shadcn UI components.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
