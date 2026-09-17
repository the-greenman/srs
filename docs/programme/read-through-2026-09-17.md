# Read-through of the rendered specification, 2026-09-17

Planning unit of the readability wave (srs#787). Subject: `docs/spec/srs-spec.md` at
`origin/master`, 7,274 lines, 560 headings, nine Parts. Read front to back as a competent
engineer meeting SRS for the first time.

Two known presentation defects are discounted throughout: the labelled field rows
(`**Canonical Key**:`, `**Content**:`, `**Intro**:`) and duplicated Part headings, removed by the
Theme in srs#794; and code-first values glued to labels, fixed by the renderer in srs#793.
Everything else below is content, order or structure.

---

## 1. Executive read-out

The spec is structurally sound and locally well written. It is hard to read linearly for five
reasons, in order of how much reading they cost.

**1. A quarter of the document is an index of itself.** Four generated dumps restate material the
reader has already read: Foundation Group (Core) L1214-L1821, Distribution Group (Core)
L4126-L4259, the second reference dump inside Part Extensions L5801-L6473, and Key Invariants
L6532-L6854. That is roughly 1,740 lines, 24% of the document. Each of the 30 generated type
references prints a property table and then a compact pseudo-IDL block restating the same table.
Key Invariants reprints all 127 invariants verbatim, in situ a second time. A linear reader has no
way to know these are reference material and not new content.

**2. The story and the tree disagree at the two places it matters most.** In Foundations, `Type`
(L373) is introduced 470 lines before `Field` (L843), and `Field assignment` (L396) is nested
inside `Type` while depending on `Field`. Type is defined as "a composition of Fields" to a reader
who has not met a Field. In the whole document 10 of 86 concept `depends-on` edges are unmet at
the point of reading; 4 of those 10 are this one cluster. At Part level, Governance is last, yet
its own prose says the six foundational tensions are "the specification's own reading key".

**3. A concept's own explanatory prose is often not next to the concept.** Four `mechanism` leaves
are siblings of the concept they explain rather than children of it, so they render at the very end
of their Part: Stable identity (concept L181, prose L1205), Instance (L1830 / L2065), Semantic
order (L2451 / L3021), Projection (L4268 / L5648). Projection's explanation sits 1,380 lines after
its heading, behind View, Composition and Theme in full.

**4. Superseded prose renders next to its replacement.** "Why Record tiers exist (Note to Typed
Record to Record)" (L2013) is immediately followed by "Why Record tiers exist (Note to Record)"
(L2023). The reader is told SRS has three tiers, then two, with no signal which is current.
"Why tags exist" appears twice (L664 a relocation stub with no content, L710 the real text). This
is the same defect twice and it is fatal to trust.

**5. The document narrates its own change history instead of stating its rules.** 390 lines cite an
RFC number or an `rfc-decision-*` id. Retired mechanisms keep full sections (`ext:changelog`
L6475, `ext:federation` L6484, `ext:recommended-relations` L2132, the pre-RFC-032 `valueType` map
L993). Terminology from earlier generations is still live in prose: SCDS 9 times, Typed Record or
TypedRecord 9, Tier 3 once, TagDefinition twice, Document View 10. Three dangling section-number
references (`§5`, `§9`, `§9-1`) point at a numbering scheme the rendered document does not have.

Secondary but cheap to fix: five design-note leaves render as a heading with no body at all
(L895, L2042, L2170, L7034, and L214 which is heading plus a bare table), and the Part
"Reading this specification" never lists the nine Parts or says who the reader is.

---

## 2. Per-Part findings

Kinds: MB missing bridge, FR forward reference, GN graph-node prose, DR drift, UR unreadable,
RP repetition, MP misplaced.

