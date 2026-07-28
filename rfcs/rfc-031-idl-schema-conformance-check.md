> **GitHub issue**: [the-greenman/srs#246](https://github.com/the-greenman/srs/issues/246)

# RFC-031: IDL/Schema conformance check — prose ↔ JSON Schema drift gate

**Status**: In Progress (Revision 4)
**Affects**: Field, Type, Record, TypedRecord, Note, Relation, Container, Vocabulary, Term, RelationTypeDefinition, SourceReference, `scripts/check-release-drift.mjs`
**Author**: Claude Code (agent), on behalf of the repository owner
**Date**: 2026-07-28

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-28 | Initial draft |
| 2 | 2026-07-28 | Address Spec Integrity + Completeness review findings: fixed script/allowlist paths (repo-root `scripts/`, not `srs/scripts/`); added R6 (allowlist must cover every known discrepancy at merge time, CI green from day one); extended R3's type-token table (`number`, `Record<string, unknown>`); mapped `SourceReference` and `TypedRecord.TypedField` as sub-entities (closes a real gap — the check now catches `SourceReference.sourceRole`'s undocumented `"attaches"` enum value, cited in Alt A but previously unreachable by the check as designed); corrected Note/TypedRecord sub-block headers and the heading-match rule; corrected the "5 of 8" prose-copy-disagreement count to the accurate "4 of 6" (only 6 entities have two prose copies to begin with); specified the allowlist entry JSON shape; dropped the workflow-file line from Affects (R5 already states no workflow-file change is needed). |
| 3 | 2026-07-28 | Second review round (both reviewers re-run against Rev 2) found: Change B's prose-source paths were missing the `srs/` prefix the nested data repository actually requires (fixed, all 15 rows); the root-level extraction rule was silently ambiguous and provably wrong for `Record` specifically, whose prose opens with an unrelated `FieldValue` block before its own (fixed — `Record` now has an explicit sub-block header, `Record.FieldValue` is now mapped, and the root-level rule is tightened to "no heading of any kind precedes it," not just "no heading naming a different mapped entity"); the "4 of 6" count was still wrong (correct figure is "4 of 7" — `Field` also has two agreeing prose copies and was omitted from the accounting; fixed, and scoped explicitly to top-level entities since `SourceReference`/`TypedField` are also duplicated sub-entities that agree); R6 depended on a manually-enumerated discrepancy list that a review pass on this RFC's own drafting immediately proved incomplete (missed `$schema` — pervasive schema-tooling metadata with no prose counterpart by design, now an explicit R1 carve-out — and `SourceReference.relationType`, schema-only and undeclared in prose); R6 reworded to require the allowlist cover whatever the script itself reports at merge time, not a fixed prose list, which is the only version of the guarantee that survives future manual-audit gaps; `RelationTypeDefinition.aliases`'s "schema rejects it" framing corrected (`relation-type.json` is the one schema file without `additionalProperties: false`, so it's undeclared/unvalidated, not actively rejected — R1 still flags the property-set mismatch either way); `SourceReference`'s "sole prose definition" claim corrected (a second, agreeing copy exists); softened the "Note follow-up issue" reference (not yet filed at RFC-drafting time); Container's "Invariant 19 vs 20" example annotated as outside R1–R3's detection scope (the disagreement is in free text after the fenced block, not inside it); Open Question 2 corrected to acknowledge R1–R4 only monitor the one prose copy Change B designates canonical per entity, not both copies under either duplication model. |
| 4 | 2026-07-28 | Third review round (both reviewers re-run against Rev 3) found zero blocking findings — the RFC has converged. Small polish applied: the Note row's parenthetical path reference to the non-canonical `type-definitions/record-note.json` was missing its `srs/` prefix (fixed); Relation's "extra directionality-convention table" disagreement given the same "outside R1–R3 detection scope" caveat already applied to Container's case (both are free text after the fenced block, not in it); Container's "Invariant 19 vs 20" reframed from a cosmetic renumbering to what it actually is — the canonical copy's "19" is an objectively wrong citation to an unrelated invariant (`TypedField.name` uniqueness), the subsection copy's "20" is correct; Alt A blocker #3 and R3's sub-entity exclusion list updated to include `relationType`/`FieldValue`, which Rev 3 introduced elsewhere but hadn't fully threaded through every section referencing the same facts. |

