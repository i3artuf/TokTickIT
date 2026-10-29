# TokTickIT — IT Service Desk Application

TokTickIT is an enterprise full-stack IT Service Desk web application for IT support request workflows (Account & Access, Hardware, Software, Network), developed incrementally across **Labs 01–04** as part of **CPE334 Software Engineering** at KMUTT.

| Lab | Focus |
|:----|:------|
| **Lab 01** | Project foundation, health-check API, category seed & list |
| **Lab 02** | Requester ticket lifecycle, file attachments, responsive UI |
| **Lab 03** | JWT/HttpOnly-cookie auth, RBAC, Staff queue, Admin user management |
| **Lab 04** | Actions Taken auditing, 8-state ticket workflow with OCC, role-based dashboards, Zen Green design hardening |

$$\text{React 18 (Vite + TS)} \longleftrightarrow \text{Express REST API (RBAC + OCC + Auditing)} \longleftrightarrow \text{Prisma ORM} \longleftrightarrow \text{PostgreSQL}$$

---

## 🏗️ Architecture & Tech Stack

- **Frontend (`client/`)**:
  - React 18, TypeScript, Vite, `react-router-dom` v7
  - Bootstrap 5 & Bootstrap Icons, Zen Green CSS Variables design system
  - Responsive layouts (Desktop ≥ 1280px, Tablet 768–1024px, Mobile 375px)
  - Components: `ActionsTaken` panel & timeline, `TicketWorkflow` transition & resolution modal, `StaffDashboard`, `RequesterDashboard`, `MetricCard`
- **Backend (`server/`)**:
  - Node.js, Express, TypeScript
  - Prisma ORM v7 (`@prisma/adapter-pg`), PostgreSQL
  - Security & Governance: `bcryptjs` password hashing, `jsonwebtoken` (HttpOnly cookies + Bearer token session auth), RBAC middlewares (`requireAuth`, `requireRole`, `gatePasswordChange`)
  - Concurrency & Reliability: atomic timestamp checks on canonical Ticket status and Action edits (`expectedUpdatedAt` / `STALE_UPDATE`), client-supplied `Idempotency-Key` headers with a 5-second database-backed deduplication fallback serialized by a parent-Ticket transaction lock (BR-17)
  - Storage: Multer with UUID-based local file storage for ticket attachments
- **Testing & Quality Assurance**:
  - Unit & Integration: Vitest, React Testing Library, Supertest. Comprehensive test suites and execution logs are recorded in [docs/lab-04/tests.md](docs/lab-04/tests.md).
  - End-to-End & Responsive: Playwright (`e2e/lab-04/`) across 3 viewports (Desktop 1280px, Tablet 820px, Mobile 375px)
  - Visual Evidence: Automated screenshot capture suite (`artifacts/lab-04/screenshots/`)

---

## 📁 Directory Structure