### Part 1, Reading this specification (L3-L172)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L5-L9 | Part prose promises "the nine Parts read front to back" but never names them or the reader | MB | part:reading-this-specification | Rewrite the Part prose as the reader's contract: who this is for, the nine Parts in one line each, what to skip |
| L11-L33 | First content in the document is a Need-to-Extension decision table naming 12 extensions before Field, Type or Record exist | FR | record:concepts/purpose-and-scope | Move the table to the end of the Part, or to Part Conformance; lead with what SRS is |
| L35-L42 | "A core conformance declaration" arrives before conformance is defined | FR | same | Merge into the extension-model mechanism, keep one declaration form |
| L70, L81, L93 | "Example: a core conformance declaration.", "Table: the extension identifier and dependency reference." read as unresolved pointers | GN | same | Render the example inline, or delete the pointer sentence |
| L44-L57 | "What this specification defines" is a good orientation and is buried third | MP | same | Promote to first leaf of the Part |
| L105-L134 | Notational conventions mixes TypeScript notation, RFC 2119, namespace grammar, name rules and a six-row version-bump table in one leaf | UR | record:concepts/canonical-reference | Split: notation and keywords stay here; the version-bump table moves under Version lineage |

**Reading contract.** Entering: nothing. Leaving, as written: the reader knows the notation and
the RFC 2119 keywords, and has seen a list of extension names with no meaning attached. Leaving,
as it should be: the reader knows what SRS is for, that meaning lives in records and documents are
projections, the nine Parts and their order, and the notation.

### Part 2, Foundations (L173-L1821)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L373 vs L843 | Type introduced 470 lines before Field, defined as "a composition of Fields" | FR | concept-9bccaa53 (Type), concept-873099c5 (Field) | Story order Field, Field type, Composite value, Field assignment, Type, Type specialisation |
| L396 | Field assignment is a child of Type but depends on Field | FR | concept-42ed953e | Same reorder; keep the `contains` parent, change the read position |
| L296 | AI guidance introduced before Field, and defined in terms of Field | FR | concept-89444ae5 | Move after Field |
| L656 | Vocabulary sits between Type specialisation and Field with no bridge from either | MB | concept-ffe99460 | Move after Field; open the prose by saying what problem a controlled string set solves |
| L214-L233 | A μDemocracy application-mapping table inside the Namespace concept, forward-referencing Blueprint, Protocol, View, Address, Attention State, Revision | MP DR | design-note 041 | Delete from the spec, or move to a non-normative appendix |
| L279-L292 | "`semanticObjectType` as a federation risk" argues about a property not yet introduced, in a removed capability's vocabulary | DR MP | concept-1188b6bb | Delete; `semanticObjectType` collapsed at rev 6 and federation is removed |
| L664-L668 | "Why tags exist" renders as a heading with a relocation stub, then the real note at L710 | RP | Vocabulary design-notes | Delete the stub |
| L724 | "an addressable Tier 3 record", "TagDefinition" | DR | same | Rewrite against Vocabulary and Term |
| L861, L1677 | "In SCDS, a Field is defined once" | DR | Field design-notes | Rename to SRS throughout |
| L895 | "Choosing between repeatable fields, field groups, and separate Records" is a heading with no body; both named mechanisms are retired | UR DR | design-note 018 | Delete the record |
| L993-L1008 | The pre-RFC-032 `valueType` migration table in the main line of Foundations | MP | concept-873099c5 | Move to a migration appendix |
| L1205-L1212 | Stable identity's own prose renders 1,020 lines after the Stable identity concept, at the end of the Part | MP GN | concept-af14997a | Re-parent the mechanism under its concept |
| L1214-L1821 | 608 lines of generated property tables, each followed by a pseudo-IDL block restating it | RP | Foundation Group (Core) | Render tables under their concepts; drop the duplicate pseudo-IDL or make it collapsible |
| L1506-L1551 | Relation's directionality and canonical-type tables render inside Foundations; the Relation concept is in Part Structure | MP | concept-1e23ee5d | Move with the generated reference to Structure |
| L531-L551 | "The inheritance floor" ends in a paragraph about Pattern Grid cell linkage and retrieval signals, which belongs to the charter | MP UR | Type specialisation design-notes | Cut the last paragraph |

