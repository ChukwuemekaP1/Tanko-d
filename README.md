# 🚛 Tanko — Decentralized Fuel Wallet for Transport Fleets

> **Hack+ Alebrije CDMX 2026** — MVP Demo
> B2B system for managing fleet fuel with smart-contract escrows on the Stellar blockchain via **Trustless Work** and **Soroban Smart Contracts**.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Monorepo Structure](#monorepo-structure)
4. [Tech Stack](#tech-stack)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Running the App](#running-the-app)
8. [Usage Guide](#usage-guide)
9. [Backend API Endpoints](#backend-api-endpoints)
10. [Smart Contract](#smart-contract)
11. [Current Status](#current-status)
12. [CI/CD](#cicd)

---

## Project Overview

**Tanko** replaces cash advances and corporate fuel cards with on-chain escrows. Fleet managers authorize funds, the blockchain holds them securely, and drivers receive payment only after the fuel load is confirmed.

### System Actors

| Actor | Role | Description |
|-------|------|-------------|
| **Fleet Manager (Jefe)** | JEFE | Creates escrows, approves/rejects fund requests, monitors fleet |
| **Driver (Conductor)** | CONDUCTOR | Requests fuel funds, loads fuel, receives payment |

### Core Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAN KO FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Driver                          Backend                      Stellar         │
│    │                               │                            │            │
│    ├─ Request funds ──────────────▶│                            │            │
│    │                               │                            │            │
│    │                               ├─ Soroban: verify driver ─▶│            │
│    │                               │◀─ driver verified ──────────┤            │
│    │                               │                            │            │
│    │                               ├─ Trustless Work:          │            │
│    │                               │   create escrow ──────────▶│            │
│    │◀─ pending ────────────────────┤                            │            │
│                                                                             │
│  Manager                          Backend                      Stellar       │
│    │                               │                            │            │
│    ├─ Review pending ─────────────▶│                            │            │
│    │◀─ pending list ───────────────┤                            │            │
│    │                               │                            │            │
│    ├─ Approve ─────────────────────▶│                            │            │
│    │                               ├─ Trustless Work:           │            │
│    │                               │   release escrow ─────────▶│            │
│    │                               │◀─ funds released ───────────┤            │
│    │◀─ approved ───────────────────┤                            │            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User opens app                                              │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │  /login         │  Connect wallet (Freighter)            │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Select Role     │  CONDUCTOR or JEFE                    │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ├───────────▶ /dashboard/conductor (Driver)        │
│           │                                                  │
│           └───────────▶ /dashboard (Manager)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Protected Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/dashboard` | JEFE only | Fleet overview, pending approvals, stats |
| `/dashboard/conductor` | CONDUCTOR only | Driver wallet, request funds |
| `/dashboard/usuarios` | JEFE only | User management |
| `/dashboard/unidades` | JEFE only | Fleet vehicles |
| `/dashboard/consumos` | JEFE only | Fuel logs history |
| `/dashboard/ubicaciones` | JEFE only | Gas station locations |

---

## Monorepo Structure

```
Tanko/
├── .env                      ← Environment variables
├── .env.example              ← Template for .env
├── promt.txt                 ← Smart contract specification
├── README.md
│
├── frontend/                 ← Next.js 16 (App Router)
│   ├── app/
│   │   ├── layout.tsx            ← Root layout
│   │   ├── providers.tsx          ← AuthProvider (wallet context)
│   │   ├── page.tsx              ← Landing/connect page
│   │   ├── login/page.tsx        ← Login with wallet + role selection
│   │   ├── logout/page.tsx       ← Logout handler
│   │   ├── menu/page.tsx          ← Landing page with features
│   │   └── dashboard/
│   │       ├── layout.tsx             ← Sidebar + protected routes
│   │       ├── page.tsx               ← Fleet Manager dashboard
│   │       ├── conductor/page.tsx      ← Driver wallet
│   │       ├── usuarios/page.tsx       ← Users management
│   │       ├── unidades/page.tsx       ← Fleet vehicles
│   │       ├── consumos/page.tsx      ← Fuel logs
│   │       └── ubicaciones/page.tsx   ← Gas stations
│   │
│   ├── components/
│   │   ├── ui/                ← shadcn/ui components
│   │   ├── wallet/            ← WalletButton
│   │   └── logo.tsx           ← Tanko logos
│   │
│   └── providers/
│       ├── auth-provider.tsx       ← AuthContext (wallet + role)
│       └── protected-route.tsx     ← Route protection HOC
│
├── backend/                  ← Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma     ← Database schema
│   │   ├── seed.ts          ← Seed data
│   │   └── prisma.config.ts  ← Prisma configuration
│   │
│   └── src/
│       ├── index.ts              ← Express app entry point
│       ├── config/index.ts       ← Environment configuration
│       ├── db/prisma.ts         ← Prisma client
│       │
│       ├── repositories/         ← Data access layer
│       │   ├── user.repository.ts
│       │   ├── unit.repository.ts
│       │   ├── fuelLog.repository.ts
│       │   ├── fundRequest.repository.ts
│       │   ├── escrowConfig.repository.ts
│       │   └── escrowMilestone.repository.ts
│       │
│       ├── services/              ← Business logic
│       │   ├── escrow.service.ts
│       │   ├── funds.service.ts
│       │   ├── stats.service.ts
│       │   ├── stellar.service.ts
│       │   └── trustlessWork.service.ts
│       │
│       ├── controllers/           ← Request handlers
│       │   ├── escrow.controller.ts
│       │   ├── funds.controller.ts
│       │   ├── stats.controller.ts
│       │   ├── user.controller.ts
│       │   ├── unit.controller.ts
│       │   ├── fuelLog.controller.ts
│       │   └── wallet.controller.ts
│       │
│       └── routes/               ← API routes
│           ├── escrow.routes.ts
│           ├── funds.routes.ts
│           ├── stats.routes.ts
│           ├── user.routes.ts
│           ├── unit.routes.ts
│           ├── fuelLog.routes.ts
│           ├── config.routes.ts
│           ├── wallet.routes.ts
│           └── helper.routes.ts
│
└── contracts/                ← Soroban Smart Contracts
    └── tanko-registry/
        ├── Cargo.toml
        └── src/lib.rs        ← TankoRegistry contract
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 18, Tailwind CSS, shadcn/ui, Recharts |
| **Blockchain Auth** | `@stellar/freighter-api` (browser extension) |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Blockchain** | Stellar (Testnet via Horizon + Soroban) |
| **Escrow Protocol** | Trustless Work API |
| **Smart Contracts** | Rust + Soroban SDK |
| **Package Manager** | npm Workspaces |

---

## Installation

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL (local or managed)
- [Freighter wallet extension](https://freighter.app) installed and set to **Testnet**

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Tanko

# 2. Install all dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 4. Setup database (if using PostgreSQL)
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Runtime environment | Yes |
| `PORT` | Backend port | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `STELLAR_NETWORK` | `testnet` or `public` | Yes |
| `STELLAR_HORIZON_URL` | Stellar Horizon endpoint | Yes |
| `TRUSTLESS_WORK_API_URL` | Trustless Work base URL | Yes |
| `TRUSTLESS_WORK_API_KEY` | Trustless Work API key | Yes |
| `SOROBAN_CONTRACT_ID` | Deployed tanko-registry contract ID | No |
| `TANKO_ADMIN_SECRET` | Admin wallet secret (backend only) | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL for frontend | Yes |

---

## Running the App

### Development

```bash
# Start both frontend and backend
npm run dev

# Or separately
npm run dev:frontend   # Next.js on port 3000
npm run dev:backend    # Express on port 3001
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Backend Health: http://localhost:3001/health

### Playwright smoke tests (E2E)

Configuration and tests live under **`frontend/`** (separate from Vitest unit tests).

```bash
cd frontend
npm install
npx playwright install chromium
```

Run (starts or reuses the Next dev server on port 3000):

```bash
cd frontend
npx playwright test
```

Smoke coverage: `/menu` shell, `/connect` entry, `/dashboard` guard (unauthenticated users end on `/menu`), and `/dashboard` with a documented **`localStorage` wallet stub** (see `frontend/e2e/smoke.spec.ts`) so Freighter is not required headless.

---

## Usage Guide

### 1. Login Flow

1. Open `http://localhost:3000`
2. Click **"Connect with Freighter"**
3. Approve connection in Freighter popup
4. Select your role:
   - **"Soy Conductor"** → Driver dashboard
   - **"Soy Jefe de Flota"** → Fleet manager dashboard

### 2. Fleet Manager (Jefe) Flow

1. **View Dashboard** → Overview with stats, charts, pending requests
2. **Approve/Reject Requests** → Click approve/reject buttons on pending requests
3. **Manage Users** → View drivers in `/dashboard/usuarios`
4. **Manage Fleet** → View vehicles in `/dashboard/unidades`
5. **View Fuel Logs** → Transaction history in `/dashboard/consumos`
6. **View Locations** → Gas stations in `/dashboard/ubicaciones`

### 3. Driver (Conductor) Flow

1. **View Wallet** → Balance, escrow limit, used amount
2. **Request Funds** → Enter liters → Auto-calculate amount → Submit
3. **View History** → Recent fund requests with status

### 4. Switching Roles

- Click **"Ver como [otro rol]"** in the sidebar to switch views
- Each role has restricted access to routes

---

## Backend API Endpoints

All endpoints are prefixed with `/api/v1`.

### Escrow

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/escrow/:id` | Get escrow details |
| `POST` | `/escrow/single/create` | Create single-milestone escrow |
| `POST` | `/escrow/multi/create` | Create multi-milestone escrow |

### Funds

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/funds/request` | Create fund request (driver) |
| `GET` | `/funds/driver/:address` | Get driver's fund requests |
| `GET` | `/funds/manager/:address/pending` | Get pending requests for manager |
| `POST` | `/trustless/solicitud/approve` | Approve fund request |
| `POST` | `/trustless/solicitud/reject` | Reject fund request |

### Stats

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/stats/dashboard` | Dashboard statistics |
| `GET` | `/stats/monthly` | Monthly statistics |
| `GET` | `/stats/consumption-by-driver` | Consumption by driver |
| `GET` | `/stats/top-units` | Top consuming units |
| `GET` | `/stats/recent-transactions` | Recent transactions |
| `GET` | `/driver/:address/stats` | Driver-specific stats |

### Users & Units

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List all users |
| `GET` | `/users/stellar/:address` | Get user by Stellar address |
| `GET` | `/units` | List all units |
| `GET` | `/fuel-logs` | List all fuel logs |
| `GET` | `/config/escrow` | Get escrow configuration |

---

## Smart Contract

### Tanko Registry (Soroban)

The `tanko-registry` contract manages driver and gas station whitelists.

#### Contract Functions

| Function | Description |
|----------|-------------|
| `init(admin)` | Initialize contract with admin address |
| `add_driver(admin, driver)` | Add driver to whitelist |
| `add_station(admin, station)` | Add gas station to whitelist |
| `verify_tx(driver, station)` | Verify both are registered |
| `get_driver_stats(driver)` | Get driver's escrow config |
| `update_driver_limit(admin, driver, limit)` | Update driver's escrow limit |
| `record_usage(admin, driver, amount)` | Record fuel usage |
| `reset_driver_usage(admin, driver)` | Reset driver's usage |

#### DriverConfig Structure

```rust
struct DriverConfig {
    escrow_limit: i128,      // Maximum escrow amount (stroops)
    escrow_used: i128,        // Currently used amount
    escrow_available: i128,   // Available = limit - used
    is_active: bool,         // Driver active status
    registered_at: u64,       // Registration timestamp
}
```

---

## Current Status

### ✅ Completed

- [x] Authentication with wallet (Freighter)
- [x] Role selection (Conductor / Jefe)
- [x] Protected routes by role
- [x] Fleet Manager Dashboard with stats
- [x] Pending requests approval flow
- [x] Driver wallet page
- [x] Fund request creation
- [x] Fuel logs, users, units, locations pages
- [x] Backend API with Prisma
- [x] Escrow services (Trustless Work)
- [x] Soroban contract skeleton
- [x] Database schema
- [x] Playwright smoke E2E (`frontend/`, `npx playwright test`)

### ⚠️ In Progress

- [ ] PostgreSQL database setup
- [ ] Trustless Work API integration testing
- [ ] Soroban contract deployment
- [ ] Soroban service in backend

### ❌ Pending

- [ ] Production environment variables
- [ ] Full E2E coverage beyond Playwright smoke (Freighter-heavy flows, CI wiring)
- [ ] Deployment configuration

---

## CI/CD

A GitHub Actions workflow runs automatically on every **push to `main`** and every **pull request targeting `main`**.

### Pipeline steps (single job: `build-and-test` on `ubuntu-latest`)

| # | Step | Command |
|---|------|---------|
| 1 | Install dependencies | `npm ci` |
| 2 | Generate Prisma client | `npm run db:generate --workspace=backend` |
| 3 | Lint — frontend | `npm run lint --workspace=frontend` |
| 4 | Typecheck — backend | `npm run typecheck --workspace=backend` |
| 5 | Build — frontend | `npm run build --workspace=frontend` |
| 6 | Build — backend | `npm run build --workspace=backend` |
| 7 | Test — frontend | `npm run test:run --workspace=frontend` |
| 8 | Test — backend | `npm run test --workspace=backend` |

> **Note (Issue #5):** The backend uses `tsc --noEmit` as its static analysis gate. `npm run lint --workspace=backend` is omitted until an ESLint config is added to that workspace.

> **Note (Issue #1):** The Prisma generate step includes a fallback (`|| echo "..."`) so CI does not fail while the database branch is not yet merged into `main`.

---

## Demo Notes

- **Database**: Currently requires PostgreSQL connection for full functionality
- **Trustless Work**: API key required for real escrow operations
- **Soroban**: Contract needs to be deployed and contract ID configured
- **Freighter**: Must be set to **Testnet** in extension settings
- **Testnet Funds**: Use [Stellar Laboratory](https://laboratory.stellar.org) to fund testnet accounts

---

## Data Export

Fleet managers (Jefes de Flota) can download a snapshot of all operational data as a ZIP of structured CSV files, ready to import into Microsoft Access for reporting and auditing.

### Endpoint

```
GET /api/v1/exports/access
Authorization: Bearer <JEFE JWT>
```

Optional query parameters:

| Parameter | Format | Description |
|-----------|--------|-------------|
| `from` | `YYYY-MM-DD` | Start date (inclusive) |
| `to` | `YYYY-MM-DD` | End date (inclusive) |

### Response

Returns `tanko-export-<timestamp>.zip` containing:

- `users.csv` — Drivers and fleet managers
- `units.csv` — Fleet vehicles
- `fuel_logs.csv` — Fuel load records
- `fund_requests.csv` — Fund requests and statuses
- `escrow_config.csv` — Escrow configuration

### Access Import

For step-by-step instructions on importing the CSVs into Microsoft Access, see [`backend/docs/access-import-guide.md`](backend/docs/access-import-guide.md).

### Linux / Docker note

The export is always a `.zip` of CSV files (no Windows Access Database Engine required). The system `zip` binary must be present in the container/host — it is available by default on Debian/Ubuntu-based images.

---

## License

MIT - Hack+ Alebrije CDMX 2026
