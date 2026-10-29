# Instances

> The instance layer: Notes and Records, formalised below as two tiers of semantic maturity, and how a Record instantiates a Type through typed field values.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Foundations](/agents/foundations.md).

The instance layer: Notes and Records, formalised below as two tiers of semantic maturity, and how a Record instantiates a Type through typed field values.

### Semantic maturity tier

How far a captured instance has been formalised, expressed as a tier and not as a yes-or-no. Tier 0 is a Note: named text sections, no type binding, no field semantics. Tier 2 is a Record: fields bound to a Type, fully semantic. The point of the tier model is that half-formed material is first-class — meaning may be captured before its shape is known and formalised later, instead of being lost because no template fitted it yet. An implementation may support only Tier 2.

**Notes**: The gap at Tier 1 is deliberate. `TypedRecord` was removed as an unexercised construct and the surviving tiers were not renumbered, so existing references stay valid.

#### Graduation

Replacing a lower-tier instance with a higher-tier equivalent once its structure has stabilised, without destroying what came before. The original Note is preserved as the semantic root of whatever it produced, and each resulting Record links back to it. Graduation is not one-to-one: a single meeting Note may become one decision Record, three task Records and two risk Records, each with its own instance id and its own link back.

**Notes**: Which link, and whether the instance id survives, follows what actually happened: pure formalisation may keep the id and needs no link; interpretation during formalisation is a new id with `refines`; a split is new ids with `derived-from` from each new Record.

**Intro**: **Identity continuity** across graduation follows what actually happened to the content, not a fixed rule:

**Outro**: Implementations may automate graduation suggestions by matching section or field names against `Field.name` values in available Type definitions.

| Scenario | `instanceId` | Relation |
| --- | --- | --- |
| Pure formalisation (section names map directly to field names, content unchanged) | Keep | None required |
| Content interpreted or restructured during formalisation | New | `refines` from new to old |
| One Note splits into multiple Records | New IDs for all | `derived-from` from each new Record to the original |



#### Record tiers

SRS supports two semantic maturity tiers, keeping the historical numbering gap at Tier 1 (see Semantic maturity tier). Implementations are not required to support both; they may begin at Tier 2.

| Tier | Type | Structure | Semantics |
|---|---|---|---|
| **0** | `Note` | Named sections + free text | None |
| **2** | `Record` | Fields bound to a `Type` definition | Full |

Graduation path: Note → Record, linked by a `derived-from` Relation from the Record back to the Note (`note graduate`).



### Instance

A piece of captured content, as opposed to a definition that describes a shape. An instance carries its own stable `instanceId` in an id space distinct from the `id` + namespace/name/version lineage that identifies a definition, and it is the thing Relations connect and Containers scope. Confusing the two id spaces is the most common structural error: a Container's id is not an instance id and must never appear on either end of a Relation.

**Notes**: The self-declared `instanceId` inside the file is the identity. It is not derived from the filename or the path, and there is no manifest index to cross-check it against.

#### Relation and Container id constraints

A Relation connects two instance UUIDs, never a definition UUID. A Container scopes a set of instances, never definitions. A Container's own id is a third kind of id: it MUST NOT appear as a Relation's source or target.


#### Note

A Tier 0 instance: a titled set of named free-text sections with no Type binding and therefore no field-level semantics. It exists so that material can be captured at the moment it appears, before anyone knows what shape it should take. A Note has a stable instance id, may carry tags and source references, and may be the target of Relations from the Records it later gave rise to.

**Notes**: Section names must be unique within a Note (Invariant 18). Tags on a Note are keys that may, but need not, resolve to a Term in an open vocabulary.

##### NoteSection.name values must be unique within a Note.

**Number**: 18

`NoteSection.name` values must be unique within a `Note`.


##### `NoteSection`

A named text section within a Note.

See *Generated reference: `NoteSection`* for `NoteSection`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.


##### `Note`

A lightweight instance with no Type binding.

See *Generated reference: `Note`* for `Note`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

`tags` are free-form labels that allow Notes to be grouped and discovered by topic. A tag is a key that *may* resolve to a `Term` in an open `Vocabulary`, giving it a label, aliases, roles, and lineage — without changing the fact that the instance stores only the string (V2). Undefined tags in an open vocabulary are valid and unenriched. Use tags for navigation and filtering; use Relations for semantic claims.



#### Record

A Tier 2 instance: a stable instance id bound to an exact Type version, carrying values for that Type's fields. The binding is by `typeId` and `typeVersion`, and it is authoritative — the denormalised `typeNamespace` and `typeName` are convenience hints, and a Record whose hints disagree with the resolved Type is invalid until corrected. Conformance is measured against the version the Record was instantiated under; publishing a new Type version does not migrate existing Records.

**Notes**: A Record may also carry lifecycle state, tags, source references and timestamps. Those are envelope members, governed by the Record schema and not by the Type's projected field schema.

##### Record.typeId and Record.typeVersion are the authoritative Type…

**Number**: 28

`Record.typeId` and `Record.typeVersion` are the authoritative Type binding. `typeNamespace` and `typeName` are denormalised convenience fields. If they conflict with the resolved `Type`, the `typeId`/`typeVersion` identity takes precedence and the Record is considered invalid until corrected.


##### Field values

