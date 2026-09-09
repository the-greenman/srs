# Semantic Record System Specification

## Glossary

### AI guidance

**Definition**: Structured instruction carried on a definition telling a language model what the definition captures and how to populate it: a required `purpose`, and optional `extraction`, `negativeGuidance`, and worked `examples`. It travels with the definition instead of living in an application's prompt, which is what makes a package usable by a tool that has never seen it before. Guidance belongs to the entity that owns the meaning: a Field's guidance is the Field's, and a Type's guidance supplies session framing only — it never redefines a Field's extraction semantics.

**Notes**: Composition order is a recommended default, not an invariant: Type framing, View framing, Field extraction, negative guidance, examples.

**Key**: record:concepts/ai-guidance


### Addressability

**Definition**: A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — and so that a transcript fragment and a field on a record are co-addressable, which is what makes an assertion linking them possible. Alongside the stable address sits the live cursor: the current focus of an active process run, which moves continuously and is stamped onto conversation material as it is produced. Because it is stamped at production time, asking for everything said while attention was on this field becomes a query, not a search.

**Notes**: A stable address and a live cursor are structurally similar and must not be merged: one identifies an element, the other records where focus currently is. Likewise a cursor is set live and a source reference is set retrospectively.

**Key**: record:concepts/addressability


### Blueprint

**Definition**: The definition of a whole document type: which Record Types it produces at the root, what Relations are expected between the resulting Records, and which Types must be present for it to count as complete. It is the artefact handed to an extraction pipeline, and it answers a different question from a view — a Blueprint says what this document *is* and what should be extracted, at definition time, from source material; a view says how records that already exist are assembled for reading.

**Notes**: Its type pointers are version-exact, so the shape a Blueprint asks for cannot drift under it when a Type is reversioned.

**Key**: record:concepts/blueprint


### Canonical reference

**Definition**: How one definition points at another. The human-facing canonical string form is `namespace/name@version`, with `/` and `@` reserved as separators that may not appear inside a component or a name. The stored machine form is UUID-anchored: a bare UUID for a lineage reference, or an ExactTypeRef pairing `typeId` with an explicit `typeVersion` where the pointer must be version-exact. The string form is for display and is never what gets stored, so a rename never breaks a stored pointer.

**Examples**: `core/decision_statement@2`; `{ typeId: <uuid>, typeVersion: 3 }`

**Key**: record:concepts/canonical-reference


### Composite value

**Definition**: A Field whose range is another Type, not a scalar, declared as `datatype: "ref"` with a `rangeType`. In `inline` mode the value is a nested object shaped by that Type — structure expressed through the type system instead of a serialised blob in a text field. In `reference` mode the value is the id of a target instance, and it is definitional composition, not an assertion: it must never be interpreted as, or required to be accompanied by, a Relation.

**Notes**: The test for which to use: model an assertion *between* instances (one needing provenance, lifecycle or confidence) as a Relation; use `reference` where the target's identity is part of the definition itself.

**Key**: record:concepts/composite-value


### Composition

**Definition**: A container-level projection that assembles many instances into one readable document: an ordered set of sections, each selecting its members by a structured query or by container membership, each rendering them through a chosen presentation, with document-level export settings, heading depth, navigation links and an optional theme. It orchestrates; it does not replace the per-record presentation it dispatches to, and compositions do not nest inside one another.

**Notes**: When a section declares no view, a normative default rendering baseline applies, so theme-less and view-less output is specified, not implementation-chosen.

**Key**: record:concepts/composition


### Conformance

**Definition**: What an implementation must satisfy to claim SRS conformance, core and per-extension, and how that claim is declared and checked.

**Key**: part:conformance


### Conformance

**Definition**: What an implementation claims and what that claim obliges it to do, declared as the core plus the extensions it supports. Core conformance requires the Foundation and Distribution groups in full and enforcement of the core invariants; declaring an extension obliges accepting and validating its types, enforcing its invariants, and honouring its declared dependencies. The claim is what makes exchange predictable: two implementations at the same level produce definitions the other can consume.