**Reading contract.** Entering: the notation, the reading order. Leaving: the reader can define
Field, fieldType, FieldAssignment, Type, Type specialisation, Vocabulary, Term, Lifecycle, and
state the one rule that governs all of them, that Field semantics belong to the Field.

### Part 3, Instances (L1822-L2074)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L1840, L1872 | Note and Record are introduced before Semantic maturity tier (L1990), which is the frame that makes them two of something | FR MB | concept-07ee545a | Put Semantic maturity tier first in the Part |
| L2013-L2021 | "Why Record tiers exist (Note to Typed Record to Record)" states three tiers, immediately before the two-tier replacement | RP DR | Semantic maturity tier design-notes | Delete the superseded note; keep the one-line history already in the successor |
| L2042 | "Graduation: when and how" is a heading with no body | UR | design-note 019 | Write it or delete it |
| L2065-L2071 | The Instance concept's own prose renders after all of Instance's children | MP GN | concept-e1f255e4 | Re-parent under the concept |
| L1834, L2067, L2069 | The two-id-spaces point is made three times in 240 lines | RP | concept-e1f255e4 | Say it once, in the concept's prose |

**Reading contract.** Entering: Field, Type, Vocabulary, Lifecycle. Leaving: the reader can say
what an instance is, how the two id spaces differ, what a Note and a Record each carry, how
`fieldValues` is keyed and shaped, and what graduation records.

### Part 4, Structure (L2075-L3030)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L2085, L2164, L2176 | Relation type definition, Semantic succession and Source reference all precede the Relation concept (L2232) and all depend on it | FR | concept-1e23ee5d | Relation first, then its vocabulary, then succession and provenance |
| L2134, L2138, L2149 | "See §5 (Package)", "§9-1", "§9" point at a numbering the rendered document does not carry | GN | Relation type definition mechanisms | Replace with the record link or the concept title |
| L2132-L2139 | A full section for the retired `ext:recommended-relations` | DR RP | same | Reduce to one line under Relation type definition |
| L2170 | "When to edit in-place vs create a new Record" is a heading with no body; the table lands at L1496 in Part 2 | UR MP | design-note 017 | Move the table here and give the note a body |
| L2266-L2291 | R1-R11 is 26 lines of dense principle prose restating rules the reader has just met as invariants | RP UR | concept-1e23ee5d | Keep R1-R11 as the citable set, cut the restatement of each rule to a pointer |
| L2366-L2381 | "Directory-kind scopes via typed identity records", explicitly non-normative, five paragraphs of open design, inside the Container concept | MP | concept-7a7c02a5 | Move to the rationale projection |
| L2469-L2560 | Blueprint and Protocol sit in Structure. Both are package-layer definitions, not instance structure | MP | concept-be74ea8e, concept-32ea1bce | Move to Distribution, or give Structure prose that earns them |
| L2772, L2924 | Addressability and Discovery also sit in Structure; Discovery's normative prose is in Part Extensions at L5721 | MP RP | concept-706db1c3 | One home per capability; invariants and prose together |
| L3021-L3027 | Semantic order's own prose renders 570 lines after its concept, at the end of the Part | MP GN | concept-209e7a48 | Re-parent under the concept |

**Reading contract.** Entering: instances and the two id spaces. Leaving: the reader can state
what a Relation is and is not, how direction reads, how relation types are installed, how a
Container's membership is computed, and why `precedes` is meaning and not layout.

