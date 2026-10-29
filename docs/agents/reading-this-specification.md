# Reading this specification

> This Part addresses two readers: implementers building a conforming SRS system, and the authors and agents who work inside an SRS repository day to day, including this one, since the specification is…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt).

This Part addresses two readers: implementers building a conforming SRS system, and the authors and agents who work inside an SRS repository day to day, including this one, since the specification is itself authored as SRS records. Two facts govern everything that follows. Records are the source of truth: a Field, a Type, a Record, and a Relation are what SRS actually is. Every document derived from them, this rendered specification included, is a projection — useful for reading linearly, never authoritative on its own, and never the place to resolve a disagreement with the records it was generated from.

The nine Parts read front to back, each presupposing what came before it:

- Reading this specification: notation, RFC 2119 keywords, and this reading order
- Foundations: the core entity model a repository is built from — Field, Type, Vocabulary and Term, record tiers, Relation, Container
- Instances: Notes and Records as the two record tiers, and how a Record instantiates a Type
- Structure: how instances connect and order themselves — the Relation model, the contains tree, the precedes chain
- Distribution: how definitions travel between repositories — Package, Reference, Lineage, Provenance
- Presentation: how stored state becomes a document a person reads — projections, Views, Composition
- Extensions: the independently adoptable capability modules a repository may declare
- Conformance: what an implementation must satisfy to claim SRS conformance, and how that claim is declared and checked
- Governance: the specification's own governing rules, built on keeping meaning under its owners' control and portable across tools, implementations, and time, plus the tensions that keep decisions coherent

### Purpose and Scope

#### A core conformance declaration

The form an implementation fills in:

```
SRS Core [+ ext:<name> ...]
```


#### What this specification defines

The Semantic Record System (SRS) specification defines an interoperable standard for semantic field and type definitions, records, relations, and the mechanisms by which these artefacts are created, shared, versioned, and distributed across independent implementations.

This specification covers:

- Field: atomic reusable semantic unit
- Type: named composition of fields for a specific semantic object type
- Record: instantiated type with field values; two semantic maturity tiers (Note, Record)
- Relation: first-class typed link between records
- Container: grouping boundary for record collections
- Distribution: Package, Reference, Lineage, Provenance
- Extensions: optional, independently adoptable capabilities declared by conforming implementations


#### What this specification does not define

- Session: live collaborative process model (future version)
- Registry protocol: how registries communicate, authenticate, or federate; this specification defines data shapes only
- Universal semantic ontology: domain-specific vocabularies are the responsibility of namespace authors


#### Relationship to implementing systems

This specification is implementation-neutral. Implementations are expected to validate inputs against these schemas at their system boundaries. The specification does not constrain persistence technology, API design, UI rendering, or prompt assembly strategy.


#### Extension conformance model

Implementations declare conformance as:

Example: a core conformance declaration.

**Core** requires the Foundation group and Distribution group in full. No extension is required for core conformance. Extensions are independently adoptable; some declare dependencies on other extensions.

Table: the extension identifier and dependency reference.

`ext:protocol` and `ext:addressability` are formally independent but are a functional co-dependency: a Protocol without `AttentionState` produces no live conversation tagging; `AttentionState` without Protocol stages has no stage context to capture. Implementations supporting live conversation tagging should declare both.

**Blueprint is a core package definition**, not a declarable extension. `Blueprint` is included in `Package.blueprints[]` when needed; no `ext:blueprint` declaration is required or defined.

Example declaration: `SRS Core + ext:lifecycle + ext:protocol + ext:views-l1 + ext:addressability`


**Intro**: Start with the question: what does your implementation need to do?

| Need | Extensions |
| --- | --- |
| Define and exchange Field and Type definitions | Core only |
| Track definition origin and imports | `ext:import-tracking` |
| Publish a definition catalog | `ext:registry` |
| Governance with lifecycle states | `ext:lifecycle` |
| Present and export Records | `ext:views-l1` |
| Assemble multi-Record documents | `ext:views-l2` |
| Facilitate structured deliberation | `ext:protocol` |
| Live facilitation with context assembly | `ext:addressability` |
| Extraction from source material | Blueprint (`Package.blueprints[]`) |
| Specialise Types while preserving base processability | `ext:type-inheritance` |
| Lists of values within a Record | Core only — `fieldType` `cardinality: "list"` (RFC-039; `ext:repeatable-fields` retired) |
| Structured repeatable context in a Record | Core only — composite-range Field (`datatype: "ref"`, `mode: "inline"`; RFC-039; `ext:field-groups` retired) |
| Complex conditional validation | `ext:cross-field-validation` |
| Cross-system Relation interoperability | `ext:recommended-relations` |



### Notational conventions

Types are described using TypeScript-style notation. Optional fields are marked with `?`. All `UUID` values are RFC 4122 UUID strings. All `ISO8601` values are datetime strings with timezone offset. `integer` means a positive integer unless otherwise noted.

The keywords MUST, MUST NOT, SHOULD, and MAY in this specification are to be interpreted as described in RFC 2119.

Namespaces are dot-separated identifiers using lowercase alphanumeric characters and hyphens. `core` is reserved for definitions maintained by the SRS standard; implementations MUST NOT allow user-created definitions in the `core` namespace.

Example: Namespace grammar, with namespaces that satisfy it.

Field and Type names are programmatic keys in `snake_case`. Names are stable within a namespace and version lineage; a new name means a new definition.

A specific version of a definition is referenced using the canonical form:

Example: the canonical reference form, with references that satisfy it.

The `/` and `@` characters are reserved separators. They MUST NOT appear within a namespace component or a name.

Version numbers are positive integers scoped to a definition's UUID lineage.

| Change | Version action |
|---|---|
| Documentation, typo, formatting only | Optional bump |
| `description`, `instructions`, or `aiGuidance.purpose` reworded without semantic change | Minor bump recommended |
| `aiGuidance.extraction` or `aiGuidance.purpose` changed in meaning | Version bump required |
| `fieldType` changed (datatype, cardinality, value domain, format, or constraints) | Version bump required |
| `name` changed | New definition required (new UUID) |
| `namespace` changed | New definition required (new UUID) |

When in doubt: if a downstream consumer's AI extraction, validation, or governance logic would behave differently, a version bump is required.

#### Namespace grammar, with namespaces that satisfy it

The grammar, then namespaces that satisfy it:

```
<component>[.<component>]*

component = [a-z0-9][a-z0-9-]*
```

Examples:
```
core
community.adr
com.acme.hr
org.cooperative-name
```


#### The canonical reference form, with references that satisfy it

The form, then references that satisfy it:

```
namespace/name@version
```

Examples:
```
core/decision_statement@2
community.adr/review_rationale@1
com.acme.hr/headcount_impact@3
```
