# Vocabulary

> A controlled set of strings that appear in instance data and must mean something stable.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A controlled set of strings that appear in instance data and must mean something stable. Every entry, whatever specialisation it is, carries the same substrate contract: a stable id, a version, a namespace, the `key` that is the string actually stored, optional label, description and aliases, and a status of active, deprecated, tombstone or retired, where absent means active. A vocabulary is `open`, meaning unlisted values are valid and unenriched, or `closed`, meaning every value must resolve to exactly one entry.

**Notes**: An open vocabulary's authoritative value set is the distinct keys actually in use, not the curated entry list — the curation is an overlay that may lag or be empty. Curating a string into a Term rewrites no instance.

## Container tags must resolve against Vocabulary Terms when a Vocabulary governs the key

**Number**: I-65

When a Vocabulary in the repository package declares Term entries for a given tag key, Container tags bearing that key MUST resolve against those Terms per RFC-006 vocabulary resolution rules. Free-string tags are valid when no Vocabulary entry governs the key.


## The two value sources a closed string Field may declare

The two declarations, exactly one of which a closed string Field carries:

```typescript
allowedValues?: string[]   // inline anonymous closed vocabulary (sugar; retained for simple cases)
vocabularyRef?: UUID       // LINEAGE (rfc-decision-c8704763) — bind to a named, installed
                           // Vocabulary by bare UUID; the effective package set resolves it
```


## The `VocabularyEntry` substrate contract

`VocabularyEntry`, in pseudo-IDL:

```typescript
{
  id: UUID                  // stable identity
  version: integer          // min: 1
  namespace: string
  key: string               // the string in instance data — unified across all specialisations
  label?: string            // optional in substrate; specialisations MAY tighten to required
  description?: string      // optional in substrate; specialisations MAY tighten to required
  aliases?: string[]        // alternate keys resolving to this entry
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active (normative)
  meta?: Record<string, unknown>   // arbitrary metadata; unknown top-level fields rejected
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```


## `vocabularyRef` — binding closed string fields to shared vocabularies

When `fieldType.valueDomain` is `"closed"`, a Field declares exactly one value source:

Example: the two value sources a closed string Field may declare.

`allowedValues` is formally sugar for an anonymous inline closed vocabulary: the value set is fixed by the Field definition, so changing it means a new Field version. `vocabularyRef` is a **configurable** data range — the value set is managed as package configuration and evolves without reversioning the Field — and is used when the set is shared, extensible, or needs Term identity. A `vocabularyRef` MUST resolve to a `Vocabulary` with `mode: closed`. Declaring both, or neither when `valueDomain` is `"closed"`, is a validation error.


## Vocabulary and Term

SRS defines four controlled vocabularies — sets of strings that appear in instance data and must mean something stable. They share a common substrate: a `VocabularyEntry` contract satisfied by `Term`, `LifecycleState`, and `RelationTypeDefinition`.


## `VocabularyEntry` (substrate contract)

`VocabularyEntry` is a contract, not a serialised type. Every conforming entry carries:

Example: the `VocabularyEntry` substrate contract.

**Absent `status` MUST be treated as `active`.** This is normative: all resolution rules (V1, V6, V9, V10) treat absent identically to `"active"`.

**Entries are keyed, not named.** Entries carry `key`, not `name`, and are addressed within their container. They are not independently `Reference`-able. Containers (`Vocabulary`, `Lifecycle`) have `name` and are the `Reference` targets.

**Required-field tightening.** `label` and `description` are optional so an emergent `Term` is valid before prose is written. A specialisation MAY tighten an optional substrate field to required; it MUST NOT relax a required one. `RelationTypeDefinition` requires both `label` and `description` (unchanged from RFC-005).

**One forward-compatibility policy.** Unknown top-level fields are rejected; arbitrary entry metadata goes in `meta`.


## `Vocabulary`

A named, versioned set of `Term` entries.

See *Generated reference: `Vocabulary`* for `Vocabulary`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.


## `Term`

The generalisation of `TagDefinition`. A defined option within a `Vocabulary`.

See *Generated reference: `Term`* for `Term`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.


## The four vocabularies

| Vocabulary | Binding scope | Container | Mode |
|---|---|---|---|
| Tags | ambient (whole repo) | `Vocabulary` (typically local, open) | `open` |
| Relation types | repo-global (any edge) | `package.relationTypes[]` (flat global set) | closed-extensible |
| Lifecycle states | type-bound, shareable | `Lifecycle` (inline or referenced) | `closed` |
| Field values | field-bound | `Vocabulary` via `vocabularyRef` or inline `allowedValues` | `closed` (V3) |


