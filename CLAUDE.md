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

## Design: V4 "Bright + Depth" everywhere, V5 "Ambient Light" on Landing only — see frontend/src/styles/DESIGN_V3.md (§V4, §V5 addenda)
Light-first, premium, spacious (Apple/Stripe/Linear/Airbnb energy, original
identity). Tokens only — no random colors/spacing/radius: `primary` blue
`secondary` cyan `accent` orange, semantic success/warning/danger/info,
`canvas/surface/surface-2/line`, slate text, shadow `soft/hover/dropdown/
dialog`, radius 8–24 (buttons `rounded-xl`), 8pt grid, Plus Jakarta Sans
display + Inter body.

**Everywhere except `features/landing/**`** (every portal, admin, auth
forms, search, tutor profiles, static pages): V4 rules apply — mesh/aurora
gradient washes and a restrained glass surface are allowed only in the
specific locations DESIGN_V3's V4 addendum names (hero bands, floating
cards over real imagery, sticky chrome) — never as a page's primary
background, never stacked with another effect on the same surface. AVOID:
black backgrounds, neon, gaming UI, template look, and glass or gradient
effects outside the named locations.

**On `features/landing/**` only**: V5's "Ambient Light" system applies
instead (DESIGN_V3.md §V5) — a layered blue/cyan/lavender/indigo ambient
wash is the page's primary background by design, on an `ice` (cool
near-white) base instead of the app's usual warm `canvas`. The footer is a
deliberate, named exception to the dark-background rule, confined to that
one page. This is an explicit, repeated, confirmed decision from the
project owner — not a drift from V4, and not license to extend the same
treatment to any other page without the same explicit sign-off.

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
