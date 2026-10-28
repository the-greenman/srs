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
