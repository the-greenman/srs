# RFC-005: Core Relation Type Definitions

> **Draft note**: This file is an RFC text draft. It is not yet an SRS record projection.

---

**Status**: Draft (Revision 14)
**Affects**: Distribution Group (Core), `Relation`, `RelationTypeDefinition`, `Package`, `ext:recommended-relations`
**Author**: Codex draft
**Date**: 2026-05-29

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-05-29 | Initial draft: installable, versioned, verifiable relation type definitions |
| 2 | 2026-05-29 | Resolve review issues: structured identity, import tracking, version binding, local cycle rejection, and no compatibility-mode requirement |
| 3 | 2026-05-29 | Resolve relationType lookup conflicts, explicitly amend Relation shape, tighten lifecycle requirements, and close settled open questions |
| 4 | 2026-05-29 | Architectural revision: promote RelationTypeDefinition to core; retire ext:relation-types; define canonical SRS vocabulary as required package content |
| 5 | 2026-05-29 | Fix review findings: real UUIDs on canonical definitions; category enum retains lifecycle/provenance; add import tracking vocabulary (Change D); define effective package set; clarify package-manifest.json conformance semantics |
| 6 | 2026-05-29 | Resolve all open questions: evidences is irreflexive; IDs are final; section-sequence/subsection-sequence are not canonical |
| 7 | 2026-05-29 | Fix remaining review issues: category enum consistent in shape block; conflict rule covers all same-relationType cases not just different-id; inverseType clarified as query label only, not an installed definition; relationType schema description updated from kebab-case to bare-or-namespaced string |
| 8 | 2026-05-29 | Add Deletion Semantics section: definition deletion blocked by live relations; instance deletion marks referencing relations status:rejected atomically |
| 9 | 2026-05-29 | Fix review findings: identical definitions coalesce (same id+version+content), only differing definitions are conflicts; disambiguate Reference.definitionType to package-bundle.json; add package-bundle.json row to schema summary; rename misleading "unchanged" comment to "existing required field names" |
| 10 | 2026-05-29 | Fix deletion semantics: removal blocked by any stored relation of any status; published packages are immutable; tombstoning requires status field (active/deprecated/tombstone/retired) added to shape and schema; endpoint deletion sets validUntil at time of deletion |
| 11 | 2026-05-29 | Fix contradictions: forced removal requires relation deletion/redaction not just rejection; E1 validation wired to status (active/deprecated/retired) with MUST semantics; deprecated write rejection is normative MUST not advisory should |
| 12 | 2026-05-29 | Fix retired/tombstone contradiction: introduce tombstone status (resolves for historical reads, rejects writes) distinct from retired (does not resolve); forced removal fallback uses tombstone not retired; shape comment updated to MUST |
| 13 | 2026-05-29 | Add tombstone to schema summary status enum; correct Rev 10 history entry to include tombstone |
| 14 | 2026-05-31 | Remove `requireSameSemanticObjectType: true` from `supersedes` — cross-type supersession is valid (governance records superseding base-type records); add target version declaration (2.0 amendment); add spec record amendments table |

---

## Abstract

Earlier revisions proposed `ext:relation-types` as an optional extension. This revision rejects that framing.

`RelationTypeDefinition` is already part of the SRS spec and already has a schema. The problem is that the current model treats it as optional metadata — implementations are not required to resolve a relation type string against an installed definition before accepting a Relation. That makes the definitions informational rather than normative.

This RFC closes that gap by making `RelationTypeDefinition` a required Package component and making definition lookup mandatory for all implementations. The canonical SRS relation vocabulary (`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`) becomes a set of installed definitions shipped with the core SRS package, not a naming convention documented in prose.

Advanced graph semantics (transitive/symmetric query inference, cardinality enforcement, lifecycle constraints) remain optional and are deferred to a future RFC when a concrete use case demands them.

---

## Motivation

### Problem 1 — `relationType` is a free string with no enforcement

The current `Relation` shape stores `relationType: string`. The spec documents canonical strings and requires custom types to use `namespace/name` format. This is naming discipline, not validation. A conforming implementation may accept any string without checking whether a definition exists.