### Part 5, Distribution (L3031-L4259)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L3037 | Part prose lists four nouns and no problem | MB | part:distribution | State the question the Part answers: how does a vocabulary leave the tool that made it |
| L3267-L4058 | Repository runs 790 lines and mixes layout, manifest shapes, archive format, JSON Store, slices, import semantics and source documents with no internal signposting | UR | concept-a0cafa15 | Split Repository into layout, manifest, travelling form and source documents, each with its own bridge |
| L3460-L3620 | The JSON Store and `ext:slices` blocks are wire-format detail in the reading line | MP | Travelling form mechanisms | Move behind the travelling-form concept as reference |
| L4126-L4259 | Distribution Group (Core), 134 lines of shapes already described in prose above | RP | Distribution Group (Core) | Same treatment as the other reference dumps |
| L3113 | Lineage and provenance depends on Package and follows it, which reads well; no change | ok | concept-e6e8e302 | none |

**Reading contract.** Entering: definitions and instances. Leaving: the reader can say what a
Package carries, how a repository is laid out on disk, what the manifest declares, and what
travels in an archive.

### Part 6, Presentation (L4260-L5657)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L4268-L4275 | Projection is stated as a principle but the prose that makes it land is at L5648 | MP GN | concept-00667eda | Re-parent the mechanism under the concept; it reads as the Part introduction |
| L4291-L5167 | View, Composition and Theme are introduced through their shapes. Roughly 500 lines of pseudo-IDL before the pipeline is described anywhere | UR MB | concept-79692e5f, concept-46a090b5, concept-87d1dbd2 | Open the Part with the three-stage pipeline, then the shapes |
| L4340-L4720 | Fifteen consecutive "The X shape" leaves with no connecting prose | UR | Composition mechanisms | Group under one reference heading; bridge each group in one sentence |
| L4985-L5113 | Normative Field-Row Form runs 128 lines of template forms inside the reading line | MP | Theme mechanisms | Move to reference |
| throughout | "Document View" appears 10 times beside "Composition" | DR | concept-46a090b5 | Normalise to Composition, the ratified name |
| L4328-L4338 | "View inheritance and composition" describes a future design in future tense, which the language guide bans | DR | View design-notes | Rewrite as a stated non-goal or delete |

**Reading contract.** Entering: records, relations, containers, packages. Leaving: the reader can
say that output is derived and never authored, and can name what View, Composition and Theme each
contribute to a render.

### Part 7, Extensions (L5658-L6523)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| whole Part | The Part named Extensions contains almost no extensions. `ext:lifecycle` is in Part 2, `ext:addressability` in Part 4, `ext:views-l1` in Part 6 | MP | concept-785654d0 | Decide one placement rule: either every extension lives here, or this Part is only the model plus interactions, and its prose says so |
| L5666-L5712 | Conversation boundary and Conversation Layer open the Part; both are about a layer SRS explicitly does not define | MP MB | concept-82e46ffb | Move after the extension model, or to Part 1 non-goals |
| L5677-L5681 | "SCDS captures negotiated semantic state" twice in five lines | DR | Conversation design-notes | Rename to SRS |
| L5721-L5797 | The whole of `ext:discovery` normative text is here while I-113 to I-124 are in Parts 4 and 8 | RP MP | concept-706db1c3 | One home |
| L5801-L6473 | 673 lines of generated reference for View, Composition, Theme, Protocol, Blueprint, DiscoveryQuery and others, none of whose concepts are in this Part | RP MP | generated-type-reference records | Render each under its own concept |
| L6475-L6493 | Full sections for `ext:changelog` and `ext:federation`, both removed | DR RP | extension records | One-line dormancy note each, with the return trigger, in a single "removed capabilities" leaf |

**Reading contract.** Entering: core and its capabilities. Leaving, as written: nothing reliable,
because the Part does not hold what its name promises. Leaving, as it should be: the reader can
say what an extension is, how one is declared, what declaring it obliges, and which pairs interact.

