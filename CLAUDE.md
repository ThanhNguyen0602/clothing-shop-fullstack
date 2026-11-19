# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full-stack clothing e-commerce course project (Vietnamese UI and messages). Monorepo: `backend/` (Express 5, CommonJS, MySQL 8 via `mysql2/promise`) and `frontend/` (React 19 + Vite, React Router 7, Axios, Bootstrap 5 / React-Bootstrap). Each has its own `package.json` and `node_modules`.

## Commands

```bash
# Install (root has only `concurrently`)
npm install && npm install --prefix backend && npm install --prefix frontend

# Run both apps from the repo root (backend :3000, frontend :5173)
npm run dev            # or dev:backend / dev:frontend

# Frontend
npm run build --prefix frontend
npm run lint --prefix frontend      # oxlint (config: frontend/.oxlintrc.json)

# Database (run inside backend/)
#   1. Execute backend/database/schema.sql in MySQL (creates clothing_shop_db, 23 tables)
npm run migrate        # idempotent; adds product_variants etc. (backend/src/seeders/migrate.js)
npm run seed && npm run verify:seed
npm run seed:catalog && npm run seed:search && npm run seed:checkout && npm run seed:payment
npm run seed:clothing && npm run seed:variants   # variants need migrate first
npm run cleanup:non-fashion [-- --yes]           # dry run unless --yes
npm run images:samples
```

There is no automated test suite. API behaviour is checked with the Postman collections in `docs/postman/` (one per course session, "Buoi"), and results are recorded by hand in `docs/test-results.md`. `bash check-progress.sh` is a read-only checklist script for the course milestones.

Env: copy `backend/.env.example` and `frontend/.env.example`. `JWT_SECRET` must be ≥32 bytes or `requireAuth` errors. `ENABLE_MOCK_PAYMENT=true` enables the simulated payment flow (always disabled when `NODE_ENV=production`; seeders also refuse to run in production). Sample accounts (password `Demo@123`): `customer01@example.com`, `manager01@example.com`, `admin01@example.com`.

## Backend architecture

Layering for every module: **Router → Controller → Service → Model → MySQL**.

- **Routes** (`src/routes/`) attach `requireAuth` (Bearer JWT, HS256, re-loads the user from DB and rejects non-`ACTIVE` accounts) and `authorize(...roles)` (roles: `CUSTOMER`, `MANAGER`, `ADMIN`), and wrap handlers in `asyncRoute` from `utils/catalogHelpers.js` so rejected promises reach the error handler.
- **Controllers** only parse the request and respond with `{ success: true, data }`.
- **Services** hold business rules and validation (`utils/*Validation.js`). To return a 4xx, throw via `fail(statusCode, message)` from `utils/catalogHelpers.js`; `middlewares/errorHandler.js` turns any error with a 4xx `statusCode` into `{ success: false, message }`, and also maps MySQL errors (duplicate entry → 409, FK violations, deadlock/lock timeout → 503) and Multer errors.
- **Models** contain parameterized SQL only. Model functions that take part in a transaction accept a `db` connection as their first argument (e.g. `lockShipping(db, id)` using `SELECT … FOR UPDATE`); plain reads use the shared `pool`.
- **Transactions**: `utils/withTransaction.js` wraps work in begin/commit/rollback on a pooled connection. Checkout (stock deduction), order cancellation/stock restore, and payment use it with row locks; money calculations live in `utils/orderMoney.js`.
- `app.js` mounts everything under `/api/*`. Note that `/api/management` is mounted twice (`managementRoutes` and `orderWorkflowRoutes`) and `purchaseActionRoutes` is mounted at `/api`. Static files: `/uploads` (Multer product images in `backend/uploads/products`, gitignored, server-generated filenames, max 5 MB JPG/PNG/WEBP) and `/samples` (seed SVGs in `backend/public/samples`).
- Schema source of truth: `backend/database/schema.sql` plus `migrate.js` steps (each step checks `information_schema` first, so it is safe to re-run). See `docs/database-design.md` and `docs/api-documentation.md`.

## Frontend architecture

- `services/api.js`: shared Axios instance (`VITE_API_URL`) whose interceptor adds the token from `sessionStorage` key `greenshop.accessToken`. `apiError()` turns errors into user-facing Vietnamese messages. Domain calls go in `services/*Service.js`.
- Auth: `contexts/AuthProvider.jsx` restores the session on load via `getMe` and signs out on 401/403. `useAuth` comes from `contexts/AuthContext.js`. The storage key is duplicated in `api.js` and `AuthProvider.jsx`, so keep both in sync.
- Routing (`routes/AppRoutes.jsx`): `GuestOnly` for login/register; `RequireAuth roles={[…]}` guards customer pages (cart/checkout/orders), `/manager/*` (MANAGER+ADMIN, `ManagerLayout`), and `/admin/*` (ADMIN, `AdminLayout`). After login, `GuestOnly` redirects by role, and customers return only to an allow-listed `returnTo` path.
- Data fetching uses `hooks/useRequest.js` (AbortController + retry `attempt` counter); follow that pattern rather than adding a data library.
- UI theme ("TV Studio") uses `tv-*` CSS classes in `styles/`.

## Conventions

- Arrow functions only; CommonJS (`require`/`module.exports`) in the backend, ES modules in the frontend.
- API responses are always `{ success: true, data }` or `{ success: false, message }`, with messages in Vietnamese.
- Commit prefixes: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`. Feature branches are `feature/*` off `develop`, merged by Pull Request.
- Update the session status table in `README.md` and `docs/api-documentation.md` when adding features or endpoints.