**Notes**: Partial support is not conformance — an implementation that can produce archives but not consume them must say so explicitly. Receiving content from an unsupported extension calls for surfacing and preserving it, never silently discarding it.

**Key**: record:concepts/conformance


### Container

**Definition**: A grouping boundary over a collection of instances, answering the scoping question the Relation graph cannot: which instances belong together, what counts as this project. It is not a semantic object, having no Fields and holding no semantic state, and its claim is different in kind from a `contains` Relation: an edge says one instance is part of another; a Container says these instances form a unit for boundary purposes. Membership is declared: the union of its roots and explicit members, closed over declared child Containers, and never derived from a Relation (RFC-034).

**Notes**: A Container may name one member as its identity or purpose record, and one member whose Type is the Container's typing anchor. Its own id lives in a different space from instance ids and must never appear on a Relation. Nested scopes are declared through `childContainerIds`; `contains` remains the part-of tree where meaning lives and must still be maintained (rfc-decision-0750c62f).

**Key**: type:com.semanticops.srs/container


### Conversation boundary

**Definition**: The permanent architectural line between raw multimodal source material (speech, threads, annotations) and the negotiated semantic state SRS captures. The two layers reference each other in both directions but never merge: material on the conversation side is addressable evidence, and it does not become an instance automatically. A transcript chunk cited as evidence for a field value is not a Note unless someone deliberately models it as one.

**Notes**: The conversation layer is optional infrastructure. A repository declaring only the core plus the file-based repository format needs none of it, and source documents stored in the repository are sufficient evidence storage.

**Key**: record:concepts/conversation-boundary


### Discovery

**Definition**: A portable contract for asking a repository what it holds, split deliberately into two halves that behave differently. Structured filters, over type, container, tag, tier and lifecycle state, are exact-match predicates: two conforming implementations with the same data must return the same set. Free-text content matching is a recall floor: every instance whose projected text contains the normalised query must be returned, and returning more, or ranking differently, is explicitly permitted. This is what lets a naive substring matcher and a semantic search engine both conform.

**Notes**: Matching runs over a deterministic text projection: an ordered sequence of segments derived from an instance by a stated rule about which fields are searchable, normalised at match time by Unicode NFC and case folding, with punctuation, diacritics and whitespace left intact.

**Key**: record:concepts/discovery


### Distribution

**Definition**: How definitions travel between repositories: Package, Reference, Lineage, and Provenance.

**Key**: part:distribution


### Extension

**Definition**: An independently adoptable capability module, identified by an `ext:` name, declaring what it adds, what it depends on, and which invariants it owns. Extensions are how the specification grows without forcing every implementation to grow with it: no extension is required for core conformance, and an implementation adopts only what it needs. An implementation that does not declare one must ignore its properties instead of erroring on them, so data using an extension still loads where the extension is unknown.

**Notes**: Some extensions declare hard dependencies on others. A pair may also be formally independent yet functionally co-dependent for a given use, and cross-extension behavioural requirements apply only where both are declared.

**Key**: record:concepts/extension


### Extensions

**Definition**: The independently adoptable capability modules a repository may declare, and how they interact with each other and with the core.

**Key**: part:extensions


### Field

**Definition**: The atomic reusable semantic unit: one named, versioned, UUID-identified piece of meaning, defined once and composed into any number of Types. A Field owns its own semantics completely — its value contract and its AI guidance belong to the Field and may not be redefined, overridden or duplicated by a Type that includes it. If a context needs different meaning, that is a different Field with its own identity and lineage, not a local override.

**Notes**: Invariants 1-3 and 9 carry the Field's non-negotiables: rendering labels change nothing, Types may not restate Field semantics, and a new id means a new definition and not a new version.

**Key**: type:com.semanticops.srs/field


### Field assignment

**Definition**: The entry by which a Type admits one Field: a reference to the Field by id, its declared composition order within the Type, whether it is required before a Record can be logged, and an optional display label. It is the exact boundary between what belongs to the Field and what belongs to the Type — the assignment may say where the Field sits and whether it must be filled, and may never say what it means. `displayLabel` is strictly rendering: needing a materially different label means needing a different Field.