### Problem 2 — Definitions exist but are not required

`RelationTypeDefinition` already has a schema (`relation-type.json`) and `Package.relationTypes[]` already exists in the package manifest schema. The machinery is present but the requirement is absent. Implementations are free to ignore definitions entirely.

### Problem 3 — The canonical vocabulary has no stable identity

The seven canonical SRS relation types (`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`) are documented as prose strings. They have no `id`, no `version`, and no installed definition record. They cannot be referenced, imported, or depended upon.

### Problem 4 — An extension is the wrong answer

An extension that "every serious SRS repo should declare" is a design smell. If relation type definitions are genuinely useful — and they clearly are for governance, contracts, provenance, and document composition — then they belong in core, not behind a feature flag. Simple personal knowledge bases that never install relation type definitions will continue to work: the core SRS package ships definitions for all seven canonical types, and any repo using only canonical types automatically satisfies the requirement.

---

## Design Principles

**Resolution is required, not optional.** Every `Relation.relationType` string must resolve to an installed `RelationTypeDefinition` before a Relation is accepted.

**Definitions travel with the package.** Installing a package installs its relation type definitions. A repo using a governance package gets that package's relation type constraints automatically.

**Simple repos are not penalized.** A repo using only canonical SRS relation types needs no extra configuration. The core SRS package provides all seven definitions out of the box.

**Storage stays simple.** A stored Relation remains `(sourceInstanceId, relationType, targetInstanceId)`. No inferred edges are stored.

**Advanced constraints are deferred.** Transitive/symmetric query inference, cardinality enforcement, and lifecycle constraints are not required by this RFC. They may be added in a future RFC when a concrete use case exists.

---

## Proposed Changes

### Change A — Extend `RelationTypeDefinition` with stable identity and core validation fields

The current `relation-type.json` schema requires `relationType`, `namespace`, `label`, `description`, and `category`. It lacks stable identity and any validation constraints.

The updated shape adds:

```typescript
RelationTypeDefinition {
  // --- Identity (new, required) ---
  id: UUID
  version: integer           // min: 1

  // --- Existing required field names (semantics of category and relationType change; see below) ---
  relationType: string
  namespace: string
  label: string
  description: string
  category: "composition" | "refinement" | "dependency" | "sequence" | "derivation"
          | "evidence" | "governance" | "association" | "lifecycle" | "provenance" | "other"

  // --- Existing optional fields (unchanged) ---
  canonicalDirection?: string
  inverseType?: string
  // Query label for the inverse direction. This is NOT required to be an installed
  // RelationTypeDefinition. It must never be stored as a Relation.relationType unless
  // a separate RelationTypeDefinition is installed for that inverse string.

  // --- New optional validation fields ---
  irreflexive?: boolean
  // A relation from an instance to itself is invalid.

  allowedSourceTypes?: string[]
  allowedTargetTypes?: string[]
  // Allowed semanticObjectType values for source/target instances.
  // Absent = any instance type is permitted.

  requireSameSemanticObjectType?: boolean
  // When true, source and target must have the same semanticObjectType.

  status?: "active" | "deprecated" | "tombstone" | "retired"
  // Absent = active.
  // deprecated: resolves for all operations; new relation writes MUST be rejected.
  // tombstone: resolves for historical reads only (validation of stored relations succeeds);
  //   new relation writes MUST be rejected. Used when full relation redaction is not possible.
  // retired: does not resolve; treated as absent. All stored relations of this type are invalid.

  createdAt: string          // ISO 8601, required
  updatedAt?: string         // ISO 8601; set when status changes
}
```

**What is NOT added to the core shape:**
- `transitive`, `symmetric` — query inference semantics; deferred
- `cardinality` — enforcement requires graph inspection; deferred
- `sourceMustBeInState` / `targetMustBeInState` — depends on `ext:lifecycle`; deferred
- `relationTypeVersion` on `Relation` — version binding complexity; deferred

The `category` enum is expanded. The full accepted set is:

```
"composition" | "refinement" | "dependency" | "sequence" | "derivation"
| "evidence" | "governance" | "association" | "lifecycle" | "provenance" | "other"
```

`lifecycle` and `provenance` from the current schema are retained unchanged. `composition`, `refinement`, `derivation`, `evidence`, and `governance` are added as new values. The canonical SRS definitions use the new values; existing definitions using `lifecycle` or `provenance` remain valid.

### Change B — Make definition lookup mandatory

Add the following invariant to the core `Relation` specification:

> Every `Relation.relationType` string must resolve to exactly one installed `RelationTypeDefinition` in the effective package set. A Relation whose `relationType` does not resolve to an installed definition is invalid and must not be accepted.

**Effective package set:** The effective package set for a repository is the union of: (1) the local `package/` directory, (2) all packages listed in `dependencyRefs[]` that have been resolved and installed, and (3) any packages installed via `ext:import-tracking` import records. Registry-fetched packages are included only after they have been locally installed and their definitions committed to the effective set. Unresolved `dependencyRefs` entries are a configuration error, not a silent omission.

**Resolution rule:** Two `RelationTypeDefinition` objects with the same `relationType` string coalesce if and only if they share the same `id`, `version`, and content. Implementations may use a SHA-256 digest of the canonical JSON serialization to check content equality. Coalesced duplicates are treated as a single definition — this is the normal outcome when a bundled governance package carries the same canonical definition as the core SRS package.

Any condition where two definitions share the same `relationType` but differ in `id`, `version`, or content is an installation conflict. Implementations must surface the conflict and must not accept Relations of that `relationType` until it is resolved. This stricter-than-id-only rule is necessary because `relationTypeVersion` is deferred: without version binding on `Relation`, the implementation cannot choose between two differing definitions.

**Federation carve-out:** Implementations may defer definition lookup for Relations whose source or target resolves to an external repository when `ext:federation` is declared. The relation must be marked as externally unresolved rather than locally verified.

### Change C — Ship the canonical SRS vocabulary as installed definitions

The SRS specification package (`com.semanticops.srs`) must include `RelationTypeDefinition` records for all seven canonical relation types in `package/relation-types/`. These files are listed in `package/package.json` under `relationTypes[]`.

Canonical definitions:

| `relationType` | `category` | `irreflexive` | `inverseType` | Notes |
|---|---|---|---|---|
| `contains` | `composition` | true | `part-of` | Source contains target |
| `depends-on` | `dependency` | true | — | Source requires target |
| `supersedes` | `governance` | true | `superseded-by` | Source replaces target |
| `refines` | `refinement` | true | — | Source is a more specific version of target |
| `derived-from` | `derivation` | true | `source-of` | Source is derived work; target is source material |
| `evidences` | `evidence` | true | — | Source is evidence for target |
| `precedes` | `sequence` | true | `follows` | Source comes before target in sequence |

All seven are `many-to-many` cardinality (not enforced at core; noted in descriptions).

`inverseType` values (`part-of`, `superseded-by`, `source-of`, `follows`) are query labels only. They are not installed `RelationTypeDefinition` records and must not be used as `Relation.relationType` values unless separate definitions are installed for them.

### Change D — Add `"relation-type"` to import tracking vocabulary

When `ext:import-tracking` is declared, `RelationTypeDefinition` objects installed from external packages must be tracked the same way Fields, Types, Views, Schemas, and Protocols are tracked. The following vocabulary additions are required:

- `ImportRecord.definitionType` gains `"relation-type"` as a valid value alongside `"field"`, `"type"`, `"view"`, `"schema"`, and `"protocol"`.
- `ImportSummary` definition-type counts must include `relation-type` entries where applicable.
- In `package-bundle.json`, the `Reference.definitionType` enum (currently `["field", "type", "view", "schema", "protocol"]`) gains `"relation-type"`. This is the correct location — `package-bundle.json`'s `$defs/Reference` is the shared reference shape for dependency declarations in distributed packages. The `DependencyRef` entries in `package-manifest.json` carry only `namespace`, `name`, and `version` (no `definitionType`) and are unchanged by this RFC.

