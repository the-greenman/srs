# Relation type definition

> What an edge's type string means, installed as its own entity: the key as stored on an edge, a required label and description, a structural category, which end is source and which is target, the key …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

What an edge's type string means, installed as its own entity: the key as stored on an edge, a required label and description, a structural category, which end is source and which is target, the key of its display-only inverse, and optional constraints such as irreflexivity. Relation types form a single flat, repository-global set with no per-Type scoping, and a relation whose type does not resolve in it is a validation error.

**Notes**: It is a vocabulary-substrate specialisation that tightens label and description from optional to required. The canonical seven ship as installed definitions in the core package; custom types use `namespace/name` form and supply their own.

## sourceRole vocabulary MUST be disjoint from installed RelationTypeDefinition keys

**Number**: I-88

The `sourceRole` value set — the closed enum of the implemented schema revision, including values added by later accepted RFCs — MUST be disjoint under literal whole-key equality from the set of installed `RelationTypeDefinition` keys in the repository's effective package set. Relation-type creation MUST reject a definition whose key equals a `sourceRole` value; `repo validate` MUST report a pre-existing collision as `SOURCEROLE_RELATIONTYPE_COLLISION` (warning at rest). A namespaced key (e.g. `com.acme/evidence`) does not collide with a bare `sourceRole` value.


## ext:recommended-relations

Retired as of RFC-005 (compatibility label only); the canonical relation vocabulary is the set of installed `RelationTypeDefinition` records (see Relation type definition).


## `RelationTypeDefinition` as a VocabularyEntry specialisation (RFC-006)

`RelationTypeDefinition` satisfies the `VocabularyEntry` substrate contract. As of RFC-006, its key-role field is renamed from `relationType` to `key`. Instance-side reference fields (`Relation.relationType`) are unchanged.

It gains `meta?: Record<string, unknown>` under the one forward-compatibility policy: unknown top-level fields are rejected; arbitrary entry metadata goes in `meta`.

It **requires** both `label` and `description` (unchanged from RFC-005). The substrate making these optional in the general contract does not relax this obligation.

The V1 mandatory resolution requirement (every `Relation.relationType` must resolve to an installed `RelationTypeDefinition`) is a named instance of the general closed-vocabulary resolution rule. See the Conformance concept, and the Vocabulary and Term concepts in Foundations.


## `RelationTypeDefinition`

A substrate specialisation that gives semantic meaning and validation rules to a class of relations. `key` is the string stored in `Relation.relationType`; this unifies the key-role field across all three substrate specialisations (RFC-006). `label` and `description` are tightened to required.

See *Generated reference: `RelationTypeDefinition`* for `RelationTypeDefinition`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#541, the #274 ratified ledger extended to this entity). This prose no longer hand-duplicates the property list.

Relation type definitions live in `package.relationTypes[]` (distributable bundle) or `package/relation-types/` (repository layout). They are resolved repo-globally — all installed relation type definitions form a single flat namespace. Key uniqueness (V5) applies across this flat set.
