# Semantic order

> Sequence asserted as a claim about meaning, not as a layout preference, expressed by pairwise precedes edges and read by traversing the chain.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

Sequence asserted as a claim about meaning, not as a layout preference, expressed by pairwise `precedes` edges and read by traversing the chain. It is used only where a different order would be semantically wrong — specification sections in document order, protocol stages in execution sequence. Ordering that reflects layout, curation or display preference is presentation and belongs in the view layer, and creating `precedes` edges for it is a misuse of the mechanism.

**Notes**: There is one ordering primitive and one only. A view may impose its own presentation sequence over the same records without contradicting the semantic chain, because the two are answering different questions.

## Semantic order

A `precedes` Relation states reading or execution order as a claim about meaning: this element comes before that one, and getting the order wrong is getting the claim wrong, not choosing a different layout. Specification sections in document order, and protocol stages in execution sequence, are both `precedes` chains: reversing either one changes what is true, not how it looks.

`precedes` is one Relation among the canonical types, read by walking the chain from sibling to sibling.

Order that reflects curation, display preference, or layout is presentation, not meaning, and belongs in the view layer. A Composition MAY sequence the same elements differently for rendering; that sequence is an arrangement, not a competing claim. Where the two disagree, the `precedes` chain is what the elements assert about each other. A `precedes` edge created to control how something displays is a misuse of the mechanism.


## precedes relations are semantic-only, not presentational

**Number**: I-125

`precedes` relations MUST be used only to express sequences where a different order would be semantically wrong (e.g. spec sections in document order, protocol stages in execution sequence). Implementations MUST NOT create `precedes` relations between instances whose ordering is presentational (layout, curation, display preference). A `precedes` relation between two container members MUST be interpreted as a semantic claim about their sequence, not as a rendering hint. (RFC-015 Change A.)
