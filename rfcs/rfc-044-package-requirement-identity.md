> **GitHub issue**: [the-greenman/srs#855](https://github.com/the-greenman/srs/issues/855)

# RFC-044: Package requirement identity — `packageDependencies.packageId` and package-bundle alignment

**Status**: Accepted (Revision 4)
**Affects**: `docs/schema/2.0/package-manifest.json` (`DependencyRef`), `docs/schema/2.0/package-bundle.json` (new package-level properties and the three missing definition kinds), `docs/schema/2.0/generation-ledger.md` (two rows), the abstract `Package` model and its prose in the spec (records `example-745529e6`, `mechanism-bc156a49`, `table-e6e67001`; Invariants 7, 8, 15, 35, 36, 37 and 43), the `ext:repository` extension (one conformance rule), `scripts/checks.json` (one new check). Builds on RFC-003 (Draft, Revision 5: `.srspkg` and the Package Bundle; its whole-package export subset is put up for acceptance separately in srs#857, see Change C), RFC-014 (Accepted: `packageRefs`, the R6 multi-version union), RFC-029 (Accepted: the implicitly merged core base package, Change A), RFC-033 (Accepted: `dataModelRevision`), RFC-040 (Accepted: the `dependencyRefs` to `packageDependencies` fold), RFC-043 (Accepted: revision 8). Serves the-greenman/muDemocracy.org#242 (epic #224); closes the schema half of srs#390.
**Author**: design dialogue draft; owner rulings of 2026-10-02 folded in (see Owner rulings)
**Date**: 2026-10-02
**Door**: Door 2 (new normative meaning, with Charter Check). One ruling is refined, by owner decision: `rfc-decision-c8704763`'s package-dependency sentence (Charter alignment, contradiction 1). A successor decision record is created at acceptance.

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-02 | Initial draft. |
| 2 | 2026-10-02 | Owner rulings of 2026-10-02 folded in and all nine open questions closed: key by `packageId` with a successor decision record; `package-dependency-unsatisfied` defined at default severity warning, client blocking behaviour removed as application-private, ratchet trigger named; 0.x compatibility band (MINOR acts as the major below 1.0, exact PATCH for 0.0.z); stale `spec-rfc-process` requirement fixed to 3.0.0; no revision bump with an every-corpus count and a fail-loudly repair; RFC-003 whole-package export acceptance sequenced before `.srspkg` implementation (srs#857); the check is an `ext:repository` conformance rule, not an invariant; `dependencyRefs` keeps its name; bundles carry themes. Rev 1 review findings addressed (Completeness: 8 blocking, 8 should-fix; Spec Integrity: 3 blocking, 4 should-fix): the installed set gets a numbered definition and a two-version worked example; the core package is cited to RFC-029 Change A and RFC-014 R6 (not RFC-018); the bundle check names its package and its self-requirement rule; MAY-omit used consistently and "inlined in full" defined; the SemVer pattern quoted with fixtures and corpus counts; resulting `required` arrays stated; bundle consumers counted per consumer; reasons given a total evaluation order; legacy entries reconciled between schema validation and load tolerance; invariant titles added to the change list; the false `ExactTypeRef` precedent corrected; [R7]/[R8] made checkable; "cannot be spoofed" dropped. |
| 3 | 2026-10-02 | Round 2 reviews (both 0 blocking) should-fixes addressed: <br>- installed set: `packageRefs` wins over `packageRef`; one fallback for any unresolvable `PackageRef`; the core member is the consumer's own core package, by design; <br>- reason choice prefers candidates inside the compatibility band, with a worked case; ties and unknown versions stated; <br>- legacy entries: manifest schema validation is separate from load and reports an error there; a consumer running both reports both; an exporter never copies a legacy entry into a bundle; <br>- [R5] states absent ⇒ `[]`, that an omitted entry is not verified, and that its producer clause takes effect with RFC-003 [C3] (srs#857); <br>- spec-authoring lints ([R7] second sentence, [R8]) moved out of Conformance Rules into the new check; [R6] cites its kind-list source; <br>- counts corrected (35 manifest instances; records list includes the extension, decision and editorial changes). |
| 4 | 2026-10-02 | Accepted by the owner 2026-10-02. Folded into the canonical spec on branch `rfc/044-package-requirement-identity`: schema edits to `package-manifest.json` and `package-bundle.json`, generation-ledger rows, `scripts/check-package-bundle-alignment.mjs` with negative guard cases; the 10 prose records corrected to `dependencyRefs`; the conformance rules folded as three new mechanism records (RFC 2119 keywords live in mechanism or invariant records, and a live extension record carries no `content`): `Package requirement` ([R1] to [R3], [R5] to [R8], [R12]) under the Distribution group, and `Installed package set` ([R4]) and `Package requirement check` ([R9] to [R11]) contained by the `ext:repository` extension record, no invariant created (owner ruling 7); RFC stub record with integration manifest; successor decision record superseding `rfc-decision-c8704763`'s package-dependency sentence. The `spec-rfc-process` editorial repair (owner ruling 4) is not yet applied: no srs CLI command or MCP tool writes a package manifest's `packageDependencies` (tool gap srs-rust#1168), so until it is repaired that manifest fails `validate-package`. Measured at acceptance, correcting What breaks: the pinned srs-rust build.417 does validate package manifests against its embedded `package-manifest.json` and treats a failure as fatal (`SRS038-R4-PACKAGE-MANIFEST-INVALID`), so a repaired entry (with `packageId`) makes `srs repo validate` refuse the repository until srs-rust ships the synced schema, and a binary with the synced schema would refuse an unrepaired entry unless it implements [R9]'s load tolerance first. The repairs therefore land with the srs-rust release that carries [R9] and the mirror sync, in the pin-advance PR of each corpus. Follow-ups: muDemocracy.org#249 (muSrs repair), srs-rust#1087 (implementation), srs-vscode#124 (mirror). |

---

## Charter alignment

**Cell(s):** cell:identity, cell:reference, cell:description, cell:conformance, cell:portability
**Decision mode:** complicated

**Governing cell preference:**
- Identity: *identifier over label* (`rfc-decision-cce3c00e`, `rfc-decision-53635966`). Aligned: a package requirement is keyed by the package's UUID; `namespace` and `name` are demoted to display labels.
- Reference: *declared strength over convenient reach* (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`). The requirement keeps its declared strength (a version constraint, the one sanctioned constraint form, package layer only) and changes only its key (see contradiction 1).
- Description: *one name over many* (`rfc-decision-628cf6c4`). Aligned: today `packageDependencies` names two different things (a list of packages in the manifest, a list of definition References in the abstract `Package` model and seven invariants). After this RFC each name means exactly one thing.
- Conformance: *one way over many*. A consumer check is defined once, with one diagnostic code and a closed set of reasons, not left to each client.
- Portability: *preserve over recognize* (`rfc-decision-8948e43f`). Aligned: the bundle grows to carry every definition kind the manifest declares, and the package-level requirement the manifest declares.

**Axis preference:**
- 2-8 Identity/Assertion: default pole (Evolution over Continuity, repository in formation) taken. The 4 existing entries in tracked corpora (plus 2 in srs-rust test data) are repaired in the same change that makes `packageId` required; no dual form, no alias for the old shape.
- 5-11 Succession/Conformance: default pole (Reliability over Renewal). Boundary clause: *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* The standing contract is `rfc-decision-c8704763`'s package-dependency sentence; the owner ruled (2026-10-02) to renew it by explicit supersession, so a successor decision record is created at acceptance rather than the earlier record being edited.
- 6-12 Containment/Portability: default pole (Portability over Possession) taken. A requirement that exists only in a manifest and cannot travel in the bundle is captivity.
- 1-7 Versioning/Reference: default pole (Semantic Integrity over Practical Expression) taken: identity is the UUID; the label is expression.
- 3-9 Description/Governance: default pole (Shared Coherence over Local Autonomy) for the diagnostic code and its reasons; the boundary of compass layer rule 6 (*"an affordance enters the standard only with enforcement semantics; until then it is application-private behind axis 3–9's explicit-local boundary"*) keeps what a client does on the diagnostic (refuse an install, refuse to open an editor) application-private.

**Decisions consulted:** `rfc-decision-cce3c00e` (grid), `rfc-decision-c8704763` (reference taxonomy; package dependencies are the one KEYED-plus-range form), `rfc-decision-8948e43f` (a bundle carries what a container can hold; the ten kinds), `rfc-decision-628cf6c4` (a rename is a migration), `rfc-decision-2e0cd70a` (schemas closed, engines tolerant; DETECT/LOAD/WRITE), `rfc-decision-c20fcff8` (the level test), `rfc-decision-9ee14517` and `rfc-decision-0118e938` (layer rules; one layer per construct), `rfc-decision-7caca3a1` (decision modes), `rfc-decision-e99a9437` (doors), `rfc-decision-4431046e` (a refinement is a successor record), `rfc-decision-53635966` (identifier over label, applied to tiers), `rfc-decision-2a1e1590` (state is mutable; dormancy rule). The decision log search for `package dependenc*`, `packageId`, `semver` and `bundle` finds only `c8704763` and `8948e43f` as adjacent rulings.

**Contradictions found:** One, ruled by the owner on 2026-10-02.
1. `rfc-decision-c8704763` says: *"Package dependencies are the one sanctioned constraint form: KEYED with a semver range, existing only at the package layer."* and, in the cross-rules, *"substrate entries are KEYED references and their UUIDs serve lineage and package management, not reference."* A `DependencyRef` keyed by `namespace/name` is that form. This RFC keys the requirement by `packageId` (LINEAGE: a bare identifier) and keeps the semver constraint. **Owner ruling (2026-10-02): accept.** Under `rfc-decision-4431046e` the position change is a refinement: at acceptance a successor `rfc-decision-*` record, linked to `c8704763` by `supersedes` and scoped to the package-dependency sentence only, is created; `c8704763` is not edited. Its other sentences (the constraint form lives only at the package layer; no fifth reference strength) are honoured: the constraint remains a version rule on a lineage key, which is no new strength.

**One-way-per-goal:** The goal is "declare that a package requires another package". One mechanism exists: `packageDependencies` on the package manifest. This RFC collapses onto it: the bundle receives the same property with the same shape (one definition of `DependencyRef`, one meaning), and the application-private `EditorDefinition` in srs-web consumes the spec shape rather than inventing a parallel one (compass layer rule 6). The definition-level `dependencyRefs` (a list of definition References) serves a different goal ("which definitions does this package's content point at, outside the package") and is kept under its name (owner ruling 8); the collision between the two names is resolved by giving each name one meaning (Change C). `PackageRef.packageId` (which package a repository has installed) is the other half of the same identity, not a second requirement mechanism.

**Layer test:**
- Which layer owns this? MEANING plane, definitions layer: a package requirement is part of the Package, the definitions grouping construct; the `DependencyRef` schema, the bundle properties and the version rule live there. The *check* is OPERATION plane, core service (a `srs-repository` capability exposed through CLI payload and WASM per `capability-layering.md`; clients add presentation only). What a client does when the check reports (refuse, warn, prompt) is application-private.
- Consume or clone downward? Consume. A requirement references a package by the package's own `id`, the same UUID `PackageRef.packageId` and the bundle's `packageId` already carry; nothing is restated or re-derived. The bundle consumes the manifest's ten definition kinds by name.
- Does the layer below stand alone without this? Yes. Delete `packageId` from every `DependencyRef` and the package and its definitions remain valid, resolvable and loadable; only the optional consumer check loses its input. Records, relations and containers are untouched.

**Level test (`rfc-decision-c20fcff8`):** passes. A repository can declare the requirement (`packageDependencies` with `packageId`) and an implementation can check it (Change D). The check is MAY by design; a held MAY rule needs no hold (nothing is claimed that is not defined and checkable).

---

## Abstract

A package can list the other packages it requires, but only by `namespace`, `name` and a version, which are labels, not identity; the abstract `Package` model and seven invariants use the same name `packageDependencies` for an unrelated list of definition references; and the exportable package bundle cannot carry the package-level requirement at all. This RFC makes the requirement identity-keyed (`packageId`, a required UUID), states the version rule precisely (same compatibility band, at least the stated version; below 1.0 the MINOR acts as the major), gives the bundle the same requirement property plus `packageNamespace` and the three definition kinds it cannot carry today (`themes`, `blueprints`, `protocols`), separates the two meanings of the name `packageDependencies`, and defines an optional consumer check with one diagnostic code, `package-dependency-unsatisfied`, at default severity warning. No `dataModelRevision` bump: the 4 entries in tracked corpora are repaired directly, and an entry that cannot be resolved to an installed package id fails loudly rather than being guessed.

---

## Motivation

### Problem 1 — A requirement names a label, not the package

`package-manifest.json` defines `DependencyRef` as `{namespace, name, version}`. Namespace and name are display labels: RFC-033 and `rfc-decision-cce3c00e` say the identifier outranks the label, and every other place that points at a package (`PackageRef.packageId`, `upstreamPackage.packageId`, the bundle's `packageId`) uses the package UUID. A requirement that reads "com.mudemocracy.argument" is satisfied by an unrelated package that happens to use that namespace, and unsatisfied by the same package after a rename, with no way to tell which. An editor that declares "I need the essay package" (muDemocracy.org#242) needs a key that survives a rename.

The key is lineage, not authenticity: `packageId` says "this is the package with this identity line", and a fork that keeps the original `id` satisfies a requirement on it exactly as the original does. Detecting a hostile fork is a provenance or signing question, out of scope here.

### Problem 2 — The version field has no stated meaning

`DependencyRef.version` says "Semver version of the depended-upon package." It does not say whether `1.0.0` means exactly 1.0.0, at least 1.0.0, or compatible with 1.0.0. One of the 4 existing entries already disagrees with what is installed: `spec-rfc-process` requires `spec-authoring-core` `1.0.0` and the installed package is `3.0.0`.

### Problem 3 — One name, two meanings

The manifest property `packageDependencies` is a list of packages this package requires (`DependencyRef`: namespace, name, version). The abstract `Package` model in the spec says `packageDependencies: Reference[]`, and Invariants 7, 8, 15, 35, 36, 37 and 43 say things like *"must appear as the `id` of an entry in `Package.packageDependencies`"*: a list of definition References (`{id, namespace, name, version: integer, definitionType}`) that a package's content points at outside itself. The serialised form of that second list in `package-bundle.json` is, and always was, `dependencyRefs`. The srs-rust#873 fold renamed the manifest-side property (the intent of `rfc-decision-c8704763` item 2: *"the manifest-side dependencyRefs"*) and the same rename was swept over the abstract model's prose, leaving the spec saying `packageDependencies` for the bundle's list while the bundle schema says `dependencyRefs`. A reader of the spec cannot tell which list is meant.

### Problem 4 — The bundle cannot carry what the manifest declares

`rfc-decision-8948e43f` ruled *"what a container can hold, a bundle can carry"* and promoted srs#390 to a mandate violation. `package-bundle.json` still declares seven definition arrays against the manifest's ten kinds (missing: `themes`, `blueprints`, `protocols`; it is closed with `additionalProperties: false`, so a bundle carrying them is invalid). It has no `packageNamespace` (only `packageName`), so a bundle cannot be labelled the way a dependency on it is labelled, and no package-level requirement list at all. `com.mudemocracy.governance@1.1.0` (and later, in `srs/packages/`) declares 1 blueprint and 1 protocol and cannot be exported as a conforming bundle.

### Problem 5 — Nothing checks a requirement

The requirement is declarable and unchecked: srs-rust#1087 records that a type referencing another package's field ids is accepted with no `packageDependencies` declared and validation stays green. Without a defined diagnostic every client invents its own message and its own comparison rule, which is the drift the conformance cell exists to prevent.

---

## Proposed Changes

### Change A — `DependencyRef` is identity-keyed

`DependencyRef` in `package-manifest.json` becomes `{packageId, namespace, name, version}`, all four required, no other property (the definition stays closed). Its `required` list changes from `["namespace", "name", "version"]` to `["packageId", "namespace", "name", "version"]`.

| Property | Meaning |
|---|---|
| `packageId` | NEW, required, UUID (`format: uuid`). The `id` of the required package: the same value that package's manifest carries as `id` and its bundle carries as `packageId`. **This is the key.** |
| `namespace`, `name` | Unchanged names and types, now declared display labels. They are required so a requirement is readable and a diagnostic can name the package without resolving it, but they never decide whether the requirement is satisfied. |
| `version` | Required. A SemVer 2.0.0 string with the meaning in Change B, enforced by a schema `pattern`. |

The `pattern` is the official SemVer 2.0.0 regular expression from semver.org, anchored:

`^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$`

It accepts `1.2.0`, `0.1.0`, `1.0.0-rc.1` and `1.0.0-rc.1+b5`; it rejects `1.0`, `01.0.0`, `v1.0.0` and `1.0.0-01`. The pattern applies to `DependencyRef.version` only; a package manifest's own `version` and the bundle's `packageVersion` keep their present unconstrained `string` type (the version rule in Change B compares against them, and a candidate whose version does not parse is treated as of unknown version, Change D). Measured: all 4 existing `DependencyRef.version` values match, and all 35 package-manifest instances found across the corpora listed in What breaks (exploded and embedded in `.srsj`, excluding srs-rust and srs-vscode) have a `version` that matches.

Consequence: a requirement is satisfied only by a package carrying that `packageId`. A package with the right namespace and name but a different `id` does not satisfy it; a package whose namespace or name was changed but whose `id` is the same still does. When the labels in an entry disagree with the resolved package's labels the id wins and the mismatch is reported visibly (Change D), which is the Air column rule (*the hint loses, visibly*) applied to a label. What this forecloses: matching a dependency by name. What it costs later: a package that is deliberately re-published under a new `id` (RFC-003's subset export mints a new `packageId`) is a different package for requirement purposes, and a requirement must be re-pointed at it by hand.

### Change B — The version rule

Versions are SemVer 2.0.0 strings. Let `R` be the entry's `version` and `I` an installed package's `version`, each split into MAJOR, MINOR, PATCH and an optional pre-release; build metadata is ignored throughout. `I` satisfies `R` if and only if all three clauses hold, evaluated in this order:

1. **Compatibility band.** The band of a version is the leftmost non-zero part of MAJOR.MINOR.PATCH, together with every part to its left:
   - if `R`'s MAJOR is at least 1: `I` has the same MAJOR;
   - if `R` is `0.y.z` with `y` at least 1: `I` is also `0.y.*` (same MAJOR 0 and same MINOR);
   - if `R` is `0.0.z`: `I` is also `0.0.z` (same MAJOR, MINOR and PATCH; an exact match on the release).
2. **Pre-release.** If `I` carries a pre-release tag, then `I` and `R` have identical MAJOR, MINOR and PATCH. A pre-release never satisfies a requirement for a different release.
3. **Precedence.** `I` has SemVer 2.0.0 precedence (section 11) greater than or equal to `R`.

This is the npm and Cargo caret convention: below 1.0, the MINOR acts as the major, because a 0.x package makes no compatibility promise across minors (owner ruling 3).

Worked cases. For `R = 1.2.0`: installed `1.2.0` satisfies; `1.3.5` satisfies; `1.2.0+b7` satisfies; `1.1.9` fails clause 3; `2.0.0` fails clause 1; `1.3.0-rc.1` fails clause 2; `1.2.0-rc.1` passes clauses 1 and 2 and fails clause 3. For `R = 1.2.0-rc.1`: `1.2.0-rc.1`, `1.2.0-rc.2` and `1.2.0` satisfy; `1.2.1-rc.1` fails clause 2. For `R = 0.1.0`: `0.1.0` and `0.1.7` satisfy; `0.2.0` fails clause 1; `1.0.0` fails clause 1. For `R = 0.0.3`: only the release `0.0.3` (with any build metadata) satisfies; `0.0.4` fails clause 1, `0.0.3-rc.1` fails clause 3. A pre-release requirement `R = 0.0.3-rc.1` is satisfied by `0.0.3-rc.1`, `0.0.3-rc.2` and `0.0.3`. `R = 0.0.0` is the `0.0.z` case with `z` = 0: only `0.0.0` satisfies.

Affected today: 0 of the 4 existing entries require a 0.x version, so the 0.x band changes no current outcome. Three installed packages are 0.x (muSrs `archetypes`, `stewardship`, `website`, all `0.1.0`), none of them the target of a requirement today.

### Change C — One meaning per name; the bundle aligned

**The names.** After this RFC:

- `packageDependencies` means **only** the list of packages this package requires (`DependencyRef[]`). It appears on the package manifest (already) and on the bundle (new).
- `dependencyRefs` means **only** the list of definition `Reference`s that a package's content points at (`Reference[]`: `{id, namespace, name, version: integer >= 1, definitionType?}`). It stays on the bundle under its present name (owner ruling 8). It is a different concept: a `Reference` pins one definition at one integer definition version (`rfc-decision-c8704763` PINNED strength); a `DependencyRef` constrains a whole package by the version rule. The two have different required properties and different `version` types (integer versus SemVer string), so a value of one never validates as the other; a package may use either, both or neither.
- The abstract `Package` model and the seven invariants that say `packageDependencies` while meaning the definition-reference list are corrected to say `dependencyRefs`. This corrects prose to the schema it describes (the bundle's serialised name never changed); no stored form changes and no migration is needed, so `rfc-decision-628cf6c4` (a rename is a migration) is honoured. The full change list, with prior text, is under Schema changes.

**The bundle gains**, in `package-bundle.json`:

| Property | Change |
|---|---|
| `packageNamespace` | NEW, required string. The package manifest's `namespace` (the label that pairs with `packageName`, which is the manifest's `name`). Identity remains `packageId`. |
| `packageDependencies` | NEW, required array of `DependencyRef` (empty allowed), so a bundle can be checked before install. A local `$defs.DependencyRef`, structurally identical to the manifest's, is added: each schema file in `docs/schema/2.0/` is self-contained, and the same practice already exists for `ExactTypeRef`, declared locally in both `blueprint.json` and `composition.json`. A new check keeps the two copies identical (Schema changes). |
| `themes`, `blueprints`, `protocols` | NEW, optional arrays of objects, the same loose shape as the existing `views`, `compositions`, `vocabularies`, `lifecycles` and `relationTypes` arrays (a bundle inlines definitions as objects; the manifest's arrays are file paths). They complete the ten definition kinds the manifest declares. This is the schema half of srs#390, whose text names all three kinds (its "array-of-string" wording describes the manifest's shape, not the bundle's); bundles carrying themes follows `rfc-decision-8948e43f` (owner ruling 9). The behavioural half (export and install carry them) is srs-rust work after acceptance. |
| `dependencyRefs` | Unchanged (required, `Reference[]`). Its description gains a sentence stating it is the definition-reference list and not the package requirement list. |

The bundle's top-level `required` list changes from `["schemaVersion", "packageId", "packageName", "packageVersion", "publishedAt", "mode", "fields", "types", "dependencyRefs"]` to the same list plus `"packageNamespace"` and `"packageDependencies"`. The package manifest's top-level `required` list does not change (`packageDependencies` stays optional there; absent means "requires nothing").

**`mode` and `packageDependencies`.** `mode` governs definitions only. In `"bundled"` mode the bundle inlines the definitions it needs. If an exporter inlined **every** definition of a required package (every entry of each of the ten definition-kind arrays of that package's manifest, at the installed version), it MAY omit that package's entry from the bundle's `packageDependencies`, since the bundle no longer needs it installed; an exporter that inlined only some of a package's definitions keeps the entry. Any entry that remains is checked identically in both modes (Change D). In `"standalone"` mode `packageDependencies` names the packages expected to be installed; `dependencyRefs` names the individual definitions the content points at. A consumer that finds a `dependencyRefs` entry not resolvable in the installed set uses the existing closure invariants (7, 8, 15, 35, 36, 37, 43); this RFC adds no rule tying the two lists together because a `Reference` carries no `packageId`.

**Relation to RFC-003 (Draft).** RFC-003 Revision 5 defines the Package Bundle and `[C5]`: *"A Package Bundle serialises as a single deterministic (sorted-key) JSON document with the `.srspkg` extension; given identical content the serialisation MUST be byte-for-byte reproducible. A `mode: "bundled"` bundle MUST inline all referenced definitions including transitive dependencies; a `mode: "standalone"` bundle MUST carry a complete `dependencyRefs` manifest for anything not inlined."* This RFC is consistent with `[C5]`: a `.srspkg` stays one deterministic sorted-key JSON document in the `package-bundle.json` shape with no archive wrapper, the new keys take part in the sorted-key serialisation like any other, and `dependencyRefs` keeps the role `[C5]` gives it. This RFC amends only the committed schema file `package-bundle.json`, which exists and is consumed (srs-rust#632, muDemocracy.org#242) independently of RFC-003's status.

RFC-003's identity rules meet the new fields as follows. `[C3]` says a whole-package export carries the source package's `packageId` and `packageVersion`; it carries the source manifest's `namespace` as `packageNamespace` and the source manifest's `packageDependencies` (Conformance Rule [R5]). A subset export (RFC-003, Draft) mints a new `packageId`, has no single source manifest, and so has no manifest list for [R5] to equal; this RFC requires only that its `packageDependencies` property be present, and leaves what a subset export puts in it to RFC-003's own acceptance. A requirement anywhere that names a source package is not satisfied by a subset exported from it (different `id`), which is the cost stated in Change A.

**Sequencing (owner ruling 6).** RFC-003's whole-package export subset (Change C as it applies to whole-package export, and `[C5]`) is accepted **before** muDemocracy.org#242's U2 implements `.srspkg` export and install, so the implementation builds on an accepted format rather than a Draft one. That acceptance is tracked separately in srs#857 (a sub-issue of muDemocracy.org#242). RFC-044's own acceptance does not depend on srs#857: it can be accepted first, since it changes only the committed schema; only [R5]'s producer clause waits for `[C3]`.

**Self-description.** A forthcoming RFC on self-description (readmes) for packages, bundles and repositories may add a readme to the bundle; this RFC adds no readme field.

### Change D — The consumer check

A consumer (a validator, an installer, a client) MAY check that installed packages satisfy their declared `packageDependencies`. It is MAY: a conforming consumer that never checks is conforming, and the engine's DETECT/LOAD/WRITE contract (`rfc-decision-2e0cd70a`) is unchanged: an unsatisfied requirement never fails a load. The check is a conformance rule of the `ext:repository` extension, the extension that declares a repository's packages (owner ruling 7); it is not placed as an invariant.

**The installed set** of a repository is defined as follows.

1. Each `PackageRef` in the manifest's `packageRefs` contributes one member; when `packageRefs` is present the singular `packageRef` is ignored (RFC-014 supersedes it for multi-package repositories), and when `packageRefs` is absent the singular `packageRef` contributes the one member. A `local` `PackageRef` resolves to the package manifest at its `path`; a `remote` `PackageRef` resolves to the package the consumer's registry holds for `PackageRef.packageId`. The member's identity is the resolved manifest's `id` and its version is that manifest's `version`. When a `PackageRef` of either mode cannot be resolved to a readable manifest, the member is identified by `PackageRef.packageId` and versioned by `PackageRef.packageVersion` (absent means unknown version); with no `PackageRef.packageId` it contributes no member. (An unresolvable local package is already reported by ordinary package resolution; this item only fixes what the check sees.)
2. When a `PackageRef`'s own `packageId`, `packageName` or `packageVersion` disagrees with the manifest it resolves to, the manifest wins; the `PackageRef` values are hints.
3. Several `PackageRef`s may resolve to the same `id` at different versions (RFC-014 Change C, multi-version installs); each is a separate member.
4. The core base package (RFC-029 Change A, `com.semanticops.core`, `id` `3a000001-0000-4000-a000-000000000001`) is a member, at the version of the core package the consumer implements, because RFC-029 makes it logically present in the RFC-014 R6 resolution union without any `PackageRef`. Two consumers built on different core versions can therefore reach different outcomes for a requirement on the core package; that is deliberate, since each reports what its own resolution union actually contains.
5. `upstreamPackage` (RFC-014 provenance) contributes nothing: it records what the repository was initialised from, not what is installed.

**The check.** For each member `P` of the installed set, and for each entry `D` of `P`'s `packageDependencies`, the consumer determines an outcome:

1. If `D` has no `packageId` (a legacy entry), the outcome is unsatisfied with reason `no-package-id`. The labels are never used to find a match.
2. Else if `D.packageId` equals `P`'s own `id`, the outcome is unsatisfied with reason `self-requirement`: a package never satisfies its own requirement, whichever version of it is installed.
3. Else the candidates are the members whose `id` equals `D.packageId`. With no candidate, the outcome is unsatisfied with reason `missing`.
4. Else, if any candidate satisfies `D.version` under Change B, the outcome is satisfied. Otherwise the outcome is unsatisfied, and the reason comes from one chosen candidate. Candidates of unknown version (absent, or not a SemVer string) are not eligible to be chosen; if every candidate is of unknown version, the reason is `version-unknown`. Among the rest, the chosen candidate is the one with the highest SemVer precedence among those inside `D.version`'s compatibility band (Change B clause 1), or, if none is inside the band, the one with the highest precedence overall; candidates of equal precedence (differing only in build metadata) are interchangeable, because they fail the same clause. The reason is the first Change B clause the chosen candidate fails: `incompatible` (clause 1), `prerelease-excluded` (clause 2) or `version-too-low` (clause 3).

A bundle `B` is checked the same way before install: `P` is `B` (its own `id` is `B.packageId`), its entries are `B.packageDependencies`, and the candidates are members of the target repository's installed set. Rule 2 also covers the case where `B`'s own package is already installed at another version. The pre-install check covers `B`'s entries only; an entry an exporter omitted under [R5] is not checked, and a required package's own requirements are checked when that package is itself a member, never transitively through `B`. Whether installing `B` changes the outcome for other installed packages (for example, by replacing the installed version of `B`'s `id`) shows in the repository-wide check after install; this RFC defines no install semantics. The check is not recursive: every installed package is itself checked.

Worked example (two installed versions). A repository's `packageRefs` resolve to `governance` `1.0.0` and `governance` `1.2.1` (both `id` `G`) and `argument` `1.3.0` (`id` `A`). `argument` declares `{packageId: G, namespace: "com.mudemocracy.governance", name: "governance", version: "1.1.0"}`. The candidates are both governance members; `1.2.1` satisfies clauses 1 to 3, so the entry is satisfied. Had `argument` required `2.0.0`, no candidate satisfies, the reason is taken from `1.2.1` (highest precedence), which fails clause 1: `incompatible`. Had it required `1.3.0`, the reason is `version-too-low` from `1.2.1`. Had the installed governance versions been `1.0.0` and `2.0.0` and the requirement `1.5.0`, the chosen candidate is `1.0.0` (the only one inside the `1.x` band), and the reason is `version-too-low`, not the `incompatible` that `2.0.0` would give.

**Diagnostics.** A consumer that performs the check reports its outcomes as ordinary validation diagnostics, never as a load failure, using these codes and no others for these situations:

| Code | Raised when | Default severity |
|---|---|---|
| `package-dependency-unsatisfied` | An entry's outcome is unsatisfied. The diagnostic MUST identify the reason by one of the names `no-package-id`, `self-requirement`, `missing`, `version-unknown`, `incompatible`, `prerelease-excluded` or `version-too-low`, and MUST name the requiring package (`id`), the entry's `packageId` (when present), its labels and `version`, and the installed version(s) of the candidates, if any. | warning |
| `package-dependency-label-mismatch` | The entry has at least one candidate (Change D step 3), and some candidate has a `namespace` or `name` different from the entry's labels. Reported once per entry, naming the differing candidate labels. Satisfaction is decided by `packageId` alone; this reports that the label is stale. | info |

A client MAY refuse an action on a `package-dependency-unsatisfied` diagnostic. Which actions a client refuses, and how it presents the refusal, is application-private (compass layer rule 6, axis 3–9) and is not specified here (owner ruling 2).

**Ratchet trigger.** The default severity of `package-dependency-unsatisfied` is raised from warning to error by a later RFC (or a revision of this one) when both hold: every tracked corpus (the list under What breaks) reports zero `package-dependency-unsatisfied` diagnostics, and srs-rust#1087's enforcement (the reference implementation performs this check) has shipped in a release.

srs-rust#1087 (packageDependencies unenforced) is the implementation issue this contract gives something to enforce.

### Change E — What is not in this RFC

The srs-web `EditorDefinition` and its install prompts are application-private (compass layer rule 6) and are not specified here; they consume `DependencyRef` as defined above. Whether a requirement can name an optional package, or alternatives (any of A or B), is not addressed: a requirement is a single required package. Registry resolution (finding a package by `packageId` when it is not installed) is not addressed; RFC-003's `ext:registry` proposal owns it. A readme for packages, bundles or repositories is left to the forthcoming self-description RFC.

---

## Conformance Rules

> **[R1]** Every `DependencyRef` MUST carry `packageId` (UUID), `namespace`, `name` and `version`, and no other property. `packageId` is the key of the requirement; `namespace` and `name` are display labels.
>
> **[R2]** `DependencyRef.version` MUST match the SemVer 2.0.0 pattern stated in Change A.
>
> **[R3]** An installed package version `I` satisfies a requirement version `R` if and only if, in order: (1) `I` is in `R`'s compatibility band (same MAJOR when `R`'s MAJOR is at least 1; same MAJOR 0 and same MINOR when `R` is `0.y.z` with `y` at least 1; same MAJOR, MINOR and PATCH when `R` is `0.0.z`); (2) if `I` carries a pre-release tag, `I` and `R` have identical MAJOR, MINOR and PATCH; (3) `I` has SemVer 2.0.0 precedence greater than or equal to `R`. Build metadata is ignored.
>
> **[R4]** The installed set of a repository is the set of members defined in Change D items 1 to 5. When more than one member carries the same `packageId`, a requirement on that `packageId` is satisfied if at least one of them satisfies [R3].
>
> **[R5]** `package-bundle.json` MUST declare `packageNamespace` (string) and `packageDependencies` (array of `DependencyRef`, possibly empty) as required properties. When RFC-003 `[C3]`'s whole-package export is accepted (srs#857), a bundle so produced MUST carry the source manifest's `namespace` as `packageNamespace`, and its `packageDependencies` MUST equal the source manifest's `packageDependencies` (an absent property counting as `[]`), except that the entry for a package whose every definition the bundle inlines MAY be omitted. A consumer does not verify an omission and raises no diagnostic for it.
>
> **[R6]** `package-bundle.json` MUST accept `themes`, `blueprints` and `protocols` as optional arrays of definition objects. Every definition-kind property of `package-manifest.json` (the ten properties from which `package-bundle.json`'s generated `$defs.Reference.definitionType` enum is derived, and which `check-schema-kind-correspondence.mjs` classifies as kinds) MUST have an array property of the same name in `package-bundle.json`.
>
> **[R7]** `packageDependencies` denotes only the list of required packages (`DependencyRef[]`), and the list of definition `Reference`s is named `dependencyRefs`. An implementation MUST NOT read either property as the other.
>
> **[R8]** A `DependencyRef` in a bundle has exactly the shape and meaning of a `DependencyRef` in a package manifest ([R1], [R2]).
>
> **[R9]** (`ext:repository`.) A consumer MAY check every `packageDependencies` entry of every member of a repository's installed set, and of a bundle before install, using the check in Change D. A consumer that never performs the check is conforming. An unsatisfied requirement, and a `DependencyRef` that fails schema validation, MUST NOT cause a repository load to fail.
>
> **[R10]** (`ext:repository`.) A consumer that performs the check MUST decide each entry's outcome by Change D steps 1 to 4 in order, MUST NOT decide satisfaction from `namespace` or `name`, and MUST report each unsatisfied entry as `package-dependency-unsatisfied` with exactly one reason from the closed list in Change D. Its default severity is warning. It MUST report `package-dependency-label-mismatch` (default severity info) under the condition stated in Change D.
>
> **[R11]** A legacy `DependencyRef` without `packageId` is invalid against `package-manifest.json`. Schema validation of a package manifest is distinct from repository load: a validator that checks package manifests against the schema reports the violation at error severity, while the load proceeds ([R9]). A consumer that performs the check also reports the entry as `package-dependency-unsatisfied` with reason `no-package-id`; a consumer that does both reports both, since they state different facts (the manifest is malformed; the requirement cannot be evaluated). No reader or writer MAY supply a missing `packageId` by matching labels; a writer MUST preserve such an entry unchanged in the manifest until it is repaired, and an exporter MUST NOT copy such an entry into a bundle (the bundle would be schema-invalid); it reports the entry and does not produce the bundle until the manifest is repaired.
>
> **[R12]** `dataModelRevision` is unchanged by this RFC (it remains 8).

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `package-manifest.json` | `$defs.DependencyRef`: add required `packageId` (`type: string`, `format: uuid`); add the Change A `pattern` to `version`; `required` becomes `["packageId", "namespace", "name", "version"]`; `namespace`/`name` descriptions say they are display labels. The `packageDependencies` property description states the requirement meaning and points at the version rule; its `$comment` is brought up to date. Top-level `required` unchanged. | 4 entries in 3 manifests in tracked corpora, plus 2 in srs-rust test data, lack `packageId` and become schema-invalid until repaired (What breaks). |
| `package-bundle.json` | Add `packageNamespace` and `packageDependencies` (`DependencyRef[]`) to `properties` and to `required`; add `$defs.DependencyRef` identical to the manifest's; add optional `themes`, `blueprints`, `protocols` arrays (`items: {type: object}`); `dependencyRefs` description gains the "definition references, not package requirements" sentence; the `mode` description says which list it relates to. The generated `$defs.Reference.definitionType` enum is unchanged (no definition kind is added to the manifest). | No conforming bundle exists to break; per consumer, see What breaks. |
| `generation-ledger.md` | The `package-manifest.json` and `package-bundle.json` rows record this RFC's hand patches; the `package-bundle.json` row's #390 "phase-scheduled" disposition is closed for the schema half. | None. |
| `manifest.json`, `container.json`, `composition.json`, all other schema files | None. | None. |

**Hand-authored or generated.** Per `docs/schema/2.0/generation-ledger.md`, `package-manifest.json` and `package-bundle.json` are **hand-authored**, out of the #272 Type-modelling scope (no metamodel Type or emitter targets them), and take hand patches. They are not regenerated by `check-schema-regenerate-drift` (which covers only `field.json` and `type.json`). The one derived fragment, `package-bundle.json`'s `$defs.Reference.definitionType` enum, is kept by `scripts/gen-package-bundle-definition-type.mjs --check` and does not change. `metamodel-fidelity.md` and `projection-rules.md` mention `packageDependencies` only as the historical srs-rust#868 precedent name and need no change.

**New check (tooling, no door).** `scripts/check-package-bundle-alignment.mjs`, declared in `scripts/checks.json` with a negative fixture under `tests/guards/`, asserts three spec-authoring rules (repository lints on this specification, not implementation conformance): (a) [R6]'s second sentence, reading the definition-kind list from `package-manifest.json` the way `check-schema-kind-correspondence.mjs` does; (b) the two `DependencyRef` `$defs` are deep-equal (the schema form of [R8]); (c) no record under `srs/records/` contains the string `Package.packageDependencies` (the prose form of [R7]). `check-schema-kind-correspondence.mjs` itself is unchanged (its `packageDependencies: null` row already classifies the property as not a definition kind). A schema fixture set exercises [R2]'s pattern: `1.0.0-rc.1+b5` valid; `1.0`, `01.0.0`, `v1.0.0` invalid.

**Spec records changed at acceptance** (Stage 6; 10 prose records listed below, plus the `ext:repository` extension record, the new successor decision record and the `spec-rfc-process` editorial fix, all described after the list):

- Invariants 7, 15, 35, 36, 37: `normative_statement` changes `Package.packageDependencies` to `Package.dependencyRefs`. Invariant 7 currently reads *"Every `fieldId` referenced in any `FieldAssignment` within a `Package.types[]` must appear as the `id` of an entry in `Package.packageDependencies`."* Invariant 35 also loses its parenthetical *"(`packageDependencies`: srs-rust#873/#910, folded onto this same rev-6 stamp.)"*.
- Invariant 8: `title` (*"If Package.mode === "bundled": every Reference in packageDependencies must…"*) and `normative_statement` (*"If `Package.mode === "bundled"`: every `Reference` in `packageDependencies` must have a matching `Field` in `fields[]` (matched on `id` and `version`)."*) both change `packageDependencies` to `dependencyRefs`.
- Invariant 43: `title` (*"When ext:type-inheritance is declared, Package.packageDependencies must…"*) and `normative_statement` (*"When `ext:type-inheritance` is declared, `Package.packageDependencies` must include a `Reference` for every Type in the transitive closure of base Types..."*) both change to `Package.dependencyRefs`.
- `example-745529e6` (the `Package` IDL): `packageDependencies: Reference[]` becomes `dependencyRefs: Reference[]`, and `packageNamespace: string` and `packageDependencies: DependencyRef[]` are added; a `DependencyRef` IDL is added beside `Reference`.
- `mechanism-bc156a49` (the `Package` mechanism): *"`packageDependencies` is required in both modes. Consumers use it to validate completeness without parsing content internals."* becomes the same sentence about `dependencyRefs`, followed by one sentence introducing `packageDependencies` as the package requirement list.
- `table-e6e67001` (the `mode` table): the `"standalone"` row's *"`packageDependencies` is the required manifest."* becomes *"`dependencyRefs` is the required manifest."*

The two decision records that mention the name (`rfc-decision-628cf6c4`, `rfc-decision-c8704763`) are ratified history and are not edited. Two `scripts/spec-language-allowlist.json` entries cite invariant 8 and 43 text; they are re-keyed in the same PR if the checker reports them. The RFC-031 prose-schema checker does not map `Package` and has no allowlist entry for it, so it is unaffected. The `ext:repository` extension record gains the check's conformance text ([R9], [R10]); no invariant record is created (owner ruling 7). The integration manifest lists `schema:package-manifest.json`, `schema:package-bundle.json`, `ext:repository`, `I-7`, `I-8`, `I-15`, `I-35`, `I-36`, `I-37`, `I-43` and the `mechanism:` token resolving to `mechanism-bc156a49`. The editorial fix to `srs/package/spec-rfc-process/package.json` (owner ruling 4) rides in the same spec PR.

Schema changes sync to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` through the release tarball (`schemas-2.0.tar.gz`) and each mirror's `sync-schemas-from-spec.sh`, never by editing mirrors in the spec PR.

---

## What breaks, with counts

Measured on 2026-10-02 against: `srs` master `6bc3a71`; muDemocracy.org `origin/main` `ec1e004`; srs-web `origin/main` `956e499` (`e2e/fixtures`); srs-programme `HEAD` `3af2a97` (read-only clone); srs-rust `origin/master` `cb55424a`; srs-vscode `origin/master`. Every JSON and `.srsj` file in each was scanned for package manifests (exploded and embedded) and for `packageDependencies`.

| Corpus | Package manifests | `packageDependencies` entries | 0.x requirements | Unresolvable |
|---|---|---|---|---|
| `srs/srs` (spec repository) | 6 | 1 | 0 | 0 |
| `srs/packages` (governance 1.0.0, 1.1.0, 1.2.0, 1.2.1, and their `.srsj` seeds) | 4 (+4 embedded copies) | 0 | 0 | 0 |
| Gallery (`docs/spec/examples/gallery-project-v2`, and `gallery.srsj`) | 1 (+1 embedded) | 0 | 0 | 0 |
| Conformance fixtures (`tests/rfc-040-unit3`, `tests/rfc-534-emitter-capabilities`) | 2 | 0 | 0 | 0 |
| muSrs (muDemocracy.org) | 7 | 3 | 0 | 0 |
| muDemocracy.org explorations (`explorations/srs-content-model`) | 2 | 0 | 0 | 0 |
| srs-programme | 1 | 0 | 0 | 0 |
| srs-web e2e fixtures | 7 (1 exploded, 6 embedded in `.srsj`) | 0 | 0 | 0 |
| srs-rust test data (`tests/fixtures/spec-repo/.../spec-rfc-process/package.json`: 1 entry; `package_boundary_roundtrip.rs`: 1 inline entry) | 2 with entries | 2 | 0 | 1 (the inline entry, by design) |
| srs-vscode | 0 with entries | 0 | 0 | 0 |
| Private repositories in the owner's estate | not measured | **must be checked by the owner** before acceptance, with the same repair procedure | | |

The entries that lose schema validity until `packageId` is added:

- `srs/srs`: `srs/package/spec-rfc-process/package.json`, 1 entry, `com.semanticops.spec/spec-authoring-core@1.0.0`. It resolves to `id` `4a000001-0000-4000-a000-000000000001`. It is also **unsatisfied** under the version rule: the installed package is `3.0.0` (clause 1, `incompatible`). The repair sets `version` to `3.0.0`, the version the package is authored against (owner ruling 4).
- muSrs: `muSrs/packages/argument/package.json` (installed `argument@1.3.0`), 1 entry, `com.mudemocracy.governance@1.0.0`, resolves to `1cd9622e-3d05-4214-a683-4cb81d0c44d9` (installed `1.0.0`, satisfied). `muSrs/package/package.json` (`com.mudemocracy/primary@1.0.0`), 2 entries: `com.mudemocracy.argument@1.0.0`, resolves to `126eeba4-3124-4ee6-a9e5-5a943cb87cb5` (installed `1.3.0`, satisfied), and `com.mudemocracy.governance@1.0.0`, resolves to `1cd9622e-…` (satisfied). This `primary` manifest is not listed in muSrs's `packageRefs`, so it is not a member of the installed set and the check never evaluates its entries; it is still repaired so that it is schema-valid.
- srs-rust test data: `tests/fixtures/spec-repo` is a copy of the spec repository and takes the same repair as `srs/srs`. `package_boundary_roundtrip.rs` declares an inline entry on `com.semanticops.roundtrip.external/external-dep@3.2.1`, a package that exists nowhere; it cannot be resolved, so it is not guessed: the srs-rust follow-up gives the test a fixed synthetic `packageId` deliberately, as authored test data.

**Repair procedure (owner ruling 5; no migration tool).** For each entry without `packageId`, find the installed-set members of the repository that holds the manifest whose `namespace` and `name` both equal the entry's labels. If exactly one distinct `id` is found, write it as `packageId`. If none, or more than one distinct `id`, is found, the repair of that entry stops and is reported to the repository's owner, who supplies the `id`; the entry is never filled from a guess. All 4 corpus entries resolve to exactly one `id`.

**Order of landing.** The spec PR merges the schema change and repairs `srs/srs` in the same commit, so srs's own gates (which validate its package manifests) never see an unrepaired entry. Adding `packageId` before the schema change would itself be invalid under today's closed `DependencyRef`, so the muSrs repair is a muDemocracy.org PR that merges after the spec PR and no later than the first muDemocracy.org pin advance that brings in the new schema mirror; it is a gating step of acceptance. Until then muSrs is unaffected, because the reference implementation does not validate package manifests against the JSON Schema (`srs-repository`'s `DependencyRef` struct reads `namespace`, `name` and `version` without `deny_unknown_fields`, so both the old and new entry shapes load). The srs-rust test-data repair rides with srs-rust#1087's implementation.

**Bundles, per consumer.** One bundle exists: `srs/packages/com.semanticops.core/1.0.0/core-bundle.srsj`, byte-identical to srs-rust's embedded `crates/srs-repository/assets/core-bundle.srsj` (the RFC-029 core package). It already fails today's closed schema (it carries the pre-rename key `documentViews`), and it is not an exemplar of the bundle format. Its consumers: (1) srs-rust's `core_package.rs` parses it into `EmbeddedCorePackageJson`, a serde struct without `deny_unknown_fields` that reads only `packageId`, `packageName`, `packageVersion`, `dataModelRevision`, `fields`, `types` and `relationTypes`: unaffected, it neither needs nor rejects the new keys; (2) srs-rust's `core_bundle_drift` test hashes the embedded file: unaffected unless the file is edited; (3) srs's `check-srsj-envelope-conformance.mjs` deliberately excludes it, and no srs check validates it against `package-bundle.json`: unaffected. So making `packageNamespace` and `packageDependencies` required breaks no consumer. srs-rust's `.srspkg` export (srs-rust#632, open) emits the new shape from its first release.

**Readers of the spec prose.** The corrected name changes the wording of 10 records (7 invariants, 3 others); no stored data uses the prose name.

**Engines.** Old binaries ignore `packageId`, which is the DETECT/LOAD/WRITE contract; adding `packageId` to the struct and implementing Change D is srs-rust#1087's follow-up.

**Nothing breaks in records, relations, containers, rendered output or navigation:** 0 instance records change.

### Migration decision: no `dataModelRevision` bump, no registry entry

`dataModelRevision` (RFC-033) is a generation stamp for an operational data-model delta that an engine must gate on: one a binary of the previous revision would misread or a binary of the new revision would refuse. Neither holds here. Old binaries tolerate the added key (measured above); a new binary does not refuse an entry without `packageId`, because the check is MAY and never fails a load ([R9], [R11]). A migration would also have to invent the missing `packageId` by matching labels, which [R11] forbids a reader to do and which works only when the dependency is installed.

The lesson of RFC-043 points the same way: its revision bump deadlocked the release because the release's corpus gate validated corpora as-is until build.417 was published by hand (srs-rust#1145 owes the fix). A bump would put 4 one-line repairs on the same path. The owner ruled for no bump (owner ruling 5); the data is repaired directly, in the order above.

---

## Rationale

**Why `packageId`, not a stronger label.** The package already has a stable `id` that every other pointer to a package uses (`PackageRef.packageId`, `upstreamPackage.packageId`, the bundle's `packageId`). Making the requirement use it is one fewer concept, not one more. A label-keyed requirement cannot survive a rename and cannot tell an unrelated package with the same labels from the real one.

**Why required, not optional.** An optional `packageId` leaves two ways to match (by id when present, by label when absent), which is the parallel mechanism the compass forbids and the exact ambiguity the editor needs removed. With 4 corpus entries, all resolvable, the formation-phase default (Evolution over Continuity) says make it required and repair the data.

**Why this version rule.** "Same compatibility band, at least this version" is the common caret contract for a package-level constraint and needs no range syntax (`rfc-decision-c8704763` allows one constraint form, package layer only). The 0.x band follows the npm and Cargo convention because a 0.x package promises nothing across minors; without it a `0.1.0` requirement would be satisfied by an incompatible `0.9.0`. The pre-release clause keeps `1.3.0-rc.1` from satisfying a `1.2.0` requirement, which SemVer precedence alone would allow.

**Why a closed, ordered reason list.** Two consumers that disagree on why a requirement failed produce two messages for one fact. A fixed evaluation order makes the reason a function of the inputs, so a conformance test can assert it.

**Why `dependencyRefs` keeps its name.** The manifest name was ruled (`c8704763` item 2, RFC-040) and implemented (srs-rust#873). The bundle's `dependencyRefs` is serialised in the schema and in srs-rust's embedded bundle. Correcting the prose touches 10 records and no stored data; renaming `dependencyRefs` would touch every producer and consumer of a bundle and need a migration for no stored benefit (owner ruling 8).

**Why a MAY check at warning.** A MUST check, or an error severity, would make every repository whose packages predate the rule a failing repository, and would put the spec ahead of its implementation (srs-rust#1087). A MAY with a fixed code lets each consumer adopt the check when ready and keeps messages uniform; the ratchet trigger says when the default becomes error. What a client refuses on the diagnostic is behaviour, which compass layer rule 6 keeps application-private until it has enforcement semantics.

**Why an extension conformance rule, not an invariant.** The check is optional for a consumer and concerns the repository's installed packages, which `ext:repository` declares. An invariant states what must hold of conforming data; an unsatisfied requirement is a reportable state, not invalid data (owner ruling 7).

---

## Alternatives Considered

### Alt A — Keep `namespace/name` as the key and add an optional `packageId`

Rejected: two ways to match; "optional" is where a client would match by label and look correct until a rename. See Rationale.

### Alt B — Rename the bundle's `dependencyRefs` to `definitionRefs` (or similar) and keep `packageDependencies` everywhere

Gives the cleanest names, but renames a stored key in every bundle producer and consumer (`rfc-decision-628cf6c4`: a rename is a migration with a generation stamp) and conflicts with RFC-003 `[C5]`'s wording. Rejected by owner ruling 8.

### Alt C — A version range grammar (`^1.2.0`, `>=1 <3`)

Rejected: a second grammar to parse and specify for no present need; `rfc-decision-c8704763` allows one constraint form.

### Alt D — No special treatment of 0.x

Rev 1's rule. Rejected by owner ruling 3: it lets `0.9.0` satisfy `0.1.0`, which a 0.x package does not promise.

### Alt E — Bump `dataModelRevision` to 9 with a registry migration

Rejected on the counts and on the RFC-043 deadlock (owner ruling 5). A migration would also have to match labels to invent ids, which [R11] forbids.

### Alt F — Make the check a MUST, or default it to error

Rejected for now: see Rationale. The ratchet trigger in Change D states when the default becomes error.

### Alt G — Specify the blocking behaviour (install refuses, editor will not open)

Rev 1 said a blocking client reports the code at error for that action. Rejected by owner ruling 2: the spec defines the diagnostic and permits refusal; the behaviour itself is application-private.

---

## Owner rulings (2026-10-02)

Reached by mapping each Rev 1 open question against the decision compass. They close every open question.

1. Key by `packageId`. A successor decision record superseding `rfc-decision-c8704763`'s package-dependency sentence is created at acceptance.
2. The spec defines `package-dependency-unsatisfied` with default severity warning and says clients MAY refuse an action on it. The blocking behaviour itself is application-private (compass rule 6, axis 3–9). The trigger for a later ratchet to error is named (Change D).
3. Below 1.0 the MINOR acts as the major: `0.y.z` is satisfied by the same `0.y` at an equal or higher patch; `0.0.z` needs an exact match; pre-release handling as in Change B. 0 current entries are affected.
4. The stale `spec-rfc-process` requirement is set to `spec-authoring-core@3.0.0` in the spec PR (editorial).
5. No `dataModelRevision` bump; entries are repaired directly after every known corpus is counted (What breaks); an unresolvable entry fails loudly and is never guessed. Private repositories are checked by the owner.
6. RFC-003's whole-package export subset (Change C and `[C5]`) is accepted before U2 implements `.srspkg`; tracked in srs#857.
7. The consumer check is an extension conformance rule (`ext:repository`), not an invariant.
8. `dependencyRefs` is not renamed.
9. Bundles carry themes (with blueprints and protocols) per `rfc-decision-8948e43f`.

Out of scope: package, bundle and repository readmes, left to a forthcoming self-description RFC.

---

## Open Questions

**None.** All nine Rev 1 open questions are closed by the owner rulings above. Before acceptance the owner checks the private repositories (What breaks).
