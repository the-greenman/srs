# SRS decision governance v1: foundational tensions

Status: foundational axes and SRS standard-layer stances ratified by the owner on 2026-08-02. Formal governance remains deferred to muDemocracy.org#136.

## Why this comes first

SRS is being assembled through many technically sound decisions that do not yet share an explicit constitutional frame. That makes each unresolved question look local even when it is another instance of a choice the project has already made elsewhere.

The first version of decision governance should therefore do one small thing: establish the shared map against which technical decisions are reasoned. It should not yet build the full governance system proposed by muDemocracy.org#136.

The sequence is:

1. Name the core that the project exists to preserve.
2. Name the durable tensions around that core.
3. Validate that the tensions are genuinely complementary, collectively complete, and coherently derived.
4. Choose a default stance on each axis without denying the opposite pole.
5. Derive operational principles and enforceable rules from those stances.

Issue srs#256 is the first worked case, not the source of the framework.

## Relationship to muDemocracy.org#136

Epic 136 correctly identifies the constitutional deficit: SRS has many principle-shaped statements and decision mechanisms, but no coherent foundation connecting them. Its proposed release scope is larger than the first useful intervention.

Version 1 takes only:

- the SRS purpose as a constitutional core;
- the discovery and ratification of foundational axes;
- a recorded stance on each axis;
- one lightweight constitutional-context block for non-mechanical decisions;
- srs#256 as the first worked example.

Version 1 explicitly defers:

- migrating to or extending the shared governance package;
- introducing a `principle` type or enforcement fields;
- record transmutation/retype capability;
- a complete constitution of articles and roles;
- backfilling every historical decision into structured records;
- reconciling all eleven existing decision mechanisms and six status vocabularies;
- splitting and relocating the founding charter;
- public governance projections;
- CI gates, automatic traceability checks, and enforcement matrices.

Those may be valid later deliveries. None is required to stop new technical decisions from being reasoned in isolation now.

## The governing core

> **SRS preserves semantic sovereignty through portable data.**

Meaning must remain under its owners' control and able to move between people, tools, implementations, representations, repositories, and time without captivity or silent semantic loss. Portability without identity, relations, provenance, and interpretable semantics is not sovereignty. A design may change format, implementation, ownership boundary, or maturity while still serving the core. A design that makes semantic data captive has left the SRS purpose, even if it is locally convenient.

The core is not another pole to maximize. It is the subject whose viability depends on holding the tensions below.

## Foundational axes

Foundational Synthesis begins with a bounded system and a small set of orthogonal tensions. The tensions are not a list of desirable qualities. They are independent lenses whose combinations define the space within which the system must remain coherent.

For SRS, three axes emerge from the project's own purpose and existing corpus. The decision-history research in [`epic-256-decision-map/`](epic-256-decision-map/) tested them against 171 atomic decisions before ratification.

### 1. Semantic Integrity ↔ Practical Expression

**Question:** Is this decision primarily protecting meaning as meaning, or making meaning usable in a particular form and context?

**Foundational paradox:** Meaning must remain independent of any representation, but meaning that cannot be expressed intelligibly cannot be shared, reviewed, implemented, or used.

| Semantic Integrity | Practical Expression |
|---|---|
| Preserves identity, semantics, relations, provenance, and reuse across contexts | Produces legible documents, APIs, schemas, interfaces, workflows, and generated artifacts |
| Resists accidental semantics introduced by a storage or presentation choice | Adapts the same meaning to the needs of a particular audience or implementation |
| Shadow: a pure but inaccessible abstraction | Shadow: a convenient form that silently becomes authoritative |

This axis contains the project's recurring distinctions between semantic state and documents, records and projections, semantic order and presentational order, and type-owned meaning and view-owned presentation.

### 2. Continuity ↔ Evolution

**Question:** Is this decision primarily preserving trustworthy continuity, or changing the system so it can remain correct and useful?

**Foundational paradox:** Meaning is trustworthy only when identity, commitments, and history survive change, but it remains useful only when errors can be corrected and the model can evolve.

| Continuity | Evolution |
|---|---|
| Preserves stable identity, compatibility, lineage, history, and institutional memory | Enables correction, migration, simplification, extension, and adaptation |
| Makes prior decisions and semantic state traceable | Prevents accidental choices and obsolete structures becoming permanent |
| Shadow: fossilized debt and compatibility with mistakes | Shadow: churn, broken consumers, and erased rationale |

