# TutorDoor V3 — "BRIGHT" · Design Constitution

*Supersedes DESIGN_V2 ("The Observatory") as the primary direction. V2's dark
surfaces are restaged page-by-page; its MOTION ENGINE (quality contract,
reduced-motion, celebrate(), physics springs) carries forward. This reversal
is deliberate: a commercial EdTech selling trust to parents, institutions,
and government buyers reads better bright than cinematic-dark.*

## Identity
Bright, spacious, premium, trustworthy. Apple clarity, Stripe simplicity,
Linear polish, Airbnb warmth — combined into TutorDoor's own voice: an
education platform that feels like a well-lit modern campus, not a spaceship.

## Tokens (tailwind.config.ts, "V3 Bright" block)
| Token | Value | Role |
| --- | --- | --- |
| `primary` | `#2563EB` (+light/dark/subtle) | Actions, links, focus |
| `secondary` | `#06B6D4` | Supporting accents, info moments |
| `accent` | `#F97316` | Warm highlights, celebration, badges |
| `success/warning/danger/info` | green/amber/red/sky + `subtle` bgs | Semantic states |
| `canvas` / `surface` / `surface-2` | `#FFF / #F8FAFC / #F1F5F9` | Page / raised / inset |
| `line` | `#E2E8F0` | Borders, dividers |
| Text | Tailwind `slate-900 / 600 / 400` | strong / soft / faint |

Typography: **Plus Jakarta Sans** (display, 500–800) + **Inter** (body,
400–700) + IBM Plex Mono (numbers, ledgers). Fraunces & Kalam retired from
the font payload. Radius scale: tailwind `lg/xl/2xl/3xl` + `card`(20) =
8/12/16/20/24. Buttons `rounded-xl`. Shadows: `soft / hover / dropdown /
dialog` (neutral slate tint — never warm, never glowing). 8pt spacing grid.

## Motion
Subtle and fast: 150ms feedback, 250–350ms entrances, ease-out. Hover-lift
(translate-y-0.5 + shadow-hover), never tilt/magnetic on V3 surfaces.
`prefers-reduced-motion` collapses everything to stills (engine unchanged).
`celebrate()` stays — confirmed-payment success only.

## Component state contract (every interactive component)
default · hover · active · focus-visible (2px ring + offset) · disabled ·
loading · empty · error. Touch target 44px (`md`); `sm`=40px is the
documented desktop-dense exception. WCAG AA contrast throughout.

## Retired from default use (files removed in the final cleanup pass)
Custom cursor (unmounted), Magnetic/TiltCard on V3 surfaces, aurora
backgrounds on restaged pages, the WebGL space hero, `.glass-panel` as a
primary surface. Lenis smooth scroll stays (subtle, already portal-scoped).

## Migration order (one page per pass, zero breaking changes)
1. ✅ Foundation: fonts, tokens, shadows, Button (this pass)
2. Core UI kit: Card, Input, Select, Modal, Badge, Tabs, EmptyState, Skeleton
3. Landing — bright hero, real sections, no WebGL
4. Auth
5. Portal chrome (DashboardLayout → light) + dashboards
6. Search + tutor profile
7. Wallet / payments / chat restaged light
8. Cleanup: remove retired v2/v1 components, font-grotesk exit, audit + zip

## Polish program — ✅ COMPLETE (all 7 items shipped)
The codemod unified all portal content into V3 (1,080+ class swaps). The
"extraordinary" layer continues page-composition by page-composition:
1. ✅ Shared patterns: `PageHeader`, `StatCard` (adopt on every portal page)
2. ✅ Dashboards: StatCard metric rows, CTA/earnings spotlight bands, EmptyStates, admin distribution bars
3. ✅ Tutor public profile: identity band, review composition, sticky booking card + mobile booking bar
4. ✅ Booking flow: modal slot-grid + primary selection + skeletons, payment gateway cards with check badges, demo-class truth restored
5. ✅ Courses (public): catalog cards + filter fix + seat urgency, detail hierarchy, past-aware session timeline, mobile enroll bar (tutor-side management folds into the item-6 density pass)
6. ✅ Density pass: five hand-rolled tab rows unified onto the shared Tabs primitive (keyboard nav + sliding indicator everywhere), list headers/empty states aligned; sticky headers deliberately skipped — all long lists paginate at 20/page, so headers never scroll away
7. ✅ Micro-delight: toasts restyled to V3 (last v1 fossil — inline hex), Razorpay modal + report charts re-tinted, BookingCard focus ring, celebrate() inventory verified (7 sites, all earned payment-success moments)
Rule unchanged: real data only; depth from layers and type, never noise.

