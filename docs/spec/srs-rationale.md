# Semantic Record System Specification

## Design Rationale

### Core Thesis

**Content**: 
Traditional document systems treat documents as primarily text.

This specification treats documents as **socially negotiated semantic state**. Text is one projection of that state.

Six principles follow from this:

**1. Semantic state is primary; documents are projections.**
The same semantic state may be rendered as a board paper, a governance record, a dashboard, or an AI context package. None of these projections is the source of truth.

**2. Fields are reusable semantic atoms.**
A Field defines a reusable slot of meaning with stable identity. It is not a form field. It is not tied to any specific Type or View. Its AI guidance, validation rules, and value type belong to the Field, not to the Type that uses it.

**3. Types are compositions, not owners of Field semantics.**
A Type selects and orders Fields for a specific semantic object type. It may provide session-level AI framing. It must not override or redefine the meaning of any Field it includes.

**4. Lineage and provenance are first-class.**
Definitions evolve. Forks happen. Upstream changes must be traceable. A definition without lineage is a definition that cannot be trusted to evolve cleanly.

**5. Records represent negotiated semantic state, not objective truth claims.**
A Record captures what a group understood, agreed, or committed to at a point in time. That understanding may be partial, contested, or later revised. The system preserves revision history and provenance precisely because the original state is worth keeping alongside its successors. Human prose and ambiguity are preserved, not collapsed.

**6. Understanding is mutable; historical semantic state has permanent value.**
SCDS assumes that understanding evolves. Records, Relations, and lifecycle states may be revised, superseded, refined, or contradicted without invalidating prior semantic state. A rough plan is a valid semantic object. A superseded decision is a valid semantic object. An abandoned hypothesis is a valid semantic object. Historical semantic state is not noise to be discarded — it is provenance, institutional memory, and the record of how understanding arrived at its current form.

---

### Design Decisions

**Content**: 

### Why Field and Type are separate

**Content**: 
A form system where each template defines its own fields produces semantic silos: the "decision statement" in the Technology template and the "decision statement" in the Budget template are unrelated strings. They cannot be searched together, compared, or composed.

In SCDS, a Field is defined once. Any number of Types may include it. When two Types share a Field, any AI extraction logic, validation rules, or downstream analysis written for that Field applies consistently across both. The Field's identity is stable across all the contexts it appears in.

This is a stronger constraint than it appears. It means a Type cannot secretly redefine what a Field means for its own purposes — it can only configure presentation. If a Type genuinely needs different semantics, it must use a different Field.

### Why "Type" not "Module"

**Content**: 
"Module" in v1 was accurate but implied a software analogy that didn't communicate the concept well to non-technical practitioners. "Module" suggests a composable software unit. "Type" says what it actually is: a type definition for a semantic object. A Decision is a Type. A Task is a Type. A Risk is a Type.

The rename also makes the Record/Type relationship legible by analogy: a Record is an instance of a Type, just as a value is an instance of a type in any typed system.

### Why Record tiers exist (Note → Typed Record → Record)

**Content**: 
Not all content arrives with full semantic formalisation. A meeting note, a brainstorm document, a rough plan — these are valid starting points that should be preserved and referenceable, even before anyone has decided what Types to extract from them.

The three tiers let a system capture content at whatever maturity level it has, and formalise later without losing provenance. The graduation path is one-way: Note → Typed Record → Record. It mirrors how understanding actually develops — rough first, then structured, then formally defined.

The tier model also makes SCDS progressively adoptable. A team can start at Tier 0 and arrive at Tier 2 as their understanding of the semantic structure matures, without ever having to restart from scratch.

### Why Protocol replaces TemplateFacilitationStep

**Content**: 
`TemplateFacilitationStep` in v1 was field-ordering with AI guidance attached. It could specify which fields to present in which order, with optional framing. This was sufficient for a linear form-filling workflow.

But the process of building a quality Record through group deliberation is not a form-filling workflow. It is an epistemically ordered process: you cannot meaningfully evaluate options before you have articulated criteria; you cannot propose a course of action before you have characterised the problem.

