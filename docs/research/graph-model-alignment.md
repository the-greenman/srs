# Graph Model Alignment

> Companion to [semantic-document-landscape.md](semantic-document-landscape.md) and
> [alignment-opportunities.md](alignment-opportunities.md), closing a lens gap in the first:
> the **property-graph / database-language lineage**, which neither existing survey covers.
>
> Compiled 2026-08-10. External facts carry source links and were verified on that date;
> per the register's freshness caveat, re-verify before building on them.

## Why this document exists

JSON Schema answers the *document* half of SRS: validate a record, generate a form, generate
a typed client. It says nothing about the relation graph — instances joined by typed binary
edges, scoped by containers. Asking "what is the graph-side equivalent of JSON Schema?"
surfaced that the question had never been asked against the lineage that actually matches
SRS's data model.

The landscape survey covers the semantic web / linked data lineage exhaustively — RDF,
JSON-LD, schema.org, SHACL/ShEx, Solid, nanopublications, Wikibase, Web Annotation, atproto.
It does not mention Neo4j, Cypher, openCypher, Gremlin/TinkerPop, GQL, PG-Schema, or GraphML
at all. That is consistent with its three declared lenses — semantic web, modern protocols
and app-layer object models, structured-document authoring — none of which reaches the
database-language lineage. **A lens gap, not a rejection:** there is no prior disposition to
contradict.

## The role mapping — JSON Schema fills one cell of four

"The equivalent standard" is not one thing. The document world's roles split differently in
each graph world:

| Role | Document | RDF / linked data | Property graph |
|---|---|---|---|
| Data model | JSON | triples / quads | nodes + labelled edges, both with properties |
| Serialization | JSON | JSON-LD, Turtle, N-Quads | GraphML, JSON Graph, CSV bulk-load |
| **Schema / validation** | **JSON Schema** | **SHACL** (or ShEx) | **PG-Schema** |
| Query | JSONPath / jq | SPARQL | GQL / openCypher / Gremlin |
| Vocabulary | — | RDFS, OWL, schema.org, PROV-O | — (labels are opaque strings) |

The short answer to "what is the JSON Schema of graphs" is **SHACL**. It is the mature
option: a W3C Recommendation since 2017, with SHACL 1.2 Core, Rules, UI and Profiling at
First Public Working Draft since March 2025.

But SHACL validates RDF, and SRS is not RDF.

## SRS is a property graph

An SRS `Relation` is:

```
{ relationId, relationType, sourceInstanceId, targetInstanceId,
  assertedBy, confidence, status, validFrom, validUntil, createdAt, sourceRefs, meta }
```

An edge with **its own identity** and **its own properties**. That is the definition of a
property-graph edge. The correspondence is structural, not analogical:

| SRS | Property graph | RDF |
|---|---|---|
| `instanceId` (UUID) | node id | an IRI — SRS has none; no IRI, CURIE, prefix map or `@context` exists anywhere in the model |
| `typeId` / `typeName` | node label | `rdf:type` |
| `fieldValues` | node properties | triples with literal objects |
| `relationId` | **edge id** | **not expressible** — needs RDF-star, classic reification, or a named graph |
| `relationType` | edge label | predicate IRI |
| `assertedBy`, `confidence`, `status`, `validFrom` | **edge properties** | **not expressible** — same problem |
| `Container` | subgraph | named graph |
| E1–E4 write-time rejection | closed-world schema validation | open-world; nothing is invalid by design |

The landscape survey concedes the RDF side of this in its own words: per-edge provenance is
*"only now arriving via RDF-star."* Meanwhile the tetrad the survey claims as uniquely SRS's
own leads with *"first-class typed relations with semantic provenance
(`assertedBy`/`confidence`/`status`)"* — a property-graph-native feature, benchmarked only
against the lineage that lacks it.

### The RDF rejection reasons do not transfer

§I.1 gives four structural reasons the semantic-web lineage failed to produce portable
semantic documents. Three do not apply to property graphs, and the load-bearing one inverts:

| RDF failure mode | Applies to property graphs? |
|---|---|
| (a) no record boundary — "a soup of triples"; named graphs "arrived late and underspecified" | Also true, but SRS's manifest + container already supplies it; no conflict |
| (b) **open-world semantics deferred validation — "nothing was ever *invalid*, which is fatal for documents-as-contracts"** | **Inverted.** Property graphs are closed-world — the same posture as SRS's E1–E4 write-time rejection |
| (c) the embedding model inverted the projection (semantics as annotation *on* prose) | n/a — a storage/query model, not a document format |
| (d) authoring cost with no incentive loop outside SEO | n/a — same reason |

Reason (b) is the one that decided against RDF, and SRS lands on the property-graph side of
it.

## Standards inventory

