# Compact pseudo-IDL

> The Compact pseudo-IDL: record section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
record {
  instanceId: string // Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage.
  typeId: string // Stable UUID of the referenced Type.
  typeVersion: integer // Version of the Type this ref targets (version-exact anchor).
  typeNamespace: string // Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins.
  typeName: string // Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins.
  lifecycleState?: string // ext:lifecycle — current lifecycle state of this Record.
  fieldValues: dependent → type_id // RFC-039: the name-keyed recursive value carrier, shaped by the Record's bound Type (resolved via typeId). Deliberately lossy at this envelope layer (approximated, per metamodel-fidelity.md); the Type's own projected schema validates the interior.
  sourceRefs?: ref → `source-reference` (inline)[] // References to source material this instance was derived from or attaches to (RFC-017/RFC-023).
  tags?: string[] // Free-form classification tags.
  createdAt?: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Relation

A first-class typed link between instances. Relations allow implementations to construct semantic graphs for navigation, analysis, projection, and reasoning.

See the generated reference below for `Relation`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

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



## Generated reference: `Relation`

**Referenced Type Id**: 4c000018-0000-4000-a000-000000000018

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `relation` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `relationId` | string | yes | format: uuid | core | Stable UUID for this standalone Relation (RFC-038). |
| `relationType` | string | yes | — | core | The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication). |
| `sourceInstanceId` | string | yes | format: uuid | core | The asserting instance. Reads: source [relationType] target. |
| `targetInstanceId` | string | yes | format: uuid | core | The related instance. |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `notes` | string | no | — | core | Free-form annotation on a Relation. |
| `sourceRefs` | ref → `source-reference` (inline)[] | no | — | core | References to source material this instance was derived from or attaches to (RFC-017/RFC-023). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/relation.json>