```text
toktickit/
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── api/                     # Type-safe API clients (auth, tickets, staff, admin, dashboard, actions)
│   │   ├── components/              # Reusable UI (AuthGuard, Badges, ActionsTaken, TicketWorkflow, etc.)
│   │   │   └── dashboard/           # DashboardShared, MetricCard, RecentTicketsPanel, useDashboardResource
│   │   ├── context/                 # AuthContext & RequesterContext
│   │   ├── pages/                   # Application screens (Login, StaffQueue, RequesterDashboard, StaffDashboard, etc.)
│   │   └── tests/                   # Client Vitest suites (lab-02 through lab-04)
│   └── package.json
├── server/                          # Express + Prisma Backend REST API
│   ├── prisma/
│   │   ├── schema.prisma            # PostgreSQL schema (User, Ticket, ActionTaken, Comments, Notes)
│   │   ├── migrations/              # Prisma migration history
│   │   └── seed.ts                  # Idempotent database seeder (11 users, 16 tickets, actions taken fixtures)
│   ├── src/
│   │   ├── controllers/             # Request handlers (auth, tickets, staff, admin, dashboard, actions)
│   │   ├── middleware/              # Auth parsing, RBAC guards, password change gating
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # Business logic & Prisma queries (dashboard, actions, tickets)
│   │   └── validators/              # Input, transition matrix, and actions-taken validators
│   ├── storage/attachments/         # Local attachment storage — not committed (see .gitignore)
│   └── tests/                       # Server Vitest suites (lab-01 through lab-04)
├── e2e/                             # Playwright E2E suites
│   ├── lab-02/                      # Requester workflow regression
│   ├── lab-03/                      # Authentication, staff queue, and user administration regression
│   └── lab-04/                      # Actions Taken, dashboards, ticket resolution, and screenshot specs
├── docs/                            # Engineering specifications & documentation
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/                      # specification.md, api-spec.md, ui-spec.md, tests.md, reviewer.md, ai-use.md
├── artifacts/                       # Generated test evidence (screenshots, audit reports)
│   ├── lab-02/screenshots/
│   ├── lab-03/screenshots/
│   └── lab-04/
│       └── screenshots/             # Multi-viewport screenshot evidence (desktop, tablet, mobile)
├── scripts/                         # Utility scripts (build_submission_docs.py, etc.)
├── playwright.config.ts
└── README.md
```

---

## 🌿 Branch Strategy

| Branch pattern | Purpose |
|:---------------|:--------|
| `main` | Production-stable; merges from `labN-staging` after grading |
| `lab{N}-staging` | Lab integration branch — all lab N features merge here before `main` |
| `feature/{issue#}-lab{N}-{short-name}` | Individual feature / task branches (TDD: failing tests committed first) |
| `docs/lab{N}` | Documentation-only changes (specs, reviewer logs, README updates) |
| `chore/...` | Housekeeping — dependency bumps, repo hygiene, gitignore, CI tweaks |

> **Current branch:** `docs/lab4` — renamed to `chore/lab4-repo-hygiene` for this README & `.gitignore` cleanup (see branch rename suggestion below).

---

## 👥 Seed Baseline Accounts & Credentials

All seeded accounts share the local development default password:
- **Default Password:** `DevPass@2026!` *(meets BR-07: ≥8 chars, uppercase, lowercase, number, special char)*

| Role | Name | Email | Initial Status | First-Time Password Change |
| :--- | :--- | :--- | :--- | :--- |
| **`ADMINISTRATOR`** | Alex Morgan | `alex.morgan@example.com` | Active | Required (`mustChangePassword=true`) |
| **`IT_STAFF`** | Samira Chen | `samira.chen@example.com` | Active | Not required (`mustChangePassword=false`) |
| **`IT_STAFF`** | Marcus Vance | `marcus.vance@example.com` | Active | Required (`mustChangePassword=true`) |
| **`IT_STAFF`** | Liam O'Connor | `liam.oconnor@example.com` | Active | Required (`mustChangePassword=true`) |
| **`IT_STAFF`** | Dana Scully | `dana.scully@example.com` | Inactive | — |
| **`REQUESTER`** | Alice Tanaka | `alice.tanaka@example.com` | Active | Required (`mustChangePassword=true`) |
| **`REQUESTER`** | Bob Chavez | `bob.chavez@example.com` | Active | Required (`mustChangePassword=true`) |
| **`REQUESTER`** | Eve Former | `eve.former@example.com` | Inactive | — |

---

## 🌐 Application Pages & Routes

