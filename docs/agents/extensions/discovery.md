# Discovery

> A portable contract for asking a repository what it holds, split deliberately into two halves that behave differently.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

A portable contract for asking a repository what it holds, split deliberately into two halves that behave differently. Structured filters, over type, container, tag, tier and lifecycle state, are exact-match predicates: two conforming implementations with the same data must return the same set. Free-text content matching is a recall floor: every instance whose projected text contains the normalised query must be returned, and returning more, or ranking differently, is explicitly permitted. This is what lets a naive substring matcher and a semantic search engine both conform.

**Notes**: Matching runs over a deterministic text projection: an ordered sequence of segments derived from an instance by a stated rule about which fields are searchable, normalised at match time by Unicode NFC and case folding, with punctuation, diacritics and whitespace left intact.

## lifecycleStates in DiscoveryQuery is an inclusive multi-value lifecycle filter

**Number**: I-142

When DiscoveryQuery carries a non-empty lifecycleStates array, implementations MUST restrict the query result to instances whose lifecycleState matches any value in the array (OR semantics). An instance with no lifecycleState MUST be excluded when lifecycleStates is present and non-empty. When lifecycleStates is absent or empty, no filtering by this field is applied and all lifecycle states (including absent) are included. Implementations that do not declare ext:lifecycle MUST ignore lifecycleStates and MUST NOT produce a validation error on its presence.


## excludeLifecycleStates in DiscoveryQuery is an exclusion lifecycle filter applied after inclusion

**Number**: I-143

When DiscoveryQuery carries a non-empty excludeLifecycleStates array, implementations MUST exclude from the query result any instance whose lifecycleState matches any value in the array. When lifecycleStates and excludeLifecycleStates are both present and non-empty, inclusion filtering (I-142) MUST be applied first; exclusion filtering is then applied to the survivors. An instance with no lifecycleState is not excluded by excludeLifecycleStates (only instances with a matching non-null lifecycleState are excluded). When excludeLifecycleStates is absent or empty, no exclusion is applied. Implementations that do not declare ext:lifecycle MUST ignore excludeLifecycleStates and MUST NOT produce a validation error on its presence.


## Structured filter predicates are exact-match

**Number**: I-113

An implementation that declares `ext:discovery` MUST include in its DiscoveryQuery result set every instance that satisfies all specified structured filter predicates (`typeId`, `typeNamespace`, `typeName`, `containerId`, `tag`, `lifecycleState`, `excludeLifecycleStates`, `tier`), and MUST NOT include any instance that fails any specified structured filter predicate. (RFC-012 R1.)


## Content-match is a guaranteed recall floor

**Number**: I-114

For a `contentMatch` predicate with normalized query string `q`, an implementation that declares `ext:discovery` MUST include every instance whose Text Projection contains at least one `TextSegment` whose normalized `text` contains `q` as a substring (case-folded NFC substring match). (RFC-012 R2.)


## Extra content-match results are permitted

**Number**: I-115

An implementation MAY include instances beyond the recall-floor set defined by I-114 (e.g. via stemming, phonetic matching, or semantic similarity). Returning extra results does not violate `ext:discovery` conformance. (RFC-012 R3.)


## Result ranking is implementation-defined

**Number**: I-116

An implementation MAY rank DiscoveryQuery results in any order. The recall-floor guarantee of I-114 applies to inclusion in the result set only, not to rank position. (RFC-012 R4.)


## Structured filters and content-match compose by conjunction

**Number**: I-117

When both structured filters and `contentMatch` are specified on a DiscoveryQuery, an instance MUST satisfy all structured filter predicates (exact-match, I-113) AND the content-match recall-floor predicate (I-114). The structured-filter constraints cannot be overridden or widened by content-match extra recall. (RFC-012 R5.)


## containerId filter uses effective container membership

**Number**: I-118

A `containerId` filter predicate MUST match an instance exactly when its id is an entry `instanceId` of the named Container or, under RFC-034 [R8]'s scoping vocabulary, of a container in its `effective(C)` closure ([R18]). Entries are read flat and `depth` is ignored ([R3]); `rootInstanceIds` is removed ([R4]) and the closure itself is unchanged.


## Multi-tag filter uses AND semantics with vocabulary resolution

**Number**: I-119

A `tag` predicate with multiple values MUST use AND semantics — all specified tags must be present on the instance. Both query tags and stored instance tags are canonicalized via RFC-006 key-or-alias resolution when a Vocabulary is declared for the tag key; when no Vocabulary is declared, raw string comparison applies (case-sensitive). (RFC-012 R7.)


