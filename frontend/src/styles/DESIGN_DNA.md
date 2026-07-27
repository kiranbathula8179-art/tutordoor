# TutorDoor Design DNA

*A constitution, not a theme. No screens are described here — only the
principles every screen, animation, interaction, illustration, component,
and feature must obey, for as long as TutorDoor exists. The metaphors that
helped find these principles (an academy, a workshop, a map) are gone.
What they pointed at remains.*

---

**Status: approved v1.1.** Approved as the permanent design constitution;
all future design work must comply. Amended once (Principle 7, below) after
the V7 compliance audit. Committed to the repo here so it survives as a
written reference rather than session memory alone — it previously existed
only as a published document outside version control.

---

## What this document is

Every design language TutorDoor builds — this year's palette, this year's
typography, this year's motion system — will eventually be replaced. Trends
move, frameworks change, and a decade from now the actual pixels will look
nothing like they do today. This document is not those pixels. It is the
layer underneath them: the things that should still be true after
everything visual has changed at least twice. When a future redesign asks
"does this still feel like TutorDoor," this is the document that answers,
regardless of what technology renders the answer.

Ten principles, grouped under four pillars. Each one states a rule,
explains why the rule is permanent rather than fashionable, and names what
it rules out.

---

## Pillar I — Honesty

*The root constraint. Everything else in this document can bend before this
one does.*

### 1. Nothing is invented.

No fabricated numbers, no invented testimonials, no implied capability
that doesn't exist, no manufactured urgency, no dark patterns dressed as
delight. If a real fact would serve the design better than a polished fake
one, the real fact wins even when it's smaller, slower, or less
impressive.

**Why permanent:** this isn't a style choice, it's the actual product
being sold. TutorDoor's entire value to a parent is that it can be trusted
with their child. One invented statistic, discovered once, costs more
trust than a hundred honest ones build. No future technology changes this
math.

**What it rules out:** inflated counts, fake reviews, countdown timers on
things that aren't actually running out, "AI-powered" claims for features
that aren't, any dashboard or interface designed to flatter a metric
instead of report it truthfully.

### 2. Progress is evidence, not a score.

Growth, achievement, and history are represented as accumulated, real
evidence of time and effort — never as an abstract number that can spike,
crash, or reset someone's sense of their own capability in an instant.

**Why permanent:** a percentage is a technology-era artifact (databases
like counting things). A person's sense of their own progress is not a
database concern — it's psychological, and it doesn't reset just because a
counter does. This principle will matter exactly as much when the medium
isn't even a screen.

**What it rules out:** streak mechanics that punish a missed day harder
than they reward a kept one, leaderboards imposed on people who didn't ask
to compete, any progress indicator designed to create anxiety rather than
reflect reality.

---

## Pillar II — Proportion

*Attention, ceremony, and emotional weight are budgets. Spending them
everywhere spends them on nothing.*

### 3. Emphasis is earned by real stakes, not by design ambition.

The amount of craft, ceremony, and visual weight given to a moment must be
proportional to what that moment actually means to the person experiencing
it — not to how much a designer wants to show off. A handful of genuine
commitments (a first real decision, a completed milestone) deserve
disproportionate care. Everything else should get out of the way.

**Why permanent:** the value of a special moment is entirely a function of
scarcity. This is a fact about human attention, not about any particular
design trend, and it will be true under any future medium.

**What it rules out:** decorative animation with no informational purpose,
a beautiful flourish repeated so often it becomes wallpaper, ceremony
imposed on routine actions (an elaborate reveal for something that happens
fifty times a day loses all its meaning by the third time).

### 4. The emotional register follows the stakes, not the page.

Expression, atmosphere, and personality are appropriate wherever
exploration is safe and nothing is being decided yet. The instant real
trust, money, or a real decision enters the moment, the register shifts to
something plain, fast, and completely unambiguous — every time, without
exception, regardless of how beautiful the atmospheric version would have
been.

**Why permanent:** this is a fact about how humans evaluate risk, not a
stylistic preference — a person deciding whether to trust a stranger with
their child, or complete a payment, needs clarity more than they need
beauty, permanently, on any device, in any era.

**What it rules out:** poetic language or heavy atmosphere anywhere near
verification, pricing, payment, or a legal decision. Whimsy is for
browsing. It is never for the moment someone is actually deciding.

### 5. The product is patient by design, never urgent by manufacture.

Pacing favors calm over pressure as a permanent, structural choice — not a
limitation to be fixed later, but a deliberate competitive stance. Real
scarcity is disclosed plainly when it exists. It is never implied when it
doesn't.

**Why permanent:** urgency mechanics are a technique, and techniques age —
what doesn't age is the trust cost of having used one and been caught. A
brand known for never doing this is worth more, for longer, than any
short-term lift urgency could produce.

