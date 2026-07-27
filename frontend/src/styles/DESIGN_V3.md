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

> **Status: superseded by V7 below** for the whole public surface (V5 was
> landing-only; V7 extends the idea app-wide and consolidates the palette).
> Kept here for history until Milestone 2 of the V7 rollout migrates
> landing's code off this system.

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

> **Status: superseded by V7 below** — the `FlightTrail` motif and dawn
> palette are re-tuned into V7's unified system in Milestone 2 rather than
> discarded. Kept here for history.

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

## V7 — "One World" (public experience: Landing, global public nav/footer,
Search, Tutor Profile, Courses, About/Trust/Support/Legal, public auth)

Explicit, written project-direction change: the entire public-facing
surface should feel like one continuous, atmospheric world rather than a
stack of white SaaS sections — while staying honestly buildable in React
+ Tailwind + Framer Motion (no 3D, no fabricated features/stats, brand
blue preserved as the interactive identity). Authenticated portals
(Student/Tutor/Parent/Institute/Admin) are **explicitly out of scope**,
deferred to a future V8 — shared primitives those portals depend on keep
their existing defaults untouched.

### Design Principles

**Background philosophy.** The public app is one continuous atmosphere,
not a stack of sectioned pages. A single fixed `PublicAtmosphere` layer
(`components/ui/Surface.tsx`) mounts once per page (`LandingPage.tsx`,
`PublicLayout.tsx`) and sits behind everything; individual sections stop
painting their own opaque background fills and instead float translucent
surfaces over the shared atmosphere. Nothing resets to flat white between
sections or between pages — a visitor moving from Landing to Search to a
Tutor Profile stays inside the same visual world throughout.

**Color system.** Brand blue (`primary`) is preserved exactly as-is, but
its role narrows to interactive elements only — buttons, links, focus
rings, active states — never a background fill. The atmosphere itself
runs on warm editorial neutrals and botanical accents: new `linen` (warm
ivory base) and `sand` (deeper warm neutral) tokens replace `canvas`/white
as the public surface's dominant tone; new `clay` (muted terracotta) plus
the already-existing `forest`/`sage` (botanical green, from V6) and
`gold-star` (warm gold, pre-existing) tokens supply sparing, non-
background accent color. `secondary`/`accent`/`navy`/`slate`/semantic
tokens are unchanged. Every token added is scoped to one job (background
base, background variant, or sparing accent) and reused across every
public page rather than invented per-page.

**Motion principles.** The atmosphere itself evolves — bloom positions
drift and the overall tone slowly warms as the page scrolls (Framer
Motion `useScroll`/`useTransform`), so the background is never static,
but the effect stays subliminal: slow, low-amplitude, never something a
visitor consciously clocks as "an animation." Content motion (entrances,
hovers) keeps using the canonical `lib/motion/tokens.ts` system
(`DURATION`, `EASE_OUT`, `riseInit`, `staggerContainer`/`staggerItem`).
Every scroll-linked or looping animation is gated by
`prefersReducedMotion()` with a fully static fallback — no exceptions.

**Component language.** Shared primitives (`Button`, `Card`, `Input`,
etc. in `components/ui/*`) keep their existing default exports untouched
— dashboards depend on them and are out of scope until V8. Public pages
layer richer surfaces on top via explicit `className` overrides
(translucent `bg-linen/70`, `border-sand` borders) rather than changing
shared defaults — additive, not invasive, the same discipline V5 used.

**Spacing.** Unchanged: 8pt grid, existing radius scale (8–24px,
`rounded-xl` buttons).

**Accessibility.** WCAG AA contrast is verified against the new warm base
tones the same way it was for V5's dark footer (manual luminance
calculation, then live computed-style confirmation) — translucent
surfaces over a moving background need this checked, not assumed. Every
scroll/loop animation respects `prefers-reduced-motion`. Focus-visible
rings, 44px touch targets, and semantic HTML are unchanged requirements.

