# TutorDoor — Claude Code Working Agreement (V3)

## Backend: FROZEN — read-only
Django/DRF, models, migrations, serializers, services, auth, payments,
bookings, chat, websockets, Celery: **never modify**. If a task seems to
require a backend change: STOP, explain the reason/impact, propose a
frontend alternative, wait for approval.

## Scope: frontend only
React 18 + TypeScript strict + Tailwind + Framer Motion. React Query and all
existing API contracts stay exactly as they are. Zero breaking changes;
every existing feature keeps working.

## Design: V4 "Bright + Depth" — see frontend/src/styles/DESIGN_V3.md (§V4 addendum)
Light-first, premium, spacious (Apple/Stripe/Linear/Airbnb energy, original
identity), now with more layered depth than V3: mesh/aurora gradient washes
and a restrained glass surface are allowed, but only in the specific
locations DESIGN_V3's V4 addendum names (hero bands, floating cards over
real imagery, sticky chrome) — never as a page's primary background, never
stacked with another effect on the same surface. Tokens only — no random
colors/spacing/radius: `primary` blue `secondary` cyan `accent` orange,
semantic success/warning/danger/info, `canvas/surface/surface-2/line`,
slate text, shadow `soft/hover/dropdown/dialog`, radius 8–24 (buttons
`rounded-xl`), 8pt grid, Plus Jakarta Sans display + Inter body. STILL
AVOID: black backgrounds, neon, gaming UI, template look, and glass or
gradient effects outside the named locations or layered on top of each
other.

## Component contract
Typed, accessible (WCAG AA, semantic HTML, focus-visible ring, 44px touch),
responsive mobile-first, all states (hover/active/focus/disabled/loading/
empty/error/skeleton), reduced-motion respected. Reuse `src/components/ui/*`
— extend, don't duplicate.

## Workflow (every task)
Analyze existing code → plan → implement ONE page/component → validate →
self-review. Output: summary, files changed, improvements, risks, next step.
No placeholders, no dummy data, no TODOs, no dead code, no `any`.

## Verification
`cd frontend && npm run build` (runs tsc) and `npm run lint` must pass.
Dev: `docker compose up -d postgres redis` + backend `runserver` + frontend
`npm run dev` (see README).
