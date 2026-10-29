# Source reference

> A pointer from a field value or an instance back to the material it came from, naming what kind of source it is, which source, and what role that source played (evidence, extracted-from, quoted-from,…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

A pointer from a field value or an instance back to the material it came from, naming what kind of source it is, which source, and what role that source played (evidence, extracted-from, quoted-from, inspired-by, or attaches), with an optional confidence and note. It records where meaning came from without asserting anything between two instances: source material cited this way is not itself an instance and does not become one.

**Notes**: Promotion converts the pointer into a Relation when the material it addresses becomes an instance, and the role decides which edge and which direction. Attachment is deliberately not modelled as a Relation edge.

## SourceReference with sourceType: "repository-document" must have a…

**Number**: 48

A `SourceReference` with `sourceType: "repository-document"` must have a `sourceId` matching a `SourceDocument.documentId` whose sidecar is present in `sourceDocumentsPath`. A reference whose `documentId` cannot be resolved within the repository is invalid.


**Intro**: **SourceReference → Relation graduation mapping (RFC-023):** when source material referenced by a `sourceRole` provenance pointer is promoted to an instance, the pointer converts to the listed Relation edge. The *referencing instance* carried the sourceRef; the *promoted instance* is created from the source material.

**Outro**: Conversion semantics (RFC-023 R6): the originating role is recorded in `meta["com.semanticops.srs/sourceRole"]` (required for `quoted-from` — it is the only carrier of the quotation distinction); `confidence` carries over; `note` maps to Relation `notes`; the converted SourceReference is removed in the same operation. Relation-borne sourceRefs never convert (a Relation cannot be an edge endpoint) and are retained. `inspired-by` is retained, or a custom `namespace/name` relation type may be used — removal applies if an edge is created. See RFC-023.

| sourceRole | Relation edge | sourceInstanceId | targetInstanceId |
| --- | --- | --- | --- |
| `extracted-from` | `derived-from` | the referencing instance | the promoted instance |
| `evidence` | `evidences` | the promoted instance | the referencing instance (direction flips) |
| `quoted-from` | `derived-from` | the referencing instance | the promoted instance |
| `inspired-by` | *(no canonical edge)* | — | — |


## attaches SourceReference acceptance

**Number**: I-101

A conformant implementation MUST accept `"attaches"` as a value of `SourceReference.sourceRole`. An attachment is a `SourceReference` with `sourceType: "repository-document"`, `sourceRole: "attaches"`, and `sourceId` equal to a source document's `documentId`. Attachment MUST NOT be modelled as a `Relation` edge; there is no `attaches` canonical `Relation` type.


## attaches sourceId must resolve to a source-document sidecar entry

**Number**: I-102

The `sourceId` of an `attaches` `SourceReference` MUST resolve to a `documentId` in the repository's source-document set, discovered via a `.meta.json` sidecar scan of `sourceDocumentsPath` in the same repository (RFC-038 [R25], amending RFC-017 [R2]/[R12]; `sourceDocumentIndex` is retired per RFC-038 [R2]). Resolution is against the sidecar entry, not the content file. A `sourceId` that resolves to no such entry is non-conformant and MUST be reported with a diagnostic at validation time.


## tombstone reference-only state: absent content file is valid

**Number**: I-112

A source-document sidecar entry (RFC-038 [R25], amending RFC-017 [R12]; the entry no longer lives in a manifest `sourceDocumentIndex`, which is retired per RFC-038 [R2]) whose content file (at `contentPath`) is absent is a valid tombstone (reference-only) state. A conformant implementation MUST NOT reject, refuse to load, or refuse to export a repository solely because a discovered source document's content is missing. An `attaches` `SourceReference` targeting a tombstoned `documentId` remains conformant (I-102). An implementation MAY surface an informational non-blocking diagnostic that the content is unavailable.


## `SourceReference`

A pointer from a field value or instance back to source material.

See *Generated reference: `SourceReference`* for `SourceReference`'s current property table (modelled once and shared across `Record`, `Note`, and `Relation`), optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

`"transcript-chunk"` and `"transcript-segment"` are intended for implementations that have a stable conversation or time-stream layer with durable chunk or segment identifiers. A standalone repository that stores transcript exports, chat dumps, email threads, or similar source material directly under `source-documents/` should generally cite those files using `sourceType: "repository-document"` (see `ext:repository`) rather than inventing pseudo-chunk IDs.
