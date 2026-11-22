> **GitHub issue**: [the-greenman/srs#1044](https://github.com/the-greenman/srs/issues/1044). Part of srs#726 (the first of its three proposed RFCs).

# RFC-056: Discovery filters on a record's own field values

**Status**: Draft (Revision 7)
**Affects**:
- `ext:discovery` (RFC-012, Accepted Revision 14; this RFC amends its surface, and RFC-012 gains a revision-history line at the fold).
- `DiscoveryQuery` in `discovery.json` and its inline copy in `composition.json`.
- The metamodel package's model of `DiscoveryQuery`.
- `SectionSource.discovery-query` (RFC-011, by consumption only).
- The discovery conformance fixture (`conformance/discovery/`).

Builds on:
- RFC-006 (vocabularies, Accepted);
- RFC-032 (`fieldType`, Accepted);
- RFC-039 (the name-keyed value carrier, Accepted);
- RFC-053 (field id beside field name, Implemented).

Uses, without depending on its outcome, the rule by which a Type's bare `fieldId` resolves (proposed by RFC-055, srs#1029, open).
**Author**: design dialogue draft (Claude Code, for the owner), from the research on srs#726
**Date**: 2026-11-21

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-11-21 | Initial draft: the first of the three RFCs proposed on srs#726 (research comment of 2026-11-21) |
| 2 | 2026-11-21 | Review round 1 (two reviewers, srs#1044). The four blocking findings: a filter finds its value through the Field's name, and `null` is never stored (RFC-039); closed values bound to a Vocabulary resolve aliases as tags do (RFC-006, RFC-012 [R7]); a value outside a closed field's domain is refused; and the fixture changes are named. Also: inherited fields count; failure precedence is stated; non-conforming stored values never match; the resolution rule is decoupled from RFC-055's outcome; the real reason for the inline schema copy is given, with the existing guard as model; the metamodel and the RFC-012 revision line are added to the fold; the readers that break are named; Open Questions renumbered, and the former OQ6 moved to Motivation as a finding |
| 3 | 2026-11-21 | Review round 2 (srs#1044): two blocking findings, both fixed. The four existing scenarios whose expected sets grow are named (the new article carries no lifecycle state), and the landing order is stated so the reference implementation never fails its own conformance test. Also: one failure order for the whole query; an unresolved `fieldId` now MUST warn, with the reason it is not refused; alias resolution applies to any Field with `vocabularyRef`, with refusal kept for closed Fields; the domain is RFC-006's effective entry set, and a stored out-of-domain value never matches; the "no value" rule is set against RFC-039 [R5a] and RFC-001; the record's bound Type version decides its effective field set; the metamodel work and its closure exclusion are listed; the validator gaps for `minLength` and `minProperties` are stated; `generation-ledger.md` is added; the routing to the Open Questions is corrected; and a new Open Question 7 lists the drafted mechanics the owner approves by accepting |
| 4 | 2026-11-21 | Review round 3 (srs#1044): zero blocking findings from both reviewers, so the review loop ends here. The should-fix findings are folded in anyway:
- the metamodel precedent is corrected: `DiscoveryQuery` has zero closure exclusions today, and this RFC introduces the first;
- the landing order is given as steps across the two repositories, with the one short red window named;
- the new fixture values avoid every existing `contentMatch` string, and the new article carries no tags;
- an unresolvable `vocabularyRef` is ruled;
- an unresolved value on an open Vocabulary-bound Field compares as written;
- values are never resolved through retired entries, and the consequence for records still holding them is stated;
- Open Question 7 gains the two mechanics that break expectations;
- the article Type gains its Fields in place;
- the claim about the reference implementation's behaviour is dropped. |
| 5 | 2026-11-22 | Owner direction: `range` extends to `integer` and `number` Fields, with numeric bounds, both bounds included, compared by numeric value. `number` gains no `in` or `notIn`, because exact equality on decimals is the fragile case. A bound of the wrong kind for its Field is a misfit under [R8]. New scenarios use the fixture's existing `word_count` and `read_minutes` values. `date-time` stays deferred, and Open Question 4 narrows to it. Alt F is rewritten to match. |
| 6 | 2026-11-22 | Review round 4 (srs#1044): zero blocking findings from both reviewers. The should-fix findings are folded in:
- numbers compare exactly, by the decimal value written, with no rounding;
- an `integer` Field's value conforms when it is integral (`2.0` conforms, `2.5` does not), a numeric string never conforms, and conformance is judged per element;
- bounds are compared as given;
- `read_minutes` gains values on two more articles, so the integer scenario proves fractional and inclusive bounds;
- the reason `number` has no `in` is corrected: it is about computed values, not about implementations disagreeing;
- what numeric ranges foreclose is stated;
- the evidence exception is recorded under `rfc-decision-4f1e12e5`;
- a Rationale paragraph is added;
- the metamodel gap is restated, as three parts;
- Open Question 4 says why its bar differs;
- Open Question 7 gains two mechanics. |
| 7 | 2026-11-22 | Owner rulings on every Open Question, all as recommended: OQ1 and OQ2 are recorded as decisions at acceptance (OQ2 with its review trigger), OQ6 accepts independently of RFC-055, OQ7 accepts all thirteen mechanics, and the deferrals OQ3–OQ5 are agreed. |

---

## Charter alignment

**Cell(s):** cell:conformance, cell:identity, cell:reference, cell:portability
**Decision mode:** complex

srs#726 is classified complex. This RFC answers three of its seven questions, for field values only:
- where the portable line sits (Open Question 1);
- whether OR enters (Open Questions 2 and 3);
- which value predicates belong (Change B; Open Question 4 holds only the deferred `date-time` range).

The owner has not yet ruled on them. This RFC therefore does not resolve them by citing a cell. It maps the options below, proposes answers, and routes them to the owner:
- **Owner rulings:** Open Questions 1, 2, 6 and 7, all ruled on 2026-11-22 as recommended.
- **Deferrals with a recommendation:** Open Questions 3, 4 and 5. They need no ruling for acceptance; the owner agreed all three on 2026-11-22.

The narrower mechanics (the test per datatype, the empty-value rule, the failure rules) follow from those rulings, and are drafted here so the rulings have something concrete to rule on. Open Question 7 lists every drafted mechanic that no earlier decision settles. The rest follow from those and from the cited RFCs.

**Consequence map.** The cells the decision genuinely touches, and how the options fall along their axes:

| Cell | What it asks of a query filter | Proposal | Alternatives and where they land |
|---|---|---|---|
| ♒ Conformance, *one way over many* | One selection mechanism, and one rule for one kind of value | Extend the one `DiscoveryQuery`. Closed values bound to a Vocabulary compare exactly as tags do (RFC-012 [R7]) | Derived tags (today's practice) are a second, stale way to answer the same question. A boolean-expression language is one way, but with a far larger surface every implementation must match. Comparing field values unlike tag values is two rules for one kind of value |
| ♉ Identity, *identifier over label (outputs too)* | Address a Field by id | `fieldId` only | A field name is a label, and names collide across packages (srs-programme's `kind` splits across Fields, `rfc-decision-43e84d63`) |
| ♎ Reference, *declared strength over convenient reach* | Say how the reference resolves | `fieldId` resolves exactly as a Type's own `fieldId` does | KEYED by `namespace/name` is convenient, but it is a second spelling for the same target |
| ♓ Portability, *preserve over recognize* | The same query gives the same set everywhere | Only tests whose result set is defined exactly. Partial date bounds have one stated meaning, and invalid filters are refused, not guessed | Ranking, stemming or similarity inside the filter would make results implementation-specific |

Column coherence. The Earth column (Identity, Containment, Repository) and the Air column (Description, Reference, Conformance) both point the same way: identifiers over names, one mechanism, the meaning stated once. Nothing in the proposal pulls one column against another.

Emergence. Two effects appear only when the cells are read together:
- **Derived tags are no longer needed.** The derived-tag pattern (`month-YYYY-MM`, category tags) stops being necessary. A repository's tags go back to being claims someone made, rather than caches someone must refresh.
- **A small agent gets a bounded answer.** It can ask "documents of this kind, dated in August" in one call. That is the immediate goal of srs#726's story semanticops.com#68.

**Governing cell preference:**
- **Conformance: one way over many.** Aligned. The goal "select records by what their fields hold" has no mechanism in the standard today. The proposal adds it to the one query construct, not beside it. The Composition consumes it through the existing `discovery-query` section source. Vocabulary-bound values follow the rule the `tag` axis already uses.
- **Identity: identifier over label (outputs too).** Aligned. A filter names its Field by `fieldId`. The field name is not accepted in the standard query.
- **Reference: declared strength over convenient reach.** Aligned. The reference strength is stated: a bare UUID, resolved by the rule that already governs a Type's `fieldId`.
- **Portability: preserve over recognize.** Aligned. Every filter has an exact result set, proven by shared fixtures.

**Axis preference:**
- **5–11 Succession/Conformance, Reliability over Renewal.** Default pole taken. The change is additive: no existing query, section or record changes meaning.
- **6–12 Containment/Portability, Portability over Possession.** Default pole taken. Nothing in a filter depends on an index or on an implementation's extension.
- **1–7 Versioning/Reference, Semantic Integrity over Practical Expression.** Default pole taken. A filter reads values already stated on records. It never carries a fact of its own.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0750c62f, rfc-decision-0118e938, rfc-decision-4f1e12e5, rfc-decision-43249f53, rfc-decision-43e84d63, rfc-decision-7255aecc, rfc-decision-c8704763, rfc-decision-b2ff7c91, rfc-decision-c20fcff8, rfc-decision-2e0cd70a, rfc-decision-7caca3a1, rfc-decision-e99a9437.

**Contradictions found:** None that this RFC overrides. One deliberate exception is recorded, and two other decisions are close enough to state:
- **`rfc-decision-43249f53`** rejected "two tiers of one mechanism" as a seam where drift creeps in. This RFC adds no optional tier: every filter in it is a required part of `ext:discovery`. Whether later, costlier predicates (a relation walk) should be optional is left to the relation RFC, and is flagged there against this decision.
- **`rfc-decision-4f1e12e5`** removed unused machinery and requires anything returning to be evidence-shaped. The evidence for field filters is on srs#726. A private repository of about 600 records derived about 280 `month-` tags to stand in for one date filter. srs-rust#1240 asks for closed-field equality for the facet drill-down. **Numeric ranges are a deliberate exception to this decision's evidence rule.** They have no real-use case yet, and are included by owner direction (2026-11-22). Ordering is a new comparison, not one integers already need for `in`. The exception rests on cost: the bound shape, the open-end and empty-range rules, and the misfit checks already exist for dates. Accepting this RFC approves the exception (Open Question 7). Review trigger: if no repository, Composition or agent query uses a numeric range by the time RFC-012 next changes revision, that revision proposes removing it. `date-time` is left out, because it needs a timezone rule of its own (Open Question 4).
- **`rfc-decision-2e0cd70a`** keeps definitions reject-unknown. Its consequence is stated in *What breaks*: an older reader refuses a Composition that uses `fieldFilters`.

**One-way-per-goal:** No existing mechanism selects records by field value:
- Facets (RFC-053) count values but do not filter.
- `contentMatch` searches text segments of string fields only (RFC-012 [R8] excludes number, date and boolean fields from the text).

The proposal collapses onto `DiscoveryQuery`, the existing selection mechanism, and adds no second one. It follows the pattern already set by `lifecycleStates`: OR as a list of values inside one axis.

**Layer test:**
- **Which layer owns this?** The EXPRESSION plane, selection layer: `DiscoveryQuery`. Composition consumes it unchanged.
- **Consume or clone downward?** Consume. A filter reads two lower layers through the existing reference taxonomy:
  - the Field definition (definitions layer), for its datatype, domain and name;
  - the record's `fieldValues` (instances layer), for the value.
- **Does the layer below stand alone without this?** Yes. Fields, Types, Vocabularies and Records are unchanged and fully valid without any query.

**Level test (`rfc-decision-c20fcff8`):** a repository can declare a filter, in a Composition section's stored query. An implementation can check every rule:
- **[R1]–[R6]:** by `exactMatch: true` scenarios on the discovery fixture.
- **The warning [R6] requires:** by each implementation's own tests, since a scenario expects only a set.
- **[R7] and [R8]:** by each implementation's own tests that the refused queries are refused. The shared `ConformanceScenario` shape cannot yet expect an error (Open Question 5).

Two statements in this RFC fail the level test, and are kept out of the conformance rules on purpose. They govern how future RFCs are written, not what an implementation does, so they are proposed as decision records instead (Open Questions 1 and 2):
- "a portable predicate has an exact result set";
- "OR only as a value list".

**Integration manifest (for the fold, Stage 6):**
- `schema:discovery.json` and `schema:composition.json`.
- New invariants for [R1]–[R8] under the Discovery concept, given the next free invariant numbers at fold time.
- The metamodel records listed under *Schema changes*, with their closure exclusion.
- A Door 3 revision-history line on RFC-012, as RFC-053 added for RFC-012 Revision 14.

---

## Abstract

A `DiscoveryQuery` can select records by type, tag, container, lifecycle state and text, but not by what a record's own fields hold. This RFC adds one optional axis, `fieldFilters`: a list of filters, all of which must hold. Each filter names a Field by id and tests its value in one of four ways: one of a set of values, none of a set, a date or numeric range, or no value at all. It is the first of three RFCs proposed on srs#726, and answers three of that epic's questions for field values (see Charter alignment). It changes nothing for an existing query. It lets a Composition section or an agent ask "documents of kind *email*, dated in August 2026" without a derived tag.

---

## Motivation

### Problem 1: the most common questions about a repository cannot be asked

An agent or a section wants records of a given kind, records in a given state, or records dated in a given period. Each of those is a fact already stated on the record, in a field. None of them can be selected:
- `contentMatch` searches text segments of string fields only. RFC-012 [R8] excludes date, number and boolean fields from the text projection, so "dated in August" cannot even be phrased as text.
- Facets (RFC-053) report how many records carry each value of a closed field. Nothing lets a query narrow to one value. srs-rust#1240 asks for exactly that drill-down, and is blocked on this RFC.

### Problem 2: repositories work around it with derived tags that go stale

The workaround in real use is to copy the field value into a tag and select by tag. The private repository reported on srs#726 did this twice. It holds about 600 records, used through a connector:
- a `month-YYYY-MM` tag on about 280 records, from their date fields;
- category tags derived from relations.

A script on a 10-minute timer keeps them current, which has two costs:
- between runs the tags are wrong;
- a record an agent files without the tag is invisible to every query that uses it.

The tag is a second copy of a fact that already has a home. That is the drift the layer rules exist to prevent (rule 1, one home).

### Problem 3: small agents pay for the missing filter in calls and context

Without a filter, an agent lists a type, reads each record, and filters in its own context. The same private repository holds 115 document records. "Its emails from August" is one bounded call with a filter, and a hundred reads without one. Story semanticops.com#68 (Must, under srs#726) makes working with smaller agents on cross-referenced data immediate work, and this filter is the cheapest part of it.

### A finding from the research, recorded here so it is not re-opened

The srs-programme "subtree" case on srs#726 asked for `containerId` to reach sections nested by their anchor record. `containerId` already reaches every declared child container (`effective(C)`, I-118). Sections nested only by anchoring are not declared children, so by `rfc-decision-0750c62f` (membership is declared) they are correctly outside it. That case needs the repository to declare its sections as `childContainerIds`. It needs no query change, and this RFC makes none.

---

## Proposed Changes

### Change A: a `fieldFilters` axis on `DiscoveryQuery`

`DiscoveryQuery` gains one optional property, `fieldFilters`: a list of field filters.
- A record is selected only if **every** filter in the list holds for it.
- As for every other axis, the record must also satisfy every other axis in the query: the conjunction of RFC-012's conformance rule [R5] (structured and content predicates compose by AND).
- An empty list, or an absent property, selects as if there were no filter. Existing queries are unaffected.

Each filter names one Field by its `fieldId` and carries exactly one test:

| Test | Holds when | Meaning in practice |
|---|---|---|
| `in` (a non-empty list of values) | the field has a value, and the value is one of those listed | "kind is email or letter" |
| `notIn` (a non-empty list of values) | the field has a value, and the value is none of those listed | "status is anything but archived" |
| `range` (`from`, `to`, or both) | the field has a date or numeric value within the bounds, both bounds included | "dated in August 2026", "between 40 and 80 words" |
| `missing` (`true` or `false`) | `true`: the field has no value; `false`: it has one | "documents with no date yet" |

Two consequences follow from these definitions, and both are deliberate:
- **A record with no value never matches `in`, `notIn` or `range`.** "Status is anything but archived" does not silently include records with no status. Asking for those is a separate `missing: true` filter. A reader who wants both runs two queries, or waits for OR across filters, which this RFC does not add (Open Question 2).
- **OR exists only inside one filter, as its list of values.** There is no way to say "kind is email OR status is draft". This keeps every query a flat conjunction, as `DiscoveryQuery` is today. `lifecycleStates` already works this way: it is a list of states, any of which matches.

### Change B: which tests apply to which kind of field

The test a filter may carry depends on the Field's `fieldType.datatype` (RFC-032). That way every comparison has one meaning:

| Field datatype | Tests allowed | How values compare |
|---|---|---|
| `string` | `in`, `notIn`, `missing` | Exactly, character for character, with no case folding or normalisation. One exception: a Field bound to a Vocabulary (`vocabularyRef`) resolves aliases first, as described below. Matching words in text is `contentMatch`'s job, not this one's. |
| `integer` | `in`, `notIn`, `range`, `missing` | By numeric value, so `2.0` equals `2`. |
| `number` | `range`, `missing` | By numeric value, as described below. No `in` or `notIn`. |
| `boolean` | `in`, `notIn`, `missing` | `true` or `false`. |
| `date` | `range`, `missing` | By calendar date, as described below. |
| `date-time`, `ref`, `dependent`, `map` | `missing` only | Not filterable by value in this revision (Open Question 4). |

**List-valued fields** (`cardinality: list`) are compared element by element:
- `in` holds when **any** element is listed;
- `notIn` holds when the list has at least one element and **no** element is listed;
- `range` holds when **any** element falls within the bounds.

**Fields bound to a Vocabulary.** A Field with a `vocabularyRef`, open or closed, resolves aliases before comparison. Both the listed values and the stored values are resolved to their term keys (RFC-006 key-or-alias resolution), exactly as the `tag` axis already does when a Vocabulary is declared (RFC-012 [R7]). `in: ["e-mail"]` therefore matches a stored `email` when `e-mail` is an alias of the `email` term. One rule then holds for one kind of value, whether it sits in a tag or a field.

Resolution has four limits:
- **Same rule as the Field.** The `vocabularyRef` resolves by the same rule as the filter's `fieldId` (Change D).
- **Only the effective entry set.** Resolution uses only entries in the Vocabulary's effective entry set (below), never a retired entry.
- **Unresolved values on an open Field compare as written.** On an open Field, a listed or stored value that resolves to no entry is compared exactly as written.
- **A `vocabularyRef` that resolves to nothing.** On a closed Field the filter is a misfit, because its domain cannot be known, and the query is refused under [R8]. On an open Field, values compare exactly as written, and the implementation reports a warning.

**Closed fields.** A Field with `valueDomain: closed` has a declared domain:
- one of its `allowedValues`; or
- a key or alias of an entry in its bound Vocabulary's **effective entry set** (RFC-006). That set follows `extends`, includes tombstoned entries, and excludes retired ones.

Every listed value must belong to that domain. A value outside it (`in: ["publshed"]`) is a misspelling, so the query is refused (Change D): returning an empty set would look like a real answer. The domain check applies to closed Fields only. An open Field with a Vocabulary resolves aliases, but accepts any listed value.

**Dates.** A stored `date` value is a full calendar date (`YYYY-MM-DD`, JSON Schema `format: date`), compared as a calendar date with no time of day and no timezone.
- **Bound precision.** A range bound may be written to the day, the month or the year (`2026-08-14`, `2026-08`, `2026`). It must name a real date, month or year: `2026-13` and `2026-02-30` are refused.
- **A coarse bound covers its whole period:**
  - `from: "2026-08"` means on or after 1 August 2026;
  - `to: "2026-08"` means on or before 31 August 2026;
  - so `{from: "2026-08", to: "2026-08"}` is the whole of August.
- **Open ends.** A range with only `from` is open-ended forward, and one with only `to` is open-ended backward. A range with neither is refused.
- **An empty range is valid.** A range whose `from` begins after its `to` ends is valid and selects nothing.

This is the precision rule FHIR search uses for partial dates. It removes the ambiguity of comparing "2026" with "2026-08-14", without asking every client to expand a month into its first and last days.

**Numbers.** On an `integer` or `number` Field, a range's bounds are JSON numbers. A value is compared with them **exactly, by the decimal value it is written as**, with no rounding: `2.50` equals `2.5`, `150` equals `150.0`, and `9007199254740993` is greater than `9007199254740992`. An implementation that reads numbers as binary floating point must compare such values exactly anyway, for example by keeping the written digits. One rule then gives one answer for every value, including integers beyond 2^53 and values with many digits.
- **What a number Field holds.** A stored value on an `integer` Field conforms when its value is integral: `2.0` conforms, and `2.5` does not. A number written as a string (`"42"`) conforms to neither datatype. A value that does not conform never matches (Change C).
- **Bounds are compared as given.** No bound is rounded or truncated. `{from: 2.5}` on an integer Field means 2.5 or more, which selects 3 and above.
- **Both bounds included.** `{from: 40, to: 80}` selects 40, 80 and everything between. There is no exclusive bound in this revision. On an integer Field that costs nothing, because "less than 5" is `to: 4`. On a `number` Field, "strictly less than 5" cannot be said. An exclusive form could be added later without changing the meaning of any existing query.
- **Any number may bound either datatype.** An integer Field accepts a fractional bound, compared as given (above).
- **Open ends and empty ranges** work as for dates: only `from` or only `to` is open-ended, neither is refused, and a `from` greater than its `to` selects nothing.
- **A bound must suit its Field.** A numeric bound on a `date` Field, or a date-string bound on a number Field, does not fit, so the query is refused (Change D). That includes `{from: 2026}` on a `date` Field: a year bound is the string `"2026"`, never the number.

`number` has a range but no `in` or `notIn`. Under exact comparison, implementations agree on equality as well. The reason is the stored values. Decimals are often measured or computed, and a value computed as `0.1 + 0.2` is stored as `0.30000000000000004`, which is not `0.3`. An `in: [0.3]` filter would miss it and look like a true answer. A one-point range `{from: 0.3, to: 0.3}` misses it just the same. But the author has written a range, so widening it to a tolerance (`{from: 0.29, to: 0.31}`) is the obvious next step. The asymmetry does not remove the risk. It makes the author state the comparison.

**What this forecloses, and what it costs later.**
- "Strictly less than 5" cannot be written on a `number` Field; the nearest is "5 or less".
- Equality on a decimal can be written only as a one-point range.
- Adding exclusive bounds later means a new key on `range`. Readers built before that change refuse a query using it, as they refuse `fieldFilters` today (*What breaks*; `rfc-decision-2e0cd70a`). The same holds for a later `date-time` range. Existing queries keep their meaning in both cases.

### Change C: how a filter finds the value, and which records it can see

**Finding the value.** A filter names its Field by id, but a record stores values by Field **name** (RFC-039 [R2b]). A filter therefore:
1. resolves its `fieldId` to a Field definition (Change D);
2. takes that Field's `name`;
3. reads the record's `fieldValues` entry under that name.

**No value.** A field has **no value** when its entry is any of these:
- absent;
- an empty string;
- an empty list;
- for a `map` or an inline `ref` Field, an empty object.

RFC-039 [R5] already rules that `null` is never stored: an absent key is the only way to say "unset". Every other entry is a value.

This is a third presence rule, and it differs on purpose from the other two:
- RFC-039 [R5a] counts an empty string as present, because it governs storage: an empty string is a stored value.
- RFC-001 Step 2 treats a null or empty-string value as absent when rendering, so that empty fields are not printed.

A filter asks a third question: has anyone stated something here? An empty string, list or object states nothing, so for a filter it is no value. An empty object stored on a Field of another datatype is a value that does not fit (below).

**Values that do not fit.** Some stored values do not conform to the resolved Field's datatype, or to its closed domain. Examples:
- a date that is not a valid `YYYY-MM-DD`;
- a value written under an older version of the Field with a different datatype;
- a closed value whose Vocabulary entry has since been retired;
- a number written as a string (`"42"`) on a number or integer Field, or a non-integral number on an integer Field.

Such a value has a value, so `missing: false` holds for it. It never satisfies `in`, `notIn` or `range`. On a list-valued Field, each element is judged on its own: a non-conforming element never matches, and the other elements still can. Validation already reports such values. A filter does not guess at what they meant.

One consequence follows: no field filter can select the records that still hold a retired value. Listing the retired value is refused, since it is outside the domain, and the stored value matches no test. Those records are found by validation, which reports values outside a closed domain, or by RFC-006's V10 migration pre-flight, which exists for exactly this.

**Which records a filter can see.** A field filter can only hold for a **Tier 2 Record whose Type's effective field set contains that Field**. The effective field set is that of the Type version the record is bound to (`typeId@typeVersion`): its own FieldAssignments plus, under `ext:type-inheritance`, its inherited ones (`type.json`, Rule [N+33]). Two cases follow:
- A record of a Type whose effective field set lacks the Field never matches the filter, not even `missing: true`. "Documents with no date" therefore never returns events or people.
- A Note (Tier 0) has no Type and no fields, so a query with a field filter never returns a Note. This matches how the type axes already behave.

### Change D: how a filter names its Field, and what happens when it cannot be evaluated

**Naming the Field.** The `fieldId` is a bare Field UUID. It resolves by **the same rule that resolves the `fieldId` of a Type's FieldAssignment**, so the filter and the Type always agree on which Field definition is meant. RFC-055 (srs#1029) proposes that rule: the highest installed version, I-155. If RFC-055 is accepted, a filter follows it. If it changes or is rejected, a filter follows whatever rule replaces it, with no amendment here.

The resolved Field's datatype and domain decide which tests are allowed. Field names are not accepted, for two reasons: names are labels, and two packages may define Fields with the same name (`rfc-decision-43e84d63`). An implementation's own tools may still let a person or an agent type a field name and resolve it to an id before the query runs. The query that is evaluated must still carry the id.

**Failure cases.** These are checked over the whole query, in this order, so every implementation gives the same outcome even when a query has several faults:
1. **A malformed filter makes the query invalid, whatever its Field.** A filter is malformed when:
   - it lacks a `fieldId`;
   - it carries no test, or more than one;
   - it has an empty `in` or `notIn` list, or an empty string as a listed value;
   - it has a `range` with neither bound, or a bound that is neither a JSON number nor a real date, month or year;
   - it has a `range` with one numeric bound and one date bound.
   
   These checks need no Field, and they always apply.
2. **A filter that does not fit its resolved Field makes the query invalid.** This is checked for every filter whose `fieldId` resolves, and covers:
   - a test the datatype does not allow (a `range` on a string, or `in` on a `number`);
   - a listed value of the wrong type (`in: ["yes"]` on a boolean);
   - a range bound of the wrong kind (a number on a `date` Field, a date on an `integer` or `number` Field);
   - a listed value outside a closed Field's domain.
3. **A `fieldId` that resolves to no installed Field selects nothing.** This is checked only once no filter has failed checks 1 or 2. The datatype and domain checks cannot apply to such a filter, because there is no Field to check against. The query is evaluated, selects no instances, and the implementation must report a warning naming the unresolved id.

   The reason this case is an empty answer and not a refusal is portability. A Composition in a package may name a Field from an optional package that a given repository has not installed. A refusal would stop that whole document rendering, where an empty section is the true answer for that repository. The required warning keeps a mistyped id from passing silently.

   This rule covers field filters only. RFC-012 is silent on a `typeId` or `containerId` that names nothing, and this RFC does not change that.

An invalid query is refused with an error, and no part of it is evaluated. Error codes are left to implementations. For srs-rust, in the style of ADR-053, `query-filter-malformed` and `query-filter-misfit` are suggested, so that Open Question 5 has codes to expect. A partial answer here would look like a real one. That is the silent failure the research on srs#726 found every mature query standard warns against.

### Change E: Compositions get the filter by consumption

A Composition section of type `discovery-query` already carries a full `DiscoveryQuery`, and evaluates it by the same rules. It therefore gains `fieldFilters` with no new section property. A section can now say "every record of type *document* whose `kind` is *email*, in date order" without a container built for the purpose.

**Keeping the two copies identical.** `composition.json` carries its own inline copy of `DiscoveryQuery`, identical to `discovery.json`'s today. It is a copy rather than a reference because the package and record validator (`scripts/lib/json-schema-lite.mjs`) resolves only local `#/` references. `composition.json` already does the same for its copy of `ExactTypeRef`, and says so in a `$comment`.
- This RFC adds `fieldFilters` and `FieldFilter` to both copies.
- It adds a non-normative guard, registered in `scripts/checks.json`, that fails when the two `DiscoveryQuery` copies differ. The guard is modelled on the existing `actor-defs-identical` check.
- It adds a `$comment` on the composition copy naming its canonical source, as the `ExactTypeRef` copy has.

### Change F: conformance scenarios, and the fixture changes they need

**What the fixture already holds.** The discovery fixture (`conformance/discovery/fixture-repo/`) already has most of the values these tests need:
- `article.status`: a closed string;
- `article.topics`: a list of strings;
- `article.is_published`: a boolean;
- `article.publish_date`: a date, missing on one article;
- `article.read_minutes`: an integer, set on one article;
- `article.word_count`: a number, set on five articles (28, 42, 75, 99 and 150);
- `project.priority`: a closed string;
- `metric.is_active`: a boolean.

**What it needs added.** Five additions, each listed in the fixture README:
1. **One article with no `status`, an empty `topics` list, no `publish_date` and no `word_count`.** It proves that `notIn` and `in` skip a record with no value, and that an empty list is no value.
2. **A list-of-dates field on `article`** (`review_dates`), set on two articles, so that `range` on a list-valued field can be tested.
3. **A Vocabulary with two terms and one alias, and a closed `article` field bound to it,** set on three articles, so that alias resolution can be tested. Closed values are searchable text (RFC-012 [R8]), so the term keys and aliases must contain none of the existing `contentMatch` query strings.
4. **`read_minutes` set on two more articles,** written `4` and `12.0`, so that an integer range can prove a fractional bound, an inclusive bound and an integral value written with a decimal point. Integers are not in the text projection (RFC-012 [R8]), so no `contentMatch` scenario changes.
5. **Updated counts in the README:** the fixture grows from 9 instances to 10, and its package gains two Fields and one Vocabulary.

The `article` Type gains its two Fields in place, at its current version. The fixture is test data, not a published package, so no successor Type version is needed. Every article's bound version then carries the new Fields.

**What changes in the 34 existing scenarios.** The new article carries no lifecycle state, no tags, no text that matches an existing `contentMatch` scenario, and no membership in a container any scenario names. Four existing expected sets still gain it, and are updated in the same change:
- `empty_query`: 9 to 10;
- `tier_filter_record`: 8 to 9;
- `type_name_article`: 5 to 6;
- `type_namespace`: 8 to 9.

No other existing scenario changes, and the three lifecycle scenarios are untouched.

**Landing order.** srs-rust's conformance test reads the fixture and scenarios from an srs checkout: `SRS_SPEC_DIR`, or a sibling `srs` on `master`. RFC-012 [R11] makes every `exactMatch` scenario mandatory. Two repositories cannot merge atomically, so the work lands in four steps:
1. **Fold the schema and records in srs.** The fixture and scenario change is held on its own branch.
2. **Sync the schema mirrors** in srs-rust and srs-vscode.

   srs-rust's `schema-drift` CI job is red between steps 1 and 2. That is the one red window, and it is the routine one every schema change already has.
3. **Implement and release in srs-rust (srs-rust#1240).** It is tested against the held fixture branch through `SRS_SPEC_DIR`, then merged and released as a pinned build.
4. **Merge the held fixture branch in srs.**

Done in this order, the reference implementation never fails its own conformance test.

**New `exactMatch: true` scenarios** in `conformance/discovery/scenarios.json`, at least one per row of Change B and one per rule below:
- `in` and `notIn` on a single and a list-valued string;
- `in` on an integer (`read_minutes`) and on a boolean;
- `notIn` not returning the article with no status;
- an empty list as no value;
- alias resolution on the Vocabulary-bound field;
- `range` with a day, a month and a year bound;
- an open-ended `range`;
- `range` on the list-of-dates field;
- a `range` with `from` after `to`;
- a numeric `range` on `word_count` (`{from: 40, to: 80}` selects 42 and 75), one whose bound equals a stored value (`{from: 75}` includes 75), and one with a decimal bound (`{from: 41.5, to: 42}` selects 42);
- an integer `range` on `read_minutes`: `{from: 3.5, to: 12}` selects the articles holding `4` and `12.0`, and not `987654321`;
- `missing: true` and `missing: false`;
- a filter on a Field outside the record's Type's effective field set;
- a `fieldId` that names nothing;
- `fieldFilters` combined with `typeName` and `tag`.

---

## Conformance Rules

> **[R1]** A `DiscoveryQuery` MAY carry `fieldFilters`, a list of field filters. An instance is selected only if every filter in the list holds for it, in conjunction with every other predicate of the query (RFC-012's conformance rule [R5]). An absent or empty `fieldFilters` MUST NOT change the selection.
>
> **[R2]** A field filter MUST name exactly one Field by `fieldId`, and MUST carry exactly one of the tests `in`, `notIn`, `range` or `missing`. The `fieldId` MUST resolve by the rule that resolves a Type FieldAssignment's `fieldId`. The tests a filter may carry are fixed by the resolved Field's datatype, as listed in Change B.
>
> **[R3]** `in` MUST hold if and only if the field has a value and the value (for a list-valued field, at least one element) equals a listed value. `notIn` MUST hold if and only if the field has a value and no value (for a list-valued field, no element) equals a listed value. Comparison works as follows:
> - Strings MUST be compared exactly, code point by code point, with no case folding or normalisation. The one exception is a Field with a `vocabularyRef`:
>   - Listed and stored values MUST first be resolved to their term keys by RFC-006 key-or-alias resolution, over the Vocabulary's effective entry set only, never through a retired entry.
>   - On an open Field, a value that resolves to no entry, or every value where the `vocabularyRef` itself resolves to nothing, MUST be compared exactly as written.
> - Integers MUST be compared exactly by the decimal value written, so `2.0` equals `2`, and booleans by value.
>
> **[R4]** `range` MUST hold if and only if the field has a value and the value (for a list-valued field, at least one element) lies within the bounds, both bounds included:
> - On a `date` Field, the value MUST be a valid calendar date that is on or after the start of `from`, where given, and on or before the end of `to`, where given. Dates are compared as calendar dates, without time of day or timezone. A bound written as `YYYY` or `YYYY-MM` MUST be read as the whole year or month: its start for `from`, its end for `to`.
> - On an `integer` or `number` Field, the value MUST be greater than or equal to `from`, where given, and less than or equal to `to`, where given, compared exactly by the decimal value each is written as, with no rounding of either the value or the bound.
>
> A range whose `from` lies after its `to` MUST select nothing.
>
> **[R5]** The value of a field filter is the record's `fieldValues` entry under the resolved Field's `name` (RFC-039). The field has no value when that entry is absent, an empty string, an empty list, or (for a `map` or inline `ref` Field) an empty object. `missing: true` MUST hold if and only if the field has no value, and `missing: false` if and only if it has one. A field with no value MUST NOT satisfy `in`, `notIn` or `range`. A value that does not conform to the resolved Field's datatype, or to its closed domain, MUST NOT satisfy `in`, `notIn` or `range`. A value on an `integer` Field conforms if and only if it is a JSON number with an integral value. A number written as a JSON string conforms to neither `integer` nor `number`. On a list-valued Field, conformance MUST be judged per element.
>
> **[R6]** A field filter MUST NOT hold for an instance other than a Tier 2 Record whose bound Type version's effective field set contains the named Field. Where no filter in the query is refused under [R7] or [R8], a filter whose `fieldId` resolves to no installed Field MUST select no instances, and the implementation MUST report a warning naming the unresolved id.
>
> **[R7]** An implementation MUST refuse a query containing a malformed field filter, with an error and without evaluating any part of the query. A filter is malformed if any of these holds:
> - it has no `fieldId`;
> - it carries not exactly one test;
> - it has an empty `in` or `notIn` list, or an empty string as a listed value;
> - it has a `range` with neither bound;
> - it has a `range` bound that is neither a JSON number nor a real date, month or year in the form `YYYY`, `YYYY-MM` or `YYYY-MM-DD`;
> - it has a `range` with one numeric bound and one date bound.
> 
> This check applies to every filter in the query, whether or not its `fieldId` resolves.
>
> **[R8]** Where the `fieldId` resolves, an implementation MUST refuse, with an error and without evaluating any part of the query, a query containing a field filter that:
> - carries a test the Field's datatype does not allow;
> - lists a value whose type does not match the Field's datatype;
> - carries a `range` bound of the wrong kind for the Field: a number on a `date` Field, or a date on an `integer` or `number` Field;
> - lists a value outside the domain of a closed Field: its `allowedValues`, or the keys and aliases of the entries in its bound Vocabulary's effective entry set (RFC-006); or
> - targets a closed Field whose `vocabularyRef` resolves to no Vocabulary.

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `discovery.json` | `DiscoveryQuery` gains the optional property `fieldFilters` (an array of `FieldFilter`). A new `$defs/FieldFilter`: a required `fieldId` (uuid) and exactly one test, expressed as a `oneOf` with one required property per branch: `in` or `notIn` (a non-empty array whose items are integers, booleans, or strings of `minLength: 1`); `range` (an object with optional `from` and `to`, each `oneOf: [{type: number}, {type: string, pattern: YYYY, YYYY-MM or YYYY-MM-DD}]`, with `minProperties: 1`); or `missing` (a boolean). `additionalProperties: false`. | None: optional property |
| `composition.json` | The same additions to its inline `$defs/DiscoveryQuery`, a matching `$defs/FieldFilter`, and a `$comment` naming `discovery.json` as the canonical source. | None |

The seed validator (`scripts/lib/json-schema-lite.mjs`) implements neither `minLength` nor `minProperties`. A stored section carrying `in: [""]` or `range: {}` therefore passes `validate-all`, and [R7] is the rule that refuses it. This RFC does not extend the validator.

Two kinds of check cannot be expressed in the schema at all:
- whether a bound is a real calendar date (the pattern cannot exclude `2026-02-30`), and whether both bounds are of one kind;
- which test, value type, bound kind or value domain fits a Field (this depends on the Field the id resolves to).

Implementations check both ([R7], [R8]), and the fixture scenarios prove them.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`);
- `srs-vscode/schemas/2.0/` (manual copy).

**Also changed (not schemas):**
- **`srs/package/metamodel/`.** The metamodel models `DiscoveryQuery` as the `discovery-query` Type (10 Fields). The `rfc-534-closure` and `rfc-541-closure` checks prove the metamodel can generate the seed. The metamodel gains:
  - a `field-filter` Type, with Fields for `fieldId`, `in`, `notIn`, `range` and `missing`;
  - a `value-range` value Type with `from` and `to`, modelled as string Fields (numeric bounds are a recorded fidelity gap, covered by the exclusion below);
  - a `field_filters` Field (an inline `ref` list) assigned on `discovery-query`;
  - a package version bump.
  
  In the metamodel, `in` and `notIn` are modelled as string-list Fields.

  Three parts of the shape cannot be emitted by today's emitter: the "exactly one test" `oneOf`, the mixed integer, boolean and string items of `in` and `notIn`, and the number-or-string `from` and `to`. `DiscoveryQuery` has zero closure exclusions today (`rfc-534-closure-test.mjs`; `generation-ledger.md`). This RFC introduces its first, through the per-entity EXCLUSIONS mechanism documented in `rfc-534-closure-test.mjs`. The precedents are `DocumentSection.source` (srs#543, a `oneOf`) and `theme.elementTemplates.compositeRendererConfig`.
- **`docs/schema/2.0/projection-rules.md`, `metamodel-fidelity.md` and `generation-ledger.md`.** Each describes the `DiscoveryQuery` closure. Each gains one line introducing the new exclusion.
- `conformance/discovery/` (Change F).
- `scripts/checks.json` (the guard, Change E).

---

## What breaks

**Nothing that exists today.**
- The property is optional.
- Every stored query and every Composition section in the first-party corpora (the spec, srs-programme, srs-context and muSrs) is unchanged, and selects exactly what it selected before.
- No record, Field, Type or Vocabulary changes.

**Older software refuses the new filter.** Both schemas reject unknown properties (`additionalProperties: false`, kept deliberately by `rfc-decision-2e0cd70a`). Until srs-rust implements this RFC, these readers refuse a query or section that uses `fieldFilters`:
- the pinned srs-rust build, behind the `srs` CLI and the MCP server's `find`;
- srs-web, which reads through the WASM binding;
- srs-vscode, which calls the CLI.

The implementation follow-up is srs-rust#1240, widened from closed-field equality to this RFC. When it lands, `find` (CLI, MCP and WASM) gains the axis, and sections can use it.

**Conformance.** Four existing conformance sets grow by one (Change F). The fixture change lands after the srs-rust build that implements this RFC, in the four steps given in Change F. The only red window is the routine `schema-drift` interval before the mirrors sync. The reference implementation never fails its own `ext:discovery` conformance test.

Zero first-party sections use the filter today, so the refusal only bites once someone writes one. From then on, that package needs a reader at this revision. No `dataModelRevision` bump is proposed, because no stored instance data changes shape.

---

## Rationale

**Why a filter on the record's own fields, and not a better tag mechanism.** The value is already on the record. A tag that copies it is a second home for one fact. The real-use report on srs#726 shows the cost: a timer, and records invisible until the next run. A filter reads the fact where it lives.

**Why four tests and not a comparison language.** Every query standard surveyed on srs#726 that grew a general expression language made each implementer carry a full evaluator, and multiplied the conformance cases. OData's `$filter` is the example: it is required even at OData's minimal conformance level. The four tests here cover every real-use question reported. Each has a single meaning that one fixture scenario can prove.

**Why exact string comparison, except for Vocabulary aliases.** `contentMatch` already provides forgiving text search (NFC, lowercase, substring). A filter is for values that are tokens: a closed vocabulary term, a status, a code. For tokens, "Email" and "email" are different values, and silently folding them would hide a data error rather than surface it. Alias resolution is different in kind. A Vocabulary declares that two spellings name one term, and the `tag` axis already honours that declaration. A field holding the same terms should match the same way, or one kind of value would have two rules.

**Why refuse a value outside a closed domain.** The domain is declared, so a value outside it can only be a mistake. Returning nothing would let the mistake pass as an answer: "no published records" when the query said "publshed".

**Why `notIn` excludes records with no value.** If `notIn: ["archived"]` included records with no status, "not archived" would quietly mean "not archived, or unknown". Every standard that left this implicit became a source of wrong answers; SQL's `NULL` rules are the classic case. Making `missing` its own test keeps each filter's meaning visible in the query.

**Why partial dates as ranges.** Agents and people ask about months and years far more often than about exact days ("what happened in August"). Reading a partial bound as its whole period lets that be written as it is said. It also fixes one meaning, so two implementations cannot disagree about whether "to 2026-08" includes 31 August.

**Why numeric ranges, inclusive only, compared exactly, and no `in` on `number`.** A numeric range reuses everything dates already need: the bound shape, open ends, empty ranges and the misfit checks. Leaving it out made the datatype table inconsistent, because a reader could ask for an exact integer but not for "between" (Alt F). Inclusive bounds match how dates read, and they are enough on integers. Exact decimal comparison is the one rule that gives every implementation the same answer, whatever its number type. `number` has no `in`, because equality on measured or computed decimals silently misses near values, while a range makes the author state the tolerance (Change B, Alt H).

**Why refuse an invalid filter rather than ignore it.** An ignored filter returns more records than were asked for, and the caller cannot tell. A refusal costs one retry, and cannot be mistaken for an answer. The checks run over the whole query: malformed filters first, then filters that do not fit their Field, and only then evaluation, where an unresolved id selects nothing. That order means every query gets the same outcome on every implementation, even when it has several faults.

**Why an unknown field id is an empty answer, not a refusal.** A misspelled value can only be a mistake, because the Field's domain is declared. An unknown field id can be legitimate: a Composition may name a Field from an optional package that a repository has not installed, and an empty section is the true answer there. A refusal would stop the whole document rendering. The warning is required (MUST), so a mistyped id still never passes silently.

**Why the portable line is not a conformance rule here.** "A portable predicate has an exact result set" is how this RFC chose its tests, and how the next two RFCs on srs#726 should choose theirs. But it constrains authors of the standard, not implementations. By the level test (`rfc-decision-c20fcff8`) it therefore belongs in a decision record, not in [R1]–[R8]. Open Question 1 proposes that record.

---

## Alternatives Considered

### Alt A: address the Field by name

Simpler to type, especially for agents. Rejected for the standard query: a name is a label, and names collide across packages (`rfc-decision-43e84d63` split one name, `kind`, across several Fields in srs-programme). The convenience is kept where it belongs: an implementation's tools may accept a name and resolve it to an id before evaluation (Change D).

### Alt B: a KEYED reference (the Field's `namespace/name`)

Unambiguous, and readable. Rejected because the Field already has an identifier, and the reference taxonomy (`rfc-decision-c8704763`) already gives a bare UUID its strength. A second spelling for the same target is two ways where one exists.

### Alt C: a general boolean expression (`and`, `or`, `not`, nested)

Answers every question at once. Rejected for this revision, for three reasons:
- it turns `DiscoveryQuery` from a flat conjunction into a language;
- every implementation must carry a full evaluator;
- no real-use case so far needs OR across fields.

The standard already has a narrower precedent, `lifecycleStates`: OR as a list inside one axis. Open Question 2 asks whether that flat rule should be recorded as the standing direction.

### Alt D: keep deriving tags

Costs the standard nothing. Rejected: it is the status quo the motivation describes, with its staleness, its timer, and its second home for each fact.

### Alt E: compare Vocabulary-bound values exactly, without resolving aliases

Simpler, and the same as for open strings. Rejected because the `tag` axis already resolves aliases (RFC-012 [R7]). Then `in: ["e-mail"]` would match a tag but miss a field holding the same term, and the owner would be committing to two rules for one kind of value.

### Alt F: leave numeric ranges out until a real use asks

The earlier revisions did this. Rejected by the owner in Revision 5. Integers already compared by value for `in`, so leaving out the range made the datatype table inconsistent: a reader could filter by an exact number but not by "between". A numeric range adds no mechanism. It is one comparison, with the same bound shape and the same open-end and empty-range rules as dates.

### Alt G: include `date-time` ranges now

Deferred. `date-time` needs a timezone rule (is "on 14 August" the UTC day, or the day as written?), which deserves its own decision rather than a default slipped into this one. Open Question 4 keeps this open.

### Alt H: `in` and `notIn` on `number`, or exclusive numeric bounds

Not taken.
- **`in` on `number`.** Exact comparison makes `in` portable, but `in: [0.3]` would silently miss a stored `0.30000000000000004`. A one-point range misses it too: the risk is moved, not removed. The range form is kept because it makes the author write a comparison that can be widened to a tolerance.
- **`in` with a tolerance or a decimal-string comparison.** A tolerance is a range by another name. Comparing decimals as strings would make `2.5` and `2.50` differ.
- **Exclusive bounds.** No use has asked for them. They can be added later without changing the meaning of any existing query, at the cost of older readers refusing the new key.

---

## Open Questions

1. **Record the portable line as a decision?** *Owner ruling.*
   - **Proposal:** a predicate enters the portable `DiscoveryQuery` only if the repository's content alone defines its result set exactly, so that every conforming implementation returns the same set. Ranking, stemming and similarity stay outside, behind the `DiscoveryIndex` seam (RFC-012 [R3]/[R4], srs-rust ADR-019).
   - **Recommendation:** yes, as an `rfc-decision` record at acceptance, since the next two RFCs on srs#726 depend on it.
   - **Ruled 2026-11-22 (owner):** yes. Recorded as an `rfc-decision` at acceptance.
2. **Record "flat queries" as the standing direction?** *Owner ruling.*
   - **Proposal:** queries stay a conjunction of filters. OR appears only as a list of values inside one filter (as `lifecycleStates` and `in` do), and exclusion only as a per-filter test (as `excludeLifecycleStates` and `notIn` do). There are no nested boolean expressions.
   - **Recommendation:** yes, as a decision record, with a review trigger of "a real use that cannot be expressed as two queries".
   - **Ruled 2026-11-22 (owner):** yes, with that review trigger. Recorded as an `rfc-decision` at acceptance; later RFCs on srs#726 inherit it.
3. **OR and exclusion on the existing axes.** *Deferred, with a recommendation.* By the same pattern, `typeName` could take a list, and `tag` could gain an any-of form and an exclusion (`excludeTags`). No real use has asked for them yet, so they are left out of this revision.
   - **Recommendation:** leave them out until a case arrives.
   - **Ruled 2026-11-22 (owner):** recommendation agreed; deferred.
4. **`date-time`.** *Deferred, with a recommendation.* (Numeric ranges were added in Revision 5.) Should a later revision add `range` on `date-time` with a stated timezone rule?
   - **Recommendation:** yes, when the first real-use case arrives, with the timezone rule as its own decision.
   - **Ruled 2026-11-22 (owner):** recommendation agreed; deferred.
   - **Why the bar differs from numbers.** Numeric ranges were admitted without a use case because they reuse the date-range machinery and need no new rule. `date-time` needs a new rule, the timezone, and a rule chosen with no case to test it against is the theory-without-evidence that `rfc-decision-4f1e12e5` guards against.
5. **Expecting an error in a conformance scenario.** *Deferred, with a recommendation.* [R7] and [R8] are checked by each implementation's own tests, because `ConformanceScenario` can only expect a set of instances. Should the scenario shape gain an expected error code, so the shared fixture proves refusals too?
   - **Recommendation:** yes, but in its own change, since it alters the fixture format every runner reads.
   - **Ruled 2026-11-22 (owner):** recommendation agreed; deferred to its own change.
6. **Should this RFC wait for RFC-055?** *Owner ruling.* Change D ties a filter's `fieldId` to whatever rule resolves a Type's `fieldId`, so this RFC does not depend on RFC-055's outcome. Accepting it first does mean the fixture scenarios, which use single-version Fields, are not testing multi-version resolution.
   - **Recommendation:** accept independently. Add a multi-version scenario when RFC-055's own fixture (srs#1031) lands.
   - **Ruled 2026-11-22 (owner):** accept independently.
7. **The drafted mechanics you approve by accepting.** *Owner ruling.* These are not settled by any earlier decision, so accepting this RFC rules on them:
   - **Out-of-domain values are refused.** A listed value outside a closed Field's domain is an error, not an empty answer.
   - **`notIn` excludes records with no value.** Those records need a separate `missing: true` filter.
   - **Strings compare exactly.** No case folding or normalisation; that is `contentMatch`'s job.
   - **Vocabulary aliases resolve as they do for tags.**
   - **Partial date bounds cover their whole period.**
   - **An unknown field id is an empty answer with a required warning, not a refusal.**
   - **An empty string, list or object counts as no value.** This is a deliberate break from RFC-039 [R5a], which counts an empty string as present for storage (Change C gives the reason).
   - **`missing: true` never returns records of a Type without the Field, or Notes.** "Documents with no date" never returns events.
   - **Records still holding a retired value cannot be selected by a field filter.** They are found through validation or RFC-006's V10 pre-flight.
   - **Numeric range bounds are always inclusive.** There is no exclusive form yet (Change B).
   - **`number` gets a range but no `in` or `notIn`.** Exact decimal equality is the fragile case (Change B).
   - **Numbers compare exactly, by the decimal value written.** An implementation using binary floating point must still give the exact answer, including for integers beyond 2^53 (Change B).
   - **Numeric ranges enter without a real-use case,** as a recorded exception to `rfc-decision-4f1e12e5`, with the review trigger stated in Charter alignment.
   - **Recommendation:** accept all thirteen as drafted. The Rationale and Change C give the reason for each.
   - **Ruled 2026-11-22 (owner):** all thirteen accepted as drafted.