## Text Projection includes only Fields matching the RFC-032 searchability predicate

**Number**: I-120

For Tier 2, the Text Projection MUST include a Field only when `fieldType.datatype == "string"` and `fieldType.format` is absent or one of `"plain"`, `"markdown"`, or `"uri"`. `valueDomain` does not affect searchability. A single-cardinality Field emits one segment; a list-cardinality Field emits one segment per array element in order. Fields with `format: "uuid"` or `format: "email"`, or datatype `number`, `integer`, `boolean`, `date`, `date-time`, `ref`, `dependent`, or `map`, MUST NOT contribute `TextSegment`s. (RFC-012 R8; RFC-032 Rev-7 erratum.)


## Text Projection includes tags; display labels are optional

**Number**: I-121

The Text Projection MUST include `tags` array entries as `TextSegment`s after field segments. An implementation MAY additionally include `FieldAssignment.displayLabel` values as segments after tags — this is not required, and two conforming implementations may differ on whether display-label segments are included. (RFC-012 R9.)


## Text normalization is NFC + case folding, no stripping

**Number**: I-122

Normalization of `TextSegment.text` MUST apply Unicode Normalization Form C (NFC) followed by Unicode simple case folding (locale-independent). Implementations MUST NOT strip punctuation, diacritics, or whitespace during this normalization step; additional stemming or tokenization is permitted for ranking purposes only, not as a substitute for the normalized canonical search string. (RFC-012 R10.)


## Field facets

An implementation that reports none is unaffected, and `discovery.json` gains no shape. A client that wants a merged view can sum the facets that share a `field` label.

**[R3]** *(Facets are per Field.)* An implementation that reports per-field facets over a match set MUST make each reported facet correspond to exactly one Field `id`. Two facets in one result MUST NOT carry the same `fieldId`. Each facet MUST carry `fieldId` (the Field's `id`) and `field` (the Field's `name`). A value MUST be counted only in the facet of the Field that the record's version-pinned Type assigns, in its effective field set (RFC-040 Change A), at the key the value is stored under. A value whose Type does not resolve, or whose key matches no assignment, MUST NOT be counted in any per-Field facet. Where an implementation orders facets and two facets tie, it MUST break the tie by ascending lexicographic order of the `fieldId` string. Which Fields are eligible, the caps and the value ordering are implementation-defined, and MUST be decided per Field.

**[R5]** *(Every adapter agrees, and no client resolves.)* Over the same repository state, every adapter of one implementation (command line, embedded binding, MCP) MUST report the same Field id for the same authoring-projection property and the same facet. The ids that [R1]–[R3] require MUST be present in the output itself, so that no client needs to read Type or Field definitions to learn them.

Introduced by RFC-053 (`rfcs/rfc-053-field-id-beside-field-name.md`). Decision: `rfc-decision-43e84d63`.


## Field filters

A `DiscoveryQuery` can select Tier 2 Records by what their own fields hold, through `fieldFilters`: a list of filters, every one of which holds for a selected record. Each filter names one Field by `fieldId` and carries one test: `in`, `notIn`, `range` (date or numeric, both bounds included) or `missing`. Which value a filter reads is the mechanism Field filter values; how it compares, Field filter comparison; which queries are refused, Field filter refusals. Compositions consume the axis unchanged through the `discovery-query` section source.

Tests by Field datatype: `string` and `boolean` take `in`, `notIn`, `missing`; `integer` takes `in`, `notIn`, `range`, `missing`; `number` and `date` take `range`, `missing`; `date-time`, `ref`, `dependent` and `map` take `missing` only.

