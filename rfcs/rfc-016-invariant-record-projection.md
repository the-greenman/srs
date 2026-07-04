> **GitHub issue**: [the-greenman/srs#116](https://github.com/the-greenman/srs/issues/116)

# RFC-016: Invariant Record Projection

**Status**: Draft (Revision 1)
**Affects**: `com.semanticops.spec/invariant` (rendering); `scripts/publish-spec.mjs`; subsection body records (Phase 2)
**Author**: design dialogue draft
**Date**: 2026-07-04

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-04 | Initial draft |

---

## Abstract

The rendered "Key Invariants" section of `docs/spec/srs-spec.md` is currently populated from hand-written prose embedded in subsection body records, not from `com.semanticops.spec/invariant` records. This means invariants I-63–I-84 (added by RFC-009, RFC-013, and RFC-014) are invisible in every rendered view, and invariants 1–62 are duplicated — once as records and once as subsection prose — creating a silent divergence risk. This RFC establishes that the rendered invariant list MUST be a projection of `invariant` records, and specifies a two-phase implementation: a post-render injection script (Phase 1) that stops the bleeding immediately, followed by removal of the duplicate prose from subsection bodies (Phase 2).

---

## Motivation

### Problem 1 — Invariant records are not the source for the rendered Key Invariants section

The `srs` specification repo's own principle is: "the records are the source of truth; the markdown is a projection." For the Key Invariants section this principle is violated. The current rendering pipeline (`srs render document-view` via the Rust CLI) emits the Key Invariants section from the body text of subsection records (e.g. `records/subsections/08-1-field-semantics.json`), which contain hand-written `**N.** ...` prose. The `com.semanticops.spec/invariant` records in `records/invariants/` are never read during rendering.

Consequence: invariants added via the RFC pipeline (which authors `invariant` records as directed) never reach the rendered spec. As of this writing, 11 invariant records — I-63–I-66, I-78–I-84 — are invisible to any reader of `docs/spec/srs-spec.md`.

### Problem 2 — Invariants 1–62 are duplicated and can diverge

Invariants 1–62 are authored twice: as records in `records/invariants/invariant-001.json` … `invariant-062.json`, and again as inline prose in subsection bodies. The rendered output comes from the prose. The two copies can diverge silently — a change to a record body is not reflected in the rendered spec until the subsection prose is also updated. There is no validation that detects drift between the two.

---

## Proposed Changes

### Change A — Add `scripts/render-invariants.mjs`

Add a new script that reads all `com.semanticops.spec/invariant` records from `srs/records/invariants/`, sorts them by `invariant-number`, groups them by the `group` field, and generates the full Key Invariants section as a markdown string.

Sorting: normalize `invariant-number` values to integers for sort purposes. Integer values (1–62) sort before "I-NN" string values; for "I-NN" strings, sort numerically by the integer after the hyphen.

Grouping: records with the same `group` value are emitted under a `####` heading derived from that value. Groups appear in ascending order of their lowest-numbered invariant.

Output format per invariant:

```
**N.** <body>
```

or for I-NN-style numbers:

```
**I-NN.** <body>
```

### Change B — Update `scripts/publish-spec.mjs` to call the projection

After `renderDocumentViews()` runs, call the invariant projection step. The step reads each rendered markdown file listed in `VIEW_EXPORTS`, locates the "Key Invariants" heading region, replaces any existing inline `**N.**` prose blocks and `#### <group>` subheadings within that region with the output of `render-invariants.mjs`, and writes the file back in place.

The region to replace is defined as: from the first `### Key Invariants` heading to the next `---` horizontal rule (exclusive). If no such region exists in a given view, the step emits a warning and skips that file.

### Change C — Remove inline invariant prose from subsection bodies (Phase 2)

After Phase 1 is deployed and validated, remove the `**N.** ...` inline prose from all subsection body field values (`fieldId: 1a000003-0000-4000-a000-000000000003`) that currently embed it. The subsection body should retain only the introductory sentence ("Conforming implementations must uphold the following invariants.") and the `#### <group>` headings that serve as visual anchors; the invariant list itself is dropped from the body and comes entirely from records.

Phase 2 is independently shippable and may be deferred to a follow-up PR once Phase 1 is verified.

---

## Conformance Rules

> **[R1]** Every `com.semanticops.spec/invariant` record present in the repository MUST appear in the rendered "Key Invariants" section of each document view that contains a `### Key Invariants` heading.

> **[R2]** The rendering order of invariants MUST be ascending by `invariant-number`, with integer values preceding "I-NN"-form values, and "I-NN" values sorted numerically.

> **[R3]** Each invariant MUST appear exactly once in the rendered Key Invariants section. No record may be duplicated.

> **[R4]** After Phase 2, subsection body text (`fieldId: 1a000003-0000-4000-a000-000000000003`) MUST NOT contain inline `**N.**`-format invariant prose. Invariant records are the sole authoritative source.

> **[R5]** The `publish-spec.mjs` pipeline MUST fail with a non-zero exit code if the invariant projection step encounters a malformed `invariant-number` value or a record missing a required field (`invariant-number`, `body`).

---

## Schema changes

**None.** The `com.semanticops.spec/invariant` record schema is unchanged. No new fields, no new relation types. This RFC changes only the rendering pipeline.

---

## Rationale

A script-based post-render injection (Change B) is chosen over modifying the Rust CLI (`srs render document-view`) for two reasons: (1) it confines the change to the `srs` repo, avoiding a coordinated cross-repo release; (2) the document view rendering infrastructure in the Rust CLI is not yet capable of type-aware collection steps — adding that capability is a larger architectural change that can follow independently once the bleeding is stopped.

The two-phase approach (Phase 1: inject from records while keeping prose; Phase 2: remove prose) allows the fix to ship without a large-scale rewrite of subsection bodies in the same PR, reducing risk. Phase 1 alone satisfies R1–R3 and makes all invariants visible.

The `group` field (`fieldId: 1a000021-0000-4000-a000-000000000021`) already exists on every invariant record and provides sufficient grouping information for rendering. No new field is required.

---

## Alternatives Considered

### Alt A — Fix the Rust CLI to collect invariant records in document-view rendering

Would cleanly integrate invariant collection into the existing rendering architecture. Rejected for this RFC because: (a) requires coordinated srs-rust changes and a new release before any fix is visible; (b) the document-view renderer would need a new concept of "type-collection steps" with ordering and grouping logic. Filed as a long-term improvement.

### Alt B — Author `contains` relations from section records to invariant records

Would make invariant membership in a section explicit in the record graph. Rejected because the `group` field already encodes this information adequately for rendering, and adding 73+ relations would be mechanical with no semantic gain at this stage.

### Alt C — Migrate subsection prose first (Phase 2 before Phase 1)

Removes the duplication before adding the record-based projection. Rejected because this would cause a gap — rendered output would be missing invariants — between the prose removal and the script landing. Phase 1 first is the safe order.

---

## Open Questions

**None.** The problem is fully characterized and both implementation phases are well-defined.
