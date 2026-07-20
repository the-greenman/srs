> **GitHub issue**: [the-greenman/srs#198](https://github.com/the-greenman/srs/issues/198)

# RFC-026: ext:slices — Record Slices (Subset Export)

**Status**: Draft (Revision 1)
**Affects**: `ext:repository` (new optional `slice` manifest block); `docs/schema/2.0/manifest.json` (add `slice` property and `$defs.Slice`, `$defs.SliceSpec`, `$defs.SliceExternalRef`)
**Author**: the-greenman (from issue the-greenman/srs#194)
**Date**: 2026-07-20
**Builds on**: RFC-017 (`.srs` archive format, Change D determinism, archive_pack/archive_unpack)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-20 | Initial draft |

---

## Abstract

This RFC defines `ext:slices` — a normative extension that allows a *slice* of a source repository to be exported as a valid, independently openable `.srs` archive. A slice is a subset of the source: its content is determined by a *closure rule* (package boundary or container membership) applied to the source repository. The exported archive is format-identical to a whole-repository export (RFC-017) and carries a `slice` block in its manifest recording origin provenance. Any SRS tool can open, validate, and render a slice without knowing it is a subset. Record-level closure (an arbitrary set of records) is explicitly out of scope and deferred.

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

Define `ext:slices` as a new SRS extension. A repository that exports a slice in conformance with this RFC declares `"ext:slices"` in the `declaredExtensions` array of the **slice archive's** manifest, not in the source repository's manifest. The source repository need not declare `ext:slices`; only the exported slice archive does.

### Change B — `slice` block in the manifest

Add an optional `slice` property to `manifest.json`. When present, it marks the archive as a slice (a partial export) rather than a whole-repository export.

**Shape:**

```json
"slice": {
  "origin": {
    "repositoryId": "<uuid of the source repository>"
  },
  "spec": {
    "type": "package",         // or "container"
    "id": "<boundary uuid>"    // packageBoundaryId or containerId
  },
  "exportedAt": "<ISO-8601 timestamp>"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `origin.repositoryId` | `string (uuid)` | yes | The `repositoryId` of the source repository from which this slice was produced. |
| `spec.type` | `string` | yes | Closure rule applied: `"package"` (package-boundary closure) or `"container"` (container-membership closure). |
| `spec.id` | `string (uuid)` | yes | The boundary identifier that scoped the export: a package-boundary UUID for `"package"` type, a `containerId` for `"container"` type. |
| `exportedAt` | `string (date-time)` | yes | ISO-8601 timestamp of when the slice was produced. |

The slice archive's own `manifest.repositoryId` MUST be a **new UUID**, distinct from `slice.origin.repositoryId`. A slice archive is a standalone repository — its `repositoryId` identifies the archive artifact, not the source repository.

### Change C — Package-boundary closure

A package-boundary slice exports the full content of one package boundary from the source repository.

**Normative closure for a `spec.type: "package"` slice:**

1. **Package definitions** — the `package/` directory subtree for the specified boundary, including all field and type definitions.
2. **Instances** — all instances belonging to the package boundary (per the boundary's membership definition). Their `instanceIndex` entries and record files are included.
3. **Relations** — all relations whose both `sourceInstanceId` and `targetInstanceId` are in the included instance set. Relations that span the boundary (one endpoint inside, one outside) are excluded and their `targetInstanceId` values recorded in `slice.externalRelationRefs[]` (see Change E).
4. **Source documents** — all `sourceDocumentIndex` entries and their `contentPath` files referenced by included instances (via `sourceRefs[]`).
5. **Containers** — the root container and any container index entries whose `memberInstanceIds` are a subset of the included instance set. Containers with members outside the included set are excluded.

The exported archive MUST pass `srs repo validate` as specified in Change F.

### Change D — Container-membership closure

A container slice exports a container and all elements reachable from it through defined closure rules.

**Normative closure for a `spec.type: "container"` slice:**

The closure root is the container identified by `spec.id`. The following items are included:

1. **The root container itself** — its container file and `containerIndex` entry.
2. **Member instances** — instances reachable via transitive `contains` relations from the root container. Concretely: all instances in the container's `memberInstanceIds` or `rootInstanceIds`, recursively for any sub-containers reached via `contains`.
3. **Type and field definitions** — the field and type definitions instantiated by the included instances. A definition is included if and only if at least one included instance references it by `typeId` or `fieldId`. These MUST be copied into the slice archive's `package/` directory as a self-contained definition set (even if sourced from multiple packages in the source repository).
4. **Relations among included instances** — all relations whose both `sourceInstanceId` and `targetInstanceId` are in the included instance set. Relations that span the closure boundary are excluded and recorded in `slice.externalRelationRefs[]` (see Change E).
5. **Source documents** — all `sourceDocumentIndex` entries and their content files referenced by included instances (via `sourceRefs[]` with `sourceType: "repository-document"`).

**What is excluded:**

- Instances not reachable from the root container via transitive `contains`.
- Containers not part of the root container's membership hierarchy.
- Type and field definitions not referenced by any included instance.
- Source documents not referenced by any included instance.
- Relations with at least one endpoint outside the included instance set.

The exported archive MUST pass `srs repo validate` as specified in Change F.

### Change E — Dangling-edge policy

When a relation in the source repository has one endpoint inside the closure and one endpoint outside it, that relation is a *dangling edge* at export time. Dangling edges MUST NOT appear in the slice archive's relations collection.

Dangling edges are instead recorded in the `slice.externalRelationRefs` array in the slice manifest. Each entry records the `sourceInstanceId`, `targetInstanceId`, and `relationType` of the excluded relation, providing a complete provenance trace of what cross-boundary edges were cut at export.

```json
"slice": {
  "origin": { "repositoryId": "..." },
  "spec": { "type": "container", "id": "..." },
  "exportedAt": "...",
  "externalRelationRefs": [
    {
      "sourceInstanceId": "<uuid>",
      "targetInstanceId": "<uuid>",
      "relationType": "depends-on"
    }
  ]
}
```

An empty `externalRelationRefs` array (or omission of the field) indicates no edges were cut. A consumer MAY use `externalRelationRefs` for provenance tracing or to prompt the user that "this slice has N cross-boundary relations to the source repository"; it MUST NOT treat a non-empty list as a validation error.

This approach follows the ext:federation graceful-degradation contract: cross-boundary edges are not silently dropped; they are preserved as provenance data so the slice is inspectable and the cut is auditable without requiring access to the source repository.

### Change F — Validation semantics for slices

A slice archive MUST pass `srs repo validate` with the following normative relaxations:

1. **Missing origin-repository references** — `externalRelationRefs` entries reference instance UUIDs that do not exist in the slice's `instanceIndex`. This is expected and MUST NOT produce a validation error. An implementation MAY surface an informational (non-blocking) diagnostic noting the count of external references.
2. **Incomplete package definitions** — for a container slice, the `package/` directory contains only the definitions referenced by included instances. A reference from a included instance to a definition that is present in the slice archive is valid; the absence of unreferenced definitions is not a validation error.
3. **Incomplete container hierarchy** — a container slice need not include the source repository's root container or any containers outside the closure root's hierarchy.

The following remain errors regardless of slice status:

- Any relation in the slice's relations collection whose `sourceInstanceId` or `targetInstanceId` is not in `instanceIndex`. (Dangling edges must go into `externalRelationRefs`, not the relations collection.)
- Any `typeId` referenced by an included instance that does not resolve to a definition in the slice archive's `package/` directory.
- Any `fieldId` referenced by an included instance that does not resolve to a definition in the slice archive's `package/` directory.
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
> **[R5]** For a package-boundary slice (`spec.type: "package"`): the included instances, relations, type/field definitions, source documents, and containers MUST conform to the package-boundary closure defined in Change C.
>
> **[R6]** For a container slice (`spec.type: "container"`): the included instances, relations, type/field definitions, source documents, and containers MUST conform to the container-membership closure defined in Change D.
>
> **[R7]** A conformant slice producer MUST NOT include in the slice archive's relations collection any relation with a `targetInstanceId` or `sourceInstanceId` that is not present in the slice archive's `instanceIndex`. Such cross-boundary relations MUST be recorded in `slice.externalRelationRefs[]` instead.
>
> **[R8]** A conformant slice producer MUST populate `slice.externalRelationRefs[]` with every relation from the source repository that was excluded because one endpoint fell outside the closure. The list MUST be complete: silent dropping of cross-boundary edges is non-conformant.
>
> **[R9]** A conformant consumer MUST NOT treat a non-empty `slice.externalRelationRefs[]` as a validation error. The list is provenance data, not a defect.
>
> **[R10]** A slice archive MUST pass `srs repo validate` with the normative relaxations defined in Change F. Any validation error not covered by those relaxations is a real error.
>
> **[R11]** Record-level closure (`spec.type: "record"`) is not defined by this RFC. A conformant implementation MUST NOT produce or accept a slice with `spec.type: "record"`. An implementation encountering an unrecognised `spec.type` value MUST surface a diagnostic and MUST NOT silently ignore the `slice` block.
>
> **[R12]** A slice archive produced from a container closure MUST include a self-contained `package/` directory containing all and only the type and field definitions referenced by the included instances. A conformant consumer MUST resolve `typeId`/`fieldId` references from within the slice archive's own package directory — it MUST NOT require access to the source repository's packages to validate or render the slice.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Add optional `slice` property to the top-level manifest object. Add `$defs.Slice`, `$defs.SliceSpec`, and `$defs.SliceExternalRef` definitions (see details below). |

No other files in `docs/schema/2.0/` require changes:

- The slice archive's instance files (`record.json`, `note.json`, `typed-record.json`) are unchanged — the slice extension is expressed entirely through the manifest.
- `relations-collection.json` is unchanged — the slice's relations collection contains only valid (non-dangling) relations; dangling edges are in the manifest `slice` block, not the relations file.
- `package-manifest.json` is unchanged — the package directory in a container slice is a structural copy of definitions from the source, not a new package format.

**`$defs.Slice` shape to add to `manifest.json`:**

```json
"Slice": {
  "type": "object",
  "required": ["origin", "spec", "exportedAt"],
  "additionalProperties": false,
  "description": "ext:slices. Present when this archive is a partial export (slice) of a source repository. See RFC-026.",
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
      "description": "Relations cut at export because one endpoint fell outside the closure. Provenance only — not a validation error."
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
      "description": "Closure rule: 'package' = package-boundary closure; 'container' = container-membership closure."
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "The boundary UUID: a package-boundary ID for type 'package', a containerId for type 'container'."
    }
  }
},
"SliceExternalRef": {
  "type": "object",
  "required": ["sourceInstanceId", "targetInstanceId", "relationType"],
  "additionalProperties": false,
  "description": "A relation cut at export time because one endpoint was outside the closure.",
  "properties": {
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
      "description": "The relationType of the cut relation (e.g. 'depends-on', 'evidences')."
    }
  }
}
```

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**A slice is a valid `.srs` archive, not a new format.** Reusing the RFC-017 archive format means every existing SRS tool can open, validate, and render a slice without modification. The only new information is the `slice` manifest block, which a tool that predates this RFC ignores gracefully. This minimises the implementation surface while delivering the portability requirement.

**Provenance via manifest block, not sidecar.** The `slice` block lives in `manifest.json`, the single authoritative entry point for any `.srs` archive. A consumer discovering a slice does not need to scan additional files — the manifest tells them everything about the export's origin and scope. Encoding provenance in a separate sidecar would require consumers to locate and parse an additional file, and would be silently missing in archives produced by non-conformant tools.

**New `repositoryId` for the slice.** A slice is an independent artifact. Giving it the source repository's `repositoryId` would cause any tool that tracks repositories by UUID to confuse the slice with the source. The `slice.origin.repositoryId` provides the provenance link; the archive's own `repositoryId` keeps the archive distinct.

**`externalRelationRefs` over silent drop.** Silently dropping cross-boundary relations loses provenance. A consumer receiving a container slice of "Decision Records" cannot know whether the absence of a `depends-on` edge is because the dependency was never modelled, or because the dependency target fell outside the exported container. Recording cut edges in `externalRelationRefs` makes the slice auditable: a tool can report "this slice cut 12 cross-boundary relations to the source repository" and a reviewer can decide whether those dependencies matter for their use case. This follows the ext:federation graceful-degradation contract, which established the same principle for federated repositories: absent content is surfaced, not silently hidden.

**`externalRelationRefs` in the manifest, not the relations collection.** Cut relations are not valid relations within the slice — they reference instance UUIDs that do not exist in the slice's `instanceIndex`. Placing them in the relations collection would create dangling edges that fail `repo validate`. The manifest is the correct location for provenance metadata that is not part of the repository's semantic content.

**Container closure copies definitions, does not reference the source.** A container slice must be self-contained: a consumer must be able to validate and render it without access to the source repository. Referencing definitions by package identity (expecting them to be pre-installed) would break the portability goal. The definition copy is a one-time cost at export time.

**Package closure is "free" from the boundary model.** A `PackageBoundarySnapshot` (the implementation-level concept from ADR-033) already defines a complete, consistent member set. Package closure does not need a new closure engine; it filters an existing defined set.

**Record-level closure is deferred.** General record-closure (export an arbitrary set of records) requires a dependency-closure engine that traverses `depends-on`, `derived-from`, and other relation types to find the minimum complete set. This engine does not yet exist in the spec or implementation. This RFC defers record closure rather than define it incompletely. The `spec.type` enum is intentionally closed to `["package", "container"]`; record closure will be added in a future RFC when its dependency-traversal semantics are defined.

---

## Alternatives Considered

### Alt A — New archive format for slices (`.srss` or similar)

Defining a separate archive format for slices was considered. Rejected: it would require new tooling for producers and consumers, and existing `srs repo validate` and `srs render` commands would not work on slices without modification. The whole-archive format with a manifest marker achieves the same result with zero new format infrastructure.

### Alt B — Silent drop of dangling edges

Dropping cross-boundary relations without recording them was considered for simplicity. Rejected: it permanently loses provenance. A consumer cannot distinguish a slice that genuinely has no cross-boundary dependencies from one that had many. The ext:federation graceful-degradation precedent showed that explicit external-reference recording is the right model.

### Alt C — Include dangling edges in the relations collection with a `status: "external"` marker

Preserving cross-boundary relations in the slice's relations collection with a new `status` field was considered. Rejected: it would require validators to ignore dangling-target errors for `status: "external"` relations, creating a validator special-case. It also conflicts with RFC-022 (Relational Lifecycle States), which already owns the `status` field on relations. The `externalRelationRefs` list in the manifest is cleaner: it is unambiguously provenance data, not a semantic relation in the repository.

### Alt D — Reuse source repository's `repositoryId` for the slice

Copying `repositoryId` from the source into the slice manifest was considered (with `slice.origin.repositoryId` being omitted as redundant). Rejected: it causes UUID collisions when a system tracks multiple slice archives of the same source repository, and confuses any tool that indexes archives by `repositoryId`. A new UUID per slice keeps archives distinct and the provenance link is carried by `slice.origin.repositoryId`.

### Alt E — `slice` as a sidecar file alongside `manifest.json`

Placing slice metadata in a separate `slice.json` file was considered. Rejected: `manifest.json` is the guaranteed entry point; every SRS tool reads it first. A sidecar requires consumers to discover and parse an extra file and may be absent in hand-assembled archives.

---

## Open Questions

1. **Slice reintegration (provenance for merge-back)** — this RFC establishes the provenance marker (`slice.origin.repositoryId`, `externalRelationRefs`) required to make slice reintegration *possible* without specifying it. The mechanics of merging a slice back into the source repository — including divergence detection, conflict resolution, and the interaction with RFC-014 (import tracking) and RFC-010 (assisted three-way merge) — are deferred to a future RFC (tracked in muDemocracy.org#116). The `slice` block's provenance fields are designed to be sufficient for a future reintegration RFC to build on.

2. **`slice.spec.id` for package closure** — the `spec.id` for a package-boundary slice is described as a "package-boundary UUID". The normative source for this UUID is implementation-defined (the `srs-rust` ADR uses `PackageBoundarySnapshot` with a boundary path). A future RFC or ADR should assign a canonical identity scheme for package boundaries visible in the SRS data model (so that `spec.id` is independently verifiable without implementation knowledge). For now, `spec.id` is a producer-assigned UUID that uniquely identifies the boundary within the source repository.