**[R1]** A `DiscoveryQuery` MAY carry `fieldFilters`, a list of field filters. An instance is selected only if every filter in the list holds for it, in conjunction with every other predicate of the query (RFC-012's conformance rule [R5]). An absent or empty `fieldFilters` MUST NOT change the selection.

**[R2]** A field filter MUST name exactly one Field by `fieldId`, and MUST carry exactly one of the tests `in`, `notIn`, `range` or `missing`. The `fieldId` MUST resolve by the rule that resolves a Type FieldAssignment's `fieldId`. The tests a filter may carry are fixed by the resolved Field's datatype, as listed in Change B.

**[R6]** A field filter MUST NOT hold for an instance other than a Tier 2 Record whose bound Type version's effective field set contains the named Field. Where no filter in the query is refused under [R7] or [R8], a filter whose `fieldId` resolves to no installed Field MUST select no instances, and the implementation MUST report a warning naming the unresolved id.

Introduced by RFC-056 (`rfcs/rfc-056-discovery-field-filters.md`). Decisions: `rfc-decision-91d52a0f` (the portable line), `rfc-decision-6a49ce32` (flat queries), `rfc-decision-131f1448` (numeric ranges as an evidence exception).


## Field filter comparison

How a field filter compares a value with its test (mechanism Field filters). Which value a filter reads, and when a field has none, is the mechanism Field filter values.

**[R3]** `in` MUST hold if and only if the field has a value and the value (for a list-valued field, at least one element) equals a listed value. `notIn` MUST hold if and only if the field has a value and no value (for a list-valued field, no element) equals a listed value. Comparison works as follows:
- Strings MUST be compared exactly, code point by code point, with no case folding or normalisation. The one exception is a Field with a `vocabularyRef`:
  - Listed and stored values MUST first be resolved to their term keys by RFC-006 key-or-alias resolution, over the Vocabulary's effective entry set only, never through a retired entry.
  - On an open Field, a value that resolves to no entry, or every value where the `vocabularyRef` itself resolves to nothing, MUST be compared exactly as written.
- Integers MUST be compared exactly by the decimal value written, so `2.0` equals `2`, and booleans by value.

**[R4]** `range` MUST hold if and only if the field has a value and the value (for a list-valued field, at least one element) lies within the bounds, both bounds included:
- On a `date` Field, the value MUST be a valid calendar date that is on or after the start of `from`, where given, and on or before the end of `to`, where given. Dates are compared as calendar dates, without time of day or timezone. A bound written as `YYYY` or `YYYY-MM` MUST be read as the whole year or month: its start for `from`, its end for `to`.
- On an `integer` or `number` Field, the value MUST be greater than or equal to `from`, where given, and less than or equal to `to`, where given, compared exactly by the decimal value each is written as, with no rounding of either the value or the bound.

A range whose `from` lies after its `to` MUST select nothing.

Introduced by RFC-056 (`rfcs/rfc-056-discovery-field-filters.md`).


## Field filter refusals

A query with an invalid field filter is refused, and none of it is evaluated (mechanism Field filters). Checks run over the whole query in order: malformed filters ([R7]), then filters that do not fit their resolved Field ([R8]), and only then evaluation, where an unresolved `fieldId` selects nothing with a warning ([R6]).

**[R7]** An implementation MUST refuse a query containing a malformed field filter, with an error and without evaluating any part of the query. A filter is malformed if any of these holds:
- it has no `fieldId`;
- it carries not exactly one test;
- it has an empty `in` or `notIn` list, or an empty string as a listed value;
- it has a `range` with neither bound;
- it has a `range` bound that is neither a JSON number nor a real date, month or year in the form `YYYY`, `YYYY-MM` or `YYYY-MM-DD`;
- it has a `range` with one numeric bound and one date bound.

This check applies to every filter in the query, whether or not its `fieldId` resolves.

**[R8]** Where the `fieldId` resolves, an implementation MUST refuse, with an error and without evaluating any part of the query, a query containing a field filter that:
- carries a test the Field's datatype does not allow;
- lists a value whose type does not match the Field's datatype;
- carries a `range` bound of the wrong kind for the Field: a number on a `date` Field, or a date on an `integer` or `number` Field;
- lists a value outside the domain of a closed Field: its `allowedValues`, or the keys and aliases of the entries in its bound Vocabulary's effective entry set (RFC-006); or
- targets a closed Field whose `vocabularyRef` resolves to no Vocabulary.

Introduced by RFC-056 (`rfcs/rfc-056-discovery-field-filters.md`).


## Field filter values

An empty string, list or object states nothing, so for a filter it is no value, unlike storage (RFC-039 [R5a]) and rendering (RFC-001).

**[R5]** The value of a field filter is the record's `fieldValues` entry under the resolved Field's `name` (RFC-039). The field has no value when that entry is absent, an empty string, an empty list, or (for a `map` or inline `ref` Field) an empty object. `missing: true` MUST hold if and only if the field has no value, and `missing: false` if and only if it has one. A field with no value MUST NOT satisfy `in`, `notIn` or `range`. A value that does not conform to the resolved Field's datatype, or to its closed domain, MUST NOT satisfy `in`, `notIn` or `range`. A value on an `integer` Field conforms if and only if it is a JSON number with an integral value. A number written as a JSON string conforms to neither `integer` nor `number`. On a list-valued Field, conformance MUST be judged per element.

Introduced by RFC-056 (`rfcs/rfc-056-discovery-field-filters.md`).
