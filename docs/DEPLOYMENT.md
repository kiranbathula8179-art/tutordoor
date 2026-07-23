# Production Deployment

This guide assumes a single Linux host running Docker Compose with images pulled from GHCR (built by `.github/workflows/deploy.yml` on version tags). Scale-out notes are at the end.

---

## 1. Hardening checklist (before anything else)

| Setting                       | Production value                                              |
| ----------------------------- | ------------------------------------------------------------- |
| `DJANGO_SETTINGS_MODULE`      | `config.settings.production`                                  |
| `DJANGO_SECRET_KEY`           | long random value, secret manager / env only                  |
| `DJANGO_DEBUG`                | `False` (production settings default)                         |
| `DJANGO_ALLOWED_HOSTS`        | your domain(s) only                                           |
| `CORS_ALLOWED_ORIGINS`        | `https://app.yourdomain.com` — never `*` with credentials     |
| `FRONTEND_URL`                | `https://app.yourdomain.com` (email links depend on it)       |
| `EMAIL_BACKEND` + SMTP vars   | a real provider (SES, Postmark, ...)                          |
| `DATABASE_URL`                | managed Postgres or a hardened container with volumes/backups |
| Payment keys                  | **live** Razorpay/Stripe keys + webhook secrets               |
| JWT lifetimes                 | review `SIMPLE_JWT` — short access, rotating refresh          |

Generate a key: `python -c "import secrets; print(secrets.token_urlsafe(64))"`.

## 2. Images

Tag a release — CI builds and pushes both images:

```bash
git tag v1.0.0 && git push origin v1.0.0
# → ghcr.io/<org>/<repo>-backend:1.0.0
# → ghcr.io/<org>/<repo>-frontend:1.0.0   (compiled SPA served by nginx, Dockerfile.prod)
```

## 3. Production compose shape

Differences from the dev `docker-compose.yml` — keep a separate `docker-compose.prod.yml`:

- **frontend**: use the GHCR `-frontend` image (static nginx build). No Vite, no source volumes.
- **backend / backend_asgi / celery***: use the GHCR `-backend` image; remove code volumes; set `DJANGO_SETTINGS_MODULE=config.settings.production`; gunicorn with `--workers $(2×CPU+1)`.
- **nginx**: same routing idea (`/api/`+`/admin/` → backend:8000, `/ws/` → backend_asgi:8001, `/` → the static frontend container), plus TLS termination below. Keep the websocket `Upgrade`/`Connection` headers and a long `proxy_read_timeout` on `/ws/`.
- **postgres/redis**: pin versions, add volumes, restrict to the internal network (no published ports).

Bring-up on the host:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

(The commented `deploy` job in `deploy.yml` automates exactly this over SSH once `DEPLOY_HOST/USER/KEY` secrets exist.)

## 4. TLS

Terminate at nginx with certbot (`certbot --nginx -d yourdomain.com -d app.yourdomain.com`), or put the stack behind a cloud load balancer and keep container nginx plain HTTP internally. Django's production settings expect `X-Forwarded-Proto` from the proxy for `SECURE_PROXY_SSL_HEADER` to work — the shipped nginx config sets it.

## 5. Payment webhooks (required for Stripe, recommended for Razorpay)

Configure in each gateway dashboard, pointing at the API host:

| Gateway  | Endpoint                                   | Secret env                 |
| -------- | ------------------------------------------ | -------------------------- |
| Razorpay | `POST /api/v1/payments/webhook/razorpay/`  | `RAZORPAY_WEBHOOK_SECRET`  |
| Stripe   | `POST /api/v1/payments/webhook/stripe/`    | `STRIPE_WEBHOOK_SECRET`    |

Razorpay checkout completes even without webhooks (client signature → server confirm); the webhook is the belt-and-suspenders reconciliation path. **Stripe requires the webhook** to flip payments to `paid` — the SPA only polls as UX glue. Send at least `payment_intent.succeeded` / `payment.captured` events.

## 6. Scheduled jobs (celery beat)

Already configured; verify they're firing in logs:

- booking reminder notifications ahead of start time
- expiry of stale `pending_payment` bookings (releases the tutor's slot)
- **daily platform metrics snapshot** — powers the admin Reports charts; runs shortly after midnight in `DJANGO_TIME_ZONE`

One worker + one beat container is enough to start; never run two beats.

## 7. Backups & data

- `pg_dump` nightly (cron on host or managed-DB snapshots); test a restore once.
- Volumes: postgres data + media uploads (verification documents live there — treat as sensitive).
- Media in production is served by nginx from the shared volume; for multi-host, move `MEDIA_ROOT` to S3-compatible storage (django-storages) — the code isolates file handling enough that this is a settings-level change.

## 8. Scaling beyond one box

- **backend** replicas scale horizontally (stateless; sessions are JWT).
- **backend_asgi** replicas scale too — the channel layer is Redis, so websocket groups span processes.
- **celery workers** scale by queue depth; beat stays singular.
- Move Postgres/Redis to managed services first; they're the stateful pieces.

## 9. Post-deploy smoke test

1. `GET /api/v1/health/` → 200 (compose healthcheck uses it too)
2. Register → verification email arrives (real SMTP)
3. Seeded or real tutor search returns results with facets
4. A ₹1 live-mode booking end-to-end: pay → tutor wallet ledger row appears
5. Chat between two browsers — messages arrive over `/ws/` with TLS (`wss://`)
6. Next morning: admin → Reports shows a fresh metrics point
