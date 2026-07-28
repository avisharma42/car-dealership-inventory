# Apex Motors — Car Dealership Inventory System

A full-stack dealership inventory application: JWT-authenticated REST API over PostgreSQL with an
atomic, oversell-proof purchase flow, plus a React + Tailwind single-page storefront with
role-aware admin tooling.

Built test-first — every backend feature landed as a Red-Green-Refactor cycle, which the commit
history narrates (`test:` commit with failing specs, then the `feat:` commit that makes them pass).

## Screenshots

| View | Screenshot |
| --- | --- |
| Login | _(screenshot placeholder — `docs/screenshots/login.png`)_ |
| Register | _(screenshot placeholder — `docs/screenshots/register.png`)_ |
| Dashboard (customer) | _(screenshot placeholder — `docs/screenshots/dashboard-customer.png`)_ |
| Dashboard (admin) | _(screenshot placeholder — `docs/screenshots/dashboard-admin.png`)_ |
| Add / edit vehicle | _(screenshot placeholder — `docs/screenshots/vehicle-form.png`)_ |

## Tech stack

| Layer | Choice |
| --- | --- |
| Backend | Node.js, Express 4, TypeScript |
| Database | PostgreSQL via Sequelize 6 (+ `sequelize-cli` migrations) |
| Auth | `jsonwebtoken` (HS256) + `bcryptjs` |
| Validation | Zod |
| Backend tests | Jest + Supertest against a real Postgres test database |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios |
| Frontend tests | Vitest + React Testing Library |

## Project structure

```
/backend
  /src
    /config       env + Sequelize connection (and the sequelize-cli config)
    /models       User, Vehicle
    /controllers  thin HTTP adapters
    /routes       routers + Zod schemas
    /middleware   requireAuth, requireAdmin, validate, error handler
    /services     business logic (auth, tokens, vehicles)
    /migrations   sequelize-cli migrations
    /scripts      dev seed
  /tests
    /unit         middleware specs
    /integration  Supertest endpoint specs
/frontend
  /src
    /api          axios client + endpoint wrappers
    /components   VehicleCard, SearchBar, VehicleFormModal, Layout, ProtectedRoute
    /context      AuthContext
    /hooks        useAuth, useToast
    /pages        Login, Register, Dashboard
  /tests          React Testing Library specs
README.md
PROMPTS.md
.env.example
```

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally

### 1. Database

```bash
createuser dealership --pwprompt        # password: dealership (or your own)
createdb -O dealership car_dealership_dev
createdb -O dealership car_dealership_test
```

### 2. Backend

```bash
cd backend
cp ../.env.example .env                 # then edit credentials if yours differ
npm install
npm run db:migrate                      # applies the users + vehicles migrations
npm run db:seed                         # optional demo data (see logins below)
npm run dev                             # http://localhost:4000
```

Backend environment variables (see `.env.example`): `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`, `TEST_DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`,
`CLIENT_ORIGIN`.

Seeded logins (password `password123`): `admin@dealership.test` (admin) and
`buyer@dealership.test` (customer).

Tests:

```bash
npm test                                # 65 specs against car_dealership_test
npm run test:coverage
npm run lint
npm run typecheck
```

The test suite rebuilds the schema from the models with `sync({ force: true })` for isolation;
dev and production schemas come exclusively from migrations.

### 3. Frontend

```bash
cd frontend
echo "VITE_API_URL=http://localhost:4000" > .env
npm install
npm run dev                             # http://localhost:5173
npm test                                # 21 React Testing Library specs
npm run build
```

## API documentation

Base URL: `http://localhost:4000/api`. All errors share the shape `{ "error": "message" }`.

