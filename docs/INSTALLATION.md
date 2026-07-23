# Installation

Two supported paths: **Docker (recommended)** — everything in one command — or **bare-metal** for developers who want the processes under their hands.

---

## 1. Docker (recommended)

### Prerequisites
- Docker Engine 24+ with the compose plugin

### Steps

```bash
git clone <repo-url> tutordoor && cd tutordoor

cp backend/.env.example backend/.env      # defaults work out of the box for local dev
cp frontend/.env.example frontend/.env

docker compose up --build -d
```

What comes up:

| Service        | Purpose                                   | Port  |
| -------------- | ----------------------------------------- | ----- |
| `postgres`     | PostgreSQL 16 (btree_gist via migration)  | 5432  |
| `redis`        | Cache · Celery broker · channel layer     | 6379  |
| `backend`      | gunicorn (Django WSGI) — REST + admin     | 8000  |
| `backend_asgi` | daphne (ASGI) — `/ws/` websockets         | 8001  |
| `celery_worker`| Async tasks (emails, notifications)       | —     |
| `celery_beat`  | Schedules (reminders, expiry, snapshots)  | —     |
| `frontend`     | Vite dev server (hot reload)              | 5173  |
| `nginx`        | Single entry point routing all the above  | 80    |

The backend container runs `wait_for_db` → `migrate` → `collectstatic` automatically on start.

### Seed the demo world

```bash
docker compose exec backend python manage.py seed_demo
```

Idempotent — safe to re-run; it tops up missing pieces without duplicating. Prints a credentials table (all demo accounts use `Demo@12345`).

### Verify

- App: http://localhost
- Swagger: http://localhost:8000/api/docs/ (ReDoc at `/api/redoc/`)
- Django admin: http://localhost:8000/admin/ (`admin@tutordoor.test`)
- Websocket smoke test: log in as `aarav.student@tutordoor.test`, open Messages — the header dot turns green when the socket connects.

### Everyday commands

```bash
docker compose logs -f backend            # follow API logs
docker compose exec backend pytest        # backend tests (uses the running PG)
docker compose exec backend python manage.py createsuperuser
docker compose down                       # stop (add -v to also drop data)
```

---

## 2. Bare-metal

### Prerequisites
- Python 3.12+ · Node 20+ · PostgreSQL 16 · Redis 7

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env
```

Create the database and enable the extension Django's migration expects to be able to create (it's created automatically when the DB user has sufficient rights; otherwise pre-create it):

```sql
CREATE DATABASE tutordoor;
CREATE USER tutordoor WITH PASSWORD 'tutordoor';
GRANT ALL PRIVILEGES ON DATABASE tutordoor TO tutordoor;
-- inside the tutordoor database, as a superuser:
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Then:

```bash
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000            # REST + admin (WSGI dev server)
```

**Websockets need an ASGI server in a second terminal** — chat will not connect through `runserver`'s WSGI process in this setup:

```bash
daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

**Celery** (third terminal; optional for pure API work since dev settings run tasks eagerly, required for scheduled jobs):

```bash
celery -A config worker -l info
celery -A config beat -l info
```

### Frontend

```bash
cd frontend
npm install        # generates package-lock.json — commit it, then prefer `npm ci`
npm run dev        # http://localhost:5173
```

`frontend/.env` points at the backend: `VITE_API_BASE_URL=http://localhost:8000/api/v1` and `VITE_WS_BASE_URL=ws://localhost:8001` (note the ASGI port when running bare-metal without nginx).

### Quality gates

```bash
# backend
flake8 .
pytest

# frontend
npm run lint
npm run test
npm run build      # runs the full tsc type-check before bundling
```

---

## Configuration reference (common)

| Variable                | Default                          | Notes                                        |
| ----------------------- | -------------------------------- | -------------------------------------------- |
| `DJANGO_SECRET_KEY`     | unsafe dev key                   | **Must** be set in production                |
| `DATABASE_URL`          | discrete `POSTGRES_*` vars       | Either style works                           |
| `REDIS_URL`             | `redis://localhost:6379/0`       | Cache, broker, channel layer                 |
| `DJANGO_TIME_ZONE`      | `Asia/Kolkata`                   | Availability slots interpret this zone       |
| `FRONTEND_URL`          | `http://localhost:5173`          | Used in emails (verification, parent links)  |
| `EMAIL_BACKEND`         | console                          | Dev prints emails to the backend log         |
| `RAZORPAY_KEY_ID/SECRET`| empty                            | Set for real checkout                        |
| `STRIPE_*` keys         | empty                            | Stripe hidden in UI until configured         |
| `JITSI_DOMAIN`          | `meet.jit.si`                    | Live-class rooms                             |

Email in development goes to the **console** — watch `docker compose logs -f backend` (or `celery_worker`) to click verification and parent-link URLs.