Relation type definition imports discovered during package import or repository import must be returned as ordinary validation errors if definition conflicts are found.

### Change E — `ext:recommended-relations` is retired

`ext:recommended-relations` becomes a compatibility label only. It no longer owns any normative semantics. The canonical relation type vocabulary it documented is now the installed `com.semanticops.srs` package content.

Implementations that previously declared `ext:recommended-relations` may remove it. The canonical definitions are now unconditionally available to any repo using the SRS package.

### Change F — No change to `Relation` storage shape

`relationTypeVersion` is not added to core `Relation`. The stored shape remains:

```typescript
Relation {
  relationId: UUID
  relationType: string
  sourceInstanceId: UUID
  targetInstanceId: UUID
  // ... existing optional provenance fields unchanged
}
```

Version binding complexity is deferred. When multiple installed definitions exist for the same `relationType` (which should not occur in a well-configured package set), that is a conflict to be resolved, not a choice for individual Relations to make via a version field.

---

## Validation Semantics

When an implementation accepts, imports, or validates a Relation:

**E1 — Definition lookup.** Resolve `relationType` against installed definitions. Missing definitions, installation conflicts, and definitions with `status: "retired"` are validation errors. Status semantics:

- `status: "active"` (or absent) — resolves normally; new relations are accepted.
- `status: "deprecated"` — resolves for all operations; new relation writes MUST be rejected with a validation error. Implementations MUST surface a diagnostic identifying the deprecated type.
- `status: "tombstone"` — resolves for historical reads only (validating existing stored relations succeeds); new relation writes MUST be rejected. Used when full relation redaction is not possible and a minimal resolvable marker must be retained.
- `status: "retired"` — does not resolve; treated as absent. All relations of this type are invalid.

**E2 — Endpoint existence.** `sourceInstanceId` and `targetInstanceId` must resolve to known instances unless `ext:federation` is in use and the endpoint is explicitly external.

**E3 — Irreflexivity.** If `irreflexive: true`, a Relation where `sourceInstanceId == targetInstanceId` is invalid.

**E4 — Semantic object type constraints.** If `allowedSourceTypes` is present, the source instance's `semanticObjectType` must be in that list. Same for `allowedTargetTypes`. If `requireSameSemanticObjectType: true`, both must match.

All other constraint types (cardinality, transitivity, symmetry, lifecycle) are not required by this RFC.

---

## Canonical Relation Type Definitions

The following are the normative definitions to be installed at `srs/srs/package/relation-types/` in the SRS specification package.

### `contains`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "3a1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "version": 1,
  "relationType": "contains",
  "namespace": "com.semanticops.srs",
  "label": "Contains",
  "description": "Source instance contains or is composed of target instance. Defines structural membership or composition boundaries.",
  "category": "composition",
  "canonicalDirection": "source is the container; target is the contained member",
  "inverseType": "part-of",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `depends-on`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "7f8e9d0c-1b2a-4f3e-9d8c-7b6a5f4e3d2c",
  "version": 1,
  "relationType": "depends-on",
  "namespace": "com.semanticops.srs",
  "label": "Depends on",
  "description": "Source instance requires target instance to be complete, valid, or usable. Target is a prerequisite.",
  "category": "dependency",
  "canonicalDirection": "source depends on target",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `supersedes`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f",
  "version": 1,
  "relationType": "supersedes",
  "namespace": "com.semanticops.srs",
  "label": "Supersedes",
  "description": "Source instance replaces or invalidates target instance. Source is newer; target is the older instance being superseded.",
  "category": "governance",
  "canonicalDirection": "source is the newer instance; target is the older instance being superseded",
  "inverseType": "superseded-by",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `refines`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "e5f6a7b8-c9d0-4e1f-8a2b-3c4d5e6f7a8b",
  "version": 1,
  "relationType": "refines",
  "namespace": "com.semanticops.srs",
  "label": "Refines",
  "description": "Source instance is a more specific, detailed, or precise version of target instance. Does not replace or invalidate target.",
  "category": "refinement",
  "canonicalDirection": "source is the more specific instance; target is the general instance",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `derived-from`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e",
  "version": 1,
  "relationType": "derived-from",
  "namespace": "com.semanticops.srs",
  "label": "Derived from",
  "description": "Source instance was produced from or substantially informed by target instance. Provenance and derivation chain.",
  "category": "derivation",
  "canonicalDirection": "source is the derived work; target is the source material",
  "inverseType": "source-of",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `evidences`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a",
  "version": 1,
  "relationType": "evidences",
  "namespace": "com.semanticops.srs",
  "label": "Evidences",
  "description": "Source instance is evidence for, supports, or substantiates the claim or content of target instance.",
  "category": "evidence",
  "canonicalDirection": "source is the evidence; target is the claim or content being supported",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