This axis contains versioning, successor and lineage rules, migration policy, compatibility decisions, accepted-RFC amendment boundaries, and the treatment of historical state.

### 3. Shared Coherence ↔ Local Autonomy

**Question:** Is this decision primarily establishing a common contract, or preserving the authority of a bounded domain, repository, extension, or implementation?

**Foundational paradox:** Interoperability requires shared constraints and one coherent semantic contract, but meaning remains legitimate and adaptable only when its local owners retain authority.

| Shared Coherence | Local Autonomy |
|---|---|
| Supplies common semantics, consistent behavior, conformance, and ecosystem integrity | Supplies domain ownership, modular adoption, local-first operation, and implementation freedom |
| Prevents technical decisions from fragmenting the whole | Prevents the core from becoming a universal ontology or central platform |
| Shadow: centralization, an oversized core, and synchronized bottlenecks | Shadow: incompatible dialects, duplicated semantics, and isolated decisions |

This axis contains core versus extension, standard versus implementation, shared package versus project-owned policy, namespace ownership, federation, and atomic ecosystem changes.

## The space generated by the axes

The three binary lenses generate eight orientations. These are not decision categories or mandatory labels; they are a completeness test. A sound foundation should make every combination intelligible.

| Integrity / Expression | Continuity / Evolution | Coherence / Autonomy | Example orientation |
|---|---|---|---|
| Integrity | Continuity | Coherence | Preserve a core invariant and its stable identity across every implementation |
| Integrity | Continuity | Autonomy | Preserve locally owned meaning and history without requiring central resolution |
| Integrity | Evolution | Coherence | Correct or migrate the common semantic model without losing meaning |
| Integrity | Evolution | Autonomy | Allow a domain to evolve its semantics through explicit local lineage |
| Expression | Continuity | Coherence | Maintain stable normative projections and executable contracts |
| Expression | Continuity | Autonomy | Preserve a local interface or projection without making it universal |
| Expression | Evolution | Coherence | Regenerate or replace shared representations from one authoritative model |
| Expression | Evolution | Autonomy | Experiment with new local views, workflows, or bindings without changing shared semantics |

If a consequential technical decision cannot be located in this space, the axes are incomplete. If two axes repeatedly force the same answer, they are not sufficiently orthogonal.

## Relationship to the existing SRS tension list

The existing domain note supplies the empirical starting point. Its tensions can be read as direct axes or as interactions within the generated space:

| Existing tension | Foundation reading |
|---|---|
| Meaning ↔ form | Semantic Integrity ↔ Practical Expression directly |
| Historical preservation ↔ current clarity | Continuity ↔ Evolution directly |
| Local autonomy ↔ shared interoperability | Shared Coherence ↔ Local Autonomy directly |
| Flexibility ↔ fidelity | Evolution or Autonomy held against Integrity or Coherence |
| Domain neutrality ↔ practical usefulness | Local Autonomy combined with Practical Expression, held against Shared Coherence |
| Simplicity ↔ expressiveness | Shared Coherence combined with Continuity, held against Evolution or Autonomy |
| Document compatibility ↔ meaning-first evolution | Practical Expression combined with Continuity, held against Semantic Integrity combined with Evolution |
| AI assistance ↔ human authority | A governance boundary governing movement through the space, not necessarily a fourth structural axis |

The last distinction is important. Not every recurring tension must become a generative lens. Human authority, proposal rights, enforcement responsibility, and AI assistance describe how decisions are governed. They can operate at every point in the technical design space.

## Validation standard

The candidate foundation must pass four tests:

1. **Polarity:** each axis contains complementary necessities, not good and bad alternatives.
2. **Orthogonality:** knowing a decision's position on one axis does not determine its position on another; every combination remains meaningful.
3. **Completeness:** consequential SRS decisions can be located without semantic stretching, and no recurring class remains outside the space.
4. **Generativity:** existing principles and concrete rules can be explained as contextual stances within the space rather than appended as unrelated preferences.

## What a preference means

Choosing a preference must not collapse an axis into good versus bad. A useful constitutional stance has five parts:

1. **Default:** which pole has priority when evidence is otherwise equal?
2. **Threshold:** what evidence justifies moving toward the other pole?
3. **Protection:** what value from the non-preferred pole must be retained?
4. **Failure signal:** how will the project know it has over-rotated?
5. **Recovery:** what movement restores the productive tension?

Use this form for each axis:

> When **[conditions]**, SRS defaults toward **[pole]** because **[reason tied to the core]**. It must still preserve **[value from the other pole]**. Evidence of over-rotation is **[signal]**; the corrective move is **[response]**.

The owner has selected the SRS standard-layer profile: **Semantic Integrity, evidence-led Evolution during formation, and Shared Coherence**. The temporal choice is deliberately not permanent: at the first full public release, the default reverses firmly from Evolution to **Continuity**. Formation changes require confidence grounded in practical implementation, corpus, migration, authoring, or user experience; speculative elegance is not enough. Rust, web, and other implementation layers may later select different profiles without weakening the standard's meaning, portability, or common conformance boundary.

## Immediate decision protocol

Until formal governance is implemented through muDemocracy.org#136, consequential non-mechanical SRS decisions should be captured in the existing structured RFC decision log and include a short tension statement:

```markdown
### Constitutional context

- Core meaning at stake:
- Axes touched:
- Current position and evidence:
- Proposed movement:
- Value gained:
- Opposite-pole value placed at risk:
- Safeguard for that value:
- Enforcement point:
- Revisit signal:
```

This is intentionally small. It does not require a principle registry, scoring system, approval matrix, or new automation. It makes isolated reasoning visible and comparable immediately.

Mechanical changes need only cite the already-ratified principle or rule that determines them. If no such citation exists, the change is not mechanical.

## Worked case: the srs#256 disposition question

The proposal on srs#256 says:

> A presentation concern degrades silently. A semantic claim fails loudly. Neither substitutes.

The corpus evidence for that rule is strong, but it is an operational principle, not a foundational axis. It describes different stances on Semantic Integrity ↔ Practical Expression:

- where a semantic claim is at stake, prefer Integrity through explicit failure or diagnostics;
- where a presentation concern is at stake, prefer usable Expression through graceful omission;
- forbid substitution because it makes the expression appear usable by silently changing the meaning.

It also touches Shared Coherence ↔ Local Autonomy. If this is a shared SRS principle, the semantic/presentational distinction needs a common declaration or rule-author obligation. If every implementation classifies it independently, the apparent principle still permits ecosystem divergence.

The governance question is therefore not only whether to ratify the proposed disposition. It is:

1. Do we ratify Semantic Integrity ↔ Practical Expression as a foundational axis?
2. What contextual stance does SRS take on that axis for semantic and presentational failure?
3. Is graceful omission plus semantic diagnostics a correct derived principle for failure behavior?
4. Where is the semantic/presentational classification declared and enforced?
5. What happens to constructs, such as `titleFieldId`, that deliberately cross the boundary?

Answering in this order lets the decision resolve a class of future cases without pretending that one failure rule constitutes the project's whole philosophy.

## Ratification and next boundary

The foundational decision is complete:

- the governing core and three axes are ratified;
- polarity, orthogonality, completeness, and generativity have been tested against Epic 256's decision history;
- the SRS standard-layer stance and its release-triggered temporal reversal are recorded;
- the structured RFC decision log keeps rationale, evidence, accepted costs, and review triggers active in the current process;
- srs#256 supplies the first worked application.

Formal governance still belongs to the larger governance epic: principle records, machine-readable traceability, automated review checks, authority matrices, escalation mechanics, and richer tooling. The lightweight decision log is an auditable companion to accepted RFCs and owner decisions; it is not a second normative source.

## Source basis

This draft synthesizes, but does not make normative:

- `srs/records/notes/fundamental-tensions.json`
- `srs/records/notes/purpose-principles-constraints.json`
- `srs/records/notes/srs-domain-definition.json`
- `srs/records/notes/tooling-design-principles-authority-and-determinism.json`
- `srs/records/design-notes/001-core-thesis.json`
- `srs/records/design-notes/044-relation-design-principles.json`
- the proposed disposition principle on srs#256
- the Foundational Synthesis, Binary Logic, Orthogonality, and Paradox Holding material in `greenmans_creation/obsidian-vault`