| URL Route | Allowed Roles | Description |
| :--- | :--- | :--- |
| `/login` | Public | Sign in with email and password |
| `/change-password` | Authenticated | Mandatory password change screen (enforced on first-time login) |
| `/dashboard` | Authenticated | Role-aware dashboard (renders `RequesterDashboard` or `StaffDashboard`) |
| `/create-ticket` | `REQUESTER` | Create support ticket with category, priority, attachments |
| `/my-tickets` | `REQUESTER` | Requester ticket history, status pills, search & filtering (supports `?status=...`) |
| `/tickets/:id` | `REQUESTER` | Ticket details, public comments, attachments, Actions Taken (read-only), advisory looks-resolved toggle |
| `/staff/queue` | `IT_STAFF`, `ADMIN` | Staff triage queue (search, status/priority filters, claim case, supports pre-filters `?status=...&owner=me`) |
| `/staff/tickets/:id` | `IT_STAFF`, `ADMIN` | Staff ticket operations (status transitions with confirmation dialogs, Actions Taken CRUD, internal notes) |
| `/admin/users` | `ADMINISTRATOR` | User administration (CRUD users, password resets, active/inactive filters) |

---

## 🚀 Key API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate credentials, set HttpOnly session cookie, return user payload
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Current session rehydration
- `POST /api/auth/change-password` — Change password with complexity validation

### Role Dashboards (`/api/dashboard`) *(Lab 04)*
- `GET /api/dashboard/requester` — Summary metrics for authenticated Requester (`open`, `inProgress`, `resolved`, `closed` mutually exclusive per BR-11) + 5 recent tickets (BR-13)
- `GET /api/dashboard/staff` — Summary metrics for IT Staff/Admin (`new`, `open` including `Reopened` per BR-12, `inProgress`, `waitingForRequester`, and overlapping `myAssigned`) + 5 recent tickets

### Actions Taken (`/api/tickets/:ticketId/actions`) *(Lab 04)*
- `GET /api/tickets/:ticketId/actions` — List audit history for a ticket (read-only for Requester owner; full access for IT Staff/Admin)
- `POST /api/tickets/:ticketId/actions` — Create action taken (requires `Idempotency-Key` header, enforces 5s deduplication fallback, rejects if ticket is `Cancelled`)
- `PATCH /api/tickets/:ticketId/actions/:actionId` — Update action taken (enforces 15-minute edit window for creator per BR-10; Administrator bypass; checks `expectedUpdatedAt` for OCC)

### Ticket Workflow & Lifecycle (`/api/tickets/:id`) *(Lab 04)*
- `PATCH /api/tickets/:id/status` — Transition ticket status per §5.1 state matrix (enforces BR-06/07 role, transition, and non-empty summary gate; requires `expectedUpdatedAt`; atomically rejects stale writes with `409 STALE_UPDATE`)
- `PATCH /api/tickets/:id/appears-resolved` — Requester advisory toggle (does not alter ticket status; automatically resets to `false` on reopen or edit per BR-16)

### Requester Operations (`/api/tickets`, `/api/attachments`)
- `POST /api/tickets` — Create new ticket (auto-assigns sequence `TK-YYYYMMDD-NNNN`)
- `GET /api/tickets` — List authenticated user's tickets (search, status, priority, sort)
- `GET /api/tickets/:id` — Retrieve ticket details (cross-requester access blocked with `403`)
- `POST /api/tickets/:id/attachments` — Upload attachment (max 5 MB, allowed MIME types)
- `PATCH /api/attachments/:id/remove` — Soft-remove attachment with non-empty reason

### Staff Operations (`/api/staff/tickets`)
- `GET /api/staff/tickets` — IT staff queue with combined filters and triage views
- `GET /api/staff/tickets/:id` — Full ticket view with public comments and internal notes
- `PATCH /api/staff/tickets/:id/claim` — Claim unassigned ticket (`NEW` → `OPEN`, returns fresh `updatedAt`)
- `PATCH /api/staff/tickets/:id/assign` — Assign or reassign ticket to an IT Staff member (returns fresh `updatedAt`)
- `PATCH /api/staff/tickets/:id/it-priority` — Triage IT priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, returns fresh `updatedAt`)
- `POST /api/staff/tickets/:id/notes` — Post confidential internal note (strictly isolated from Requesters)
- `POST /api/staff/tickets/:id/comments` — Post staff comment visible to Requester