## Experience-elevation program (premium foundation) — incremental, honest ledger

Built a shared foundation so pages inherit craft rather than being polished one-off:

- ✅ **Motion system** — `lib/motion/tokens.ts`: canonical easings (`EASE_OUT`/`EASE_SPRING`), duration scale, spring presets, `staggerContainer`/`staggerItem`/`riseInit`/`fadeRise`/`hoverLift`. All reduced-motion aware at source.
- ✅ **Surface system** — `components/ui/Surface.tsx`: `MeshBackground` (light app shell), `BrandMesh` (saturated hero/auth), `DotGrid`, `NoiseTexture`, `GradientOrb`. All `aria-hidden`, pointer-events-none. The brief's "never flat white," composable.
- ✅ **DashboardHero** — one shared gradient welcome banner; adopted by ALL five portal dashboards (student/tutor/parent/institute/admin), eliminating hero duplication.
- ✅ **StatCard elevated** — gradient-glow icon chip, corner glow, count-up on in-view (reduced-motion + non-numeric safe), consumes `SPRING.soft`.

Pages rebuilt on the foundation (logic byte-preserved, token-audited each pass):
- ✅ **Login / AuthLayout** — BrandMesh brand panel, floating education glyphs, animated trust stats, route-aware narrative; danger-red links → primary.
- ✅ **Tutor public profile** — cover hero + overlapping identity card, animated stat tiles, rich subject/language cards, review distribution bar, sticky booking panel + mobile bar.
- ✅ **Booking payment** — Apple-style 3-step checkout stepper, mesh shell, session strip, trust footer.
- ✅ **Wallet** — BrandMesh balance hero, at-a-glance in/out totals, date-grouped ledger as trust artifact.
- ✅ **Chat** — class-level polish: gradient header wash, thread background lift, shared EmptyState. (Per-user presence intentionally NOT faked — see KNOWN_LIMITATIONS 33.)
- ✅ **All 5 dashboards** — full-hero parity via shared DashboardHero.
- ✅ **Landing** — Hero/Categories/FeaturedTutors/HowItWorks/Why/FAQ/CTA migrated off two page-local, duplicated motion helpers onto the shared `lib/motion/tokens.ts` system; hero background now composes `Surface.tsx` primitives (`DotGrid`/`GradientOrb`) instead of duplicated markup; new Advanced Search section deep-links into the real `/search` filter contract (no fabricated fields); new Testimonials section sources real per-tutor reviews via the public reviews endpoint (rating ≥ 4 + written comment required, hides gracefully if none exist) — no quotes invented.

**Deliberately scoped out** (documented, not neglected — KNOWN_LIMITATIONS 32): admin/institute tables, settings forms, and course pages keep the flatness sweep only; heroes/mesh would be decoration there. A dark 3D-render mockup was declined as off-brief (KNOWN_LIMITATIONS 34).

## V4 addendum — "Bright + Depth" (proposed, pending approval before component work starts)

V3's rule was "never flat white, but never loud." That rule stays. What V4 adds is
*where* depth is allowed to go further than a mesh wash — two new, tightly-scoped
primitives, not a general license to add glass/gradients anywhere.

### New primitive: `GlassPanel` (`components/ui/Surface.tsx`)
A restrained frosted-glass surface for content that floats **over real imagery or
a saturated brand background** — never over plain canvas/surface, where "glass"
would just read as a low-contrast box.
- Recipe: `bg-white/70 backdrop-blur-xl border border-white/40 shadow-dropdown`
  (dark-mode equivalent: `bg-navy/60 backdrop-blur-xl border-white/10`).