**Responsive behavior.** `PublicAtmosphere`'s gradient blooms are
unclipped, oversized, and blurred enough that breakpoint changes don't
require separate mobile/desktop compositions — verified at
390/834/1440px for zero horizontal overflow, the same check every other
primitive this session has gone through.

### New tokens (`tailwind.config.ts`)
- `linen` (`#F6F1E7`) — warm ivory background base for public pages.
- `sand` (`#EDE4D3`) — deeper warm neutral for section variation, borders,
  dividers.
- `clay` (`#B5714B`) — muted terracotta/copper accent, sparing decorative
  use only, never a background fill.
- Reused, not reinvented: `forest`/`sage` (V6) and `gold-star`
  (pre-existing) cover the rest of the botanical/warm-accent need.

### New primitives (`components/ui/Surface.tsx`)
- **`PublicAtmosphere`** — the background system itself: multi-layer
  radial gradient blooms (`sage`/`gold-star`/`clay`/`forest` at 8–16%
  opacity, 200–220px blur) over a `linen` base, plus the existing
  `NoiseTexture` grain at 3% opacity. `fixed inset-0 -z-10`, mounted once
  per page. Blooms drift via scroll-linked `y` transforms, static under
  reduced motion.
- **`OrganicEdge`** — a reusable hand-authored SVG wave divider
  (`top`/`bottom` position, tone-selectable fill) for blending a raised
  content band into the shared atmosphere instead of a hard rectangular
  cut.
- **`AmbientWash`** — tone union extended from `blue | cyan | sky |
  lavender | indigo` to also include `sand | clay | forest | gold`, so
  existing call sites can blend warm tones in without a new primitive.

### Rollout ledger
- ✅ **Milestone 1** — this section, new tokens, `PublicAtmosphere` /
  `OrganicEdge` / extended `AmbientWash`, mounted in `LandingPage.tsx` and
  `PublicLayout.tsx` (root backgrounds made transparent so the shared
  atmosphere shows through immediately; individual page sections still
  have their own opaque fills at this point — those open up below).
- ✅ **Milestone 2** — Landing reconciled onto V7: every section's card
  fills moved from opaque `bg-white` to translucent `bg-white/70
  backdrop-blur-sm border-sand/70`; `AmbientWash` tones across all
  sections switched from V5's cool blue/cyan/sky/lavender to the warm
  V7 set (`forest`/`sand`/`clay`/`gold`), varying per section for a loose
  top-to-bottom progression; Hero's own opaque dawn-gradient background
  removed so the shared `PublicAtmosphere` shows through directly (its
  cloud blooms and `FlightTrail` motif stay, now layered on the
  atmosphere instead of owning the base fill); `OrganicEdge` added at the
  one genuine hard color boundary left on the page (into the footer's
  deliberate dark surface). CTA's blue gradient and the footer's dark
  surface are kept exactly as the two sanctioned "blue for CTA" / "one
  deliberate dark surface" exceptions — neither is a page background.
- ✅ **Milestone 3** — Nav: the header bar itself moved from an opaque
  `bg-white/80` strip to a translucent `linen`/`white` wash
  (`bg-linen/50` idle → `bg-white/75` scrolled) over the shared
  atmosphere, `border-sand` replacing `border-line`, link spacing opened
  up (`gap-6`→`gap-8`); the mobile panel gained a real entrance/exit
  animation (Framer Motion height+opacity, reduced-motion-safe) and
  Escape-to-close, plus a warmer `bg-white/95` tone. Footer: the cool
  indigo accent bloom swapped for a warm `gold-star` one (a second small
  `forest` bloom added) so the page's dawn-gold hero and dusk-gold footer
  bookend one palette instead of ending on a leftover cool tone; link
  hover gained a subtle `motion-safe:hover:translate-x-0.5`. All nav
  routes, role-aware logic, and footer links unchanged.
