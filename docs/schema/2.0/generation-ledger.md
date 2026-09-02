# Generation ledger — `docs/schema/2.0/` (srs#522)

`schema → source Type(s) → extension dependencies → emitter → generated or explicit exclusion rationale`,
for the complete post-RFC-038 instance-layer schema set. This is the Task 4b/1 session-gate
deliverable (srs#522, part of epic #256's Task 4b, srs#272): **classification only — no schema,
record, or code change lands with it, beyond the completeness guard below.** Nothing in Task 4b's
generation units (2–6) starts until this ledger is reviewed and signed off.

Governing: the accepted consequence map (srs#272 comment [5496683905](https://github.com/the-greenman/srs/issues/272#issuecomment-5496683905)),
the zero-backwards-compatibility base rule (srs#512 comment [5496985797](https://github.com/the-greenman/srs/issues/512#issuecomment-5496985797),
srs#272 comment [5496985508](https://github.com/the-greenman/srs/issues/272#issuecomment-5496985508)),
the envelope/`document-view-output.json` rulings (srs#272 comment [5497040159](https://github.com/the-greenman/srs/issues/272#issuecomment-5497040159)),
and the migrate-where-educational-else-recreate standing rule (srs#512 comment [5497040416](https://github.com/the-greenman/srs/issues/512#issuecomment-5497040416)).

**Method.** Walked against a fresh worktree off `origin/master` at `562312e` (2026-09-01T17:35Z),
never the checked-out sibling — the checked-out `srs/` sibling used for other work sits on an
unrelated branch and is stale by three fixup PRs relative to this commit (confirmed: it still
carries `federation-events.json`, `federation-registry.json`, `typed-record.json`, none of which
exist at `origin/master`). Every prior count of this file set has grown on inspection (18 rows → 24
files → "24 + up to 4"); this walk found **22** files in `docs/schema/2.0/*.json` today, plus 3
non-schema docs (`README.md`, `projection-rules.md`, `metamodel-fidelity.md`) in the same directory,
which the completeness check (below) does not require a row for.

## 1. The 22 live schema files

| Schema | Source Type(s) (post-#272) | Ext. deps | Emitter | Classification | Closing issue(s) |
|---|---|---|---|---|---|
| `field.json` | — (RFC-033 frozen bootstrap) | — | none (frozen seed) | **Permanent explicit exclusion.** RFC-033's fixed point; never re-derived, by design, not a temporary gap. | — |
| `type.json` | — (RFC-033 frozen bootstrap) | — | none (frozen seed) | **Permanent explicit exclusion**, same basis as `field.json`. | — |
| `package-manifest.json` | — | — | none today | **Out of #272 scope — verified, not assumed.** No metamodel Type or emitter targets this file (`gen-metamodel-package.mjs`/`check-schema-regenerate-drift.mjs` cover only `{field,type}.json`); #273 (closed) scope was exactly `{field,type}.json`; #274's decision assigns definition-layer coverage to #273, not #272. Same RFC-033 bootstrap tier as `field.json`/`type.json`, but not frozen — it still takes hand-authored patches (e.g. #390 below). | — |
| `package-bundle.json` | — (nested `$defs.Reference.definitionType` enum *is* generated, see below) | — | `gen-package-bundle-definition-type.mjs --check` (nested enum only) | **Out of #272's Type-modeling scope, same reasoning as `package-manifest.json` — with an open conflict.** The 2026-08-18 coherence-pass comment on #272 ([5332631947](https://github.com/the-greenman/srs/issues/272#issuecomment-5332631947), item 2) says #390's gap "closes as modeling... here," but no generator reaches this file's top-level `properties` (only the nested `definitionType` enum is generator-synced, per `rfc-decision-c8704763` item 4). **Owner decision needed:** extend the existing generator to also sync the top-level array properties (closing #390 as generation, consistent with "one way per goal"), or treat #390 as the plain hand-edit its own issue body describes, outside #272. Recommend the former; not assumed here. | #390 (open) |
| `record.json` | `Record` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | #248, #249 |
| `note.json` | `Note` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | #250 |
| `relation.json` | `Relation` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. Standalone since RFC-038. | #251 |
| `relations-collection.json` | — | — | none (retiring) | **Retires with no successor** — owner ruling, srs#272 comment [5496985508](https://github.com/the-greenman/srs/issues/272#issuecomment-5496985508): RFC-038 already moved relations to one-file-per-relation; this is a dead shape, cut rather than regenerated. File deletion executes at #272 unit 2/3, not in this session-gate unit. | — (dead shape, cut) |
| `relation-type.json` | `RelationTypeDefinition` (new, re-keyed) | — | #272 unit 2 emitter, after unit 4's re-keying | Generatable via #272 unit 2, sequenced **after** unit 4 (semanticObjectType collapse) re-keys `requireSameSemanticObjectType` onto `requireSameType`. | #254, #372 |
| `container.json` | `Container` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | #252 |
| `manifest.json` | `Manifest` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2 (reduced descriptor-only shape, RFC-038). Carries `renderedPresentations[].viewId` → `compositionId`, coupling its generation to unit 3. | — |
| `view.json` | `View`/`FieldView`/`RecordPropertyView`/composite dispatch (new) | ext:views-l1 | #272 unit 2 emitter, sequenced after units 3 & 5 | Generatable via #272 unit 2, but **lands after** the `exportConfig` relocation (unit 5) and `FieldView.required` distinction riders. RFC-041's `RecordPropertyView` row (merged, current name) is already live in this file today — not renamed, per the ruling not to pre-empt Composition. | #247 |
| `document-view.json` | `Composition` (renamed, new) | ext:views-l2 | #272 unit 3 emitter | Generatable, coupled to unit 3's Composition rename. **Successor filename** (`composition.json`) lands with that unit, not here. | — |
| `document-view-output.json` | (projection of `Record`/`Relation`/`RecordPropertyView`, not a package Type) | ext:views-l2 | srs-rust `render_service.rs` | **Canonical shape stands** — owner ruling on srs#365 (2026-09-01): `typeVersion` required on `ProjectedRecord`, `relationType`+`direction` required on `ProjectedRelationRow` are correct as written; the srs-rust reduced output is a conformance bug, fixed at srs-rust#817, not a schema change. Ledger classification: keep + generatable after the Composition rename (successor filename decided at #272 unit 3). RFC-041 Rev 4 already added `ProjectedPropertyRow` here (confirmed present, lines 143/149 of the current file) — the further question of whether/how `RecordPropertyView` rows themselves project into this output is tracked separately per #365's own last comment ("needs a Door 3 ruling on RFC-041, not an inline code comment"); not decided by this ledger. | (tracks #365, srs-rust#817) |
| `blueprint.json` | `Blueprint` (new) | ext:blueprint | #272 unit 2 emitter | Generatable via #272 unit 2. | — |
| `term.json` | `Term` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | #253, #254 |
| `vocabulary.json` | `Vocabulary` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | #253 |
| `lifecycle.json` | `Lifecycle` (new, installable/`lifecycleRef`-targeted — distinct from the inline `type-lifecycle` facet already in the metamodel) | ext:lifecycle | #272 unit 2 emitter | Generatable via #272 unit 2. | — |
| `protocol.json` | `Protocol` (new) | ext:protocol | #272 unit 2 emitter, **blocked on #379** | Present on disk (landed via #297/#378, matching the implementation's shape), but **not to the same generation discipline as `field.json`/`type.json`** — no metamodel Type models it, no regenerate-drift check covers it. srs#379 (open, unresolved) records that the normative prose and the implementation/corpus describe genuinely different shapes for `Protocol` (`id`/`namespace`/`name`/`version` vs `protocolId`/`protocolNamespace`/... ). #272 unit 2 cannot generate this schema from a modeled Type until #379 rules which side is canonical — flagged as a hard prerequisite, not assumed resolved. | #379 (blocking prerequisite) |
| `source-document-meta.json` | `SourceDocumentMeta` (new) | — | #272 unit 2 emitter | Generatable via #272 unit 2. | — |
| `theme.json` | `Theme` (new) | ext:themes-l1 | #272 unit 2 emitter | Generatable via #272 unit 2. | — |
| `discovery.json` | `DiscoveryQuery` (new) | ext:discovery | #272 unit 2 emitter | Generatable via #272 unit 2; load-bearing for unit 5's SectionSource → DiscoveryQuery collapse. | — |

## 2. Owed / absent rows

| Row | Status | Classification |
|---|---|---|
| `{srsj, manifest, data}` envelope schema | **Absent.** Recorded as owed by both RFC-038 (`rfcs/rfc-038-tree-authoritative-storage.md:944`: *"no schema in `docs/schema/2.0/` for the `{srsj, manifest, data}` envelope at all — RFC-039 recorded this same gap and deferred it"*) and RFC-039 before it. | **Ownership assigned to #522** (this ledger), per owner ruling srs#272 comment [5497040159](https://github.com/the-greenman/srs/issues/272#issuecomment-5497040159): *"the `{srsj, manifest, data}` envelope schema is ASSIGNED to #272's ledger unit... so it owns it."* **Authoring is deferred to a downstream #272 unit** (recommend unit 2, alongside `manifest.json`, its closest sibling) — #522's own scope is explicitly classification-only ("No schema/record writes, no code... in this unit"), so no envelope schema file is added here. This row exists so the ledger's own "no unclassified schema" acceptance criterion is met by ownership, not by premature authorship. |
| `.revisions.json` sidecar schema | **Not owed. Delivered once, then retired.** #297/#378 authored `docs/schema/2.0/revisions.json` (merged 2026-08-13). It was then **removed** together with `ext:changelog`, by `rfc-decision-2a1e1590` ("state is mutable, semantics are not... Revisions and Changelog are removed"), executed in PR for #443 (commit `907dceb`, merged 2026-08-23). Dormancy rule applies — return trigger is a real consumer needing transition history (the muDemocracy Decision Log's governance-audit surface is named as the anticipated first claimant). | **Explicit exclusion — retired-dormant, not owed to #272.** No further action for this ledger. ~~**Anomaly flagged** (new finding, not in the map): the corpus today still contains **75 live `.revisions.json` sidecar files** (`srs/records/**/*.revisions.json`, `srs/package/records/*.revisions.json`) with no governing schema, some dated as late as 2026-08-28 — five days *after* the removal that the removal commit justified on "zero corpus files anywhere." srs-rust apparently still writes this sidecar on record transitions (per srs-rust#866, open, which records the same upstream removal as a heads-up). This is an **implementation discipline gap** (srs-rust writing an orphaned mechanism), not a spec/ledger gap — out of #522's scope to fix, surfaced here because the ledger's exhaustive walk found it.~~ **RESOLVED (srs#531, this PR):** srs-rust#866/PR#916 severed the write path and shipped a registered `revisions-sidecar-cleanup` migration; run once here via `srs repo apply-migration --id revisions-sidecar-cleanup --repo srs`. Deleted **72** stray sidecars under `srs/records/**` and `srs/package/records/` (the finding's "75" count included 3 files under the separate `docs/spec/examples/gallery-project-v2/` example repository, out of this corpus's own scope). `srs repo validate --repo srs` is `ok:true` afterward (pre-existing tag-vocabulary warnings only). Anomaly closed. |
| `federation-events.json`, `federation-registry.json` | Removed (PR for #442, commit `d66ac2f`, "remove federation machinery, keep dormancy stub"). | **Historical — already retired**, consistent with `ext:federation`'s "removed with a committed return" disposition (decision `4f1e12e5`; srs-rust#878 tracks the return-trigger separately). Not #272's to re-add. |
| `typed-record.json` | Removed (PR for #448, commit `c767738`, "remove Tier 1 (TypedRecord)"). | **Historical — already retired**, consistent with Tier-1 removal (decision `53635966`). Not #272's to re-add. |

## 3. The two enumeration-invisible instance trees

RFC-039 `[R13]` forbids glob-enumeration as a fallback mechanism, so both of these need an explicit
classification rather than "the enumerator will find it eventually."

- **`srs/package/records/`** — 5 files: 4 Tier-2 Records (`com.semanticops.spec/rfc`,
  `com.semanticops.spec/rfc-change` ×3) plus 1 `.revisions.json` sidecar. **3 of the 4 records carry
  no `$schema`** (verified: `rfc-change-{05fc673c,77e89353,819fea19}.json`; only `rfc-ffe44c91.json`
  has one). All 4 are structurally valid Records (`instanceId`/`typeId`/`fieldValues` present, would
  validate against `record.json`) but **none is ever checked**: `validate-records.mjs` walks only
  `records/`, and `validate-package.mjs`'s own doc comment explicitly excludes `package/records/` by
  name ("neither... is a definition"). This is a genuine enumeration gap, not a shape problem, and —
  checked against open issues — **appears to be a new finding**, not previously tracked under any
  open srs issue. **Classification: real Records, currently unvalidated by any registered check.**
  Fixing the enumeration gap is implementation work (extend `validate-records.mjs` or add a sibling
  check to also walk `package/records/`), out of #522's own classification-only scope — flagged
  prominently in the PR body rather than actioned here.
- **`tests/rfc-032/`** — no manifest, no `.srs` marker; **already ratified as not a repository** by
  RFC-038 itself (`rfcs/rfc-038-tree-authoritative-storage.md`, "Resolved migration dispositions":
  *"`tests/rfc-032/` is unit-test input, not a repository: it has a test runner, goldens and one
  sample instance but no manifest or repository boundary."*). Its one instance
  (`tests/rfc-032/records/showcase-instance.json`) does carry `$schema: record.json` and **is**
  validated — by the dedicated `rfc-032-conformance-fixture`, `rfc-032-paper-proof`, and
  `rfc-032-migration-*` checks already registered in `scripts/checks.json` (`always` tier), not by
  repo-shaped or manifest-keyed enumeration. **Classification: covered by design, no gap** — this is
  a settled disposition, not an open question, despite being listed as one in the map.

## 4. Boundary verified: package-manifest.json / package-bundle.json

The map's §4 asked to "verify explicitly, don't assume" whether these two are in #272's scope at
all. Verified against the actual generation mechanism (§1 above): neither is modeled by any
metamodel Type, and the only registered generator for this pair
(`gen-package-bundle-definition-type.mjs`) touches solely `package-bundle.json`'s nested
`definitionType` enum, not either file's top-level shape. Both stay classified as RFC-033-tier
bootstrap artifacts, outside #272's instance-layer-modeling mandate — with the one open conflict on
`package-bundle.json` recorded in §1's row (the #390 rider vs. the absence of a mechanism to execute
it as generation).

## 5. Summary

| Classification | Count | Rows |
|---|---:|---|
| Generatable via #272 unit 2 (or later unit, as noted) | 16 | record, note, relation, relation-type, container, manifest, view, document-view→composition, document-view-output, blueprint, term, vocabulary, lifecycle, protocol*, source-document-meta, theme, discovery (*protocol.json blocked on #379) |
| Permanent explicit exclusion | 2 | field.json, type.json |
| Retires with no successor | 1 | relations-collection.json |
| Out of #272 scope (verified) | 2 | package-manifest.json, package-bundle.json (latter carries one open conflict, §1) |
| Owed, ownership assigned to this unit, authoring deferred | 1 | `{srsj, manifest, data}` envelope |
| Explicit exclusion, retired-dormant | 1 | `.revisions.json` sidecar schema |
| Historical, already retired (informational, not counted against the 22) | 3 | federation-events.json, federation-registry.json, typed-record.json |
| Enumeration-invisible instance trees, classified | 2 | `srs/package/records/` (real gap, flagged), `tests/rfc-032/` (covered, no gap) |

**22 live schema files, all classified. Zero unclassified schema files.** One blocking prerequisite
decision (`#379`, protocol.json), one open mechanism conflict (`#390` / `package-bundle.json`), one
anomaly flagged for awareness and since **resolved** (72 orphan `.revisions.json` sidecars deleted —
srs#531, see §2's row above), and one new enumeration gap flagged for awareness (`srs/package/records/`,
3 unvalidated Records) — none of which block this unit's own completion, since #522's job is the
ledger and the owner-review gate, not resolving them.
