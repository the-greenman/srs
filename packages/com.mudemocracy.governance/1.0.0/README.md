# com.mudemocracy.governance @1.0.0

The canonical **MuDemocracy governance package** and a pre-built empty governance-document
seed. Promoted from `com.limoma/governance-core @1.0.0`
(`docs/spec/examples/gallery-project-v2/package/`).

A **governance document** is the artifact a group maintains over time. At v1 the package
captures *decisions* — the seed is an empty decision log — but it is framed as the initial
governance document that the upgrade story
([muDemocracy.org#37](https://github.com/the-greenman/muDemocracy.org/issues/37)) later grows
in place. See [muDemocracy.org#35](https://github.com/the-greenman/muDemocracy.org/issues/35)
for the user story and [#38](https://github.com/the-greenman/muDemocracy.org/issues/38) for
this promotion task.

## What's in the package

`package/` — 19 fields, 4 types (`decision`, `article`, `role`, `decision_log`), 1 lifecycle
(`governance_lifecycle`), 1 blueprint, 3 document views, 1 view, 1 protocol, 4 relation types.

### Namespace & identity

Only the **package envelope** was re-namespaced during promotion:

| | `com.limoma/governance-core` | `com.mudemocracy.governance` |
|---|---|---|
| package `id` | `90677fae-…` (UUID4) | `1cd9622e-3d05-4214-a683-4cb81d0c44d9` (new UUID4) |
| `namespace` | `com.limoma` | `com.mudemocracy.governance` |
| `name` | `governance-core` | `governance` |
| `version` | `1.0.0` | `1.0.0` |

**Every field/type/lifecycle/blueprint/view/protocol/relation-type UUID is preserved**, and
their `namespace` stays `governance`. This is deliberate: the definition UUIDs are UUID5 values
derived from `governance/<name>`, and the spec rule is *"changing namespace or name requires a
new UUID."* Keeping the content namespace stable keeps those UUID5 identities self-consistent
and lets existing `com.limoma/governance-core` records resolve against this package by UUID.
Only the distributable envelope carries the new `com.mudemocracy.governance` identity.

## Seed: `seed/empty-governance-document.srsj`

A self-contained `.srsj` bundle: the governance package installed with **zero records**. This
is the asset srs-web bundles so a clerk can create a brand-new governance document
([#40](https://github.com/the-greenman/muDemocracy.org/issues/40)) without hand-authoring JSON.

```bash
# Rebuild (byte-for-byte reproducible)
node scripts/build-governance-seed.mjs
# Verify the committed seed matches a fresh build
node scripts/build-governance-seed.mjs --check
# Acceptance
srs repo validate --repo packages/com.mudemocracy.governance/1.0.0/seed/empty-governance-document.srsj
#   → 0 errors, 0 instances, package resolves (4 types / 19 fields)
```

### Provenance stamp — `meta.upstreamPackage`

The seed manifest records which upstream Package it was initialised from:

```json
"meta": {
  "upstreamPackage": {
    "packageId": "1cd9622e-3d05-4214-a683-4cb81d0c44d9",
    "namespace": "com.mudemocracy.governance",
    "name": "governance",
    "version": "1.0.0",
    "installedAt": "2026-01-01T00:00:00Z"
  }
}
```

This contract is defined in the repository-manifest schema
(`docs/schema/2.0/manifest.json` → `$defs/UpstreamPackage`). It is a lightweight,
repository-level **precursor** to the full per-definition `ext:import-tracking` model
(RFC-003): it lets a consumer detect when a newer governance version is published so the
document can be upgraded in place (the hook for #37).

> **Known limitation.** `srs repo copy` does not yet preserve `manifest.meta` across
> export/import — the engine has no import-tracking wiring (RFC-003 / #37). The build script
> therefore stamps `meta.upstreamPackage` into the bundle after export. Round-trip
> preservation of the stamp through the engine is part of the #37 upgrade story, not this task.
