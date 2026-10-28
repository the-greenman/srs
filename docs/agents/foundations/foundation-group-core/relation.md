# Relation

> A first-class typed link between instances.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

A first-class typed link between instances. Relations allow implementations to construct semantic graphs for navigation, analysis, projection, and reasoning.

See *Generated reference: `Relation`* for `Relation`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

Relations span tiers. A Note may be the target of `derived-from` Relations from the Records it graduated into.

**Canonical relation types** (use these exact strings for cross-system interoperability):

`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`

Custom types not covered by these should use `namespace/name` format (e.g. `com.acme.hr/transferred-to`) to prevent collision. Extended relation type metadata is defined in `ext:recommended-relations`.

**Relations do not change lifecycle state.** A `supersedes` Relation does not mutate the prior Record's `lifecycleState`. Lifecycle state changes are explicit acts by an implementation's transition mechanism.

`precedes` is a claim about the records that a different order would be wrong; it is never read for navigation or document presentation ([R12], [R13]). Navigation follows the root container's entries, and a document's order is declared on its Container. Rule [N+12] remains the order of a rule section only.

**Intro**: **Directionality convention:**
`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target."

**Outro**: This convention must be consistent across implementations. See Invariant 16.

| Relation | source | target |
| --- | --- | --- |
| `supersedes` | the newer Record | the older Record |
| `contains` | the stage | the task inside it |
| `depends-on` | the dependent task | the task it needs |
| `refines` | the detailed version | the rough version |
| `derived-from` | the successor | the source Note or Record |
| `evidences` | the source material | the claim it supports |
| `precedes` | the earlier item | the later item |


**Intro**: **Canonical relation types** (use exact strings):

**Outro**: Implementations must store only the canonical (forward) form and derive the inverse when needed.

| Canonical | Converse | Category |
| --- | --- | --- |
| `contains` | `part-of` | Composition |
| `depends-on` | `required-by` | Dependency |
| `supersedes` | `superseded-by` | Governance |
| `refines` | `refined-by` | Refinement |
| `derived-from` | `source-of` | Derivation |
| `evidences` | `evidenced-by` | Evidence |
| `precedes` | `follows` | Sequence |