| Method | Route | Access | Body / query | Success |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public | `{ name, email, password (min 8) }` | `201 { token, user }` |
| POST | `/auth/login` | Public | `{ email, password }` | `200 { token, user }` |
| POST | `/vehicles` | Authenticated | `{ make, model, category, price, quantity? }` | `201 vehicle` |
| GET | `/vehicles` | Authenticated | — | `200 vehicle[]` |
| GET | `/vehicles/search` | Authenticated | `?make&model&category&minPrice&maxPrice` | `200 vehicle[]` |
| PUT | `/vehicles/:id` | Authenticated | any subset of the create fields | `200 vehicle` |
| DELETE | `/vehicles/:id` | Admin | — | `204` |
| POST | `/vehicles/:id/purchase` | Authenticated | `{ qty? }` (default 1) | `200 vehicle` |
| POST | `/vehicles/:id/restock` | Admin | `{ qty? }` (default 1) | `200 vehicle` |

Status codes: `400` validation, `401` missing/invalid token, `403` non-admin on an admin route,
`404` unknown vehicle, `409` duplicate email or insufficient stock.

`category` is one of `sedan`, `suv`, `truck`, `coupe`, `hatchback`, `van`.

### Concurrency-safe purchase

Purchase runs as a **single conditional UPDATE**:

```sql
UPDATE vehicles SET quantity = quantity - :qty WHERE id = :id AND quantity >= :qty;
```

Postgres takes a row lock for the duration of the statement and re-evaluates `quantity >= :qty`
against the latest committed row, so concurrent buyers serialize on that row and stock can never be
oversold. This was chosen over `SELECT ... FOR UPDATE` inside an explicit transaction because it
needs one round trip and no transaction bookkeeping for the same guarantee; a
`vehicles_quantity_non_negative` CHECK constraint backstops the invariant at the schema level.
Zero rows updated means the vehicle is either missing (`404`) or short on stock (`409`), which a
follow-up lookup disambiguates. The rationale lives in a comment above `purchase()` in
`backend/src/services/vehicle.service.ts`, and an integration spec fires 20 simultaneous purchases
against 5 units and asserts exactly 5 succeed with the remainder returning `409`.

### Token storage choice (frontend)

The JWT lives in React context and is mirrored to `localStorage`, with an axios request
interceptor attaching `Authorization: Bearer …`. **Tradeoff:** `localStorage` survives refreshes and
keeps the SPA usable without a session endpoint, but it is readable by any script on the page, so
an XSS bug leaks the token. The stricter option is an httpOnly, SameSite cookie set by the API —
immune to script access but requiring CSRF protection and a same-site deployment. The context is
the single source of truth and storage is touched in exactly one `useEffect`, so switching to
cookies means changing `AuthContext` only. For a take-home with a separately-hosted API,
`localStorage` was the pragmatic call; production would use the cookie approach.

## Test report

Backend — `npm run test:coverage` (Jest + Supertest, 65 specs, 7 suites, all passing):

```
------------------------|---------|----------|---------|---------|-------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|-------------------
All files               |   97.75 |    90.62 |     100 |   97.26 |
 controllers            |   93.75 |      100 |     100 |    92.3 |
  auth.controller.ts    |     100 |      100 |     100 |     100 |
  vehicle.controller.ts |   91.89 |      100 |     100 |      90 | 9,17,25
 middleware             |     100 |    85.71 |     100 |     100 |
  auth.ts               |     100 |      100 |     100 |     100 |
  errors.ts             |     100 |       75 |     100 |     100 | 30
  validate.ts           |     100 |       75 |     100 |     100 | 15
 services               |   98.76 |    94.44 |     100 |   98.38 |
  auth.service.ts       |     100 |      100 |     100 |     100 |
  token.service.ts      |    90.9 |    66.66 |     100 |   88.88 | 16
  vehicle.service.ts    |     100 |      100 |     100 |     100 |
------------------------|---------|----------|---------|---------|-------------------

Test Suites: 7 passed, 7 total
Tests:       65 passed, 65 total
```

Coverage is collected on `controllers`, `services` and `middleware` and enforced by a Jest
`coverageThreshold` of 85% statements/functions/lines.

Frontend — `npm test` (Vitest + React Testing Library):

```
 ✓ tests/DashboardPage.test.tsx     (7 tests)
 ✓ tests/VehicleFormModal.test.tsx  (4 tests)
 ✓ tests/VehicleCard.test.tsx       (4 tests)
 ✓ tests/LoginPage.test.tsx         (3 tests)
 ✓ tests/SearchBar.test.tsx         (3 tests)

 Test Files  5 passed (5)
      Tests  21 passed (21)
```

