# Governance

> The specification's own governing rules: its foundational values, its process for continuity and evolution, and the balance between shared coherence and local autonomy.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Conformance](/agents/conformance.md).

The specification's own governing rules: its foundational values, its process for continuity and evolution, and the balance between shared coherence and local autonomy.

### Semantic sovereignty

The condition SRS exists to preserve: meaning stays under the control of the people who made it, and can move between tools, implementations, representations, repositories and time without captivity or silent loss. Portability alone does not achieve it — data that travels but arrives without stable identity, its relations, its provenance, or interpretable semantics has lost the meaning it was carrying. A design that improves convenience while making semantic data captive violates the purpose of SRS.

**Notes**: Stated in the specification's Foundational values subsection. It is the criterion every other design decision answers to, which is why it introduces nothing and depends on nothing.


### Foundational tension

A named opposition between two complementary necessities, resolved not by choosing a winner but by declaring which pole is the default and stating the boundary at which the other governs. Six such tensions govern decisions in the SRS standard layer: Semantic Integrity vs Practical Expression, Continuity vs Evolution, Shared Coherence vs Local Autonomy, Office vs Testimony, Reliability vs Renewal, and Portability vs Possession. A tension is phase-bound where the specification says so — the temporal default is Evolution before the first full public release and reverses to Continuity at it.

**Notes**: The tensions are the specification's own reading key: a rule that looks arbitrary usually reads as one pole of a declared tension holding at its boundary.

#### Foundational values and development phase

Six foundational tensions govern decisions in the SRS standard layer. Their poles are complementary necessities, not good and bad alternatives. Each statement names the default pole and the boundary at which the other pole governs.


#### Semantic Integrity and Practical Expression

The standard defaults to **Semantic Integrity**: preserve exact meaning, identity, authority, relations, and provenance. It moves toward Practical Expression when established meaning remains recoverable and a bounded presentation, authoring, diagnostic, or review need would otherwise make correct information unusable. A projection must retain a clear line to canonical meaning and must never silently become a substitute semantic source.


#### Continuity and Evolution

The temporal preference is explicitly phase-bound. **Before the first full public release**, the standard is in formation and defaults to **evidence-led Evolution**. The project must make the changes needed to correct contradictions, close semantic gaps, and establish a coherent foundation before users depend on it. Those changes must be grounded in practical implementation, corpus, migration, authoring, or user experience; speculative elegance alone is insufficient. Stable identity, deterministic migration, parity evidence, diagnostics, atomic cutover, and recovery remain required safeguards.

**At the first full public release, the temporal default reverses to Continuity.** This transition is precommitted. From that point, the standard protects compatibility, identity, and established expectations by default. A breaking change requires an explicit version boundary, migration and compatibility analysis, recovery evidence, and ratification. Continuity must not preserve a demonstrated semantic contradiction indefinitely, but the burden of proof moves to the proposed change.


#### Shared Coherence and Local Autonomy

The standard defaults to **Shared Coherence** for interchange, semantic interpretation, identity, validation, authority, and conformance. It moves toward Local Autonomy when a concern is genuinely presentation-owned, extension-owned, repository-local, or implementation-private. Local variation must remain behind an explicit boundary and must not produce incompatible interpretations of shared data.


#### Office and Testimony

The standard defaults to **Office**: the procedural record, declared authority, and validated artifact govern over personal or automated testimony. Testimony may fill a gap, but it must not contradict authority; it becomes office only through an explicit verification mechanism that produces an authoritative artifact. Until then, who or what asserted a claim may inform trust and diagnosis, but never changes the claim's validity or precedence. This tension is ruled in `rfc-decision-cce3c00e` and `rfc-decision-16b20c56`.


#### Reliability and Renewal

The standard defaults to **Reliability**: standing contracts continue to hold. Renewal is legitimate only as explicit supersession at a declared boundary, expressed through the retirement mechanism of the layer concerned; it must not arrive as an overwrite, an expired exception, or silent drift. This tension is ruled in `rfc-decision-cce3c00e` and `rfc-decision-5f8204bc`.


#### Portability and Possession

The standard defaults to **Portability**: the travelling form is the test of a capability. Anything the standard allows a repository to hold must be expressible in the corresponding package, archive, or slice form. A capability may remain in place only behind the Shared Coherence and Local Autonomy tension's explicit local boundary; otherwise, a capability that exists only in place is captivity. This tension is ruled in `rfc-decision-cce3c00e` and `rfc-decision-8948e43f`.


#### Conflict resolution: identity and information

The Earth and Air columns deliberately fail differently. An **identity conflict is fatal**: identity is declared, never inferred or selected by precedence. An **informational conflict resolves by declared authority**: the authoritative statement wins and the losing hint is surfaced visibly. Treating an identity clash as a resolvable hint corrupts meaning; hard-failing an informational mismatch when an authority is declared mistakes diagnosis for identity. This distinction is ruled in `rfc-decision-cce3c00e`, RFC-038 [R12], and Invariant 28.


#### Schemas closed, engines tolerant

Instance-facing emitted JSON Schemas state the production contract and are closed except for the sanctioned `meta` carrier; definition-facing schemas are fully closed because definitions are the trust boundary. Engines nevertheless detect and load unknown instance-layer content so that encountering unfamiliar meaning does not destroy it. On write, an engine preserves unknown content or refuses loudly when preservation is impossible; it must never discard that content silently. Schema invalidity and loadability therefore answer different questions: the diagnostic names content outside the production contract, while tolerant carriage protects it from loss. This is the three-verb DETECT / LOAD / WRITE contract ruled in `rfc-decision-2e0cd70a`.


#### Evidence, exceptions, and amendment

The charter is answerable to observed outcomes. Repeated, attested conflict between a charter expectation and practice creates a finding against the charter, not an accusation that the decisions failed to obey it. Likewise, two waivers or distinguishings of the same clause for the same reason aggregate into a finding against that clause; exceptions are evidence about the rule and must not make the doctrine self-sealing. This empirical override was adopted in the axis-integration review on srs#435.

During the single-owner phase, amendment jurisdiction rests with the owner; amendments are recorded through an explicit ruling or successor, never a silent edit.

These values govern the SRS standard layer. Rust, web, and other implementation layers may adopt different preference profiles for their own concerns, but those profiles cannot weaken the standard's semantic integrity, portability, or shared conformance boundaries.


<!-- srs-generated:key-invariants-index:start -->