A Record's payload is one object keyed by `Field.name` verbatim, with no case or separator transformation at any nesting depth. Each entry is recursively shaped by what the corresponding Field declares: a scalar, an array under list cardinality, or a nested object for an inline composite. There is no wrapper construct around an entry and no entry-object form. Absence of a key is the only representation of an unset field: an explicit null is rejected and the writer must omit the key instead.

**Notes**: Structural presence and rendering presence are deliberately different questions: a key present with an empty string is structurally present but renders as absent.

##### Instance generation is determined structurally

**Number**: I-135

A reader MUST determine instance generation structurally. For a Tier-2 `Record`: an array `fieldValues` is revision <= 1, an object `fieldValues` is revision >= 2. On encountering a generation it does not support, a reader MUST emit a diagnostic naming the file and the expected `dataModelRevision` and MUST NOT coerce, partially read, or silently skip the document. (RFC-039 [R9])


##### fieldMeta keys are a subset of fieldValues keys

**Number**: I-133

`fieldMeta`, when present, MUST be an object whose keys are a subset of the sibling `fieldValues` keys, and whose values are objects of `{source?, editedAt?, sourceRefs?}`. A `fieldMeta` key with no corresponding `fieldValues` key MUST be rejected. `fieldMeta` MUST NOT appear inside an inline-composite value. (RFC-039 [R6])


##### Instance keys serialise in FieldAssignment.order

**Number**: I-141

Instance `fieldValues` keys MUST be serialised in `FieldAssignment.order`, and nested composite objects likewise, so that a re-run of a transform is byte-idempotent and diffs are stable. This is the instance-side counterpart of the schema-key ordering in `projection-rules.md`; it supersedes the write-order signal of rfc-012:139. (RFC-039 [R18])


##### Key absence is the sole representation of an unset field

**Number**: I-132

A `FieldAssignment` with `required: true` means its key MUST be present in `fieldValues`. Key absence is the sole representation of an unset field: a value of `null` MUST be rejected — writers MUST omit the key instead. Structural presence and rendering presence (RFC-001 Step 2, where an empty string resolves as absent) remain distinct and MUST NOT be conflated. (RFC-039 [R5]/[R5a])


##### The projected schema describes the fieldValues object

**Number**: I-140

A Type's projected JSON Schema describes the `fieldValues` object, not the whole Record document. `instanceId`, `typeId`, `tags`, `meta`, `sourceRefs`, and `fieldMeta` are envelope members governed by `record.json`, and are outside the projected schema's `additionalProperties: false`. (RFC-039 [R17])


##### Instance keys are Field.name verbatim

**Number**: I-130

A `fieldValues` key MUST be `Field.name` verbatim, with no case or separator transformation, at every nesting depth. The name projection MUST NOT be applied to instance keys under any circumstances, including for meta-model entities stored as Records. (RFC-039 [R2b])


##### Removed carrier constructs are rejected at dataModelRevision >= 2

**Number**: I-134

`FieldValue`, `FieldValueEntry`, `FieldGroupValue`, `FieldGroupEntry`, `Type.fieldGroups`, and `FieldAssignment.{repeatable, minItems, maxItems}` are removed. An implementation MUST reject a document containing any of them at `dataModelRevision >= 2`. Definition files carry no document-local revision discriminator, so revision MUST be resolved from the enclosing repository or package manifest before this rule is applied to a definition. A manifest at `dataModelRevision >= 2` MUST NOT declare `ext:field-groups` or `ext:repeatable-fields`; a reader encountering such a declaration MUST report an error. (RFC-039 [R7]/[R15])


##### Record fieldValues is a name-keyed object

**Number**: I-129

A Tier-2 `Record`'s `fieldValues` MUST be a JSON object. Each key MUST equal the `Field.name` of a Field in the effective field set of the Record's `typeId`@`typeVersion`. Unknown keys MUST be rejected; the projected schema asserts `additionalProperties: false`. (RFC-039 [R1])


##### The `FieldValue` union

`FieldValue`, in pseudo-IDL:

```typescript
type FieldValue = string | number | boolean
                | FieldValue[]                       // cardinality: list
                | { [key: string]: string | unknown } // datatype: map
                | { [fieldName: string]: FieldValue } // inline composite: a fieldValues object for the rangeType
```


##### Field values (RFC-039)

`FieldValue` — the value stored at one `fieldValues` key — is the recursive union:

Example: the `FieldValue` union.

There is no wrapper construct: the pre-RFC-039 `FieldValue`/`FieldValueEntry` pair
objects, `groupValues`, and `FieldGroup` carriers are removed (I-134).



##### `Record`

An instantiated Type with field values.

See *Generated reference: `Record`* for `Record`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer). This prose no longer hand-duplicates the property list.

`typeNamespace` and `typeName` are denormalised convenience fields. If they conflict with the resolved Type, the `typeId`/`typeVersion` identity takes precedence and the Record is considered invalid until corrected.

**On instance revision:**
- **In-place edits** (`updatedAt` advances, `fieldValues` mutate): for minor corrections that do not alter semantic meaning.
- **Semantic updates**: produce a new Record linked to the prior by a `supersedes` or `refines` Relation. The prior Record remains valid.
- **Immutable records + Relation graph**: all Records append-only; a new Record for every change. A valid implementation strategy that naturally preserves history.

**Semantic meaning must not be silently rewritten.** When a change would alter what a Record means — not merely correct a transcription or formatting error — implementations must produce a successor Record linked to the prior by `supersedes` or `refines`. The prior Record remains valid. What constitutes a semantic change is determined by the Type's intended use; when in doubt, prefer a successor.