- ✅ **Milestone 4** — Auth: `AuthLayout` now mounts its own
  `PublicAtmosphere` (it isn't wrapped by `PublicLayout`, same as Landing)
  instead of a flat `bg-canvas`. The brand panel's saturated blue
  `BrandMesh` fill was replaced, not recolored — V7 reserves blue for
  interactive elements and the footer is the app's one deliberate dark
  surface, so a second dark/blue panel would violate both. It's now a
  light, editorial panel: `AmbientWash` warm blooms, `font-editorial`
  (Fraunces) headline in navy, botanical-green glyph chips and trust
  icons, `GlassPanel` (light tone) for the stats card. The form column
  stays mostly opaque (`bg-linen/90`) — the one place V7 intentionally
  leans away from translucency, for input legibility. The five auth page
  files themselves remain untouched.
- ✅ **Milestone 5** — Search + Tutor Profile, TutorDoor's highest-traffic
  workflow: readability over visual effects, so this milestone was
  deliberately restrained. Both pages already sat inside `PublicLayout`
  (their `PublicAtmosphere` was live since Milestone 1) but painted their
  own opaque `bg-surface` root and a saturated blue hero/cover
  (`bg-gradient-to-br from-primary...`/`BrandMesh`) over it — both
  removed in favor of `AmbientWash` warm blooms so the shared atmosphere
  shows through. Result cards and the filter rail stayed deliberately
  **solid** (`bg-white`, no backdrop-blur) per the explicit "avoid heavy
  glassmorphism on tutor cards" instruction — Search/Profile is the one
  place in V7 that intentionally does NOT lean translucent, because
  scanning a dense results grid needs maximum legibility. Tutor Profile's
  name headline moved to `font-editorial` for the "editorial and
  trustworthy" feel; its cover band and section-card borders moved to the
  warm palette (`border-sand`, `bg-linen/40` for secondary surfaces).
  Found and fixed a real pre-existing mobile overflow bug while verifying
  this milestone: the results grid's item wrapper lacked `min-w-0`, so
  CSS Grid's default `min-width: auto` let a card's intrinsic content
  width force the single-column track wider than its container below the
  `sm` breakpoint (confirmed via `getComputedStyle` + ancestor-clipping
  analysis, not the `PublicAtmosphere` blooms a naive widest-element scan
  initially pointed at — those were correctly clipped red herrings).
- ✅ **Milestone 6** — Courses (list + detail). First milestone run under
  the pre-milestone brief process (Manifesto principles → emotional
  outcome → signature moment → anti-pattern check → implement). Both
  pages already sat inside `PublicLayout`, so `PublicAtmosphere` was live
  with no opaque root to remove — only surface tokens moved
  (`border-line`→`border-sand`, `bg-canvas`→`bg-white`), plus a small
  `AmbientWash` near the catalog header. Cards stayed solid, matching
  Search's readability-first discipline (a curated catalog is still a
  browsing/scanning task). The real, data-backed "seats left" indicator
  was kept exactly as-is — honest scarcity, not the fake-urgency
  anti-pattern. Deliberately did **not** add a signature threshold
  moment to the enroll flow: it's fast and transactional (navigates away
  immediately), and a reveal animation would fight task completion —
  documented as a "choose clarity" case per the Manifesto's own
  guidance, not an oversight.
- ✅ **Milestone 7** — static/legal pages (About, Trust & Safety, Support,
  Terms, Privacy, Refunds). The last milestone in the V7 rollout — every
  public page is now on the unified system. These six pages had *zero*
  visual system before this pass (no Card/Surface/motion at all, per the
  original audit), so one shared-shell rewrite (`StaticPageShell.tsx`)
  cascaded to all six at once: `font-editorial` on the one page title
  (used with real scarcity, matching the typography philosophy), a
  restrained per-page `AmbientWash` mood (`warm`/`calm`/`quiet`), and a
  thin `border-sand` rule between sections replacing undifferentiated
  whitespace — the editorial-magazine direction from the Creative
  Strategy applied more directly here than anywhere else, since these
  are the only pages in the product that are purely read, not operated.
  Deliberately no signature threshold moment — these aren't thresholds,
  and forcing the Door motif here would have been exactly the mistake
  the Manifesto warns against. The `LegalNote` disclaimer's honest
  "have qualified counsel review it" wording is untouched on purpose.