### Part 8, Conformance (L6524-L7159)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| L6532-L6854 | Key Invariants reprints all 127 invariants verbatim, already read in place, grouped under bare concept names with no prose | RP | Key Invariants region | Keep as a generated index but mark it as one and render it as a citable list, not as body text |
| L6532 | The Part opens with the index, so the reader meets 323 lines of restatement before any conformance rule | MP | part:conformance | Open with the Conformance concept and the declaration form |
| L6855-L7000 | Validation and `ext:cross-field-validation` sit after the invariant index with no bridge from it | MB | concept-9a584293 | Bridge: an invariant is the statement, validation is the act |
| L7003 vs L7028 | The Extension concept precedes Conformance and depends on it | FR | concept-785654d0 | Conformance first |
| L7034 | "How to decide which extensions to implement" is a heading with no body, and is the one place a reader would want guidance | UR | design-note 024 | Write it, reusing the Need table from Part 1 |
| L7019-L7022 | "Future Extensions" says only "The following capabilities are planned" and then lists nothing | UR | Future Extensions | Delete |

**Reading contract.** Entering: the whole model. Leaving: the reader can write their conformance
declaration string and knows what each term in it obliges.

### Part 9, Governance (L7160-L7274)

| Lines | What a reader hits | Kind | Owner record | Proposed fix |
|---|---|---|---|---|
| whole Part | The Part that says it is "the specification's own reading key" (L7213) is read last | MP | part:governance | Move Semantic sovereignty and the six tensions to Part 1, or make Part 1 point at them explicitly |
| L7176-L7202 | "Core Thesis" restates points already made in Purpose and Scope, Field, Type, Projection and Semantic succession | RP | concept-1f1da0e0 | Cut to the one claim the rest does not make: documents are socially negotiated semantic state |
| L7201 | "SCDS assumes that understanding evolves" | DR | same | Rename to SRS |
| L7215-L7219 | "Foundational values and development phase" repeats the Semantic sovereignty concept prose almost verbatim | RP | concept-dbfdd7f3 | Delete the repeat, keep the phase rule |
| L7241, L7246, L7251 | Axis numbers ("axis 4-10", "axis 5-11") cited with no explanation of the axis scheme | GN | same | Name the tension, cite the decision record, drop the axis coordinate |

**Reading contract.** Entering: the whole model. Leaving: the reader can predict how the
specification will resolve a new question, and knows which pole governs by default today.

---

## 3. Counts

| Measure | Value |
|---|---|
| Concepts with no self-description (`description` empty) | 0 of 63 |
| Concept descriptions shorter than 120 characters | 0 |
| Leaves rendering as a heading with no body | 5 (L214 heading plus table only, L895, L2042, L2170, L7034) |
| Concept `depends-on` edges unmet at the point of reading | 10 of 86 |
| Prerequisites the tree does not order (checker "unordered") | 34 of 86 |
| Mechanisms parented beside their concept instead of under it | 4 |
| Superseded prose still rendered beside its replacement | 2 pairs |
| Lines in generated index or reference dumps | about 1,740, 24% of the document |
| Lines citing an RFC number or decision id | 390 |
| Live occurrences of retired terminology | SCDS 9, Typed Record or TypedRecord 9, Document View 10, TagDefinition 2, Tier 3 1 |
| Dangling section-number references | 3 |
| Story-versus-tree divergences worth a `memberOrder` | 9 (see below) |

**The 34 unordered prerequisites.** These are `depends-on` pairs the tree does not place relative
to each other, so the reader's position when they meet them is undefined. Grouped by the Part that
should settle them:

Foundations: Type/Field, Field assignment/Field, AI guidance/Field, Type specialisation/Type,
Type specialisation/Field assignment, Composite value/Type, Field/Namespace, Field/Stable identity,
Field/Version lineage, Vocabulary/Stable identity, Vocabulary/Version lineage, Canonical
reference/Namespace, Canonical reference/Stable identity, Canonical reference/Version lineage,
Lifecycle/Type, Lifecycle/Vocabulary, Invariant/Validation, Invariant/Extension.