Protocol stages have:
- `dependsOn` — explicit epistemic dependencies, not just ordering. A stage may not proceed until its dependencies are sufficient.
- `completionCriteria` — how to know a stage is adequate to proceed.
- `outputType` — a stage may produce its own intermediate Record, not just fill fields in the final one.
- `question` — the core epistemic question this stage answers.

The distinction is between a View (which fields to show, in what order, for presentation purposes) and a Protocol (how to build understanding epistemically, stage by stage). These are separate concerns. Collapsing them into one construct produced a type that was adequate for neither.

A Record is the *compressed output* of a Protocol run. The Protocol is the process that produced the understanding; the Record is what that understanding looks like expressed in the standard vocabulary.

### Why Blueprint is a new concept

**Content**: 
In v1, there was no way to specify what a document type *is* — what needs to be extracted from source material in order to build it. `DocumentTemplate` (now Document View) handled *assembly* of existing Records into readable output. But nothing owned the prior question: "Given a transcript of a governance meeting, what Types should I extract, how should they relate to each other, and what does 'complete' mean?"

Blueprint fills that gap. A Blueprint is the artefact you hand to an extraction pipeline. It specifies root Types, expected Relations between extracted Records, and completeness criteria. The Extraction pipeline consults the Blueprint to know what to look for; the Document View consults existing Records to know what to render.

The two are complementary: Blueprint → Records → Document View.

### Why Address and AttentionState are needed

**Content**: 
v1 noted "focus links" as a session-layer concern without defining a mechanism. The mechanism was absent.

Without co-addressability, the transcript/SCDS separation is clean in principle but broken in practice. There is no way to say "this conversation happened while we were focused on this Field." Retrospective `SourceReference` links help, but they require someone to explicitly annotate which conversation produced which value. For real-time facilitation, that annotation needs to happen live.

`AttentionState` is the live cursor. Every transcript chunk produced while a Protocol stage is active carries the current `AttentionState` as a tag. Context assembly later queries by address: "all chunks where attention was on Field X in Record Y." The annotation is free because it was captured at production time.

`Address` is the addressing scheme that makes co-addressability possible. A transcript chunk and a Field Revision are in the same address space — they can reference each other because both have resolvable addresses.

**Multi-Container addressing**: A Record may belong to more than one Container simultaneously (a task may exist in both a project Container and a sprint Container). That Record therefore has multiple valid document-space Addresses — one per Container context. This is intentional: `containerId` in a document-space `Address` is not a uniqueness constraint, it is a *context specifier*. `AttentionState.containerId` records which Container was active during a live session, making the contextual anchor explicit. When a session-tagged transcript chunk is later queried, the Container in the `AttentionState` tells you not just *what Record* was being discussed but *in which context* it was being discussed.

### Why Revision is addressable

**Content**: 
In v1, field revision was an implementation concern. The spec described when to edit in-place versus create a new Record, but individual revisions were not addressable — you could not ask "what did this field say before the last Protocol run?" at the interoperability layer.

This matters for:
- **Governance challenge**: if a Record is challenged, you need to trace which conversation produced each field value and which version was in place when a downstream decision was made.
- **Context assembly**: when generating the next draft, knowing what changed between revision 2 and revision 3 — and what conversation produced that change — is more useful than knowing only the current value.
- **Audit**: a complete audit trail requires addressable history, not just current state.

`Revision` is the addressable audit trail. It does not replace the edit-in-place vs. new-Record judgment for minor corrections. That remains an implementation concern. Revision is the interoperability layer for cases where history itself is a first-class concern.

### Why `valueType` and `editorHint` are separate

**Content**: 
A Field with `valueType: "text"` might be edited via textarea in a web form, captured via voice in a mobile app, or extracted directly from a transcript with no editing UI. The semantic type is stable; the editing surface is a rendering decision.

