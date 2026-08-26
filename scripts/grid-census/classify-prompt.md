# Grid census — classification rubric

Classify each statement-unit from the standard's normative corpus into exactly one Pattern Grid
cell, or `none`. This rubric is the classification prompt for srs#471 (`rfc-decision-b9d7096e`,
"MECHANIZED BALANCE"): the standard's own corpus, auto-placed into cells, each assessment cycle.

**Label set.** The twelve legal cell slugs are `scripts/lib/pattern-grid-cells.mjs`
(`loadCellSlugs()`) — read at classification time, not restated here, so this rubric cannot drift
from the one source of truth (srs#462). The caller injects the current slug list into your batch
alongside the statements; treat any slug outside that list as invalid.

## The twelve cells

A 3×4 matrix: four **elements** (Fire — action/change; Earth — structure/data; Air —
information/process/standards; Water — relation/connection/attribution/trust) crossed with three
**levels** (Individual, Relational, Systemic).

| | Fire | Earth | Air | Water |
|---|---|---|---|---|
| **Individual** | `versioning` — increment over edit | `identity` — identifier over label | `description` — one name over many | `attribution` — stated over assumed |
| **Relational** | `succession` — successor over overwrite | `containment` — declaration over location | `reference` — declared strength over convenient reach | `assertion` — statement over side-effect |
| **Systemic** | `governance` — migration over drift | `repository` — catalog over circumstance | `conformance` — one way over many | `portability` — preserve over recognize |

Each cell's "this over that" line is its preference, not its definition — use it to disambiguate
between two plausible cells, not to force a fit. Full principle and machinery for each cell is in
`docs/charter/decision-compass.md` and the `rfc-decision-…` records it cites; when a statement's
cell is genuinely unclear from the one-line preferences here, prefer `none` over a guess.

A rough test per element, if the cell itself doesn't resolve it: Fire — is this about *changing or
sequencing* something? Earth — about *what something structurally is or is made of*? Air — about
*information, description, or process correctness*? Water — about *a relation, connection,
attribution, or trust boundary*? And per level: Individual — about one instance/entity alone?
Relational — about how two or more relate? Systemic — about the repository/corpus/governance as a
whole?

## Rules (rfc-decision-b9d7096e, rfc-decision-7caca3a1, rfc-decision-16b20c56)

1. **Fuzzy edges are carried, not forced.** A statement that plausibly touches two cells is still
   classified into the ONE cell its primary claim belongs to; note the secondary touch in `note` if
   it matters. Do not invent a thirteenth "hybrid" label.
2. **`none` is a valid and REQUIRED output when genuine.** A statement landing in no cell is a
   finding to surface, not a defect to paper over. Forcing a fit is the premature-classification
   pathology this rubric exists to avoid — prefer `none` over a low-confidence guess between two
   weak fits.
3. **Placements are testimony, never authority.** Your output is diagnostic-mode input (axis
   4–10, Office over Testimony) — it informs the reviewed placement of record and never overrides
   it. Say what you actually see in the text; do not try to reconcile with what you'd expect a
   "well-balanced" corpus to look like.
4. **Confidence is about the classification, not the statement's importance.** `high` — the cell is
   unambiguous from the text alone; `medium` — plausible but a reasonable reader could pick an
   adjacent cell; `low` — you are choosing between two-plus weak fits, or leaning `none` but not
   fully certain. Use `low` liberally rather than rounding up.

## Output shape

For each statement in the batch, in the same order, emit ONE JSON object:

```json
{ "id": "<statement id, copied verbatim>", "cell": "<slug>" | null, "confidence": "high" | "medium" | "low", "note": "<one short sentence — why this cell, or why none>" }
```

Return a single JSON array of these objects — nothing else, no markdown fences, no commentary
outside the array. `cell: null` means `none`. Every input statement id must appear exactly once in
your output, in the same order it was given.
