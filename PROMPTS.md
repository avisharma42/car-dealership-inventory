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
