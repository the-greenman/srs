> **GitHub issue**: [the-greenman/srs#41](https://github.com/the-greenman/srs/issues/41)

# RFC-011: DocumentView query extensions — lifecycle-state exclusion and repository-wide type queries

**Status**: Accepted (Revision 1)
**Affects**: `ext:views-l2` (`SectionSource.type-query`), `document-view.json` schema
**Author**: Peter Brownell
**Date**: 2026-06-25

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-25 | Initial draft and acceptance; spec records authored in srs/srs |

---

## Abstract

Adds three optional fields to `SectionSource.type-query` in `ext:views-l2`: `lifecycleStates` (multi-value inclusive lifecycle filter, OR semantics), `excludeLifecycleStates` (exclusion filter applied after inclusion), and `containerScope` (`"explicit" | "repository" | "subtree"` query boundary control). Together these enable the **decision-log pattern**: rendering all non-superseded/non-abandoned decisions across a repository without maintaining a static `containerIds[]` list.

---

## Motivation

### Problem 1 — Single-state lifecycle filter is insufficient

The existing `lifecycleState?: string` field on `SectionSource.type-query` can only match one state. Queries that need to include records in multiple states (e.g. both `draft` and `active`) require multiple sections, which duplicates ordering and rendering configuration.

### Problem 2 — No way to exclude lifecycle states

The decision-log pattern requires excluding `superseded` and `abandoned` records rather than enumerating all valid states. An exclusion filter is more forward-compatible: as new lifecycle states are added, existing DocumentViews continue to work without update.

### Problem 3 — Container scope is always explicit

`type-query` sections must list explicit `containerIds[]`. For a repository-wide decision log, the author must maintain this list as containers are added — a significant operational burden.

---

## Proposed Changes

### Change A — `lifecycleStates?: string[]`

Add optional `lifecycleStates?: string[]` to `SectionSource.type-query`. When present and non-empty, the query result MUST include only Records whose `lifecycleState` matches one of the listed values (multi-value OR semantics). When absent or empty, all lifecycle states are included. Requires `ext:lifecycle`; implementations without `ext:lifecycle` MUST treat this field as absent. Invariant I-011-1.

The singular `lifecycleState` field remains as a back-compat single-state filter; `lifecycleStates` is the preferred form when multiple states are needed.

### Change B — `excludeLifecycleStates?: string[]`

Add optional `excludeLifecycleStates?: string[]` to `SectionSource.type-query`. When present and non-empty, the query result MUST exclude Records whose `lifecycleState` matches any listed value. When both `lifecycleStates` and `excludeLifecycleStates` are present, inclusion is applied first, then exclusion. A Record with no `lifecycleState` is NOT excluded by `excludeLifecycleStates`. Requires `ext:lifecycle`; implementations without `ext:lifecycle` MUST treat this field as absent. Invariant I-011-2.

### Change C — `containerScope?: "explicit" | "repository" | "subtree"`

Add optional `containerScope?: "explicit" | "repository" | "subtree"` to `SectionSource.type-query`. Default is `"explicit"` (existing behaviour: scope to `containerIds[]`). When `"repository"`, the query spans all containers in the repository and `containerIds[]` is ignored. When `"subtree"`, the query spans the context container and all containers reachable by `contains` relations from each entry in `containerIds[]`; when `containerIds[]` is absent or empty, the context container is used as the subtree root. Absent is equivalent to `"explicit"`. Invariant I-011-3.

---

## Conformance Rules

> **[I-011-1]** When `SectionSource.type-query` carries a non-empty `lifecycleStates` array, implementations MUST restrict the query result to Records whose `lifecycleState` matches any value in that array (OR semantics). A Record with no `lifecycleState` MUST be excluded when `lifecycleStates` is present and non-empty. When `lifecycleStates` is absent or empty, no filtering by this field is applied and all lifecycle states (including absent) are included. Implementations that do not declare `ext:lifecycle` MUST ignore `lifecycleStates` and MUST NOT produce a validation error on its presence.
>
> **[I-011-2]** When `SectionSource.type-query` carries a non-empty `excludeLifecycleStates` array, implementations MUST exclude from the query result any Record whose `lifecycleState` matches any value in the array. When `lifecycleStates` and `excludeLifecycleStates` are both present and non-empty, inclusion filtering (I-011-1) MUST be applied first; exclusion filtering is then applied to the survivors. A Record with no `lifecycleState` is not excluded by `excludeLifecycleStates` (only Records with a matching non-null `lifecycleState` are excluded). When `excludeLifecycleStates` is absent or empty, no exclusion is applied. Implementations that do not declare `ext:lifecycle` MUST ignore `excludeLifecycleStates` and MUST NOT produce a validation error on its presence.
>
> **[I-011-3]** When `SectionSource.type-query` carries `containerScope`, implementations MUST apply the following scoping rules: (a) When `containerScope` is absent or `"explicit"`, the query is scoped to `containerIds[]` — existing behaviour. An absent `containerIds[]` with explicit scope produces an empty result. (b) When `containerScope` is `"repository"`, the query spans all containers in the repository; `containerIds[]` MUST be ignored. (c) When `containerScope` is `"subtree"`, the query spans the context container and all containers reachable by `contains` relations from each container in `containerIds[]`; when `containerIds[]` is absent or empty, the context container is used as the subtree root. An implementation that cannot determine the context container for a subtree query MUST treat it as `"explicit"` with an empty `containerIds[]` and SHOULD emit a diagnostic. Implementations MUST NOT produce a validation error when `containerScope` is absent; absent is equivalent to `"explicit"`.

---

## Schema changes

| Schema file | Change |
|---|---|
| `document-view.json` | Add `lifecycleStates`, `excludeLifecycleStates`, `containerScope` to the `type-query` variant of `SectionSource` |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

---

## Rationale

**Multi-value OR semantics** (`lifecycleStates`) mirrors `typeFilter` and enables queries that span multiple lifecycle stages (e.g. `draft` and `active`). The `ext:lifecycle` guard ensures that implementations without a lifecycle model are not broken by the field.

**Exclusion is more forward-compatible than inclusion** for the decision-log pattern: specifying `excludeLifecycleStates: ["superseded", "abandoned"]` automatically includes any new lifecycle states added in future without DocumentView updates.

**Three-value enum** rather than a boolean for `containerScope` because the `subtree` case has meaningfully different semantics from both `explicit` and `repository`. Backward compatibility is preserved by treating absent as `"explicit"`.

---

## Alternatives Considered

### Alt A — Multiple sections instead of `lifecycleStates`

One section per lifecycle state. Rejected because it duplicates rendering configuration and requires coordinated updates when states change.

### Alt B — Boolean `repositoryScope` instead of `containerScope` enum

A simple boolean would cover `"explicit"` vs `"repository"` but not the `"subtree"` case. Rejected because subtree scope is a real need for hierarchical repositories.

---

## Open Questions

**None.**
