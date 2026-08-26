# Grid census

Mechanized cell classification of the standard's own normative corpus (srs#471,
`rfc-decision-b9d7096e` "MECHANIZED BALANCE"). This is the AUTOCLASSIFICATION operation's
MECHANIZED BALANCE use — the standard's corpus auto-placed into Pattern Grid cells each
assessment cycle, instrumenting the cyclical axis-balance counts (`rfc-decision-8f5aca2c`)
mechanically instead of by hand-census.

**Placements are testimony, never authority** (axis 4–10, `rfc-decision-16b20c56`). A census file
informs the reviewed placement of record; it never overrides it. Every entry carries
`"status": "unreviewed"` until a human or primary-session review promotes it.

Not wired into CI. The census is a cycle act, not a guard — see `docs/charter/decision-compass.md`
under "Grid operations": guards stay syntactic, a classifier in CI would be judgment masquerading
as a guard.

## Files

- `classify-prompt.md` — the classification rubric (twelve cells, rules, output shape). The valid
  cell slugs are read from `scripts/lib/pattern-grid-cells.mjs` at classification time, never
  restated here (srs#462 — one source of truth).
- `extract-corpus.mjs` — deterministic extraction of the corpus into statement-units. Re-running
  it over an unchanged tree reproduces `census-input.json` byte-for-byte.
- `census-input.json` — the committed extraction output (one entry per invariant, per
  `rfc-decision` record's `decision_statement`, and per normative-modal-verb paragraph/list-item
  in a subsection's `content`).
- `assemble-census.mjs` — merges a cycle's classification results (per-batch JSON files from the
  rubric) with `census-input.json`, validates them, computes the counts table, and writes
  `census-<cycle>.json`.
- `census.schema.json` — the committed JSON Schema for a census file's shape.
- `validate-census.mjs` — checks a census file against `census.schema.json`.
- `compute-counts.mjs` — the four readings (row / column / modality diagonal / polarity axis) of
  a census file, plus the `none`-classified list. Mechanical only — it does not author the diff
  commentary against the prior cycle (see below).
- `census-<cycle-date>.json` — one committed file per cycle run.

## Re-run cycle procedure

1. **Extract.** `node scripts/grid-census/extract-corpus.mjs` — regenerates `census-input.json`.
   Diff it against the previous commit; a nonzero diff means the corpus changed since the last
   cycle (new invariants, decisions, or subsection rules) — expected and fine, just note the delta
   in the cycle write-up.
2. **Classify.** Batch `census-input.json`'s `statements` array (any batch size; batch boundaries
   carry no meaning downstream) and run each batch through a subagent given
   `classify-prompt.md` as its rubric, the batch as input, and instructed to write its
   `{id, cell, confidence, note}` results to a JSON file. This step is not scripted — an LLM call
   is not a deterministic, re-runnable step by nature — but the CALLING convention above is fixed
   so `assemble-census.mjs` can consume any cycle's results the same way.
3. **Assemble.** `node scripts/grid-census/assemble-census.mjs <YYYY-MM-DD> <results-dir>` —
   merges, validates ids/cells/confidence against the corpus and the live slug set, computes
   `counts`, and writes `census-<cycle>.json`.
4. **Validate.** `node scripts/grid-census/validate-census.mjs scripts/grid-census/census-<cycle>.json`.
5. **Read the counts.** `node scripts/grid-census/compute-counts.mjs scripts/grid-census/census-<cycle>.json`
   — the four readings plus the `none` list. Compare against the prior cycle's census file (or, for
   the first cycle, against the 2026-08-21 hand census recorded in `rfc-decision-8f5aca2c`'s
   `decision_statement` — note that snapshot is a *qualitative, principle-coverage* reading, not a
   corpus-placement count, so the comparison is a read-against, not a numeric diff. See
   `rfc-decision-8f5aca2c`'s "Cyclical axis-balance counts" clause for the imbalance-reading
   discipline: an imbalance that survives re-placement is a coverage gap, not a classification
   error, and the counts are prompts for conversation, never targets).
6. **Post.** Comment the counts table, the `none` list, and the diff commentary on srs#435.

## Design notes for future cycles

- **Extraction scope is fixed** to `srs/records/invariants/*.json`,
  `srs/records/tier-2/rfc-decision-*.json`, and normative-modal-verb blocks in
  `srs/records/subsections/*.json`'s `content`. If the corpus grows a new normative-statement
  location (e.g. a new record type), extend `extract-corpus.mjs`'s three extractor functions
  rather than hand-editing `census-input.json`.
- **Subsection rule blocks are not literal `[R-n]`/`[N+n]` markers.** Those bracket tags, where
  present in subsection prose, are citations to RFC rule numbers scattered through free text, not
  block delimiters — the source records do not pre-segment prose into rule blocks. A rule block
  here is therefore defined operationally: a paragraph or list item (fenced code excluded)
  containing an RFC-2119 modal keyword (MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT,
  REQUIRED). Any `[R-n]`/`[N+n]` tag found inside a block is carried as `ruleTag` for traceability.
  This is a deliberate, documented heuristic, not a claim that every normative subsection sentence
  is captured or that every extracted block is equally load-bearing — read `none`-classified and
  low-confidence entries with that in mind.
- **`none` is a finding, not noise.** Do not filter it out of the cycle write-up; a genuine `none`
  placement is exactly the signal `rfc-decision-b9d7096e` asks this operation to surface.
