> **GitHub issue**: [the-greenman/srs#17](https://github.com/the-greenman/srs/issues/17)

# RFC-008: Heterogeneous ContainerSubset Sections — `typeFilter` and `typeDispatch`

**Status**: Draft (Revision 3)
**Affects**: `ext:views-l2` (`DocumentView.DocumentSection`, `SectionSource` `container-subset` variant), `document-view.json` schema. Builds on base-spec ordering Rule **[N+12]** and heterogeneous-heading Rule **[N+1]** (both `ext:views-l2`, from RFC-001).
**Author**: Peter Brownell
**Date**: 2026-06-07

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-07 | Initial draft: `typeFilter` on `container-subset` source (Change A); `typeDispatch` on `DocumentSection` (Change B); resolutions to the five open questions carried from issue #17 |
| 2 | 2026-06-07 | Address Spec Integrity + RFC Completeness review: align ordering with base-spec Rule [N+12] (topological sort + `createdAt` tiebreak) and drop the conflicting "transitive closure" framing; cite [N+12] as the ordering foundation; define "resolved type" as the `typeId`-resolved canonical `namespace/name` ([DV-Mx1]); add typeless-member (Tier 0/1) handling ([DV-Dx4], [DV-Fx5]); state `typeFilter` is `container-subset`-only and `typeDispatch` is source-agnostic; add titleFieldId/[N+1] interaction note; add "Relationship to RFC-007"; spell out inner schema shapes and value-constraint enforcement point; correct schema-sync script path; note deliberate B-first ordering |
| 3 | 2026-06-07 | Address round-2 review (zero blocking): add [DV-Dx5] making source ordering normative (`container-subset` → [N+12]; `fixed-instances` → `instanceIds[]` order); specify fallback-`renderViewId` type-mismatch degradation in [DV-Dx3]; add unresolvable-`typeId` case to [DV-Fx5]; add packaged bare-key portability clause to [DV-Mx1]; cite base-spec baseline rule [N]; name the canonical schema file and note `check-schema-sync.sh` verifies both crate and vscode copies; add `titleFieldId`-description schema-drift fix to the Schema changes table |

---

## Abstract

A `ext:views-l2` document view that renders heterogeneous container members cannot today honour the authored cross-type reading order while also rendering each record type with its own `ext:views-l1` view. Authors are forced to use one `type-query` section per record type, which groups output by type and destroys the `precedes`-relation sequence that spans those types. This RFC adds two backward-compatible, independently adoptable fields to `document-view.json`: **Change B** — `typeDispatch` on `DocumentSection`, selecting an L1 view per record's resolved type within a single section — and **Change A** — `typeFilter` on the `container-subset` source, restricting a section to a subset of member types while preserving the container-wide ordering. Change B is the change that unblocks correct cross-type interleaving (srs-rust#35); Change A is a complementary capability for typed-subset sections.

---

## Motivation

### Problem 1 — Cross-type reading order is lost when sections map 1:1 to types

The `type-query` source fetches a homogeneous set of records. `precedes`-chain sorting therefore applies only *within* one type's result set. When a document's authored sequence interleaves record types, an author must emit one `type-query` section per type, and the renderer groups all records of the first type, then all records of the second, and so on.

**Concrete example** (srs-rust#35). Guide `recognising-decisions` orders its sections by a `precedes` chain that spans two types:

1. `process` — `section.text`
2. `hidden-decisions` — `section.table`
3. `questions-for-clarity` — `section.table`
4. `translating-language` — `section.table`

With one `type-query` section per type the rendered output becomes:

- `## Text Sections` → process
- `## Table Sections` → hidden-decisions, questions-for-clarity, translating-language

The authored sequence (text, table, table, table) is destroyed. Cross-type interleaving is structurally impossible with the current schema when sections map 1:1 to types.

### Problem 2 — A single section cannot render heterogeneous members with per-type views

The existing `container-subset` source already fetches *all* container members and orders them across types by base-spec Rule **[N+12]** (`ext:views-l2`): "order the member instances by the `precedes` relation chain among them (topological sort); instances not connected by any `precedes` relation are ordered by `createdAt` ascending as a tiebreak; when `ordering.direction` is `desc`, this ordering is reversed." That is exactly the ordering Problem 1 needs. But `DocumentSection.renderViewId` is a single L1 view UUID, and an L1 view renders the fields of exactly one type. A `container-subset` section containing mixed types therefore cannot style `section.text` records differently from `section.table` records — it can only fall back to the default rendering baseline for all of them. Correct heterogeneous rendering needs per-type view dispatch within the one section.

These two problems compose: `container-subset` already gives correct cross-type ordering via [N+12]; the missing piece for the blocking use case is per-type rendering (Change B). Filtering a `container-subset` to a typed subset (Change A) is a distinct, secondary capability that refines [N+12] over a restricted member set.

---

## Proposed Changes

> **Ordering of this section.** Change B is presented first because it is the change that unblocks srs-rust#35; Change A is the complementary, secondary capability. Every other section of this RFC lists them in A-then-B (schema) order.

**Definition — "resolved type".** Throughout this RFC, a record's *resolved type* is the canonical `namespace/name` of the Type obtained by resolving the record's `typeId` against the package, **not** the record's denormalized `typeNamespace`/`typeName` hints. Where the denormalized hints conflict with the resolved Type, the `typeId` wins and the record is already invalid (base data model); dispatch and filtering against such a record are undefined and the record falls through to the default behaviour. Tier 0 (Note) and Tier 1 (TypedRecord) members have no `typeId` and therefore no resolved type — their handling is specified in [DV-Dx4] and [DV-Fx5].

### Change B — per-type render dispatch on `DocumentSection` (`typeDispatch`)

Add an optional `typeDispatch` object to `DocumentSection`. Keys are record type identifiers in `namespace/name` form; values are L1 view UUIDs.

```json
{
  "sectionId": "sections",
  "order": 0,
  "source": { "type": "container-subset", "containerId": "<uuid>" },
  "typeDispatch": {
    "com.example/section-text":  "<view-uuid-A>",
    "com.example/section-table": "<view-uuid-B>"
  }
}
```

Shape:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `typeDispatch` | object | no | Map from a record's resolved type key (`namespace/name`) to the L1 view UUID used to render records of that type within this section. |

Resolution order for rendering a record in a section:

1. If `typeDispatch` is present **and** contains an entry whose key matches the record's resolved type, use that view.
2. Otherwise, if `renderViewId` is present, use it.
3. Otherwise, use the default rendering baseline.

The type key is `namespace/name` **without** version: dispatch selection MUST NOT change when a record binds to a newer version of the same `namespace/name` type lineage. `typeDispatch` is independent of the section's `source` variant — it applies to any source that can yield heterogeneous members (most usefully `container-subset` and `fixed-instances`). `typeDispatch` selects *how* each member renders; it never changes member *order*. Order is governed entirely by the source: [N+12] for `container-subset`, and the declared `instanceIds[]` array order for `fixed-instances`.

`typeDispatch` does not alter the existing heterogeneous-heading behaviour: per base-spec Rule **[N+1]**, when a section sets `titleFieldId` and a member's type does not carry that field, the per-record heading is omitted for that member (not a render failure). This already supports the mixed-type sections that `typeDispatch` targets.

### Change A — type restriction on the `container-subset` source (`typeFilter`)

Add an optional `typeFilter` array of `namespace/name` strings to the `container-subset` variant of `SectionSource`.

```json
{
  "type": "container-subset",
  "containerId": "<uuid>",
  "typeFilter": ["com.example/section-table"]
}
```

Shape:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `typeFilter` | array of string (`namespace/name`) | no | When present, only container members whose resolved type matches one of the listed keys are included in the section. |

`typeFilter` is exclusive to the `container-subset` source variant; it is not added to `fixed-instances`, `type-query` (already type-scoped), or `relation-query`.

Semantics:

- When `typeFilter` is absent or empty, the source behaves exactly as today (all container members).
- When present, the member set is filtered to records whose resolved type matches one of the listed `namespace/name` keys (version-independent, as for `typeDispatch`).
- **Ordering is the base-spec [N+12] order computed over the full container, then projected onto the filtered subset (filter-then-project).** Concretely: run [N+12] (topological sort by `precedes` with `createdAt`-ascending tiebreak, reversed when `ordering.direction` is `desc`) across all container members, then drop the non-surviving members from that sequence. This preserves the relative order of survivors even when an excluded member was a `precedes` bridge between two survivors, and inherits [N+12]'s tiebreak for survivors not connected by `precedes` (see [DV-Fx3]). Filtering changes *which* members appear, never the [N+12] order among those that remain.
- `typeFilter` and `typeDispatch` are orthogonal and may be combined on the same section: `typeFilter` selects which records appear; `typeDispatch` selects how each appearing record is rendered.

### Interaction with field-based `ordering`

When a section carries both a `container-subset` source (with or without `typeFilter`) and a field-based `ordering.fieldId`, `typeFilter` is applied first to select the member set, and then `ordering` determines the sequence. Per [N+12], declaring `ordering.fieldId` already replaces the `precedes`-chain ordering with field-value ordering; [DV-Fx3]'s filter-then-project rule therefore governs only the `precedes`-derived case and is moot when `ordering.fieldId` is set (the field sort runs over the filtered survivors).

### Relationship to RFC-007 (Composite Group Rendering)

RFC-007 governs *intra-record* rendering — how a single record's `FieldGroup` fields compose (e.g. `compositeRenderer: "table"` turning `columns`/`rows`/`widths` into a rendered table). RFC-008 governs *inter-record* concerns — which records appear in a section (`typeFilter`) and which L1 view renders each (`typeDispatch`). The two layer cleanly and do not conflict: `typeDispatch` selects the L1 view for a `section.table` record, and that view's group rendering then proceeds per RFC-007 unchanged. The motivating `recognising-decisions` guide exercises both — RFC-008 places the `section.table` records in the correct interleaved order and dispatches them to the table view; RFC-007 renders each table's group fields.

---

## Conformance Rules

> **[DV-Mx1]** For both `typeDispatch` and `typeFilter`, a record's *resolved type* used for matching MUST be the canonical `namespace/name` of the Type obtained by resolving the record's `typeId` against the package. Implementations MUST NOT match against the record's denormalized `typeNamespace`/`typeName` hints. Matching MUST compare `namespace/name` only and MUST ignore the Type version. A member with no `typeId` (Tier 0 Note, Tier 1 TypedRecord) has no resolved type. A bare `name` key or filter entry (no namespace) in a DocumentView included in a Package has undefined portability, mirroring base-spec Rule 32 for `semanticObjectType`.

> **[DV-Dx1]** A `DocumentSection` MAY carry a `typeDispatch` object. Each key MUST be a record type identifier in `namespace/name` form; bare `name` keys are permitted only in single-system DocumentViews not included in a Package (matching the `semanticObjectType` convention of the `type-query` source). Each value MUST be a UUID referencing an `ext:views-l1` View. The value-is-UUID and view-exists constraints are enforced at render/package-validation time, not by the JSON Schema (consistent with `renderViewId` and base-spec Rule 35).

> **[DV-Dx2]** When rendering a record within a section, an implementation MUST resolve the render view in this order: (1) the `typeDispatch` entry whose key matches the record's resolved type (per [DV-Mx1]), if `typeDispatch` is present and contains such an entry; (2) `renderViewId`, if present; (3) the default rendering baseline.

> **[DV-Dx3]** A `typeDispatch` key that matches no record present in the section's resolved member set MUST be ignored and MUST NOT produce a diagnostic. A record whose resolved type matches no `typeDispatch` key falls through to rule [DV-Dx2] steps (2)–(3). When a record reaches step (2) and the fallback `renderViewId` resolves to an L1 view bound to a different type than the record, the L1 view renders only the fields it can resolve on that record (absent fields omitted, per the default rendering baseline [N]); implementations SHOULD treat this as a degraded render rather than an error. Authors SHOULD omit `renderViewId` on heterogeneous sections and rely on `typeDispatch` plus the baseline.

> **[DV-Dx4]** A member with no resolvable Type (Tier 0 Note, Tier 1 TypedRecord, or a record whose `typeId` fails to resolve) MUST NOT match any `typeDispatch` key and MUST fall through to [DV-Dx2] steps (2)–(3).

> **[DV-Dx5]** `typeDispatch` MUST NOT change member ordering. Member order is determined solely by the section's source: base-spec [N+12] for `container-subset`, and the declared `instanceIds[]` array order for `fixed-instances`.

> **[DV-Fx1]** The `container-subset` source variant MAY carry a `typeFilter` array of `namespace/name` strings. `typeFilter` MUST NOT appear on any other `SectionSource` variant. When absent or empty, the resolved member set is every container member, unchanged from prior behaviour.

> **[DV-Fx2]** When `typeFilter` is present and non-empty, the resolved member set MUST be restricted to container members whose resolved type (per [DV-Mx1]) matches one of the listed keys.

> **[DV-Fx3]** When a `typeFilter`-restricted `container-subset` section declares no `ordering.fieldId`, an implementation MUST order the surviving members by projecting the base-spec [N+12] order: compute the [N+12] order (topological sort by `precedes` with `createdAt`-ascending tiebreak, reversed when `ordering.direction` is `desc`) over the **full** container member set, then remove the non-surviving members from that sequence. Removing a member that was a `precedes` bridge between two survivors MUST NOT reorder those survivors. The result is deterministic because it inherits [N+12]'s total order.

> **[DV-Fx4]** When a section specifies both `typeFilter` and `ordering.fieldId`, the implementation MUST apply `typeFilter` first and then sort the survivors by `ordering.fieldId`. Per [N+12], `ordering.fieldId` supersedes the `precedes`-chain order; [DV-Fx3] does not apply in that case.

> **[DV-Fx5]** A member with no resolvable Type (Tier 0 Note, Tier 1 TypedRecord, or a record whose `typeId` fails to resolve) MUST NOT match any `typeFilter` key and is therefore excluded whenever `typeFilter` is present and non-empty.

> **[DV-Cx1]** `typeFilter` and `typeDispatch` are independent optional capabilities. An implementation that supports `ext:views-l2` MUST accept a DocumentView that uses either, both, or neither, and MUST treat their absence as the pre-existing behaviour.

---

## Schema changes

The canonical source file is `srs/docs/schema/2.0/document-view.json`; all edits are made there first, then synced.

| Schema file | Change |
|---|---|
| `document-view.json` | **Change B:** add optional `typeDispatch` to `$defs/DocumentSection` — `{ "type": "object", "additionalProperties": { "type": "string", "format": "uuid" } }` (keys are `namespace/name` strings, unconstrained by JSON Schema; values are view UUIDs). **Change A:** add optional `typeFilter` to the `container-subset` branch of `$defs/SectionSource` — `{ "type": "array", "items": { "type": "string" } }` (no `minItems`; an empty array is a defined no-op per [DV-Fx1]). Both enclosing `additionalProperties: false` blocks (`DocumentSection` and the `container-subset` branch) **retain** that constraint; the two new properties are added explicitly. |
| `document-view.json` (`titleFieldId` description) | **Drift fix.** The `titleFieldId` description string still reads "Must appear in the effective field list of *every* instance type in the section" — the superseded strict form of [N+1]. Base-spec [N+1] was relaxed (heading omitted for types lacking the field) and this RFC's heterogeneous sections depend on the relaxed form. Update the description to match relaxed [N+1] so a reader of the schema alone does not see a contradiction. Semantics only documented in prose; no structural schema change. |

The JSON Schema does not enforce that `typeDispatch` values reference existing `ext:views-l1` views, nor that keys name real types — those are render/package-validation-time checks ([DV-Dx1]), exactly as for the existing `renderViewId`.

Schema changes must be synced from the canonical file to:
- `srs-rust/crates/srs-schema/schemas/2.0/document-view.json`
- `srs-vscode/schemas/2.0/document-view.json`

`srs-rust/scripts/check-schema-sync.sh` (run from `srs-rust/`) verifies **both** the crate copy and the vscode copy against the canonical source and MUST exit 0.

No other schema files change. No existing well-formed DocumentView, Record, Type, Field, or Relation becomes invalid: both additions are new optional properties.

---

## Rationale

**Why `typeDispatch` lives at the L2 section level, not inside an L1 view.** An L1 view renders the fields of exactly one type; it has no concept of "another type." The decision of *which* view to apply to a heterogeneous stream is inherently a section-level (L2) concern. Placing dispatch on `DocumentSection` keeps L1 views single-type and reusable, and keeps the heterogeneity logic in the one place that already knows it is assembling mixed members.

**Why `typeDispatch` keys are `namespace/name` strings, not UUIDs.** Render dispatch matches the *kind* of a record, exactly as `type-query.semanticObjectType` does. Using `namespace/name` keeps the two type-matching surfaces in the schema consistent and human-authorable, and lets a dispatch survive type version bumps (a Record binding `…@2` instead of `…@1` should still render through the same view). UUID keys would be more precise but would break on every version increment and diverge from the existing `semanticObjectType` convention.

**Why ordering projects the [N+12] order rather than re-deriving it.** A `typeFilter` is a *projection*, not a re-sequencing. Authors expect "show me just the tables, in the order they appear in the document." Computing the base-spec [N+12] order over the full container and then dropping non-survivors (filter-then-project, [DV-Fx3]) is the only interpretation that makes a filtered section a faithful sub-view of the unfiltered document, and it inherits [N+12]'s deterministic total order (including the `createdAt` tiebreak for members not connected by `precedes`). Re-running a topological sort over a `precedes` graph with nodes removed would instead silently drop survivors that were only connected through an excluded bridge — the failure this rule exists to prevent. Aligning explicitly with [N+12] (rather than an independent "transitive closure" notion) keeps filtered and unfiltered `container-subset` sections governed by one ordering rule.

**Why field `ordering` overrides `precedes`.** A section that explicitly asks to sort by a field value is making an intentional, local choice that is incompatible with the document's narrative `precedes` order. Letting `ordering` win removes the ambiguity of two competing sort sources; the alternative (merging them) has no well-defined semantics.

**Why both changes ship in one schema revision.** They touch the same file, are both additive, and the blocking use case (srs-rust#35) is cleanest when expressed as a single `container-subset` section using `typeDispatch`. Shipping them together avoids two consecutive `2.0` schema touches.

---

## Alternatives Considered

### Alt A — `merged-type-query` source variant (issue #17, option 3)

A fourth `SectionSource` variant that unions several `type-query` results and sorts the union by the `precedes` chain. **Rejected.** It adds a new source variant and its own ordering semantics while delivering nothing that `container-subset` + `typeFilter` does not already deliver: `container-subset` already fetches members and sorts them by the cross-type `precedes` chain, and `typeFilter` already restricts to a chosen set of types. The merged variant would duplicate that machinery and enlarge the `oneOf` surface for no new capability.

### Alt B — `typeFilter` alone, without `typeDispatch`

Adopt only Change A. **Rejected as insufficient.** `typeFilter` restricts *which* records appear but not *how* each is rendered; a heterogeneous `container-subset` section still collapses to a single `renderViewId` or the default baseline. It therefore does not solve the blocking srs-rust#35 case, whose requirement is per-type rendering of an interleaved stream. Change B is the necessary fix; Change A is complementary.

### Alt C — UUID-keyed `typeDispatch`

Key the dispatch map by type UUID + version. **Rejected.** It would force authors to re-point the map on every type version increment and would diverge from the `namespace/name` convention already established by `semanticObjectType`. The marginal precision is not worth the churn and inconsistency.

### Alt D — per-record `renderViewId` override on each instance

Let each Record declare its own render view. **Rejected.** It pushes a rendering (L2) concern into instance data, violating the separation between semantic records and their projections, and would not generalise to records that appear in multiple views.

---

## Open Questions

**None.** The five questions raised in issue #17 are resolved as follows and are recorded here for traceability:

1. *Does `typeFilter` alone address the common cases?* No — see Alt B. The blocking case needs `typeDispatch` (Change B). Both are adopted; they are complementary, not substitutes.
2. *`typeFilter` + field-based `ordering` interaction?* Permitted. Filter first, then order; per [N+12], `ordering.fieldId` supersedes the `precedes` chain ([DV-Fx4]).
3. *`precedes` spanning filtered records?* Preserve survivor order by projecting the base-spec [N+12] order (topological sort + `createdAt` tiebreak) onto the filtered subset — filter-then-project ([DV-Fx3]). The earlier "transitive closure" framing (Rev 1) was dropped because it conflicted with [N+12].
4. *`typeDispatch` key format?* `namespace/name`, version-independent, matching `semanticObjectType`; bare names only in single-system non-packaged views ([DV-Dx1]).
5. *Is a `merged-type-query` variant needed?* No — see Alt A. Subsumed by `container-subset` + `typeFilter`.