**V7 "One World" rollout complete.** Every public page — Landing, global
nav/footer, Search, Tutor Profile, Courses, public auth, and every
static/legal page — now shares one background system, one warm palette,
and one documented set of restraint rules. Authenticated portals remain
on V4/V3, deferred to a future V8.

## V8 — Authenticated Portals (Student/Tutor/Parent/Institute/Admin)

The deferral above is lifted. V8 governs the five authenticated portals,
under the permanent **Design DNA** (a separate, higher-level constitution
approved alongside this rollout — ten technology-agnostic principles
under four pillars: Honesty, Proportion, Coherence, Respect). This
section records how the DNA is applied here; it does not restate the DNA
itself.

### The governing decision: register follows stakes

Dashboards are task/trust register almost entirely — a logged-in user
managing real bookings, payments, verification, or admin data. V7's
public-page atmosphere (`PublicAtmosphere`, translucent cards, warm
marketing tone) is **not** imported into dashboards wholesale. This
isn't a new rule invented for V8 — `DashboardLayout`'s existing
`MeshBackground` treatment (quiet, functional, warm-toned `surface`/
`canvas` tokens already, not flat white) and this document's own
pre-existing V3-era note that "admin/institute tables, settings forms,
and course pages keep the flatness sweep only — heroes/mesh would be
decoration there" already reached the same conclusion independently.
V8 keeps that restraint and fixes what's actually inconsistent with it,
rather than replacing it with something more atmospheric.

### Milestone 1 — Foundation

**Audited, found already compliant, left alone:** `DashboardLayout.tsx`'s
chrome (sidebar, topbar, mobile drawer, the `layoutId`-animated active-nav
pill). Its surface tokens were warm-toned from the original V3 system,
not cool neutrals — no change needed, and none made. Stated here so the
absence of a diff isn't mistaken for an unaudited gap.

**Found and fixed:** `DashboardHero` (and, from Milestone 2 onward,
`WalletPage`'s balance card) used `BrandMesh` — a solid blue-to-cyan
gradient — as a full-bleed background. This is the same "blue as a
dominant background" issue already corrected twice on the public surface
(`AuthLayout`, `TutorProfilePage`), for the same standing reason: blue is
reserved for interactive elements, not backgrounds. New primitive
**`PortalHeroMesh`** (`components/ui/Surface.tsx`) replaces it —
`forest`→`forest-dark`→`navy-dark` gradient, one warm `gold-star` accent
bloom, dot texture, grain — dark enough to keep the existing white text
readable, restrained to one gradient plus one bloom rather than a public-
page `AmbientWash` treatment, per the register decision above.
`BrandMesh` itself is untouched — it remains available for any future
caller that still wants the blue treatment deliberately.

### Standard adopted for all later V8 milestones

List-row treatment across portal pages was inconsistent — some pages use
`Card` + `divide-y`, others hand-roll bordered `div`s directly. `Card` +
`divide-y` is the standard from here forward; the raw-`div` pattern is
replaced wherever a milestone touches that page.

### Rollout ledger
- ✅ **Milestone 1** — Foundation (`PortalHeroMesh`, this section).
- ✅ **Milestone 2** — shared cross-portal components. `WalletPage`
  moved to `PortalHeroMesh` (the other of `BrandMesh`'s two call sites,
  after `DashboardHero` in Milestone 1). `BookingsListPage`/
  `BookingDetailPage` gained entrance motion where there was previously
  none (real content loading is a real state change). The "quiet moment"
  gap flagged in the plan — `EnrollmentPaymentPage` sharply less polished
  than its sibling `BookingPaymentPage` despite identical purpose — fixed
  by extracting the shared `CheckoutSteps` component and bringing
  enrollment payment up to booking payment's standard (mesh background,
  entrance motion, trust footer, `celebrate()` on success). `ChatPage`
  audited and left untouched — no `BrandMesh`/blue-dominant-background
  issue found, and its socket/read-receipt logic isn't worth the risk of
  touching without a concrete finding.
