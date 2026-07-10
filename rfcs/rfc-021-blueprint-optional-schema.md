# RFC-021: Make `$schema` optional in `blueprint.json`

**Status**: Draft (Revision 2)
**Affects**: `docs/schema/2.0/blueprint.json` — `required` array
**Author**: the-greenman (from issue the-greenman/srs-rust#355)
**Date**: 2026-07-10

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-09 | Initial draft (srs#150) |
| 2 | 2026-07-10 | Fix Problem 3 (factual accuracy); rewrite R3 to observable-behaviour language; correct schema-sync merge order; remove ADR-004 reference |

---

## Abstract

The `blueprint.json` schema declares `$schema` as a required property. However,
blueprint definition files written to disk do not include a `$schema` field. This
mismatch means JSON Schema validation always fails on real blueprint files with
"required property '$schema' is missing". This RFC removes `$schema` from the
`required` array — making it optional — so the schema can validate real blueprint
files without changing any data on disk.

---

## Motivation

### Problem 1 — Schema is unusable for validating real blueprint files

The registered `blueprint.json` schema cannot successfully validate any blueprint
file produced by the canonical implementation, because every such file omits
`$schema`. Validation fails before any blueprint-specific constraint is checked,
causing implementations to fall back to semantic-only validation. The registered
schema has no practical effect.

### Problem 2 — Footgun for future schema consumers

Any caller that attempts to validate a blueprint file against the registered schema
will get a false negative on the `$schema` field check before any blueprint-specific
constraint is reached. This makes it harder to add new schema-validated constraints
to blueprints in the future.

### Problem 3 — Schema constraint does not match file content

Blueprint definition files are written to disk without a `$schema` field. The
`required` constraint in `blueprint.json` does not reflect actual blueprint file
content. The `$schema` property is present in the schema's `properties` object (for
IDE tooling and schema URL resolution) but is not written to blueprint files on disk.
Making `$schema` optional aligns the schema with actual file content.

---

## Proposed Changes

### Change A — Remove `$schema` from the `required` array in `blueprint.json`

Change the `required` array in `docs/schema/2.0/blueprint.json` from:

```json
"required": ["$schema", "id", "namespace", "name", "version", "description", "rootTypes", "createdAt"]
```

to:

```json
"required": ["id", "namespace", "name", "version", "description", "rootTypes", "createdAt"]
```

The `$schema` property definition remains in the `properties` object — it is still
valid on disk and useful for IDE tooling and direct schema URL resolution. It becomes
an **optional** annotated property rather than a required one.

No other changes to `blueprint.json` are made by this RFC.

---

## Conformance Rules

> **[R1]** A conformant SRS implementation MUST NOT require `$schema` to be present
> in a blueprint definition file. A blueprint file that omits `$schema` but satisfies
> all other required fields (`id`, `namespace`, `name`, `version`, `description`,
> `rootTypes`, `createdAt`) is valid.

> **[R2]** A conformant SRS implementation MAY accept `$schema` when present in a
> blueprint definition file, and when present its value MUST equal
> `"https://srs.semanticops.com/schema/2.0/blueprint.json"` (as constrained by the
> existing `const` in `properties.$schema`). When absent, no `$schema` constraint
> applies.

> **[R3]** A conformant SRS implementation MUST validate blueprint definition files
> against `blueprint.json` as the authoritative JSON Schema for blueprint instances.
> A blueprint file that satisfies all required fields but omits `$schema` MUST pass
> full JSON Schema validation.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/blueprint.json` | Remove `"$schema"` from the `required` array. No other changes. |

Schema changes must be synced to the implementation mirrors. The mirror PRs MUST be
merged **before** the `srs` spec PR — the drift-check CI in `srs` validates that
mirror copies are up to date at HEAD:

- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`
  in srs-rust)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

The follow-up implementation (srs-rust#355) adds full JSON Schema validation for
blueprints once this schema change lands.

---

## Rationale

**Why make it optional rather than removing the property entirely?** Removing
`$schema` from `properties` would break IDE tooling (VS Code JSON language server,
etc.) that uses the `$schema` URL for auto-complete and inline validation. Keeping
`$schema` as an optional, annotated property preserves IDE support while enabling
JSON Schema validation of real files.

**Why not add `$schema` to blueprint files written by the implementation?** Blueprint
files on disk do not include `$schema`. Adding it would break existing blueprint files
under strict validation and requires migrating all existing repositories. Making the
field optional is a backwards-compatible, no-migration change.

**Why not use a separate "lax" schema for validation?** Maintaining two schemas for
the same entity (one for IDE, one for validation) creates a synchronisation burden
and violates the intent that the registered schema is the authoritative contract. A
single schema with the correct optionality is cleaner.

---

## Alternatives Considered

### Alt A — Add `$schema` to blueprint files written by the implementation

Would bring files into conformance with the current schema. Rejected: would require
migrating all existing blueprint files; inconsistent with how blueprint files are
authored today.

### Alt B — Remove `$schema` from `blueprint.json` properties entirely

Would also fix validation. Rejected: breaks IDE auto-complete and inline validation
in editors that use the `$schema` URL for schema resolution.

### Alt C — Keep the fallback and accept that blueprint JSON Schema validation is inoperative

No change. Rejected: leaves a registered schema that cannot validate real files;
makes future blueprint constraint additions harder.

---

## Open Questions

**None.** The change is a one-line removal in the `required` array; the intent and
impact are unambiguous.