### Admin User Management (`/api/admin/users`)
- `GET /api/admin/users` — List users with substring search, role filter, and `isActive` status filter
- `POST /api/admin/users` — Provision new user with random/temp password and `mustChangePassword=true`
- `PATCH /api/admin/users/:id` — Edit user name, role, and active status (enforces safety invariants)
- `POST /api/admin/users/:id/reset-password` — Reset user password (forces change on next login)

---

## ⚙️ Setup & Running Instructions

### 1. Prerequisites
- **Node.js** v22+ (the audited build used v22.16.0; consult `server/node_modules/prisma/package.json` engines field for an installed checkout)
- **PostgreSQL** database server running locally

---

### 2. Backend Setup (`server/`)

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables in `server/.env`:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit?schema=public"
   PORT=5000
   JWT_SECRET="your-super-secret-jwt-key"
   NODE_ENV="development"
   ```

3. Run migrations and seed baseline data:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. Start development API server (runs on `http://localhost:5000`):
   ```bash
   npm run dev
   ```

---

### 3. Frontend Setup (`client/`)

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start development Vite server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## 🧪 Running Automated Tests

### Server Tests (Unit, Integration, Workflow & Performance Smoke)
```bash
cd server
npm test
```
*Runs all server suites across labs: transition matrices, Actions validation, dashboard metrics, authorization, migration, seed idempotency, and performance smoke checks.*

### Client Tests (Components, Context, Dashboards & Transitions)
```bash
cd client
npm test
```
*Runs client suites covering dashboards, Actions, TicketWorkflow, earlier screens, badges, and auth guards.*

### End-to-End Tests (Playwright)
Playwright tests verify complete workflows across **Desktop (1280px)**, **Tablet (820px)**, and **Mobile (Pixel 5 / 375px)**:

```bash
# Run all Lab 4 E2E test suites (auto-starts client & server)
npx playwright test e2e/lab-04

# Run specific Lab 4 test suites
npx playwright test e2e/lab-04/dashboards.spec.ts           # Responsive reflow and a11y focus rings
npx playwright test e2e/lab-04/actions-taken-flow.spec.ts   # Actions Taken creation, validation, deduplication
npx playwright test e2e/lab-04/ticket-resolution.spec.ts    # Status transitions, OCC conflict banners, resolution gate
npx playwright test e2e/lab-04/screenshots.lab4.spec.ts     # Multi-viewport screenshot generation

# Run regression tests for earlier labs
npx playwright test e2e/lab-02
npx playwright test e2e/lab-03

# Interactive UI mode
npx playwright test --ui
```

---

## 🛡️ Security, Concurrency & Governance Invariants

- **Optimistic Concurrency Control (OCC / BR-14)**: Ticket and Action Taken updates require `expectedUpdatedAt`. Stale tokens trigger `409 STALE_UPDATE`. The client distinguishes external conflicts (warning banner) from self-retry duplicates (silent sync) per §10.1 and AC-16.
- **Idempotency & Deduplication (BR-17, FR-15)**: `POST /actions` mandates an `Idempotency-Key` header with automatic replay return, supplemented by a 5-second fallback deduplication window.
- **Resolution Gate (BR-06, BR-07)**: Resolved/Closed require an authorized, permitted transition with a non-empty `resolutionSummary`, as defined in the approved contract.
- **Action Edit Time-Window (BR-10)**: Creators may edit an Action Taken only within 15 minutes of creation. Administrators retain permanent edit privilege.
- **Session Hardening & Isolation**: Sessions use `HttpOnly`, `SameSite=Lax` cookies. Internal notes are strictly isolated from Requesters (`403 FORBIDDEN` with zero leakage).
- **Administrative Safety Invariants**: Self-deactivation and demotion/deactivation of the last remaining active Administrator are strictly blocked.
- **Text Rendering**: React renders user text with escaping. Do not treat this as evidence of a universal input-sanitization pipeline.