Instances: Note/Semantic maturity tier, Record/Semantic maturity tier, Graduation/Note,
Graduation/Record, Semantic maturity tier/Instance.

Structure: Container/Relation, Semantic order/Relation, Semantic succession/Relation, Source
reference/Relation, Blueprint/Relation, Discovery/Container, Addressability/Container,
Addressability/Protocol.

Distribution: Repository/Package, Lineage and provenance/Package.

Governance: Foundational tension/Semantic sovereignty.

**Story-versus-tree divergences (candidates for `memberOrder` under ruling A).**

| # | Part | Tree order today | Story order |
|---|---|---|---|
| 1 | Foundations | Type before Field | Field, Field type, Composite value, Field assignment, Type |
| 2 | Foundations | AI guidance early | after Field |
| 3 | Foundations | Vocabulary between Type specialisation and Field | after Field, before Lifecycle |
| 4 | Instances | Note and Record before Semantic maturity tier | tier frame first |
| 5 | Structure | Relation type definition, Semantic succession, Source reference before Relation | Relation first |
| 6 | Structure | Blueprint, Protocol, Addressability, Discovery inside Structure | Blueprint and Protocol to Distribution, Discovery to its one home |
| 7 | Presentation | shapes before pipeline | Projection prose first, then View, Composition, Theme |
| 8 | Conformance | invariant index first | Conformance concept first, index last |
| 9 | Whole document | Governance last | Semantic sovereignty and the tensions readable from Part 1 |

None of these changes a `precedes` edge. All are context order, which ruling A puts on the
Composition section's `memberOrder`.

---

## 4. Proposed units