AI extraction logic, validation rules, and export formatting depend only on `valueType`. `editorHint` is a default that implementations and Views may override. Conflating the two would mean that changing the preferred editor for a field could inadvertently break AI extraction rules.

### Why `displayLabel` must not affect extraction

**Content**: 
`displayLabel` lets a View relabel a Field for a specific audience without altering the Field's meaning. "Strategic question" might be displayed as "The decision we're making" in a facilitated view aimed at non-specialist participants.

If `displayLabel` could affect extraction, two Views of the same Record could produce different extracted values for the same Field — because the AI was given different labels. Field semantics must be stable across views. The label controls what the human sees; the Field's `aiGuidance` controls what the AI does.

### Why the directionality invariant matters

**Content**: 
`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. "D-004 supersedes D-001" must always be represented as `source: D-004, target: D-001`.

Without this invariant, graph traversal breaks across system boundaries. If System A stores `supersedes` with the newer Record as source and System B stores it with the older Record as source, a federated query for "all Records that supersede D-001" returns different results from each system. The invariant is the minimum agreement required for semantic interoperability on Relation graphs.

The invariant does not assign agency or authority to the `source` slot — those are properties of the `relationType`. A `contains` Relation makes the source the container and the target the contained item. An `evidences` Relation makes the source the evidence and the target the claim it supports. Directionality is a slot convention; semantics come from the type.

### Why Containers and Relations are complementary

**Content**: 
A Relation graph answers "what is semantically connected to what?" but not "what should be exported or queried together?" These are different questions. A project may contain hundreds of Records connected by many Relations. The question "which Records are in scope for this export?" is a scoping question, not a semantic one.

Container provides the boundary. "These Records collectively form a unit for boundary purposes" is a scope claim. "Stage A contains Task B" is a semantic claim. A Container can hold Records that have no `contains` Relation between them — they are grouped for operational reasons, not because one is semantically inside the other.

Relationship-first implementations derive Container membership by traversing `contains` Relations from root instances. Container-first implementations use explicit `memberInstanceIds`. Both strategies are valid; neither replaces the other.

### Why the conversation layer is a permanent boundary

**Content**: 
SCDS captures negotiated semantic state. Transcripts capture raw material — speech, threads, annotations — from which semantic state is extracted or constructed. These are different things, and conflating them would harm both.

If SCDS tried to be a transcript standard, it would need to model speaker identity, timing, overlapping speech, and audio quality — none of which are semantic concerns. If the transcript standard tried to be a semantic state standard, it would need to version field definitions, track lineage, and manage inter-Record Relations — none of which are evidence concerns.

The boundary makes both layers better at what they do. The connection between them — `SourceReference` and `AttentionState` — is the bidirectional bridge. Each layer references the other; neither absorbs the other.

---

### Usage Guidance

**Content**: 

### AI guidance composition order

**Content**: 
When assembling an AI prompt from multiple `aiGuidance` blocks:

1. **Type framing** — establishes what semantic object type is being worked on
2. **View framing** (if using `ext:views-l1`) — workflow-specific context for this View
3. **Field extraction guidance** — specific instruction for populating each Field
4. **Negative guidance** — constraints applied after the extraction instruction
5. **Examples** — few-shot demonstrations last, as final grounding

This ordering ensures broad context (what kind of object this is) precedes narrow directives (how to populate this specific Field). Template framing narrows the Type context — it does not replace it.

This is a recommended default. Implementations that compose differently will produce different AI behaviour from the same definitions.

### When to edit in-place vs create a new Record

**Content**: 

### Choosing between repeatable fields, field groups, and separate Records

**Content**: 

### Graduation: when and how

**Content**: 

### Relation taxonomy usage

**Content**: 
Use the canonical relation type strings installed in the core package (formerly `ext:recommended-relations`, retired by RFC-005) for common relationships. Reserve custom `namespace/name` format for domain-specific relations.

**Composition example** (project planning):
```
Stage A  --contains-->  Task B
Task B   --contains-->  Subtask C
```

**Derivation example** (Protocol output):
```
Decision Record  --derived-from-->  Options Analysis Note
Options Analysis --derived-from-->  Brain Dump Note
```

**Governance example**:
```
Policy v2  --supersedes-->  Policy v1
Amendment  --com.example.gov/amends-->  Policy v2   (custom namespace/name type)
```

**Evidence example**:
```
Workshop photo  --evidences-->  Stage 1 completion claim
Transcript seg  --evidences-->  Decision rationale
```

Non-governance projects use the same Relation layer. `supersedes` is canonical; domain verbs like `delegates`, `ratifies`, and `amends` are custom types that require their own installed `namespace/name` RelationTypeDefinitions (governance packages typically ship them). They apply when the semantic object type calls for them — one profile of the layer, not its primary purpose.

### Protocol chaining and provenance traces

**Content**: 
Loose Protocols produce open material. Tight Protocols converge on a specific Record. The output of one Protocol is the input context for the next.

Example chain for a governance decision:
```
Brain Dump Protocol → unstructured Notes
Decomposition Protocol → component Notes (derived-from Brain Dump Notes)
Options Analysis Protocol → Options Analysis Record (derived-from Decomposition Notes)
Decision Protocol → Decision Record (derived-from Options Analysis Record)
```

When a Decision Record is challenged, you can traverse back through the full chain: Decision ← Options Analysis ← Decomposition ← Brain Dump ← transcript chunks. The quality of the final Record is auditable because every stage of the process left addressable artefacts.

With `ext:addressability`, each stage's conversation chunks carry the `AttentionState` at the time they were produced. "What was being discussed when the options were evaluated?" is a queryable question.

### Graceful degradation

**Content**: 
In a federated ecosystem, implementations will often receive SCDS content that uses extensions they do not support. The useful default is: understand what you can, preserve what you cannot.

A conforming implementation should validate the core and extension content it recognises, surface unknown extension content clearly to users or downstream systems, and pass that unknown content through rather than silently discarding it. This is especially important for Records instantiated against a specializing Type: a system that knows only the base Type should still be able to read the inherited base fields correctly while preserving the specialization-specific fields.

---

### Extension Design Notes

**Content**: 

### How to decide which extensions to implement

**Content**: 

### Addressability as a prerequisite for live facilitation

**Content**: 
`ext:addressability` is not just about naming things. It is the mechanism that makes the conversation layer useful. Without `AttentionState`, transcript chunks have no address-time connection to the Records they inform. Without `Revision`, the history of a field's value is an implementation detail not visible at the interoperability layer.

Any implementation that facilitates live sessions — where conversation material is produced while people are working on specific Records and Fields — should implement `ext:addressability`. Without it, context assembly is purely retrospective, and the quality of AI assistance degrades accordingly.

**Diff rendering:** implementations rendering Revision history for governance review should support a diff view that shows field-level removals alongside additions, not only the current value. The Revision chain already provides the data needed for three useful modes: final (current value only), all markup (current value plus prior content shown as removed and new content as added), and original (the value at a specified Revision). This is a rendering pattern, not a separate data shape.

### Blueprint vs View — the extraction gap

**Content**: 
A View answers: given a Record that already exists, how do I render it for a specific audience?

A Blueprint answers: given source material, what Records should I extract, and how do they relate?

These are complementary but distinct. A Document View cannot serve as an extraction blueprint because it assumes Records already exist. A Blueprint cannot serve as a Document View because it does not specify how to render field values for an audience.

An extraction pipeline uses Blueprint + Field `aiGuidance` + Protocol to produce Records. A rendering pipeline uses View + Document View to project those Records into readable form.

### `semanticObjectType` as a federation risk

**Content**: 
`semanticObjectType` on `Type` and in `SectionSource.type-query` is a free-form string. The spec recommends `namespace/name` format for portable Document Views (Invariant 32) and treats bare strings as a single-system convention. This is the minimum rule needed to ship v2.

The risk: two systems can use the same bare string (`"decision"`, `"task"`) and mean different semantic Types. When graph traversal or document assembly crosses system boundaries, type-query portability becomes undefined wherever bare strings appear. This is where federation bugs will appear first.

The current design is deliberately light. Possible futures in order of increasing strictness:
- **Informative only** — `semanticObjectType` becomes advisory metadata with no query semantics; implementations must use explicit TypeRefs for cross-system queries
- **Typed vocabulary** — `semanticObjectType` becomes a typed reference to a Type definition (a `TypeRef` rather than a bare string), giving it the same identity guarantees as a Field or Type reference

The second option would require changing the type from `string` to `TypeRef | string` and a version bump. For now: prefer `namespace/name` format in any Type or SectionSource that will cross system boundaries, and treat bare strings as a scope boundary. Implementations should document which `semanticObjectType` values they recognise and what Types they map to.

### Protocol loose-to-tight spectrum

**Content**: 
The spectrum from loose to tight is not a quality ranking — it is a fitness question. A Brain Dump Protocol is the right tool when the problem space is not yet understood. A Decision Protocol is the right tool when the group is ready to converge. Starting with a tight Protocol before the problem is decomposed produces poor output because the epistemic prerequisites are not met.

The `dependsOn` field on `ProtocolStage` makes this explicit. A stage that depends on decomposition results cannot run before those results exist. This is not just sequencing — it is a statement about what understanding is required before the next stage is meaningful.

### Why Type inheritance is conservative

**Content**: 
`ext:type-inheritance` adds one formal mechanism: a Type may specialize one base Type and still be processable as that base Type. This solves the common case where a domain-specific Type needs to add fields to a shared Type without duplicating the whole definition.

The extension is intentionally narrow. It supports inherited fields, added fields, explicit ordering, and presentation/workflow overrides for inherited fields. It does not let a specializing Type change Field semantics or relax base requirements. That keeps the central promise intact: a system that understands the base Type can still process the base portion of a specialized Record.

`Type.fieldOrder` and `ExportConfig.fieldOrder` share a name but operate at different layers. `Type.fieldOrder` is a Type-level ordering declaration over the full effective field list, including inherited fields. `ExportConfig.fieldOrder` is a View export setting that controls rendered output order for a particular presentation. Validators should apply the `fieldAssignmentOverrides` inherited-field restriction only to `fieldAssignmentOverrides`, not to `Type.fieldOrder`.

---

### Future Extensions

**Content**: 
The following capabilities are planned but out of scope for this version.

### Session

**Content**: 
A live collaborative process model with real-time facilitation, AI assistance, and collaborative editing. A Session produces or enriches Records but does not own them. Session-level Protocol management (tracking active stage, managing participant attention) is a natural successor to `ext:protocol` and `ext:addressability`. Deferred pending implementation experience.

### Full projection surface

**Content**: 
Document-level projection is addressed by `ext:views-l2`. The broader projection surface — dashboards, timelines, AI context packages, real-time views, and composite renderings that are not document-shaped — remains a future concern. Projections are read-only views; they do not modify Record state.

### Revision history exchange format

**Content**: 
A standard format for exchanging full Revision history between implementations, for cases where the history itself is a first-class interoperability concern. Natural extension of `ext:addressability`. Deferred pending stabilisation of the Container and Relation layers.

### Graduation mapping record

**Content**: 
A structured artefact recording how a Note or Typed Record was mapped to its Record successors — which section or field names were matched, merged, split, or interpreted. Useful for AI-assisted graduation review and audit. Deferred pending implementation experience.

### Field domains

**Content**: 
Named sets of Fields that travel together may become useful as Type libraries grow. For v2, ordinary shared base Types plus `ext:type-inheritance` cover the immediate reuse need with less machinery. Field domains are deferred until there is stronger evidence that reusable field sets need their own identity, versioning, and package dependency rules independent of Types.

### View inheritance and composition

**Content**: 
As View libraries mature, inheritance will become necessary. A lightweight ADR View and a governance ADR View share base configuration — field selection, ordering, `editorHint` overrides — while diverging on workflow framing and export layout.

A future version may define:
- `extendsViewId?: UUID` — single inheritance; child View inherits all `fieldViews` from parent and overrides selectively
- `composesViews?: UUID[]` — mixin composition; multiple Views contribute non-overlapping configuration

Current design: `View` is a leaf type. Use Lineage tracking to record inheritance relationships.

### Instance graph exchange format

**Content**: 
A standard envelope for exchanging a Container together with its full Record set, Relations, and source references. Natural successor to `Package` at the instance layer. Likely shape: `{ container, instances[], relations[], sourceRefs[] }`. Deferred pending stabilisation of `ext:views-l2` and implementation experience.

### Field transclusion in Document Views

**Content**: 
Pulling a specific Field value inline into a Document View is useful, but a syntax such as `{{field:{recordId}/{fieldId}}}` makes a reusable Document View depend on concrete instance IDs. That weakens portability and should wait for an addressing model that can express reusable selection rules rather than binding a definition to one Record.

### Conditional processing

**Content**: 
Audience, platform, and output filtering may eventually allow one source Container to produce different projections for different readers. This is deferred because SectionSource queries already cover common projection differences, while a general condition evaluation model would add substantial complexity.

### Sub-field addressing

**Content**: 
Web UI comments and annotations attached to specific text within a Field value require addressing below the Field level. `ext:addressability` currently addresses at Field granularity. Sub-field text selection addressing is architecturally possible (the Address space accommodates it) but is deferred as a separate extension.

---

### μDemocracy Mapping

**Content**: 

### Why tags exist: from clustering to definitions

**Content**: Tags emerged from a concrete problem in note-taking: when building up a body of notes, there was no lightweight way to say "these notes are related" or "this note belongs to this topic cluster" without creating a formal Relation or binding to a Type.

Raw string tags on Notes filled that gap. A tag is not a claim about structure — it is a claim about topic membership. Notes about the same problem domain, design thread, or concern can share a tag, and that shared tag is enough to surface them together.

### Evolution to definitions

As tag vocabularies grew, the tags themselves needed properties. Two problems appeared:

1. **Disambiguation**: the same string could mean different things in different contexts. A label is not enough — description and aliases matter.
2. **Roles**: some tags were structural signals rather than topic labels. The `foundation` tag marks notes that should always be included in an AI context handoff. That is a semantic role, not just a category.

This led to `TagDefinition` — an addressable Tier 3 record that gives a tag a stable identity, description, roles, and aliases. A tag does not *require* a definition to be used; definitions are additive enrichment. But when a tag carries structural meaning (like `foundation`), its definition is what makes that meaning machine-readable.

### Design principle

Tags are a peer to Field and Type in the SRS data model — not an extension, not an afterthought. They are defined natively in the core implementation with dedicated service functions, not modelled as user-defined package types. This is because the operations that depend on tags (especially foundation note selection for AI context) are universal across all SRS repositories, not specific to any one repo's package.

### ext:federation × ext:lifecycle interaction

**Content**: Three design decisions govern how `ext:lifecycle` and `ext:federation` interact.

**1. Lifecycle state preservation on import**

Records imported via federation preserve their `lifecycleState`. An implementation MUST NOT reset a federated record's lifecycle state to `initialState` on import. Lifecycle state is part of the record's identity and governance history — it is not a local annotation that the receiving repository owns.

**2. Cross-repository relations and lifecycle state**

Relations targeting records in any lifecycle state — including `draft` and states where `isFinal: true` — are valid. Lifecycle is a governance concern, not an identity or structural concern. An implementation MAY surface a diagnostic warning when a relation targets a remote record whose lifecycle state is unresolvable (e.g. the remote repository is unavailable), but MUST NOT reject the relation on that basis alone.

**3. Final-state records as federation targets**

Records in states where `isFinal: true` remain valid relation targets after federation operations. `isFinal` signals that the record's lifecycle has settled — it does not signal deletion or invalidity. A federated record in a final state retains its identity and may be referenced, linked, and included in containers.

### Relation design principles (R1–R11)

**Content**: The Relation layer is governed by eleven ratified principles (relation-coherence epic, srs#171), written for both human authors and AI agents. They constrain how relations, their vocabulary, ordering, provenance pointers, containers, and identity transitions relate to one another. Each is normative and, per R10, has an enforcement point.

**R1 — A Relation is a binary, directed, typed edge between two instance UUIDs.** There is no `members[]` or hyperedge form. A `Container.containerId` is never a relation endpoint (Invariant 20).

**R2 — Direction is a slot convention; meaning lives in the type.** Every edge reads `source [relationType] target` (Invariant 16). The slots carry no agency or authority — those are properties of the `RelationTypeDefinition`. Only the canonical forward form is stored; inverse forms (`part-of`, `superseded-by`, `follows`, …) are derived, never asserted.

**R3 — Relation types are installed definitions, not free strings.** Every `relationType` MUST resolve to a `RelationTypeDefinition` in the effective package set (conformance V1). A domain-specific relation is introduced by installing a `namespace/name` definition, never by writing an unresolved string.

**R4 — Relations are claims; asserting one never mutates an endpoint.** No lifecycle change, no ownership, no cascade — a relation may target a record in any lifecycle state, including final. The only coupling runs the other way, and only for *definitional* relational states, whose meaning *is* a relationship (`state ⇒ relation`, never `relation ⇒ state`; e.g. `superseded` means "has a successor"). *Contextual* obligations — whose applicability depends on the kind of record — are not this coupling: they belong to the Type or lifecycle chosen (reached by retype, R11) or the ratifying process, never a conditional bolted onto a shared state.

**R5 — Semantics come from structure, never from a type string.** No consumer infers meaning from a relation-type literal; behaviour keys off definition properties (`category`, `canonicalDirection`, constraint fields) or explicit structural markers. Presentation may render a type name, but no meaning is derived from matching it.

**R6 — There is one semantic ordering mechanism.** Semantic sequence is the pairwise `precedes` chain, traversed in one place. Presentational ordering belongs to the view layer, not the relation graph; `precedes` MUST NOT be asserted for presentational goals.

**R7 — Edges and provenance pointers are different vocabularies, and disjoint.** A Relation connects two instances; a `SourceReference` points from an instance (or edge) to source material via its own `sourceRole` vocabulary (RFC-023). The `sourceRole` value set MUST be disjoint from installed relation-type keys (Invariant I-88). When cited source material is promoted to an instance, its provenance pointer converts to a lineage edge per the RFC-023 graduation mapping — a case of R11.

**R8 — Containers scope; relations mean.** Container membership — root instances plus transitive `contains` traversal, or an explicit member list — is a scope claim ("handle these together"). A `contains` edge is a semantic composition claim. Neither substitutes for the other.

**R9 — Relation writes go through one validated path; compound operations compose it atomically.** Every relation write is validated (endpoint resolution, type resolution, irreflexivity, type constraints). Compound acts — successor creation, retype/promotion (R11), successor-spawning transitions — compose that path so that every intermediate state is a valid repository.

**R10 — Every principle has an enforcement point.** Each principle is enforced by schema, a write-time check, an at-rest validation diagnostic, or a structured projection to clients. A principle stated in prose but enforced nowhere is a defect, to be enforced or removed.

**R11 — What a record *is* changes by re-instantiation linked by a relation, never by in-place mutation.** Field values and lifecycle state mutate in place; a record's identity — its Type, its tier, its position in a supersession lineage — does not. When a record becomes something else (superseded, graduated across tiers, retyped to a specialist type, or a cited source becoming an instance), the original is preserved and a new instance is created, linked by a lineage relation; the relation graph is the authoritative record of what became what. Retype additionally rebinds the lifecycle: the new Type's state machine applies from its initial state, so a state reached under the prior Type does not survive the retype.

