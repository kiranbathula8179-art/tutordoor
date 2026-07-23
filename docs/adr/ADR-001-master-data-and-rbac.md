# ADR-001 — Master Data Engine & Dynamic RBAC

**Status**: Accepted · Implemented (rollouts ①–⑤) · **Date**: July 2026 · **Scope**: Backend architecture for the
"database-driven, no hardcoded business options" mandate.

---

## Context

The mandate: business vocabulary (roles, subjects, grades, document types, plans,
templates, …) must live in the database and be manageable through an admin panel —
no source changes for business changes. All existing features must keep working;
no breaking changes.

The existing codebase already database-drives its *rich* entities: `Subject` +
`SubjectCategory`, `SubscriptionPlan`, `Coupon`. What remains hardcoded are
Django `TextChoices` enums and mirrored frontend option arrays.

## Decision 1 — Vocabulary is data; state machines are code

Not every "option" is a business option. We split hardcoded choices into two
classes and treat them differently on purpose:

**Vocabulary** (moves to the database — the Master Data Engine):
labels a human picks from, where adding/renaming a value changes no control
flow: `grade_level`, `skill_level` (unifies tutor expertise + course level),
`document_type` (verification), `relationship_type` (parent links), `language`,
`tutor_specialization`, `student_interest`, `institute_type`, `badge_type`,
`certificate_type`, `cancellation_reason`, `country`/`state`/`city` reference
lists, and `notification_template` (subject/body in item metadata).

**State machines** (stay as code enums, deliberately):
values the system *branches on* — `booking.status`, `payment.status`,
`enrollment.status`, `transaction_type`, `gateway`, and `teaching_mode`
(online vs offline selects Jitsi-room vs location logic and the exclusion
semantics). An admin renaming `confirmed` at 2 a.m. must not be able to break
payout dispatch. These are program states wearing string clothes; the admin
panel is not their home. This is the one place this ADR consciously narrows
the brief, and it is what "enterprise-grade" actually requires.

**Migration strategy for existing columns**: fields like
`StudentProfile.grade_level` keep their column and stored values; the
`choices=` constraint moves from the model to the service/serializer layer,
validated against *active master items* (`validate_master_code`). Seeded
master items reproduce every current enum value, so all existing rows remain
valid — backward compatibility by construction, and new values require no
migration.

## Decision 2 — One engine, not twenty tables

A generic registry beats twenty near-identical CRUD stacks:

- `MasterDataType(code, name, description, is_system)` — the registry.
- `MasterDataItem(type, code, label, description, sort_order, is_active,
  metadata JSON)` — unique `(type, code)`; `metadata` carries per-type extras
  (e.g. a template's subject/body, a city's state code).
- `MasterDataAuditLog(actor, action, type_code, item_code, changes)` — every
  mutation, with a field-level diff.

Rich entities that already have structure (`Subject`, `SubscriptionPlan`)
**stay as first-class models** — flattening them into the generic engine would
lose relations and logic for ideology's sake.

API surface: public `GET /master-data/bootstrap/?types=a,b,c` (one round-trip
for the frontend's option lists, active items only) and
`GET /master-data/<type>/`; admin CRUD + activate/deactivate + search +
pagination + CSV import/export + audit listing, all `IsPlatformAdmin`.

## Decision 3 — Roles: dynamic labels & permissions over fixed archetypes

Five **structural archetypes** exist in this product — student, tutor, parent,
institute_admin, admin — each owning a distinct profile *data model* and a
distinct *portal UI*. A database row cannot conjure a new data model or a new
frontend; pretending otherwise ships a lie.

Every new-role example in the brief (Mentor, Music Teacher, Coding Instructor,
Exam Consultant, Corporate Trainer, Language Coach, Career Counselor) is
structurally a **tutor**: teaches, has availability, gets booked, gets paid.
So the honest dynamic-RBAC design is a layer *above* archetypes:

- `Permission(codename, name, module)` — registry, seeded from code.
- `Role(code, name, description, archetype, is_system, is_active)` — DB rows;
  `archetype` routes portal + profile behavior.
- `RolePermission`, `UserRoleAssignment` — M2M with audit fields.

Creating "Music Teacher" = one admin action: new Role (archetype=tutor) with a
chosen permission set and display identity. Zero code changes — genuinely.

**Backward compatibility**: `User.role` remains and now means *archetype*.
The five system roles are seeded 1:1; existing users get matching
`UserRoleAssignment`s via data migration. Existing permission classes
(`IsTutor`, `IsPlatformAdmin`, …) keep working unchanged; a new
`HasPermission("module.action")` class is added alongside and adopted
incrementally where finer-grained control pays for itself. Nothing breaks on
day one; everything can tighten over time.

## Consequences

- Business vocabulary changes: admin panel, no deploy. ✔
- New tutor-like roles: admin panel, no deploy. ✔
- New *archetypes* (a genuinely new kind of actor with its own data + portal):
  still an engineering project — stated plainly rather than promised falsely.
- Frontend option arrays are replaced by a `useMasterData()` hook over the
  bootstrap endpoint (own rollout pass), with React Query caching.
- Rollout order: ① engine (this ADR's pass) → ② RBAC → ③ frontend adoption →
  ④ Master Data Admin UI → ⑤ import/export & audit polish, docs.
