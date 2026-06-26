> **GitHub issue**: [the-greenman/srs#83](https://github.com/the-greenman/srs/issues/83)

# RFC-012: Discovery Contract & Text Projection

**Status**: Accepted (Revision 6)
**Affects**: `Field` (`valueType` searchability classification), `Record` (Tier 2), `TypedRecord` (Tier 1), `Note` (Tier 0), `Container`, `ext:lifecycle`, new `discovery.json` schema
**Author**: Peter Brownell (scoped from srs-rust#213)
**Date**: 2026-06-26
**Builds on**: RFC-006 (Vocabulary Substrate — tags, lifecycle states), RFC-009 (Root-record Type anchor — container typing and membership definition)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-26 | Initial draft |
| 2 | 2026-06-26 | Address review findings (blocking): fix Note text projection to use `sections[].content` directly (close OQ-1); add normative tag-authority statement (instance file is canonical); align `containerId` filter with RFC-009 I-66's three-condition membership definition (condition 1 — rootInstanceIds membership — was missing); define Tier 1 "declaration order" as `fields[]` array position; specify that select/multiselect projection emits stored value as-is (no alias resolution during projection). **Should-fix:** remove `ext:views-l1` from Affects (display labels downgraded to MAY, close OQ-2); change `TextSegment.fieldId` type from `UUID` to `string`; use `"typed-record-field"` sentinel for Tier 1 instead of empty string; add normative `ext:repeatable-fields` carve-out (close OQ-3); clarify `typeId`+`typeNamespace` contradiction semantics; add `discovery.json` schema property table; add fixture timeline (must ship with RFC merge); remove duplicate inline R1 from Change D; update R6 (RFC-009 aligned); update R9 (MAY). **Nits:** add `field.json` row to schema changes table; guarantee all 8 valueTypes in fixture; add invariant numbering note. |
| 3 | 2026-06-26 | Address Rev 2 review findings. **Blocking:** add TypedRecord `title` field to Tier 1 projection (leading segment, sentinel `"typed-record-title"` — analogous to Note title treatment in Tier 0); fix Tier 1 step 1d (multiselect array path) to assign `fieldId = "typed-record-field"` and `fieldName = TypedField.name` explicitly (same sentinel as single-value fields). **Should-fix:** change R5 "must" → MUST; tighten R6 "sole authority" to permit explicit cache-then-fallback; add note on Tier 2 `fieldValues`-array-order vs `FieldAssignment.order` asymmetry; remove escape hatch from Change F (fixture MUST ship with RFC merge, no pre-fixture window); add tag-segment stored-value clarification to Alias-resolution rule. **Nits:** make Tier 2 step 1e explicit about fieldId/fieldName; add DiscoveryQuery.tier enum note; clarify TextSegment.text normalization timing (at match time, not segment construction); align expectedInstanceIds UUID format note; add discovery.json copy-before-check note. |
| 4 | 2026-06-26 | Fix one remaining blocking gap: Tier 1 step 1d (multiselect array path) was missing `text = String(element)` — fieldId and fieldName were added in Rev 3 but the text value was omitted. Added; closes the Tier 1 identical-segment-stream gap. Also added 'or an empty array' to step 1c skip condition for consistency. |
| 5 | 2026-06-26 | Implementation started; RFC file committed to branch rfc/011-discovery-contract-text-projection. |
| 6 | 2026-06-26 | Accepted; spec records authored in srs/srs — ext:discovery extension, Extensions section subsection (07-17), Key Invariants subsection (08-24), invariants I-012-1 through I-012-12, RFC-012 record. |

---

## Abstract

SRS has no portable definition of "find these records." Each client (CLI, web, future engine) reimplements filter logic independently, with no guarantee that the same query produces the same result set across implementations. This RFC defines the **Discovery Contract**: a set of structured filter axes that every conforming implementation MUST handle identically, a **Text Projection** that maps instance field values to a deterministic, ordered sequence of `TextSegment` structs, normalization rules for content matching, and a **consistency rule** that pins structured-filter semantics to exact-match while giving text matching a guaranteed-recall floor with latitude for extra ranking and recall. The RFC also defines non-goals (ranking algorithm, pagination, vector/semantic details) and a conformance fixture specification that must ship with the RFC.

---

## Motivation

### Problem 1 — No portable filter definition

`srs-web` implements a bespoke in-memory filter over record objects. The CLI (`srs record list`) implements a separate filter that accepts `--type` and `--container` but not tag, lifecycle, or text predicates. A future search engine would implement a third. None of these agree on edge cases: what does filtering by `typeNamespace` alone return? Does a container filter include transitively-nested instances? Should a `draft` lifecycle record appear in an unfiltered search?

Because there is no spec-level contract, each implementation diverges silently. A user who switches from the web UI to the CLI gets different result sets. A conformance test cannot be written.

### Problem 2 — No definition of what is "searchable" in an instance

SRS fields carry `valueType` — but nothing in the spec says which value types contribute to full-text content matching. A `boolean` field (`true`/`false`) is not useful as a search token. A `number` field (`42`) is similarly low signal and locale-ambiguous. A `string` field with value `"Evaluate vendor options"` is the obvious candidate for text search.

Without a spec-level searchability classification, two implementations that both "support text search" may produce different recall. An implementation that indexes `number` fields produces false positives; one that misses `select` values produces false negatives.

### Problem 3 — No deterministic text representation for an instance

Even given agreement on which fields are searchable, two implementations may order field contributions differently, apply different normalization (case folding, Unicode form), or include or exclude tags. This makes cross-implementation result comparison impossible and makes conformance fixtures unwritable.

### Problem 4 — No consistency rule between filter axes and content matching

Structured filters (type, container, tag, lifecycle) are amenable to exact, deterministic evaluation. Content matching is not: full-text engines add stopword removal, stemming, and ranking. Without a rule separating these two regimes, an implementation cannot know whether it is permitted to return zero results for a tag filter when the tag string appears only as a content token, or vice versa.

---

## Proposed Changes

### Change A — Discovery Query: structured filter axes

A **DiscoveryQuery** is a conjunction of zero or more structured filter predicates. An instance matches a DiscoveryQuery if and only if it satisfies all predicates whose values are specified (unspecified predicates are wildcards).

```
DiscoveryQuery {
  typeId?:          UUID           // exact match on Record.typeId
  typeNamespace?:   string         // exact match on Record.typeNamespace
  typeName?:        string         // exact match on Record.typeName
  containerId?:     UUID           // instance is a member of this container per RFC-009 I-66
  tag?:             string[]       // instance.tags contains ALL of the specified keys (AND semantics)
  lifecycleState?:  string         // exact match on Record.lifecycleState (ext:lifecycle)
  tier?:            0 | 1 | 2      // instance tier (Note=0, TypedRecord=1, Record=2)
  contentMatch?:    string         // free-text predicate (see Change B and Change D)
}
```

**Filter axis semantics:**

- `typeId` — matches only Tier 2 Records where `record.typeId == typeId`. Has no effect on Tier 0 or Tier 1 instances.
- `typeNamespace` and `typeName` — denormalized convenience. `typeNamespace` matches instances where `record.typeNamespace == typeNamespace`; `typeName` matches instances where `record.typeName == typeName`. Each is an independent predicate: both narrow the result set independently. When `typeId` is also specified, the implementation evaluates all three as an AND conjunction. A contradiction occurs only when the specified `typeNamespace` or `typeName` does not match the `typeNamespace`/`typeName` of the type resolved by `typeId` — in that case the result is an empty set. If `typeId` resolves to a type in the specified `typeNamespace`, the predicates are consistent and no contradiction exists.
- `containerId` — an instance is a member of a container when its `instanceId` satisfies at least one of the following three conditions (per RFC-009 I-66): (1) its `instanceId` appears in `Container.rootInstanceIds[]`; (2) its `instanceId` appears in `Container.memberInstanceIds[]`; (3) it is reachable via transitive `contains` Relation traversal from any instance in `Container.rootInstanceIds[]`. The authoritative source for membership is the instance file and the relations file — not the `instanceIndex` cache in `manifest.json`, which may be stale.
- `tag` — matches instances whose `tags` array contains ALL of the requested tag strings. RFC-006 vocabulary resolution is applied before comparison: if the repository declares a `Vocabulary`, each query tag string is resolved to its canonical `key` (via key-or-alias lookup), and the instance's stored tag strings are each resolved to their canonical key before matching. Two tag strings are considered equal if and only if their canonical keys are equal. If no Vocabulary is declared for a tag key, the raw string is used for comparison (case-sensitive exact match).
- `lifecycleState` — matches only instances where `lifecycleState` equals the specified string (case-sensitive). Instances without a `lifecycleState` field do not match a lifecycle predicate. Requires `ext:lifecycle`.
- `tier` — matches instances of exactly the specified tier. A `tier: 2` filter returns only Tier 2 Records.
- `contentMatch` — applies the Text Projection (Change B) and Content Matching rule (Change D). When absent, no text predicate is applied.

### Change B — Text Projection: `TextSegment` and the searchable-field rule

The **Text Projection** of an instance is a deterministic, ordered sequence of `TextSegment` structs. The projection is derived at query time from the instance's stored field values; it is not stored.

```
TextSegment {
  fieldId:    string  // the field definition's UUID for package-resolved fields;
                      // a sentinel string for special segments (see below)
  fieldName:  string  // the field definition's name (snake_case) for package-resolved fields;
                      // a sentinel string for special segments
  text:       string  // the normalized text value (see Change C)
}
```

**Sentinel values for `fieldId` and `fieldName`:**

| Segment source | fieldId | fieldName |
|---|---|---|
| Package-resolved field (Tier 2) | the field's UUID | the field's `name` (snake_case) |
| Tier 1 TypedRecord title | `"typed-record-title"` | `"typed-record-title"` |
| Tier 1 TypedRecord field | `"typed-record-field"` | the `TypedField.name` key |
| Note title | `"note-title"` | `"note-title"` |
| Note section | `"note-section"` | the `NoteSection.name` key |
| `tags` array entry | `"tag"` | `"tag"` |
| `FieldAssignment.displayLabel` | `"label"` | `"label"` |

**Searchable valueType classification:**

| valueType | Searchable | Rationale |
|---|---|---|
| `string` | YES | Human-readable text. The primary content type. |
| `text` | YES | Long-form prose. Always searchable. |
| `url` | YES | URL strings are searched as opaque tokens. |
| `select` | YES | The stored option value. Carries categorical meaning. |
| `multiselect` | YES | Each stored value contributes a separate segment. |
| `number` | NO | Locale-ambiguous; numeric predicate is out of scope for this RFC. |
| `boolean` | NO | True/false is not a meaningful search token. |
| `date` | NO | Date predicates (range, relative) are out of scope for this RFC. |

**Alias-resolution rule for select, multiselect, and tags:** the projection emits the **stored value as-is** for all three — field values for `select`/`multiselect`, and the raw tag string for `tags` array entries. Vocabulary resolution (RFC-006) is not applied during projection. This keeps projection stateless (no vocabulary load required) and ensures the segment stream is reproducible from the record file alone. Note: the `tag` filter axis (Change A) does apply RFC-006 resolution to both query and instance values — that is a filter-time operation, separate from projection. Callers who need canonical-key content matching may resolve query strings via the vocabulary and match against stored segment values.

**Text Projection algorithm — Tier 2 (Record), in order:**

1. For each `fieldValue` in the instance's `fieldValues` array, in the order they appear in the array:
   a. Resolve the field definition (by `fieldId`) from the package.
   b. If the field's `valueType` is not searchable (per the table above), skip it.
   c. If the `value` is null, absent, or an empty string, skip it.
   d. For `multiselect` (value is a JSON array): emit one `TextSegment` per array element, in array order, with `fieldId` = the field's UUID and `fieldName` = the field's `name`, and `text = String(element)`.
   e. For all other searchable types: emit one `TextSegment` with `fieldId` = the field's UUID, `fieldName` = the field's `name`, and `text = String(value)`.

   Note: `fieldValues` stored array position is used here, not `FieldAssignment.order`. The two orderings can differ; stored array order is intentional (it reflects the order in which values were set). The optional display-label step (step 3) uses `FieldAssignment.order` for its own ordering — that asymmetry is deliberate.

2. After all `fieldValues`, if the instance has a non-empty `tags` array: emit one `TextSegment` per tag string, in array order, with `fieldId = "tag"` and `fieldName = "tag"`.
3. After tags, an implementation MAY emit `TextSegment` entries for `FieldAssignment.displayLabel` values — one per non-empty display label, in `FieldAssignment.order` order, with `fieldId = "label"` and `fieldName = "label"`. This step is optional because `displayLabel` is rendering-only metadata that may require an additional package load. Two conforming implementations may differ in whether they include display-label segments; this is explicitly permitted.

**Tier 0 (Note) text projection:** Notes have `sections[]` as their structured content representation. The projection is:
1. If the Note has a non-empty `title`, emit one leading `TextSegment` with `fieldId = "note-title"`, `fieldName = "note-title"`, `text = note.title`.
2. For each entry in `note.sections[]`, in array order: if `content` is non-empty, emit one `TextSegment` with `fieldId = "note-section"`, `fieldName = sections[i].name`, `text = sections[i].content`.
3. After sections, if the Note has a non-empty `tags` array: emit one `TextSegment` per tag, in array order, with `fieldId = "tag"`, `fieldName = "tag"`.

Note: `NoteSection.content` is a required field in `note.json` and is always machine-readable. There is no "if stored" ambiguity.

**Tier 1 (TypedRecord) text projection:** TypedRecords store `fields[]` as an ordered array of `TypedField` entries. TypedRecords also have a top-level optional `title` property (outside `fields[]`). The projection is:
1. If the TypedRecord has a non-empty `title`, emit one leading `TextSegment` with `fieldId = "typed-record-title"`, `fieldName = "typed-record-title"`, `text = title`.
2. For each `TypedField` in `fields[]`, in array-position order (index 0 first):
   a. If `valueType` is present and is not searchable (per the table above), skip it.
   b. If `valueType` is absent and the stored `value` is not a JSON string and is not a JSON array, skip it. (When `valueType` is absent, only string-valued and array-valued fields are considered; all other non-string values have no agreed textual representation.)
   c. If `value` is null, absent, an empty string, or an empty array, skip it.
   d. For `multiselect` valueType or when `value` is a JSON array: emit one `TextSegment` per array element, in array order, with `fieldId = "typed-record-field"`, `fieldName = TypedField.name`, and `text = String(element)`.
   e. For all other cases: emit one `TextSegment` with `fieldId = "typed-record-field"`, `fieldName = TypedField.name`, `text = String(value)`.
3. After all `fields[]`, if the TypedRecord has a non-empty `tags` array: emit one `TextSegment` per tag, in array order, with `fieldId = "tag"`, `fieldName = "tag"`.

**`ext:repeatable-fields` carve-out:** Records that use the `entries[]` mechanism (repeatable field values, a separate extension) are explicitly out of scope for this RFC. An implementation MUST NOT index `entries[]` under `ext:discovery`. The ordering of repeatable-field entries will be specified by the RFC that defines `ext:repeatable-fields`. The conformance fixture MUST NOT include instances that use `entries[]`.

### Change C — Normalization rules

Before text matching, all `TextSegment.text` values MUST be normalized as follows:

1. Apply Unicode Normalization Form C (NFC).
2. Fold to lowercase using Unicode simple case folding (locale-independent; equivalent to `str.casefold()` in Python 3 or `String::to_lowercase()` in Rust).
3. Do not strip punctuation, diacritics, or whitespace — normalization is a floor; implementations MAY apply additional transformations (stemming, tokenization) for ranking and recall, subject to Change D.

The normalized form is the **canonical search string**. It is used for the recall-floor guarantee.

### Change D — Consistency rule: exact-match for structured filters, recall-floor for content

**Structured filter axes** (typeId, typeNamespace, typeName, containerId, tag, lifecycleState, tier) are **exact-match predicates**. An implementation MUST include every instance that satisfies all specified structured filter predicates, and MUST NOT include any instance that fails any specified structured filter predicate. The structured-filter result is deterministic — two conforming implementations with identical data MUST return identical result sets.

**Content matching** (the `contentMatch` predicate) is a **recall-floor rule**:

> **[R2]** If a `contentMatch` string `q` is specified, the implementation MUST include in its result set every instance whose Text Projection contains at least one `TextSegment` whose normalized `text` contains the normalized form of `q` as a substring (case-folded NFC substring match). This is the **guaranteed-recall floor**.
>
> **[R3]** An implementation MAY include additional instances beyond the recall-floor set (e.g. via stemming, phonetic matching, or semantic similarity). Returning extra results does not violate conformance.
>
> **[R4]** An implementation MAY rank results in any order. The recall-floor guarantee applies to inclusion only, not to rank position.
>
> **[R5]** When both structured filters and `contentMatch` are specified, an instance MUST satisfy all structured filter predicates (exact-match) AND the content-match recall-floor predicate. The structured-filter conditions impose an exact inclusion/exclusion constraint that `contentMatch` cannot override.

### Change E — New `ext:discovery` extension

A new extension `ext:discovery` is introduced to signal that a repository's implementing tool supports the Discovery Contract defined in this RFC. An implementation that declares `ext:discovery` in `manifest.json` → `declaredExtensions` MUST conform to Rules R1–R12 and the Text Projection algorithm (Change B) and normalization rules (Change C).

Implementations that do not declare `ext:discovery` are not required to conform to this RFC. Discovery is an opt-in capability, not a baseline SRS requirement.

### Change F — Conformance fixture specification

A conformance fixture is a self-contained SRS repository (the **discovery fixture repo**) with a defined set of instances, plus a set of **expected result sets** (one per named query scenario). An implementation that declares `ext:discovery` MUST produce result sets consistent with the fixture.

**Fixture shipping requirement:** The fixture repo and `scenarios.json` MUST be committed to the spec repository in the same merge commit that merges this RFC. An implementation MUST pass all fixture scenarios to claim `ext:discovery` conformance. Fixture ownership: the SRS spec repo maintainers.

The fixture repo and expected result sets live at:

```
srs/conformance/discovery/
  fixture-repo/        # a valid SRS repository (.srs/, manifest.json, package/, records/, relations/)
  scenarios.json       # named scenarios
```

Each scenario entry in `scenarios.json`:

```json
{
  "name":                "string",
  "description":         "string",
  "query":               { /* DiscoveryQuery */ },
  "expectedInstanceIds": ["uuid", "..."],
  "exactMatch":          true
}
```

For structured-filter scenarios, `exactMatch: true` — conforming implementations MUST return exactly the specified set.
For content-match scenarios, `exactMatch: false` — conforming implementations MUST return at least the specified set.

The initial fixture repo MUST contain at minimum:
- 8 Tier 2 Records across 3 Type definitions. Each of the 8 `valueType` values (`string`, `text`, `url`, `select`, `multiselect`, `number`, `boolean`, `date`) MUST appear as a field value in at least one fixture instance, so that the searchability classification table can be verified exhaustively.
- 2 Tier 1 TypedRecords (fields[] array-ordered, no `ext:repeatable-fields` entries).
- 1 Tier 0 Note (with at least one non-empty `sections[].content` and a non-empty `title`).
- Instances with `tags` set.
- Instances with `lifecycleState` set (requires `ext:lifecycle`).
- Instances distributed across 2 Containers (using `memberInstanceIds` and/or `rootInstanceIds` + `contains` relations).
- The fixture MUST NOT use `ext:repeatable-fields` `entries[]` (out of scope for this RFC).

---

## Conformance Rules

*Note: these rules will be assigned global invariant numbers (the next available range after RFC-010's I-77) when spec records are authored in Stage 6.*

> **[R1]** An implementation that declares `ext:discovery` MUST include in its result set every instance that satisfies all specified structured filter predicates, and MUST NOT include any instance that fails any specified structured filter predicate.

> **[R2]** For a `contentMatch` predicate with normalized query string `q`, the implementation MUST include every instance whose Text Projection contains at least one segment whose normalized text contains `q` as a substring.

> **[R3]** An implementation MAY include instances beyond the recall-floor set for content matching. Returning extra results is permitted and does not violate conformance.

> **[R4]** An implementation MAY rank results in any order.

> **[R5]** When both structured filters and `contentMatch` are specified, an instance MUST satisfy all structured filter predicates AND the content-match recall-floor predicate. The structured-filter constraints cannot be overridden by content-match extra recall.

> **[R6]** A `containerId` filter MUST use the three-condition membership definition of RFC-009 I-66: (1) `instanceId` in `Container.rootInstanceIds[]`, OR (2) `instanceId` in `Container.memberInstanceIds[]`, OR (3) reachable via transitive `contains` Relation traversal from any `rootInstanceIds[]` entry. The authoritative source for membership is the instance file and the relations file. An implementation MAY use `instanceIndex` as a cache for performance, but MUST treat the instance file and relations file as authoritative when they differ from the cache.

> **[R7]** A `tag` predicate with multiple values MUST use AND semantics — all specified tags must be present on the instance. Both query tags and stored instance tags are canonicalized via RFC-006 key-or-alias resolution (when a Vocabulary is declared) before comparison. When no Vocabulary is declared, raw string comparison applies (case-sensitive).

> **[R8]** The Text Projection MUST include searchable `valueType` fields only (`string`, `text`, `url`, `select`, `multiselect`). Fields with `valueType` of `number`, `boolean`, or `date` MUST NOT contribute segments.

> **[R9]** The Text Projection MUST include `tags` array entries as segments after field segments. An implementation MAY additionally include `FieldAssignment.displayLabel` values as segments after tags (not required).

> **[R10]** Normalization MUST apply NFC followed by Unicode simple lowercasing. Implementations MUST NOT strip punctuation, diacritics, or whitespace during normalization (additional stemming/tokenization is permitted for ranking).

> **[R11]** An implementation that declares `ext:discovery` MUST pass all structured-filter conformance scenarios (`exactMatch: true`) from the fixture at `srs/conformance/discovery/scenarios.json`.

> **[R12]** An implementation that declares `ext:discovery` MUST pass all content-match conformance scenarios (`exactMatch: false`) from the fixture — that is, its result set for each scenario MUST be a superset of the expected result set.

---

## Schema changes

| Schema file | Change |
|---|---|
| `discovery.json` | **New file.** Defines `DiscoveryQuery`, `TextSegment`, and `ConformanceScenario` shapes (see property table below). |
| `manifest.json` | No structural change required. `declaredExtensions` is already `type: array, items: { type: string }` with no enum constraint. Implementations may optionally validate the `"ext:discovery"` string. |
| `field.json` | No change. Searchability is derived from `valueType` class-wide; no per-field flag is added (see Alt A). |

**`discovery.json` property table:**

`DiscoveryQuery` (object, all properties optional):

| Property | Type | Description |
|---|---|---|
| `typeId` | string (uuid) | Exact match on Record.typeId |
| `typeNamespace` | string | Exact match on Record.typeNamespace |
| `typeName` | string | Exact match on Record.typeName |
| `containerId` | string (uuid) | Instance is a member of this container (RFC-009 I-66) |
| `tag` | string[] | AND-conjunction: all tags must be present on the instance |
| `lifecycleState` | string | Exact match on Record.lifecycleState |
| `tier` | integer; enum: 0, 1, 2 | Instance tier filter (JSON Schema: `enum: [0, 1, 2]`, not min/max) |
| `contentMatch` | string | Free-text recall-floor predicate |

`TextSegment` (object, required: `fieldId`, `fieldName`, `text`):

| Property | Type | Description |
|---|---|---|
| `fieldId` | string | UUID for package-resolved fields; sentinel string for special segments |
| `fieldName` | string | Field name or sentinel |
| `text` | string | The raw stored text value. Normalization (Change C: NFC + casefold) is applied at match time, not at segment construction time. |

`ConformanceScenario` (object, required: `name`, `description`, `query`, `expectedInstanceIds`, `exactMatch`):

| Property | Type | Description |
|---|---|---|
| `name` | string | Unique scenario identifier |
| `description` | string | Human-readable intent |
| `query` | DiscoveryQuery | The query to execute |
| `expectedInstanceIds` | string[], elements: format uuid | Minimum required result set (each element is a UUID string) |
| `exactMatch` | boolean | If true, result must be exactly this set |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

**Note on new-file sync:** `check-schema-sync.sh` only verifies that existing mirrored files match; it does not detect missing new files. Before running the sync check, manually copy `docs/schema/2.0/discovery.json` to both mirror locations.

---

## Rationale

### Searchability classification by valueType

The split — `string|text|url|select|multiselect` searchable, `number|boolean|date` not — is chosen on the principle that search is a **textual operation over human-readable values**. A `number` value like `42` has no stable textual representation across locale or format (is it `"42"`, `"42.0"`, `"$42.00"`?). A `boolean` (`true`/`false`) is not a discriminating search token. A `date` requires range semantics, not substring matching.

`url` is searchable as an opaque string because users commonly search by domain, path fragment, or protocol. `select` and `multiselect` are searchable because their values are meaningful categorical labels that appear verbatim in user queries.

### Substring match as the recall floor

The recall floor is defined as **substring containment** after NFC + lowercasing, not token intersection or BM25. Substring match is universally implementable (including on embedded or constrained environments with no FTS engine), produces a well-defined expected result set that can be specified in fixtures, and avoids tokenization disagreements. Implementations that want higher precision (token-based, stemmed, ranked) are free to add it — the floor guarantees users can always rely on a known minimum.

### AND semantics for multi-tag predicates

OR semantics would produce unexpectedly large result sets when multiple tags are specified; users constructing multi-tag queries intend narrowing, not broadening. AND is the conservative default; callers who want OR can issue multiple queries and union the results.

### Containment definition aligned to RFC-009 I-66

RFC-009 I-66 defines the three-condition container membership predicate for the `containers_for_instance` reverse lookup. RFC-012 uses the same predicate in the forward direction: given a `containerId`, which instances are members? Reusing I-66 ensures the two operations are inverses of each other and prevents implementations from diverging on edge cases like root-instance membership (condition 1) or deep graph traversal (condition 3). Using a different definition for the filter would break the symmetry property.

### Stored-value projection for select and multiselect

Vocabulary alias resolution requires loading the package Vocabulary — an additional I/O operation that may not be cached during discovery. Projecting the stored value as-is keeps the text projection stateless: it can be computed from the record file alone, without vocabulary access. This is important for embedded engines, incremental indexers, and conformance fixture evaluation. Callers who need canonical-key matching can resolve their query strings via RFC-006 and match against stored values directly; this is already what the `tag` filter axis does on the query side.

### Display labels as optional segments

`FieldAssignment.displayLabel` is rendering metadata, not semantic content. Making display-label segments optional preserves the principle that `displayLabel` is rendering-only (stated in the data model overview) and avoids mandating a Type FieldAssignment load during projection. Implementations that load Types for other reasons (e.g. view rendering) may include display labels as a bonus; implementations that skip them are still conformant.

### ext:discovery as an opt-in extension

Not all SRS repositories need search. Embedded, archival, or append-only repositories may never query content. Making discovery a declared extension rather than a baseline requirement preserves SRS's minimal core and allows implementations to signal their capability level explicitly.

---

## Alternatives Considered

### Alt A — Embed searchability as a field-level flag in `field.json`

A new boolean `searchable: true|false` on `FieldDefinition` would allow per-field opt-out. Rejected: the classification is derivable from `valueType` with no exceptions; a per-field flag would create divergence risk (authors forgetting to set it, mismatches between fields with the same type). The rule is cleaner as a type-level invariant. If a future `valueType` is introduced whose searchability is ambiguous, the RFC defining that type must specify its classification.

### Alt B — Include number/date fields as searchable with type-specific predicates

Range and numeric predicates are a distinct query axis from text search. Bundling them into the same `contentMatch` string would require parsing logic in every implementation. They are better handled as future structured filter axes (`numberRange?`, `dateRange?`) added by a future RFC, keeping this RFC's scope clean.

### Alt C — Define a pagination contract in this RFC

Pagination semantics depend heavily on the implementation's result ordering, which this RFC explicitly leaves to the implementation (R4). A pagination contract without a stable ordering guarantee is underspecified. Defer to a future RFC that also defines stable result ordering.

### Alt D — Use SHA-256 hashing of the text projection for conformance, not fixture repos

A fixture repo with explicit expected result sets is more legible and debuggable than hash comparison. Engineers need to understand *why* a test fails, not just *that* it fails. The fixture repo approach also serves as example data for implementors.

### Alt E — Resolve aliases during text projection for select and multiselect

Alias resolution during projection would make the segment stream canonical-key-based. Rejected: projection would then require loading the Vocabulary, making it non-stateless. The stored value is the authoritative value in the record; the alias relationship exists only in the Vocabulary definition. Callers can resolve on the query side (same pattern as the `tag` filter axis).

---

## Open Questions

**None.** All questions from Rev 1 are resolved:

1. **(OQ-1, closed)** Note body storage — resolved: Notes already have `sections[]` with `content` strings (`note.json`, required field). The text projection uses `sections[i].content` directly. No future RFC needed.

2. **(OQ-2, closed)** Display label segments — resolved: downgraded to MAY (step 3 of the projection algorithm). `displayLabel` is rendering-only metadata; mandating it adds load cost without semantic gain. See Rationale.

3. **(OQ-3, closed)** `ext:repeatable-fields` interaction — resolved: explicitly out of scope for this RFC. The conformance fixture MUST NOT include `entries[]` instances. The RFC defining `ext:repeatable-fields` must specify the projection ordering.