### `precedes`
```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c",
  "version": 1,
  "relationType": "precedes",
  "namespace": "com.semanticops.srs",
  "label": "Precedes",
  "description": "Source instance comes before target instance in a defined sequence or ordering.",
  "category": "sequence",
  "canonicalDirection": "source comes before target",
  "inverseType": "follows",
  "irreflexive": true,
  "createdAt": "2026-05-29T00:00:00Z"
}
```

---

## Schema Changes Summary

| Schema file | Change |
|---|---|
| `docs/schema/2.0/relation-type.json` | Add required `id` (UUID), required `version` (integer), required `createdAt`; add optional `irreflexive`, `allowedSourceTypes`, `allowedTargetTypes`, `requireSameSemanticObjectType`, `status` (`"active"\|"deprecated"\|"tombstone"\|"retired"`), `updatedAt`; expand `category` enum to full 11-value set; update `relationType` field description from "kebab-case, unique within package namespace" to "canonical bare string (e.g. `supersedes`) or custom `namespace/name` string (e.g. `org.example/consent_ratifies`); must be unique across the effective installed package set" |
| `docs/schema/2.0/relations-collection.json` | No change |
| `docs/schema/2.0/package-manifest.json` | Schema shape unchanged — `relationTypes[]` path array already present; `DependencyRef` entries unchanged (no `definitionType` field); conformance semantics changed: listing relation type paths is now required for packages that define relation types, not optional metadata |
| `docs/schema/2.0/package-bundle.json` | `$defs/Reference.definitionType` enum gains `"relation-type"`; `relationTypes[]` array description updated from "ext:recommended-relations relation type metadata" to "relation type definitions; required in bundled mode when the package defines or depends on relation types" |
| `srs/package/package.json` | Add `"relationTypes": ["relation-types/contains.json", ...]` |
| `srs/package/relation-types/*.json` | Create 7 canonical definition files |

### Spec record amendments required

| Record | Required change |
|---|---|
| `srs/records/subsections/07-11-ext-recommended-relations` | Replace body with retirement notice: "Retired as of RFC-005. The canonical relation vocabulary is now provided as installed definitions in the `com.semanticops.srs` package. See §5 (Package). Remove the `RelationTypeDefinition is optional metadata` statement — it is directly contradicted by the mandatory lookup requirement." |
| `srs/records/subsections/09-1-core-conformance-requirements` | Add requirement bullet: "Resolve every `Relation.relationType` against an installed `RelationTypeDefinition` in the effective package set before accepting a Relation write. A missing or conflicting definition is a validation error." |
| `srs/records/subsections/09-2-extension-conformance-requirements` | Mark `ext:recommended-relations` as retired in any conformance table entry. |

---

## Deletion Semantics

### Deleting a relation type definition

A `RelationTypeDefinition` file must not be removed from a package while any stored `Relation` of that `relationType` exists, regardless of that relation's `status`. Historical relations with `status: "rejected"` or `status: "superseded"` are still stored and still reference the definition — removing the definition makes those relations unverifiable.

**Published package versions are immutable.** A definition cannot be removed from an already-published package version. Removal happens only in a new package version, and only after the definition has been deprecated in an intermediate version to give downstream repositories a migration window.

