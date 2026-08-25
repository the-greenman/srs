# The Decision Compass

<!-- srs-charter-ids:v1
The charter-class decision records this compass is bound to. check-decision-compass-drift.mjs
enforces bidirectional presence: every id below must resolve to srs/records/tier-2/rfc-decision-
<id>.json, and every id below must appear (as `rfc-decision-<id>`) somewhere in this file's body.
Adding a charter-class ruling: add its id here AND write the section that cites it, in the same
change — the guard fails on either half done alone.
cce3c00e 9ee14517 7caca3a1 8f5aca2c b9d7096e
c8704763 2a1e1590 53635966 628cf6c4 16b20c56 5f8204bc 8948e43f
-->

The charter's ambient surface — one hop from every session start, for the rule the charter itself
states: *"a rule stated once, remaining sites silent"* is the drift shape the 2026-08-21 audit
found. This page is a **pointer surface, not a fork**: it states each preference in one or two
sentences and cites the `rfc-decision-…` record that rules it. The record is canonical; read it
before relying on a boundary clause, a rationale, or an exception. Nothing below is inlined that a
record already carries in full (evidence, alternatives considered, accepted costs) — see
[Background reading](#background-reading) on why the page stays this thin.

**Every new RFC and decision names its cell** (`rfc-decision-cce3c00e`) and, since 2026-08-23, its
**decision mode** (`rfc-decision-7caca3a1`) — see [Two review tests](#two-review-tests) and
[Decision modes](#decision-modes) below.

## The Pattern Grid

`rfc-decision-cce3c00e` — a 3×4 matrix: four **elements** (Fire — action/change; Earth —
structure/data; Air — information/process/standards; Water — relation/connection/attribution/trust)
crossed with three **levels** (Individual, Relational, Systemic), yielding twelve zodiac-anchored
cells. Reading the levels top-to-bottom and the elements Fire→Earth→Air→Water left-to-right
reproduces the zodiac in canonical order; modality is constant on the diagonals — **Cardinal**
(where authority is anchored), **Fixed** (the stability core), **Mutable** (where change is legal).

| | Fire | Earth | Air | Water |
|---|---|---|---|---|
| **Individual** | ♈ Versioning (Cardinal) | ♉ Identity (Fixed) | ♊ Description (Mutable) | ♋ Attribution (Cardinal) |
| **Relational** | ♌ Succession (Fixed) | ♍ Containment (Mutable) | ♎ Reference (Cardinal) | ♏ Assertion (Fixed) |
| **Systemic** | ♐ Governance (Mutable) | ♑ Repository (Cardinal) | ♒ Conformance (Fixed) | ♓ Portability (Mutable) |

Opposite cells (six apart in reading order) form the six axes below. Diagonal reading gives the
Cardinal set {Versioning, Attribution, Reference, Repository}, the Fixed set {Identity, Succession,
Assertion, Conformance — attested as the stability core in `rfc-decision-8f5aca2c`'s balance
snapshot}, and the Mutable set {Description, Containment, Governance, Portability}.

## Six axis preferences

Default pole, plus the boundary clause that names when the other pole governs instead. Kind:
**default** (the preferred pole) / **rule** (the condition that overrides or precommits it) — see
[Kind tagging](#kind-tagging-and-the-observability-pressure-audit).

| Axis | Default pole (kind: default) | Boundary clause (kind: rule) | Ratified in |
|---|---|---|---|
| 1–7 Versioning↔Reference | Semantic Integrity over Practical Expression | — | `rfc-decision-cce3c00e`, `rfc-decision-c8704763` |
| 2–8 Identity↔Assertion | Evolution over Continuity | Phase-bound: precommitted to flip to Continuity at the first full public release | `rfc-decision-cce3c00e`, `rfc-decision-2a1e1590`, `rfc-decision-53635966` |
| 3–9 Description↔Governance | Shared Coherence over Local Autonomy | — | `rfc-decision-cce3c00e`, `rfc-decision-628cf6c4` |
| 4–10 Attribution↔Repository | Office over Testimony (mythic register: Athena over Aphrodite) | Testimony fills gaps, never contradicts authority, and is promoted into office only by verification | `rfc-decision-cce3c00e`, `rfc-decision-16b20c56` |
| 5–11 Succession↔Conformance | Reliability over Renewal | Standing contracts hold; renewal only as explicit supersession at a declared boundary | `rfc-decision-cce3c00e`, `rfc-decision-5f8204bc` |
| 6–12 Containment↔Portability | Portability over Possession | A capability that exists only in place is captivity; the exception delegates to axis 3–9's explicit-local boundary | `rfc-decision-cce3c00e`, `rfc-decision-8948e43f` |

## Twelve cell preferences

This-over-that, one line each (kind: **default**). Full principle and machinery: the cited record.

| Cell | This over that | Cites |
|---|---|---|
| Versioning | increment over edit | `rfc-decision-cce3c00e`, `rfc-decision-2a1e1590` |
| Identity | identifier over label | `rfc-decision-cce3c00e`, `rfc-decision-53635966` |
| Description | one name over many | `rfc-decision-cce3c00e`, `rfc-decision-628cf6c4` |
| Attribution | stated over assumed | `rfc-decision-cce3c00e`, `rfc-decision-16b20c56` |
| Succession | successor over overwrite | `rfc-decision-cce3c00e` |
| Containment | declaration over location | `rfc-decision-cce3c00e`, `rfc-decision-8948e43f` |
| Reference | declared strength over convenient reach | `rfc-decision-cce3c00e`, `rfc-decision-c8704763` |
| Assertion | statement over side-effect | `rfc-decision-cce3c00e` |
| Governance | migration over drift | `rfc-decision-cce3c00e` |
| Repository | catalog over circumstance | `rfc-decision-cce3c00e` |
| Conformance | one way over many | `rfc-decision-cce3c00e` |
| Portability | preserve over recognize | `rfc-decision-cce3c00e`, `rfc-decision-8948e43f` |

## Four column principles

Each matures Individual → Relational → Systemic (kind: **rule**). `rfc-decision-cce3c00e`:

- **Fire** — change preserves what it replaces.
- **Earth** — structure is declared, never inferred; **identity conflicts are fatal**, never
  resolved by precedence.
- **Air** — meaning is stated once and validated against its statement; **informational conflicts
  resolve by declared authority** — the hint loses, visibly.
- **Water** — connection is explicit and carried, never implied or dropped.

The Earth/Air conflict-rule distinction above *is* the charter's conflict-resolution rule (RFC-038
[R12], Invariant 28): an Earth-plane (identity) conflict is fatal and unrecoverable; an Air-plane
(informational) conflict resolves downward to the declared authority instead of failing closed.
Confusing the two — silently preferring one hint over another where an identity clash needs to be
fatal, or hard-failing where a declared authority should simply win — is the column-coherence
violation this rule exists to catch.

## Six layer rules, three planes

`rfc-decision-9ee14517` — a companion register to the grid: where the grid locates concerns by
element and level, the layer rules govern **stacking** — what sits on what, what may know about
what (kind: **rule**).

- **MEANING** (what things are): substrate → definitions → instances.
- **EXPRESSION** (how meaning is shown): selection → composition → presentation → projection.
- **OPERATION** (who does what): core service → adapters (CLI, WASM, MCP) → clients.

1. **One home** — every construct names its plane and layer; a concern expressed in two layers is
   drift by definition.
2. **Consume, don't clone** — an upper layer references a lower layer's constructs through the
   reference taxonomy; it never re-implements a lower-layer mechanism.
3. **Expression never alters meaning** — nothing in selection, composition, presentation, or
   projection may change validity, identity, state, or relations.
4. **Crossings are declared, and the lower layer wins** — where a layer legitimately carries
   another layer's data, the crossing is named where it occurs and conflicts resolve downward,
   visibly. Identity conflicts remain fatal per the Earth rule — they are not crossings.
5. **Every layer stands alone below** — a layer must be complete and valid with every layer above
   it absent (the spec without any implementation, records without any view, ...).
6. **Behavior needs a contract** — an affordance enters the standard only with enforcement
   semantics; until then it is application-private behind axis 3–9's explicit-local boundary.

## Two review tests

Asked of every proposal, alongside naming its cell and mode (kind: **test**):

1. **Cell check** (`rfc-decision-cce3c00e`) — which cell does this land in? Does it contradict the
   cell's preference? If it lands in no cell, that is a finding against the grid, resolved by
   refining the grid — never by ignoring the proposal.
2. **Layer test** (`rfc-decision-9ee14517`) — which layer owns this? Does it consume or clone
   downward? Can the layer below it still stand alone?

## Decision modes

`rfc-decision-7caca3a1` — every charter-checked decision names its mode; the mode determines which
machinery applies (kind: **rule**):

- **Clear / Complicated** — addressed through rules: cell citation, governing preference, a
  boundary-clause justification for a non-default pole, and a past-decision search.
- **Complex** — charter citation alone is *insufficient* (forcing a single-cell citation is the
  premature-classification pathology, forbidden by name). The mechanism is **the geometry of the
  matrix**: the decision is mapped across the cells it genuinely touches, its options plotted for
  consequences along the axes and polarities, checked for column coherence, examined for emergence.
  A complex decision resolves into rulings, never into guard compliance.
- **Chaotic** — outside the spec boundary entirely; no charter process applies until the situation
  again admits mapping, re-entering as complex or complicated.
- **Unresolved / contested** — default to the more cautious handling: complex over complicated,
  boundary over adjudication.

## Grid operations

Three operations (`rfc-decision-8f5aca2c`) plus two more (`rfc-decision-b9d7096e`), extending the
grid as a standing instrument rather than a one-shot census (kind: **default**, re-applied each
assessment cycle):

- **Reach marking** — every cell carries INSIDE / SHARED / BEYOND, re-marked each cycle
  (phase-dependent). A thin cell is either a discovery gap (thin-and-inside) or needs a
  conversation, not more solo work (thin-and-shared-or-beyond).
- **Sequence propagation** — the twelve cells in reading order form a development that closes:
  position 12 feeds position 1. Trace a gap forward by asking what it denies the next cell;
  secondaries accumulating without primaries signal causes recorded without consequences.
- **Cyclical axis-balance counts** — each assessment cycle, record counts per row, column, modality
  diagonal, and polarity axis. An imbalance that survives re-placement is a coverage gap, not a
  classification error — the counts are prompts for re-placement and conversation, never targets.
- **Autoclassification** — a corpus's statements are placed into cells at scale (label set: the
  twelve cell slugs, srs#462) by LLM classification. Placements are **diagnostic-mode input and
  provisional testimony** (axis 4–10) — they inform and never override the reviewed placement of
  record; a statement landing in no cell is a finding to surface, never a forced fit.
- **The stance vocabulary** — sixteen half-hexagram stances (eight lower/internal, eight
  upper/outward) give the operations register a plain-language layer. SRS in formation reads as
  Engagement × Articulation; at the precommitted Continuity flip (axis 2–8), Purpose × Articulation.

## Kind tagging and the observability-pressure audit

Two research riders on srs#461, both provisional pending the owner's future ruling on force/
confidence grading:

**Kind.** Each preference line above carries a lightweight kind tag — **reason** (rationale, not
enforced directly), **default** (a preferred pole, overridable), **test** (a question asked of a
proposal), or **rule** (a condition that binds). The scheme applied here: axis default poles and
cell preferences are *default*; boundary clauses, column principles, and layer rules are *rule*;
the cell check and layer test are *test*. This is a first pass, not a ruling — refine it when the
force/confidence grading question is resolved.

**Observability-pressure audit (one-time, 2026-08-23).** For each axis and each layer rule: which
pole is mechanically easy for an agent to verify, and which is systematically hard — because the
hard-to-verify pole is where automated ritualization (citing the cell without honoring it) will
bite first.

| Preference | Easy to verify mechanically | Hard to verify mechanically |
|---|---|---|
| 1–7 Semantic Integrity over Practical Expression | A cell citation is present in the RFC/decision text | Whether the citation is honored, not just present |
| 2–8 Evolution over Continuity | Whether a Continuity-flip precommitment exists in the text | Whether "evidence-led" evolution was actually evidence-led |
| 3–9 Shared Coherence over Local Autonomy | Whether a rename shipped with a migration artifact | Whether the migration's naming is coherent, not just present |
| 4–10 Office over Testimony | Whether attribution/provenance fields are absent from the schema (the machinery is removed) | Whether a testimony source was quietly treated as authoritative in review |
| 5–11 Reliability over Renewal | Which retirement mechanism (deletion / status / supersession) a layer uses | Whether a "renewal" silently broke a standing contract instead of superseding it |
| 6–12 Portability over Possession | Whether a bundle/archive form exists for a held construct | Whether the travelling form is actually exercised, or exists unused |
| Rule 1 One home | A construct's plane/layer is named in its RFC | Whether a concern quietly grew a second home elsewhere |
| Rule 2 Consume, don't clone | Whether a lower-layer mechanism is re-implemented under a new name | Whether a "reference" is really full re-implementation in disguise |
| Rule 3 Expression never alters meaning | Whether presentation-layer fields carry validity/state keywords | Whether a hint is *read as* meaning downstream, informally |
| Rule 4 Crossings declared, lower layer wins | Whether a crossing is named at the point it occurs | Whether the declared crossing actually resolves downward under conflict |
| Rule 5 Every layer stands alone below | Deleting all expression and checking the meaning layer still validates | Whether a "stands alone" claim was tested, or only asserted |
| Rule 6 Behavior needs a contract | Whether enforcement semantics are defined anywhere for an affordance | Whether an undefined affordance is being relied on informally anyway |

## Background reading

The compass stays a **minimal pointer surface** — retrieval over presence, never the accumulated
model. The 2026 empirical studies of repository context files (context bloat and lint leakage often
raising agent cost without raising task success; minimal beat auto-generated) bind this page
directly: everything above links out to its ruling record; nothing is inlined beyond what is needed
to know which record to open.

- **Taste Made Portable — why tension statements invert and what defends them** (note
  `7e8d9753`) — why codified rules invert on contact with institutions, and what the grid's
  cell-plus-boundary-clause form does differently.
- **Fundamental Tensions as the Generative Root** (note `fundamental-tensions`) — tensions
  generate principles; this compass is downstream of that method.
- **Design Jurisprudence** (Tier-0 note, srs#472 — open, not yet merged as of this page; cite it
  here by id once landed) — the decision-coherence research: design coherence as a fourth problem
  class beside state/implementation/historical coherence; the map's safest role is a *neighbourhood
  index* (which prior judgements a new decision must reckon with — preserve / distinguish /
  challenge / supersede), cells as one retrieval signal among several, not the ontology of truth.
  The argument for this page pointing at the **decision log**
  (`docs/spec/rfcs/rfc-decision-log.md`), not only at current rules: most manifests carry no
  trajectory, and the trajectory is where a new decision's neighbours live.

## Maintenance

The `<!-- srs-charter-ids:v1 -->` block at the top of this file is machine-checked by
`scripts/check-decision-compass-drift.mjs` (run via `node scripts/validate-all.mjs`): every id
listed there must resolve to an existing `srs/records/tier-2/rfc-decision-<id>.json`, and every id
must be cited (as `rfc-decision-<id>`) somewhere in this file's body. Landing a new charter-class
ruling is one change: add the id to the block above **and** write the section that cites it.
