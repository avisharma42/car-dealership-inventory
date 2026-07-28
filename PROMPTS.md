# PROMPTS.md

A chronological log of every prompt given to the AI assistant while building this project, plus a
short note on what the assistant produced in response.

## Prompt 1

"## ROLE

You are a senior full-stack engineer helping me build a **Car Dealership Inventory System** as a
take-home assignment for a job interview. You must follow **strict Test-Driven Development (TDD)**
with a visible Red-Green-Refactor pattern, write clean SOLID code, and structure Git commits with
AI co-authorship trailers exactly as specified below. Work incrementally, feature by feature —
do not dump the whole app in one shot. After each feature, stop and show me the failing test (Red),
the passing implementation (Green), and any refactor.

[Full spec followed: fixed tech stack (Node/Express/TypeScript, Postgres + Sequelize, JWT + bcrypt,
Jest + Supertest, React/Vite/Tailwind); normalized `users` and `vehicles` schema with migrations and
an atomic, never-negative purchase decrement; auth requirements; the nine required API endpoints;
the Red-Green-Refactor workflow with >85% coverage on controllers/services; the conventional-commit
+ `Co-authored-by: Claude` trailer convention; frontend requirements; project structure; README
requirements including a 'My AI Usage' section; this PROMPTS.md; and the step order to proceed in.]"

**Result:** Confirmed the plan. Scaffolded the monorepo (`/backend`, `/frontend`, `.env.example`,
`.gitignore`), provisioned local Postgres dev/test databases, set up the TypeScript + Express +
Sequelize backend with `sequelize-cli` migrations for `users` and `vehicles`, Jest/Supertest wiring
against a real Postgres test database, and shared error/validation middleware. Then ran the first
Red-Green-Refactor cycle for `POST /api/auth/register` (7 failing tests first, then the bcrypt
hashing + JWT issuing implementation to make them pass).

---

## Prompt 2

"New GitHub repo (tell me the name) — I'll push and open PRs"

**Result:** Answered the "where should the code live" question. The assistant's GitHub token could
not create a repository, so it asked the human to create an empty
`avisharma42/car-dealership-inventory` and continued building locally in the meantime.

---

## Prompt 3

"https://github.com/avisharma42/car-dealership-inventory i have pushed the repository"

**Result:** Added the remote, rebased the local commits onto the repo's initial commit, pushed the
work to a feature branch, and continued with the remaining backend cycles. Delivered, in order:

- **Cycle 2 — login + JWT middleware.** Red: 5 login specs plus 8 middleware specs (missing,
  non-Bearer, malformed, forged and expired tokens; `req.user` population; `requireAdmin` 403/200).
  Green: `login()` comparing the bcrypt hash and returning an identical 401 for unknown email and
  wrong password, plus `requireAuth`/`requireAdmin`. 20/20 passing.
- **Cycle 3 — vehicle CRUD.** Red: 15 specs for create/list/update/delete including admin-only
  delete. Green: vehicle service, thin controller and a router that applies `requireAuth` to all
  vehicle routes with `requireAdmin` layered onto delete. 35/35 passing.
- **Cycle 4 — search.** Red: 11 specs, one per filter plus a combined query and 400 cases. Green:
  an incrementally-built Sequelize `where` clause with case-insensitive partial `iLike` matching on
  make and model. 46/46 passing.
- **Cycle 5 — purchase and restock.** Red: 15 specs including a 20-simultaneous-request concurrency
  spec against 5 units. Green: purchase implemented as a single conditional
  `UPDATE ... WHERE quantity >= qty` so Postgres row locking prevents overselling, with the
  rationale documented in a code comment. 61/61 passing.
- **Refactor.** Error-handler unit specs lifting coverage to 97.75% statements / 90.62% branches
  across controllers, services and middleware (65 specs total).
- **Frontend.** React 18 + Vite + Tailwind SPA: auth context syncing the axios Authorization
  header, login/register pages with client-side validation, dashboard with search bar, purchase
  buttons that disable and read "Out of Stock" at zero quantity, and admin-only add/edit/delete/
  restock controls. 21 React Testing Library specs passing.
- **Docs.** README with setup, API table, concurrency explanation, token-storage tradeoff, the
  coverage report and the "My AI Usage" section; this PROMPTS.md.

---
