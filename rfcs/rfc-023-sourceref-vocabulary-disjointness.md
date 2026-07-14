> **GitHub issue**: [the-greenman/srs#174](https://github.com/the-greenman/srs/issues/174)

# RFC-023: SourceReference vocabulary disjointness — `sourceRole` replaces `relationType`

**Status**: In Progress (Revision 4)
**Affects**: `SourceReference` (Note, TypedRecord, Record, Relation), schemas `record.json` / `note.json` / `typed-record.json` / `relations-collection.json`, spec records defining the SourceReference shape (§4.4 record tiers, record-typed type definition) and prose referencing it, `repo validate` diagnostics, `relation-type create` validation; coordination requirement on RFC-017 (attachments); implements principle R7 of the relation-coherence epic (#171)
**Author**: Peter Brownell (owner decisions recorded on #171); drafted by Claude
**Date**: 2026-07-14

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-14 | Initial draft from the R7 decision on epic #171 |
| 2 | 2026-07-14 | Review round 1 (2 reviewers, 5 blocking + 9 should-fix): graduation-table directions rewritten with explicit role columns; migration window re-anchored to a spec-visible marker; new "Spec text changes" section (records are the source of truth); diagnostics named; quoted-from conversion semantics + sourceRef disposition defined; R5 comparison semantics pinned to literal key equality with legacy-enum exemption; RFC-017 coordination requirement made explicit; RFC-018 citation corrected; mirror-sync process aligned with the release-artifact pipeline; alternatives F/G added; nits (asymmetry, lossy R4, schema snippet, Provenance location, supersedes-context prose occurrences) |
| 4 | 2026-07-14 | Implementation started; RFC file + schema changes committed to branch rfc/023-sourceref-vocabulary-disjointness |
| 3 | 2026-07-14 | Review round 2 (zero blocking): Relation-borne sourceRefs excluded from graduation conversion (Change C / R6); R6 split — performing a conversion is MUST-level, offering one is SHOULD; the namespaced `meta` key acknowledged as a convention minted here (scoped to this key); mirror-sync flow evidenced against `release.yml` + the mirrors' sync scripts (the CLAUDE.md "mirrors-first" text is the stale artifact, corrected in the docs pass); nits: R5 wording, diagnostic stacking, `inspired-by` custom-edge disposition, invariants 048/051/052 data-migration parenthetical |

---

## Abstract

SRS has two "this points at that" mechanisms with independently-coined, colliding vocabularies: **Relation** (a first-class binary edge between two instances, typed against installed `RelationTypeDefinition`s) and **SourceReference** (an inline provenance pointer from an instance — or a Relation — to source material). Both expose a field named `relationType`, and their value sets collide (`derived-from` appears identically in both; `evidence` vs `evidences`; `supersedes-context` vs `supersedes`). This RFC renames the SourceReference field to **`sourceRole`**, de-collides its value set, defines the graduation mapping between the two vocabularies, and adds a conformance rule keeping them disjoint permanently.

---

## Motivation

### Problem 1 — Two unrelated type systems share the field name `relationType`

A generic tool, schema-driven UI, or language model processing "a field called `relationType`" must know which of two unrelated schemas it is inside: the Relation edge vocabulary (open, resolved against installed `RelationTypeDefinition`s per RFC-005) or the SourceReference provenance vocabulary (a closed enum). Nothing in the data disambiguates them. One of them will be processed with the other's semantics.

### Problem 2 — The value sets collide

- **`derived-from` is an exact collision**: it is simultaneously a canonical Relation type (category Derivation, source = the derived work, per the relation directionality table in §4.5 and the canonical definition `package/relation-types/derived-from.json`) and a SourceReference value ("this record was derived from that transcript/document"). The same real-world provenance fact is expressed by one mechanism before graduation and the other after — with the identical string — and no document defines the conversion. Queries have no single answer surface: a graph query misses the SourceReference occurrences (29 in the spec repository alone); a sourceRef scan misses the edges.
- **`evidence` vs `evidences` differ by one letter and flip direction**: the `evidences` edge is asserted *from* the source material (source = material, target = claim, per §4.5 / `package/relation-types/evidences.json`); the `evidence` sourceRef lives *on the claim* pointing at the material. The spec repository carries 220 `evidence` sourceRefs; an agent grepping "evidence" there sees only sourceRefs and learns the wrong mechanism.
- **`supersedes-context` shares a stem with `supersedes`**, has zero data usage anywhere, and no defined semantics — while RFC-022 is making `supersedes` structurally load-bearing (relational lifecycle states). It does appear in spec *prose*: the SourceReference shape definitions, and `records/notes/semantic-pipeline-from-transcripts.json`, which lists it *among Relation types* — itself an instance of the exact confusion this RFC removes (that note is updated by this RFC; see Spec text changes).

### Problem 3 — The window is closing

RFC-017 (attachments, #101) adds `attaches` to the SourceReference vocabulary, making it load-bearing for attachment resolution. Today `sourceRefs` are stored but behaviourally inert in the reference implementation; after RFC-017 a rename requires behavioural compatibility, not just a data migration. This RFC must land **before** RFC-017 merges (see Cross-RFC coordination).

---

## Proposed Changes

### Change A — Rename `SourceReference.relationType` → `sourceRole`

The field describing the role the source material plays for the referencing instance is renamed to `sourceRole`. The name was chosen over `provenanceType` to avoid ambiguity with the existing `provenance?: Provenance` metadata object (defined on Field definitions and Blueprints), and pairs naturally with the sibling `sourceType` / `sourceId` fields.

| Aspect | Before | After |
|---|---|---|
| Field name | `relationType` | `sourceRole` |
| Value set | `evidence \| derived-from \| quoted-from \| inspired-by \| supersedes-context` | `evidence \| extracted-from \| quoted-from \| inspired-by` |
| Required | No | No (unchanged; an absent `sourceRole` means the role is unspecified — permitted before and after this RFC) |

Value changes:
- `derived-from` → **`extracted-from`** (matches the spec's existing extraction language; removes the exact collision with the canonical Relation type).
- `supersedes-context` → **removed** (no data usage, no defined semantics; may return under a non-colliding name with defined semantics in a future RFC).
- `evidence`, `quoted-from`, `inspired-by` → unchanged.

### Change B — Migration window (transitional schema)

To avoid invalidating existing well-formed repositories on the day this RFC merges, the four schemas carry **both** properties during a migration window:

- `sourceRole` — the canonical field, new enum.
- `relationType` — retained with its legacy enum, marked **deprecated (RFC-023)** in its `description`.
- A `SourceReference` **must not** carry both fields, expressed in-schema as:

```json
"not": { "required": ["sourceRole", "relationType"] }
```

**Window definition.** The migration window lasts **while the published 2.0 schemas retain the deprecated `relationType` property on `SourceReference`**. Its removal is a scheduled follow-up schema revision — a spec-visible event, not a calendar date — whose scheduling is tracked on #171. Removing it is more than a one-line change: it also removes the mutual-exclusion constraint and retires the reader alias mapping, and it turns any never-migrated sourceRef into a hard schema violation (all four `$defs` use `additionalProperties: false`). That is why the rewrite obligation below exists: by the time the removal revision ships, conforming writers have been migrating data on every save.

**Writer obligations.** Writers must emit only `sourceRole`. A writer that re-serializes an instance (or relations file) MUST rewrite any legacy `relationType` entries it emits — including sourceRefs it did not otherwise touch — per the mapping below. A conforming writer never re-emits `relationType`.

**Reader obligations.** Readers must accept `relationType` during the window, mapping legacy values per the table below and emitting the `SOURCEREF_LEGACY_RELATIONTYPE` warning.

**Compatibility asymmetry (stated plainly).** The dual-field window protects *old data read by new implementations*. It does not make *new data readable by old implementations*: a binary released before this RFC rejects `sourceRole` as an unknown property (`additionalProperties: false`). This is the ordinary spec-leads-implementation ordering; it is why the reference implementation should ship read support promptly after acceptance.

Legacy value mapping on read (and on rewrite):

| Legacy `relationType` | Maps to `sourceRole` |
|---|---|
| `evidence` | `evidence` |
| `derived-from` | `extracted-from` |
| `quoted-from` | `quoted-from` |
| `inspired-by` | `inspired-by` |
| `supersedes-context` | *(no successor — `SOURCEREF_NO_ROLE_SUCCESSOR` warning; the reference is preserved but the role becomes absent. This is intentionally lossy: the value has no semantics to preserve, and a rewrite drops it permanently.)* |

Diagnostic stacking: `supersedes-context` triggers only the specific `SOURCEREF_NO_ROLE_SUCCESSOR` warning, which subsumes the general `SOURCEREF_LEGACY_RELATIONTYPE`; the two are never emitted together for the same entry.

### Change C — Graduation mapping between the two vocabularies

When source material is itself promoted to an instance in the repository (e.g. a source document's content is graduated into a Note or Record), the provenance previously carried by a SourceReference should be re-expressed as a Relation edge. Two participants exist in every conversion; the table names them explicitly:

- **the referencing instance** — the Note/TypedRecord/Record that carried the `sourceRefs[]` entry (the derived work / the claim);
- **the promoted instance** — the new instance created from the source material.

| `sourceRole` | Relation edge created | `sourceInstanceId` | `targetInstanceId` |
|---|---|---|---|
| `extracted-from` | `derived-from` | the referencing instance | the promoted instance |
| `evidence` | `evidences` | the promoted instance | the referencing instance — **note the direction flips**: the sourceRef sat on the claim pointing at the material, but the edge is asserted from the material |
| `quoted-from` | `derived-from` | the referencing instance | the promoted instance |
| `inspired-by` | *(no canonical edge — the sourceRef is retained against the original material, or a custom `namespace/name` relation type may be used)* | — | — |

**Conversion semantics** (normative for implementations offering a promote-source-to-instance operation):

- The created Relation records the originating role in its `meta` object under the key `"com.semanticops.srs/sourceRole"` (e.g. `"quoted-from"`). For `quoted-from` this is **required** — it is the only carrier of the quotation distinction, since the edge type is `derived-from`; for other roles it is recommended.
- Field carry-over: SourceReference `confidence` → Relation `confidence`; SourceReference `note` (singular) → Relation `notes` (plural — the two entities name their free-text field differently); `assertedBy` on the new Relation reflects the actor performing the promotion.
- The converted SourceReference is **removed** from the referencing instance in the same operation. Retaining it would recreate the dual-answer-surface problem this RFC exists to fix (Problem 2). This applies equally when the `inspired-by` custom-edge path is taken: if an edge is created, the sourceRef is removed.
- **Relation-borne sourceRefs are excluded from graduation conversion.** Relations also carry `sourceRefs[]`, but a Relation is not an instance and cannot be a Relation endpoint, so the table's conversion is structurally impossible for them. A sourceRef carried on a Relation is retained (as `sourceRole`) unchanged when its source material is promoted; only instance-borne sourceRefs convert.

This table turns the residual vocabulary overlap into a designed correspondence instead of an accident.

**Meta-key convention (minted here).** No prior spec text defines a key convention for the open `meta` object. R6 establishes a **namespaced meta key** — `"com.semanticops.srs/sourceRole"` — following the same `namespace/name` form used for custom relation types. This RFC scopes the convention to this one key; whether namespaced keys become the general convention for `meta` is left to a future RFC. The new graduation-mapping spec record carries both the table **and** these conversion semantics (marker key, carry-over, removal, Relation-borne exclusion), so the normative content survives in the spec itself, not only in this RFC file.

### Change D — Permanent disjointness rule

The `sourceRole` vocabulary and the set of installed `RelationTypeDefinition` keys in a repository's effective package set must remain disjoint. This guards both directions: future additions to the `sourceRole` enum (e.g. RFC-017's `attaches`) must not collide with canonical or installed relation types, and installed relation-type definitions must not adopt `sourceRole` values as keys.

**Definitions and comparison semantics:**
- *The `sourceRole` value set* is the closed enum of the schema revision the validator implements, **including values added by later accepted RFCs** (after RFC-017 it is `{evidence, extracted-from, quoted-from, inspired-by, attaches}`).
- Comparison is **literal, whole-key string equality**. A namespaced key such as `com.acme/evidence` does **not** collide with `sourceRole` value `evidence`; only a bare key equal to an enum value collides. (Per RFC-005, bare keys are reserved for canonical types, so a colliding bare custom key is already irregular; this rule makes the irregularity a reported diagnostic.)
- The legacy `relationType` enum is **exempt** from this rule. It contains `derived-from` — a canonical Relation type — by historical accident; applying the disjointness check to legacy values during the window would fail every healthy repository. The rule applies to `sourceRole` values only.
- R5 has no grace period, deliberately: no known repository installs a bare key equal to a `sourceRole` value, and write-time rejection prevents one from appearing. At-rest detection of a pre-existing collision is a **warning** (not an error) to avoid retroactively hard-invalidating a repository that a future enum addition happens to collide with; the remediation is re-keying the definition to `namespace/name` form.

### Diagnostics introduced

| Code | Severity | Trigger |
|---|---|---|
| `SOURCEREF_LEGACY_RELATIONTYPE` | warning | A `SourceReference` read with the legacy `relationType` field during the window |
| `SOURCEREF_NO_ROLE_SUCCESSOR` | warning | A legacy `relationType: "supersedes-context"` encountered on read |
| `SOURCEREF_DUAL_ROLE_FIELDS` | error | A `SourceReference` carrying both `sourceRole` and `relationType` |
| `SOURCEROLE_RELATIONTYPE_COLLISION` | error on write (rejection), warning at rest | An installed `RelationTypeDefinition` whose whole key equals a `sourceRole` enum value |

---

## Conformance Rules

> **[R1]** A conforming writer MUST emit the provenance-role field of a `SourceReference` as `sourceRole` and MUST NOT emit `relationType` on a `SourceReference`. A writer re-serializing an instance or relations file MUST rewrite any legacy `relationType` entries it emits per the Change B mapping.
>
> **[R2]** During the migration window — defined as the period in which the published 2.0 schemas retain the deprecated `relationType` property on `SourceReference` — a conforming reader MUST accept `relationType` as a legacy alias, apply the Change B value mapping, and emit `SOURCEREF_LEGACY_RELATIONTYPE` (warning). After the schema revision that removes the property, readers MAY reject the legacy field.
>
> **[R3]** A `SourceReference` MUST NOT carry both `sourceRole` and `relationType`. Validators MUST report `SOURCEREF_DUAL_ROLE_FIELDS` as an error.
>
> **[R4]** A legacy `relationType: "supersedes-context"` has no successor value. Readers MUST emit `SOURCEREF_NO_ROLE_SUCCESSOR` (warning) and treat the role as absent; writers MUST NOT emit `supersedes-context` under either field name. The loss of the value on rewrite is intentional and permanent.
>
> **[R5]** The `sourceRole` value set (as defined in Change D — the closed enum of the implemented schema revision, including values added by later accepted RFCs) MUST be disjoint under literal whole-key equality from the set of installed `RelationTypeDefinition` keys in the repository's effective package set. Relation-type creation MUST reject a definition whose key equals a `sourceRole` value; `repo validate` MUST report a pre-existing collision as `SOURCEROLE_RELATIONTYPE_COLLISION` (warning at rest). The legacy `relationType` enum is exempt.
>
> **[R6]** An implementation SHOULD offer conversion of instance-borne SourceReferences to Relation edges when their source material is promoted to an instance. An implementation that **performs** such a conversion MUST follow the Change C table and conversion semantics: create the edge with the specified direction (note the flip for `evidence` → `evidences`), carry over `confidence` and `note`→`notes`, record the originating role in `meta["com.semanticops.srs/sourceRole"]` (REQUIRED for `quoted-from`), and remove the converted SourceReference in the same operation. Relation-borne sourceRefs MUST NOT be converted (Change C); they are retained unchanged.

---

## Schema changes

| Schema file | Change |
|---|---|
| `record.json` | `$defs.SourceReference`: add `sourceRole` (new enum), mark `relationType` deprecated (legacy enum retained for the window), add the `not`/`required` mutual-exclusion constraint. One `$def` covers both `sourceRefs` sites (record-level and FieldValue-level). |
| `note.json` | same |
| `typed-record.json` | same |
| `relations-collection.json` | same (Relations also carry `sourceRefs[]`) |

Schema changes are synced to the mirrors through the release pipeline: when the spec PR merges, the `srs` release workflow (`release.yml`) publishes `schemas-2.0.tar.gz`, and `srs-rust` (`crates/srs-schema/schemas/2.0/`, via `scripts/sync-schemas-from-spec.sh`, which downloads that release asset) and `srs-vscode` (`schemas/2.0/`) refresh from it under their own CI drift checks. Mirror-sync tracking issues are filed in both repos referencing this RFC; sibling trees are not edited from the spec change itself. *(The "mirror PRs must merge before the spec PR" instruction still present in the monorepo and `srs-rust` CLAUDE.md files predates the release-artifact pipeline and is stale; it is corrected in this RFC's documentation pass.)*

## Spec text changes

The records are the source of truth; the schemas are a projection. The following spec records change with this RFC (and `docs/spec/` is re-rendered via `publish-spec.mjs`):

| Record | Change |
|---|---|
| `records/subsections/04-4-4-4-record-tiers.json` | SourceReference TypeScript block: `relationType` → `sourceRole`, new enum, deprecation note for the legacy field during the window |
| `records/type-definitions/record-typed.json` | same TypeScript block |
| `records/notes/semantic-pipeline-from-transcripts.json` | prose lists `supersedes-context` among *Relation* types — the exact cross-vocabulary confusion this RFC removes; corrected |
| *(new)* graduation-mapping record | the Change C table **and** its conversion semantics (marker key, carry-over, removal, Relation-borne exclusion), placed with the SourceReference definition in §4.4 |
| *(new)* invariant/conformance record for R5 disjointness | placed with the relation conformance rules |
| Prose sweep | all other records mentioning `relationType` **on SourceReference** (the ~20 records referencing SourceReference are checked; those keying off `sourceType`/`sourceId` only — e.g. invariants 048/051/052 — need no *prose* change, though their own `sourceRefs` data entries still migrate with the data pass below) |

**The spec repository's own data** (220 `evidence` + 29 `derived-from` + 7 `inspired-by` = 256 legacy sourceRefs) is migrated to `sourceRole` as part of implementation, once the reference implementation reads the new field — tracked on #171. Until then the spec repo validates under the transitional schema (legacy field, deprecated), exercising the migration window it defines — with the known cost that its own data carries `SOURCEREF_LEGACY_RELATIONTYPE` warnings during that period.

---

## Cross-RFC coordination

- **RFC-017 (attachments, #101 — Draft Rev 2)**: MUST be revised before acceptance to (a) define `attaches` as a `sourceRole` value, not a `relationType` value, and (b) extend **all four** SourceReference-bearing schemas — its current draft touches only `record.json` and `relations-collection.json`. `attaches` collides with no canonical or known installed relation-type key, satisfying R5. This RFC merges first.
- **RFC-005**: this RFC relies on its open-vocabulary/installed-definition model for the Relation side and its bare-key-is-canonical convention (R5 comparison semantics).
- **RFC-018 (core base package & identity type)**: the migration posture follows its R7 grace-period precedent — warning during the window, enforcement after a spec-visible event — with one difference: RFC-018 R7's window is open-ended, while this RFC's window closes at a scheduled schema revision (tracked on #171).
- **RFC-022 (relational lifecycle states, #158)**: motivates dropping `supersedes-context` now, before `supersedes` becomes structurally load-bearing.

---

## Rationale

- **Field rename over value renames alone**: two unrelated schemas exposing a field named `relationType` is the trap every generic consumer hits; value renames without the field rename fix greps but not tooling. The expensive part (schema churn, mirror syncs, unifying the reference implementation's two parallel `SourceReference` definitions) is identical either way, so the full fix costs marginally more than the partial one.
- **`sourceRole` over `provenanceType`**: the spec already defines a `provenance?: Provenance` metadata object (on Field definitions and Blueprints); `provenanceType` invites a second name collision while fixing the first. "Role" precisely describes the enum (`evidence`, `quoted-from`, `inspired-by` are roles the source plays).
- **`extracted-from` over `sourced-from`**: aligns with the spec's established extraction vocabulary (the extraction gap, extraction workflows); `sourced-from` collides visually with the adjacent `sourceType`/`sourceId` fields.
- **Dropping `supersedes-context` now**: zero data usage, zero defined semantics, and RFC-022 is about to make `supersedes` structurally meaningful. Removing an unused value costs nothing today and prevents a manufactured confusion later.
- **Transitional dual-field schema over a hard cutover**: a hard rename would invalidate every existing repository (the spec repository alone carries 256 sourceRefs) on merge day. The dual-field window with a mutual-exclusion constraint and a writer rewrite obligation lets data migrate incrementally, then closes at a scheduled schema revision. (See Change B for the compatibility asymmetry: old binaries still cannot read new data — spec leads implementation.)
- **Sequencing before RFC-017**: sourceRefs are currently inert in the reference implementation (written as `None` by every service, consumed only by an analysis count), so this rename is a data-shape change with no behavioural compatibility burden. RFC-017 makes the vocabulary load-bearing; after it, the same rename requires behavioural compatibility. Landing this first also gives `attaches` a clean vocabulary to join.

---

## Alternatives Considered

### Alt A — `provenanceType` as the field name

Rejected: collides with the existing `provenance?: Provenance` metadata object (Field definitions, Blueprints). Trades one ambiguity for another.

### Alt B — Rename values only, keep the field name

Rejected: fixes data-level ambiguity but leaves every generic tool and model facing two unrelated schemas with a shared field name — the highest-leverage half of the problem unfixed, at most of the cost.

### Alt C — Rename the field only, keep `derived-from`

Rejected: leaves the exact string collision that the graduation workflow crosses — the single most confusing case in practice.

### Alt D — Fold into RFC-017

Rejected: one combined migration is appealing, but it couples the attachments release to a naming cleanup, grows an in-flight RFC with open implementation issues, and delays the disjointness rule that RFC-017's own vocabulary addition should be checked against.

### Alt E — Defer until after RFC-017/RFC-022

Rejected: RFC-017 makes the vocabulary load-bearing and RFC-022 makes `supersedes` structurally meaningful; both multiply the cost and risk of the rename. The current inertness of sourceRefs makes this the cheapest moment the change will ever have.

### Alt F — Hard cutover with a one-shot migration command

A `migrate` registry entry (per the migration-framework direction, srs-rust#464; precedent: RFC-018 R8's `repo migrate-identity`) could rewrite every repository in one pass, allowing sourceRole-only schemas immediately. Rejected as the *primary* mechanism: it requires every repository to run tooling before its data validates again, punishing dormant repositories, and the reference implementation's migration framework is itself still landing. The window plus writer-rewrite obligation achieves the same end state without a flag day; a migration command remains welcome as an accelerant and is the natural implementation of the spec-repo data migration.

### Alt G — Rename the Relation side instead

Renaming `Relation.relationType` would also resolve Problem 1. Rejected without hesitation: the Relation field is load-bearing across the entire ecosystem (schemas, CLI payloads, WASM bindings, every client), while the SourceReference field is currently inert; the cost ratio is absurd in the other direction.

---

## Open Questions

1. **When does the migration window close?** The schema revision that removes the deprecated `relationType` property is deliberately not pinned here; it is scheduled on #171 once the reference implementation ships `sourceRole` read/write support and the spec repository's own data is migrated. The window's *definition* (R2) is spec-visible and testable regardless.