**Notes**: `order` is structure, not presentation. It feeds canonical serialisation and supplies the render default; a View may override it for display.

**Key**: record:concepts/field-assignment


### Field type

**Definition**: The complete statement of what a Field's value is, decomposed into orthogonal facets that vary independently: datatype, cardinality, value domain, string format, and value constraints. Because the facets are separate, a constraint on one never forces a choice on another — a closed list of markdown strings is expressible without inventing a datatype for it. Cardinality is declared here and nowhere else. Three composite datatypes let a value's range be another Type (`ref`), be governed by a sibling field (`dependent`), or be an open string-keyed collection (`map`).

**Notes**: It replaced the pre-RFC-032 `valueType` enum, which conflated four axes into one closed list and forced every independently-varying axis to be bolted on beside it. `valueType` is removed, not deprecated.

**Key**: type:com.semanticops.srs/field-type


### Field values

**Definition**: A Record's payload is one object keyed by `Field.name` verbatim, with no case or separator transformation at any nesting depth. Each entry is recursively shaped by what the corresponding Field declares: a scalar, an array under list cardinality, or a nested object for an inline composite. There is no wrapper construct around an entry and no entry-object form. Absence of a key is the only representation of an unset field: an explicit null is rejected and the writer must omit the key instead.

**Notes**: Structural presence and rendering presence are deliberately different questions: a key present with an empty string is structurally present but renders as absent.

**Key**: record:concepts/field-values


### Foundational tension

**Definition**: A named opposition between two complementary necessities, resolved not by choosing a winner but by declaring which pole is the default and stating the boundary at which the other governs. Six such tensions govern decisions in the SRS standard layer: Semantic Integrity vs Practical Expression, Continuity vs Evolution, Shared Coherence vs Local Autonomy, Office vs Testimony, Reliability vs Renewal, and Portability vs Possession. A tension is phase-bound where the specification says so — the temporal default is Evolution before the first full public release and reverses to Continuity at it.

**Notes**: The tensions are the specification's own reading key: a rule that looks arbitrary usually reads as one pole of a declared tension holding at its boundary.

**Key**: record:concepts/foundational-tension


### Foundations

**Definition**: The core entity model a repository is built from: Field, Type, Vocabulary and Term, record tiers, Relation, and Container. Every later Part presupposes these.

**Key**: part:foundations


### Governance

**Definition**: The specification's own governing rules: its foundational values, its process for continuity and evolution, and the balance between shared coherence and local autonomy.

**Key**: part:governance


### Graduation

**Definition**: Replacing a lower-tier instance with a higher-tier equivalent once its structure has stabilised, without destroying what came before. The original Note is preserved as the semantic root of whatever it produced, and each resulting Record links back to it. Graduation is not one-to-one: a single meeting Note may become one decision Record, three task Records and two risk Records, each with its own instance id and its own link back.

**Notes**: Which link, and whether the instance id survives, follows what actually happened: pure formalisation may keep the id and needs no link; interpretation during formalisation is a new id with `refines`; a split is new ids with `derived-from` from each new Record.

**Key**: record:concepts/graduation


### Import tracking

**Definition**: How a consumer that receives packages from an upstream publisher records what it imported, whether local content has diverged from the upstream source, and whether the upstream has moved ahead. Divergence and update conflicts are detected and surfaced instead of silently overwritten or silently missed.

**Key**: record:concepts/import-tracking


### Instance

**Definition**: A piece of captured content, as opposed to a definition that describes a shape. An instance carries its own stable `instanceId` in an id space distinct from the `id` + namespace/name/version lineage that identifies a definition, and it is the thing Relations connect and Containers scope. Confusing the two id spaces is the most common structural error: a Container's id is not an instance id and must never appear on either end of a Relation.

**Notes**: The self-declared `instanceId` inside the file is the identity. It is not derived from the filename or the path, and there is no manifest index to cross-check it against.

**Key**: record:concepts/instance


### Instances

