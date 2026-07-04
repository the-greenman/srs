> **GitHub issue**: [the-greenman/srs#116](https://github.com/the-greenman/srs/issues/116)

# RFC-016: Invariant Record Projection

**Status**: Accepted (Revision 5)
**Affects**: `com.semanticops.spec/invariant` (rendering); `scripts/publish-spec.mjs`; subsection body records (Phase 2)
**Author**: design dialogue draft
**Date**: 2026-07-04

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-04 | Initial draft |
| 2 | 2026-07-04 | Address Stage 3 review: fix subsection fieldId (1a000002 not 1a000003); add field reference table; specify group normalization algorithm; clarify wholesale region replacement; drop **Content**: prefix; fix sort rule; fix R4 conditionality; canonicalize R5 field names; add R6 for absent group; note invariant-062 cleanup; fix abstract range |
| 3 | 2026-07-04 | Address Stage 4 re-review: type-aware sort algorithm (JSON number vs I-NN string); clarify intro sentence is part of renderInvariants output; R5 covers absent Number field; EOF boundary case; full UUIDs; remove Rationale hedge |
| 4 | 2026-07-04 | Implementation started; RFC file committed to branch rfc/016-invariant-record-projection |
| 5 | 2026-07-04 | Accepted; spec records authored in srs/srs; pipeline passes end-to-end; I-63–I-84 visible in rendered views; updated check-release-drift.mjs to apply invariant injection before comparison |

---

## Abstract

The rendered "Key Invariants" section of `docs/spec/srs-spec.md` is currently populated from hand-written prose embedded in subsection body records, not from `com.semanticops.spec/invariant` records. This means 11 invariant records — I-63–I-66, I-78–I-84 — added by RFC-009, RFC-013, and RFC-014 are invisible in every rendered view, and invariants 1–62 are duplicated — once as records and once as subsection prose — creating a silent divergence risk. This RFC establishes that the rendered invariant list MUST be a projection of `invariant` records, and specifies a two-phase implementation: a post-render injection script (Phase 1) that stops the bleeding immediately, followed by removal of the duplicate prose from subsection bodies (Phase 2, tracked separately).

---

## Motivation

### Problem 1 — Invariant records are not the source for the rendered Key Invariants section

The `srs` specification repo's own principle is: "the records are the source of truth; the markdown is a projection." For the Key Invariants section this principle is violated. The current rendering pipeline (`srs render document-view` via the Rust CLI) emits the Key Invariants section from the body text of subsection records (e.g. `records/subsections/08-1-field-semantics.json`), which contain hand-written `**N.** ...` prose in their Content field (`1a000002`). The `com.semanticops.spec/invariant` records in `records/invariants/` are never read during rendering.

Consequence: invariants added via the RFC pipeline (which authors `invariant` records as directed) never reach the rendered spec. As of this writing, 11 invariant records — I-63–I-66, I-78–I-84 — are invisible to any reader of `docs/spec/srs-spec.md`.

### Problem 2 — Invariants 1–62 are duplicated and can diverge

Invariants 1–62 are authored twice: as records in `records/invariants/invariant-001.json` … `invariant-062.json`, and again as inline prose in subsection Content bodies. The rendered output comes from the prose. The two copies can diverge silently — a change to a record body is not reflected in the rendered spec until the subsection prose is also updated. There is no validation that detects drift between the two.

---

## Proposed Changes

### Change A — Add `scripts/render-invariants.mjs`

Add a new ESM module that reads all `com.semanticops.spec/invariant` records from `srs/records/invariants/`, sorts them by `invariant-number`, groups them by the `group` field, and exports an async function `renderInvariants(repoPath)` that returns the full Key Invariants region body as a markdown string.

#### Field reference table

All record field access uses these fieldIds from the `com.semanticops.spec/invariant` type:

| Logical name | fieldId | displayLabel | Value type |
|---|---|---|---|
| `invariant-number` | `1a000020-0000-4000-a000-000000000020` | Number | JSON integer for invariants 1–62; JSON string `"I-NN"` for later invariants |
| `constraint` | `1a000003-0000-4000-a000-000000000003` | Constraint | string |
| `group` | `1a000021-0000-4000-a000-000000000021` | Applies To | string |

#### Sorting

The `invariant-number` field stores values as a JSON number for invariants 1–62 and as a JSON string for later invariants. The sort key derivation branches on the JSON type of the stored value:

- **JSON number** (e.g., `1`, `62`): use the value directly as the integer sort key; render as `**N.**`.
- **JSON string matching `^I-\d+$`** (e.g., `"I-63"`, `"I-84"`): strip the `"I-"` prefix and parse the remainder as an integer for the sort key; render as `**I-NN.**`.
- **Any other value**: malformed — trigger [R5] pipeline failure.

Sort records ascending by this integer key. Example: `"I-63"` → 63, JSON `1` → 1.

#### Group normalization

The `group` field (`Applies To`) is an annotation field whose values may be multi-part strings containing semicolons, parenthetical qualifications, and RFC references unsuitable for use as `####` headings verbatim. Derive the display group label from the `group` value using this algorithm:

1. If the value contains `;`, take the substring before the first `;` and trim whitespace.
2. If the result contains `, ext:` or `, core`, take the substring before that delimiter and trim.
3. The trimmed result is the display group label used as the `####` heading.

Examples:
- `"ext:import-tracking; ext:repository (packageRefs …); RFC-014 R6. …"` → `"ext:import-tracking"`
- `"ext:repository (RepositoryManifest); RFC-013"` → `"ext:repository (RepositoryManifest)"`
- `"Container (core), ext:vocabulary (RFC-006)"` → `"Container (core)"`
- `"core — Field"` → `"core — Field"` (unchanged, no semicolon or `, ext:`)
- `"ext:lifecycle"` → `"ext:lifecycle"` (unchanged)

Records with the same normalized display group label are emitted under a shared `####` heading. Groups appear in ascending order of their lowest-numbered invariant member.

#### Body value sanitization

Before emitting a Constraint field value, strip any trailing markdown horizontal rule artifact: remove any trailing `\n\n---` or `\n---` sequence. (Known instance: `invariant-062.json` Constraint field ends with `\n\n---`; a separate data-cleanup step in Phase 1 implementation SHOULD also correct the record directly.)

#### Output format

The function returns a markdown string consisting of an introductory sentence, followed by group headings and invariant items — no `### Key Invariants` heading and no `---` boundary (those are preserved by Change B's region replacement). The intro sentence is part of the return value and replaces any intro text present in the region. Example:

```markdown
Conforming implementations must uphold the following invariants.
#### core — Field

**1.** `FieldAssignment.displayLabel` and `FieldAssignment.displayHint` are for rendering only…

**2.** A `Type` must not redefine…

#### ext:lifecycle

**4.** `Type.lifecycle.initialState` must reference a `name`…
```

Integer invariant-numbers render as `**N.**`; "I-NN"-form numbers render as `**I-NN.**`.

### Change B — Update `scripts/publish-spec.mjs` to call the projection

Import `renderInvariants` from `./render-invariants.mjs` as an ESM module (not via `run()`). Call it after `renderDocumentViews()` and before `syncSchemas()`. Errors thrown by `renderInvariants` propagate to `main()` and cause the pipeline to exit non-zero (satisfying [R5]).

For each file in `VIEW_EXPORTS`, mark entries that are expected to contain a Key Invariants section with `requiresKeyInvariants: true`. Currently only the entry for `srs-spec.md` (`id: 3a000001-0000-4000-a000-000000000001`) and `srs-unified.md` (`id: 3a000004-0000-4000-a000-000000000004`) should be marked. After calling `renderInvariants`, for each view file:

- If `requiresKeyInvariants: true` and the file has no `### Key Invariants` heading: throw an error (pipeline fails).
- If `requiresKeyInvariants: false` (or unset) and the file has no heading: skip silently.
- If the heading is present: perform wholesale replacement of the region body.

**Region replacement algorithm:** Locate the first occurrence of `### Key Invariants` in the rendered markdown. The region body is everything after the end of that heading line up to (but not including) the next `---` horizontal rule at the start of a line; if no closing `---` exists, the region extends to end of file. Replace the region body with the output of `renderInvariants`. The `### Key Invariants` heading line and the closing `---` (if present) are preserved unchanged.

The injected output does not include `**Content**: ` prefixes (those are Rust CLI rendering artifacts from the subsection body approach). The new format emits invariant items directly, which is a deliberate formatting improvement.

### Change C — Remove inline invariant prose from subsection bodies (Phase 2)

After Phase 1 is deployed and validated, remove the `**N.** ...` inline prose from all subsection Content field values (`fieldId: 1a000002-0000-4000-a000-000000000002`) that currently embed it. The subsection Content should retain only the introductory sentence ("Conforming implementations must uphold the following invariants.") and the `#### <group>` headings that serve as visual anchors; the invariant list itself is dropped from the body and comes entirely from records.

Phase 2 work is tracked in [srs#117](https://github.com/the-greenman/srs/issues/117) and may be deferred to a follow-up PR once Phase 1 is verified.

---

## Conformance Rules

> **[R1]** Every `com.semanticops.spec/invariant` record present in the repository MUST appear in the rendered "Key Invariants" section of each document view marked `requiresKeyInvariants: true`.

> **[R2]** The rendering order of invariants MUST be ascending by the integer key derived from `invariant-number` (strip `"I-"` prefix if present, parse as integer, sort numerically).

> **[R3]** Each invariant MUST appear exactly once in the rendered Key Invariants section. No record may be duplicated.

> **[R4]** Once Phase 2 has been applied to the repository, subsection Content field values (`fieldId: 1a000002-0000-4000-a000-000000000002`) MUST NOT contain inline `**N.**`-format invariant prose. Invariant records are the sole authoritative source. This rule is not testable until Phase 2 ships; [R1]–[R3] and [R5]–[R6] are testable immediately from Phase 1.

> **[R5]** The `publish-spec.mjs` pipeline MUST fail with a non-zero exit code if the invariant projection step encounters any of: a record missing the Number field (`fieldId: 1a000020-0000-4000-a000-000000000020`), a malformed Number field value (not a JSON number and not a string matching `^I-\d+$`), or a record missing the Constraint field (`fieldId: 1a000003-0000-4000-a000-000000000003`).

> **[R6]** A record whose Applies To field (`fieldId: 1a000021-0000-4000-a000-000000000021`) is absent or empty MUST be emitted after all grouped records under an "Other" heading. It MUST NOT cause the pipeline to fail.

> **[R7]** Constraint field values (`fieldId: 1a000003-0000-4000-a000-000000000003`) MUST NOT contain standalone markdown horizontal rules (`---` on its own line). The script MUST strip trailing `---` artifacts and SHOULD warn when it does so.

---

## Schema changes

**None.** The `com.semanticops.spec/invariant` record schema is unchanged. No new fields, no new relation types. This RFC changes only the rendering pipeline.

---

## Rationale

A script-based post-render injection (Change B) is chosen over modifying the Rust CLI (`srs render document-view`) for two reasons: (1) it confines the change to the `srs` repo, avoiding a coordinated cross-repo release; (2) the document view rendering infrastructure in the Rust CLI is not yet capable of type-aware collection steps — adding that capability is a larger architectural change that can follow independently once the bleeding is stopped.

The group normalization algorithm (split on `;`, then on `, ext:`/`, core`) is derived from the actual `group` field values present in the repository. Records 1–62 have clean single-category values (`"core — Field"`, `"ext:lifecycle"`) that pass through unchanged. Records I-63–I-84 use the field as an annotation field with multi-part references; the algorithm extracts the primary category, grouping I-83 and I-84 under `"ext:import-tracking"` and I-79–I-82 under `"ext:repository (RepositoryManifest)"`.

The two-phase approach (Phase 1: inject from records while keeping prose; Phase 2: remove prose) allows the fix to ship without a large-scale rewrite of subsection bodies in the same PR, reducing risk. Phase 1 alone satisfies R1–R3.

ESM integration (`import` rather than `run()`) is chosen so that `renderInvariants` errors propagate as exceptions within the same Node.js process, making R5 enforcement straightforward without subprocess exit-code handling.

---

## Alternatives Considered

### Alt A — Fix the Rust CLI to collect invariant records in document-view rendering

Would cleanly integrate invariant collection into the existing rendering architecture. Rejected for this RFC because: (a) requires coordinated srs-rust changes and a new release before any fix is visible; (b) the document-view renderer would need a new concept of "type-collection steps" with ordering and grouping logic. Filed as a long-term improvement.

### Alt B — Author `contains` relations from section records to invariant records

Would make invariant membership in a section explicit in the record graph. Rejected because the `group` field already encodes this information adequately for rendering, and adding 73+ relations would be mechanical with no semantic gain at this stage.

### Alt C — Migrate subsection prose first (Phase 2 before Phase 1)

Removes the duplication before adding the record-based projection. Rejected because this would cause a gap — rendered output would be missing invariants — between the prose removal and the script landing. Phase 1 first is the safe order.

### Alt D — Add a dedicated heading-label field to the invariant type

Would make heading generation explicit without normalization. Rejected because the current `group` field provides adequate information via the normalization algorithm specified in Change A, and adding a new field is a data-model change that outscopes the rendering fix.

---

## Open Questions

**None.** All implementation choices are resolved in Revision 2.
