# TutorDoor

**A production-grade tutoring marketplace** — verified tutors, real-time booking with availability windows, live classes (Jitsi), group courses, payments (Razorpay + Stripe), wallets & payouts, reviews, chat, and five role-based portals (Student · Tutor · Parent · Institute · Admin).

Built with Django REST Framework + PostgreSQL + Redis/Celery/Channels on the backend and React + TypeScript + Tailwind (Vite) on the frontend, shipped as Docker services behind nginx.

> Design identity: the UI is built around *the tools of tutoring* — chalkboard greens, notebook paper, and a hand-drawn red-pen circle as the signature motif. Rationale in [`frontend/src/styles/DESIGN.md`](frontend/src/styles/DESIGN.md).

---

## Quickstart (Docker, ~5 minutes)

```bash
# 1. Environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Build & start everything (postgres, redis, gunicorn API, daphne websockets,
#    celery worker + beat, vite dev server, nginx)
docker compose up --build -d

# 3. Migrations run automatically on backend start. Seed the demo world:
docker compose exec backend python manage.py seed_demo
```

Then open **http://localhost** (nginx) — or hit services directly: API `:8000`, websockets `:8001`, Vite `:5173`.

### Demo accounts (password for all: `Demo@12345`)

| Role                | Email                          | What to try                                          |
| ------------------- | ------------------------------ | ---------------------------------------------------- |
| Admin               | `admin@tutordoor.test`         | Verification queue, reports with 30-day charts       |
| Tutor (verified)    | `ananya.tutor@tutordoor.test`  | Availability editor, bookings, earnings ledger, chat |
| Tutor (pending)     | `kabir.tutor@tutordoor.test`   | The verification upload flow                         |
| Student             | `aarav.student@tutordoor.test` | Pay the pending booking (coupon `WELCOME10`), chat   |
| Student (enrolled)  | `diya.student@tutordoor.test`  | Active paid course with progress                     |
| Parent              | `sunita.parent@tutordoor.test` | Linked child's bookings, progress, payments          |
| Institute           | `contact@brightminds.test`     | Tutor roster (marketplace invite), student roll      |

Interactive API docs: **http://localhost:8000/api/docs/** (Swagger) · `/api/redoc/` · raw schema at `/api/schema/`.

---

## Architecture

```
                        ┌────────────────────────────┐
   Browser ──────────►  │        nginx  :80          │
                        └──────┬──────────┬──────────┘
             /api/ /admin/     │          │ /ws/              /
                   ┌───────────▼──┐   ┌───▼────────────┐   ┌──▼──────────┐
                   │ gunicorn     │   │ daphne (ASGI)  │   │ Vite dev    │
                   │ Django WSGI  │   │ Channels chat  │   │ React SPA   │
                   │ :8000        │   │ :8001          │   │ :5173       │
                   └───┬──────┬───┘   └───┬────────────┘   └─────────────┘
                       │      │           │
                ┌──────▼─┐  ┌─▼───────────▼─┐     ┌──────────────────────┐
                │Postgres│  │    Redis      │◄────┤ celery worker + beat │
                │  :5432 │  │ cache·broker  │     │ reminders, expiry,   │
                └────────┘  │ channel layer │     │ daily metric snapshots│
                            └───────────────┘     └──────────────────────┘
```

- **Two app servers on purpose**: gunicorn (WSGI) serves REST/admin; daphne (ASGI) serves `/ws/chat/...` websockets — Channels can't run under WSGI. Websockets authenticate with the access JWT in a `?token=` query param.
- **Payments**: server-side amount resolution only. Razorpay completes without webhooks (client signature → server confirm); Stripe finalizes via webhook with client-side polling as UX glue.
- **Money integrity**: one wallet per user, balance mutated only through `WalletService` writing immutable `WalletTransaction` ledger rows (`balance_after` on every row). Tutor payouts = price − platform commission (subscription can discount it).
- **Double-booking safety**: a PostgreSQL `ExclusionConstraint` (btree_gist over a time range) makes overlapping confirmed bookings for one tutor impossible at the database level.

## Repository layout

```
backend/            Django project — 12 apps under apps/ (users, tutors, students,
                    parents, institutes, bookings, courses, payments, notifications,
                    chat, reviews, analytics), each: models · repositories ·
                    services · serializers · views · tests
frontend/           React+TS (Vite). src/features/<domain>/ per feature; shared UI
                    in src/components; design tokens in tailwind.config.ts
infra/              nginx reverse-proxy config, postgres init.sql
.github/workflows/  CI (flake8+pytest w/ live PG+Redis; eslint+vitest+tsc build),
                    tagged image publishing to GHCR
docs/               INSTALLATION · DEPLOYMENT · KNOWN_LIMITATIONS
```

## Testing & quality

```bash
# Backend — pytest + factory-boy, coverage on apps/
docker compose exec backend pytest

# Frontend — vitest + Testing Library; `build` also runs the full tsc type-check
cd frontend && npm run test && npm run build
```

CI runs all of the above on every push/PR to `main` (see `.github/workflows/ci.yml`).

## Documentation

- [Installation (Docker & bare-metal)](docs/INSTALLATION.md)
- [Production deployment](docs/DEPLOYMENT.md)
- [Known limitations & honest caveats](docs/KNOWN_LIMITATIONS.md)

### Master data & RBAC (enterprise)

- `GET /api/v1/master-data/bootstrap/?types=a,b,c` — active vocabulary items for the frontend's option lists (public)
- `GET /api/v1/master-data/<type_code>/` — one vocabulary's active items (public)
- `/api/v1/master-data/admin/…` — types, item CRUD + activate/deactivate, CSV `items/import|export`, `audit/` (admin)
- `GET /api/v1/rbac/my-permissions/` — caller's roles + permission codenames (authenticated)
- `/api/v1/rbac/admin/…` — permission catalog, role CRUD, user role assignments (permission-gated)

Vocabulary lives in the database (`/admin/master-data` in the app); state machines stay in code — see `docs/adr/ADR-001-master-data-and-rbac.md`.
