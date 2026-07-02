# RFC-014: Import Tracking & Package Binding — Repository Provenance and Non-Destructive Package Upgrades

**Status**: Draft (Revision 1)
**Affects**: `manifest.json` (`upstreamPackage` / `upstreamPackages` promoted to top-level normative fields), `ext:import-tracking` (formal spec entry), version-pinning semantics, divergence-detection contract
**Author**: Peter Brownell (from issue the-greenman/srs#107)
**Date**: 2026-07-02
**Builds on**: RFC-003 (Definition Distribution — extracts only the import-tracking/package-binding sub-scope)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-02 | Initial draft |

---

## Abstract

A repository built from a published SRS Package must record which package and version it was initialised from, machine-readably, so tooling can detect when a newer version exists and offer a non-destructive upgrade path. This RFC formalises that provenance record as a normative top-level field on the repository manifest, defines the version-pinning rule that keeps existing records valid across upgrades, and specifies the divergence-detection contract a conforming implementation must honour. Registry distribution, federation, and package-authoring workflows are explicitly out of scope.

---

## Motivation

### Problem 1 — Upstream provenance is an implementation hint, not a normative contract

`manifest.json` already carries a `meta.upstreamPackage` subkey described in the schema as a "common key" / "hook for the package-upgrade / drift story". Because `meta` is an implementation-local bag with no specified semantics, tooling cannot rely on it for machine-readable provenance or upgrade detection — two systems may write completely different shapes there. The Decision Log public release ("yours for keeps") requires that provenance be in the file in a standardised, parseable location.

### Problem 2 — The upgrade model is unspecified

There is no normative statement covering what happens when a repository upgrades its upstream package from version 1.0.0 to 1.1.0:

- Do existing records require migration?
- Can new records use 1.1.0 types while old records keep their 1.0.0 types?
- What if a field or type was renamed?

Without a written rule, implementations diverge. The correct model — non-destructive, per-record pinning, intentional migration only — must be stated explicitly.

### Problem 3 — Divergence detection has no contract

"Has my local package definition drifted from what the upstream version declares?" is a question consumers need to answer, but there is no specified shape for reporting the answer. Implementations invent ad hoc checks.

---

## Proposed Changes

### Change A — Promote `upstreamPackage` to a top-level normative manifest field

Remove the `meta.upstreamPackage` hint and replace it with a top-level optional field `upstreamPackage` on `manifest.json`. For repositories initialised from more than one package, add the parallel `upstreamPackages` array.

**`upstreamPackage` (single-package shorthand):**

```json
"upstreamPackage": {
  "packageId": "uuid-of-the-upstream-package",
  "namespace": "com.mudemocracy.governance",
  "name": "governance",
  "version": "1.0.0",
  "installedAt": "2026-03-01T00:00:00Z"
}
```

**`upstreamPackages` (multi-package):**

```json
"upstreamPackages": [
  {
    "packageId": "uuid-of-package-A",
    "namespace": "com.mudemocracy.governance",
    "name": "governance",
    "version": "1.0.0",
    "installedAt": "2026-03-01T00:00:00Z"
  },
  {
    "packageId": "uuid-of-package-B",
    "namespace": "com.example.shared",
    "name": "shared-fields",
    "version": "2.1.0",
    "installedAt": "2026-04-15T00:00:00Z"
  }
]
```

A repository MUST NOT declare both `upstreamPackage` and `upstreamPackages`. Use `upstreamPackage` for exactly one upstream package; use `upstreamPackages` for two or more.

The `UpstreamPackage` shape is unchanged from the existing `$defs` definition in `manifest.json`; only its placement changes (from `meta.upstreamPackage` to a first-class property).

**Migration from `meta.upstreamPackage`:** existing repositories that wrote `meta.upstreamPackage` before this RFC was accepted are conforming if they move the value to the top-level `upstreamPackage` field on next write. Implementations SHOULD accept both locations during a transition window but MUST write only the top-level field.

### Change B — Define version-pinning semantics

Each Tier 2 Record carries a `typeVersion` integer in its stored JSON. `typeVersion` is the **pinning anchor**: it records the type schema contract in force when the record was created.

Normative rule:

> **[R1]** When a repository upgrades its upstream package (i.e. `upstreamPackage.version` or an entry in `upstreamPackages[].version` increases), implementations MUST NOT modify the `typeVersion` value of any existing Record. Existing records remain valid under the type contract declared by their stored `typeVersion`.

> **[R2]** New records created after an upgrade MAY reference any type version present in the installed package, including newly introduced versions. An implementation MUST make the latest installed type version the default for new record creation after an upgrade.

> **[R3]** A repository MUST remain fully round-trippable (write then re-read, no data loss) across a package upgrade. An upgrade that causes any existing record to fail validation under its stored `typeVersion` is a **breaking upgrade** and MUST be rejected by a conforming implementation unless the user explicitly opts into a migration.

> **[R4]** Intentional record migration (upgrading a record from `typeVersion` N to N+1) MUST use an explicit `supersedes` or `refines` relation from the new record to the old one. In-place silent rewriting of `typeVersion` is not permitted.

### Change C — Define the divergence-detection contract

A conforming implementation that declares `ext:import-tracking` MUST be able to report whether the local package definition (as stored in the repository's `package/` directory) matches the canonical definition at `upstreamPackage.version`.

The contract covers three cases:

| Case | Description | Report |
|---|---|---|
| `in-sync` | Every field and type in the local package matches the upstream version byte-for-byte (or semantically equivalent per the package's own checksum/fingerprint). | No drift. |
| `local-ahead` | The local package contains definitions that do not yet exist in the declared upstream version — the local copy is intentionally extended. | List of locally-added definitions. |
| `diverged` | One or more local field or type definitions differ from what the upstream version declares under the same `id`+`version` key. | List of diverging definitions with local vs. upstream fingerprints. |

> **[R5]** When `upstreamPackage` (or a matching entry in `upstreamPackages`) is present and the upstream package is locally resolvable, a conforming implementation MUST be able to report one of `in-sync`, `local-ahead`, or `diverged` for the repository's local package content.

> **[R6]** A `diverged` report MUST identify each differing definition by `id` + `version` + `name`. It MUST NOT silently resolve divergence without user action.

> **[R7]** A repository where `upstreamPackage` is absent is exempt from this requirement; divergence detection is opt-in via the field's presence.

### Change D — Add `ext:import-tracking` as a formal extension entry in the spec

The `ext:import-tracking` extension has been referenced in RFC-003 and in schema descriptions but has never been assigned a spec extension record. This RFC formally registers it:

| Extension | Identifier | Depends on | Scope |
|---|---|---|---|
| Import Tracking | `ext:import-tracking` | — | Repository-level provenance (`upstreamPackage`/`upstreamPackages`), version-pinning contract, divergence detection |

Implementations declare this extension by adding `"ext:import-tracking"` to `manifest.json → declaredExtensions`.

The per-definition import tracking model (tracking which upstream definition each local definition was derived from, `ConflictRecord`, binding modes) is deferred to a follow-on RFC (see Deferred Follow-Ons).

---

## Conformance Rules

> **[R1]** When a repository upgrades its upstream package, implementations MUST NOT modify the `typeVersion` value of any existing Record. Existing records remain valid under the type contract declared by their stored `typeVersion`.

> **[R2]** New records created after an upgrade MAY reference any type version present in the installed package. An implementation MUST default new record creation to the latest installed type version after an upgrade.

> **[R3]** A repository MUST remain fully round-trippable across a package upgrade. An upgrade that causes any existing record to fail validation under its stored `typeVersion` is a breaking upgrade and MUST be rejected unless the user explicitly opts into a migration.

> **[R4]** Intentional record migration (upgrading a record from `typeVersion` N to N+1) MUST use an explicit `supersedes` or `refines` relation. In-place silent rewriting of `typeVersion` is not permitted.

> **[R5]** When `upstreamPackage` or a matching `upstreamPackages` entry is present and the upstream package is locally resolvable, a conforming `ext:import-tracking` implementation MUST be able to report `in-sync`, `local-ahead`, or `diverged` for the repository's local package content.

> **[R6]** A `diverged` report MUST identify each differing definition by `id` + `version` + `name`. It MUST NOT silently resolve divergence without user action.

> **[R7]** A repository where `upstreamPackage` and `upstreamPackages` are both absent is exempt from divergence-detection requirements; the feature is opt-in via field presence.

> **[R8]** A repository MUST NOT declare both `upstreamPackage` and `upstreamPackages`. Use the singular form for exactly one upstream package; use the plural form for two or more.

---

## Schema changes

| Schema file | Change |
|---|---|
| `manifest.json` | Add `upstreamPackage?: UpstreamPackage` as a top-level optional property (already exists in `$defs`). Add `upstreamPackages?: UpstreamPackage[]` as a top-level optional array. Remove `meta.upstreamPackage` subkey (or mark deprecated). Add mutual-exclusion note to both new properties. |

The `UpstreamPackage` shape in `$defs` is not changed; only its placement in the schema becomes normative.

No changes to `record.json`, `typed-record.json`, `field.json`, or `package-manifest.json`.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**Why top-level rather than staying in `meta`?**  
`meta` is described as "implementation-local key-value pairs" — it is intentionally unspecified. A field that tooling and the spec reference normatively must not live in an unspecified bag. Promotion to top-level makes the field as discoverable and contract-bound as `repositoryId` or `declaredExtensions`.

**Why per-record `typeVersion` pinning rather than a manifest-level "locked" flag?**  
Per-record pinning is the most granular and resilient approach: each record is independently valid under the contract it was created with, regardless of what other records in the same repository do. A manifest-level lock would prevent upgrading the default for new records without first migrating all existing ones — forcing a big-bang migration that the "non-destructive upgrades" goal explicitly rejects.

**Why defer per-definition import tracking (`ConflictRecord`, binding modes)?**  
RFC-003 covers the full per-definition model across federation and hierarchical governance. That scope is large. This RFC delivers the minimum required to unblock the Decision Log public release: a machine-readable provenance stamp + the rules governing what happens during an upgrade. The more complex model follows once the simpler one is in production.

---

## Alternatives Considered

### Alt A — Keep `meta.upstreamPackage` and add a conformance rule pointing at it

This avoids a schema property addition but leaves normative data in an unspecified bag. Any future implementation can legally ignore `meta` entirely. Rejected because machine-readable provenance must be first-class.

### Alt B — Use `packageRefs` for version provenance instead of a separate `upstreamPackage` field

`packageRefs` (and `packageRef`) records which package *supplies definitions to this repository*. It does not record which package *the repository was initialised from*. A repository could pull in definitions from many packages while being "branded" as a derivative of exactly one upstream template. The distinction matters for upgrade detection. Rejected because conflating the two concepts creates ambiguity.

### Alt C — Include the full `ConflictRecord` and `ext:binding` model from RFC-003

Rejected per scope constraints in the issue: this RFC must remain small enough to ship without blocking `srs-rust#234` (Gate 0). The per-definition conflict surface is RFC-003 work; this RFC carves out only the provenance + upgrade semantics that are gate-blocking now.

---

## Deferred Follow-Ons

1. **Per-definition import tracking** — tracking which upstream definition each local definition was derived from; `ConflictRecord`; `ConflictType` semantics. These belong in a successor RFC that graduates the rest of RFC-003's `ext:import-tracking` scope.
2. **`ext:binding`** — declared binding modes (`authoritative-upstream`, `tracked-upstream`, `explicit-import`), `BindingSource` on `RepositoryManifest`. Deferred to RFC-003 follow-up.
3. **Registry integration** — how upgrade detection queries a remote registry for newer package versions. Deferred to `ext:registry` RFC.

---

## Open Questions

1. **Should `upstreamPackages` entries be ordered?** The current shape is an unordered array. If a repository pins two packages and both need divergence reports, do results need to be reported in declaration order or can tooling choose?
2. **Transition period length** — how many srs-rust build cycles should implementations accept `meta.upstreamPackage` as a read fallback before the compat shim can be removed?
