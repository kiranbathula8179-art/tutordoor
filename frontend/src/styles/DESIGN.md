# TutorDoor Design System

## Concept: "The tools of tutoring"

Instead of a generic SaaS gradient-and-rounded-card look, TutorDoor's visual
identity is grounded in the actual physical objects of a tutoring session:
a chalkboard, notebook paper, and a tutor's red-pen correction in the
margin of your homework. This is where students already expect trust
signals (grades, checkmarks, encouraging notes) to live.

## Palette

| Token          | Hex       | Use                                              |
|----------------|-----------|---------------------------------------------------|
| `board`        | `#1F3A34` | Primary dark surface (nav, footer, dark sections)  |
| `board-light`  | `#2D5147` | Secondary dark surface, hover states on dark       |
| `paper`        | `#F7F6F1` | Primary light background                           |
| `chalk`        | `#FDFBF3` | Text/icons on dark surfaces, card fills on `board`  |
| `ink`          | `#1B2B26` | Body text on light backgrounds                     |
| `pen-red`      | `#C23B32` | Primary CTA, corrections, destructive actions       |
| `gold-star`    | `#E8A93B` | Ratings, achievements, highlighter-style emphasis   |

## Type system

- **Fraunces** (display) — headlines only, set large. Has enough
  personality to carry a page without decoration.
- **IBM Plex Sans** (body/UI) — deliberately not Inter; slightly more
  humanist warmth while staying highly legible in dense dashboard UI.
- **IBM Plex Mono** (data) — session times, prices, IDs. Anything that
  benefits from tabular alignment.
- **Kalam** (annotation) — used sparingly, only for the "margin note"
  signature moments (see below). Never for body copy or interactive
  controls — it's a decorative accent, not a UI font.

## Signature element

The "red-pen circle": an SVG stroke-drawn circle/underline that animates
in around ratings, key numbers, and CTAs on hover/scroll-into-view
(`components/shared/RedPenCircle.tsx`). It's the one deliberately bold,
repeated motif — everything else stays quiet so it keeps its impact.

## Restraint rules

- Handwriting font (Kalam) appears in at most 1–2 spots per screen.
- Dashboards (logged-in product) are calmer than the marketing site:
  same palette and type system, but no hero-level animation — clarity
  and density win there.
- Motion respects `prefers-reduced-motion` throughout.
