# SRS foundational values

**Status: Ratified by the owner on 2026-08-02 for the SRS standard layer.**

The canonical normative statement is the SRS subsection record [`Foundational values and development phase`](../../../srs/records/subsections/01-5-foundational-values-and-development-phase.json). The ratification, alternatives, accepted costs, evidence, and release trigger are preserved in the structured [`RFC decision record`](../../../srs/records/rfc-decisions/foundational-values-and-phase.json).

## Governing core

SRS exists to preserve **semantic sovereignty through portable data**. Meaning must remain under its owners' control and able to move between tools, implementations, representations, repositories, and time without captivity or silent semantic loss.

Portability without identity, relations, provenance, and interpretable semantics is not sovereignty. A design may improve usability, compatibility, consistency, or implementation convenience, but if it makes semantic data captive to a tool, format, repository, service, vendor, or hidden interpretation, it violates the core.

## What the history shows

- **Semantic Integrity:** strong historical bias — 87 of 98 counted decisions; 7 of 8 family majorities.
- **Continuity ↔ Evolution:** an Evolution tendency, not a permanent bias — 51 of 84 decisions; 6 of 8 family majorities.
- **Shared Coherence:** strong historical bias — 80 of 97 decisions; all 8 family majorities.

Frequency was evidence, not authority. The owner used the rationale, accepted costs, and exceptions in the audited history to make the future choices below.

## Ratified constitutional stances

### Semantic Integrity ↔ Practical Expression

1. **Default — Semantic Integrity.** Preserve exact meaning, identity, authority, relations, and provenance. A projection or workflow must not silently become a substitute semantic source.
2. **Move toward Practical Expression when** established meaning remains recoverable and a bounded presentation, authoring, diagnostic, or review need would otherwise make correct information unusable or inaccessible.
3. **Still protect** stable identity, truthful diagnostics, structural recoverability, and a clear line back to canonical meaning.
4. **Over-rotation signal:** the model is harder to author, review, publish, or use than the ambiguity it removes—or a convenient projection begins changing or concealing meaning.
5. **Corrective move:** add a declared projection, fallback, explanation, or authoring aid; if that cannot preserve meaning, return the decision to the semantic model rather than hiding the loss.

### Continuity ↔ Evolution

The temporal stance is deliberately phase-specific.

**During formation, before the first full public release, the default is evidence-led Evolution.** The project must make the changes necessary to correct contradictions, close semantic gaps, and establish a coherent foundation before users depend on it. Practical implementation, corpus, migration, authoring, or user experience must supply the confidence for change; speculative elegance alone is insufficient.

Formation changes must still preserve stable identity where possible, record supersession, use deterministic migrations, prove semantic parity, cut over atomically, surface diagnostics, and retain recovery. These safeguards ground Evolution in lessons learned rather than abstract preference.

**At the first full public release, the temporal default reverses to Continuity.** This transition is precommitted and firm. From that point, the standard protects compatibility, identity, history, and established expectations by default. A breaking change requires an explicit version boundary, migration and compatibility analysis, recovery evidence, and ratification. Continuity must not preserve a demonstrated semantic contradiction indefinitely, but the burden of proof moves to the proposed change.

### Shared Coherence ↔ Local Autonomy

1. **Default — Shared Coherence.** Interchange, semantic interpretation, identity, validation, authority, and conformance claims use one explicit common contract.
2. **Move toward Local Autonomy when** the concern is genuinely presentation-owned, extension-owned, repository-local, implementation-private, or outside an explicitly claimed conformance boundary.
3. **Still protect** a shared boundary: common identity and resolution rules, declared ownership, truthful diagnostics, and no silent claim that local success proves ecosystem coherence.
4. **Over-rotation signal:** the core contract absorbs domain meaning, presentation choices, or private implementation detail—or local choices produce incompatible interpretations of shared data.
5. **Corrective move:** move variability behind an explicit view, extension, package, repository, or implementation boundary and standardize only the interface, fallback, and conformance claim that cross it.

## Layer scope

These stances govern the **SRS standard layer**. Rust, web, and other implementation layers may adopt different preference profiles for their own decisions. They cannot weaken the standard's Semantic Integrity, data portability, or shared conformance boundaries.

## Contributor test

For a consequential decision, state:

- which poles are actually in tension;
- which cost the proposal accepts and which value it protects;
- what practical evidence supports change;
- how the counter-value remains protected;
- what observable signal would trigger correction;
- which project phase and implementation layer the decision governs.

If those answers cannot be evidenced, keep the axis `unknown` and seek the decision rather than manufacturing a principle.

The supporting distributions, unresolved reversal tests, exception taxonomy, and representative cases remain in [`cube-analysis.md`](cube-analysis.md) and [`casebook.md`](casebook.md).
