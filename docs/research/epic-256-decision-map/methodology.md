# Epic 256 decision-history research methodology

Status: research method. This document is non-normative.

## Purpose and boundary

This research asks what values the SRS project has protected when consequential choices in epic 256 placed valid concerns in tension. It maps those choices across three candidate foundational axes:

1. **Semantic Integrity ↔ Practical Expression**
2. **Continuity ↔ Evolution**
3. **Shared Coherence ↔ Local Autonomy**

Historical frequency is evidence, not authority. The analysis reports revealed preferences first. A future values statement becomes project guidance only through an explicit owner choice.

The research changes no normative record, schema, RFC status, governance-package definition, conformance rule, or CI policy.

## Evidence corpus and authority

The source manifest reconciles the union of:

- the epic body, whose sequential spine is authoritative for order;
- the comment marked `<!-- epic-256:ledger -->`;
- native sub-issues and every cross-repository item named by the spine or ledger;
- linked RFCs, owner-decision comments and read-backs, merged PRs, review threads, tests, and post-merge findings.

Sources are interpreted in this order:

1. Current canonical records and schemas establish effective normative meaning.
2. Accepted RFCs, revision histories, explicit owner decisions, and owner merges establish ratified intent.
3. Merged PR diffs, reviews, tests, and implementation behavior establish delivered consequences.
4. Issue research and comments establish historical alternatives and context.
5. Design notes, rendered projections, summaries, and commit messages are supporting evidence only.

A PR is delivered only when its individual PR record has a non-null `mergedAt`. Closed issue state and coordinator prose are insufficient. Generated proposals and coordinator interpretations are not owner intent without a later owner answer, accepted artifact, or owner merge that makes the choice effective.

When evidence conflicts, preserve the contemporaneous decision and its later supersession as distinct cards. Never silently rewrite history to match the current contract.

## Unit of analysis

The unit is an **atomic decision**: one independently reversible commitment with a discernible alternative. Issues, RFCs, and PRs are source containers, not voting units.

Split a source when separate clauses could reasonably be reversed independently or protect different poles. For example, "diagnose invalid semantic configuration and omit the failed presentation" contains two operational decisions even when one synthesis explains both.

Decision classes are:

- `precedent-setting`: introduces or changes a governing rule;
- `reasoned-application`: applies precedent while still exercising judgment;
- `mechanical-derivation`: follows necessarily from a prior decision;
- `proposal`: proposed but not ratified;
- `rejected-alternative`: an option explicitly declined;
- `unresolved`: a live question with no effective answer.

Statuses are `proposed`, `ratified`, `implemented`, `superseded`, `rejected`, and `unresolved`.

Only ratified or implemented `precedent-setting` and `reasoned-application` cards can contribute to primary-bias statistics. Mechanical consequences stay visible without giving a large migration extra constitutional votes.

## Axis coding

For every axis ask:

> When these values came into tension, which cost did the project accept, and which value did it protect?

Do not infer direction from vocabulary alone. A schema is not automatically Integrity, a migration is not automatically Evolution, and a core rule is not automatically Coherence.

### Semantic Integrity ↔ Practical Expression

- `integrity`: protects semantic identity, authority, relations, provenance, non-substitution, or independence from representation.
- `expression`: prioritizes legibility, usability, projection, interface, workflow, or graceful presentation.

### Continuity ↔ Evolution

- `continuity`: protects identity, compatibility, history, lineage, established behavior, or recoverability.
- `evolution`: permits correction, migration, simplification, replacement, extension, or intentional breakage.

### Shared Coherence ↔ Local Autonomy

- `coherence`: establishes a common contract, shared semantics, conformance rule, singular authority, or atomic ecosystem behavior.
- `autonomy`: preserves bounded ownership, extensions, local-first operation, implementation choice, or repository independence.

Each axis records:

- `relevance`: `decisive`, `supporting`, or `unexpressed`;
- `direction`: either named pole, `balanced`, `conditional`, `unknown`, or `not-applicable`;
- `evidence_basis`: `explicit`, `revealed-by-alternative`, `behavioral`, or `speculative`;
- `confidence`: `high`, `medium`, or `low`;
- exact evidence and the accepted counterfactual cost;
- any protection retained from the counter-pole;
- any signal of over-rotation.

Confidence rules:

- `high`: an accepted rule or owner decision explicitly contrasts the values, or the chosen and rejected alternatives make the priority unavoidable;
- `medium`: delivered behavior clearly favors a pole while rationale remains implicit;
- `low`: more than one reasonable interpretation remains.

`balanced` means the decision deliberately protects both poles without a directional priority. `conditional` means different directions apply under stated conditions and cannot be split honestly. `unknown` is missing evidence, not a midpoint. Low-confidence and non-directional results never enter bias counts.

## Cube placement

A card receives a coordinate only for axes with high- or medium-confidence named-pole directions:

- three coded axes: cube vertex, written as `[Integrity, Evolution, Autonomy]`;
- two coded axes: cube edge;
- one coded axis: axis only;
- zero coded axes: unmapped centre.

Partial mappings are results. They may reveal missing rationale, non-relevant axes, poor decision splitting, or a weakness in the candidate foundation. During evidence coding, coordinates use explicit pole names rather than archetypal labels.

## Bias and exception analysis

Report raw eligible decisions and independent decision-family majorities.

A pole is a **primary bias** only when:

- at least five eligible decisions span at least three families;
- at least 70% of eligible decisions favor it;
- at least 60% of family-level majorities favor it;
- unresolved eligible candidates could not plausibly reverse it.

A **strong bias** requires at least 80% of decisions and 75% of family majorities. Otherwise report `tendency`, `mixed`, or `insufficient-evidence`. Publish counts rather than numeric confidence weights.

Only after establishing a bias may an opposite-pole decision be classified as:

- `principled-contextual`;
- `counterpole-protection`;
- `transitional`;
- `legacy`;
- `possible-contradiction`;
- `uncertain`.

An exception often supplies the threshold or counter-value protection for a future constitutional stance. A possible contradiction requires owner reconciliation rather than narrative smoothing.

## Calibration and audit

Two researchers independently code the same ten heterogeneous decisions. An adjudicator compares atomic splitting and directional results. Calibration passes only when every axis reaches at least 80% directional agreement and there is no systematic pole confusion.

Family batches are capped at 12–15 atomic cards. Audit covers a stratified 20% sample from every family plus every low-confidence, conditional, owner-decision, supersession, exception, and contradiction candidate. The canonical ledger contains only reconciled cards and records its review state.

## Values synthesis

The synthesis reports historical bias before drafting guidance. For each axis the candidate values statement contains:

1. default preference;
2. threshold for moving toward the counter-pole;
3. counter-value that must remain protected;
4. evidence of over-rotation;
5. corrective movement.

The synthesis agent may draft these clauses but cannot ratify them. Frequency shows what happened; rationale, consequences, and successful exceptions help the owner decide what should guide future work.
