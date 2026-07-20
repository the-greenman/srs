> **GitHub issue**: [the-greenman/srs#198](https://github.com/the-greenman/srs/issues/198)

# RFC-026: ext:slices — Record Slices (Subset Export)

**Status**: Draft (Revision 3)
**Affects**: `ext:repository` (new optional `slice` manifest block); `docs/schema/2.0/manifest.json` (add `slice` property and `$defs.Slice`, `$defs.SliceSpec`, `$defs.SliceExternalRef`)
**Author**: the-greenman (from issue the-greenman/srs#194)
**Date**: 2026-07-20
**Builds on**: RFC-017 (`.srs` archive format, Change D determinism, archive_pack/archive_unpack)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-20 | Initial draft |
| 3 | 2026-07-20 | Fix new blocking issue from round 2 review: Change C item 5 sub-container rule — mixed-membership sub-containers MUST be excluded entirely (mirrors Change D item 6 rule). |
| 2 | 2026-07-20 | Address Stage 3 review findings. Blocking: (SI-1/C-11) qualify backward-compatibility claim — pre-RFC-026 validators will reject the `slice` property; (SI-2/C-2) add normative rule for `manifest.container` in package-boundary slices (filter source root's memberInstanceIds to included set); (SI-3/C-4) fix Change D item 2 — replace undefined "transitive contains relations from root container" with memberInstanceIds/rootInstanceIds traversal; (SI-6/C-1) redefine package-boundary `spec.id` as `PackageRef.packageId`, closure as Tier 2 Records by typeId namespace — remove ADR-033/PackageBoundarySnapshot references; (SI-7/C-3) add normative statement that closure root becomes `manifest.container` in container slices. Should-fix: (SI-4) add `manifest.properties` entry to schema diff; (SI-5) add `relationId` to `SliceExternalRef`; (C-5) add validator-directed conformance rule (R14); (C-6) add RFC-005 non-applicability note for `externalRelationRefs.relationType`; (C-7) add Field definition completeness rule for Type FieldAssignments; (C-8) fix Alt C RFC citation (RFC-005, not RFC-022). Nits: (SI-8) elevate Change C/D sub-steps to MUST language; (SI-9) add relationType format guidance; (SI-10/C-9/C-10) fix R8 producer-side scoping and both-endpoints clause, add tombstone handling, close OQ2 as resolved. |

---

## Abstract

This RFC defines `ext:slices` — a normative extension that allows a *slice* of a source repository to be exported as a valid, independently openable `.srs` archive. A slice is a subset of the source: its content is determined by a *closure rule* (package boundary or container membership) applied to the source repository. The exported archive is format-identical to a whole-repository export (RFC-017) and carries a `slice` block in its manifest recording origin provenance. Any SRS tool can open, validate, and render a slice, provided its validator applies the Change F relaxations when a `slice` block is present. Record-level closure (an arbitrary set of records) is explicitly out of scope and deferred.

---

## Motivation

### Problem 1 — Package export has no export half

The current package flow (`load_package_source_dir` → `install_package_bundle`) is import-only. There is no mechanism for a repository to export a package boundary as a portable, installable artifact. A Workflow Designer maintaining a shared type/field library can install packages from the ecosystem but cannot publish their own repository as a distributable package. Closing the import/export loop requires a defined subset-export format.

### Problem 2 — Container export has no portable representation

A clerk who owns a "Decision Log" container wants to export it — with its records, type definitions, and source documents — for archival, distribution, or review by a party without repository access. The `.srs` whole-archive format is the obvious carrier, but `archive_pack` (RFC-017) always exports the full repository. There is no defined format for a portable container extract.

### Problem 3 — No provenance marker for slice origin

Even if partial exports were produced ad hoc, a consumer opening the resulting archive has no normative way to know it is a slice, what source repository it came from, or what closure rule produced it. This gap makes slices unreliable as distribution artifacts: consumers cannot tell whether "missing" content is expected (by design of the closure rule) or accidental (corruption, truncation).

### Problem 4 — No defined semantics for dangling relations at export time

When a relation in the source repository connects an included record to an excluded record, the current spec provides no guidance on what to do. Without a normative dangling-edge policy, implementations diverge: some drop relations silently, some include them with broken targets, and some refuse to export. This makes slices non-portable across implementations.

---

## Proposed Changes

### Change A — `ext:slices` extension declaration

Define `ext:slices` as a new SRS extension. A repository that exports a slice in conformance with this RFC MUST declare `"ext:slices"` in the `declaredExtensions` array of the **slice archive's** manifest, not in the source repository's manifest. The source repository need not declare `ext:slices`; only the exported slice archive does.

### Change B — `slice` block in the manifest

Add an optional `slice` property to `manifest.json`. When present, it marks the archive as a slice (a partial export) rather than a whole-repository export. A pre-RFC-026 tool that schema-validates a manifest with `additionalProperties: false` will surface a schema error when it encounters the `slice` property; RFC-026-aware validators MUST apply the relaxations in Change F when this block is present.

**Shape:**

```json
"slice": {
  "origin": {
    "repositoryId": "<uuid of the source repository>"
  },
  "spec": {
    "type": "package",         // or "container"
    "id": "<boundary uuid>"    // PackageRef.packageId or containerId
  },
  "exportedAt": "<ISO-8601 timestamp>"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `origin.repositoryId` | `string (uuid)` | yes | The `repositoryId` of the source repository from which this slice was produced. |
| `spec.type` | `string` | yes | Closure rule applied: `"package"` (package-boundary closure) or `"container"` (container-membership closure). |
| `spec.id` | `string (uuid)` | yes | The boundary identifier: a `PackageRef.packageId` for `"package"` type; a `containerId` for `"container"` type. |
| `exportedAt` | `string (date-time)` | yes | ISO-8601 timestamp of when the slice was produced. |

The slice archive's own `manifest.repositoryId` MUST be a **new UUID**, distinct from `slice.origin.repositoryId`. A slice archive is a standalone repository — its `repositoryId` identifies the archive artifact, not the source repository.

### Change C — Package-boundary closure

A package-boundary slice exports the type and field definitions of one installed package and the instances that use them.

`slice.spec.id` for a package-boundary slice MUST equal the `packageId` of a `PackageRef` entry in the source repository's `manifest.packageRefs`. A package without a stable `packageId` UUID cannot be the root of a package-boundary slice. The package is identified by this UUID; the package's namespace is derived from its package manifest.

**Normative closure for a `spec.type: "package"` slice:**

1. **Package definitions** — the `package/` directory subtree for the identified package, including all Type and Field definition files. MUST be included completely.

2. **Instances** — all Tier 2 (Record) instances in the source repository whose `typeId` resolves to a Type defined in the identified package (i.e., a Type whose definition file appears under that package's directory). Tier 0 (Note) and Tier 1 (TypedRecord) instances are excluded from package-boundary closure; they carry no `typeId` binding that establishes package membership.

3. **Relations** — all relations whose both `sourceInstanceId` and `targetInstanceId` are in the included instance set MUST be included. Relations that span the boundary (one endpoint inside, one outside) MUST be excluded from the relations collection and their details recorded in `slice.externalRelationRefs[]` per Change E.

4. **Source documents** — all `sourceDocumentIndex` entries referenced by included instances (via `sourceRefs[]` with `sourceType: "repository-document"`) MUST be included. Their `contentPath` files MUST be included unless the entry is in the tombstone state (content absent per RFC-017 R12), in which case the index entry MUST be included and the absent content file MUST be omitted.

5. **`manifest.container`** — the slice archive's `manifest.container` MUST be a copy of the source repository's root container with `memberInstanceIds` and `rootInstanceIds` filtered to the set of included instances. The `containerId` is preserved from the source. Any `containerIndex` entry MUST be excluded unless all of its `rootInstanceIds` and `memberInstanceIds` are within the included instance set. A sub-container with mixed membership (some members inside the boundary, some outside) MUST be excluded entirely; its member instances are still included, but the sub-container grouping boundary is not exported.

The exported archive MUST pass `srs repo validate` with the relaxations specified in Change F.

### Change D — Container-membership closure

A container slice exports a container and all elements reachable from it through defined closure rules.

`slice.spec.id` for a container slice MUST equal a `containerId` present in the source repository's `containerIndex`.

**Normative closure for a `spec.type: "container"` slice:**

The closure root is the container identified by `spec.id`. The following items MUST be included:

1. **`manifest.container`** — the closure root container identified by `slice.spec.id` MUST be set as the slice archive's `manifest.container`. This makes it the repository root container for the purposes of RFC-013. Its `containerId` is preserved from the source.

2. **Member instances** — all instances appearing in the root container's `memberInstanceIds` and `rootInstanceIds` MUST be included. For each Container in the source repository's `containerIndex` whose `rootInstanceIds` are a subset of the already-included instance set, that sub-container's `memberInstanceIds` MUST also be included. Repeat until no new instances are added. (This is membership traversal through the `memberInstanceIds`/`rootInstanceIds` fields of Container objects — `containerId` MUST NOT appear as a `Relation.sourceInstanceId` or `Relation.targetInstanceId` and therefore cannot be a Relation endpoint.)

3. **Type and field definitions** — the field and type definitions instantiated by the included instances MUST be copied into the slice archive's `package/` directory as a self-contained definition set, even if sourced from multiple packages in the source repository. A definition MUST be included if at least one included instance references it by `typeId` or `fieldId`. Additionally, all Field definitions declared in an included Type's `fields[]` FieldAssignments MUST be included when that Type is included, regardless of whether individual instances carry values for those optional fields.

4. **Relations among included instances** — all relations whose both `sourceInstanceId` and `targetInstanceId` are in the included instance set MUST be included. Relations that span the closure boundary (one endpoint inside, one outside) MUST be excluded from the relations collection and recorded in `slice.externalRelationRefs[]` per Change E.

5. **Source documents** — all `sourceDocumentIndex` entries referenced by included instances (via `sourceRefs[]` with `sourceType: "repository-document"`) MUST be included. Their `contentPath` files MUST be included unless the entry is in the tombstone state (content absent per RFC-017 R12), in which case the index entry MUST be included and the absent content file MUST be omitted.

6. **Sub-containers** — any Container in the source repository's `containerIndex` whose `rootInstanceIds` and `memberInstanceIds` are all within the included instance set MUST be included in the slice archive's `containerIndex`. The slice archive's `containerIndex` MUST NOT include any Container whose members extend beyond the included instance set.

**What is excluded:**

- Instances not reached by the member traversal in item 2.
- Containers not satisfying the sub-container rule in item 6.
- Type and field definitions not referenced by any included instance (directly or via Type FieldAssignments).
- Source documents not referenced by any included instance.
- Relations with at least one endpoint outside the included instance set.

The exported archive MUST pass `srs repo validate` with the relaxations specified in Change F.

### Change E — Dangling-edge policy

When a relation in the source repository has one endpoint inside the closure and one endpoint outside it, that relation is a *dangling edge* at export time. Dangling edges MUST NOT appear in the slice archive's relations collection.

Dangling edges MUST instead be recorded in the `slice.externalRelationRefs` array in the slice manifest. Each entry records the `relationId`, `sourceInstanceId`, `targetInstanceId`, and `relationType` of the excluded relation, providing a complete provenance trace of what cross-boundary edges were cut at export.

```json
"slice": {
  "origin": { "repositoryId": "..." },
  "spec": { "type": "container", "id": "..." },
  "exportedAt": "...",
  "externalRelationRefs": [
    {
      "relationId": "<uuid>",
      "sourceInstanceId": "<uuid>",
      "targetInstanceId": "<uuid>",
      "relationType": "depends-on"
    }
  ]
}
```

An empty `externalRelationRefs` array (or omission of the field) indicates no edges were cut. A consumer MAY use `externalRelationRefs` for provenance tracing or to prompt the user that "this slice has N cross-boundary relations to the source repository"; it MUST NOT treat a non-empty list as a validation error.

Relations where both endpoints fall outside the closure MUST NOT appear in `externalRelationRefs` — those relations are simply absent from the slice.

The `relationType` field in `externalRelationRefs` entries is a provenance copy of the original relation's type string. It is NOT subject to RFC-005 definition-lookup requirements in the slice archive — the type definition for a cut relation's type may not be installed in the slice's package directory, and this is not an error.

This approach follows the ext:federation graceful-degradation contract: cross-boundary edges are not silently dropped; they are preserved as provenance data so the slice is inspectable and the cut is auditable without requiring access to the source repository.

### Change F — Validation semantics for slices

An RFC-026-aware validator MUST apply the following relaxations when the manifest being validated contains a `slice` block:

1. **`externalRelationRefs` UUIDs** — instance UUIDs appearing in `slice.externalRelationRefs` that are absent from the slice's `instanceIndex` MUST NOT produce a validation error. An implementation MAY surface an informational (non-blocking) diagnostic noting the count of external references.

2. **Incomplete package definitions** — for a container slice, the `package/` directory contains only the definitions referenced by included instances. The absence of definitions not referenced by any included instance MUST NOT produce a validation error.

3. **Incomplete container hierarchy** — a container slice need not include the source repository's full `containerIndex`. A `containerIndex` that covers only the exported sub-hierarchy MUST NOT produce a validation error.

4. **Tombstone source documents** — a `sourceDocumentIndex` entry whose `contentPath` file is absent (tombstone state, RFC-017 R12) MUST NOT produce a validation error.

The following remain errors regardless of slice status:

- Any relation in the slice's relations collection whose `sourceInstanceId` or `targetInstanceId` is not in `instanceIndex`. (Dangling edges must go into `externalRelationRefs`, not the relations collection.)
- Any `typeId` referenced by an included instance that does not resolve to a definition in the slice archive's `package/` directory.
- Any `fieldId` referenced by an included instance (directly or via a Type's FieldAssignment) that does not resolve to a definition in the slice archive's `package/` directory.
- Any schema validation error on any included instance file.

---

## Conformance Rules

> **[R1]** A slice archive MUST be a conformant `.srs` ZIP archive as defined by RFC-017 Change D (deterministic entry order, zeroed timestamps, Deflate-or-Store, empty extra fields, UTF-8 filenames). The slice format is not a new archive format — it is a whole-archive `.srs` with a subset of content.
>
> **[R2]** A slice archive's `manifest.json` MUST contain a `slice` block with: `slice.origin.repositoryId` (UUID of the source repository), `slice.spec.type` (one of `"package"` or `"container"`), `slice.spec.id` (the scoping boundary UUID), and `slice.exportedAt` (ISO-8601 timestamp).
>
> **[R3]** A slice archive's `manifest.repositoryId` MUST be a new UUID, distinct from `slice.origin.repositoryId`. A slice is a standalone archive artifact with its own identity, not a renamed copy of the source repository.
>
> **[R4]** A slice archive MUST declare `"ext:slices"` in `manifest.declaredExtensions`. The source repository need not declare this extension.
>
> **[R5]** For a package-boundary slice (`spec.type: "package"`): the included instances, relations, type/field definitions, source documents, and `manifest.container` MUST conform to the normative closure defined in Change C. Specifically: (a) `spec.id` MUST be a `PackageRef.packageId` from the source manifest; (b) included instances MUST be Tier 2 Records whose `typeId` resolves to a Type in the identified package; (c) `manifest.container` MUST be the source root container with `memberInstanceIds`/`rootInstanceIds` filtered to the included set.
>
> **[R6]** For a container slice (`spec.type: "container"`): the included instances, relations, type/field definitions, source documents, sub-containers, and `manifest.container` MUST conform to the normative closure defined in Change D. Specifically: (a) `spec.id` MUST be a `containerId` in the source `containerIndex`; (b) `manifest.container` MUST be the closure root container identified by `spec.id`; (c) member traversal MUST follow the `memberInstanceIds`/`rootInstanceIds` fields on Container objects, not `Relation` edges from `containerId` values.
>
> **[R7]** A conformant slice producer MUST NOT include in the slice archive's relations collection any relation with a `targetInstanceId` or `sourceInstanceId` that is not present in the slice archive's `instanceIndex`. Such cross-boundary relations MUST be recorded in `slice.externalRelationRefs[]` instead.
>
> **[R8]** A conformant slice producer MUST populate `slice.externalRelationRefs[]` with every relation from the source repository that was excluded because exactly one endpoint fell outside the closure. This is a producer-side obligation: a consumer of the slice archive cannot verify completeness without access to the source repository. Relations where both endpoints fall outside the closure MUST NOT appear in `externalRelationRefs`.
>
> **[R9]** A conformant consumer MUST NOT treat a non-empty `slice.externalRelationRefs[]` as a validation error. The list is provenance data, not a defect.
>
> **[R10]** A slice archive MUST pass `srs repo validate` with the normative relaxations defined in Change F. Any validation error not covered by those relaxations is a real error.
>
> **[R11]** Record-level closure (`spec.type: "record"`) is not defined by this RFC. A conformant implementation MUST NOT produce or accept a slice with `spec.type: "record"`. An implementation encountering an unrecognised `spec.type` value MUST surface a diagnostic and MUST NOT silently ignore the `slice` block.
>
> **[R12]** A slice archive produced from a container closure MUST include a self-contained `package/` directory containing all type and field definitions referenced by the included instances (directly or via Type FieldAssignments). A conformant consumer MUST resolve `typeId`/`fieldId` references from within the slice archive's own package directory — it MUST NOT require access to the source repository's packages to validate or render the slice.
>
> **[R13]** Every slice archive — whether package-boundary or container — MUST have a valid `manifest.container` as required by RFC-013. For a package-boundary slice, `manifest.container` MUST be derived from the source root container with `memberInstanceIds` and `rootInstanceIds` filtered to the included instance set. For a container slice, `manifest.container` MUST be the closure root container identified by `slice.spec.id`.
>
> **[R14]** A conformant RFC-026-aware validator MUST apply the relaxations defined in Change F when the manifest being validated contains a `slice` block. Specifically: it MUST NOT treat `externalRelationRefs` UUIDs absent from `instanceIndex` as a validation error, MUST NOT require type/field definitions not referenced by included instances, and MUST NOT require a complete `containerIndex` or present `contentPath` files for tombstoned source documents.
>
> **[R15]** The `relationType` values in `slice.externalRelationRefs[]` entries are provenance copies and are NOT subject to RFC-005 definition-lookup requirements. A validator MUST NOT require these type strings to resolve to installed `RelationTypeDefinition` records in the slice archive's package directory.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Add optional `slice` property to the top-level manifest `properties` object (`"slice": { "$ref": "#/$defs/Slice" }`). Add `$defs.Slice`, `$defs.SliceSpec`, and `$defs.SliceExternalRef` definitions (see details below). |

No other files in `docs/schema/2.0/` require changes:

- The slice archive's instance files (`record.json`, `note.json`, `typed-record.json`) are unchanged — the slice extension is expressed entirely through the manifest.
- `relations-collection.json` is unchanged — the slice's relations collection contains only valid (non-dangling) relations; dangling edges are in the manifest `slice` block, not the relations file.
- `package-manifest.json` is unchanged — the package directory in a container slice is a structural copy of definitions from the source, not a new package format.

**Property entry to add to `manifest.json` top-level `properties`:**

```json
"slice": {
  "$ref": "#/$defs/Slice",
  "description": "ext:slices (RFC-026). Present when this archive is a partial export (slice) of a source repository."
}
```

**`$defs` shapes to add to `manifest.json`:**

```json
"Slice": {
  "type": "object",
  "required": ["origin", "spec", "exportedAt"],
  "additionalProperties": false,
  "description": "ext:slices (RFC-026). Present when this archive is a partial export (slice) of a source repository.",
  "properties": {
    "origin": {
      "type": "object",
      "required": ["repositoryId"],
      "additionalProperties": false,
      "properties": {
        "repositoryId": {
          "type": "string",
          "format": "uuid",
          "description": "repositoryId of the source repository this slice was exported from."
        }
      }
    },
    "spec": { "$ref": "#/$defs/SliceSpec" },
    "exportedAt": {
      "type": "string",
      "format": "date-time",
      "description": "When this slice was produced."
    },
    "externalRelationRefs": {
      "type": "array",
      "items": { "$ref": "#/$defs/SliceExternalRef" },
      "description": "Relations cut at export because exactly one endpoint fell outside the closure. Provenance only — not a validation error (RFC-026 R9). Relations where both endpoints are outside the closure are omitted entirely."
    }
  }
},
"SliceSpec": {
  "type": "object",
  "required": ["type", "id"],
  "additionalProperties": false,
  "description": "Identifies the closure rule and boundary that scoped this slice.",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["package", "container"],
      "description": "Closure rule: 'package' = package-boundary closure (Tier 2 Records by typeId namespace, identified by PackageRef.packageId); 'container' = container-membership closure."
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "The boundary UUID: a PackageRef.packageId for type 'package'; a containerId for type 'container'."
    }
  }
},
"SliceExternalRef": {
  "type": "object",
  "required": ["relationId", "sourceInstanceId", "targetInstanceId", "relationType"],
  "additionalProperties": false,
  "description": "A relation cut at export time because exactly one endpoint was outside the closure. The relationType field is a provenance copy and is NOT subject to RFC-005 definition-lookup in the slice archive (R15).",
  "properties": {
    "relationId": {
      "type": "string",
      "format": "uuid",
      "description": "Stable UUID of the original relation. Preserved for future reintegration (RFC-026 Open Question 1)."
    },
    "sourceInstanceId": {
      "type": "string",
      "format": "uuid"
    },
    "targetInstanceId": {
      "type": "string",
      "format": "uuid"
    },
    "relationType": {
      "type": "string",
      "description": "The relationType of the cut relation. Canonical types: contains, depends-on, supersedes, refines, derived-from, evidences, precedes. Custom types use namespace/name format. NOT subject to RFC-005 definition-lookup in the slice archive."
    }
  }
}
```

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**A slice is a valid `.srs` archive, not a new format.** Reusing the RFC-017 archive format means every existing RFC-026-aware SRS tool can open, validate, and render a slice without additional tooling. The only new information is the `slice` manifest block. Pre-RFC-026 strict validators will surface a schema error on the new `slice` property (because `manifest.json` uses `additionalProperties: false`); this is expected and makes the version boundary explicit rather than silently ignoring slice semantics.

**Provenance via manifest block, not sidecar.** The `slice` block lives in `manifest.json`, the single authoritative entry point for any `.srs` archive. A consumer discovering a slice does not need to scan additional files — the manifest tells them everything about the export's origin and scope. Encoding provenance in a separate sidecar would require consumers to locate and parse an additional file, and would be silently missing in archives produced by non-conformant tools.

**New `repositoryId` for the slice.** A slice is an independent artifact. Giving it the source repository's `repositoryId` would cause any tool that tracks repositories by UUID to confuse the slice with the source. The `slice.origin.repositoryId` provides the provenance link; the archive's own `repositoryId` keeps the archive distinct.

**`externalRelationRefs` over silent drop.** Silently dropping cross-boundary relations loses provenance. A consumer receiving a container slice of "Decision Records" cannot know whether the absence of a `depends-on` edge is because the dependency was never modelled, or because the dependency target fell outside the exported container. Recording cut edges in `externalRelationRefs` makes the slice auditable: a tool can report "this slice cut 12 cross-boundary relations to the source repository" and a reviewer can decide whether those dependencies matter for their use case. This follows the ext:federation graceful-degradation contract, which established the same principle for federated repositories: absent content is surfaced, not silently hidden.

**`externalRelationRefs` in the manifest, not the relations collection.** Cut relations are not valid relations within the slice — they reference instance UUIDs that do not exist in the slice's `instanceIndex`. Placing them in the relations collection would create dangling edges that fail `repo validate`. The manifest is the correct location for provenance metadata that is not part of the repository's semantic content.

**`relationId` in `SliceExternalRef`.** The SRS Relation object carries a stable `relationId` UUID. Including it in `externalRelationRefs` preserves the ability for a future reintegration RFC to uniquely identify which relation to resurrect — two relations of the same type between the same instance pair (e.g., two `evidences` edges) are distinguishable only by `relationId`.

**Package closure defined in SRS model terms, not implementation terms.** Package-boundary closure is defined as Tier 2 Records whose `typeId` resolves to a Type in the identified package, with the package identified by its stable `PackageRef.packageId` UUID. This is fully expressible in SRS data model terms without reference to implementation concepts. Only Tier 2 Records have a `typeId` binding; Tier 0 and Tier 1 instances have no package affiliation by the data model.

**Container closure copies definitions, does not reference the source.** A container slice must be self-contained: a consumer must be able to validate and render it without access to the source repository. Referencing definitions by package identity (expecting them to be pre-installed) would break the portability goal. The definition copy is a one-time cost at export time. All Field definitions in a Type's FieldAssignments are included even for optional fields with no values — an empty slot for an optional field is valid and the field's definition must be present for the schema to be self-consistent.

**Container membership traversal is through `memberInstanceIds`, not Relations.** Container objects use `memberInstanceIds` and `rootInstanceIds` to declare their members. These are the canonical SRS mechanism for container membership. A `containerId` MUST NOT appear in `Relation.sourceInstanceId` or `Relation.targetInstanceId` (RFC-013); therefore `contains`-typed Relation traversal starting from a container is undefined. The correct traversal is: start with the root container's `memberInstanceIds` ∪ `rootInstanceIds`, then recursively include members of sub-containers whose roots are within the already-included set.

**Record-level closure is deferred.** General record-closure (export an arbitrary set of records) requires a dependency-closure engine that traverses `depends-on`, `derived-from`, and other relation types to find the minimum complete set. This engine does not yet exist in the spec or implementation. This RFC defers record closure rather than define it incompletely. The `spec.type` enum is intentionally closed to `["package", "container"]`; record closure will be added in a future RFC when its dependency-traversal semantics are defined.

---

## Alternatives Considered

### Alt A — New archive format for slices (`.srss` or similar)

Defining a separate archive format for slices was considered. Rejected: it would require new tooling for producers and consumers, and existing `srs repo validate` and `srs render` commands would not work on slices without modification. The whole-archive format with a manifest marker achieves the same result with zero new format infrastructure.

### Alt B — Silent drop of dangling edges

Dropping cross-boundary relations without recording them was considered for simplicity. Rejected: it permanently loses provenance. A consumer cannot distinguish a slice that genuinely has no cross-boundary dependencies from one that had many. The ext:federation graceful-degradation precedent showed that explicit external-reference recording is the right model.

### Alt C — Include dangling edges in the relations collection with a `status: "external"` marker

Preserving cross-boundary relations in the slice's relations collection with a new `status` field was considered. Rejected: it would require validators to ignore dangling-target errors for `status: "external"` relations, creating a validator special-case. It also conflicts with the `status` field on Relations established by RFC-005 (Deletion Semantics, Change B). The `externalRelationRefs` list in the manifest is cleaner: it is unambiguously provenance data, not a semantic relation in the repository.

### Alt D — Reuse source repository's `repositoryId` for the slice

Copying `repositoryId` from the source into the slice manifest was considered (with `slice.origin.repositoryId` being omitted as redundant). Rejected: it causes UUID collisions when a system tracks multiple slice archives of the same source repository, and confuses any tool that indexes archives by `repositoryId`. A new UUID per slice keeps archives distinct and the provenance link is carried by `slice.origin.repositoryId`.

### Alt E — `slice` as a sidecar file alongside `manifest.json`

Placing slice metadata in a separate `slice.json` file was considered. Rejected: `manifest.json` is the guaranteed entry point; every SRS tool reads it first. A sidecar requires consumers to discover and parse an extra file and may be absent in hand-assembled archives.

### Alt F — Defer package-boundary closure to a follow-on RFC

Defining only container-membership closure in this RFC (removing Change C) was considered, given that package-boundary identity has no first-class concept in the SRS data model. Rejected in favour of defining package-boundary closure normatively using `PackageRef.packageId` and `typeId` namespace matching, which is fully expressible in SRS data model terms. The package-boundary identity scheme (OQ2) is resolved by this approach; no deferral is required.

---

## Open Questions

1. **Slice reintegration (provenance for merge-back)** — this RFC establishes the provenance marker (`slice.origin.repositoryId`, `externalRelationRefs` including `relationId`) required to make slice reintegration *possible* without specifying it. The mechanics of merging a slice back into the source repository — including divergence detection, conflict resolution, and the interaction with RFC-014 (import tracking) and RFC-010 (assisted three-way merge) — are deferred to a future RFC (tracked in muDemocracy.org#116). The `slice` block's provenance fields are designed to be sufficient for a future reintegration RFC to build on.

2. **`slice.spec.id` for package closure** — ✅ **RESOLVED (Rev 2).** `spec.id` for a package-boundary slice is `PackageRef.packageId` from the source manifest. Package membership is defined as Tier 2 Records whose `typeId` resolves to a Type in that package's directory. No implementation-internal concepts are required. A package must have a stable `packageId` UUID to serve as the root of a package-boundary slice.