- One blur layer, one border, one shadow — no inner glow, no gradient border, no
  second translucent layer stacked on top (that's the "heavy glass" V3 rejected).
- **Allowed locations only**: floating stat/testimonial cards over the landing
  hero's imagery, the sticky nav once it's scrolled past a hero (replacing the
  current flat `bg-canvas/95`), auth screens' brand-panel content over `BrandMesh`.
- **Not allowed**: dashboard cards, tables, forms, modals, or any surface that
  sits on plain `canvas`/`surface` — those stay solid per the existing Card spec.

### `GradientOrb`/`BrandMesh` get one louder sibling: `AuroraWash`
For hero-type moments that want more motion/color than the existing `BrandMesh`
diagonal wash, without becoming the "cinematic-dark" V2 aesthetic this project
already retired once.
- Recipe: 2–3 `GradientOrb`s in `primary`/`secondary`/`accent` at low opacity
  (`/10`–`/15`, matching existing `GradientOrb` defaults), slow-drifting via
  `animate-float-slow` (the existing keyframe, already used on the landing hero's
  tutor cards) — not a shader, not WebGL, not saturated enough to need a
  reduced-motion still-frame swap beyond the standard `motionSafe()` treatment.
- **Allowed locations only**: the landing hero background (replacing today's
  static dot-grid + two static orbs with slow-drifting ones), the auth
  `BrandMesh` panel. Both are already the two places DESIGN_V3 calls "saturated
  hero/auth wash" — this upgrades their motion, not their footprint.
- **Not allowed**: portal dashboards, any page-body background, any card.

### What does not change
Everything else in this document stands: token table, shadow scale (neutral
slate tint — still never warm, never glowing), 8pt grid, motion durations,
component state contract, and the "real data only" rule. Dashboards, tables,
forms, and the admin/institute/settings surfaces explicitly scoped out above
stay on the flatness sweep — V4 adds depth to arrival moments (hero, auth), not
to working surfaces (dashboards, tables, forms), which is where "gradient
overload" and "template look" actually come from.

### Rollout
✅ Implemented. `GlassPanel`/`AuroraWash` built in `Surface.tsx`, adopted on
the landing hero background, the sticky nav's post-scroll state, and the
auth `BrandMesh` panel's trust-stats card. Landing was then further extended
by V5 below (explicit, repeated direction from the project owner) — V4's
"hero/auth/nav only" boundary for glass and gradient effects **no longer
applies to the landing page**; it still governs every other page (auth
forms, all five portals, admin, search, tutor profiles, static pages),
which stay on the flatness sweep this document has always specified.

## V5 — "Ambient Light" (landing page only, supersedes V4's scope on that one page)

Explicit, repeated direction from the project owner: the landing page's
background moves from a flat warm canvas to a layered, cool-toned ambient
light system — soft blue/cyan/lavender/indigo blooms behind every section,
not just hero/auth. This is a deliberate, acknowledged departure from V3's
"never a page's primary background" rule and from V4's narrow scoping,
**confined to `frontend/src/features/landing/**`** — nothing else in the app
changes tone or gets a new background system.

### New tokens (`tailwind.config.ts`)
- `ice` (`#F7FAFF`) — the landing page's own near-white base, replacing
  `canvas`/`surface` (both intentionally warm) on that page only. Set once,
  at `LandingPage.tsx`'s root `<div>`.
- Ambient bloom hues reuse Tailwind's own default palette (`sky-400`,
  `violet-300`, `indigo-400`/`indigo-500`, already available since this
  config uses `theme.extend`, not a full palette replacement) alongside the
  existing `primary`/`secondary` brand tokens — no new saturated colors were
  invented, only combined at very low opacity.

### New primitive: `AmbientWash` (`components/ui/Surface.tsx`)
One or two very large, very soft blurred blooms — `blur-[220px]`,
opacity `0.06`–`0.09` — positioned in opposite corners of a section,
suggesting light drifting behind the content rather than a flat fill.
Takes 1–2 `tone`s from `blue | cyan | sky | lavender | indigo`. Each
landing section gets a different tone pairing instead of alternating solid
`canvas`/`surface` blocks:

| Section | Tones |
| --- | --- |
| Hero | `blue`, `lavender` (layered with the existing `AuroraWash`) |
| Advanced search | `blue` |
| Categories | `cyan`, `blue` |
| Featured tutors | `blue` |
| How it works | `blue` |
| Trust ("Why TutorDoor") | `sky` |
| Testimonials | `lavender` |
| FAQ | `blue` |

