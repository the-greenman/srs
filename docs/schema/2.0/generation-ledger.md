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

**Update (srs#523/#524, dataModelRevision 6, this PR):** the Composition rename and the
semanticObjectType collapse landed, paired with the srs-rust#910/#921 engine cutover and the
`packageDependencies` fold (srs-rust#873). Rows below for `composition.json` (renamed from
`document-view.json`), `manifest.json`, `relation-type.json`, `view.json`, `type.json`,
`package-manifest.json`, `package-bundle.json`, `theme.json`, and `blueprint.json` are updated to
reflect the executed rename/collapse; each still-parked row's Type-modeled generation (srs#526)
is unaffected by this PR.

**Update (srs#527, Task 4b/6, the final unit of the #272 train):** the #274-style generated
property-table reference (`com.semanticops.spec/generated-type-reference` records,
`scripts/gen-type-reference-tables.mjs`) now covers all nine srs#526 entities — `record`, `note`,
`note-section`, `source-reference`, `relation`, `container`, `vocabulary`, `term`, `blueprint`,
`relation-spec`, `lifecycle`, `source-document-meta` (12 records; `note-section`/`source-reference`/
`relation-spec` are the nested value objects, each given its own reference rather than an appendix,
since `source-reference` in particular has three owners — Record/Note/Relation — and picking one to
host an appendix would be arbitrary). The corresponding hand-authored ```typescript``` property
blocks in the published subsection narrative are retired in favour of a one-line pointer, and
`check-idl-schema-conformance.mjs`'s MAPPING table and the RFC-031 allowlist shrink accordingly (see
below) — the same "no hand-authored structural duplicate remains for generated targets" pattern
RFC-040 Change J established for Field/Type. `relations-collection.json` is deleted (the retirement
ruled at srs#272 comment 5496985508, pending since #526/#523; three RFC integration manifests
naming it retargeted to `relation.json` or dropped). **Composition, DiscoveryQuery, the shared
ExportConfig, View, Manifest, and RelationTypeDefinition are NOT yet Type-modelled** (verified
against the corpus, not assumed from the map) — generating their reference is therefore not yet
possible with `gen-type-reference-tables.mjs`'s metamodel-only resolution path, and is filed as its
own follow-up, srs#541 (parented under #256), rather than attempted here under time pressure. Their
ledger rows below are unchanged by this PR.

**Update (srs#541, Task 4b/6 residual, the follow-up filed above): all six parked entities are now
Type-modelled**, closing the ledger's generatable set modulo three named blockers/gaps (#379, #390,
#534) plus one new gap found and filed by this unit (#543). `RelationTypeDefinition`, `Manifest`,
`Composition` (modulo `DocumentSection.source`), and `View` (modulo `fieldViews`) are generated —
`rfc-541-closure-test.mjs` proves `emitter ⊆ committed seed` over their covered properties, same
discipline as `rfc-272-closure-test.mjs`. The shared `ExportConfig` is modelled once and attached at
both `Composition.exportConfig`/`View.exportConfig`; `FieldView`/`RecordPropertyView` are each
independently modelled and closure-proven against their own `view.json` `$def`; the `DiscoveryQuery`
entity's own shape (minus `tier`, the #534-tracked gap) is modelled and closure-proven against
`discovery.json`'s `$defs.DiscoveryQuery` — the standalone `discovery.json` FILE's own generation
stays gated on #534 as before (unaffected; #534 is about a `$defs`-only bundle emission mode this
unit does not add). `DocumentSection.source` (`SectionSource`) and `View.fieldViews` are both
JSON-Schema `oneOf` discriminated unions the metamodel's FieldType system cannot express (every Type
composes to one flat object) — a genuine NEW finding, not an #534 gap and not force-modelled; filed
as srs#543. Eight new `com.semanticops.spec/generated-type-reference` records (RelationTypeDefinition,
Manifest, Composition, View, DiscoveryQuery, ExportConfig, FieldView, RecordPropertyView), spliced
into the document flow via the `precedes`/`contains` choreography (RelationTypeDefinition retires its
hand-authored block in `04-7-vocabulary-term-substrate.json`, closing #254 in full and emptying
`check-idl-schema-conformance.mjs`'s MAPPING table and its one remaining allowlist entry — red-then-
green demonstrated). Ledger rows below updated accordingly.

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
| `package-bundle.json` | — (nested `$defs.Reference.definitionType` enum *is* generated, see below) | — | `gen-package-bundle-definition-type.mjs --check` (nested enum only) | **Out of #272's Type-modeling scope, same reasoning as `package-manifest.json`.** File itself untouched by this PR (srs#534) — #390 stays open, no mechanism executes it here. **Owner disposition (#390, 2026-09-04): scheduled into the dedicated roadmap phase**, quoted verbatim: *"protocols and blueprints are the wrappers that turn fields and records into applicable meaning; they cannot wait long, and their phase exists for exactly this."* The travel decision's ratified mandate rides this issue verbatim: **"what a container can hold, a bundle can carry."** Held close: this ledger row cites #390 + the mandate; the roadmap entry names the phase; execution is the phase's opening unit, not a someday. **Not part of the #256 closure gate.** | #390 (open, phase-scheduled) |
| `record.json` | `Record` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `Record` modelled in `com.semanticops.srs/metamodel`; `fieldValues` uses the `dependent` datatype (approximated, deliberately lossy — see metamodel-fidelity.md); `fieldMeta` (a map-of-`$ref`) is excluded (no map-of-ref primitive exists without touching the frozen `field.json`). Authorship does not flip — `record.json` stays hand-authored/loaded as committed. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | #248 (closed); #249 closed as obsolete (superseded by #248 — TypedRecord no longer exists post-#505) |
| `note.json` | `Note` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `Note`/`NoteSection` modelled; `SourceReference` shared with Record/Relation. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. `NoteSection` and `SourceReference` each get their own reference record too (srs#527) — `SourceReference` has three owners (Record/Note/Relation), so an appendix-under-one-owner would be arbitrary. | #250 (closed) |
| `relation.json` | `Relation` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** Standalone since RFC-038. `$schema` const-pin not modelled (excluded, generic across every entity — no per-entity string-const `fieldType` primitive exists yet). **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | #251 (closed) |
| `relations-collection.json` (deleted) | — | — | none (retired) | **Retired, deleted (srs#527).** Owner ruling, srs#272 comment [5496985508](https://github.com/the-greenman/srs/issues/272#issuecomment-5496985508): RFC-038 already moved relations to one-file-per-relation; this was a dead shape. Pending since #526/#523's own units; finally executed at srs#527 (the train's closing unit). Three RFC integration manifests naming it as a folded-in schema (RFC-017, RFC-023, RFC-040) retargeted to `relation.json` or had the now-redundant token dropped. | — (dead shape, cut) |
| `relation-type.json` | `RelationTypeDefinition` (new, re-keyed) | — | `rfc-541-closure-test.mjs` | **Generated (srs#541).** `relation-type-definition` modelled in `com.semanticops.srs/metamodel`, reusing the substrate `key`/`label`/`status`/`meta` Fields verbatim (`rfc-decision-6fc7e142`'s "Term/LifecycleState/RelationTypeDefinition share the substrate key convention"). Zero exclusions — every non-`$schema` property is covered. **Generated reference (srs#541, the #527/#274 pattern):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block (`04-7-vocabulary-term-substrate.json`) retires in its favour; the `check-idl-schema-conformance.mjs` MAPPING table's sole surviving row (and its one allowlist entry, `RelationTypeDefinition.aliases`) retire with it. | #254 (closed — both its rows, `term.json` and `relation-type.json`, are now generated) |
| `container.json` | `Container` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `containerType` excluded (already `deprecated: true` in the seed; no per-property deprecation mechanism modelled). **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | #252 (closed) |
| `manifest.json` | `Manifest` (new) | — | `rfc-541-closure-test.mjs` | **Generated (srs#541).** `manifest` modelled with its full value-object subtree (`Container` reused from srs#526; new `PackageRef`, `RenderedPresentation`, `UpstreamPackage`, `Slice`, `SliceSpec`, `SliceExternalRef`, `RepositoryAiGuidance`). Excluded: `changelogPath` (deprecated, no per-property deprecation mechanism modelled — same reason as `Container.containerType`); `meta` (an openly-shaped bag with one documented-but-optional legacy nested key, not a clean map like `RelationTypeDefinition.meta`). **Generated reference (srs#541):** a `com.semanticops.spec/generated-type-reference` record now covers this entity. | — |
| `view.json` | `View`/`FieldView`/`RecordPropertyView`/composite dispatch (new) | ext:views-l1 | `rfc-541-closure-test.mjs` | **Generated, modulo one parked property (srs#541).** `view` modelled (own top-level shape minus `fieldViews`); `field-view` and `record-property-view` each independently modelled and closure-proven directly against their own `$def` (both are plain flat objects on their own); `composite-renderer-binding` and a narrower `view-ai-guidance` value object (View.aiGuidance is `{purpose, extraction}` only, distinct from the generic `AiGuidance` Type) modelled too. **`View.fieldViews` stays excluded — named v2.1 exclusion (srs#543).** It is a JSON-Schema `oneOf` of two different $refs (`FieldView` \| `RecordPropertyView`); the metamodel's FieldType system has no discriminated-union datatype (every Type composes to one flat object). **Owner disposition (#543, 2026-09-04): v2.1 feature — held with clarity, not blocking.** Quoted verbatim: *"the spec itself models discriminated unions completely (the committed schemas express SectionSource/fieldViews as closed valid oneOf shapes; the engine implements them; conformance covers them). What's missing is SELF-DESCRIPTION only — the metamodel cannot yet generate those two properties of its own schemas... Nothing the system must model is unmodelable; the model is closed."* Disposition: named v2.1 exclusion row here (this one), citing #543; the sum-types metamodel design registered as an RFC candidate on #490's post-256 list. Return trigger: the v2.1 self-hosting pass, or sooner if a user-facing Type ever needs a union the Field type system cannot express. `View.lineage`/`View.provenance` excluded (bare `{type:object}` in this file, same reasoning as Blueprint's own in rfc-272). **Generated reference (srs#541):** `com.semanticops.spec/generated-type-reference` records now cover `View`, `FieldView`, and `RecordPropertyView`. | #247 (left open — the row shapes are closed; the dispatch mechanism is a named v2.1 exclusion, srs#543) |
| `composition.json` (renamed from `document-view.json`, srs#523) | `Composition` (renamed, new) | ext:views-l2 | `rfc-541-closure-test.mjs` | **Generated, modulo one parked property (srs#541).** `composition` modelled with its nested value objects (`DocumentSection` minus `source`, `RelationsPresentation`/`RelationPresentationEntry`, `NavigationLink`, `ThemeReference`/`ThemeVariant`, `CompositeRendererDirective`, a new `SectionOrdering`); the shared `ExportConfig` modelled once and attached at both `Composition.exportConfig` and `View.exportConfig`. Excluded: `containerType` (deprecated, no mechanism — reused from `container.json`'s own precedent); `aiGuidance`/`lineage`/`provenance` (bare `{type:object}` in this file, no real structure — same reasoning as Blueprint's own in rfc-272). **`DocumentSection.source` (`SectionSource`) stays excluded — named v2.1 exclusion (srs#543), same disposition as `View.fieldViews` above.** `SectionSource` is `oneOf` of two *anonymous* object branches with no flat `properties` bag outside the union, so it collapses to `{}` under `schema-closure.mjs`'s envelope-stripping and nothing the emitter produces for it can close. Owner disposition #543 (2026-09-04, quoted in full on the `view.json` row above): v2.1 feature, not blocking — "nothing the system must model is unmodelable; the model is closed." `DiscoveryQuery` (embedded in `SectionSource`'s discovery-query branch) is modelled independently (see the `discovery.json` row), not reached through this exclusion. **Generated reference (srs#541):** a `com.semanticops.spec/generated-type-reference` record now covers `Composition`. | — |
| `document-view-output.json` | (projection of `Record`/`Relation`/`RecordPropertyView`, not a package Type) | ext:views-l2 | srs-rust `render_service.rs` | **Canonical shape stands** — owner ruling on srs#365 (2026-09-01): `typeVersion` required on `ProjectedRecord`, `relationType`+`direction` required on `ProjectedRelationRow` are correct as written; the srs-rust reduced output is a conformance bug, fixed at srs-rust#817, not a schema change. `documentViewId` → `compositionId` renamed (srs#523, this PR, matching srs-rust#910's mirror); filename/`$id`/title deliberately **parked** (srs-rust#910's own park — three-way shape disagreement, tracked at #365, not resolved by this PR). RFC-041 Rev 4 already added `ProjectedPropertyRow` here — the further question of whether/how `RecordPropertyView` rows themselves project into this output is tracked separately per #365's own last comment; not decided by this ledger. | (tracks #365, srs-rust#817) |
| `blueprint.json` | `Blueprint` (new) | ext:blueprint | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `aiGuidance`/`lineage`/`provenance` excluded (bare "implementation-defined" bags, no real structure to model). `RelationSpec`/`ExactTypeRef` (reused from the frozen bootstrap) modelled. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. `RelationSpec` gets its own reference record too (srs#527). | — |
| `term.json` | `Term` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `key`/`label`/`status`/`meta` reused from the substrate-unification Fields RFC-040 already introduced for `lifecycle-state` (`rfc-decision-6fc7e142`'s "Term/LifecycleState/RelationTypeDefinition share the substrate key convention"). Closes #253 in full (both its rows — term.json and vocabulary.json — are generated). **#254 stays open**: its row is split across `term.json` (generated here) and `relation-type.json` (still parked, srs#541) — #254 needs both to close. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | #253 (closed, both rows done); #254 (left open, partial — commented) |
| `vocabulary.json` | `Vocabulary` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `Term` reused inline (list) from the `term` Type — modelled once, per #272's own acceptance criterion. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | #253 (closed) |
| `lifecycle.json` | `Lifecycle` (new, installable/`lifecycleRef`-targeted — distinct from the inline `type-lifecycle` facet already in the metamodel) | ext:lifecycle | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `states`/`transitions`/`initialState` reuse the RFC-040 `lifecycle-state`/`lifecycle-transition`/`initial_state` Fields verbatim — identical committed shape. Originally carried one documented divergence (`states`: this file's `minItems`/`RequiresRelation.relationType` shape had drifted from `type.json`'s already-normalized copy) — **resolved by srs#537**, which normalized `lifecycle.json` to match; zero registered divergences remain. **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | — |
| `protocol.json` | `Protocol`/`ProtocolStage`/`FieldRef` (new) | ext:protocol | `rfc-379-closure-test.mjs` | **Generated (srs#379).** The prior blocker — normative prose (`id`/`namespace`/`name`/`version`/...) vs. the implementation/corpus (`protocolId`/`protocolNamespace`/...) genuinely disagreeing — is RULED (rfc-decision, srs#379): unprefixed wins, matching every other package-declared definition entity's reuse of the shared identity Fields (the metamodel's own "reuse over duplication" convention could not otherwise model Protocol at all). `docs/schema/2.0/protocol.json` and the canonical prose now carry the ruled shape; `ProtocolStage.aiGuidance` is the closed, structured `AiGuidance` object only (the `string` alternative retired — structured over serialised). One documented divergence: `protocol.targetType`'s required empty-string LINEAGE sentinel (`oneOf`) isn't expressible by the metamodel's plain bare-UUID Field. **Corpus migrated**: the vendored `packages/com.mudemocracy.governance/*` copies (Node/AJV-validated only) move to the ruled shape in the same change (`scripts/migrate-379-protocol-shape.mjs`). **NOT migrated**: `docs/spec/examples/gallery-project-v2`'s vendored Protocol definition, structurally validated by the PINNED Rust binary's typed `Protocol` struct, which still requires the old prefixed shape — gated on a srs-rust follow-up (struct rename, a supporting release) landing first, per the standard revision-bump choreography. **Generated reference (srs#379, the #527/#274 pattern):** `com.semanticops.spec/generated-type-reference` records now cover `Protocol`, `ProtocolStage`, and `FieldRef`. | — |
| `source-document-meta.json` | `SourceDocumentMeta` (new) | — | `rfc-272-closure-test.mjs` | **Generated (srs#526, Task 4b/2).** `SourceExcerpt`/`SourceAnchor` value objects modelled; `imported_at` reused from the frozen bootstrap's `Provenance.importedAt` Field (same semantic meaning). **Generated reference (srs#527):** a `com.semanticops.spec/generated-type-reference` record now covers this entity; the hand-authored subsection property block retires in its favour. | — |
| `theme.json` | `Theme` (new) | ext:themes-l1 | `rfc-534-closure-test.mjs` | **Generated (srs#534; `Theme.assets` populated at srs#551 half 2).** `theme` modelled with its full nested value-object subtree (`AssetDeclaration`, `PageTemplates`, `ElementTemplates`, `SectionWrapperOverride`, `RecordWrapperOverride`, `StylesheetDeclaration`, `TypographyHints`); `Theme.targets`' `minItems:1` uses the existing generic list-cardinality mechanism (`projectField` already threads `minItems`/`maxItems` for any list — no fix needed there, contrary to the unit's own working assumption). Excluded: `lineage`/`provenance` (bare `{type:object}` in this file, no real structure — same reasoning as Blueprint/Composition/View elsewhere in this ledger); `ElementTemplates.compositeRendererConfig` (deliberately unmodelled, not just parked — see below). **`Theme.assets` (map-of-`$ref` to `AssetDeclaration`) was parked as a tooling-parity exclusion (srs-rust#932) until a compatible binary existed — now populated (field 274 in `gen-metamodel-package.mjs`), proven against the live corpus under srs-rust build.330 (srs#551).** `TableRendererConfig` (only ever nested inside the excluded `compositeRendererConfig`) needs no Type of its own either. **Generated reference (srs#534):** a `com.semanticops.spec/generated-type-reference` record now covers `Theme`. | #526 (theme.json row closed) |
| `discovery.json` | `DiscoveryQuery`/`TextSegment`/`ConformanceScenario`/`ExpectedSegments` (new) | ext:discovery | `rfc-534-closure-test.mjs` (via the new `emitDefsOnlyBundle` capability) | **Generated in full, including the standalone FILE itself (srs#534); `DiscoveryQuery.tier` populated at srs#551 half 2).** `TextSegment`, `ExpectedSegments`, and `ConformanceScenario` (three of the file's four `$defs` entries) are newly modelled, all with **zero exclusions**. The FILE's own standalone generation — previously parked because `discovery.json` has no top-level entity of its own, only a `$defs` bag — is now proven via `emitDefsOnlyBundle` (srs#534's second capability): it emits a `{$schema,$id,title,description,$defs}` bundle with no top-level object body, one `$defs` entry per named Type, keyed by PascalCase spelling matching the seed's own ad hoc convention. `rfc-534-closure-test.mjs` exercises the bundle directly (not merely defines it) and additionally asserts its per-entity output is self-consistent with `emitEntity`'s own per-type output. **`DiscoveryQuery.tier` was parked as a tooling-parity exclusion (srs-rust#932) until a compatible binary existed — now populated (field 273 in `gen-metamodel-package.mjs`), proven against the live corpus under srs-rust build.330 (srs#551).** `DiscoveryQuery` now has **zero exclusions**, same as its three sibling entities. **Generated reference:** three new records now cover `TextSegment`, `ExpectedSegments`, and `ConformanceScenario`; `DiscoveryQuery`'s existing record is unchanged in identity (its `fieldValues` still describe its structure, unaffected by the underlying metamodel Type gaining a field). | — |
| `srsj-envelope.json` (new file, authored this unit) | `SrsjEnvelope` (new) | — | `rfc-534-closure-test.mjs` | **Generated (srs#534).** Owed by both RFC-038 and RFC-039 (`rfcs/rfc-038-tree-authoritative-storage.md:944`); ownership assigned to this ledger by owner ruling srs#272 comment [5497040159](https://github.com/the-greenman/srs/issues/272#issuecomment-5497040159) — see the struck-through row in §2. Authored and modelled this unit rather than left owed. **Classified GENERATED, not a permanent exclusion** (unlike `field.json`/`type.json`, excluded for genuine bootstrap circularity — you cannot validate the Field schema without the Field schema existing first): this envelope has no such circularity. `data` is a plain open map (the pre-existing `map`/`valueRange:open` capability), `manifest` is an inline ref to the already-modelled `manifest` Type (srs#541), and `srsj` is a plain string — all three fully covered, **zero exclusions**. Verified against the real `.srsj` corpus artifacts — **4 genuine envelope instances**, not the 3 the original brief assumed: `docs/spec/examples/gallery.srsj` plus all THREE versioned `packages/com.mudemocracy.governance/{1.0.0,1.1.0,1.2.0}/seed/empty-governance-document.srsj` (the glob matches three package versions, not two) — as the red-then-green proof, now a permanent registered check (`check-srsj-envelope-conformance.mjs`, `scripts/lib/json-schema-lite.mjs`); `core-bundle.srsj` is correctly excluded from that check (RFC-038: it is a bare package-bundle with no `srsj`/`manifest`/`data` envelope at all). **Generated reference (srs#534):** a `com.semanticops.spec/generated-type-reference` record now covers `SrsjEnvelope`. | — |

## 2. Owed / absent rows

| Row | Status | Classification |
|---|---|---|
| ~~`{srsj, manifest, data}` envelope schema — **Absent.** Recorded as owed by both RFC-038 (`rfcs/rfc-038-tree-authoritative-storage.md:944`: "no schema in `docs/schema/2.0/` for the `{srsj, manifest, data}` envelope at all — RFC-039 recorded this same gap and deferred it") and RFC-039 before it. Ownership assigned to #522 (this ledger), per owner ruling srs#272 comment 5497040159. Authoring deferred to a downstream #272 unit.~~ **RESOLVED (srs#534, this PR):** authored as `docs/schema/2.0/srsj-envelope.json` and modelled as a `SrsjEnvelope` metamodel Type, closure-proven (`rfc-534-closure-test.mjs`) against the real `.srsj` corpus artifacts. Moved from this "owed/absent" section into the main table (§1) as a **generated** row — see there for the full classification and reasoning (why it differs from `field.json`/`type.json`'s bootstrap-circularity exclusion). This row is kept, struck through, so the ledger's own history of the gap remains visible. | **No longer owed — generated (srs#534).** See §1's `srsj-envelope.json` row. |
| `.revisions.json` sidecar schema | **Not owed. Delivered once, then retired.** #297/#378 authored `docs/schema/2.0/revisions.json` (merged 2026-08-13). It was then **removed** together with `ext:changelog`, by `rfc-decision-2a1e1590` ("state is mutable, semantics are not... Revisions and Changelog are removed"), executed in PR for #443 (commit `907dceb`, merged 2026-08-23). Dormancy rule applies — return trigger is a real consumer needing transition history (the muDemocracy Decision Log's governance-audit surface is named as the anticipated first claimant). | **Explicit exclusion — retired-dormant, not owed to #272.** No further action for this ledger. ~~**Anomaly flagged** (new finding, not in the map): the corpus today still contains **75 live `.revisions.json` sidecar files** (`srs/records/**/*.revisions.json`, `srs/package/records/*.revisions.json`) with no governing schema, some dated as late as 2026-08-28 — five days *after* the removal that the removal commit justified on "zero corpus files anywhere." srs-rust apparently still writes this sidecar on record transitions (per srs-rust#866, open, which records the same upstream removal as a heads-up). This is an **implementation discipline gap** (srs-rust writing an orphaned mechanism), not a spec/ledger gap — out of #522's scope to fix, surfaced here because the ledger's exhaustive walk found it.~~ **RESOLVED (srs#531, this PR):** srs-rust#866/PR#916 severed the write path and shipped a registered `revisions-sidecar-cleanup` migration; run once here via `srs repo apply-migration --id revisions-sidecar-cleanup --repo srs`. Deleted **72** stray sidecars under `srs/records/**` and `srs/package/records/` (the finding's "75" count included 3 files under the separate `docs/spec/examples/gallery-project-v2/` example repository, out of this corpus's own scope). `srs repo validate --repo srs` is `ok:true` afterward (pre-existing tag-vocabulary warnings only). Anomaly closed. |
| `federation-events.json`, `federation-registry.json` | Removed (PR for #442, commit `d66ac2f`, "remove federation machinery, keep dormancy stub"). | **Historical — already retired**, consistent with `ext:federation`'s "removed with a committed return" disposition (decision `4f1e12e5`; srs-rust#878 tracks the return-trigger separately). Not #272's to re-add. |
| `typed-record.json` | Removed (PR for #448, commit `c767738`, "remove Tier 1 (TypedRecord)"). | **Historical — already retired**, consistent with Tier-1 removal (decision `53635966`). Not #272's to re-add. |

## 3. The two enumeration-invisible instance trees

RFC-039 `[R13]` forbids glob-enumeration as a fallback mechanism, so both of these need an explicit
classification rather than "the enumerator will find it eventually."

- ~~**`srs/package/records/`** — 5 files: 4 Tier-2 Records (`com.semanticops.spec/rfc`,
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
  prominently in the PR body rather than actioned here.~~ **RESOLVED (srs#530, this PR):** owner
  disposition was relocate, not validate-in-place ("accommodate by repair, never tolerance: no new
  check legitimizing the wrong location"). The RFC-011 stub (`rfc-ffe44c91.json`) and its three
  rfc-change records moved (`git mv`, `instanceId`s unchanged) into `records/tier-2/`, matching where
  every other hex-UUID-named `rfc`/`rfc-change` record already lives (the `.revisions.json` sidecar
  was already deleted by srs#531). The three records missing `$schema` gained it, matching siblings
  exactly. `package/records/` no longer exists; `validate-package.mjs`'s doc comment no longer
  mentions it. The four records are now reached by `validate-records.mjs`, `srs repo validate`, and
  every other check that walks `records/` — the enumeration gap is closed by removing the second root
  entirely, not by teaching a check to reach it. Gap closed.
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
| **Generated (srs#526, Task 4b/2, 9 rows); generated reference added (srs#527, Task 4b/6)** | **9** | record, note, relation, container, blueprint, term, vocabulary, lifecycle, source-document-meta — plus 3 nested value objects (note-section, source-reference, relation-spec) also given their own generated reference |
| **Generated (srs#541, Task 4b/6 residual, 4 rows); generated reference added same unit** | **4** | relation-type (closes #254 in full), manifest, view (modulo `fieldViews`, named v2.1 exclusion srs#543), composition (modulo `DocumentSection.source`, named v2.1 exclusion srs#543) — plus `field-view`/`record-property-view` each independently modelled and given their own generated reference |
| **Generated (srs#379, 1 row); generated reference added same unit** | **1** | protocol (Protocol/ProtocolStage/FieldRef) — the shape divergence blocking this row is RULED; corpus migrated where Node/AJV-validated, the pinned-CLI-validated gallery copy tracked as a srs-rust follow-up |
| **Generated (srs#534, 2 rows: theme + discovery.json's 4 entities/file; srsj-envelope authored alongside); generated reference added same unit** | **2** | `theme.json` (`Theme` + 7 nested value objects; `Theme.assets` was a tooling-parity exclusion, srs-rust#932 — populated at srs#551 half 2, build.330), `discovery.json` (`TextSegment`/`ExpectedSegments`/`ConformanceScenario` newly modelled, plus the standalone FILE itself via the new `emitDefsOnlyBundle` capability; `DiscoveryQuery.tier` was the same tooling-parity exclusion as `Theme.assets` — likewise populated at srs#551 half 2) — plus `srsj-envelope.json` (new file, `SrsjEnvelope` — the previously-owed `{srsj,manifest,data}` envelope, not one of the original 17 generatable rows but closed out this unit alongside them, so not double-counted in this row's "2") |
| Generatable, still parked — a genuine shape-review dependency, not an emitter-capability gap or a blocking decision anymore | 1 | document-view-output (unit 3/#523, tracks #365) |
| Permanent explicit exclusion | 2 | field.json, type.json |
| Retired, deleted (srs#527) | 1 | relations-collection.json (no longer a live schema file — moved out of the 21-file count below) |
| Out of #272 scope (verified); one row phase-scheduled (§1, disposed srs#390) | 2 | package-manifest.json, package-bundle.json (#390 disposed 2026-09-04 — scheduled into its own roadmap phase, not part of the #256 closure gate) |
| Explicit exclusion, retired-dormant | 1 | `.revisions.json` sidecar schema |
| Historical, already retired (informational, not counted against the 21) | 3 | federation-events.json, federation-registry.json, typed-record.json |
| Enumeration-invisible instance trees, classified | 2 | `srs/package/records/` (real gap, flagged, **resolved by relocation — srs#530**), `tests/rfc-032/` (covered, no gap) |

**22 live schema files (21 + this unit's new `srsj-envelope.json`; 22 raw minus `relations-collection.json`'s srs#527 deletion), all classified. Zero unclassified schema files.
16 of 17 generatable rows are now generated** (9 at srs#526/#527; 4 at srs#541 — relation-type,
manifest, view, composition; 1 at srs#379 — protocol, its shape divergence ruled; 2 more at srs#534
— theme, discovery.json, plus the file-level bundle proof — each with its own generated reference,
srs#534 extending the srs#527/#274/#541/#379 pattern). **Only 1 row remains parked:**
`document-view-output.json`, which tracks its own three-way shape disagreement at #365 (unaffected
by this unit or by #379/#534) — no blocking prerequisite decision or emitter-capability gap remains
against any other row. All three of #534's own emitter-capability gaps (map-of-`$ref`, `$defs-only`
bundle emission, untyped integer enums) are closed and proven
(`tests/rfc-534-emitter-capabilities/run.mjs`, synthetic fixtures for the two binary-parity-gated
ones) — theme.json and the standalone discovery.json file, the two rows they gated, are both
generated. Two properties (`Theme.assets`, `DiscoveryQuery.tier`) stayed excluded from the LIVE
corpus for a distinct reason found during this unit — **tooling parity, not modelling**: the then-
pinned srs-rust binary (build.320)'s embedded `field.json` schema predated both new capabilities, so
populating either Field in the self-hosted metamodel package broke `srs repo validate --repo srs`
(same class of gap as srs-rust#868/#867); filed as srs-rust#932. **Update (srs#551 half 2,
2026-09-05):** srs-rust#932/#944 shipped that parity in build.330, the pin advanced, and both
Fields are now populated (`gen-metamodel-package.mjs` fields 273/274) — `theme.json` and
`discovery.json`'s `DiscoveryQuery` entity both close with zero exclusions. This never narrowed
either row's "generated" classification any more than `View.fieldViews`/`SectionSource`'s v2.1
exclusions narrow theirs. `#543` (discriminated-union / `oneOf` shapes: `Composition`'s `SectionSource` and `View`'s
`fieldViews`, found at srs#541) is disposed by the owner (2026-09-04): **named v2.1 exclusion
rows**, not blocking — see each entity's own row in §1 and the verbatim disposition quoted there.
`#390` (`package-bundle.json`) is disposed by the owner (2026-09-04): **phase-scheduled** into its
own dedicated roadmap phase, citing the ratified travel mandate verbatim ("what a container can
hold, a bundle can carry") — not part of the #256 closure gate, not counted against the 17
generatable rows. **Zero rows remain unclassified or unnamed**: every row in this ledger is now one
of generated / permanent-exclusion / named-v2.1-exclusion (`#543`) / phase-scheduled (`#390`) /
blocked-on-a-named-issue (`document-view-output.json`, tracks `#365`) / historical-retired /
enumeration-classified. srs#254 and srs#379 both close in full. One anomaly flagged for awareness
and since **resolved** (72 orphan `.revisions.json` sidecars deleted — srs#531, see §2's row above),
and one enumeration gap flagged for awareness and since **resolved** (`srs/package/records/`
relocated into `records/tier-2/` — srs#530, see §3's row above) — none of which blocked any unit's
own completion.
