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
