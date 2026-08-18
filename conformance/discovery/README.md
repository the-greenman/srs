# `ext:discovery` conformance fixture

Normative test data for the Discovery Contract. RFC-012 `[R11]`/`[R12]` bind `ext:discovery`
conformance to this fixture, so **every scenario here is contract, not a test convenience**: adding
one adds an obligation, and changing an expectation changes what conformance means.

- `fixture-repo/` — the repository under test: 11 instances across Tiers 0, 1 and 2, four Types, 27
  Fields spanning every RFC-032 `fieldType` classification I-120 rules on.
- `scenarios.json` — 36 scenarios, each a `DiscoveryQuery` plus its expected instance ids.

> **Open question before the exclusion scenarios can be relied on as conformance.** The 13
> content-match exclusion scenarios (`exactMatch: true`, empty expected set) are **not bound by any
> current invariant, and one invariant arguably permits failing them.** I-123 binds *"structured-filter
> conformance scenarios (`exactMatch: true`)"*; I-124 binds *"content-match conformance scenarios
> (`exactMatch: false`)"* as a superset. These are content-match **and** `exactMatch: true` — a third
> category neither reaches cleanly. And I-115 says an implementation MAY return instances beyond the
> I-114 recall floor *"e.g. via stemming, phonetic matching, or **semantic similarity**"*, which by
> definition does not need the token in a segment. The soundness argument below ("no legitimate
> over-recall path to a token that is in no segment") holds against a Layer-1 substring index and
> **not** against the semantic-similarity case I-115 explicitly allows.
>
> #317 requires these assertions, so they are here. But landing them as conformance wants an I-123 /
> I-124 scoping amendment — a scoped no-false-positive obligation over probe tokens — rather than
> resting on the extension record's looser one-line summary. Raised on #317; the owner's call.

## Two layers, migrated independently

This fixture sits at the intersection of two cutovers, and they resolved **differently**. Reading
one for the other is the mistake this section exists to prevent.

| Layer | State | Authority |
|---|---|---|
| **Data model** (RFC-032 `fieldType`, RFC-039 name-keyed carrier) | **Migrated.** `dataModelRevision: 2`; no Field carries the pre-RFC-032 `valueType`, no record carries the pre-RFC-039 pair-array. | #242 Phase B / #286 |
| **Storage** (RFC-038 tree-authoritative) | **Deliberately not migrated.** No `.srs` marker; `manifest.json` keeps `instanceIndex` and `containerIndex`; relations stay in the `relations/relations.json` collection form. | RFC-038 Rev 7 resolved dispositions |

RFC-038 Rev 7 kept this repository as test data rather than inventing repository identity for it,
and named an `[R21]`-independent reader in `srs-rust`. The consequence is concrete and will look
like a bug to anyone who has not read this far:

```
$ srs repo validate --repo conformance/discovery/fixture-repo
manifest.json declares retired property 'instanceIndex' — removed by RFC-038 [R2];
run the rfc038-storage migration
```

**That diagnostic is correct and the fixture is not broken.** A conforming generation-2 reader is
supposed to reject a repository holding retired manifest properties. The `srs` CLI is simply not
this fixture's oracle. Its oracle is the runner below, which reads the tree directly.

Do not "fix" the fixture by migrating its storage. That reverses a ratified disposition.

## Running it

The runner lives in `srs-rust` and consumes this directory as external test data — never vendored,
never copied:

```bash
cd srs-rust && cargo test -p srs-repository --test discovery_conformance -- --nocapture
```

It locates the fixture by walking up from its own crate directory looking for a `srs/conformance/
discovery` sibling. **In a worktree that resolves to whichever `srs` checkout sits beside the
`srs-rust` you built** — which is usually the main clone, not your branch. To exercise a modified
fixture, put a checkout (or a symlink) named `srs` beside the `srs-rust` you run `cargo` from, or
your run will report a pass earned by data you did not change.

A failing scenario is a finding about `discovery_service`'s conformance, or about this fixture —
never something to be fixed by editing `scenarios.json` to match the implementation.

## Tier-1 disposition (#317)

Every `TypedField` in `records/typed-records/` declares the RFC-039 `[R8]` `fieldType` carrier; none
declares `valueType`. `i120_tier1_include_fieldtype_string` and `i120_tier1_exclude_integer` assert
that Tier 1 participates in content match at all — which it did not until srs-rust#797 composed
Tiers 0 and 1 into `find`.

**Read what those two scenarios do *not* establish.** Both are satisfied by either reading of the
Tier-1 rule, so neither discriminates them:

| `TypedField` | legacy rule (`valueType` searchable, *or absent with a string/array value*) | `fieldType` predicate | discriminates? |
|---|---|---|---|
| `summary` (string) | emitted — `valueType` absent, string value | emitted — string/markdown | **no** |
| `estimate_minutes` (number) | skipped — not a string/array value | skipped — integer | **no** |
| `ticket_uuid` (uuid-format string) | **emitted** — `valueType` absent, string value | **skipped** — `format: uuid` | **yes** |

**Only `ticket_uuid` discriminates, and it is deliberately left unasserted.** The canonical Tier-1
algorithm — in the `ext:discovery` extension record, not just in I-120 — reads:

> For each `TypedField` in `fields[]` array order — if `valueType` is searchable (**or absent with a
> string/array value**) and value is non-empty, emit one or more `typed-record-field` segments.

`ticket_uuid` has no `valueType` (RFC-039 forbids it) and a string value, so the **canonical
algorithm requires the segment**. A scenario asserting its exclusion would fail a spec-conformant
reader, however sensible the post-cutover reading is. The Field stays in the fixture as the standing
evidence; the assertion waits for the rule text.

**Which is the finding.** I-120 closes with:

> Tier-1 `TypedField.valueType` continues to use the legacy classification until the #242 Phase-B
> carrier cutover.

That cutover has landed, and `TypedField.valueType` no longer exists in the corpus — so the sentence
defers Tier 1 to a classification over a property nothing carries. The same stale clause appears
**twice**: in `invariant-99dc528c.json` and in the extension record's own Tier-1 algorithm paragraph,
where the *"or absent with a string/array value"* fallback is what actually decides. Retiring it is a
rule-text change in both sites, and therefore the owner's. **#284's predicates are not reopened** —
the predicate is unchanged, only its spent transitional escape clause. Raised on #317.

## `format` predicates are allow-lists

Every `format` exclusion here is asserted against the enumerated positives — `plain`, `markdown`,
`uri` — never as a `format != "uri"` test. The two rules agree on `uuid` and `email` and disagree on
every format nobody has proposed yet, which is precisely why the erratum chose enumerated positives:
an unrecognised or future `format` is ineligible by default.

## How the exclusion scenarios are sound

The inclusion scenarios use `exactMatch: false`. RFC-012 lets a Layer-2 index recall *more* than the
Layer-1 floor, so a set equality would forbid conformant behaviour.

The exclusion scenarios use `exactMatch: true` with an empty expected set, which looks stricter than
the recall floor permits and is not. Each probe token appears **only** inside the excluded Field —
`zzmapvalueprobe` in a `map` value, `aa11bb22` in a `uuid`-format string, `zzinlineprobe` in an
inline composite, and so on — so no Text Projection segment anywhere in the fixture contains it.
There is no legitimate over-recall path to a token that is in no segment. A hit means an excluded
Field contributed one, which is exactly what I-120 forbids.

The two halves need each other. Without the inclusion scenarios, a `contentMatch` implementation
that always returned nothing would pass all nineteen exclusions.

## What this fixture does NOT assert, and why

I-120 says a list-cardinality Field "emits **one segment per array element in order**". This fixture
asserts that each element is independently recallable (`i120_include_list_element_first` / `_middle`
/ `_last` over `aliases`), which rules out a projection that drops elements or concatenates them
lossily. It does **not** assert the segment *count* or their *order*.

That is a limit of the conformance contract, not an oversight. A scenario expresses expectations as
`expectedInstanceIds`, and `DiscoveryHit` exposes an instance id, a label and the first matching
segment's text — no segment list. Nothing a scenario can say distinguishes three segments in array
order from one concatenated segment. Closing it needs a new expectation kind in `scenarios.json`
(normative — it changes the RFC-012 `[R11]` interface) landed together with a runner that can
evaluate it. Raised on #317 rather than worked around here.

Recursive Text Projection into inline composites is a separate, larger gap: `ref` is excluded in
both modes knowingly, and admitting it would need traversal, cycle and nested-segment-identity
semantics that no accepted RFC defines. `i120_exclude_ref_inline` asserts today's exclusion, and the
nested `display_name` being unfindable is a recorded accepted cost.