**What it rules out:** countdown timers, fake "X people are looking at
this," artificial scarcity, notification design engineered for anxiety
instead of usefulness.

---

## Pillar III — Coherence

*Every surface belongs to one world. A patchwork of independently pretty
decisions is not a design language.*

### 6. Everything belongs to one consistent, physically plausible world.

Light, material, color, and shadow behave as though they come from one
coherent source and one coherent logic across the entire product — never
as independently chosen decorative choices stacked next to each other.

**Why permanent:** this is the actual mechanism by which a human eye
recognizes "a considered place" versus "a set of assembled parts," and
that perceptual fact doesn't depend on whether the rendering technology is
a stylesheet, a game engine, or something not yet invented.

**What it rules out:** gradients, effects, or color choices justified by
"it looks nice here" rather than by consistency with everything else on
the page. A component that would look wrong if placed next to any other
component in the product needs to change, not the rule.

### 7. Motion exists only to communicate a real change.

Anything that moves does so because something true changed — a state, a
value, a location in a process — and the motion's character (speed,
weight, ease) should tell the truth about what changed. Motion with no
informational job is decoration, and decoration is not this brand's
language.

**Why permanent:** this is a semantic rule about what motion is *for*,
independent of the specific animation technology used to produce it — it
will be exactly as valid whether motion is expressed through code today or
through something else entirely later.

**What it rules out:** animation added because a competitor has animation,
motion that exists to seem "alive" rather than to communicate, any effect
that would need to be described as "just for liveliness" if someone asked
what it was for.

> **Clarification (recorded after the V7 compliance audit):** Principle 7
> governs *interface* motion — buttons, cards, panels, anything interactive
> or content-bearing. It does not govern continuous *environmental* motion
> (ambient background atmosphere, light drift) when that motion is subtle,
> non-interactive, performance-conscious, and fully respects
> reduced-motion preferences. A room's light moving across it over the
> course of a day isn't "meaningless" in the way an element jiggling for no
> reason is — the two are different categories, and this principle was
> always aimed at the second one.

---

## Pillar IV — Respect

*For the people shown, the people using it, and the parts nobody is
watching.*

### 8. Every real person shown is shown with dignity, never as inventory.

Anyone represented on the platform — a tutor, a student, a parent — is
presented as a specific, respected individual doing something real, never
reduced to a row in a list, a stock photo, or a stereotype standing in for
a category of person.

**Why permanent:** this is a statement about how the product treats the
humans it depends on, not a visual style — and the humans it depends on
(particularly the tutors, whose professional dignity is core to why they'd
choose this platform over gig-work alternatives) don't stop needing that
respect because a decade passed.

**What it rules out:** any presentation of a supply-side user (a tutor)
that reads as "inventory to be browsed" rather than "a professional to be
met," generic stock-photography substitutes for real specificity, treating
a person's real data as raw material for a cleverer layout than their
honesty deserves.

### 9. Legibility and accessibility are the first draft, not a pass applied later.

Every interaction must work correctly with a keyboard alone, be
understandable to a screen reader without a spatial or visual analog
required, and remain usable at reduced or zero motion — designed in from
the start, never patched in afterward.

**Why permanent:** this is about the actual human on the other end of the
product, and that human's needs don't change because the visual trends
around them do. A decade of technology change will not change what a
screen reader needs to correctly announce.

**What it rules out:** any interaction whose only explanation is "you have
to see it to understand it," any navigation model with no accessible
non-visual equivalent, any feature shipped with accessibility deferred to
"a later pass."

### 10. The brand is judged by its quietest, least-watched moment.

An error message, an empty state, a declined action, a cancellation flow,
a 404 — these get exactly the same rigor, tone discipline, and craft as
the most-photographed screen in the product, because the moments nobody
screenshots are the moments that most honestly reveal what a brand
actually believes about the person using it.

**Why permanent:** this is true of every well-made object in every era —
the tolerances that matter most are the ones under the surface, not the
ones on the showroom floor — and it will remain the actual test of craft
long after any specific visual system has been replaced.

**What it rules out:** a beautiful hero section sitting on top of a
careless error state, launch-week attention paid only to the screens that
will be in the demo, any part of the product treated as "good enough"
because it's rarely seen.

---

## How to use this document

Before any future design decision ships — a new feature, a new page, a new
interaction, in any technology, at any point in the next ten years — it
should be checked against these ten principles honestly, not defensively.
If a proposed idea only survives by explaining away one of these rules
("well, it's fine *this time*"), the idea is wrong, not the rule. If
following every principle here still produces something that could belong
to a different company, the execution is missing — the principles are
working correctly and the specific expression needs more, not different,
thought.

This document does not describe what TutorDoor looks like. It describes
what TutorDoor is willing to be, regardless of what it looks like next.