**Definition**: The instance layer: Notes and Records as the two record tiers, and how a Record instantiates a Type through typed field values.

**Key**: part:instances


### Invariant

**Definition**: A numbered normative statement that must hold of conforming data and conforming implementations, assigned to core or to the extension that owns it. Invariants are where the specification's obligations are stated once and cited from everywhere else, so a rule has one home instead of several drifting restatements. An invariant is the statement; checking it is validation, and the two are deliberately distinct.

**Examples**: Invariant 16 fixes relation direction; Invariant 20 keeps container ids out of the instance id space; Invariant 2 forbids a Type restating a Field's semantics.

**Key**: record:concepts/invariant


### JSON Store

**Definition**: A single-file, self-contained JSON serialization of a complete SRS repository (`.srsj`), carrying identical semantic content to the filesystem repository layout defined by `ext:repository`. A conforming implementation must be able to convert between the two losslessly.

**Notes**: Preferred over the filesystem layout when portability matters more than per-file inspection: emailing a repository, committing a snapshot as one artifact, or embedding a test fixture.

**Key**: record:concepts/json-store


### Lifecycle

**Definition**: A named state machine (a closed vocabulary of states plus the transitions between them and exactly one initial state) that a Type may declare inline or reference as an installed, shareable definition. It governs where a Record stands in a process: draft, active, archived, or whatever the domain needs. Lifecycle state is changed only by an explicit transition act; asserting a Relation never moves it.

**Notes**: A state may declare that resting in it requires a satisfying Relation, enforced hard (the transition is rejected) or advisory (the transition proceeds and the unsatisfied state surfaces as an at-rest warning).

**Key**: record:concepts/lifecycle


### Lineage and provenance

**Definition**: Two distinct records of where a definition came from. Lineage is the relationship to what it was derived from — tracked from a source and expecting upstream updates, or deliberately forked with no further tracking, and possibly both during a transition. Provenance is the publishing origin: who published it, in which package, at what package version, imported when. Together they let a consumer answer whether a local definition has diverged from what it was copied from, and who is answerable for the original.

**Notes**: A package's semver and a definition's integer version are different axes and must not be conflated.

**Key**: record:concepts/lineage-and-provenance


### Namespace

**Definition**: A dot-separated, lowercase identifier that groups definitions under an authority and keeps names from colliding between independent publishers. Components match `[a-z0-9][a-z0-9-]*`. `core` is reserved for definitions maintained by the SRS standard, and `com.semanticops.core` is reserved such that no repository may declare a Type or Field under it. Namespace authorship is where domain vocabulary responsibility sits — the specification deliberately defines no universal ontology.

**Examples**: `core`, `community.adr`, `com.acme.hr`, `org.cooperative-name`

**Key**: record:concepts/namespace


### Note

**Definition**: A Tier 0 instance: a titled set of named free-text sections with no Type binding and therefore no field-level semantics. It exists so that material can be captured at the moment it appears, before anyone knows what shape it should take. A Note has a stable instance id, may carry tags and source references, and may be the target of Relations from the Records it later gave rise to.

**Notes**: Section names must be unique within a Note (Invariant 18). Tags on a Note are keys that may, but need not, resolve to a Term in an open vocabulary.

**Key**: record:concepts/note


### Package

**Definition**: The distributable unit of definitions: Fields, Types, and the vocabularies, lifecycles, relation types, views, compositions, blueprints, protocols and themes built on them, with a complete dependency manifest. It is bundled, meaning everything referenced is carried inside and it is self-contained, or standalone, meaning dependencies are expected already installed. The dependency manifest is required either way, so a consumer can check completeness without parsing what is inside.

**Notes**: Packages are what makes a vocabulary shareable instead of private to one tool. The specification defines the package's shape; how registries publish, authenticate or federate them is deliberately out of scope.

**Key**: record:concepts/package


### Presentation

**Definition**: How stored state becomes a document a person reads: projections, Views, and the Composition pipeline.

**Key**: part:presentation


### Projection

