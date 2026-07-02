# RFC-014: Import Tracking & Package Binding — Repository Provenance and Non-Destructive Package Upgrades

**Status**: In Progress (Revision 3)
**Affects**: `manifest.json` (`upstreamPackage` / `upstreamPackages` promoted to top-level normative fields; `UpstreamPackage` shape gains `contentHash`; mutual-exclusion constraint; `meta.upstreamPackage` deprecated), `ext:import-tracking` extension record (repository-level provenance contract added), version-pinning semantics, divergence-detection contract
**Author**: Peter Brownell (from issue the-greenman/srs#107)
**Date**: 2026-07-02
**Builds on**: RFC-003 (Definition Distribution, Draft — this RFC extracts only the repository-level provenance / package-binding sub-scope; RFC-003's broader per-definition `ext:import-tracking` and `ext:binding` content remains a separate proposal)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-02 | Initial draft |
| 2 | 2026-07-02 | Address review: align divergence vocabulary with existing `conflictState` enum (`clean`, not `in-sync`; `upstream-ahead` scoped out); rewrite Change D as extension-record update (record already exists); add `contentHash` to `UpstreamPackage`; mandate `supersedes`-only for typeVersion migration; machine-enforceable R8 constraint; migration section; single→plural path; rationale additions; resolved OQs |
| 3 | 2026-07-02 | Implementation started; RFC file committed to branch `claude/fervent-hawking-1gh8zn`; `manifest.json` schema changes applied; `ext:import-tracking` extension record updated (Change E) |

---

## Abstract

A repository built from a published SRS Package must record which package and version it was initialised from, machine-readably, so tooling can detect when local definitions have drifted from the installed version and offer a non-destructive upgrade path. This RFC formalises that provenance record as a normative top-level field on the repository manifest, adds a `contentHash` field to enable local divergence detection without network access, defines the version-pinning rule that keeps existing records valid across upgrades, and extends the existing `ext:import-tracking` extension record with the repository-level contract. Registry distribution, federation, and package-authoring workflows are explicitly out of scope.

---

## Motivation

### Problem 1 — Upstream provenance is an implementation hint, not a normative contract

`manifest.json` already carries a `meta.upstreamPackage` subkey described in the schema as a "common key" / "hook for the package-upgrade / drift story". Because `meta` is an implementation-local bag with no specified semantics, tooling cannot rely on it for machine-readable provenance or upgrade detection — two systems may write completely different shapes there. A repository initialised from a published package and then shared externally ("yours for keeps", per muDemocracy.org milestone) requires machine-readable provenance in a standardised, parseable location.

### Problem 2 — The upgrade model is unspecified

There is no normative statement covering what happens when a repository upgrades its upstream package from version 1.0.0 to 1.1.0:

- Do existing records require migration?
- Can new records use 1.1.0 types while old records keep their 1.0.0 types?
- What if a field or type was renamed or its `typeVersion` incremented?

Without a written rule, implementations diverge. The correct model — non-destructive, per-record pinning, intentional migration only — must be stated explicitly.

### Problem 3 — Divergence detection has no contract

"Has my local package definition drifted from what the upstream version declared at install time?" is a question consumers need to answer, but the existing `ext:import-tracking` extension record defines `conflictState` only for per-definition `ImportRecord`s, not for the repository-level package as a whole. There is no specified shape for reporting the answer at the repository level, and no stored anchor (checksum) against which to compare.

---

## Proposed Changes

### Change A — Promote `upstreamPackage` to a top-level normative manifest field

Remove the `meta.upstreamPackage` hint (deprecated per Change E) and replace it with a top-level optional field `upstreamPackage` on `manifest.json`. For repositories built from more than one package, add the parallel `upstreamPackages` array.

**`upstreamPackage` (single-package shorthand):**

```json
"upstreamPackage": {
  "packageId": "uuid-of-the-upstream-package",
  "namespace": "com.mudemocracy.governance",
  "name": "governance",
  "version": "1.0.0",
  "installedAt": "2026-03-01T00:00:00Z",
  "contentHash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**`upstreamPackages` (multi-package, two or more):**

```json
"upstreamPackages": [
  {
    "packageId": "uuid-of-package-A",
    "namespace": "com.mudemocracy.governance",
    "name": "governance",
    "version": "1.0.0",
    "installedAt": "2026-03-01T00:00:00Z",
    "contentHash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "packageId": "uuid-of-package-B",
    "namespace": "com.example.shared",
    "name": "shared-fields",
    "version": "2.1.0",
    "installedAt": "2026-04-15T00:00:00Z",
    "contentHash": "sha256:abc123..."
  }
]
```

A repository MUST NOT declare both `upstreamPackage` and `upstreamPackages` (see R8; enforced in JSON Schema via `not: {required: [...both...]}` — see Schema changes).

Use `upstreamPackage` for exactly one upstream package; use `upstreamPackages` for two or more. When a repository that originally declared `upstreamPackage` later acquires a second upstream package, the author MUST remove `upstreamPackage` and replace it with `upstreamPackages` containing both entries — including the original entry with its original `installedAt` and `contentHash`.

The `UpstreamPackage` shape is extended with a new required field `contentHash` (see Change B). All other fields are unchanged from the existing `$defs` definition.

### Change B — Add `contentHash` to `UpstreamPackage`

Add a required field `contentHash` to the `UpstreamPackage` shape:

```typescript
contentHash: string
// SHA-256 hash of the upstream package content at install time.
// Format: "sha256:<hex-digest>" (lowercase hex).
// Computed as SHA-256 over the canonical byte sequence of the
// package-manifest.json followed by each definition file (fields,
// types, views, etc.) listed in the package manifest, in the order
// they appear in the manifest's arrays, with no separator bytes.
// Stored at install time; updated when the upstream package is upgraded.
```

The `contentHash` algorithm is SHA-256 applied to the concatenation of:
1. The raw bytes of `package-manifest.json` (UTF-8, no BOM)
2. The raw bytes of each file listed in `package-manifest.json → fields[]`, `types[]`, `views[]`, `documentViews[]`, `themes[]`, `relationTypes[]`, `vocabularies[]`, `lifecycles[]`, `blueprints[]`, `protocols[]` — in that property order, and within each array in declaration order

Implementations MUST record the `contentHash` at install time and MUST update it when the upstream package is upgraded.

### Change C — Define version-pinning semantics

Each Tier 2 Record carries a `typeVersion` integer in its stored JSON (defined in `record.json` — the `typeVersion` integer required on every Tier 2 Record). `typeVersion` is the **pinning anchor**: it records the type schema contract in force when the record was created.

> **[R1]** When a repository upgrades its upstream package (i.e. `upstreamPackage.version` or an entry in `upstreamPackages[].version` increases), implementations MUST NOT modify the `typeVersion` value of any existing Record. Existing records remain valid under the type contract declared by their stored `typeVersion`.

> **[R2]** New records created after an upgrade MAY reference any type version present in the installed package. An implementation MUST default new record creation to the highest `typeVersion` value declared for the specific Type being instantiated in the installed package.

> **[R3]** A repository MUST remain fully round-trippable (write then re-read, no data loss) across a package upgrade. An upgrade that causes any existing record to fail validation under its stored `typeVersion` is a **breaking upgrade** and MUST be rejected unless an explicit named migration operation is invoked. (The exact interface — CLI subcommand, API method, or UI action — is implementation-defined but MUST be documented and MUST NOT occur implicitly during a routine upgrade operation.)

> **[R4]** Intentional record migration (upgrading a record from `typeVersion` N to N+1) MUST use a `supersedes` relation from the new record to the old one. The old record MUST remain in the repository with a non-terminal lifecycle state (e.g. `superseded`) until the author explicitly removes it. `refines` MUST NOT be used for typeVersion migration; it is reserved for addendum records that extend without retiring the original.

### Change D — Define the repository-level divergence-detection contract

A conforming implementation that declares `ext:import-tracking` MUST be able to report whether the local package content (at the path declared by the repository's `packageRef.path`, or the matching `packageRefs` entry's `path`, for `mode: "local"`) has drifted from the upstream at install time.

"Locally resolvable" means: the package directory declared by `packageRef.path` (or the relevant `packageRefs[].path`) is present and its `package-manifest.json` passes schema validation, AND `upstreamPackage.contentHash` (or the matching `upstreamPackages` entry's `contentHash`) is set.

The contract reports one of three states (using the existing `conflictState` vocabulary from `ext:import-tracking`):

| State | Description |
|---|---|
| `clean` | Recomputing the content hash of the local package yields the same value as the stored `contentHash`. No drift. |
| `local-ahead` | The local package contains definitions (by `id`+`version` key) not present in the upstream at install time. The stored hash differs; all differing ids are locally-added. |
| `diverged` | One or more local definition files differ from what the upstream declared under the same `id`+`version` key. |

When both `local-ahead` and `diverged` conditions hold simultaneously, implementations MUST report `diverged` as the primary status and MUST include the locally-added definitions as a supplementary list.

The `upstream-ahead` state (a newer package version is available from a remote registry) is outside this RFC's scope and requires `ext:registry`. Implementations MUST NOT conflate "newer version exists upstream" with `diverged`.

> **[R5]** When `upstreamPackage` or a matching entry (matched by `packageId`) in `upstreamPackages` is present and locally resolvable, a conforming `ext:import-tracking` implementation MUST be able to report `clean`, `local-ahead`, or `diverged` for the repository's local package content.

> **[R6]** A `diverged` report MUST identify each differing definition by `id` + `version` + `name`. It MUST NOT silently resolve divergence without user action.

> **[R7]** A repository where `upstreamPackage` and `upstreamPackages` are both absent, or where the package is not locally resolvable, is exempt from divergence-detection requirements; the feature is opt-in via field presence.

> **[R8]** A repository MUST NOT declare both `upstreamPackage` and `upstreamPackages`. Use the singular form for exactly one upstream package; use the plural form for two or more.

> **[R9]** When reporting divergence for multiple entries in `upstreamPackages`, implementations MUST report results in declaration order (the order the entries appear in the `upstreamPackages` array).

### Change E — Update the `ext:import-tracking` extension record to cover repository-level provenance

The extension record for `ext:import-tracking` (instanceId `279877f5-dd9d-569c-94d6-358ad177a6fb`) already defines `ImportMode`, `ImportRecord` (with `conflictState`), and `ImportSummary` for per-definition tracking. This RFC adds a repository-level section to that record's `content` field covering:

- `upstreamPackage` / `upstreamPackages` as the repository-level provenance shape
- The repository-level divergence report (reusing the same `conflictState` vocabulary: `clean`, `local-ahead`, `diverged`)
- The `contentHash` field on `UpstreamPackage`

The `meta.upstreamPackage` subkey in `manifest.json` is deprecated: its `description` will carry `"deprecated": true` in JSON Schema and a note directing consumers to the top-level field.

---

## Migration

### From `meta.upstreamPackage` to top-level `upstreamPackage`

**Existing repositories** that wrote `meta.upstreamPackage` before this RFC was accepted are conforming during a transition window if they move the value to the top-level `upstreamPackage` field on next write and add the `contentHash` field (which may be computed retroactively if the original package files are still available, or set to a sentinel indicating "hash unavailable at migration time").

Implementations MUST:
- Write only the top-level `upstreamPackage` field going forward
- Accept `meta.upstreamPackage` as a read fallback during the transition window (to be closed in a follow-on RFC; see Open Questions)

Repositories with neither field are conforming without any migration; they simply do not declare an upstream package.

### From `upstreamPackage` (singular) to `upstreamPackages` (plural)

When a second upstream is added to a repository that currently declares `upstreamPackage`:

1. Preserve the existing entry (including `installedAt` and `contentHash`)
2. Add the new entry with its own `installedAt` and `contentHash`
3. Remove `upstreamPackage` and write `upstreamPackages` containing both entries

---

## Conformance Rules

> **[R1]** When a repository upgrades its upstream package, implementations MUST NOT modify the `typeVersion` value of any existing Record.

> **[R2]** New records created after an upgrade MUST default to the highest `typeVersion` value declared for the specific Type being instantiated in the installed package.

> **[R3]** A repository MUST remain fully round-trippable across a package upgrade. A breaking upgrade MUST be rejected unless an explicit named migration operation is invoked; it MUST NOT occur implicitly.

> **[R4]** Intentional record migration (typeVersion N → N+1) MUST use a `supersedes` relation from the new record to the old. The old record MUST remain with a non-terminal lifecycle state until explicitly removed. `refines` MUST NOT be used for typeVersion migration.

> **[R5]** When `upstreamPackage` or a matching entry (matched by `packageId`) in `upstreamPackages` is present and locally resolvable, a conforming `ext:import-tracking` implementation MUST report `clean`, `local-ahead`, or `diverged` for the repository's local package content.

> **[R6]** A `diverged` report MUST identify each differing definition by `id` + `version` + `name`. It MUST NOT silently resolve divergence without user action.

> **[R7]** A repository where `upstreamPackage` and `upstreamPackages` are both absent, or where the package is not locally resolvable, is exempt from R5 and R6.

> **[R8]** A repository MUST NOT declare both `upstreamPackage` and `upstreamPackages`.

> **[R9]** When reporting divergence for multiple `upstreamPackages` entries, results MUST be in declaration order.

> **[R10]** `contentHash` MUST be recorded at install time using the SHA-256 algorithm over the canonical byte sequence defined in Change B.

> **[R11]** `contentHash` MUST be updated whenever `upstreamPackage.version` (or the matching `upstreamPackages` entry's `version`) is updated.

---

## Schema changes

| Schema file | Change |
|---|---|
| `manifest.json` | Add `upstreamPackage?: UpstreamPackage` as a top-level optional property. Add `upstreamPackages?: UpstreamPackage[]` as a top-level optional array. Add `"not": {"required": ["upstreamPackage", "upstreamPackages"]}` at root level to machine-enforce R8. In `UpstreamPackage` `$def`, add `contentHash: string` as a required field with SHA-256 format note. In `meta.properties.upstreamPackage`, add `"deprecated": true` and a description note directing consumers to the top-level field. |

No changes to `record.json`, `typed-record.json`, `field.json`, `package-manifest.json`, or `package-bundle.json`.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**Why top-level rather than staying in `meta`?**  
`meta` is described as "implementation-local key-value pairs" — it is intentionally unspecified. A field that tooling and the spec reference normatively must not live in an unspecified bag. Promotion to top-level makes the field as discoverable and contract-bound as `repositoryId` or `declaredExtensions`.

**Why `upstreamPackage` / `upstreamPackages` duality rather than always-array?**  
This RFC follows the `packageRef` / `packageRefs` convention already established in `manifest.json`. The singular form keeps the common case (one upstream package) compact and readable. The array is used only when needed. An always-array alternative would require every single-package repository to wrap its provenance in a one-element array with no benefit.

**Why `packageId` (UUID) as the identity anchor for upgrade detection rather than `namespace+name`?**  
UUID stability is the SRS identity principle: stable UUIDs are the primary identity for all entities. Using `packageId` means the identity survives package renames without breaking upgrade detection. The risk — if an upstream publisher accidentally reissues a package under a new UUID — is mitigated by the `contentHash` field, which would show a mismatch even if `packageId` is not found locally. The `namespace+name` pair is a fallback label for human display, not the identity anchor.

**Why `contentHash` rather than relying on version string equality?**  
Version strings are under publisher control. A publisher can re-publish the same version number with different content (a common mistake). `contentHash` provides a tamper-evident, version-independent record of exactly what was installed, making "did anything change?" an O(1) byte comparison rather than requiring a recursive diff of all definition files.

**Why per-record `typeVersion` pinning rather than a manifest-level locked flag?**  
Per-record pinning is the most granular and resilient approach: each record is independently valid under the contract it was created with, regardless of what other records in the same repository do. A manifest-level lock would prevent upgrading the default for new records without first migrating all existing ones — forcing a big-bang migration that the "non-destructive upgrades" goal explicitly rejects.

**Why mandate `supersedes` only (not `refines`) for typeVersion migration?**  
`refines` semantics state it "does not replace or invalidate" the target. A typeVersion N→N+1 upgrade is a retirement of the old record's schema contract; `refines` would be semantically incorrect. `supersedes` accurately conveys that the new record takes the place of the old one.

---

## Alternatives Considered

### Alt A — Keep `meta.upstreamPackage` and add a conformance rule pointing at it

This avoids a schema property addition but leaves normative data in an unspecified bag. Any future implementation can legally ignore `meta` entirely. Rejected because machine-readable provenance must be first-class.

### Alt B — Use `packageRefs` for version provenance instead of a separate `upstreamPackage` field

`packageRefs` records which package *supplies definitions to this repository*. It does not record which package *the repository was initialised from*. A repository could pull in definitions from many packages while being "branded" as a derivative of exactly one upstream template. The distinction matters for upgrade detection. Rejected because conflating the two concepts creates ambiguity.

### Alt C — Always-array `upstreamPackages` for single and multiple packages

Rejected in favour of following the `packageRef` / `packageRefs` convention. See Rationale.

### Alt D — Include the full `ConflictRecord` and `ext:binding` model from RFC-003

Rejected per scope constraints in the issue: this RFC must remain small enough to ship without blocking `srs-rust#234` (Gate 0). The per-definition conflict surface belongs in a successor acceptance of RFC-003.

---

## Deferred Follow-Ons

1. **Per-definition import tracking** — tracking which upstream definition each local definition was derived from; `ConflictRecord`; `ConflictType` semantics. RFC-003 (Draft) already proposes this in its `ext:import-tracking` section. RFC-014 does not conflict with RFC-003's per-definition model; it adds the repository-level layer that RFC-003 doesn't yet cover. The full per-definition model becomes available when RFC-003 is accepted.
2. **`ext:binding`** — declared binding modes (`authoritative-upstream`, `tracked-upstream`, `explicit-import`), `BindingSource` on `RepositoryManifest`. Defined in RFC-003 (Draft); deferred to that RFC's acceptance.
3. **`upstream-ahead` divergence state** — detecting that a newer package version exists upstream requires `ext:registry` (network access). Deferred.
4. **Transition window close** — the transition period during which `meta.upstreamPackage` is accepted as a read fallback needs a defined endpoint. To be closed by the follow-on RFC that hard-removes the deprecated subkey.

---

## Open Questions

None. (OQ-1 about `upstreamPackages` ordering is resolved in R9: declaration order. OQ-2 about the transition window endpoint is tracked in Deferred Follow-Ons item 4.)