- ✅ **Milestone 3** — Student portal. `StudentDashboardPage` audited and
  found already fully compliant (no `BrandMesh`, well-staggered motion,
  warm tokens) — no changes made, stated explicitly rather than
  manufacturing busywork. `StudentProfilePage` gained a real-data avatar
  identity strip (existing `Avatar`/`user` data, no new upload
  functionality invented) and staggered entrance across its three
  settings cards (was one flat fade). `StudentCoursesPage` gained the
  same stagger pattern now established for "my X" list pages
  (`BookingsListPage` in Milestone 2) — one consistent motion language
  across comparable list surfaces, per Principle 6.
- ✅ **Milestone 4** — Tutor portal. `TutorDashboardPage` gained the same
  staggered `rise()` entrance `StudentDashboardPage` already had (a real,
  previously-unfixed inconsistency between the two portal-home pages).
  `AvailabilityPage` gained a real week-at-a-glance summary strip
  (computed from the same draft state already being edited below it, not
  a new data model or a separate calendar surface) — a full calendar-grid
  rewrite was considered and deliberately not attempted, since restructuring
  the working add/remove/edit interaction for a "polish" milestone was a
  bigger risk than the milestone's scope justified. `TutorCoursesPage`'s
  course cards and error/empty states moved from raw bordered `div`s to
  `Card` (plus a missing focus ring found and fixed along the way).
  `TutorCourseDetailPage` and `VerificationPage` gained the same entrance
  fade already established for comparable detail pages. `TutorProfileSettingsPage`
  gained a real live preview ("How students will see you") built entirely
  from the authenticated user's real identity and the form's own current
  values — deliberately not a reuse of the shared `TutorResultCard`
  (which would have needed rating/verification fields a mid-edit, unsaved
  profile can't honestly claim yet).
- ✅ **Milestone 5** — Parent portal. All five pages were already
  `Card`-consistent from prior work; `ParentPaymentsPage` needed zero
  changes (already exactly `Card`+`divide-y`, the standard). The one real
  fix was `ParentBookingsPage`'s list rows, which used raw bordered
  `div`s instead of `Card` — the exact "list-row standardization" gap
  the plan named. All four pages with real lists/grids
  (`ParentDashboardPage`, `ParentChildrenPage`, `ParentBookingsPage`,
  `ParentProgressPage`) gained the same `staggerContainer`/`staggerItem`
  entrance now consistent across every "my X" list in the app.
- ✅ **Milestone 6** — Institute portal. `InstituteDashboardPage` was
  already honest about its real data gap (one real stat — institute
  rating — plus two action tiles, no invented numbers) and just needed
  the same `rise()` stagger the other four portal homes already have, for
  full cross-portal consistency. `InstituteTutorsPage` and
  `InstituteStudentsPage` both had the raw-dashed-div empty state instead
  of `Card`+`EmptyState` — fixed to match every other portal's empty
  state. `InstituteStudentsPage`'s enrolled-student list was already
  `Card`+`divide-y` — left untouched, same "already compliant" precedent
  as `ParentPaymentsPage`. `InstituteProfileSettingsPage` gained the
  standard entrance fade every other settings/detail page has.
  `InstituteProfileSettingsPage` also needed zero real-data compromises —
  verified live against the seeded institute account
  (`contact@brightminds.test`, BrightMinds Learning Center) with a real
  tutor on the roster and a real enrolled student.
  A real bug was found and fixed during verification: the tutor-roster
  grid overflowed horizontally at 390px because the grid-item wrapper
  lacked `min-w-0`, so a long, non-wrapping role title
  ("Senior Faculty – Mathematics") forced the CSS grid track wider than
  its container despite the inner text already being `truncate`d — grid
  track auto-sizing computes a min-content contribution from the whole
  item subtree unless `min-w-0` breaks that chain. Fixed by adding
  `min-w-0` to the grid item; the other `Card`+grid pages
  (`ParentChildrenPage`, `StudentCoursesPage`, `TutorCoursesPage`) were
  checked and don't hit this because their content is shorter — worth
  keeping in mind if a future grid item ever holds long unwrapped text.
- ✅ **Milestone 7** — Admin (Dashboard, Reports, Verifications).
  `AdminDashboardPage` gained the same `rise()` entrance the other four
  portal homes have, for full cross-portal consistency — its
  `DistributionCard`s (users-by-role, bookings-by-status) were already a
  well-built real-data component and needed no structural change.
  `VerificationQueuePage`'s tutor-review cards gained the standard
  `staggerContainer`/`staggerItem` list entrance. `AdminReportsPage` is
  data-dense (two live charts, a revenue breakdown, two leaderboards) —
  per Principle 4, it gets one restrained root fade-in only, not
  per-chart stagger, which would read as decoration on a data tool.
  Verified live against the seeded admin account, with real platform
  data throughout (15 users, real revenue/bookings distributions, live
  chart data, a populated top-tutors/top-subjects leaderboard).
  A second, more serious bug was found during this milestone's
  reduced-motion check — and it wasn't scoped to Milestone 7 at all.
  Every page across the entire V8 rollout (Milestones 1–7) using the
  `rise()`/`riseInit()` entrance pattern — all five portal dashboards,
  every settings/detail page, `DashboardHero` itself, plus several V7
  pages sharing the same helper (`TutorProfilePage`, `AuthLayout`,
  `AdvancedSearchV3`) — went permanently invisible (`opacity: 0`, stuck)
  under `prefers-reduced-motion: reduce`. `getAnimations()` on the
  affected elements showed why: framer-motion's inline style already
  said `opacity: 1`, but a native Web Animation it had scheduled with
  `duration: 0` (from `motionSafe()`) never advanced past `localTime: 0`
  in this browser, and with `fill: backwards` that holds the element at
  its *from* frame forever — the opposite of what reduced motion is
  supposed to guarantee. The proven-safe pattern already used by
  `staggerContainer` (`initial={still ? false : "hidden"}`, which skips
  the animation outright under reduced motion instead of running a
  zero-duration one) doesn't have this failure mode. Fixed centrally in
  `riseInit()` itself (`@/lib/motion/tokens.ts`) — it now returns `false`
  under reduced motion instead of `{ opacity: 0 }` — which every one of
  its ~18 call sites inherits automatically with no per-page changes
  needed. Re-verified with `getAnimations()`-level introspection on both
  `/tutor` and `/admin` post-fix: zero stuck-opacity elements, only the
  two intentional decorative-overlay opacities (`0.3`, `0.05`) remain
  below 1. This was a real, severe, pre-existing accessibility bug — not
  something this milestone introduced — caught only because this
  milestone's manual reduced-motion check happened to inspect computed
  opacity with enough rigor (`getAnimations()`) to see the animation was
  stuck rather than assuming "opacity < 1 after N seconds" meant a
  simple timing issue.
- ✅ **Milestone 8** — Admin (data-table-heavy pages: Users, Bookings,
  Payments, Coupons, Master data). Restrained pass only, per Principle 4
  and the plan's own explicit scope — no hero, mesh, or motion added
  anywhere in this milestone. `AdminCouponsPage` and
  `AdminMasterDataPage` were already fully compliant (`Card`+`EmptyState`
  throughout, and a properly restrained dense data table respectively) —
  zero changes, same "already compliant" precedent as
  `ParentPaymentsPage`. The one real, in-scope fix: `AdminUsersPage`,
  `AdminBookingsPage`, and `AdminPaymentsPage` all had a raw dashed-`div`
  "no results" state instead of `Card`+`EmptyState` — fixed to match
  every other list page in the app, with no motion added (consistency,
  not decoration).
  A real, pre-existing horizontal-overflow bug was also found and fixed
  during 390px verification: `AdminBookingsPage`'s status-tab row
  overflowed the viewport by ~100px. The tab bar's own container already
  had `overflow-x-auto` (correct, scrollable-within-itself behavior), but
  the page's outer wrapper `div` around it had no width constraint, so
  as a flex item its default `min-width: auto` let it grow to the
  content's full width and push the whole page wider — the same
  grid/flex auto-sizing failure mode fixed for `InstituteTutorsPage` in
  Milestone 6, this time on a flex tab bar instead of a grid card. Fixed
  by adding `min-w-0` to that wrapper. Not present on `AdminUsersPage` or
  `AdminPaymentsPage`, which don't wrap their filter controls the same
  way.
  Verified live against the seeded admin account with real platform data
  throughout (18 real users, real bookings/payments/coupons). Zero
  horizontal overflow at 390/834/1440px after the fix. Zero stuck-opacity
  elements (confirmed post-Milestone-7 `riseInit` fix holds). Keyboard
  reachability at the same baseline as every other portal page.

This closes the V8 "Authenticated Portals" rollout — all 8 milestones
shipped, verified, and committed. Every dashboard applies the Design DNA
from first paint; the one severe cross-cutting bug this rollout
surfaced (the reduced-motion `riseInit` stuck-animation issue, Milestone
7) was root-caused and fixed centrally rather than patched per page.

## V9 — World-Class Product Experience System

A follow-on functionality audit (all 34 authenticated routes) found zero
functional regressions from V7/V8, real backend endpoints everywhere, and
that "empty-looking" pages are overwhelmingly legitimate zero-seed-data
states — with exactly two small, pre-existing wiring bugs (unrelated to
any redesign). V9's mandate: layer a reusable onboarding / empty-state /
discovery / celebration system on top of the existing app without touching
business logic, APIs, or backend contracts — governed by the same Design
DNA as V8, now committed to the repo at `frontend/src/styles/DESIGN_DNA.md`
instead of living only in session memory.

**The governing decision: Discovery ships honest-only.** Backend feasibility
was traced endpoint-by-endpoint before building anything: "popular tutors"
(real, via the existing public tutor-search default ordering
`-is_featured, -rating_average, -total_sessions_completed`) and "new
courses" (real, via the existing public course-list default ordering
`-created_at`) are both buildable with zero backend change. "Trending
subjects" and "rated/recommended courses" are **not** — the only real
popularity aggregation is admin-gated, and no endpoint anywhere ranks
courses by rating or enrollment. Per the project's frozen-backend rule,
V9 does not build those — Discovery ships with only the two real,
already-public data sources, never a fabricated "trending" signal.