**Definition**: The principle that rendered output is derived from records and never the source of truth for them. Records hold the meaning; a document, a table, an export, a JSON serialisation are all views onto that meaning, produced on demand and discardable. A projection must keep a clear line back to canonical meaning and must never quietly become a second semantic source, which is what happens when someone edits the rendered artifact instead of the records.

**Notes**: Its practical consequence throughout the specification: presentation concerns live in the view layer, never on the Type. A rendering label, a display order or a renderer choice may never affect validation, extraction, Relations or discovery output.

**Key**: record:concepts/projection


### Protocol

**Definition**: An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient, and which Record fields it feeds. Stages declare epistemic dependencies on other stages, and not an ordering: a stage may run when what it needs is established, regardless of where it sits in the declared sequence. Protocols range from loose ones that produce open material to tight ones converging on a specific Record type, and the output of a loose one is the input context for a tighter one.

**Notes**: A Protocol is a package definition, not an instance. It is an epistemic concern, deliberately separated from presentation: the logic that guides a session was removed from views and lives here.

**Key**: record:concepts/protocol


### Reading this specification

**Definition**: The nine Parts read front to back: notation, RFC 2119 keywords, and the reading order the rest of the document assumes.

**Key**: part:reading-this-specification


### Record

**Definition**: A Tier 2 instance: a stable instance id bound to an exact Type version, carrying values for that Type's fields. The binding is by `typeId` and `typeVersion`, and it is authoritative — the denormalised `typeNamespace` and `typeName` are convenience hints, and a Record whose hints disagree with the resolved Type is invalid until corrected. Conformance is measured against the version the Record was instantiated under; publishing a new Type version does not migrate existing Records.

**Notes**: A Record may also carry lifecycle state, tags, source references and timestamps. Those are envelope members, governed by the Record schema and not by the Type's projected field schema.

**Key**: record:concepts/record


### Registry

**Definition**: A published, discoverable catalog of Field, Type and other definitions that a multi-publisher ecosystem can index. A Registry states no opinion on registry authority, authentication or federation between competing catalogs; a consumer may index more than one.

**Key**: record:concepts/registry


### Relation

**Definition**: A first-class, typed, independently identified assertion between two instances. It is always binary, a source and a target and never a set, and it always reads in one direction: source, relation type, target. Only the forward form is stored; the inverse is derived for display and never written. A Relation is a semantic claim carrying its own provenance, not a container, not ownership, and not a lifecycle act: asserting one never changes a state.

**Notes**: Relations are reserved for assertions with semantic consequence. A lightweight prose mention or citation must not be modelled as one (Invariant 17). Relations span tiers, so a Note may be the target of edges from the Records it became.

**Examples**: The canonical seven: `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`.

**Key**: type:com.semanticops.srs/relation


### Relation type definition

**Definition**: What an edge's type string means, installed as its own entity: the key as stored on an edge, a required label and description, a structural category, which end is source and which is target, the key of its display-only inverse, and optional constraints such as irreflexivity. Relation types form a single flat, repository-global set with no per-Type scoping, and a relation whose type does not resolve in it is a validation error.

**Notes**: It is a vocabulary-substrate specialisation that tightens label and description from optional to required. The canonical seven ship as installed definitions in the core package; custom types use `namespace/name` form and supply their own.

**Key**: record:concepts/relation-type-definition


### Repository

**Definition**: A directory that holds SRS content as files: a marker directory identifying the root, a manifest declaring the repository's stable id, its packages, its required root container and its declared extensions, and reserved folders for instances, relations, source documents and local definitions. Membership is authoritative from the tree itself — a file present under a reserved root is a member, and there is no manifest index to disagree with it. Identity lives inside the SRS data, never in filenames or storage history.

**Notes**: A repository is operable with no running service, no registry and no network. That is the point of the format, not an incidental property of it.

**Key**: record:concepts/repository


### Semantic maturity tier

**Definition**: How far a captured instance has been formalised, expressed as a tier and not as a yes-or-no. Tier 0 is a Note: named text sections, no type binding, no field semantics. Tier 2 is a Record: fields bound to a Type, fully semantic. The point of the tier model is that half-formed material is first-class — meaning may be captured before its shape is known and formalised later, instead of being lost because no template fitted it yet. An implementation may support only Tier 2.