## Package integration

Vocabularies are Foundation-group definition types installed in packages alongside fields, types, and relationTypes:
- the distributable `Package` holds inline definitions: `vocabularies?: Vocabulary[]`
- the repository `package/package.json` holds relative paths: `"vocabularies": ["vocabularies/foo.json", ...]`


## Emergent vocabularies (open vocabularies)

For an open vocabulary, the authoritative set of values is `DISTINCT(tag keys across instances)` — not the `terms[]`. The `Vocabulary` is a curation overlay that may lag usage or be empty.

A conforming implementation MUST be able to compute the live tag set and classify each key as: **used-and-defined**, **used-but-undefined**, or **defined-but-unused**.

**Emergence lifecycle** (mirrors tier graduation):
1. Free string — exists, undefined, valid.
2. Curate → `Term` — non-destructive; instance carries the same string.
3. Alias-merge — a surviving Term absorbs another: absorbed key+aliases move to the survivor, absorbed entry removed (its `id` recorded in `meta.mergedFrom` and redirected); zero instance rewrites.
4. Optional normalize — opt-in operation that rewrites instance strings to the canonical key.
5. Optional close — promote `mode: open → closed` (V10).


## Resolution invariants

**V1 — Closed-vocabulary resolution.** Any value in a closed vocabulary must resolve to exactly one entry (matched by `key` or `alias`) in the effective entry set with `status` in {`active`, `deprecated`, `tombstone`} for reads and `active` for new writes.

Applies to: `Relation.relationType`, `select`/`multiselect` field values, `Record.lifecycleState`.

**V2 — Open-vocabulary resolution.** A value in an open vocabulary need not resolve; if it matches a `Term`, enrichment applies. When a value matches more than one entry (a warned V5 collision), resolution is deterministic: key match outranks alias match; ties broken by lexicographically smallest `id`.

Applies to: `Note.tags`, `NoteSection.tags`.

**V3 — Field binding exclusivity and closedness.** A `select`/`multiselect` Field must declare exactly one of `allowedValues` or `vocabularyRef`. A `vocabularyRef` on a `select`/`multiselect` Field MUST resolve to a `Vocabulary` with `mode: closed`.

**V4 — Vocabulary reference resolution.** A `vocabularyRef` must resolve to an installed `Vocabulary` in the effective package set.

**V5 — Effective entry set.** The effective entry set of a `Vocabulary` or `Lifecycle` is constructed as:
1. Include entries with effective `status` in {`active`, `deprecated`, `tombstone`}. Exclude `retired` entirely (before uniqueness, before V1).
2. Add transitively the entries of any extended container. The `extends*Version` must match the resolved upstream version; a mismatch is a hard validation error (not silent degradation).
3. Check uniqueness: duplicate `id`s are an error. In closed vocabularies, the union of all `key`s and `aliases` must be globally unique (key/key, key/alias, alias/alias collisions are errors). In open vocabularies, collisions are warnings (resolved by V2 tie-break).

Inline `Type.lifecycle` cannot extend; its effective set is its own `states`/`transitions`. V5 and V9 apply to inline lifecycles identically to referenced ones.

Excluding `retired` before uniqueness frees a retired key for reuse by a new entry. `tombstone` remains in the effective set and keeps occupying its key. When retiring a key that will be reused, implementations MUST surface stale references to the retiring key for operator resolution before reuse.

**V6 — Closed value status.** A value resolving to `deprecated` or `tombstone` follows RFC-005 E1 write semantics (resolves; new writes rejected). `retired` entries do not resolve under V1 — values referencing them are invalid as if absent.

**V10 — Open→closed promotion.** Version-bumping change with a mandatory pre-flight classifying in-use keys as:
- *will-be-invalid*: used-but-undefined, or resolving only to a `retired` entry (reads do NOT survive).
- *read-only-after-close*: resolves to `deprecated` or `tombstone` (reads survive; new writes rejected).
- *used-and-active*: fine.

A grace window is declared in `Vocabulary.promotionWindow.until`. Until that bound, violations are warnings; after it, V1 applies unconditionally. Absent `promotionWindow` means the promotion takes effect immediately. There is no unbounded window.