**The second governing decision: Admin gets none of this.** Per Design DNA
Principle 4 (register follows stakes, already established in V8), Admin is
an internal ops tool — its existing empty states ("No users match these
filters") are already honest and correct as search-result feedback, not
the start of a journey. Adding onboarding/discovery/celebration framing
there would violate Principle 1 (Honesty) by implying a journey that isn't
happening, not serve it.

### Rollout ledger

- ✅ **Milestone 0** — Fixed `StudentProfilePage`'s broken "Save name"/
  "Update password" actions (pre-existing since the first commit, found
  during the audit): `student/api.ts` called `/users/me/` and
  `/users/password/change/`, routes that don't exist — the `users` app is
  mounted at `/auth/`. Pointed both at the correct, already-implemented
  `/auth/me/`/`/auth/password/change/` endpoints. Verified live: both
  actions now return real responses (200 / 400-on-bad-input) instead of
  404. Shipped first, before any experience-layer work, on the reasoning
  that a delightful layer on top of a broken save button is backwards.
- ⬜ Milestone 1 — Foundation primitives.
- ✅ **Milestone 2** — Student portal. `StudentDashboardPage` gained an
  `OnboardingChecklist` ("Getting started," 2 steps) computed purely from
  the dashboard's own already-fetched summary — zero new API calls.
  `StudentCoursesPage`'s zero-enrollment empty state gained a "New on
  TutorDoor" `DiscoveryRail` powered by the existing public course-list
  endpoint, query-gated so it never fires while enrollments exist.
  `ChatPage`'s empty conversation list (shared with Tutor) gained a
  role-appropriate action. Verified live against two real accounts with
  different data states; zero console errors, zero overflow, zero
  stuck-opacity under reduced motion.
- ✅ **Milestone 3** — Tutor portal. `TutorDashboardPage` gained an
  `OnboardingChecklist` (get a first booking, reach a first payout),
  computed from the dashboard's own already-fetched summary. `Verification
  Page`'s bare-paragraph "No documents uploaded yet" and
  `TutorCoursesPage`'s raw-div "No courses here yet" both upgraded to
  proper `EmptyState`s with real, actionable copy (naming the actual two
  required document types; a working "New course" button or "Complete
  verification" link depending on real verification status). Verified live
  against a fully-done account (checklist collapses) and a zero-progress
  pending account (checklist shows "0 of 2 done", empty states render
  correctly, populated courses page for that account unaffected).
- ✅ **Milestone 4** — Parent portal. `ParentChildrenPage`'s empty state
  gained a real action (invite modal, right there instead of requiring a
  scroll back to the header). `ParentProgressPage`'s zero-enrollment state
  gained a "New on TutorDoor" `DiscoveryRail`, query-gated to the true
  empty case. `ParentDashboardPage` deliberately left unchanged — it
  already has a complete, working empty state, and its single onboarding
  step is identical to what a checklist would say, so adding one would
  just repeat the same message. `ParentLinkConfirmPage`'s success state
  gained `celebrate()` — a real, one-time, earned family-connection
  moment. Verified live against the seeded parent account; zero
  regressions on the populated pages.
- ✅ **Milestone 5** — Institute portal. `InstituteDashboardPage` gained an
  `OnboardingChecklist` from its already-fetched profile object. A real
  Honesty-pillar fix: the rating `StatCard` no longer shows a misleading
  "0.0" when `rating_count` is 0 — the prior audit found no institute
  review system exists anywhere in the backend (unlike tutors/courses),
  so a real zero-tracked-rating case now reads "— / No reviews yet"
  instead of implying a real, tracked, below-average score. Tutor/Student
  roster empty states gained real invite/enroll actions. `/institute/
  courses` (a real nav item pointing at a generic placeholder stub) now
  carries an honest "Soon" tag via a new optional `soon?` field on the
  shared `DashboardNavItem` type — additive, no other portal's nav
  affected. Verified live against the seeded institute account.
- ✅ **Milestone 6** — Admin (verification pass, not a build pass, exactly
  as scoped). Spot-checked live: `AdminUsersPage`'s "No users match these
  filters" (a filtered-search result, not a first-time-use state) is
  already clear, honest, and correctly scoped — this is search feedback,
  not the start of a journey, and dressing it up with discovery/onboarding
  framing would violate the Honesty pillar rather than serve it. Zero code
  changes in this milestone, by design — the register-follows-stakes
  boundary from the Design DNA held.
- ⬜ Milestone 7 — Final review + implementation report.