**Notes**: The gap at Tier 1 is deliberate. `TypedRecord` was removed as an unexercised construct and the surviving tiers were not renumbered, so existing references stay valid.

**Key**: record:concepts/semantic-maturity-tier


### Semantic order

**Definition**: Sequence asserted as a claim about meaning, not as a layout preference, expressed by pairwise `precedes` edges and read by traversing the chain. It is used only where a different order would be semantically wrong — specification sections in document order, protocol stages in execution sequence. Ordering that reflects layout, curation or display preference is presentation and belongs in the view layer, and creating `precedes` edges for it is a misuse of the mechanism.

**Notes**: There is one ordering primitive and one only. A view may impose its own presentation sequence over the same records without contradicting the semantic chain, because the two are answering different questions.

**Key**: record:concepts/semantic-order


### Semantic sovereignty

**Definition**: The condition SRS exists to preserve: meaning stays under the control of the people who made it, and can move between tools, implementations, representations, repositories and time without captivity or silent loss. Portability alone does not achieve it — data that travels but arrives without stable identity, its relations, its provenance, or interpretable semantics has lost the meaning it was carrying. A design that improves convenience while making semantic data captive violates the purpose of SRS.

**Notes**: Stated in the specification's Foundational values subsection. It is the criterion every other design decision answers to, which is why it introduces nothing and depends on nothing.

**Key**: record:concepts/semantic-sovereignty


### Semantic succession

**Definition**: The rule that meaning is never silently rewritten. Correcting how something is expressed (a typo, phrasing, a clarification that leaves the understanding unchanged) is an in-place edit. Changing what was actually committed to produces a new instance linked to the prior one, and the prior one remains valid. The test is whether a reasonable reader meeting the record a year later would recognise it as the same understanding they would have read before the change.

**Notes**: Cross-check both ways: if a `supersedes` link would read as the group reversing itself when it only clarified, it was an edit; if a silent edit would read as the record being revised after the fact, it was a successor.

**Key**: record:concepts/semantic-succession


### Source reference

**Definition**: A pointer from a field value or an instance back to the material it came from, naming what kind of source it is, which source, and what role that source played (evidence, extracted-from, quoted-from, inspired-by, or attaches), with an optional confidence and note. It records where meaning came from without asserting anything between two instances: source material cited this way is not itself an instance and does not become one.

**Notes**: Promotion converts the pointer into a Relation when the material it addresses becomes an instance, and the role decides which edge and which direction. Attachment is deliberately not modelled as a Relation edge.

**Key**: record:concepts/source-reference


### Stable identity

**Definition**: The rule that every SRS entity carries a UUID that is minted once and never changes — not when the entity is copied, exported, imported, renamed for display, or moved between repositories. Identity is declared, never inferred from a filename, a path, a storage history or a display label, and never selected by precedence: an identity conflict is fatal, never resolvable. Changing what an entity is at root means minting a new UUID, not reusing the old one.

**Notes**: Definition identity (Field.id, Type.id, packageId) and instance identity (instanceId, relationId, documentId, containerId) are distinct id spaces that obey the same rule.

**Examples**: `repositoryId` survives export and copy; an importer that mints a new repository for every archive it receives, instead of keying on `repositoryId`, is non-conformant (Invariant 53).

**Key**: record:concepts/stable-identity


### Structure

**Definition**: How instances connect and order themselves: the Relation model, the contains tree, and the precedes chain that gives a repository its semantic sequence.

**Key**: part:structure


### Theme

**Definition**: A visual presentation layer attached to a rendered document (stylesheets, typography, assets, cover pages and templates that wrap each structural level of output), declared for named output formats and applied only when the render is in one of them. A theme wraps finished content and may never replace, suppress or reorder it, so removing the theme changes how output looks and never what it says.

**Notes**: The semantic CSS class vocabulary is part of the output specification and not of the theme extension: a conforming implementation emits it whether or not any theme resolves.