**Tombstoning (preferred):** Set `status: "deprecated"` on the definition and publish a new package version. Deprecated definitions continue to resolve for existing relations; new writes are rejected (see Validation Semantics E1). Once no stored relations of any status reference the type, the definition may be set to `status: "retired"` — at which point it no longer resolves and is treated as absent for validation purposes. Retiring is the clean end state; physical file removal is not required and is discouraged.

**Forced removal:** If a definition must be physically removed (e.g. due to a legal or security requirement), all stored relations of that type — including historical ones of any status — must be deleted or redacted from the repository before the definition file is removed. Transitioning them to `status: "rejected"` is insufficient, because rejected relations still reference the definition and remain unverifiable without it. The package must then be published as a new version without the definition. This sequence must be documented in the package changelog. Implementations that cannot guarantee full relation redaction must instead retain a minimal tombstone definition (`status: "tombstone"`, all validation fields removed) so that stored relations remain resolvable for historical reads.

### Deleting an instance that is a relation endpoint

When an instance is deleted, all Relations where it appears as `sourceInstanceId` or `targetInstanceId` must be transitioned to `status: "rejected"` with `validUntil` set to the deletion timestamp. They are not cascade-deleted. The relation record is preserved as an audit trail of the former assertion, and `validUntil` records when it stopped being valid.

Implementations must perform this transition atomically with the instance deletion. A delete operation that removes the instance file and updates the manifest must also update the relations file in the same operation.

`status: "rejected"` relations are excluded from active graph queries and do not count toward cardinality or cycle checks. They remain in the relations file and are visible to audit and history queries.

---

## Target Version

This RFC targets **SRS 2.0**. It is a 2.0 amendment, not deferred to 2.1. Only two SRS repositories exist; both will be updated when the RFC is adopted. The core conformance requirements in §9 must be amended at adoption time to include mandatory definition lookup (see Spec Record Amendments below).

---

## Migration Path

Existing repositories using only canonical SRS relation types (`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`) gain compliance automatically when the SRS package is updated. No action required.

Repositories using custom relation types must add `RelationTypeDefinition` records to their package for those types before this invariant is enforced. Migration order:

1. Add `RelationTypeDefinition` records to the package for every custom `relationType` in use.
2. Update `package.json` to list the new relation-type paths under `relationTypes[]`.
3. Validate the repository — existing Relations against canonical types are already valid.

---

## Deferred Features

The following were proposed in earlier revisions and are explicitly deferred:

| Feature | Reason for deferral |
|---|---|
| `transitive` / `symmetric` query inference | No concrete use case requiring implementation yet |
| `cardinality` enforcement | Requires graph inspection; deferred until a consumer needs it |
| Lifecycle constraints (`sourceMustBeInState` etc.) | Depends on `ext:lifecycle`; deferred to a joint RFC |
| `relationTypeVersion` on `Relation` | Complexity not justified without multiple definition versions in practice |
| Subproperty hierarchies / OWL reasoning | Out of scope for SRS |

---

## Consequences

**Benefits:**
- Relation semantics are enforceable, not advisory.
- The canonical SRS vocabulary has stable UUIDs and versioned definitions.
- Custom relation types travel with the package that defines them.
- Simple repos using only canonical types need no extra configuration.
- The storage model is unchanged — no migration of existing Relation JSON files.

**Tradeoffs:**
- Every implementation must load relation type definitions before accepting Relation writes. This is a new requirement on the validation path.
- Custom relation type authors must maintain definition records, not just use descriptive strings.

---

## Resolved Questions

1. **`evidences` irreflexivity**: `evidences` is `irreflexive: true`. A note evidencing itself is not a meaningful claim.
2. **Canonical definition IDs**: The UUIDs in the canonical definitions above are the assigned stable values. Resolved.
3. **`section-sequence` and `subsection-sequence`**: These are internal spec-authoring conventions, not canonical SRS relation types. They are not added to the vocabulary. Packages that need sequence-ordering relations for their own document structure should define them in their own package namespace.