---

## Abstract

Every core SRS entity is defined in two normative places within this repository: a prose
pseudo-IDL block embedded in spec records (`records/type-definitions/*.json` and, for some
entities, `records/subsections/*.json`), and a JSON Schema 2020-12 file
(`docs/schema/2.0/*.json`). Nothing today checks that the two agree. This RFC adds a CI-gated
conformance check that flags disagreement in property set, optionality, and (for primitives,
arrays, and enums) declared type — closing the seam that produced five known Field defects
(#232–#237) and, per a full cross-entity audit backing this RFC, an equivalent or worse amount
of undetected drift in every other core entity. Schema-generation-from-records, the stronger
alternative, is explicitly evaluated and deferred: it is blocked by architecture facts this
audit surfaced, not merely by effort.

---

## Motivation

### Problem 1 — the prose/schema seam is real, general, and totally unguarded

`the-greenman/srs#238` names the root cause: the specification declares spec records
canonical, and the machinery enforces JSON Schema, but nothing checks the two agree.
`scripts/validate-all.mjs` validates record *instances* against schema; it never reads the
pseudo-IDL prose. `scripts/check-rfc-integration.mjs`'s `schema:<file>.json` manifest token
only confirms the schema file *exists*, never that its content agrees with anything. The
existing schema-drift tooling in `srs-rust` (`check-schema-drift.sh`) solves a different
problem — byte-fidelity of the schema *file* as it's mirrored into `srs-rust`/`srs-vscode` —
and takes `docs/schema/2.0/` as already-correct and given.

Five Field defects (#232–#237) were found this way, by hand, in one audit. #232 (spec named
`selectOptions`, every implementation used `allowedValues`) has since been fixed
(RFC-030). #233–#237 remain open.

### Problem 2 — the pattern generalizes to every other core entity

A full audit backing this RFC (pseudo-IDL vs. `docs/schema/2.0/*.json`, all read from
`origin/master`) checked the seven other entity families named in Epic 14's scope
(muDemocracy.org#133) plus `RelationTypeDefinition`, and found concrete, previously-undetected
drift in every one:

- **Schema has properties the prose never mentions**: `Record.tags`, `TypedRecord.tags`;
  `Container.description`, `Container.identityInstanceId` (RFC-013/029), and
  `Container.tags` (RFC-006/009) — three properties spanning four RFCs' worth of additive
  drift, the worst of the eight; `Vocabulary.tags`; `Type`'s nine extension-owned properties
  (`fieldGroups`, `lifecycle`, `lifecycleRef`, `extendsTypeId`, `extendsTypeVersion`,
  `fieldOrder`, `fieldAssignmentOverrides`, `identityFieldId`, `validationRules`); `Relation`'s
  `sourceRepositoryId`/`targetRepositoryId` (ext:federation); and, on `SourceReference` (mapped
  as its own sub-entity per Change B — see Problem 3), both `sourceRole`'s `"attaches"` enum
  value (added by RFC-017) and the entirely undeclared `relationType` property, present in all
  four schema copies of `SourceReference` (`record.json`, `typed-record.json`, `note.json`,
  `relations-collection.json`) but absent — `relationType` only ever appears inside a `//`
  comment calling it a deprecated, never-written alias of `sourceRole` — from the prose
  definition in `records/type-definitions/record-typed.json`. **This list is illustrative
  evidence for why this RFC is needed, not an exhaustive inventory** — R6 requires the
  allowlist to cover whatever the script itself reports at merge time, not this list verbatim,
  precisely because manual audits of this kind have already been shown (during this RFC's own
  review) to miss real cases.
- **Prose declares properties the schema rejects** (`additionalProperties: false`):
  `Type.lineage`/`Type.provenance`, `Vocabulary.lineage`/`Vocabulary.provenance`,
  `Term.lineage`/`Term.provenance`, `Type.FieldAssignment.displayHint`. (`RelationTypeDefinition
  .aliases` is a related but distinct case: `relation-type.json` is the one schema file that
  does *not* set `additionalProperties: false` — see the fourth bullet below — so `aliases`
  isn't actively rejected, it's simply undeclared and silently unvalidated; R1 still flags it
  as a property-set mismatch either way.)
- **The two prose copies of the same entity disagree with each other**, on 4 of the 7
  *top-level tier entities* that have two prose copies at all (scoped to top-level entities;
  the sub-entities `SourceReference`, `TypedField`, and `FieldValue` are also duplicated between
  `record-typed.json`/`record.json` and the tier-record subsection, but their two copies agree,
  so they don't change this count either way — see Change B. `Vocabulary`, `Term`, and
  `RelationTypeDefinition` have only one prose definition each — see Problem 3 — so `Type`,
  `Record`, `TypedRecord`, `Note`, `Relation`, `Container`, and `Field` are the seven top-level
  entities in scope for this comparison; `Record`, `TypedRecord`, and `Field` are the three
  that agree): `Type` (the subsection copy has an extra `lifecycleRef` section the
  type-definitions copy lacks), `Note` (the subsection copy has `Note.tags`/`NoteSection.tags`;
  the type-definitions copy has neither, and — inverting the usual assumption that
  `type-definitions/` is canonical — it is the *type-definitions* copy that is stale relative
  to the schema, not the subsection), `Relation` (the subsection copy has an extra
  directionality-convention table, in free text after the fenced block — like Container's case
  below, this is outside what R1–R3 mechanically detect), `Container` (the two copies cite
  different invariant numbers for the identical rule — the canonical type-definitions copy
  cites "Invariant 19," which is actually the unrelated `TypedField.name`-uniqueness rule; the
  subsection copy correctly cites "Invariant 20." This is a wrong citation in the canonical
  copy, not a cosmetic renumbering, again in free-text prose following the fenced block, so
  outside what R1–R3 mechanically detect — it's cited here as further evidence of
  duplication risk, not as something this RFC's check catches).
- **The schema layer is not fully self-consistent either**: `docs/schema/2.0/relation-type.json`
  is the only one of the ten entity schema files that does not set
  `additionalProperties: false`, directly contradicting its own property description text,
  which claims a closed-world "unknown fields rejected" policy.

### Problem 3 — two structural quirks that any mechanical check or generator must handle

`Vocabulary` and `Term` have **no** `records/type-definitions/` record at all — both are
defined exactly once, in prose, inside
`records/subsections/04-7-vocabulary-term-substrate.json`. And `docs/schema/2.0/` has **no**
`relation.json` — the `Relation` instance shape lives only as `$defs.Relation` inside
`docs/schema/2.0/relations-collection.json`, while `docs/schema/2.0/relation-type.json` is a
distinct entity (`RelationTypeDefinition`, also defined only in the same substrate
subsection). A naive `type-definitions/<name>.json` ↔ `docs/schema/2.0/<name>.json`
filename-keyed mapping silently skips or misfires on 3 of 10 entities.

---

## Proposed Changes

### Change A — Conformance script

A new script, `scripts/check-idl-schema-conformance.mjs` (repo-root `scripts/`, alongside
`check-rfc-integration.mjs` and `check-release-drift.mjs` — **not** under `srs/`, which is the
nested SRS data repository and has no `scripts/` directory of its own), that:

1. Locates each entity's pseudo-IDL prose: the `fieldValues[]` entry with
   `fieldId: "1a000002-0000-4000-a000-000000000002"` on the source record identified in the
   name-mapping table (Change B). Exactly one such entry MUST exist per source record; the
   script fails loudly (not silently skips) if zero or more than one match is found.
2. Extracts fenced ` ```typescript ` object-literal blocks with a line-oriented regex
   extractor — property name, `?` optionality suffix, and type token per line — matching this
   codebase's existing hand-rolled-validator style (`scripts/lib/json-schema-lite.mjs`), not a
   full TypeScript parser. Trailing `// comment`s on a property line are stripped from the
   type token, not merged into it. Markdown content after the closing fence (tables, prose) is
   never scanned. A **root-level entry** (Change B's "—" sub-block header) matches the first
   fenced block in the field value, and only if **no** `####`/`###` heading of any kind
   precedes it in the source text — not merely no heading naming a *different* mapped entity.
   If any heading precedes an entity's content (as `Record`'s does — `record.json`'s prose
   opens with an unrelated `#### \`FieldValue\`` block before `#### \`Record\``), that entity
   MUST be given its own explicit sub-block header in Change B rather than "—", full stop; "—"
   is reserved for entities whose block is genuinely the first thing in the field value with no
   heading anywhere before it (confirmed true only for `Field`, `Type`, `Container`, and
   `Relation`). A **sub-block entry** matches the fenced block nearest-following the heading
   whose backtick-quoted name equals the entry's `Sub-block header` column, after trimming any
   parenthetical suffix (e.g. `` `VocabularyEntry` (substrate contract) `` matches header text
   `` ### `VocabularyEntry` ``) — exact match otherwise, not a substring match.
3. Loads the corresponding `docs/schema/2.0/<file>.json` and walks `properties`/`required` at
   the JSON-pointer location the mapping table specifies (root, or a `$defs.<Name>`
   sub-object).
4. Compares the two per the Conformance Rules below, and reports every discrepancy not
   covered by the allowlist (Change D).

### Change B — Name-mapping table (normative)

Because the naive filename pairing breaks for 3 of 10 entities (Problem 3), this table is
part of the specification of the check, not an implementation detail — a future entity added
to either side of the seam must extend it here.

| Entity | Prose source | Sub-block header | Schema file | Schema pointer |
|---|---|---|---|---|
| Field | `srs/records/type-definitions/field.json` | — | `field.json` | `#` |
| Type | `srs/records/type-definitions/type.json` | — | `type.json` | `#` |
| Type.FieldAssignment | `srs/records/type-definitions/type.json` | `#### \`FieldAssignment\`` | `type.json` | `#/$defs/FieldAssignment` |
| Record | `srs/records/type-definitions/record.json` | `#### \`Record\`` | `record.json` | `#` |
| Record.FieldValue | `srs/records/type-definitions/record.json` | `#### \`FieldValue\`` | `record.json` | `#/$defs/FieldValue` |
| TypedRecord | `srs/records/type-definitions/record-typed.json` | `#### \`Typed Record\`` (note the space — not `TypedRecord`) | `typed-record.json` | `#` |
| TypedRecord.TypedField | `srs/records/type-definitions/record-typed.json` | `#### \`TypedField\`` | `typed-record.json` | `#/$defs/TypedField` |
| SourceReference | `srs/records/type-definitions/record-typed.json` (canonical copy used by this check; a second, textually-identical copy also exists in `srs/records/subsections/04-4-4-4-record-tiers.json` — referenced by name from `Record`/`TypedRecord`/`Note`/`Relation`) | `#### \`SourceReference\`` | `record.json` | `#/$defs/SourceReference` |
| SourceReference | *(same as above)* | *(same as above)* | `typed-record.json` | `#/$defs/SourceReference` |
| SourceReference | *(same as above)* | *(same as above)* | `note.json` | `#/$defs/SourceReference` |
| SourceReference | *(same as above)* | *(same as above)* | `relations-collection.json` | `#/$defs/SourceReference` |
| Note | `srs/records/subsections/04-4-4-4-record-tiers.json` (the **subsection** copy, not `srs/records/type-definitions/record-note.json` — see Problem 2: the type-definitions copy is currently stale, missing `tags`. This RFC does not resolve which copy should be canonical long-term; whether/how to reconcile them is tracked by a follow-up issue filed under Epic 14 alongside this RFC, not decided here) | `#### \`Note\`` | `note.json` | `#` |
| Note.NoteSection | `srs/records/subsections/04-4-4-4-record-tiers.json` | `#### \`NoteSection\`` | `note.json` | `#/$defs/NoteSection` |
| Relation | `srs/records/type-definitions/relation.json` | — | `relations-collection.json` | `#/$defs/Relation` |
| Container | `srs/records/type-definitions/container.json` | — | `container.json` | `#` |
| Vocabulary | `srs/records/subsections/04-7-vocabulary-term-substrate.json` | `### \`Vocabulary\`` | `vocabulary.json` | `#` |
| Term | `srs/records/subsections/04-7-vocabulary-term-substrate.json` | `### \`Term\`` | `term.json` | `#` |
| RelationTypeDefinition | `srs/records/subsections/04-7-vocabulary-term-substrate.json` | `### \`RelationTypeDefinition\`` | `relation-type.json` | `#` |
| VocabularyEntry | `srs/records/subsections/04-7-vocabulary-term-substrate.json` | `### \`VocabularyEntry\`` (real heading text carries a `(substrate contract)` suffix — matched per Change A step 2's trimming rule) | *(none — abstract base, skipped)* | — |

`SourceReference` and `TypedRecord.TypedField` are mapped as sub-entities per Change A/B rather
than left as unverified cross-references, closing a concrete gap: the schema-side
`SourceReference.sourceRole` enum's `"attaches"` value (cited in Alt A as a fact with "no prose
counterpart") is now something R3 actively catches, rather than something the check silently
lets through.

### Change C — Default resolution rule

Where prose and schema disagree, the check's default assumption is: **`docs/schema/2.0/` is
correct and live** (it is instance-validated via `validate-all.mjs` and mirror-checked into
`srs-rust`/`srs-vscode`), **and the prose is stale**, unless a specific follow-up issue calls
out the opposite. This keeps this RFC about the *mechanism*; resolving each of the ~20 known
discrepancies (Problem 2) is delegated to follow-up issues filed under Epic 14, not decided
here.

### Change D — Allowlist

`scripts/idl-schema-conformance-allowlist.json` (repo-root, sibling to `check-*.mjs`, in the
spirit of the existing `rfcs/integration-allowlist.json`) holds currently-known,
currently-accepted gaps the check must not hard-fail on. Each entry has the shape:

```json
{ "entity": "Type", "property": "lifecycle", "rule": "R1", "issue": 247 }
```

— `entity` matches a Change B row's Entity column; `property` names the specific property the
entry waives (required even for R1 entries, so the allowlist can't blanket-exempt an entire
entity); `rule` is the specific rule being waived (`R1`, `R2`, or `R3`); `issue` is a tracked
follow-up GitHub issue number. The script asserts at load time that every entry has all four
fields and that `issue` resolves to a real, open issue number, and fails closed (script error,
not a silent skip) if any entry is missing its issue link — the allowlist cannot silently grow
unaccountably. `Type`'s nine extension-owned properties are the largest current example: they
are documented only as `//` comments pointing at other extension subsection files rather than
as real object-literal properties (an architectural mismatch between the prose's core/extension
split and the schema's flat merge, not a typo, and out of scope to fix in this RFC) — each
becomes one `R1` allowlist entry citing the `Type` follow-up issue.

---

## Conformance Rules

> **[R1]** For every entity in the Change B mapping table, the set of property names declared
> in the pseudo-IDL's object-literal block MUST equal the set of property names in the
> corresponding JSON Schema's `properties`, except for entries listed in the Change D
> allowlist. The schema-tooling property `$schema` (present on most root-level entity schemas,
> required on `type.json` and `relation-type.json`) is excluded from this comparison entirely,
> on both sides — it is JSON Schema/JSON-LD self-reference metadata, not a domain property, and
> has no pseudo-IDL counterpart on any entity by design, not by drift.
>
> **[R2]** For every property present in both the pseudo-IDL and the schema, declared
> optionality (the pseudo-IDL's `?` suffix vs. the schema's `required` array) MUST agree.
>
> **[R3]** For every property present in both, the declared type token MUST agree under a
> small, explicit equivalence table: `UUID` ↔ `{type: "string", format: "uuid"}`; `ISO8601` ↔
> `{type: "string", format: "date-time"}`; `T[]` ↔ `{type: "array", items: ...}`; a quoted
> string union (`"a" | "b"`) ↔ `{type: "string", enum: [...]}` with matching value sets;
> primitive tokens `string`, `number`, `integer`, `boolean` ↔ matching `type`; `Record<string,
> unknown>` (used for `meta`-style properties) ↔ `{type: "object"}`. Named cross-file type
> references (`Lineage`, `Provenance`, `AiGuidance`) are checked for presence and optionality
> only, **not** full structural equivalence — this is a deliberate, documented limitation (see
> Alt A in Rationale: full structural resolution would require a whole-repo symbol table).
> `SourceReference`, `TypedField`, and `FieldValue` are excluded from this fallback because Change B maps them
> as first-class sub-entities with their own schema pointers, so R1–R3 apply to them in full.
>
> **[R4]** The check MUST run for every entity in the Change B mapping table, not only Field.
>
> **[R5]** The check MUST be invoked as a step in `scripts/check-release-drift.mjs`,
> positioned after the existing "package/instance validation" step and before "RFC
> integration", so it runs in CI on every push/PR via the existing
> `.github/workflows/release-drift.yml` without any workflow-file change (that workflow only
> invokes `check-release-drift.mjs`).
>
> **[R6]** The allowlist (Change D) shipped alongside the script MUST, at merge time, cover
> **every discrepancy the script itself reports when run against the repository at that
> commit** — not a fixed, manually-enumerated list. (Revision 2's audit-derived list —
> `lineage`/`provenance`/`aliases`/`displayHint`/extension-property/`tags`/federation-property/
> `SourceReference.sourceRole` `"attaches"` — is Motivation Problem 2's evidence for *why* this
> RFC is needed, not a closed inventory the allowlist is checked against; review of this RFC's
> own drafting process already found the manual audit missed at least one further real gap,
> `SourceReference.relationType` being schema-only undeclared in prose, which is exactly the
> failure mode grounding R6 in the tool's live output rather than a prose list is meant to
> prevent.) Each allowlist entry still cites a follow-up issue per Change D. This is what makes
> R5's CI gate green on the day it goes live rather than red on every subsequent PR;
> follow-up issues shrink the allowlist over time as each discrepancy is resolved on its own
> schedule. Implementation-time step: run the script against the target commit *before* it is
> wired into `check-release-drift.mjs`, allowlist everything it reports, then wire it in —
> never wire it in first and allowlist reactively.

---

## Schema changes

**None.** This RFC adds tooling only. It does not add, remove, or modify any
`docs/schema/2.0/*.json` file, and it does not change the normative content of any spec
record.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

— not applicable here, since no schema file changes.

---

## Rationale

A conformance *test* is the smallest change that closes the seam #238 identifies: it requires
no redesign of the pseudo-IDL's information architecture, and it directly targets exactly the
kind of drift the audit found (property-set, optionality, and primitive/enum type
disagreement). It trades a weaker guarantee (catches drift, doesn't prevent it structurally)
for being buildable now, against the prose and schema as they actually exist today.

The stronger alternative — generating `docs/schema/2.0/*.json` from spec records, so drift
becomes structurally impossible rather than merely detected — is the audit's Option 1, and is
the direction most consistent with this repo's stated architecture ("the records are the
source of truth, and the markdown is a projection"). It is evaluated and deferred below, not
rejected: the blockers are architectural facts uncovered by the audit, not effort, and they
would need to be resolved by a separate RFC before generation is attempted.

---

## Alternatives Considered

### Alt A — Generate `docs/schema/2.0/*.json` from spec records

Not chosen now. The audit found four concrete blockers:

1. **Core/extension split mismatch.** The pseudo-IDL documents extension-owned properties
   (e.g. `Type`'s nine) only as `//` comments pointing at other subsection files; the schema's
   shape is a flat merge of core + every extension. A generator needs either multi-file merge
   logic across the whole extension set, or a prose rewrite that inlines everything the schema
   actually validates — changing the spec's core/extension narrative structure.
2. **Unresolved cross-file type references.** Property types like `Lineage`, `Provenance`, and
   `AiGuidance` are named in one prose block but defined in another, unrelated file, with no
   locally-resolvable structure. A generator needs a whole-repo symbol table, not a
   per-record parser. (`SourceReference` itself no longer has this problem as of Revision 2 —
   Change B maps it to its own prose source — but the properties *typed as* `SourceReference[]`
   still only carry a bare name reference in their containing block, same as `Lineage`/
   `Provenance`/`AiGuidance`.)
3. **Schema-only facts with no prose counterpart to generate from.** For example,
   `SourceReference.sourceRole`'s schema enum includes `"attaches"`, which the pseudo-IDL still
   does not declare — and more starkly, `SourceReference.relationType` is a real schema
   property with *no prose declaration at all* (only a `//` comment calling it a deprecated,
   never-written alias of `sourceRole`). This RFC's check now *detects* both gaps (R1/R3,
   against the Change B mapping) — that's the whole point — but detecting a missing fact is not
   the same as having a prose source to generate it from; Option 1 would still need someone to
   add `"attaches"` and a real `relationType` declaration to the prose before a generator could
   emit either.
4. **No generation source for two entities.** `Vocabulary` and `Term` have no
   `type-definitions/` record at all — there is no prose to generate *from* without first
   creating one.

None of these four are addressed by choosing the conformance-test approach instead of doing
nothing, so Option 1 remains a legitimate target state — pursued via a **future, separate
RFC** — once the pseudo-IDL's information architecture is reworked to be self-contained per
entity (each blocker above resolved individually).

### Alt B — Make the pseudo-IDL a generated projection of the JSON Schema

Rejected on principle, not deferred. This would make a generated artifact (the schema)
canonical and the prose derived from it, inverting this repository's stated architecture that
the records — including the pseudo-IDL prose embedded in them — are the source of truth, and
generated/rendered artifacts are projections of that source. No code or process anywhere
treats the schema as a generation source for prose today, consistent with this being out of
bounds rather than merely unbuilt.

---

## Open Questions

1. Should `Type`'s nine extension-documented-as-comments properties eventually become real,
   declared (optional) properties in the pseudo-IDL block itself, or should the pseudo-IDL
   syntax gain a first-class `// ext:<name> declares: <prop>` directive the parser
   understands natively, so extension ownership stays visible without becoming a flat
   property list? Deferred to the `Type` follow-up issue (filed under Epic 14, tracking Change
   D's allowlist entry for `Type`) — not blocking for this RFC, since Change D's allowlist
   mechanism accommodates either outcome.
2. Is the `type-definitions/*.json` vs. `subsections/*.json` prose duplication itself the
   right architecture — should one transclude the other instead of hand-duplicating content
   that has already been found to drift on 4 of the 7 top-level entities that have two prose
   copies (cf. design-note 038, "Field transclusion in document views") — or is duplication
   acceptable as long as this new check catches divergence going forward? Worth a separate
   design conversation; not blocking for this RFC, **with one caveat**: Change B designates
   exactly one prose copy as canonical per entity, and R1–R4 only ever check that one copy
   against the schema — the *second*, unmapped copy's drift is not monitored by this mechanism
   at all, by either model. If duplication persists, that residual blind spot is real and is
   the strongest argument for eventually answering this question, not something this RFC
   resolves.

**Note (cross-reference, not scope):** the same audit surfaced a third seam — JSON Schema vs.
`srs-core`'s Rust struct and validator implementation (does `field.rs`, or any other entity's
struct, actually implement what the mirrored schema says) — which nothing today checks either,
symptomatic in `srs-rust#769`. This is explicitly **out of scope** for this RFC, which closes
only the prose↔schema seam within `srs`. It is tracked as a separate follow-up issue filed in
`srs-rust` under Epic 14.