Cards on every one of these sections are now genuine `bg-white` (was
`bg-canvas`, which reads warm) with `border-line/60` (softer than the
default `border-line`) — "white surfaces floating on ambient light," not
white-on-white.

### CTA and Footer — the two intentional exceptions to "restrained"
- **CTA**: `bg-primary` solid → `bg-gradient-to-br from-primary via-primary-dark
  to-indigo-600`, a genuine multi-stop gradient (still just the brand blue
  extended toward indigo, not a new hue family), plus the same two soft
  interior blooms it already had.
- **Footer**: the one deliberate dark surface in the app, explicitly
  requested and confirmed by name. `bg-gradient-to-b from-navy to-navy-dark`
  with one soft indigo bloom and every text color flipped to a white-based
  scale (`text-white/40` through `text-white`) for contrast. This is a
  **named, one-page exception** to the "avoid black/dark backgrounds" rule —
  it does not open the door to dark surfaces anywhere else; portals,
  dashboards, and every other page's footer-adjacent chrome stay light.

### What does not change
Everything outside `features/landing/**`: every portal, admin, auth forms,
search, tutor profiles, static pages, and all shared `components/ui/*`
defaults (`Card` still defaults to `bg-canvas`, `canvas`/`surface`/`line`
tokens are untouched globally). V5 is layered on top of a page via explicit
per-usage `className` overrides, not a global token change — so nothing
elsewhere in the app silently shifted tone.

## V6 — "The Journey" (landing hero only, scoped narrower than V5)

Explicit direction from the project owner requested a much larger,
cinematic 12-chapter reinterpretation of the whole landing page (a
photorealistic 3D aircraft-and-book concept, Three.js/React Three Fiber,
bespoke illustrated "chapters" replacing every section). That is not
something this codebase can honestly deliver: it would require a bespoke
3D-art pipeline this project doesn't have, new heavy runtime dependencies
with real performance cost, and fabricated marketing claims (invented
tutor/session counts) that violate the project's real-data-only rule. V6
is the honest, scoped response — one real chapter, not twelve invented
ones: the **hero section only**, rebuilt with techniques that actually
ship (Framer Motion SVG path-drawing, no WebGL/Three.js), everything below
it untouched on V5.

### New tokens (`tailwind.config.ts`)
- `forest` (`DEFAULT #2F5233`, `subtle #EAF0EA`, `dark #1F3A23`) and `sage`
  (`#8BA888`) — a botanical accent pair for the hero's eyebrow badge, trust
  chips, and headline gradient. `gold-star` (pre-existing token) is reused
  for the headline's warm accent instead of inventing a new gold.
- `editorial` font family (Fraunces, a variable serif) added alongside the
  existing `display`/`sans` — used only for the hero `<h1>`, nowhere else.

### New primitive: `FlightTrail` (`features/landing/v3/FlightTrail.tsx`)
A small aircraft silhouette animates along a hand-authored SVG curve while
a matching gradient stroke "draws" itself in sync, using Framer Motion's
`pathLength` animation. Purely atmospheric — `aria-hidden`, no navigation
role, `pointer-events-none`, and collapses to a fully-drawn static path
under `prefers-reduced-motion` (verified: `still` branch renders
`pathLength: 1` immediately, no animation). Desktop only (`hidden
lg:block`) — confirmed zero horizontal overflow and correct
show/hide at 390px, 834px, and 1440px.

### Hero background
`bg-gradient-to-b from-[#FFF8E8] via-[#FDFBF3] to-canvas` (warm dawn wash)
replaces V5's cool ambient-blue treatment on the hero specifically, with
drifting white/sage cloud blooms in place of the blue/lavender
`AmbientWash`. The rest of the page (search, categories, featured tutors,
how-it-works, trust, testimonials, FAQ, CTA, footer) keeps V5's ambient
system unchanged — this is a hero-only palette shift, not a page-wide one.

### What does not change
Everything below the hero fold stays on V5 "Ambient Light" exactly as
documented above. The real tutor preview cards, search form, and trust
chips in the hero keep their existing data, copy, and behavior — only the
surrounding atmosphere and headline typography changed. No fabricated
statistics, no new heavy dependencies, no 3D.
