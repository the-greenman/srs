# Epic 256 decision-history cube analysis

Status: audited historical synthesis; non-normative.

This report describes the 171 atomic decisions in [`decision-ledger.json`](decision-ledger.json) at corpus snapshot `ae52927de4e45490cb427fee2b332d5351f536cd`. It does not ratify future project values. Counts are reproduced by [`analyze.mjs`](analyze.mjs) in [`cube-analysis.json`](cube-analysis.json).

## Result

Epic 256 shows strong historical biases toward **Semantic Integrity** and **Shared Coherence**. It shows only an **Evolution tendency**, not a temporal bias: continuity safeguards are too frequent and too structurally important to describe Evolution as the established constitutional default.

| Axis | Counted decisions | Raw distribution | Independent family majorities | Worst case after plausible unresolved opposites | Classification |
| --- | ---: | --- | --- | ---: | --- |
| Semantic Integrity ↔ Practical Expression | 98 | Integrity 87 (88.78%); Expression 11 (11.22%) | Integrity 7/8; Expression 1/8 | Integrity 70.16% | **strong bias: Integrity** |
| Continuity ↔ Evolution | 84 | Continuity 33 (39.29%); Evolution 51 (60.71%) | Continuity 2/8; Evolution 6/8 | Evolution 38.35% | **tendency: Evolution** |
| Shared Coherence ↔ Local Autonomy | 97 | Coherence 80 (82.47%); Autonomy 17 (17.53%) | Coherence 8/8; Autonomy 0/8 | Coherence 70.18% | **strong bias: Coherence** |

The worst-case figures include eligible-but-nondirectional decisions and only the unresolved cards whose live alternatives could plausibly favor the opposite pole. They do not assume every open question will oppose the observed winner. The explicit card lists and rationales are stored under `bias_reversal_assessment` in the ledger.

The two strong classifications are robust, but only narrowly so under the deliberately conservative worst case. Their raw and family-normalized evidence is much stronger than the 70% floor; the narrow margin comes from the still-open definition- and instance-layer disposition work.

## Family-normalized distributions

The table reports eligible high/medium directional decisions. `I/E` means Integrity/Expression, `C/Ev` Continuity/Evolution, and `Co/Au` Coherence/Autonomy.

| Family | I/E | Majority | C/Ev | Majority | Co/Au | Majority |
| --- | ---: | --- | ---: | --- | ---: | --- |
| A — model and bootstrap | 20/0 | Integrity | 4/9 | Evolution | 17/3 | Coherence |
| B — rendering and publication | 5/7 | Expression | 3/9 | Evolution | 10/2 | Coherence |
| C — carrier architecture | 12/1 | Integrity | 6/7 | Evolution | 10/2 | Coherence |
| D — repository authority | 19/2 | Integrity | 7/12 | Evolution | 16/6 | Coherence |
| E — migration and cutover | 13/0 | Integrity | 5/8 | Evolution | 13/0 | Coherence |
| F1 — definition self-hosting | 8/0 | Integrity | 2/5 | Evolution | 5/2 | Coherence |
| F2 — instance and authorship | 3/0 | Integrity | 2/1 | Continuity | 2/1 | Coherence |
| G — operational reliability | 7/1 | Integrity | 4/0 | Continuity | 7/1 | Coherence |

Family H has no ratified or implemented precedent-setting or reasoned-application card and therefore contributes no family vote. Its open boundary questions remain visible in the reversal assessment.

Family B's Expression majority is not a contradiction. Its decisions operate at an explicitly declared projection boundary: view-owned dispatch, portable field rows, placeholders, graceful fallback, and publication reachability. The semantic record remains authoritative. This is the clearest evidence that the first lens is genuinely polar rather than a relabelled good/bad scale.

The temporal distribution is different. Six families evolved the model, while F2 and G concentrated on closure, reproducibility, and safe delivery. Within most families, Evolution decisions are paired with Continuity gates: stable identities, deterministic migration, complete diagnostics, pinned baselines, atomic cutover, or rollback. History therefore supports a conditional movement pattern, not an unconditional pole.

## Cube occupancy

| Placement | Cards | Share of ledger | Interpretation |
| --- | ---: | ---: | --- |
| Vertex | 97 | 56.73% | all three tensions were evidenced directionally |
| Edge | 30 | 17.54% | two tensions were evidenced |
| Axis only | 4 | 2.34% | one tension was evidenced |
| Unmapped centre | 40 | 23.39% | no named-pole placement was justified |

All 40 centre cards are unresolved decisions. Every non-unresolved card maps to at least one lens. Of the 131 mapped cards, 74.05% occupy a vertex, 22.90% an edge, and 3.05% one axis.

| Coordinate | Cards |
| --- | ---: |
| Integrity · Evolution · Coherence | 47 |
| Integrity · Continuity · Coherence | 29 |
| Integrity · Evolution · Autonomy | 10 |
| Expression · Evolution · Coherence | 6 |
| Integrity · Autonomy | 5 |
| Expression · Continuity · Coherence | 3 |
| Integrity · Continuity | 3 |
| Integrity · Continuity · Autonomy | 2 |
| Integrity · Coherence | 15 |
| Expression · Coherence | 2 |
| Continuity · Autonomy | 2 |
| Autonomy | 2 |
| Evolution · Coherence | 1 |
| Integrity · Evolution | 1 |
| Expression · Continuity | 1 |
| Integrity | 1 |
| Coherence | 1 |
| Centre | 40 |

Six of the eight fully directional vertices are occupied. The absent vertices are Expression · Continuity · Autonomy and Expression · Evolution · Autonomy. This is a coverage finding, not proof that those combinations are impossible; future extension- or presentation-owned decisions are the best place to test them.