| Standard | Status (verified 2026-08-10) | Bearing on SRS |
|---|---|---|
| **GQL** — [ISO/IEC 39075:2024](https://www.iso.org/obp/ui/en/#!iso:std:76120:en) | Published April 2024. The [first new ISO database language standard since SQL in 1987](https://neo4j.com/blog/cypher-and-gql/gql-database-language-standard/) | Query language over exactly SRS's data model. Schema support is thin in v1 |
| **SQL/PGQ** — [ISO/IEC 9075-16:2023](https://www.iso.org/standard/93698.html) (+ Technical Corrigendum 1, 2026) | Published | Property-graph pattern matching over relational SQL. The natural on-ramp if a SQL projection ever lands under srs-rust ADR-041 G8 |
| **PG-Schema** — [PACMMOD 2023](https://dl.acm.org/doi/10.1145/3589778) ([arXiv](https://arxiv.org/abs/2211.10962), [LDBC](https://ldbcouncil.org/docs/papers/pg-schema.pdf)) | **Not a standard.** An LDBC-backed academic/industry proposal, explicitly framed as "a recommendation for future versions of GQL"; a rich DDL is anticipated in GQL v2 | The closest thing to "JSON Schema for property graphs" — and it does not exist yet as a standard |
| **SHACL 1.2** | Core / Rules / UI / Profiling at FPWD March 2025; SHACL 1.0 a W3C Recommendation since 2017 | Mature shape language, wrong data model. Already a COMPONENT source (#17) for form generation |
| **RDF 1.2 / RDF-star** | Concepts and Semantics at [Candidate Recommendation 2026-04-07](https://www.w3.org/news/2026/w3c-invites-implementations-of-rdf-1-2-concepts-and-abstract-data-model-and-rdf-1-2-semantics/); [SPARQL 1.2](https://www.w3.org/TR/sparql12-protocol/) still Working Draft | Fixes edge identity via triple terms, but the query half lags. Relevant to any JSON-LD projection (register item 5) |
| **PROV-O** | W3C Recommendation | Unmentioned in either existing survey. Maps to `assertedBy` / `derived-from` / `sourceRefs`. Constrained by the standing spec non-goal: "SRS does not define a universal semantic ontology" — so export-vocabulary alignment only |

## The verdict

**No graph standard today has JSON Schema's combination of maturity and ubiquity.** The
options split cleanly and unhelpfully:

- **Mature, wrong model** — SHACL/RDF. Twenty years of tooling, but validating a data shape
  SRS does not have, and reaching SRS's edge model only through RDF-star, which is still
  landing.
- **Right model, immature schema story** — GQL/PG-Schema. An ISO standard for the query
  half; for the schema half, a research proposal aimed at a GQL v2 that has no date.

That asymmetry is the finding. There is no equivalent to wait for: on current trajectory the
graph analogue of JSON Schema arrives with GQL v2's DDL, unscheduled. Design as if it will
not arrive.

## What follows from this

Three consequences, none of which changes the model. SRS does not need to *adopt* a graph
standard — it already is a property graph.

### 1. A property-graph export is a cheaper first projection than JSON-LD

The register carries JSON-LD at rank 5 / NEXT / weight 45, "awaiting publication driver". A
property-graph export clears three obstacles that entry has to solve first:

| | JSON-LD | Property-graph export |
|---|---|---|
| Reified edges | Needs a decision — RDF-star (SPARQL 1.2 still WD), classic reification, or named graphs | Native; edges carry ids and properties |
| Vocabulary mapping | Field/Type → schema.org or a local `@context`; the register notes this "deserves care" | None — labels are strings |
| Identity | Needs an IRI scheme SRS does not have (canonical `srs://` syntax is still open, srs#218) | UUIDs serve as node ids unchanged |
| Consumers | GraphRAG / retrieval / SEO pipelines | Neo4j, Memgraph, Kùzu, Apache AGE — any Cypher or GQL engine |

Both are projections and both stay governed by srs-rust ADR-041 G8: a derived projection,
rebuildable, never the system of record. Scored as register item 22.

### 2. The shape languages are useful as a checklist, not a target

Ratified principle **R10** (design note 044) holds that *"a principle stated in prose but
enforced nowhere is a defect, to be enforced or removed."* Measured against that, the
relation layer has a substantial declared-but-unenforced set — I-16 directionality, I-17
relation-worthiness, I-20's relation-endpoint half, I-56/57/58 federation qualifiers, I-88
`sourceRole`/`relationType` disjointness, Blueprint `structure[]` cardinality, `precedes`
linearity, and graph acyclicity (never declared for Relations at all).

SHACL's constraint-component vocabulary (`sh:class`, `sh:minCount`/`maxCount`,
`sh:qualifiedValueShape`, `sh:path` with inverse) is a ready-made vocabulary for expressing
the first group. But note precisely where the correspondence breaks, because it is
informative:

- SRS's **enforced** set is almost exactly SHACL-expressible — domain/range
  (`allowedSourceTypes`/`allowedTargetTypes` ≈ `sh:class`), irreflexivity, and RFC-022
  `requiresRelation` (≈ `sh:qualifiedMinCount 1` on a directed path).
- Everything SRS **declares and never checks** — transitive closure, cycle detection, global
  cardinality — is precisely what SHACL is also bad at.

**The unenforced rules are unenforced partly because no shape language expresses them
either.** They need graph algorithms, not a schema language. That is a design finding about
where enforcement must live, not an argument for adopting a shape language.

### 3. Federation identity is already solved, differently

Worth recording because it is a place SRS diverges deliberately and correctly. RDF and
property graphs both rely on scoped identifiers (IRIs; instance-local node ids) and both hit
the same wall on cross-store joins — Wikibase's Q/P numbers are the landscape's cited example
of exactly this pain. SRS asserts globally-unique instance UUIDs, so `sourceRepositoryId` /
`targetRepositoryId` are *resolution hints, not disambiguation*, and an unresolvable
reference is a valid citation rather than an error. No graph standard offers this; it comes
from the record layer, not the graph layer.

## Scope note

This document surveys and dispositions. It proposes no adoption, no implementation and no
spec change. The register's Fit axis penalises internal representation changes — which is
why every semantic-web item that scored at all scored as a *projection* — and a
property-graph export is scored on the same basis. A property-graph *adoption* would score
poorly and is not proposed.