**Key**: record:concepts/theme


### Travelling form

**Definition**: The shape SRS content takes when it leaves the place it was made: a zip archive that is a self-contained snapshot of a repository, a single-file JSON store, or a slice carrying one container's closure as an independently openable archive. The standing test is that anything a repository is allowed to hold must be expressible in the corresponding travelling form — a capability that exists only in place is captivity, not a feature. Round-tripping between forms must lose nothing.

**Notes**: Import is identity-based, never path-based. Same key and same content is a no-op; same key and different content is a conflict to surface, because silent overwrite and silent discard are both non-conformant.

**Key**: record:concepts/travelling-form


### Type

**Definition**: A named, versioned, UUID-identified composition of Fields describing one kind of semantic object. A Type declares which Fields participate, in what order, and which are required — and nothing more about them, because Field semantics are the Field's. Its effective field list is its own declared assignments, plus inherited ones when it specialises another Type. A Type is a definition, not an instance: what conforms to it is a Record.

**Notes**: Extensions hang optional facets off the Type without changing that: a lifecycle declaration, cross-field rules, a base Type to specialise, an identity field.

**Key**: type:com.semanticops.srs/type


### Type specialisation

**Definition**: Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own. The governing constraint is substitutability — a system that knows the base Type but not the specialisation must still be able to read the inherited fields and should preserve the unknown ones instead of discarding them. A specialisation may therefore tighten an inherited optional field to required, but never relax a required one, and may never alter Field semantics.

**Notes**: Inheritance chains must be acyclic (Invariant 39). Only some properties cascade up the ancestor chain — the effective identity field does; the explicit field order does not.

**Key**: record:concepts/type-specialisation


### Validation

**Definition**: Checking data against the contracts its own definitions declare, and reporting what fails as severity-tagged diagnostics, never as a crash. Contracts come from several places: a Field's own value constraints, cross-field rules that only make sense over two or more Fields together, vocabulary resolution, reference resolution, and the specification's invariants. Diagnostics are reported, not thrown — a command that ran successfully and a repository that is valid are two different questions, and conflating them hides the second.

**Notes**: Cross-field rules are the Type's own complete and exclusive set: they are never inherited by value from a base Type (Invariant I-97).

**Key**: record:concepts/validation


### Version lineage

**Definition**: A positive integer scoped to one UUID's history, expressing how a definition has evolved while remaining the same definition. Version increments within the lineage; changing the `namespace` or the `name` is not a version bump but a new definition with a new UUID. A bump is required whenever a downstream consumer's extraction, validation or governance behaviour would differ — notably any change to `fieldType` or to the meaning of `aiGuidance`. Reworded prose alone needs no bump.

**Notes**: Package versions are semver strings and are a different axis: a package at 1.3.0 may carry `decision_statement@3` and `context@2`.

**Key**: record:concepts/version-lineage


### View

**Definition**: A named, versioned presentation over a set of Fields: which field rows appear, in what display order, under what labels, with what editor hints, and whether each is visible. It is field-centric, not Type-bound: any Record carrying the fields a View requires can be rendered through it — and it constrains presentation only. A View may not override, redefine or duplicate the semantics of any Field or Type it references.

**Notes**: A row may also present a Record-level property such as lifecycle state or tags without pretending that property is a Field. Hiding a row affects rendered text only; the value stays in the Record and in any structured projection.

**Key**: record:concepts/view


### Vocabulary

**Definition**: A controlled set of strings that appear in instance data and must mean something stable. Every entry, whatever specialisation it is, carries the same substrate contract: a stable id, a version, a namespace, the `key` that is the string actually stored, optional label, description and aliases, and a status of active, deprecated, tombstone or retired, where absent means active. A vocabulary is `open`, meaning unlisted values are valid and unenriched, or `closed`, meaning every value must resolve to exactly one entry.

**Notes**: An open vocabulary's authoritative value set is the distinct keys actually in use, not the curated entry list — the curation is an overlay that may lag or be empty. Curating a string into a Term rewrites no instance.

**Key**: record:concepts/vocabulary


