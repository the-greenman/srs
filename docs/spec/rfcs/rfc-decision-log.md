# Semantic Record System Specification

## RFC decision log

**Title**: Adopt SRS foundational values and a phase-specific temporal stance

**Decision Status**: accepted

**Decision Date**: 2026-08-02

**Decision Rationale**: Epic 256's audited decision history shows strong preferences for Semantic Integrity and Shared Coherence. Its weaker Evolution tendency reflects the standard's formation phase. The owner ratified data sovereignty through portability as the governing core, accepted evidence-led Evolution for formation, and precommitted the public standard to reverse to Continuity at its first full public release.

**Decision**: The SRS standard adopts Semantic Integrity and Shared Coherence as defaults. During formation it adopts evidence-led Evolution so demonstrated structural defects can be corrected before users depend on them. At the first full public release, the temporal default reverses to Continuity. Rust, web, and other implementation layers may adopt their own profiles without weakening the standard's semantic or conformance boundaries.

**Scope**: SRS standard layer

**Governing Values**:
- data-sovereignty
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Continue making technical decisions without a constitutional frame.
- Preserve the current model immediately, including pre-release contradictions and gaps.
- Make Evolution the permanent default after public release.
- Apply one undifferentiated preference profile to the standard and every implementation layer.

**Accepted Costs**: Formation may require breaking migrations, concentrated change, and rejection of familiar structures. The project accepts those costs only where practical implementation, corpus, migration, authoring, or user evidence demonstrates that change is necessary for semantic integrity or shared coherence. The hard release transition deliberately forecloses continued pre-release freedom to break the public standard casually.

**Evidence**:
- https://github.com/the-greenman/srs/issues/256
- docs/research/epic-256-decision-map/decision-ledger.json
- docs/research/epic-256-decision-map/cube-analysis.md
- docs/research/epic-256-decision-map/values-statement.md
- https://github.com/the-greenman/muDemocracy.org/issues/136

**Review Trigger**: The first full public release triggers the precommitted temporal reversal: `public-standard` replaces `formation`, and Continuity becomes the default. After that trigger, a breaking standard change requires an explicit version boundary, migration and compatibility analysis, recovery evidence, and owner ratification.


**Title**: Define the SRS decision-log inclusion boundary

**Decision Status**: accepted

**Decision Date**: 2026-08-02

**Decision Rationale**: The decision log must preserve the reasoning that future contributors need without becoming an archaeological archive or a task list. The muDemocracy guide correctly tests durability, policy effect, trade-offs, and future review value, but its strategy/tactical/operational distinction is too coarse for technical governance. A tactical choice can be mechanically determined; an operational-looking choice can establish a reusable exception or conformance boundary.

**Decision**: Maintain the SRS RFC decision log as a curated record of active consequential judgment. Record a decision when legitimate alternatives remained and the choice establishes, changes, applies with discretion, excepts, or supersedes guidance that future work may need to understand. Do not record a mechanical derivation: when competent contributors accepting the same governing decisions and evidence have only one valid outcome, record the task, implementation consequence, test, or pull request instead.

**Scope**: SRS RFC decision log and consequential SRS technical decisions

**Governing Values**:
- semantic-integrity
- shared-coherence

**Alternatives Considered**: - Backfill every atomic research card, including mechanical derivations.
- Treat tactical or operational work as sufficient reason to record a decision.
- Record only RFC lifecycle outcomes, without reusable rationale or exceptions.
- Leave the decision-log boundary implicit.

**Accepted Costs**: The project accepts a small amount of classification and review work before recording a decision. The log will not be a complete chronology of tasks, PRs, or research cards; a contributor must follow evidence links when exhaustive history is needed.

**Evidence**:
- https://github.com/the-greenman/srs/issues/256
- https://github.com/the-greenman/srs/pull/341
- docs/research/epic-256-decision-map/methodology.md
- docs/research/epic-256-decision-map/values-statement.md
- https://github.com/the-greenman/muDemocracy.org/blob/master/muSrs/records/tier-2/section-table-a638cca2.json
- https://github.com/the-greenman/muDemocracy.org/blob/master/muSrs/records/tier-2/section-table-b5a4b93a.json

**Review Trigger**: Review this boundary when formal governance for SRS is adopted, or when the log shows either failure signal: it has become a task list, or recurring consequential choices lack a recorded rationale and cannot be classified consistently.
