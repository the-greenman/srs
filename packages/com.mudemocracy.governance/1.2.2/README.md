# com.mudemocracy.governance @1.2.2

**v1.2.2** (srs#947): republish of 1.2.1's `package/` (byte-for-byte identical) whose **seed**
(`seed/empty-governance-document.srsj`) shipped with the wrong root container id.
`scripts/build-governance-seed.mjs`'s `SEED_REPOSITORY_ID` constant — which becomes both
`manifest.repositoryId` and `manifest.container.containerId` — carried
`e2e8489a-5ada-4309-9b26-90ccc263146d`, but RFC-025 [R1] (Accepted) rules the seed MUST ship
`54432eb2-7961-4538-ac16-9e25dcfa2f42`. No check enforced [R1], so all four prior published
seeds (1.0.0/1.1.0/1.2.0/1.2.1) shipped non-conformant and went unnoticed until RFC-052's review
(#941) caught it. The generator is fixed and this version's seed carries the ruled id. 1.0.0/
1.1.0/1.2.0/1.2.1 stay published as-is — the published versions are immutable, so the fix ships
only as this next seed version; they are exempt from the new
`scripts/check-governance-seed-root-container.mjs` gate, which guards only the CURRENT version
going forward, same discipline as the existing `governance-seed-drift` gate's historical-version
exemption. No field/type/protocol/lifecycle/view semantic content changed.

**v1.2.1** (srs#548): republish of 1.2.0's `package/` (byte-for-byte identical — it was already
current: protocol unprefixed per srs#379/rfc-decision-a270e98a, `compositions/`
exportConfig/discovery-query per srs#540/srs#525, lifecycle list-form per srs#537, no
Term/RelationTypeDefinition/LifecycleState `properties` key per srs#433) whose **seed**
(`seed/empty-governance-document.srsj`) had never been regenerated after those PRs and still
shipped a pre-#379 prefixed Protocol definition plus the retired `type-query`/top-level-`format`
Composition shape. This version exists solely to ship a seed whose inlined package content
matches the package/ tree it's built from. No field/type/protocol/lifecycle/view semantic
content changed. 1.0.0/1.1.0/1.2.0 stay published as-is (additive-only discipline — no ruling
requires touching them).

`scripts/build-governance-seed.mjs` now takes the version as an argument (`node
scripts/build-governance-seed.mjs 1.2.1`) instead of hardcoding `1.1.0`. At the time this version
was published, the script fell back to a plain filesystem flatten of `package/` whenever `srs
repo copy` couldn't load the package (true for every version 1.0.0+ at the time: the pinned
CLI's `Protocol` deserializer still expected the retired prefixed shape, srs-rust#930). That
fallback has since been retired (srs#553, srs-rust build.331 — PR #948 fixed the two further
gaps the fallback was extended to cover, srs-rust#941 and #947/#946): the script now goes
exclusively through the sanctioned `srs repo copy` path, and this seed was rebuilt through it.


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
(`governance_lifecycle`), 1 blueprint, 4 compositions, 1 view, 1 protocol, 5 relation types.

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
node scripts/build-governance-seed.mjs 1.2.2
# Verify the committed seed matches a fresh build
node scripts/build-governance-seed.mjs 1.2.2 --check
# Acceptance (Node/AJV — see the engine-gap note above for why not `srs repo validate`)
node scripts/validate-all.mjs
```

### Provenance stamp — `upstreamPackage` (RFC-014)

The seed manifest records which upstream Package it was initialised from. As of RFC-014,
`upstreamPackage` is a normative top-level field on `manifest.json` (the `meta.upstreamPackage`
subkey is deprecated):

```json
"upstreamPackage": {
  "packageId": "1cd9622e-3d05-4214-a683-4cb81d0c44d9",
  "namespace": "com.mudemocracy.governance",
  "name": "governance",
  "version": "1.2.2",
  "installedAt": "2026-01-01T00:00:00Z"
}
```

This contract is defined in the repository-manifest schema
(`docs/schema/2.0/manifest.json` → `$defs/UpstreamPackage`). It is a normative
repository-level complement to the full per-definition `ext:import-tracking` model
(RFC-003): it records provenance and enables divergence detection via reference-copy
comparison, supporting non-destructive package upgrades (the hook for #37).

> **Known limitation.** `srs repo copy` does not yet preserve the `upstreamPackage` stamp
> across export/import — the engine has no import-tracking wiring (RFC-003 / #37). The build
> script therefore stamps `upstreamPackage` into the bundle after export. Round-trip
> preservation of the stamp through the engine is part of the #37 upgrade story, not this task.