What the backend suite covers: registration (success, duplicate email, hash-never-returned, each
validation failure), login (success, case-insensitive email, wrong password, unknown email,
malformed input), JWT middleware (absent, non-Bearer, malformed, forged, expired tokens plus
`req.user` population and `requireAdmin` 403/200), vehicle CRUD (create defaults and validation,
list, update, 404s, admin-only delete), every search filter individually and in combination, and
purchase/restock including the 20-way concurrency test.

## My AI Usage

**Tool used:** Claude (Anthropic) — Claude Sonnet driving an agentic coding session, i.e. the model
edited files, ran `jest`/`vitest`, ran migrations against a local Postgres and made the commits
directly, rather than pasting snippets into an editor.

**How it was used, per area:**

- **Scaffolding:** Claude generated the backend skeleton (TypeScript config, Express app factory,
  Sequelize connection, `sequelize-cli` wiring) and the Vite/Tailwind frontend shell. I replaced the
  Vite template's bleeding-edge dependency versions with pinned stable ones and chose the design
  tokens (brand palette, Inter, component classes in `index.css`).
- **Auth:** Claude wrote the failing Supertest specs for register and login first, then the bcrypt
  hashing and JWT issuing to satisfy them. I tightened two behaviours by hand: making login return
  an identical 401 for unknown email and wrong password (no user enumeration), and moving the
  `passwordHash` strip into `User.toJSON()` so no future endpoint can leak it by accident.
- **Vehicles and search:** Claude generated the CRUD tests and the incremental Sequelize `where`
  builder for the search filters. I specified case-insensitive partial matching (`iLike`) on make
  and model rather than exact equality, since that is what a dealership search bar should do.
- **Concurrency:** the interesting one. Claude's first instinct was a read-modify-write inside a
  transaction, which is the intuitive shape but oversells under load. I pushed for the single
  conditional `UPDATE ... WHERE quantity >= qty`, and had Claude write the 20-simultaneous-request
  test that actually proves it, plus the CHECK constraint as a schema-level backstop.
- **Frontend:** Claude produced the components, the auth context and the React Testing Library
  specs. I made the product decisions — greyed-out "Out of Stock" button, the admin-only controls,
  toast behaviour on a rejected purchase, and the localStorage-vs-cookie token tradeoff documented
  above.
- **Docs:** Claude drafted this README and maintained `PROMPTS.md`; I edited the reflection and the
  AI-usage claims so they describe what actually happened.

**Reflection.** The clearest win was on the mechanical surface area: migrations, Zod schemas, axios
wrappers, and especially the long-tail test cases. Writing thirty-odd assertions for validation
failures and token edge cases is exactly the work that gets skipped under time pressure, and having
it generated in seconds meant the Red step was genuinely thorough instead of token. TDD also turned
out to be an unusually good fit for AI-assisted work: the failing test is an executable
specification, so "make this pass" is a tight, verifiable instruction and the suite catches the
model's mistakes immediately — a stray `await` inside a `setState` callback, for instance, was
caught by the dashboard test rather than by a user.

Where it needed steering was judgement, not syntax. The concurrency design is the sharpest example:
the generated code passed a naive test and was still wrong under real load, and knowing to ask for
the conditional-UPDATE pattern (and to demand a test that could actually fail) came from
understanding database semantics, not from the tool. The same applies to security posture
(non-enumerable login errors, stripping the hash at the model layer) and product decisions
(disabled purchase affordance, what belongs behind an admin check). The other tradeoff is
plausibility bias — AI output reads finished, so the temptation is to skim. I mitigated that by
never accepting an implementation before seeing its test fail first, which is the discipline that
made the speed-up safe rather than risky.

## Deployment

Not currently deployed. The backend is a standard Node service (`npm run build && npm start`) and
the frontend builds to static assets (`npm run build`), so Render/Railway for the API plus Vercel
for the SPA would work with `DATABASE` env vars and `VITE_API_URL` pointed at the deployed API.
