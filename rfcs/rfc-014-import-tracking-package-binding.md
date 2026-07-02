> **GitHub issue**: [the-greenman/srs#109](https://github.com/the-greenman/srs/issues/109)

# RFC-014: Import Tracking & Package Binding

**Status**: In Progress (Revision 4)
**Affects**: `Package`, `PackageRef`, `UpstreamPackage` in the Distribution Group; `ext:import-tracking` (repository-level divergence reporting); schema `manifest.json`
**Author**: Peter Brownell (from issue the-greenman/srs#107)
**Date**: 2026-07-02
**Builds on**: RFC-003 (Definition Distribution — extracts only the import-tracking and package-binding sub-scope; `ext:registry`, `ext:federation`, and `ext:binding` remain in RFC-003 and are explicitly out of scope here. After this RFC is accepted, RFC-003 Changes C–G — `ConflictRecord`, ext:repository-slices, and distribution — remain unchanged in scope. Only the sub-scope described here moves to RFC-014.)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-02 | Initial draft |
| 2 | 2026-07-02 | Address review findings: fix R1 trigger (tool-behaviour, not structural test); correct Change B (packageVersion is not new, remove external-mode restriction); add fallback algorithm for absent packageVersion in Change C; remove "upstream-ahead" from Change E scope (requires registry); clarify ImportSummary storage is implementation-defined; downgrade R8 to MAY and close OQ1; add Migration section and close OQ2; add R9; add packageId to local-mode PackageRef; add ConflictRecord relationship note; fix schema changes table; add srsVersion note; fix nits. |
| 3 | 2026-07-02 | Address Revision 2 review findings: correct Change B (packageId already exists — update description, not add field); fix schema item (3) to cover both local and external modes; explicitly state upstreamPackage is not added to required array; add R4a (external-mode packageId MUST, behavioral); rewrite R6 to union resolution semantics with Invariant 50 inlined (removes per-version scoping and "created under that version"); fix R9 "invalid" → "non-conformant" with tool behavior clause and version-based end condition; add R10 (packageId linkage rule between upstreamPackage and PackageRef); add R1 read-time-validator exemption; add R4 offline fallback clause; add schema changes rows (5)(6)(7) for packageRefs, packageRef-singular fate, and packageName; update Change E ConflictRecord note to "not yet normative"; add [RESOLVED] markers; add manifest-only-validator exemption to Change C fallback; add conformance fixture structure specification. |
| 4 | 2026-07-02 | Address Revision 3 completeness finding: add manifest-only-validator MAY-skip exemption to R10 (parallel to Change C's exemption for identity check); add R10 rationale entry; label muDemocracy.org fixture reference as informational. |

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

### Problem 3 — Divergence detection has no formal definition

`ext:import-tracking` defines `ImportRecord.conflictState: "diverged"`, which is exactly the signal that the locally installed definitions differ from the upstream published version. But nothing in the spec defines:
- What "divergence" means at the repository level (locally detectable without a registry)
- How the repository-level `upstreamPackage` connects to the per-definition `ImportRecord` table
- What a conformant tool may do when this signal is present

(Note: detecting that a _newer_ version of the upstream package is available requires registry access and is out of scope for this RFC. That use case uses `conflictState: "upstream-ahead"` and belongs to `ext:registry` / RFC-003.)

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

`upstreamPackage` is normative when present: every conformant tool MUST read it and MUST write it at `manifest.upstreamPackage` (not `manifest.meta.upstreamPackage`). `meta.upstreamPackage` is deprecated by this RFC; see Migration.

**When does a repository carry `upstreamPackage`?** A tool that creates a repository by instantiating a published upstream Package MUST set `upstreamPackage` at creation time. Repositories whose package is purely local-development and has never been installed from an upstream source do not set `upstreamPackage`. This is a tool-creation-time rule, not a structural constraint that a read-time validator can independently verify.

### Change B — Remove the `external`-mode restriction from `PackageRef.packageVersion` and `PackageRef.packageId`

`PackageRef.packageVersion` already exists in the manifest schema with description "Semver of the external package (external mode)." This RFC removes that restriction: `packageVersion` now applies to both `"local"` and `"external"` mode entries and SHOULD be set whenever the version is known.

The rationale for SHOULD (not MUST) for local-mode entries: existing local-mode repositories authored before RFC-014 omit `packageVersion` from their `PackageRef`; a MUST would make those manifests invalid. New tools SHOULD always write it.

Updated `packageVersion` description: "Semver of the package (both local and external modes). SHOULD be set when the version is known."

Additionally, `PackageRef.packageId` already exists in the manifest schema with description "Identifies the external package (external mode)." This RFC expands `packageId` to apply to local-mode `PackageRef` entries as well, so that the identity of the logical package is readable from the manifest without cross-file I/O. For external mode, `packageId` remains a tool-behavioral requirement (R4a). For local mode, `packageId` is optional.

```typescript
"PackageRef": {
  mode:            "local" | "external"
  path?:           string   // local mode: relative path to package directory
  packageId?:      UUID     // optional for local mode; required for external mode (R4a — behavioral, not JSON Schema)
  packageName?:    string   // human-readable name (any mode, optional)
  packageVersion?: string   // semver; SHOULD be set for both modes when the version is known
}
```

When `packageVersion` is set on a local-mode `PackageRef`, a tool MUST validate that the value matches the `version` field in the local package manifest. A mismatch MUST be reported as a validation error.

### Change C — Multi-version install semantics

When a new upstream package version is installed into a repository, the prior version MUST remain listed in `packageRefs`. Both entries co-exist:

```json
"packageRefs": [
  {
    "mode": "local",
    "path": "package/com.mudemocracy.governance/1.0.0",
    "packageId": "b1234567-…",
    "packageVersion": "1.0.0"
  },
  {
    "mode": "local",
    "path": "package/com.mudemocracy.governance/1.1.0",
    "packageId": "b1234567-…",
    "packageVersion": "1.1.0"
  }
]
```

The **current version** is identified as follows:
1. If `packageVersion` is set on the entry, the entry whose `packageVersion` matches `upstreamPackage.version` is the current version.
2. If `packageVersion` is absent on a local-mode entry, the tool reads the `version` field from the package manifest at `path` and compares it to `upstreamPackage.version`.
3. When neither method yields a match, the repository is in an inconsistent state and MUST be reported as a validation error.

Manifest-only validators MAY skip step 2 and report the repository state as indeterminate rather than a validation error when `packageVersion` is absent and no package-manifest file is loaded.

**Identifying the same logical package across entries:** two `PackageRef` entries refer to the same logical package when they share the same `packageId`. For local-mode entries that do not set `packageId`, the tool reads the `id` field from each local package manifest to compare. Manifest-only validators MAY skip the multi-version identity check when `packageId` is absent on local-mode entries.

**Migration from `packageRef` (singular) to `packageRefs`:** if the repository currently declares only the singular `packageRef`, the first multi-version install requires migrating to `packageRefs`: move the existing entry into `packageRefs[0]` and add the new entry as `packageRefs[1]`. The singular `packageRef` field is superseded by `packageRefs` for multi-version repositories.

`manifest.upstreamPackage` is updated to the newly installed version at the completion of each upgrade:

```json
"upstreamPackage": {
  "packageId":   "b1234567-…",
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
- **Old definitions remain resolvable.** A tool reading a multi-version repository MUST be able to resolve a reference to a definition at any installed version. A `typeId` or `fieldId` that cannot be resolved by any installed package version's directory is a validation error (see R6, which extends Invariant 50 to multi-version repositories).

### Change E — Repository-level divergence detection

When `upstreamPackage` is set, a tool MAY detect whether the locally installed definitions at `upstreamPackage.version` differ from the canonical content of the upstream package at that same version. This comparison is **divergence detection at the repository level.**

**What divergence means:** the repository's local copy of a definition file (field or type JSON) has content that differs from the canonical content of the upstream package as published at `upstreamPackage.version`. This may result from a local edit, a partial upgrade, or corruption.

**Scope:** divergence detection is strictly local — it compares the installed definition files against a reference copy. Detecting that a _newer_ version of the upstream package is available requires registry access and is out of scope for this RFC (see Motivation Problem 3). The `conflictState: "upstream-ahead"` signal is not in scope for R8; it becomes applicable once `ext:registry` and RFC-003 are in scope.

**Minimum detection approach:** a conforming implementation compares the content of each definition file in the installed package directory against a reference copy. The reference copy is either: (a) a byte-for-byte snapshot stored at install time in an implementation-defined location; or (b) re-fetched from the published source of `upstreamPackage` if network access is available. A tool that has no reference copy simply skips the check.

**How divergence is surfaced:** implementations that declare `ext:import-tracking` MAY represent per-definition divergence as `ImportRecord.conflictState: "diverged"` (local and upstream differ). This value is already defined by `ext:import-tracking` and requires no extension to its shape.

A divergence detected at the repository level SHOULD update `ImportRecord.conflictState` for each affected definition. Creating a `ConflictRecord` as defined in RFC-003 Change C (`ext:import-tracking`) is recommended but forward-looking: `ConflictRecord` becomes normative only after RFC-003 is accepted. Until then, implementations SHOULD NOT attempt to persist `ConflictRecord` entries for divergence.

**Storage of `ImportSummary`:** the location of the `ImportSummary` file is implementation-defined and not standardised by this RFC. A future RFC should add a manifest pointer (e.g., `importTrackingPath`) alongside `relationsPath`; until then, tools may not assume they can read another tool's `ImportSummary`.

---

## Conformance Rules

> **[R1]** A tool that creates a repository by instantiating an upstream published Package MUST set `manifest.upstreamPackage` at creation time. The value MUST reflect the upstream `packageId`, `namespace`, `name`, and `version` installed. A read-time validator MUST NOT report a conformance failure for a repository that lacks `manifest.upstreamPackage` unless the validator has independent evidence that the repository was created from an upstream Package (e.g., from the migration state of `meta.upstreamPackage`).

> **[R2]** When a new upstream package version is installed, the tool MUST retain all prior `PackageRef` entries in `manifest.packageRefs` and MUST update `manifest.upstreamPackage.version` and `installedAt` to reflect the newly installed version.

> **[R3]** A tool MUST NOT rewrite any record's `typeId`, `fieldId`, or `fieldValues` as a result of installing a new package version (no auto-migration).

> **[R4]** When `PackageRef.packageVersion` is set for any `PackageRef` entry, the tool MUST validate that the value matches the `version` field in the package manifest for that entry (read from `path` for local mode, or from registry metadata for external mode). A mismatch MUST be reported as a validation error. For external-mode entries, when registry metadata is not reachable, the tool SHOULD emit a diagnostic warning and MAY skip the version-match check rather than failing validation.

> **[R4a]** A `PackageRef` entry with `mode: "external"` MUST set `packageId`. This is a tool-behavioral requirement; the JSON Schema does not enforce it via a conditional `required` array. A conformant tool MUST report a validation error when an external-mode `PackageRef` omits `packageId`.

> **[R5]** A multi-version repository (two or more `PackageRef` entries for the same logical package at different versions) MUST validate clean against the SRS 2.0 schema. Records created under any installed version remain valid.

> **[R6]** A tool MUST resolve every `typeId` and `fieldId` referenced by any Tier 2 Record against the union of all installed package version directories. This extends Invariant 50 — "the package at the declared path must be `mode: 'bundled'` and must include all Fields and Types referenced by any Tier 2 Record in the repository's instance index" — to the multi-version case: a reference is resolved if it can be found in any installed version directory. A reference that cannot be found in any installed version directory MUST be reported as a validation error. A tool MUST NOT remove any prior-version package directory if doing so would leave any such reference unresolvable.

> **[R7]** A tool writing or updating a manifest MUST write `upstreamPackage` at the top level of the manifest (not inside `meta`). Writing `meta.upstreamPackage` is deprecated and MUST NOT occur in tools conformant with RFC-014.

> **[R8]** Implementations declaring `ext:import-tracking` MAY check for repository-level divergence (see Change E). When they do, they SHOULD populate per-definition `ImportRecord.conflictState: "diverged"` for each definition whose locally installed content differs from the reference copy. This check is advisory and does not prevent the repository from loading or validating.

> **[R9]** During a transition period, tools MUST read both `manifest.upstreamPackage` and `manifest.meta.upstreamPackage`, preferring the top-level location. A manifest that carries values at both locations is non-conformant (R7 prohibits writing `meta.upstreamPackage`; a manifest in that state is a migration error). A tool encountering both locations MUST treat this as a migration error: read the top-level value, silently ignore `meta.upstreamPackage`, and on next write complete the migration per the Migration section. The transition period ends when RFC-014 reaches 'Accepted' status and the conformance fixtures under `conformance/import-tracking/` are committed in RFC-014 format, or no later than the release of the first SRS tooling version that formally declares RFC-014 as stable; at that point, implementations MUST stop writing `meta.upstreamPackage` and MUST treat any manifest carrying it as requiring migration.

> **[R10]** When `manifest.upstreamPackage` is set, there MUST exist at least one entry in `manifest.packageRefs` (or `manifest.packageRef`) whose `packageId` matches `manifest.upstreamPackage.packageId`. A manifest where no `PackageRef` entry's `packageId` matches `upstreamPackage.packageId` MUST be reported as a validation error. Manifest-only validators MAY skip this check when no `PackageRef` entry carries `packageId` (i.e., all local-mode entries predate RFC-014 and omit the field), and SHOULD report the repository state as indeterminate rather than emitting a validation error in that case.

---

## Schema changes

| Schema file | Change |
|---|---|
| `manifest.json` | (1) Add top-level `upstreamPackage` property (`$ref: "#/$defs/UpstreamPackage"`; the `UpstreamPackage` $def is unchanged). `upstreamPackage` MUST NOT be added to the manifest `required` array; it remains an optional top-level property. (2) Update `PackageRef.packageVersion` description from "Semver of the external package (external mode)" to "Semver of the package (both local and external modes). SHOULD be set when the version is known." (3) Update the description of the existing `PackageRef.packageId` field (the field already exists; only the description changes). New description: "Stable UUID of the package. For external mode: identifies the upstream package (required per R4a, tool-behavioral, not JSON Schema enforced). For local mode: optional; when set, allows same-logical-package identity check without reading the package manifest file." (4) Update `meta.description` to add: "Note: `upstreamPackage` was previously accepted here; see `manifest.upstreamPackage` (RFC-014). Since `meta` permits additional properties, existing manifests remain schema-valid but conformant tools MUST NOT write `meta.upstreamPackage`." The `upstreamPackage` property under `meta.properties` may be removed in a follow-up schema cleanup; until then, its presence is inert for conformant tools. (5) Update `manifest.packageRefs` description to: "References to one or more SRS Packages that supply field and type definitions. Use instead of `packageRef` for multi-package and multi-version repositories (see RFC-014 Change C)." (6) `packageRef` (singular) remains in the schema as a deprecated optional field for backward compatibility. A manifest carrying both `packageRef` and `packageRefs` simultaneously MUST be reported as a validation error by conformant tools (behavioral, not JSON Schema enforced). A future RFC may remove `packageRef` from the schema entirely. (7) Update `PackageRef.packageName` description from "Human-readable name of the external package (external mode)" to "Human-readable name of the package (any mode, optional)." |

`package-manifest.json`: no changes. Package identity (`id`, `namespace`, `name`, `version`) is already sufficient.

**srsVersion note:** adding `upstreamPackage` as a top-level optional property is an additive change to the manifest schema. Repositories that do not use `upstreamPackage` are unaffected; a `srsVersion` bump is not required. Pre-RFC-014 manifests with only `meta.upstreamPackage` remain schema-valid (since `meta` has no `additionalProperties: false`), but conformant tools MUST NOT write to that location.

**Conformance fixture:** a conformance fixture demonstrating a multi-version install MUST be authored under `conformance/import-tracking/` and committed with the schema changes as part of RFC acceptance. The fixture must include at minimum: (a) a `manifest.json` with two `PackageRef` entries for the same `packageId` at different `packageVersion` values, (b) at least one record file whose `typeId` resolves in the older package version directory but not the newer, and (c) a `README.md` summarizing what the fixture demonstrates. The muDemocracy.org governance upgrade (1.0.0 → 1.1.0, muDemocracy.org#55/#56, informational reference) serves as the primary acceptance fixture.

**Schema sync targets:**
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Migration

### Repositories using `meta.upstreamPackage` (pre-RFC-014)

Repositories authored before this RFC carry `upstreamPackage` at `manifest.meta.upstreamPackage`. On first write or update of the manifest, a conformant tool MUST:
1. Read the value from `meta.upstreamPackage`.
2. Write it to the top-level `manifest.upstreamPackage`.
3. Remove the key from `meta`.

On read, tools MUST read `manifest.upstreamPackage` first and fall back to `meta.upstreamPackage` for pre-RFC-014 repositories (R9).

### Repositories using `packageRef` (singular)

A repository that currently uses the singular `packageRef` and has not yet undergone a multi-version upgrade may continue to use `packageRef` until it does. When the first multi-version upgrade occurs, the tool MUST migrate to `packageRefs`: move the existing entry to `packageRefs[0]`, write the new version as `packageRefs[1]`, and remove the singular `packageRef`. A manifest carrying both `packageRef` and `packageRefs` simultaneously is non-conformant (see schema changes item 6).

---

## Rationale

### Why promote `upstreamPackage` to a top-level field rather than keeping it in `meta`?

`meta` is described as "implementation-local key-value pairs." Provenance is not implementation-local — it is a normative property of the repository that any conformant tool must read. Keeping it under `meta` signals optionality to implementers and validators; moving it to the top level signals normative intent. The `UpstreamPackage` $def shape is already well-specified and does not need to change.

### Why keep old `PackageRef` entries rather than replacing them on upgrade?

Because records reference definition UUIDs, not package version strings. If the old package directory is removed, a record that references a definition from `governance@1.0.0` can no longer be resolved, which is a validation error under Invariant 50. Keeping the old entry is the only way to guarantee that existing records remain valid without forcing a migration. This aligns with the SRS data model principle that stable UUIDs are permanent.

### Why not specify auto-migration?

Auto-migration requires that a newer field or type definition be semantically compatible with the older version — a claim that cannot be verified mechanically. SRS's existing `supersedes`/`refines` relation vocabulary is the correct mechanism for expressing intentional migration at record granularity, where the author makes the semantic judgement. Auto-migration by a tool would silently rewrite records, violating the stable-UUID guarantee and the "provenance in the file" commitment.

### Why is R8 a MAY rather than a SHOULD?

Divergence detection requires reading all definition files in the installed package directory and comparing them against a reference copy. For large packages this is a non-trivial I/O cost on every manifest load. Making it SHOULD would impose this cost on all conformant implementations regardless of whether the user needs divergence detection. MAY leaves the capability to implementations that opt in, without penalising those that do not.

### Why is `ImportSummary` storage left to implementations?

Adding a manifest pointer for `ImportSummary` (e.g., `importTrackingPath`) would be the right long-term answer, but it adds another schema field and another manifest pointer to an RFC already introducing two new manifest-level fields. Deferring it keeps this RFC scoped to provenance and upgrade semantics, not tracking infrastructure. A follow-on RFC (or an extension to this one) should standardise the path.

### Why does R10 require `upstreamPackage.packageId` to be echoed in a `PackageRef` entry?

`upstreamPackage` names the logical package by `packageId`, `namespace`, and `version`. `packageRefs` is the list of installed versions of that package. Without R10 there is no machine-checkable link between these two manifest sections: a manifest could declare `upstreamPackage` for package X while listing only `PackageRef` entries for package Y, and no validator could detect the inconsistency without cross-referencing the package directory files. Using `packageId` as the linkage key — rather than `namespace` or `name`, which could theoretically change across major revisions — preserves the stable-UUID-as-identity-anchor principle throughout the manifest.

### Why is external-mode `packageId` a behavioral rule (R4a) rather than a JSON Schema `required` conditional?

JSON Schema 2020-12 conditional required patterns (using `if`/`then`) are verbose and add meaningful complexity to the schema. `packageId` has been present in `PackageRef` since before this RFC without being formally required; making it normatively required via prose and a behavioral rule achieves the conformance goal while keeping the schema simple. A future RFC may add the JSON Schema conditional if tooling support improves.

---

## Alternatives Considered

### Alt A — Keep `meta.upstreamPackage` and add normative language in prose only

This would avoid the schema change but would not update validators or tools that skip non-normative `meta` entries. A top-level field is unambiguous and aligns with how other normative manifest pointers are declared.

### Alt B — Require a single installed version (replace on upgrade)

Simpler manifest structure, but requires either auto-migration or explicit acceptance that records become unresolvable. Both outcomes violate core SRS guarantees. Install-alongside preserves validity without forcing migration.

### Alt C — Combine with full `ext:binding` (RFC-003 Change D)

RFC-003 Change D defines a `BindingMode` mechanism for declared authoritative relationships with upstream sources. That is a richer (and more complex) capability than this RFC targets. The Decision Log release timeline requires the provenance stamp and upgrade model to be specified now; the binding relationship can wait for RFC-003's full adoption. After RFC-014 is accepted, RFC-003 Changes C–G (ConflictRecord, ext:repository-slices, distribution) remain unchanged in scope.

---

## Open Questions

1. **[RESOLVED]** ~~Divergence check timing: SHOULD check on manifest load~~ — resolved as MAY (R8). Performance concern is valid; detection is opt-in capability. No SHOULD.

2. **[RESOLVED]** ~~Backward compatibility window for `meta.upstreamPackage`~~ — resolved by Change A and R9. On write: MUST migrate to top-level. On read: MUST fall back to `meta.upstreamPackage` for pre-RFC-014 repos (R9). Remaining action: muDemocracy.org governance seed (muDemocracy.org#38) must be updated as part of the 1.1.0 upgrade fixture (muDemocracy.org#55, #56) before RFC acceptance.
