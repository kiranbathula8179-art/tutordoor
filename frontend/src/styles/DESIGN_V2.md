> **SUPERSEDED** by DESIGN_V3.md (the "Bright" direction). Kept as design
> history; the motion engine (quality contract, celebrate) carried forward.

# TutorDoor Visual Evolution — "THE OBSERVATORY"

*Design constitution for v2. Every visual decision in the evolution traces back here.*

---

## The concept

v1 was **the tutor's desk** — chalkboard, paper, a red-pen circle. Intimate, warm, small.

v2 zooms out: **the observatory**. Learning as looking up — a student standing under a
living sky of everything they could come to know. Deep space is not "tech aesthetic"
here; it's the subject matter. Knowledge is the universe; tutors are the ones who hand
you the telescope.

One inherited thread survives the zoom-out: **the red-pen mark becomes the comet** — a
warm accent streaking through the cold palette. Continuity, not amnesia.

## Where cinema lives (the two-world rule)

| Surface | Treatment |
| --- | --- |
| Landing, auth, public pages | **Full cinema.** WebGL hero, scroll-driven storytelling, aurora environment, particles, custom cursor at full expression. |
| Portals (dashboards, search, wallet, chat) | **The same universe at working altitude.** Dark glass, aurora glow at the edges, physical micro-motion, live data as light — but zero heavy 3D competing with tasks. Checkout is sacred: delight *after* payment (celebration), never during. |

Award juries reward restraint deployed deliberately. So do users with rent to pay.

## Palette — "deep field"

| Token | Hex | Role |
| --- | --- | --- |
| `space-void` | `#050510` | The absolute background. Never pure black — space isn't. |
| `space-deep` | `#0A0A1F` | Primary dark surface |
| `space-night` | `#12122E` | Raised surfaces, cards |
| `aurora-cyan` | `#4FE3C1` | Primary energy — actions, live states |
| `aurora-violet` | `#8B5CF6` | Secondary energy — AI, insight |
| `aurora-indigo` | `#6366F1` | Tertiary — links, info |
| `comet` | `#FF6B5E` | The red pen, evolved. Warm accent, alerts, human moments |
| `starlight` | `#EDEFFF` | Text on dark. Slightly blue-white, like starlight is |
| `stardust` | `#9BA0C4` | Muted text on dark |

Glass: `rgba(237,239,255,0.04–0.10)` fills, `rgba(237,239,255,0.08–0.16)` borders,
`backdrop-blur` 12–24px. Glow is always a *colored shadow*, never a border.

The v1 palette (`board/paper/ink/pen-red/gold-star`) **remains defined** — legacy
surfaces keep working while the evolution rolls page by page. No big-bang breakage.

## Typography

- **Space Grotesk** — v2 display face. Geometric warmth, distinctive `G` and `t`,
  reads "engineered" without reading "crypto". Tracking: `-0.03em` at display sizes.
- **IBM Plex Sans** — continues as body. **IBM Plex Mono** — data, numbers, ledgers.
- Display sizes are *large*: hero 72–120px clamp, section heads 40–56px.
- Gradient text (`starlight → aurora-cyan → aurora-violet`) reserved for one phrase
  per screen. Everywhere = nowhere.

## Motion physics

- **Nothing merely fades.** Things *arrive*: translate + scale + blur-out with spring
  or `power3.out`/`expo.out` easings. Durations 0.6–1.2s for entrances, 0.15–0.3s for
  feedback.
- **Springs for the hand** (hover, press, magnetic, tilt — framer-motion), **timelines
  for the story** (scroll scenes, hero choreography — GSAP + ScrollTrigger + Lenis).
- Everything floats a little. Idle elements breathe (±4–8px, 6–10s organic loops,
  staggered phases so nothing syncs).
- The cursor is a light source: interfaces respond to proximity before click.

## The quality contract (non-negotiable)

1. `prefers-reduced-motion` collapses the world to a **beautiful still**: static
   gradients, no parallax, no particles, no smooth-scroll hijack, instant transitions.
   The still must look designed, not disabled.
2. **GPU tiers** (`high | medium | low`, heuristic at boot): particle counts, blur
   radii, and WebGL effects scale down; `low` gets the CSS-only environment. Battery
   savers and old laptops get a fast site, not a slideshow.
3. All ambient canvases pause on `visibilitychange`. rAF loops are singular and owned.
4. Custom cursor: fine pointers only; native cursor untouched on touch/reduced-motion.
5. Heavy scenes lazy-load behind `React.lazy` + suspense fallbacks that are themselves
   composed (the aurora gradient), so first paint never waits for three.js.
6. Contrast: `starlight` on `space-deep` = 15.4:1; `stardust` minimum usage is 4.6:1.
   Focus rings: 2px `aurora-cyan` outline + offset, always visible, never removed.

## Stack decisions (and trims)

Added, pinned for React 18: `three` + `@react-three/fiber@8` + `drei@9` +
`@react-three/postprocessing@2`, `gsap@3.12`, `lenis@1`.

**Trimmed from the brief**: react-spring (framer-motion already owns spring duty),
Lottie & Motion One (three animation runtimes is a performance story, five is a
confession). One runtime per job.

## Rollout order

1. ✅ **Foundation**: tokens, environment system, cursor, magnetic/tilt physics,
   smooth-scroll spine (Lenis scoped to the cinematic world).
2. ✅ Hero WebGL scene + landing rebuilt as scroll story (pinned How-it-works).
3. ✅ Auth as the airlock ("the reading lamp in the dome"; fabricated trust
   number removed).
4. ✅ Search — "tutors as constellation" (URL contract preserved verbatim).
5. ✅ Portal shell: Observatory chrome + luminous sheet for all five portals,
   sliding nav light, DARK_NATIVE_PREFIXES hatch.
6. ✅ Wallet & payments: the Vault (dark-native), ledger light-trail,
   celebrate() at confirmed-success points only.
7. ✅ Chat: presence pulse, honest session-scoped read receipts (activating the
   dormant read_receipt socket event), arrival physics gated to new messages.
8. ✅ Audit pass: unused-import sweep, a11y + cleanup verification, docs.
   Lighthouse tuning happens on real hardware after `npm install` + first run.

Still v1 (by staged design, on the luminous sheet or PublicLayout): tutor
public profile, public course pages, static/legal pages, and the remaining
portal pages. Each is one pass through the established system when wanted.