Each unit is one Part, plus three cross-cutting units. All are cut against ruling A (context
membership and order at EXPRESSION, via containers and `memberOrder`) and ruling B (bridging prose
is the concept record's own prose). Sizes: S is one working session, M is two to three, L is more.

| # | Unit | Scope | Concepts getting prose | Order changes | Size | Depends on | Mode / Cell / Door |
|---|---|---|---|---|---|---|---|
| X1 | Reference material stops being body text | Move the four generated dumps out of the reading line: render each type reference under its own concept, drop or collapse the duplicate pseudo-IDL, mark Key Invariants as a generated index. Removes about 1,700 lines from the linear read. | none | none | L | srs#793, srs#794 | clear / ♊ Description / non-normative |
| X2 | Terminology normalisation and glossary pass | Replace SCDS, Typed Record, TagDefinition, Tier 3, Document View with current terms. Fix the three §-references. Delete the two superseded design notes and the retired-mechanism sections, leaving one dormancy leaf. | none | none | M | none | clear / ♊ Description / Door 1, cites rfc-decision-92d2da05, 53635966, 2a1e1590, 4f1e12e5 |
| X3 | "Reading this specification" becomes the reader's contract | Rewrite the Part prose to name the reader, list the nine Parts with one line each, and state the two things that govern everything (records are the source, documents are projections). Move the extension decision table to the end. | part:reading-this-specification, purpose-and-scope | Part 1 internal | S | X2 | clear / ♊ Description / non-normative |
| P2 | Foundations reads in dependency order | `memberOrder` for divergences 1-3; re-parent the Stable identity mechanism; delete the μDemocracy mapping and the federation-risk note; move the `valueType` migration table to an appendix. | Field, Type, Field assignment, AI guidance, Vocabulary, Stable identity | 3 | L | X1, X3, ruling A decision record | complicated / ♍ Containment / Door 1 |
| P3 | Instances | Tier frame first; delete the three-tier note; re-parent the Instance mechanism; write or delete "Graduation: when and how"; say the two-id-spaces rule once. | Semantic maturity tier, Instance, Graduation | 1 | S | P2 | clear / ♍ Containment / Door 1 |
| P4 | Structure | Relation first; reduce `ext:recommended-relations` to a line; move directory-kind scopes to rationale; give "When to edit in-place" its table back; decide the home for Blueprint, Protocol, Addressability and Discovery; re-parent the Semantic order mechanism. | Relation, Relation type definition, Semantic order, Semantic succession, Source reference | 2 | L | P3, ruling on divergence 6 | complicated / ♍ Containment / Door 1 |
| P5 | Distribution | Split Repository's 790 lines into layout, manifest, travelling form and source documents, each with a bridge; move JSON Store and slices behind the travelling-form concept. | Package, Repository, Travelling form, Lineage and provenance | 0 | M | X1 | clear / ♊ Description / non-normative |
| P6 | Presentation | Projection prose becomes the Part opening; add the three-stage pipeline before any shape; group the fifteen shape leaves under one reference heading; move the field-row templates to reference. | Projection, View, Composition, Theme | 1 | M | X1, X2 | clear / ♊ Description / non-normative |
| P7 | Extensions | Apply the placement rule decided by the ruling below; move Conversation boundary out of the opening; give the Part prose that matches what it holds. | Extension, Conversation boundary, Extension interactions | 1 | M | ruling on extension placement | complicated / ♍ Containment / Door 1 |
| P8 | Conformance | Conformance concept and the declaration form first, index last; bridge invariant to validation; write "How to decide which extensions to implement"; delete the empty Future Extensions. | Conformance, Invariant, Validation, Extension | 1 | S | X1, P7 | clear / ♊ Description / non-normative |
| P9 | Governance | Cut the Core Thesis repetition; delete the duplicated values paragraph; replace axis coordinates with named tensions; make Semantic sovereignty readable from Part 1. | Semantic sovereignty, Foundational tension | 1 | S | X3 | clear / ♊ Description / non-normative |

Suggested order: X2, X1, X3, then P2 through P9 in Part order, since each Part's contract depends
on the one before it. X1 is the largest single reduction and should not wait.

**Exit criterion.** Per srs#787 item 3, the wave ends on a read-through by a person who did not
write it. The mechanical part of that review is already covered: `check-spec-coherence.mjs`
catches forward references in the tree, and the unmet-at-reading-position count in section 3 can
be added to it as a sixth check over the rendered order rather than the tree order. That is a
small addition to an existing script and is folded into X1.

---

## 5. What needs a ruling

**R1. Do the four generated dumps stay in the rendered document at all?**
They are 24% of the reader's linear path and none of it is new information. Recommendation:
render the per-type property table under its concept, drop the compact pseudo-IDL block entirely
(it restates the table it follows), and keep Key Invariants as a generated index at the very end,
marked as an index. This is the single largest readability gain available and touches no normative
statement.

**R2. Where do Blueprint, Protocol, Addressability and Discovery live?**
They are in Part Structure today and none of them is instance structure. Blueprint and Protocol
are package-layer definitions; Addressability and Discovery are capabilities whose normative text
is currently split between Structure and Extensions. Recommendation: Blueprint and Protocol move
to Distribution; Addressability and Discovery get one home each in Extensions, invariants and
prose together.

**R3. What is Part Extensions for?**
Four extensions are documented in other Parts. Either every extension moves here, which makes
Foundations shorter but separates `ext:lifecycle` from Lifecycle, or the Part holds only the
extension model and the interactions, and the per-extension text stays beside the concept it
extends. Recommendation: the second. It matches ruling B, keeps each capability's prose next to
the concept it belongs to, and the Part then says so in its own prose.

**R4. Does re-parenting the four stranded mechanism leaves need an RFC?**
Moving a `contains` edge changes the meaning tree. RFC-042 Change A already says a leaf's
prerequisites are its parent's and that a mechanism carries a concept's prose, so these four look
like corrections rather than new meaning. Recommendation: treat as Door 1 citing RFC-042 Change A.
If the owner reads it as Door 3, it becomes an RFC-042 revision and P2, P3, P4 and P6 gain that
dependency.