## Biases, exceptions, and safeguards

### Semantic Integrity

The project repeatedly paid migration, authoring, implementation, and coordination costs to preserve exact meaning, identity, authority, provenance, typed relations, or non-substitution. Representative precedents include orthogonal `fieldType` facets (E256-A01), exact versioned range identity (E256-A02), closed reference integrity (E256-D08), and whole-repository abort on ambiguous migration (E256-E08).

The 11 eligible Expression decisions are genuine counter-movements, not noise:

- five `principled-contextual` decisions define usable projection behavior within the DocumentView or carrier boundary (E256-B05, B06, B11, B12, C01);
- six `counterpole-protection` decisions ensure that correct semantics remain reviewable, reachable, diagnosable, or deterministic in use (E256-B03, B04, B13, D19, D21, G04).

Their recurring safeguard is that presentation may omit, format, order, explain, or fall back, but it must not silently change the semantic record or become a second semantic authority.

### Continuity and Evolution

Evolution leads 51 to 33 and six family majorities to two, but its 60.71% decision share misses the 70% primary-bias threshold. Thirty-two unresolved cards could plausibly preserve current fields, aliases, shapes, boundaries, readers, or tooling. The temporal lens must therefore be reported as mixed with an Evolution tendency.

Because no temporal bias is established, no Continuity decision is labelled an exception. Continuity cases instead reveal the conditions under which change has historically been considered safe: explicit supersession, stable identities, deterministic output, compatibility windows, atomic transforms, parity baselines, complete diagnostics, and rollback.

### Shared Coherence

The project repeatedly selected one authority, one semantic contract, one validation rule, one deterministic interpretation, or one coordinated cutover. Every counted family has a Coherence majority.

The 17 eligible Autonomy decisions define bounded ownership rather than permission to fork meaning:

- eleven are `principled-contextual`, placing presentation, extension facets, project-local row models, independent objects, or undemonstrated features behind explicit boundaries;
- five are `counterpole-protection`, preventing shared rules from becoming hidden global dependencies, global naming constraints, path-derived identity, or claims over implementation-private space;
- E256-G08 is `transitional`: repository authority is respected even though separately authorized mirror work creates a temporary ecosystem gap.

The recurring safeguard is an explicit shared boundary: ordinary package resolution, effective-Type inheritance, a DocumentView conformance claim, reserved repository locations, canonical bytes, or truthful diagnostics.

## Contradictions and gaps

No audited card currently meets the threshold for `possible-contradiction`. Apparent opposites reconcile through scope, layer, timing, or an explicit counter-pole safeguard. That is a research result, not a claim that the open work is harmless.

The material gaps are:

- **40 unresolved cards.** Most sit in F1/F2 artifact disposition and the H boundary search; none enters historical bias counts.
- **Temporal constitution.** History does not decide whether future work should default to Evolution, Continuity, or an explicitly conditional stance.
- **Extension posture.** E256-H01 and H02 leave reader behavior and the strategic open/closed extension goal undecided.
- **Presentation failure semantics.** E256-H03 leaves the consequence of an ineligible `titleFieldId` undecided.
- **Authorship closure.** E256-F215 leaves the schema-to-Rust binding seam outside a settled closure claim; E256-F214 leaves the residual prose/schema mechanism open.
- **Sparse vertices.** No full Expression-plus-Autonomy vertex has yet been observed, so that interaction remains less tested.

## Test of the three lenses

### Polar

Supported. Every lens has eligible, high/medium-confidence decisions at both poles. The temporal axis is nearly balanced; Family B reverses the epic-level Integrity preference inside a projection boundary; Autonomy appears in seven of eight counted families. Opposite poles describe accepted costs and protections, not virtue and failure.

### Orthogonal

Supported provisionally. Six distinct vertices and multiple partial coordinates show that a choice on one lens does not determine the others: Integrity appears with both temporal poles and both ownership poles; Coherence appears with both semantic and temporal poles; Autonomy appears with both Continuity and Evolution. The two unoccupied Expression-plus-Autonomy vertices are a reason to keep testing, not to collapse axes.

### Complete

Supported for this corpus, not proven universally. Every ratified, implemented, proposed, rejected, or superseded card maps to at least one lens. Centre occupancy is exactly the unresolved set, where missing choice and rationale prevent direction. No recurring fourth tension remained after atomic splitting. Operational cost, authority, safety, and usability functioned as evidence within the three tensions rather than as independent axes.

### Generative

Supported. The lenses consistently produce a counterfactual, a counter-pole safeguard, and an over-rotation signal. They also expose the next questions rather than supplying automatic answers: what meaning is protected, what transition evidence makes a break safe, and where variation can be owned without forking the shared contract. E256-H01–H03 demonstrate that the same lenses can frame undecided work without manufacturing an owner choice.

## Owner disposition

On 2026-08-02 the owner ratified semantic sovereignty through portable data as the governing core and accepted the three lenses. For the SRS standard layer, Semantic Integrity and Shared Coherence become constitutional defaults. The historical Evolution tendency is accepted only as an evidence-led formation stance: changes must be grounded in practical implementation, corpus, migration, authoring, or user experience.

At the first full public release, the temporal default reverses firmly to Continuity. This is a precommitted phase transition, not an inference from historical frequency. Rust, web, and other implementation layers may later select different profiles without weakening standard meaning, portability, or shared conformance boundaries. The complete ratified stance is recorded in [`values-statement.md`](values-statement.md).

This disposition also resolves H03: package or semantic validation emits a diagnostic when `titleFieldId` is ineligible; rendering omits the invalid heading; neither layer substitutes `identityFieldId`. H01/H02 and the remaining F1/F2 closure questions remain open applications of the ratified values rather than blockers to their ratification.
