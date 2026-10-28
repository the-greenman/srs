# Blueprint

> The definition of a whole document type: which Record Types it produces at the root, what Relations are expected between the resulting Records, and which Types must be present for it to count as comp…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

The definition of a whole document type: which Record Types it produces at the root, what Relations are expected between the resulting Records, and which Types must be present for it to count as complete. It is the artefact handed to an extraction pipeline, and it answers a different question from a view — a Blueprint says what this document *is* and what should be extracted, at definition time, from source material; a view says how records that already exist are assembled for reading.

**Notes**: Its type pointers are version-exact, so the shape a Blueprint asks for cannot drift under it when a Type is reversioned.

## Blueprint.rootTypes entries must be ExactTypeRef (typeVersion required)

**Number**: I-78

Each entry in Blueprint.rootTypes MUST be an ExactTypeRef: both typeId (UUID) and typeVersion (integer >= 1) MUST be present. Implementations MUST resolve each entry against the Package (the union of all packages in scope per packageRef/packageRefs) at Blueprint load time; an entry that does not resolve MUST produce a diagnostic. An empty rootTypes array is valid and produces no diagnostics.


## `RelationSpec`

**Required for**: extraction pipelines, founding document workflows, any system that needs to specify what a document type IS before assembling it.


## RelationSpec

Declares an expected Relation between two Record types within a Blueprint.

See *Generated reference: `RelationSpec`* for `RelationSpec`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list (and no longer risks drifting from the current `ExactTypeRef`-based schema, as the superseded prose here had).


## `Blueprint`

The definition of a complete document type — which Types it contains, what Relations exist between resulting Records, and what "complete" means. A Blueprint is the artefact handed to an extraction pipeline.

See *Generated reference: `Blueprint`* for `Blueprint`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

**Blueprint vs View:**

| | Blueprint | View / Composition |
|---|---|---|
| Question it answers | What IS this document type? What should be extracted? | How are existing Records assembled into readable output? |
| Operates at | Definition time | Projection time |
| Input | Source material (transcripts, conversations) | Existing Records in a Container |
| Output | Extraction instructions → Records | Rendered document |
