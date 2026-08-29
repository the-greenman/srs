> **GitHub issue**: [the-greenman/srs#273](https://github.com/the-greenman/srs/issues/273)

# RFC-040: Metamodel v1.1.0 — the definition-layer train

**Status**: Implemented (Revision 4)
**Affects**: `com.semanticops.srs/metamodel` (package v1.0.0 → v1.1.0), `docs/schema/2.0/field.json`, `docs/schema/2.0/type.json`, `docs/schema/2.0/note.json` / `record.json` (SourceReference legacy-alias removal), `docs/schema/2.0/manifest.json` / `package-manifest.json` / `package-bundle.json` / `blueprint.json` / `document-view.json` / `protocol.json` (reference forms), `scripts/gen-metamodel-package.mjs`, `scripts/lib/schema-emitter.mjs`, `docs/schema/2.0/projection-rules.md`, `docs/schema/2.0/metamodel-fidelity.md`, closure tests (`rfc-033` / `rfc-035`), the RFC-031 residual allowlist, design-note 045. Builds on RFC-032 (Accepted), RFC-033 (Accepted), RFC-035 (Accepted), RFC-039 (Accepted), RFC-023 (Accepted), RFC-019 (Accepted), RFC-020 (Accepted), RFC-022 (Accepted).
**Author**: #273 planning session (scheduled, complicated-mode), assembling owner rulings of 2026-07-31 … 2026-08-23
**Date**: 2026-08-24

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-08-24 | Initial draft — the metamodel v1.1.0 train plan assembled from the closed #273 decision map. Zero open decisions; zero parks. |
| 2 | 2026-08-25 | Accepted by the owner. The one flagged reading (Change I — the C17 reconciliation discharged by the RFC-023 migration) confirmed on #480: "we want one way of doing things." No content changes. |
| 3 | 2026-08-26 | Implemented. All six train units landed on master (#486–#489, #491, #492), each folding its own integration tokens; the RFC-040 stub record's integration manifest completes here and the `grandfathered["040"]` allowlist entry retires per its self-expiry rule. |
| 4 | 2026-08-28 | Documentation-only (srs#498): the `## Charter alignment` section is backfilled to the Stage 1.5 machine-checkable format (`**Cell(s):**` / `**Decision mode:**` labeled lines the checker's check #6 parses), and the individual `CHARTER_ALIGNMENT_GRANDFATHERED["040"]` entry in `scripts/check-rfc-integration.mjs` is removed as a result — RFC-040 is now checked like any post-floor RFC. No normative content changes; the original prospective analysis is preserved in place. |

---

## Abstract

Metamodel v1.1.0 closes the `generated ⊂ seed` gap by modelling the **live post-#242 definition layer** in SRS records and making the emitter reproduce the frozen seed **byte-for-byte, annotations and `$defs` included** (modulo only the documented-divergence register, whose one live entry stays booked to #260) — with no remainder overlay. Extension facets enter as separate Types extending the core via `ext:type-inheritance`; the emitter consumes the resolved effective Type and learns the instance-facing vs definition-facing distinction (emitted instance schemas closed-except-`meta`; definitions closed). Every change in this RFC was ruled between 2026-07-31 and 2026-08-23 and is cited to its decision record; this document assembles the rulings into a sequenced, gated execution train and adds nothing to them. The seed remains the authoritative fixed point throughout: the #260 authorship flip is explicitly **not** part of this train (owner hold, 2026-08-23).

---

## Charter alignment

*Backfilled 2026-08-28 (srs#498): the Charter Check stage (`.claude/commands/rfc.md` Stage 1.5) did not exist in written form until 2026-08-26, two days after this RFC's `createdAt` (2026-08-24) — the labeled fields below postdate the RFC they describe and are written as an honest retrospective, not a contemporaneous record. The original hand-written prospective analysis (also dated 2026-08-24, before the stage's machine-checkable format was fixed) is preserved unedited beneath the required fields.*

**Cell(s):** cell:reference, cell:conformance, cell:identity
**Decision mode:** complicated

**Governing cell preference:** Reference — *declared strength over convenient reach* (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`): aligned — Change H's reference-taxonomy edits (PINNED/LINEAGE/KEYED/LOCATOR forms) are this preference executed, not merely cited. Conformance — *one way over many* (`rfc-decision-cce3c00e`): aligned — the byte-closure contract (Change G, [R7]) makes the emitter the one production contract instead of a hand-maintained parity approximation, and Change F/[R6] make conditional projection authoritative rather than duplicated by hand. Identity — *identifier over label* (`rfc-decision-cce3c00e`, `rfc-decision-53635966`): aligned — the generator's explicit-pinning fix (Unit 1 audit finding 1) is this preference directly: a claimed UUID number is never silently reassigned by array position.

**Axis preference:** 1–7 Semantic Integrity over Practical Expression (default pole — stored reference forms and closed definitions win over convenient inline shortcuts); 3–9 Shared Coherence over Local Autonomy (default pole — one vocabulary, one emitter contract, mirror choreography); 5–11 Reliability over Renewal (default pole — RFC-023's disjointness contract stands unmodified; Change I executes an already-accepted migration rather than reopening it; allowlist exceptions self-expire); 2–8 Evolution over Continuity (default pole, phase-bound — the breaking removals in Change D are Evolution-priced, each with corpus-attestation evidence the phase requires). **No non-default pole is newly taken.** The one Practical-Expression-leaning form in use (KEYED, version-independent dispatch, designed in Change K) is inherited verbatim from `rfc-decision-c8704763`'s own boundary clause (the axis 2-8 corollary: "a composition must not absorb a version bump") — not a new deviation minted here.

**Decisions consulted:** `cce3c00e` (grid + axis/cell preferences — the frame this check runs against), `9ee14517` (layer rules — see the layer test below), `2e0cd70a` (carry-meaning-you-do-not-recognise: DETECT/LOAD/WRITE, closed-except-`meta` — governs Change G directly), `0225099b` (defaults deferred, both sites removed now, #274's "Generate `defaultValue`" row superseded — governs Change D), `6fc7e142` (one escape bag, `meta` — cited as 2e0cd70a's sibling ruling; the `properties`→`meta` execution itself stays excluded from this train, see "Excluded from this train"), `c8704763` (the reference taxonomy: PINNED/LINEAGE/KEYED/LOCATOR + the axis 2-8 corollary — governs Change H and Change K's design), `5f8204bc` (retirement has one way per layer: definitions retire by deletion with version history, no deprecation state — governs Change D's consequence and [R4]), `628cf6c4` (a rename is a migration — governs every Change H rename's migration requirement), `4f1e12e5` (the attested removals / dormancy rule — the frame the excluded #448/#447 post-train breakers and the federation removal trace to). All nine ids named in srs#498 verified against the RFC text on this backfill pass; each is cited by at least one Change or Conformance Rule above, not name-dropped without effect.

**Contradictions found:** None. One supersession question is flagged explicitly rather than silently resolved: Change I notes that if the #273 audit's C17 finding intended a further *value* rename beyond the executed `relationType` → `sourceRole` migration, that is a question against Accepted RFC-023 for the owner — not decided in this RFC.

**One-way-per-goal:** Yes — the train's own reason for existing is a one-way-per-goal collapse. Decision 1 (#273, 2026-07-31) rejected two candidate parallel mechanisms for expressing extension-owned Type facets — facets-as-core-fields, and a hand-maintained "remainder overlay" carrying meaning the metamodel-as-records could not — in favor of the single existing mechanism, `ext:type-inheritance` (Change A, [R1]: "no hand-maintained remainder overlay may carry meaning the records cannot"). A second, partial instance is named honestly rather than glossed over: `semanticObjectType` (Change K) is the still-live E4 proving case itself — ruled collapsible (`rfc-decision-c8704763`, #383 2026-08-15) but **not** collapsed by this train. This RFC designs its KEYED replacement and marks the current mechanism "sanctioned-until-collapsed" rather than standing up a second dispatch mechanism silently; the actual retirement is routed to #272 by explicit owner placement (avoiding a partial-public-state window mid-migration), not left as an unacknowledged parallel path.

**Layer test:**
- Which layer owns this? MEANING-plane, definition layer (the metamodel records and the frozen `field.json`/`type.json` seed) for Changes A–E, H, and K's modelling half; MEANING-plane substrate for the `conditional-forbidden` enum entry (Change F). EXPRESSION-plane projection for the emitter (Change G) and the #274 reader projection (Change J), which consume the resolved definition layer through the typed generated-view slot rather than owning meaning themselves.
- Consume or clone downward? Consume. The emitter resolves the effective (inheritance-merged) Type and projects it; it never re-states the model, which is exactly why the "remainder overlay" alternative was rejected (Change A). The `definitionType` enum (Change H.4) is derived from `package-manifest.json`'s own kind list rather than a second hand-cloned list (finding A6).
- Does the layer below stand alone without this? Yes. The spec remains valid with the emitter and the reader projection absent — the metamodel records, seed schemas, and reference-taxonomy forms are complete and valid as pure MEANING-plane artifacts; deleting all EXPRESSION-plane changes (Change F's projection half, Change G, Change J) changes nothing about what the definitions mean.

**Charter growth:** none. The charter is consumed here, not extended.

---

*Original prospective analysis, 2026-08-24 (preserved verbatim; superseded in form, not substance, by the labeled fields above):*

> This section performs the Charter Check that #463 will later formalize; it is written to that unit's design.
>
> - **Cells** (slugs per the #462 vocabulary): **reference** (♎ — the taxonomy edits, the ref-datatype strength modes), **conformance** (♒ — one emitter contract, byte closure, one retirement/migration form per concern), **identity** (♉ — pinned UUIDs, the generator's numbering discipline, PINNED/LINEAGE identity semantics). Secondary touches: **versioning** (the v1.1.0 increment and `dataModelRevision` stamp), **description** (one name per concept: `sourceRole` migration, canonical-string demotion), **governance** (migration over drift — every ruling lands with its mechanism).
> - **`decision_mode: complicated`** — per `rfc-decision-7caca3a1`. Justification: the #273 decision-consequence map (2026-08-19) was the complex-mode instrument, and it **closed on 2026-08-21 with all four rows ruled** (`2e0cd70a`, `0225099b` ×2, `6fc7e142`). What remains is expert assembly under rules: cite, sequence, verify. Nothing here reopens a ruling; a genuinely undecided question would be parked on #273 — none was found.
> - **Governing preferences**: axis 1-7 Semantic Integrity over Practical Expression (default pole — the stored reference forms, the closed definitions); axis 3-9 Shared Coherence (default pole — one vocabulary, one emitter contract, mirror choreography); axis 5-11 Reliability over Renewal (default pole — RFC-023's disjointness contract stands; allowlist exceptions self-expire); axis 2-8 Evolution (phase default — the breaking removals and renames are Evolution-priced, each with corpus evidence). **Non-default poles: none taken.** The one Practical Expression concession retained (version-independent dispatch via KEYED) is inherited from `c8704763` with its boundary clause, not minted here.
> - **Past decisions consulted** (the locked context; signatures, never reopened): `cce3c00e` (grid + preferences), `9ee14517` (layer rules), `2e0cd70a` (carry meaning: DETECT/LOAD/WRITE, closed-except-`meta`), `0225099b` (defaults removed both sites; #274 "Generate" row superseded), `6fc7e142` (one bag: `meta` — post-train #433), `c8704763` (reference taxonomy), `5f8204bc` (retirement one way per layer), `628cf6c4` (rename is a migration), `4f1e12e5` (attested removals; sourceRole in-train; evidences/evidence rides this train), `53635966` / `43249f53` / `2a1e1590` (post-train breakers), `16b20c56` (attribution), `8948e43f` (travel mandate), `6523cf5e` (presentation hints outside the semantic model), `7caca3a1` (decision modes), `8f5aca2c` / `b9d7096e` (grid operations — context), the #273 owner decisions of 2026-07-31 (Decision 1, Decision 2, both guardrails), the #237 ruling of 2026-08-08 (three-layer table), the #234 ruling of 2026-08-08, the #274 ratified ledger of 2026-07-31, the #383 ruling of 2026-08-15 (semanticObjectType sanctioned-until-collapsed; #273 places the design/execution split), the #317 dispositions of 2026-08-18, the #260 hold of 2026-08-23. No proposal below contradicts any of them.
> - **Three-question layer test**: *Which layer owns each change?* — Every change is meaning-plane definition-layer (metamodel records, seed schemas, emitter) or its projection; the reader-projection unit is expression-plane and consumes the resolved model through the typed generated-view slot. The `FieldAssignment.description` slot is documentation annotation on a definition, not presentation (its `displayLabel` sibling's precedent); `displayHint` is removed from the semantic model precisely because presentation stays view-owned (`6523cf5e`). *Consume or clone?* — The emitter **consumes** the metamodel records and the inheritance resolution; it never re-states the model (the remainder overlay was rejected for exactly this, decision "Close definition-layer gaps in the model", 2026-07-31). The `definitionType` enum is **derived** from the package-manifest kinds rather than cloned (finding A6). *Does every layer stand alone below?* — The spec remains valid with no emitter, no views, no implementation: records first, projections second; deleting all expression changes nothing about meaning.
> - **Charter growth: none.** The charter is consumed here, not extended.

---

## Motivation

One problem, already diagnosed: `docs/schema/2.0/type.json` is a flattened union of core + extensions while metamodel v1.0.0 models only the core, so the emitter's output is a strict subset of the seed and the definition layer cannot yet regenerate itself. Every decision needed to close this was made and recorded — the #273 decision map closed 2026-08-21 with zero open rows. What has been missing is the assembled, sequenced plan whose every unit lands **with its enforcing mechanism** (the #308/#311/#383/#391/#396 lesson). This RFC is that plan.

---

## Opening move — the half-built-mechanism audit

Per the routed opening move on #273 (comment of 2026-08-18), the train-feeding rulings were swept for decisions whose enforcing mechanism does not yet exist. Result: **every decision below is paired with a named mechanism**, and the sweep found **two mechanism gaps not previously filed**, both absorbed into this train rather than left as prose:

1. **The generator's positional UUID pinning cannot survive removals.** `gen-metamodel-package.mjs` derives `4b`/`4c` UUIDs from array *position* (`fieldUuid(i + 1)`), so deleting `default_value`, `deprecated_at`, or `assignment_default_value` from `FIELD_SPECS` would silently renumber every later field — reassigning claimed UUIDs, the exact defect class the `4a000001` collision (#295) taught. **Mechanism (Unit 1):** the generator moves to *explicitly pinned* per-entry numbers; a claimed number is never reused (the `4a` rule, now applied to `4b`/`4c`); `--check` continues to assert no drift and no strays.
2. **"Empty diff" has no standing gate.** The acceptance criterion is byte-level regeneration, but nothing in `validate-all.mjs` asserts it — the closure test deliberately normalizes away annotations, `$defs` spelling, and conditional envelopes. **Mechanism (Unit 3):** a regenerate-and-diff assertion joins `validate-all.mjs` once the emitter reaches byte closure, and the closure test's normalization steps are removed on the schedule in "The byte-closure contract" below, so the tightening itself is machine-enforced and cannot silently regress.

The per-decision decision → mechanism pairing is stated inline in each Change and summarized in each train unit's issue.

---

## Proposed Changes

### Change A — Extension facets as separate Types via `ext:type-inheritance`

*(Decision 1, #273 2026-07-31; options (b) facets-as-core-fields and (c) remainder overlay rejected with recorded rationale; no-overlay ruling recorded in the decision log 2026-07-31.)*

Metamodel v1.1.0 models all nine live `type.json` properties beyond the v1.0.0 core (exactly today's closure-test exclusion set). The **extension-owned** facets enter as **separate metamodel Types extending the core `type` Type** through `ext:type-inheritance`; the two properties that are core spec surface — not owned by any extension — join the core `type` model directly, which does not flatten extension layering (Decision 1's bar is against asserting *extension* facets at core-only adopters):

| Property | Contributed by | Modelling route |
|---|---|---|
| `lifecycle`, `lifecycleRef` | `ext:lifecycle` | inherited facet Type |
| `extendsTypeId`, `extendsTypeVersion`, `fieldOrder`, `fieldAssignmentOverrides` | `ext:type-inheritance` | inherited facet Type |
| `validationRules` | `ext:cross-field-validation` (RFC-019) | inherited facet Type |
| `identityFieldId` | RFC-020 (core RFC, interacts with inheritance but is not extension-owned) | core `type` surface |
| `tags` | core surface | core `type` surface |

The emitter consumes the **resolved effective Type** (ancestor chain + effective fields — the resolution `srs-repository` already implements end to end). The inheritance semantics themselves are ratified invariants (I-39..43 + I-97: single inheritance, acyclic, no inherited-fieldId redeclaration, `fieldOrder` single-level exact permutation, overrides only-inherited with `required` tighten-only, `identityFieldId` the one cascading facet, `validationRules` never inherited) — this train *models* them; any modelling-time contradiction is a finding, not a choice.

**Consequence:** consuming the metamodel *as records* now requires implementing inheritance merging — the third-party floor rises, consciously. That acceptance is written into design-note 045 (Change L), per the 2026-07-31 obligation that it be *"a conscious acceptance written into the design note, not an accident discovered later by an implementer."*

**Mechanism:** `gen-metamodel-package.mjs --check`; the RFC-035 closure test run over the *effective merged* Type; the emitter's effective-resolution tests.

### Change B — The seven nested value-object Types

The seed's `type.json` `$defs` carry seven value objects the metamodel does not yet model: `TypeLifecycle`, `LifecycleState`, `RequiresRelation`, `LifecycleTransition`, `FieldAssignmentOverride`, `CrossFieldRule`, `CrossFieldRuleEffect`. Each becomes a metamodel Type (inline-`ref` range of its owning facet), exactly as `FieldType`/`ExactTypeRef`/`AiGuidance` already are.

`field.json`'s one remaining seed-only property, `editorHint`, is also modelled: RFC-032 Rev 3 declared it *"presentation, out of the type model"* and chose to *"retain `editorHint` (presentation; #262)"* on the Field envelope — deliberately outside `fieldType`, so `6523cf5e` is not contradicted — and the corpus uses it widely (the spec-authoring-core fields carry it). The live surface must be expressible (the no-overlay ruling); its modelled description carries the seed's own declaration verbatim (*"Presentation only (not part of the type model — RFC-032)"*).

**Mechanism:** the closure test's printed exclusion sets shrink to empty for **both** entities; a regression re-grows them visibly (the printed-list discipline already in place).

### Change C — `FieldAssignment.description`, documentation-only; `required` present-and-required

*(Decision 2, #273 2026-07-31, width narrowed to `description` only by the 2026-07-31 revision; #247/#274 disposition for `required`.)*

`FieldAssignment` gains a per-context `description` (sibling of `displayLabel`), projected to the JSON Schema `description` annotation. The guardrail is normative, verbatim from the ruling:

> On conflict, the Field's own semantics and `aiGuidance` win, and a contextual description that contradicts them is a data error, not an override.

`FieldAssignment.required` is already schema-required; the prose moves to match the schema (the #274 ledger's "make `required` present"). **Mechanism:** the emitter projects `description` to annotation position *only* — it can never reach a constraint keyword (asserted by test); the data-error rule lands in DN-045 and the canonical FieldAssignment prose.

### Change D — Removals: `defaultValue` (both sites), `deprecatedAt`, assignment-level `displayHint`

*(`0225099b` — defaults arrive later, as one mechanism, both sites removed now, #274's "Generate `defaultValue`" ledger row explicitly superseded; #234 ruling 2026-08-08 — `Field.defaultValue` + `Field.deprecatedAt` removed; #247 disposition — assignment-level `displayHint` removed; `6523cf5e` — the `FieldAssignmentOverride` and `FieldView` `displayHint` copies are presentation-layer and STAY.)*

- `Field.defaultValue` and `Field.deprecatedAt` leave `field.json` and the metamodel (`default_value`, `deprecated_at`).
- `FieldAssignment.defaultValue` leaves `type.json` and the metamodel (`assignment_default_value`), with it the emitter's `NAME_OVERRIDES` entry — the override table empties.
- The one live (decorative) authored value, `srs/package/fields/status.json`'s `defaultValue`, is deleted. The version-semantics table is untouched (nothing survives to list).
- Assignment-level `displayHint` is removed from prose/allowlist surface. The presentation-layer `displayHint` copies on `FieldAssignmentOverride` and `FieldView` are **not** touched — ruled presentation, not a new decision.
- Deprecation and defaults return later as versioned metamodel capabilities via their own RFCs (roadmap homes exist; defaults: the #431 capability entry).

**Consequence:** a record's meaning is literally its values; no default mechanism exists anywhere; definitions retire by deletion with version history (`5f8204bc`), so no deprecation state is needed at this layer. **Mechanism:** reject-unknown definitions make reintroduction schema-fatal; the seed regenerates without the properties; the corpus scan in the Unit 1 migration proves zero surviving uses.

### Change E — `Type.lineage` / `Type.provenance` are added

*(#274 ratified ledger — the recorded prose-wins exception to RFC-031's prose-is-stale default.)*

`type.json` gains `lineage` and `provenance` (the same value objects `field.json` already carries; the metamodel already defines both Types). Their two RFC-031 allowlist entries retire. **Mechanism:** closure coverage; allowlist entries removed in the same PR (self-expiring-exception rule).

### Change F — `conditional-forbidden` and the conditional projection

*(#273 2026-07-31: "no decision needed" — it completes the metamodel over its own definition.)*

`CrossFieldRuleKind` gains `conditional-forbidden`; both byte-parity emitters project CrossFieldRule conditionals (`if`/`then`) **and** the entity-level co-occurrence envelopes (FieldType R2/R3/R9/R10) that the seed today hand-authors — moving those rows of the fidelity dashboard from *approximated* to *authoritative* for the JSON Schema column. **Mechanism:** the closure test's `ENVELOPE` strip is deleted once this lands (see the byte-closure contract); Rust-twin parity (`rfc_035_parity.rs`) holds the projection in both implementations.

### Change G — The emitter learns facing: instance schemas closed-except-`meta`, definitions closed

*(`2e0cd70a` — the Row-1 ruling; RFC-035 [R9]'s policy gate is satisfied by it. This is the emitter's biggest change.)*

The emitter distinguishes what it is emitting for:

- **Definition-facing** schemas (`field.json`, `type.json`, the metamodel entities): `additionalProperties: false`, fully closed. Definitions are the trust boundary; extension is inheritance-only (#237 ruling, 2026-08-08).
- **Instance-facing** schemas (domain Type projections that validate Records): **closed except `meta`** — the emitted schema is the production contract; carried out-of-contract keys are schema-invalid-but-preserved, the validation complaint being the ruled louder diagnostic. Readers DETECT always (graded: `meta` quiet, elsewhere louder), LOAD always, WRITE = preserve or refuse loudly; silent discard is the one forbidden behaviour.

`$schema` / `title` are emitted uniformly, and annotations (`Field.description`, `FieldAssignment.description` → `description`, `displayLabel` → `title`) project on both facings.

**Boundary with #272:** this train lands the facing *mechanism and contract* — proven on definition entities and domain-Type golden fixtures — not the production instance-layer artifact set. Generating the instance-layer schemas themselves (the 24-schema ledger's scope) remains #272's; Unit 3's deliverable is that when #272 emits them, the closed-except-`meta` posture is already the emitter's behaviour, tested. **Mechanism:** per-facing golden tests assert the `additionalProperties` posture; srs-rust#847 (record update preserve mode) graduates from enhancement to conformance support — the srs-rust follow-up is filed at this unit's landing; the spec documents the dual status (loadable-and-carried yet schema-invalid) so the complaint reads as graded diagnosis, not contradiction.

### Change H — Reference-taxonomy definition-layer edits

*(`c8704763` — all folded-in renames; each executes under `628cf6c4`, a rename is a migration.)*

The definition-layer edits the taxonomy routed into this train:

1. **Shared `ExactTypeRef` `$def`** — one definition, referenced everywhere the PINNED object form appears (the `$ref` collapse). Its current hosts are `blueprint.json`, `document-view.json`, `field.json`, and `protocol.json` — all four are edited; `type.json` carries no `ExactTypeRef` today.
2. **`dependencyRefs` → `packageDependencies`** on the package manifest (KEYED + semver — the one sanctioned constraint form, package layer only).
3. **`lifecycleRef` and Protocol `TypeRef` → LINEAGE** — bare UUID; Protocol `TypeRef.typeVersion` is dropped (version-optional hybrids are forbidden).
4. **`definitionType` enum derived from the package-manifest's ten definition kinds** — the enum lives in `package-bundle.json` (today nine hand-listed values) and becomes derived from `package-manifest.json`'s ten definition collections: one source, so the lists cannot diverge again (finding A6; also serves the travel mandate's ten-kinds derivation, `8948e43f`).
5. **Locator mode unification** — `manifest.json`'s `$defs.PackageRef` mode `external` → `remote`, converging on the one mode-discriminated shape `document-view.json`'s `ThemeReference` already uses.
6. **`vocabularyRef` → LINEAGE** — the stored form becomes a bare UUID (`format: uuid`), replacing the `namespace/name@version` pattern string; the effective package set resolves. The metamodel's `vocabulary_ref` Field moves with it.
7. **Canonical-string demotion** — `namespace/name@version` becomes the DISPLAY serialization of a pinned reference (CLI output, docs, diagnostics), never a stored form.

Each rename ships as: the ruled decision naming old and new (done — `c8704763`), a deterministic migration where stored forms carry the name, and the one-name end state. **Mechanism:** schema patterns enforce the new forms (`format: uuid` for LINEAGE; the mode enum for LOCATOR); migrations are scripted and re-runnable; the derived enum is generated, not authored.

### Change I — The RFC-023 sourceRef migration executes; the evidences/evidence split is thereby reconciled

*(`4f1e12e5` item 8 — migrate in-train, else un-deprecate `relationType`: one name either way; `5f8204bc` scope — the C17 vocabulary split rides this train; RFC-023, Accepted Rev 5, supplies the whole design.)*

The spec corpus still carries the **legacy** `SourceReference.relationType` field on all its sourceRefs (231 measured at the ruling; 219 currently in `srs/records/` — the count is re-measured at execution). RFC-023's already-accepted migration finally executes: field rename `relationType` → `sourceRole` with RFC-023's Change A/B value mapping (`derived-from` → `extracted-from`; other values map identically), then the legacy-alias acceptance (`SOURCEREF_LEGACY_RELATIONTYPE` window) is removed from the schemas — the scheduled follow-up schema revision RFC-023 named.

**On the evidence/evidences spelling:** RFC-023 ruled the two vocabularies **permanently disjoint** under literal key equality (invariant I-88) — `evidence` is a sourceRole, `evidences` is a Relation type, and they are different mechanisms with flipped directions. The confusion the audit's C17 finding named lived in the **shared field name** (`relationType` on both), which this migration removes: after it, no sourceRef field shares a name with the Relation vocabulary, and the one-letter pair sits in visibly different shapes. This RFC reads the ruled reconciliation as **discharged by executing the migration**, which respects RFC-023's standing disjointness contract (axis 5-11: standing contracts hold). If the audit's C17 intended a further *value* rename beyond this, that is a supersession question against Accepted RFC-023 and is flagged for the owner on the unit — not decided here.

**Mechanism:** schema-level rejection of the legacy field after the window closes; the deterministic mapping is committed with the migration; `repo validate` stays at 0 errors across the cut.

### Change J — The #274 definition-layer reader projection; RFC-031 OQ1 closes

*(#274 ratified ledger — property table primary, optional generated pseudo-IDL, raw-schema link, all from the resolved effective Type, rendered through a typed generated-view slot — never a magic heading or regex rediscovery.)*

The generated property table renders from the resolved effective Type with columns per #274: property, type/cardinality, required, constraints/domain, **extension owner**, contextual description. Human narrative stays in published subsection records around the slot. The RFC-031 allowlist becomes the shrinking migration ledger #274 designed: every entry this train resolves retires in the landing PR that resolves it; each survivor carries its exact expected mismatch and issue (self-expiring, per `5f8204bc`'s exception rule — the stale entries for already-deleted properties retire immediately).

**RFC-031 Open Question 1 is formally closed:** extension ownership of a Type property is expressed as the generated property table's extension-owner column (#274's disposition); the pseudo-IDL remains optional compact output and gains no ownership syntax. One line, recorded here so the question stops being open anywhere.

**Mechanism:** generated-then-diffed reference prose joins the release-drift discipline (regenerates empty with the pinned CLI); the fail-closed residual RFC-031 role continues only for genuinely ungenerated targets.

### Change K — `semanticObjectType`: modelled as sanctioned-until-collapsed; the Type-keyed `type-query` designed here; execution stays at #272

*(#383 owner ruling 2026-08-15: the collapse executes in-spine; the schema's current contract is sanctioned-until-collapsed; this planning session places the split. The 2026-08-20 addendum: the #272 execution must also amend the relocated RFC-011 invariants I-142/143/144.)*

**Placement decision:**

- **v1.1.0 models `semanticObjectType` as it lives** (on the core `type` — it is live surface on `type.json`, `view.json`, `relation-type.json`, `document-view.json`, and both published governance package versions), explicitly marked *sanctioned-until-collapsed* in its modelled description. Removing it from the definition layer **before** #272 migrates the SectionSource consumers and republishes governance would strand the published packages schema-invalid mid-window — the partial public state the epic forbids.
- **The Type-keyed `type-query` variant is DESIGNED in this train** (it is a reference-taxonomy application, and this train owns that vocabulary): selection by **KEYED `namespace/name`** resolving against the effective package set — the taxonomy's dispatch form (`c8704763`: *"presentation and dispatch follow LINEAGE or KEYED"*; `typeFilter`/`typeDispatch` precedent), not PINNED — a composition should not absorb a version bump (the axis 2-8 corollary). The designed contract lands as records/prose in Unit 5's scope, execution-ready.
- **Execution — SectionSource schema change, `semanticObjectType` retirement from all four schema sites, governance 1.2.0 republish with migrated views, Rust dispatch removal, re-vendor, and the I-142/143/144 invariant amendments — stays at #272**, its ruled natural site.

Issue #383 is updated with this placement (it asked for exactly that). The interim invariant stands meanwhile: the vendored governance seed must not silently diverge from the published package.

### Change L — Design-note 045: the inheritance floor and the documentation-only rule

*(The #290 obligation; the Tier-0 capture already exists: `records/notes/design-capture-metamodel-v1-1-0.json`, instance `717118a7`.)*

The Tier-0 note graduates to `com.semanticops.spec/design-note` **045**, carrying: the third-party inheritance-floor acceptance (verbatim from the 2026-07-31 ruling), the documentation-only guardrail (verbatim, Change C), and the #237 three-layer policy table with its stated asymmetry reason (*"definitions are the trust boundary"*). Its forward-looking framing follows the owner-shared decision-coherence research (2026-08-23): cell linkage is described as a **retrieval signal** for which prior decisions a new decision must reckon with — one signal among several, never an ontology of truth; the minimal relation set around decisions stays the researched four-plus-two (`consistent_with`, `distinguishes`, `conflicts_with`, `supersedes`; `supports`, `challenges`; `generalises` inferred, never asserted); no decision ontology beyond it is sketched; retrieval sketches favour precision over completeness; and the owner-ruling bottleneck is named explicitly as today's accidental significance gate. **Mechanism:** graduation via the CLI (`note graduate` lineage edge where available); the note is published (reachable), not shadow.

---

## The byte-closure contract — what tightens, when

Today's Tier-2 closure test compares `emitter ⊆ seed` under normalization that strips **annotations** (`description`, `$comment`, `deprecated`, `title`, `$id`, `$schema`, `x-srs-range-type`), **every conditional envelope** (`allOf`/`if`/`then`/`else`/`oneOf`/`anyOf`/`not`), resolves `$ref`s away, treats `required` as set-subset, and excludes the deferred facets. That normalization is the acceptance criterion's falsification zone — an "empty diff" claim proved under it would be hollow. The train removes it stepwise, each step machine-enforced at its unit's landing:

| After unit | Tightening |
|---|---|
| Unit 1 (modelling) | The printed exclusion set shrinks to **empty** for both entities (facets + value objects covered); `required` set-subset becomes set-**equality**. |
| Unit 2 (reference edits) | The seed's reference forms are final; the shared `ExactTypeRef` `$def` aligns emitter and seed `$defs` structure. |
| Unit 3 (emitter) | Annotation stripping ends for `description`/`title` (both project); the `ENVELOPE` strip is **deleted** (conditionals project); `$ref` resolution in the comparison ends — the emitter's committed `$defs` layout must equal the seed's; a **regenerate-and-diff** assertion joins `validate-all.mjs`: full regenerate of `docs/schema/2.0/{field,type}.json` produces an empty `git diff`. |

**End state:** `emitter output == frozen seed`, byte-for-byte, annotations and `$defs` included — which supersedes projection-rules.md's "literal byte-equality against the seed is unachievable" note (true of v1.0.0's coverage, false by design of v1.1.0; the seed is hand-edited into the emitter's canonical form where the two differ today, under the seed's normal authoring discipline — **authorship does not flip**; the seed remains the authoritative fixed point per the #260 hold). The documented-divergence register remains the only sanctioned exception list, each entry self-expiring; its one current entry (`type.aiGuidance` regularization) is **booked to #260** and stays there unless the owner pulls it — if it survives to Unit 3, byte closure is defined modulo exactly that registered entry, asserted-and-documented, never silently passed.

The Unit 1 issue also carries the standing lesson: **re-run the gap analysis at byte level against a full regenerate before sizing the modelling work** — the property-key diff hid five annotations once; assume normalization hides more.

---

## Generator discipline

`srs/package/metamodel/**` is generated — never hand-edited; all changes go through `scripts/gen-metamodel-package.mjs` (with `--check` in CI). UUID pinning becomes **explicit per entry** (audit item 1): every field/type spec names its pinned number; numbers are append-only and never recycled — a removed entry's number is retired with a comment naming what claimed it (the `4a000001` lesson). The package version moves `1.0.0` → `1.1.0`.

---

## `dataModelRevision` treatment

**The train is data-model generation 3.** Justification: `dataModelRevision` stamps which data-model generation the *data* satisfies, and RFC-032 — a definition-layer shape change — is the precedent for a definition-layer migration moving the stamp (migration #1 → revision 1; the #242/#297 carrier+storage train is revision 2). This train changes what a conforming reader accepts at the definition layer (removed `defaultValue`/`deprecatedAt` under reject-unknown; added `FieldAssignment.description`, `Type.lineage`/`provenance`; the reference-form migrations of Change H) and migrates instance-envelope data (Change I). Therefore: **revision 2 → 3**, stamped once, in Unit 1 (the first breaking definition-layer landing), with the migration-registry entry; Units 2/4's migrations are within generation 3. The post-train breakers (#448 et al.) stamp their own subsequent generations per their records.

---

## Mirror-sync and Rust-twin choreography (per schema-touching unit)

Every unit that touches `docs/schema/2.0/**` names this choreography in its issue and PR:

1. `srs` lands with `validate-all` + `check-release-drift` green under the pinned CLI (`export $(node scripts/fetch-pinned-srs.mjs)` — never `which srs`; exit codes checked, not output tails).
2. The srs-rust mirror resync + engine-struct follow-up issue is **filed at that unit's landing** (not before), citing the exact schema delta — reject-unknown means schema and struct move together; the mirrors refresh through their own pipelines from the release artifact.
3. Emitter-affecting units name the Rust twin (`srs-projection/json_schema.rs` + `rfc_035_parity.rs`) in the follow-up; parity is a closure criterion, and `SRS_RUST_CLI_TAG` advances only by the release-drift workflow's own procedure (bump + re-render in one PR).
4. `srs-vscode` exposure is noted in each follow-up (outside this train's repo scope; the mirror is refreshed by its own sync pipeline).

The stale prose the decision map's Part 5 flagged — projection-rules.md / RFC-035's "Rust emitter deferred to #260" (the twin shipped) — is corrected in Unit 3, which touches both documents anyway.

---

## The train — units, sequence, gates

Fires on owner acceptance of this RFC (Draft → Accepted is the owner's act; the train does not start on Draft). Every unit: one issue, one PR, `epic-256:owner-merge`, citing its governing records; srs-rust follow-ups filed at landing per unit.

| # | Unit | Content | Class | Gate |
|---|---|---|---|---|
| 4a-1 ([#477](https://github.com/the-greenman/srs/issues/477)) | **Modelling** | Changes A, B, C, D, E, K(model)+F(model): generator rework (explicit pinning), facet Types, seven value objects, `description` slot, removals, `lineage`/`provenance`, `conditional-forbidden` in the model, seed core edits, `status.json` value deletion, byte-level gap re-analysis first, `dataModelRevision: 3` + migration-registry entry, package v1.1.0 | session-unit | RFC-040 Accepted |
| 4a-2 ([#478](https://github.com/the-greenman/srs/issues/478)) | **Reference edits** | Change H: the seven taxonomy edits + their data migrations | session-unit | 4a-1 landed |
| 4a-3 ([#479](https://github.com/the-greenman/srs/issues/479)) | **Emitter** | Changes F(projection), G: effective-Type resolution, facing distinction, conditional + annotation projection, closure-test tightening to byte level, regenerate-and-diff gate into `validate-all`, stale-prose corrections | session-unit | 4a-2 landed |
| 4a-4 ([#480](https://github.com/the-greenman/srs/issues/480)) | **SourceRef migration** | Change I: RFC-023 field/value migration + legacy-alias schema removal | **pool** (+queued; gated in-body) | RFC-040 Accepted **and 4a-1 landed** (the generation-3 stamp precedes this migration; content-independent of 4a-2/4a-3) |
| 4a-5 ([#481](https://github.com/the-greenman/srs/issues/481)) | **Reader projection** | Change J: property table + pseudo-IDL + raw-schema link through the typed slot; type-query design record (Change K); allowlist ledger reconciliation; OQ1 closure | session-unit | 4a-3 landed |
| 4a-6 ([#482](https://github.com/the-greenman/srs/issues/482)) | **DN-045** | Change L: graduate the Tier-0 capture | session-unit (small) | RFC-040 Accepted (parallel) |

Sequenced by native `blocked by` edges. 4a-4 is the only pool unit — it is genuinely decided-design mechanical (RFC-023 supplies the whole contract) and single-repo; it waits for 4a-1 only so its migrated corpus lands inside stamped generation 3, never in an unstamped in-between state; everything else is design-heavy or multi-consequence, so session-unit per the conservative default.

**Routed-out siblings (not train units):** the #317-F2 `expectedSegments` expectation kind goes **standalone** ([#483](https://github.com/the-greenman/srs/issues/483) — this train never touches the discovery runner, so riding would widen it; the 2026-08-18 disposition allows either); #383's execution and everything instance-layer stays at #272.

---

## Verification strategy

Per unit: `node scripts/validate-all.mjs` (exit code, includes `gen --check`, both closure tests, RFC integration + process checks) and `check-release-drift` green under the pinned CLI; `srs repo validate --repo srs` at 0 errors; `tests/rfc-035/run.mjs` Tier-1 byte-reproducibility; red-then-green shown for each new guard (the regenerate-and-diff gate, the schema-level legacy-alias rejection); Rust-twin parity asserted in the srs-rust follow-up before the pin advances. Known pre-existing red: #465 (validate-records sub-package resolution + swallowed errors) is in review and is not this train's to fix — its state is noted, not absorbed.

---

## Excluded from this train — each with its reason

| Exclusion | Reason |
|---|---|
| **#260 authorship flip** | Owner hold, 2026-08-23: ready and deliberately unpulled while prototypes and Decision Logger pilots run. The frozen seed stays the authoritative fixed point; this train converges seed and emitter byte-for-byte but never flips who owns the bytes. The `type.aiGuidance` divergence-register entry stays booked to #260. |
| **#448 Tier-1 removal** | Post-train breaker by its own record (`53635966`); already filed and sequenced post-train with its own `dataModelRevision` bump. |
| **#447 `rfc_status` → Lifecycle** | Post-train breaker (`43249f53`); already filed. |
| **#433 `properties` → `meta`** | Its ruling (`6fc7e142`) explicitly rejects folding into this train: substrate-layer, its own bounded breaking unit. |
| **Revisions/Changelog removals** | `2a1e1590` — ride the removal batch after the train. |
| **#272 instance-layer scope** | Only the type-query *design*, the sanctioned-until-collapsed modelling of `semanticObjectType` (Change K), and the instance-facing emission *mechanism* (Change G — contract and tests, not the artifact set) are allocated here; SectionSource, governance republish, `semanticObjectType` retirement, production instance-schema generation, and the 24-schema ledger are #272's. |
| **Charter meta-work** | The charter is done — it guides this plan (see Charter alignment) and does not grow here; #461/#462/#463/#471 own their own units. |

---

## Conformance Rules

> **[R1]** Metamodel v1.1.0 MUST express the complete live post-#242 definition-layer surface of `field.json` and `type.json`; no hand-maintained remainder overlay may carry meaning the records cannot (decision of 2026-07-31).
>
> **[R2]** Extension-contributed Type facets MUST be modelled as separate Types extending the core via `ext:type-inheritance`; a conforming consumer of the metamodel-as-records MUST implement inheritance resolution (the consciously accepted floor, DN-045).
>
> **[R3]** `FieldAssignment.description` is documentation-only: on conflict the Field's own semantics and `aiGuidance` win, and a contradicting contextual description is a data error, not an override. An emitter MUST project it only to annotation position, never to a constraint.
>
> **[R4]** No `defaultValue` mechanism exists at any definition-layer site; no `deprecatedAt` exists on definitions. A definition retires by deletion with version history (`5f8204bc`).
>
> **[R5]** An emitter MUST distinguish facing: definition-facing schemas are fully closed (`additionalProperties: false`); instance-facing schemas are closed except `meta`. Emitted instance schemas are the production contract; carried out-of-contract keys are schema-invalid-but-preserved (`2e0cd70a`).
>
> **[R6]** Both byte-parity emitters MUST project CrossFieldRule conditionals (including `conditional-forbidden`) and the FieldType entity-level co-occurrence envelopes; these features become authoritative, not approximated, for the JSON Schema column.
>
> **[R7]** After Unit 3, a full regenerate of `docs/schema/2.0/{field,type}.json` MUST produce an empty diff — byte-for-byte including annotations and `$defs` — modulo only the documented-divergence register, whose entries are asserted-and-documented and self-expiring.
>
> **[R8]** Stored reference forms follow the taxonomy (`c8704763`): PINNED pairs, LINEAGE bare UUIDs, KEYED scoped keys, one LOCATOR shape; `namespace/name@version` is display-only and MUST NOT be stored.
>
> **[R9]** `SourceReference` carries `sourceRole` only; the legacy `relationType` alias is removed and MUST be rejected by schema after the Unit 4 migration (RFC-023's scheduled follow-up revision).

---

## Schema changes

| Schema file | Change |
|---|---|
| `field.json` | remove `defaultValue`, `deprecatedAt`; `vocabularyRef` becomes LINEAGE (bare UUID) |
| `type.json` | remove `$defs.FieldAssignment.defaultValue`; add `$defs.FieldAssignment.description`; add `lineage`/`provenance`; add `conditional-forbidden` to the CrossFieldRule kind enum; `lifecycleRef` → LINEAGE; `semanticObjectType` description marked sanctioned-until-collapsed |
| `note.json`, `record.json` (+ any SourceReference host) | remove the legacy `relationType` alias acceptance |
| `blueprint.json`, `document-view.json`, `field.json`, `protocol.json` | shared `ExactTypeRef` `$def` (the `$ref` collapse across its four current hosts) |
| `package-manifest.json` | `dependencyRefs` → `packageDependencies` |
| `package-bundle.json` | `definitionType` enum becomes derived from `package-manifest.json`'s ten definition collections (today nine hand-listed values) |
| `manifest.json` | `$defs.PackageRef` mode `external` → `remote` (LOCATOR unification with `document-view.json`'s `ThemeReference`, already `remote`) |
| `protocol.json` | `TypeRef` → LINEAGE (drop `typeVersion`) |

Schema changes sync to the `srs-rust` and `srs-vscode` mirrors via their own pipelines; each schema-touching unit files the mirror/struct follow-up at landing (choreography above).

---

## Rationale

Assembled, not argued: every choice above cites the record that made it. The two genuinely local judgments are placement calls this session was explicitly asked to make — the semanticObjectType design/execution split (Change K, within #383's ruled frame) and the #317-F2 standalone slot — plus the reading in Change I that RFC-023's executed migration discharges the C17 reconciliation without touching the accepted disjointness contract, with the residual (a further value rename) flagged rather than taken.

---

## Alternatives Considered

Recorded in the source decisions (each Change cites them): facets-as-core-fields and the remainder overlay (rejected 2026-07-31); strictly-closed-everywhere and two-profile emission (rejected by `2e0cd70a`); generate-`defaultValue` (superseded by `0225099b`); object-form-everywhere, stored canonical strings, aliases (rejected by `c8704763`); riding the substrate rename here (rejected by `6fc7e142`); executing the semanticObjectType collapse in-train (rejected — partial public state against sequential trains; #383's frame). No new alternatives were opened.

---

## Open Questions

**None.** The decision map is closed; expected parks: zero; parks made: zero.
