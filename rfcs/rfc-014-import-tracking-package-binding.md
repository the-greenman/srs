> **GitHub issue**: [the-greenman/srs#109](https://github.com/the-greenman/srs/issues/109)

# RFC-014: Import Tracking & Package Binding

**Status**: Draft (Revision 1)
**Affects**: `manifest.json` (new top-level `upstreamPackage` field; `PackageRef` gains `packageVersion` for local mode), `ext:import-tracking` (repository-level divergence reporting), Distribution Group (Core)
**Author**: Peter Brownell (from issue the-greenman/srs#107)
**Date**: 2026-07-02
**Builds on**: RFC-003 (Definition Distribution — extracts only the import-tracking and package-binding sub-scope; `ext:registry`, `ext:federation`, and `ext:binding` remain in RFC-003 and are explicitly out of scope here)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-02 | Initial draft |

---

## Abstract

SRS already carries the building blocks for package provenance: `meta.upstreamPackage` in the manifest schema and `ext:import-tracking` for per-definition tracking. What is missing is formal specification: `meta.upstreamPackage` is framed as an "implementation-local" hint rather than a normative concept, the upgrade model ("what happens when you install a newer package version alongside the old?") is unspecified, and the divergence-detection hook in `ext:import-tracking` has no defined trigger at the repository level.

This RFC formalises the minimum viable provenance and upgrade contract. It promotes `upstreamPackage` to a first-class top-level manifest field, specifies multi-version install semantics (install alongside, no auto-migration), makes record-definition version pinning explicit and normative, and defines what "divergence" means at the repository level. Registry distribution, federation, and package authoring workflows remain out of scope.

---

## Motivation

### Problem 1 — Provenance stamp is informal

`manifest.json` carries a `meta.upstreamPackage` property that records the upstream Package a repository was initialised from. The schema describes `meta` as "implementation-local key-value pairs." As a result a conformant tool can ignore `meta.upstreamPackage` entirely without violating the spec, and two tools that both write the field can interpret it differently. The field exists to support the "yours for keeps" guarantee — a repository always knows where it came from — but that guarantee has no normative force today.

### Problem 2 — Upgrade semantics are unspecified

When `com.mudemocracy.governance@1.1.0` is published, a repository initialised from `1.0.0` has no spec-level guidance on how to proceed. Does the old package stay installed? Do existing records need to be migrated? May both versions co-exist? The current spec is silent. Without a clear answer, every implementation is forced to invent its own upgrade path, which makes migration coordination across tools fragile.

### Problem 3 — Divergence detection has no formal trigger

`ext:import-tracking` defines `ImportRecord.conflictState` with values including `"upstream-ahead"`, which is exactly the signal that indicates a newer upstream version is available. But nothing in the spec defines:
- What event sets `conflictState` to `"upstream-ahead"` at the repository level
- How the repository-level `upstreamPackage` connects to the per-definition `ImportRecord` table
- What a conformant tool must do (or may do) when this signal is present

---

## Proposed Changes

### Change A — Promote `upstreamPackage` to a top-level manifest field

Move `upstreamPackage` from `manifest.meta.upstreamPackage` to a first-class top-level property `manifest.upstreamPackage`. The shape (`UpstreamPackage`) is unchanged:

```typescript
{
  packageId:   UUID        // Stable UUID of the upstream Package. Never changes across upgrades.
  namespace:   string      // Reverse-DNS namespace, e.g. "com.mudemocracy.governance"
  name:        string      // Package name, e.g. "governance"
  version:     string      // Semver of the upstream version at last install/upgrade, e.g. "1.0.0"
  installedAt: ISO8601     // Timestamp of the last install or upgrade event
}
```

`upstreamPackage` is normative when present: every conformant tool MUST read it and MUST write it in a canonical location (`manifest.upstreamPackage`, not `manifest.meta.upstreamPackage`). `meta.upstreamPackage` is deprecated by this RFC; tools SHOULD read `meta.upstreamPackage` as a fallback for repositories authored before RFC-014 is adopted, but MUST NOT write it in new or updated manifests.

When is `upstreamPackage` required? Any repository initialised from a published upstream Package (one with a stable `packageId`, `namespace`, `name`, and `version`) MUST set `upstreamPackage` at creation time. Repositories whose package is purely local and has never been published do not set `upstreamPackage`.

### Change B — `PackageRef` gains `packageVersion` for all modes

The existing `PackageRef` shape carries `packageVersion` only when `mode` is `"external"`. Local packages rely on reading the package manifest file to discover the version. This makes multi-version comparisons unnecessarily expensive and prevents quick manifest-level validation.

Extend `PackageRef` with an optional `packageVersion` field applicable to both `"local"` and `"external"` modes:

```typescript
"PackageRef": {
  mode:            "local" | "external"
  path?:           string      // local mode: relative path to package directory
  packageId?:      UUID        // external mode: identifies the package
  packageName?:    string      // external mode: human-readable name
  packageVersion?: string      // semver; SHOULD be set for both modes when the version is known
}
```

When `packageVersion` is set on a local-mode `PackageRef`, a tool MUST validate that the version matches the `version` field in the local package manifest. A mismatch is a validation error.

### Change C — Multi-version install semantics

When a new upstream package version is installed into a repository, the prior version MUST remain listed in `packageRefs`. Both entries co-exist:

```json
"packageRefs": [
  { "mode": "local", "path": "package/com.mudemocracy.governance/1.0.0", "packageVersion": "1.0.0" },
  { "mode": "local", "path": "package/com.mudemocracy.governance/1.1.0", "packageVersion": "1.1.0" }
]
```

The **current version** is the `PackageRef` whose `packageVersion` matches `upstreamPackage.version`. Older entries are retained to preserve the validity of records created under those definitions.

Two `PackageRef` entries for the same logical package (same `namespace` + `name` or same `packageId`) at different `packageVersion` values constitute a **multi-version install**. A multi-version install is valid and MUST validate clean.

**Identifying the same logical package across entries:** two `PackageRef` entries refer to the same logical package when their respective package manifests share the same `id` (UUID). The `packageId` field on an external-mode ref and the `id` in the local package manifest are the same identity anchor.

`manifest.upstreamPackage` is updated to the newly installed version at the completion of each upgrade:

```json
"upstreamPackage": {
  "packageId":   "…",
  "namespace":   "com.mudemocracy.governance",
  "name":        "governance",
  "version":     "1.1.0",
  "installedAt": "2026-07-02T00:00:00Z"
}
```

### Change D — Record-definition version pinning (normative)

SRS records reference their type by UUID (`typeId`). Type and Field definitions likewise carry stable UUIDs. This design already ensures that an existing record cannot be silently invalidated when a package is upgraded: the UUID the record points to remains the same definition it was created under.

This RFC makes the following explicit and normative:

- **No auto-migration.** A tool MUST NOT rewrite any record's `typeId`, `fieldId`, or `fieldValues` as a consequence of installing a new package version. Existing records are valid under the version of the definition they reference.
- **Intentional migration only.** A record may be migrated to a newer definition version by creating a new instance that supersedes or refines the old one, using the existing `supersedes` / `refines` relation vocabulary. The old instance continues to exist and remains valid until explicitly closed or superseded.
- **Old definitions remain resolvable.** A tool reading a multi-version repository MUST be able to resolve a reference to a definition at any installed version. Removing a prior version's package directory while records still reference its definitions is a validation error.

### Change E — Repository-level divergence detection

When `upstreamPackage` is set, a tool MAY detect whether the locally installed definitions at `upstreamPackage.version` differ from the published upstream package at that same version. This comparison is **divergence detection at the repository level**.

**What divergence means:** the repository's local copy of a definition (field or type file) has content that differs from the canonical content of the upstream package at `upstreamPackage.version`. This may result from a local edit, a partial upgrade, or corruption.

**How divergence is surfaced:** implementations that declare `ext:import-tracking` SHOULD represent per-definition divergence as `ImportRecord.conflictState: "diverged"` (local and upstream differ in an incompatible way) or `"upstream-ahead"` (upstream has a newer version available). These values are already defined by `ext:import-tracking` and require no extension to their shape.

**The repository-level trigger:** when `upstreamPackage` is set and `ext:import-tracking` is declared, a tool SHOULD check for divergence on manifest load and populate the `ImportSummary` accordingly. This check is advisory — it does not prevent the repository from loading or validating — but its result SHOULD be surfaced to the user or agent.

---

## Conformance Rules

> **[R1]** A repository initialised from a published upstream Package MUST set `manifest.upstreamPackage` at creation time. The value MUST reflect the upstream `packageId`, `namespace`, `name`, and `version` installed.

> **[R2]** When a new upstream package version is installed, the tool MUST retain all prior `PackageRef` entries in `manifest.packageRefs` and MUST update `manifest.upstreamPackage.version` and `installedAt` to reflect the newly installed version.

> **[R3]** A tool MUST NOT rewrite any record's `typeId`, `fieldId`, or `fieldValues` as a result of installing a new package version (no auto-migration).

> **[R4]** When `PackageRef.packageVersion` is set for a local-mode entry, the tool MUST validate that the value matches the `version` field in the local package manifest. A mismatch MUST be reported as a validation error.

> **[R5]** A multi-version repository (two or more `PackageRef` entries for the same logical package at different versions) MUST validate clean against the SRS 2.0 schema. Records created under any installed version remain valid.

> **[R6]** A tool MUST NOT remove a prior-version package directory from a multi-version install while records in the repository still reference definitions from that version.

> **[R7]** A tool writing or updating a manifest MUST write `upstreamPackage` at the top level of the manifest (not inside `meta`). Writing `meta.upstreamPackage` is deprecated and MUST NOT occur in tools conformant with RFC-014.

> **[R8]** Implementations declaring `ext:import-tracking` SHOULD check for repository-level divergence on manifest load and SHOULD populate per-definition `ImportRecord.conflictState` accordingly.

---

## Schema changes

| Schema file | Change |
|---|---|
| `manifest.json` | Add top-level `upstreamPackage` property (type `UpstreamPackage`, already defined in `$defs`). Keep `UpstreamPackage` $def unchanged. Add `packageVersion` to `PackageRef` applicable to `"local"` mode. Deprecate `meta.upstreamPackage` in description. |

`package-manifest.json`: no changes. Package identity (`id`, `namespace`, `name`, `version`) is already sufficient.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

### Why promote `upstreamPackage` to a top-level field rather than keeping it in `meta`?

`meta` is described as "implementation-local key-value pairs." Provenance is not implementation-local — it is a normative property of the repository that any conformant tool must read. Keeping it under `meta` signals optionality to implementers and validators; moving it to the top level signals normative intent. The `UpstreamPackage` $def shape is already well-specified and does not need to change.

### Why keep old `PackageRef` entries rather than replacing them on upgrade?

Because records reference definition UUIDs, not package version strings. If the old package directory is removed, a record that references a definition from `governance@1.0.0` can no longer be resolved, which is a validation error. Keeping the old entry is the only way to guarantee that existing records remain valid without forcing a migration. This aligns with the SRS data model principle that stable UUIDs are permanent.

### Why not specify auto-migration?

Auto-migration requires that a newer field or type definition be semantically compatible with the older version — a claim that cannot be verified mechanically. SRS's existing `supersedes`/`refines` relation vocabulary is the correct mechanism for expressing intentional migration at record granularity, where the author makes the semantic judgement. Auto-migration by a tool would silently rewrite records, violating the stable-UUID guarantee and the "provenance in the file" commitment.

### Why not define a divergence hash or checksum?

A checksum approach (store expected hash of each file at install time) would provide a strong divergence signal, but it would also require every install to compute and store checksums and every check to recompute them. This RFC intentionally keeps divergence detection as a SHOULD, leaving the detection mechanism to implementations. A future RFC may formalise a checksum-based approach as part of a more complete registry/upgrade workflow.

---

## Alternatives Considered

### Alt A — Keep `meta.upstreamPackage` and add normative language in prose only

This would avoid the schema change but would not update validators or tools that skip non-normative `meta` entries. The problem is that tools reading the schema today see `meta` as "implementation-local" and cannot distinguish normative from optional fields within it. A top-level field is unambiguous.

### Alt B — Require a single installed version (replace on upgrade)

Simpler manifest structure (one `PackageRef` per logical package), but requires either auto-migration or explicit acceptance that records become unresolvable. Both outcomes violate core SRS guarantees. Install-alongside preserves validity without forcing migration.

### Alt C — Combine with full `ext:binding` (RFC-003 Change D)

RFC-003 Change D defines a `BindingMode` mechanism for declared authoritative relationships with upstream sources. That is a richer (and more complex) capability than this RFC targets. The "Decision Log" release timeline requires the provenance stamp and upgrade model to be specified now; the binding relationship can wait for RFC-003's full adoption.

---

## Open Questions

1. **Divergence check timing:** this RFC says implementations SHOULD check on manifest load (R8). Should it instead be advisory (no SHOULD, purely capability)? The concern is that a SHOULD imposes a performance cost on every manifest load even when the user does not want it. **Resolution needed before Accepted.**

2. **Backward compatibility window for `meta.upstreamPackage`:** how long should tools continue to read `meta.upstreamPackage` as a fallback? The acceptance fixture (muDemocracy.org governance seed from muDemocracy.org#38) was authored before this RFC and uses `meta.upstreamPackage`. A migration path is needed. **Proposed:** tools MUST read both locations during a transition window; the seed is updated as part of the 1.1.0 upgrade fixture (muDemocracy.org#55, #56).
