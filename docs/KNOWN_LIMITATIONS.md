# Known Limitations & Honest Caveats

A production-grade codebase deserves an honest ledger of what is **not** done, half-done, or done with a documented trade-off. Ordered roughly by how soon a real deployment would care.

---

## Payments

1. **Stripe finalization depends on the webhook.** The SPA polls briefly after client-side confirmation as UX glue, but the authoritative `paid` flip happens in `POST /payments/webhook/stripe/`. Without the webhook configured, Stripe payments stay `pending`. Razorpay is webhook-optional (client signature → server-side confirm endpoint verifies and finalizes).
2. **Wallet is a ledger, not yet a payment method.** `WalletService.debit` exists and is tested, but checkout does not offer "pay from wallet" — no UI and no `wallet` gateway branch in `PaymentService.initiate`. Design intent: wallet holds tutor earnings for future withdrawal; a withdrawal/settlement flow (bank details, payout batches) is unbuilt.
3. **Refunds are recorded, not executed.** Cancellation policies compute and store refund eligibility, but no gateway refund API call is made — an admin currently settles refunds in the gateway dashboard.

## Frontend

4. **JWTs live in `localStorage`** (persisted zustand store). Simple, but exposed to XSS. The auth store isolates token handling behind one module so migrating to httpOnly-cookie refresh flow is contained; do that before handling real money at scale.
5. **`BookingPaymentPage` predates the shared `CheckoutPanel`** and carries its own inline copy of the gateway flow. Course-enrollment checkout uses the shared panel. Consolidating the booking page onto `CheckoutPanel` is a straightforward refactor left undone to avoid churning a working page late in the build.
6. **One placeholder page remains, deliberately**: `/institute/courses` — there is **no institute-owned-course concept in the data model** (courses belong to tutors); building a page would fake a feature. Introducing it properly means a model decision first (institute-sponsored courses vs. a filtered view of roster tutors' courses). Relatedly, the **legal pages are working baselines**: Terms, Privacy, and Refund Policy match actual platform behavior (12-hour cancellation window, wallet ledger, verification process), and each carries an in-page note to have counsel review before launch.
7. **No `package-lock.json` committed.** First `npm install` generates one; commit it and switch CI's `npm install` → `npm ci` (the workflow has the comment at the exact line).

## Backend / infrastructure

8. **The environment this was built in had no live PostgreSQL**, so two things are verified by inspection + compilation but not by execution here: the btree_gist **exclusion constraint** migration and `manage.py seed_demo`. Both were written against the actual model/enum/signature source (field-by-field), and CI runs the full test suite against real Postgres 16 + Redis 7 — the first `docker compose up` + CI run is the executable proof.
9. **Push notifications use FCM's legacy HTTP API** (`FCM_SERVER_KEY`). Google has deprecated it; migrate `apps/notifications` to FCM HTTP v1 (service-account OAuth) before relying on push. In-app and email channels are unaffected.
10. **Timezone model is single-zone.** Availability templates and slot generation interpret times in `DJANGO_TIME_ZONE` (default `Asia/Kolkata`). Cross-timezone tutor↔student pairs will see server-zone times labeled as such; true per-user timezone support means storing a timezone on the profile and converting at the edges.
11. **Search is SQL, not a search engine.** Tutor search uses trigram/`icontains` + filters with sensible indexes — fine into the thousands of tutors; beyond that, lift to OpenSearch/Meilisearch behind `TutorSearchService`.
12. **Rate limiting is DRF throttling only.** Add nginx `limit_req` on `/api/v1/users/login/`, OTP, and password-reset endpoints for real abuse resistance.
13. **Media (verification documents) is local-volume storage.** Multi-host or hardened deployments should move to S3-compatible storage via django-storages; documents are sensitive PII.
14. **Live classes ride public `meet.jit.si`** by default — no room authentication beyond unguessable names. Self-host Jitsi with JWT room auth (`JITSI_DOMAIN` + secret) for paid-class integrity.
15. **Institute verification has endpoints but no admin UI** — admins can approve/reject institutes via API/Django admin; the React verification queue currently surfaces tutors only.

## Testing

16. Backend coverage is meaningful on services (money, booking, availability, verification state machines) but not exhaustive on views; frontend has unit tests for utilities/components and no end-to-end (Playwright) suite. The highest-value next test is an E2E: register → book → pay (test gateway) → complete → review.

---

*None of these are hidden in the code — where a limitation touches a file, the file says so in a comment. This document is the roll-up.*

---

## Visual evolution (v2 "The Observatory") — honest state

17. **New frontend dependencies are pinned but were never installed in the build environment** (no npm here): `three`, `@react-three/fiber@8`, `@react-three/drei@9`, `@react-three/postprocessing@2`, `gsap`, `lenis`. Versions were chosen for React 18 compatibility (fiber v8 line deliberately — not v9/React 19). First `npm install` + `npm run build` (which runs the full `tsc` type-check) is the executable proof, and CI runs both on every push. Structural audits (brace balance, unused-import sweep across all 20 touched files) were run in lieu of a compiler.
18. **The evolution is deliberately staged.** v2 surfaces: landing (`/`), auth, `/search`, the portal chrome (all five portals), wallet/earnings, and chat. Still v1: tutor public profile, public course pages, static/legal pages, and remaining portal pages — these render inside the "luminous sheet" (a paper pane in the dark chrome) or the old `PublicLayout`, unbroken by design. `DARK_NATIVE_PREFIXES` in `DashboardLayout` is the one-line hatch for flipping further portal pages.
19. **Smooth scrolling (Lenis) is scoped to the cinematic world only** — never inside `/student|/tutor|/parent|/institute|/admin` — so chat panes, modals, and tables keep native scrolling. This is intentional architecture, not an omission.
20. **Chat read receipts are session-scoped by design.** The backend emits live `read_receipt` socket events but stores no per-message read state; the UI's "Seen" double-check reflects only receipts observed in the current session and resets on reload. Persisting read state would be a backend model change.
21. **The quality contract** (GPU tiers, `prefers-reduced-motion` stills, DPR caps, tab-pause) is implemented throughout, but frame-rate and Lighthouse numbers are targets to be measured on real hardware — they cannot be verified in this environment. The WebGL hero uses zero fetched assets (procedural only), so it has no network failure mode.
22. **Retained-but-unused v1 components**: the old landing sections (`features/landing/components/`) and `TutorCard` remain on disk after their consumers switched to v2 — kept deliberately for reference/rollback; delete when confident.

---

## Enterprise phase (master data + dynamic RBAC) — honest state

23. **The Master Data Engine and dynamic RBAC are live end-to-end** (see `docs/adr/ADR-001`): 15 vocabulary types / 95 seeded items, audited CRUD + CSV import/export at `/admin/master-data`, and DB-defined roles over the five structural archetypes. Six former enum fields (`grade_level`, `current_level`, `expertise_level`, `document_type`, `relationship`, course `level`) now validate against ACTIVE master items via `MasterDataSlugField`; vocabulary is seeded by the `masterdata 0002` **data migration**, so plain `migrate` keeps tests and fresh environments valid. State machines (`booking.status`, `payment.status`, `teaching_mode`, …) deliberately remain code enums — that is the ADR's central line, not an omission.
24. **`HasPermission` adoption is incremental by design.** The RBAC admin endpoints enforce it today; all other endpoints keep the legacy archetype classes (`IsTutor`, `IsPlatformAdmin`, …), which remain correct. Admin-archetype users implicitly hold every permission (lockout-proof). Widening fine-grained enforcement is a per-endpoint decision, not a blocker.
25. **Seeded-but-not-yet-piped vocabularies**: `notification_template` items (subject/body in metadata) are admin-editable, but the notification send pipeline still uses its in-code templates; `country`/`state`/`city` reference lists exist, but profile city fields remain free-text inputs. Both adoptions are straightforward follow-ups and are listed here so nothing is claimed that isn't wired.
26. **Role reality (restated from the ADR)**: new roles with custom names and permission sets require zero code ("Music Teacher" = one admin action, archetype `tutor`). A genuinely new *archetype* — a new kind of actor with its own data model and portal — remains an engineering project. The admin UI for managing roles/assignments is API-complete; a dedicated frontend page for it can be added like the Master Data page was.

---

## V3 "Bright" migration — final state

27. **The V3 migration is complete across every surface** (see `frontend/src/styles/DESIGN_V3.md` and the repo-root `CLAUDE.md` working agreement): landing, auth, search, public frame, all five portal chromes, wallet/earnings, and chat are light-first V3. Backend untouched throughout, as mandated. Contract preservation verified by token audit each pass (search URL params ×3 redesigns, chat's 15 behaviors, wallet's payment flow).
28. **Cleanup executed**: three generations of retired components deleted after a zero-reference audit — v2 Observatory landing + WebGL `HeroScene`, `AuroraBackground`, `CustomCursor`, `physics` (Magnetic/TiltCard), v1 landing sections, `PublicNavbar`/`PublicFooter`, and both old tutor cards. v2-only design tokens, Space Grotesk, and the cursor/glass CSS layers stripped (`float-slow` retained — live in the V3 hero). Repo-wide leak grep: zero v2 tokens remain; `celebrate()` confetti re-tinted to the V3 brand palette.
29. **Deliberately retained**: the v1 warm palette (`ink/board/chalk/pen-red/gold-star`) — ~35 portal pages' *content* still uses it legitimately on the light chrome; retiring it is a page-content polish program, not a blocker, and reads coherently today. Lenis smooth scroll stays (subtle, portal-scoped). Landing pricing remains omitted pending a public plans endpoint (the backend freeze forbids inventing around it). Landing testimonials, previously omitted for the same reason, now ship — sourced from real reviews via the existing public `GET /reviews/tutors/<id>/` endpoint (no invented quotes, no new backend surface); the section hides gracefully if a tutor pool has no qualifying written reviews yet.

30. **V3 unification codemod executed** (the "pages look mismatched" fix): 1,080+ class replacements across 53 files migrated all portal-page content from v1 tokens to V3 — ink→slate text scale, chalk/paper→canvas/surface, board→primary, pen-red→danger, v1 shadows→V3 scale. Semantic note: a handful of former pen-red *brand-accent* links now read as danger-red; flag any that feel wrong and they're a one-class fix. Star ratings deliberately stay gold. Dead WebGL deps (three, fiber, drei, postprocessing, @types/three) pruned from package.json — **a fresh install is required after pulling this version** (`rm -rf node_modules package-lock.json && npm install`, or `docker compose build --no-cache frontend`). Logo's `dark` prop is currently unconsumed — retained as the dark-mode-ready hook per the V3 spec.

31. **The V3 polish program is complete — all 7 roadmap items shipped** (see the ✅ ledger in `frontend/src/styles/DESIGN_V3.md`): shared patterns → dashboards → tutor profile → booking flow → public courses → density/Tabs unification → micro-delight. Closing-pass finds worth recording: the toast system, the Razorpay checkout modal theme, and the admin report charts were all still v1-branded via **inline hex** — invisible to the class codemod — and are now V3 (a dedicated hex-fossil scan was added to the QA gate so this class of bug can't hide again). The `celebrate()` inventory stands at 7 call sites, every one an earned payment-success branch. Final QA gate: all families green across 115 frontend files; backend `compileall` clean.

---

## Experience-elevation program (premium redesign) — honest state

32. **A shared premium foundation now exists and is adopted incrementally — this is deliberate, not partial-by-neglect.** New reusable primitives: `lib/motion/tokens.ts` (canonical easings/durations/springs + `staggerContainer`/`staggerItem`/`riseInit`, all reduced-motion aware), `components/ui/Surface.tsx` (`MeshBackground`/`BrandMesh`/`DotGrid`/`NoiseTexture`/`GradientOrb` — decorative, `aria-hidden`, pointer-events-none), `components/shared/DashboardHero.tsx` (one gradient welcome hero), and an elevated `StatCard` (gradient-glow chip + count-up). **Where the foundation lives today:** auth (`AuthLayout` brand panel), all five portal dashboards (shared `DashboardHero`), the tutor public profile, the booking/payment checkout, the wallet, and the chat page (class-level). **Where it intentionally does NOT:** admin/institute data tables, the settings/profile forms, and the course-management pages received only the earlier flatness sweep (bold headings + readable text) — tables, forms, auth, and the landing don't need heroes or mesh backdrops, and forcing them there would be decoration against the brief's own "legibility over decoration" rule. Extending the treatment to the remaining ~20 content/table pages is a straightforward continuation, listed here so nothing is over-claimed: the app is coherent today, not uniformly hero-clad.

33. **Four honest limits inside the premium components, each a presentation-layer scope, not a bug:**
    - **Chat has no per-user online presence.** The `useChatSocket` hook exposes *connection* state (`isConnected`), not who-is-online. An online-dot on conversation avatars was attempted, referenced a non-existent `onlineUserIds`, was caught by the verification loop, and was **reverted rather than faked** — a UI that claims to know presence it can't observe is worse than none. Real presence needs a socket/backend channel, and the backend is frozen, so this is a deliberate future decision.
    - **`StatCard` count-up animates on first in-view only**, not on subsequent live data changes — if a metric updates via React Query refetch while already on screen, the number swaps without re-animating. Correct and cheap for dashboards; a live-delta animation would be a follow-up.
    - **The tutor-profile rating-distribution bar reflects the loaded review page**, not the tutor's all-time histogram. It's honestly labelled against what's shown; an all-time distribution needs a backend aggregate endpoint (frozen).
    - **The wallet's "Total in / Total out" reflect the loaded ledger page**, same reasoning — a true lifetime total needs a backend sum, not a client tally over one page.

34. **A dark, chrome-and-marble 3D-render mockup was declined as off-brief.** It was provided as a target during the premium push, but it directly contradicts the stated design language (Stripe/Linear/Airbnb restraint, "avoid heavy decoration / excessive glassmorphism / prioritize legibility") and would fail the brief's own quality checklist on contrast and readability. The light, calm, high-legibility direction was retained as the correct answer. A genuine dark *theme* remains possible (the `Logo` `dark` prop is the standing hook) but would be built clean and readable, not as that render.
