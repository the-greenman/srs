# SRS Adoptions Proposal
## Lessons from DITA and DOCX

**Status**: proposal  
**Source review**: DITA (OASIS), DOCX (Office Open XML / ISO 29500)  
**Relates to**: `srs-spec.md` v2.0-draft

---

## Summary

| # | Adoption | Source | Priority | Spec change |
|---|---|---|---|---|
| A | `contentFormat` on Field | DOCX | High | Field definition addition — **Invariant 38 (already captured in spec)** |
| B | Annotation threading + supersession | DOCX + feedback | High | ext:annotations addition — Invariants 39–40 |
| C | Type specialization | DITA | High | New ext:type-inheritance — Invariants 41–45 |
| D | Graceful degradation guarantee | DITA | High | Invariant + rationale |
| E | View protection levels | DOCX | Medium | ext:views-l1 addition — Invariant 46 |
| F | Field domains | DITA | Medium | New ext:field-domains — Invariants 47–48 |
| G | Navigational vs semantic relations | DITA | Medium | ext:views-l2 addition — Invariant 49 |
| H | Field transclusion in Document Views | DITA | Medium | ext:views-l2 addition — Invariant 50 |
| I | Track changes visibility pattern | DOCX | Low | Rationale note only |
| J | Conditional processing | DITA | Deferred | Future extension |
| K | Sub-field text selection | DOCX/DITA | Deferred | Awaiting ext:sub-field-addressing |

**Invariant baseline**: the spec currently ends at Invariant 38 (`contentFormat` / `valueType`). Invariants 35–38 cover Distribution (Views L2, Schema, Protocol) and contentFormat — not the annotation schema. This proposal adds Invariants 39–50, including the annotation schema invariants proposed in the `ext:annotations` review (which are not yet in the spec).

**Complexity principle**: each adoption is evaluated against the rule that complexity must pay for itself with interoperability value. Adoptions C and F are the most significant additions; they should be treated as extensions with clear dependency declarations, not folded into core.

---

## High Priority Adoptions

---

### A — `contentFormat` on Field
**Source**: DOCX (rendering distinction between plain text and rich text content)  
**Invariant status**: captured in spec as Invariant 38. Included here for completeness.

The spec defines `valueType: "text"` as "potentially long multi-paragraph prose" but says nothing about whether that prose contains markup. In practice, a rationale field and an admin notes field both have `valueType: "text"` but one expects structured markdown and the other expects plain prose.

```typescript
contentFormat?: "plain" | "markdown"
// Applies only when valueType is "string" or "text". Default: "plain".
// "plain"    — unformatted prose; renderers must not interpret markup
// "markdown" — CommonMark subset; renderers should parse formatting
// Describes the VALUE, not the editing surface (see editorHint).
// AI extractors produce output conforming to this format.
```

**Invariant 38** (already in spec): `Field.contentFormat`, when present, is only meaningful when `valueType` is `"string"` or `"text"`. Implementations must ignore `contentFormat` on fields with other `valueType` values.

---

### B — Annotation threading and supersession
**Source**: DOCX (comment reply chains); feedback on annotation schema

Three issues from the annotation schema review are resolved here together, since they all affect the `ext:annotations` Annotation shape.

---

#### B.1 — Threading

A governance review workflow — expert flags a concern, author responds, expert confirms resolution — is a thread, not a set of independent remarks. Flat annotations cannot represent this faithfully.

```typescript
replyToAnnotationId?: UUID
// When present, this annotation is a reply within a thread.
// The root annotation in a thread has no replyToAnnotationId.
// Thread structure is linear — branching threads are not supported in v1.
// Threading is display-only: all annotations in a thread participate
// equally in context assembly regardless of depth.
```

**Invariant 39**: `Annotation.replyToAnnotationId`, when present, must reference an `Annotation.annotationId` where the referenced annotation has the same `recordId` and `fieldId`. Reply chains must be acyclic.

**Context assembly**: thread structure does not affect assembly priority. All non-excluded annotations in a thread are assembled as peers, ordered by `createdAt`.

---

#### B.2 — Supersession: status mutation vs Relation graph

**The question**: when a reviewer changes their assessment, should the old annotation be superseded via `status: "superseded"` (mutation) or via a `supersedes` Relation from the new annotation to the old (Relation graph, consistent with how Records handle revision)?

The Relation graph path requires `annotationId` to be a valid value in `Relation.sourceInstanceId` or `targetInstanceId`. Currently Invariant 16 restricts Relations to instance IDs — `Note.instanceId`, `Typed Record.instanceId`, `Record.instanceId`. Promoting `annotationId` to the instance tier would mean Annotations inherit the full instance contract: Container membership, graduation, tier semantics, Relation graph traversal.

**Decision: status mutation + forward reference. Annotations are not promoted to the instance tier.**

Rationale: SRS Principle 6 — "historical semantic state has permanent value" — applies to semantic state. Annotations are quality signals attached to semantic state, not semantic state themselves. A reviewer revising their assessment is not the same category of event as a group superseding a decision. Promoting Annotations to the full instance tier imposes a contract (Container membership, tier graduation, full graph participation) that they don't need and that complicates the model without corresponding interoperability benefit.

The status mutation approach preserves the historical chain (the old annotation is never deleted), makes the supersession explicit (via `supersedingAnnotationFor`), and keeps Annotations out of the Relation graph.

**Updated Annotation schema additions:**

```typescript
status?: "active" | "resolved" | "superseded"
// "active"     — default when absent; annotation is current
// "resolved"   — the concern or assessment has been addressed;
//                retained in chain for audit
// "superseded" — this annotation has been replaced by a newer one;
//                supersedingAnnotationId identifies the replacement

supersedingAnnotationFor?: UUID
// When present on a NEW annotation, declares that this annotation
// replaces the referenced annotation.
// The referenced annotation's status must be set to "superseded"
// as part of the same operation.
// Only one active annotation may exist as the replacement for
// a given superseded annotation.
```

**Invariant 40** (new): `Annotation.supersedingAnnotationFor`, when present, must reference an `Annotation.annotationId` where the referenced annotation has the same `recordId` and `fieldId`. The referenced annotation's `status` must be `"superseded"`. Supersession chains must be acyclic.

**What this means for the instance tier boundary:**

The spec should add an explicit statement to the Section 4 (Foundation Group) preamble:

> `Annotation.annotationId` is not an instance ID in the SRS sense. It must not appear in `Relation.sourceInstanceId`, `Relation.targetInstanceId`, `Container.rootInstanceIds`, or `Container.memberInstanceIds`. Annotation supersession is handled by `status: "superseded"` and `supersedingAnnotationFor`, not by the Relation graph.

This makes the boundary explicit rather than implied by the existing invariants.

---

#### B.3 — Where the interaction section lives

The feedback identifies a missing structural element: the spec has no formal home for cross-extension interaction contracts. The ext:annotations × ext:addressability context assembly contract is one example; ext:protocol × ext:addressability (Protocol stage advancing AttentionState) is another already implicit in the non-normative example.

**Decision: add Section 8.5 "Extension Interactions" to the spec.**

Rationale: as the extension library grows, pairwise interactions accumulate. Appending each interaction to the extension that happens to be listed second is unmaintainable — an implementer declaring both extensions has to know to look in the second one's section. A dedicated Section 8.5 is the right home: it is findable, grows cleanly, and signals explicitly that cross-extension interactions are a first-class spec concern.

See the proposed Section 8.5 content at the end of this document.

---

### C — Type specialization
**Source**: DITA (specialization / inheritance model — the "Darwin" in DITA)

This is the most significant architectural gap in the current spec. There is no formal mechanism for declaring that one Type inherits the fields and semantics of another. A `GovernanceDecision` that adds `ratification_method` and `quorum_threshold` to a base `Decision` must currently either duplicate all Decision fields or create an entirely new Type with no declared relationship to the base.

DITA's specialization model has been in production for twenty years. The key properties that make it work:
- A specialization inherits all fields from the base Type
- It may add new fields; it may not remove base fields
- It is formally processable as the base Type by systems that don't know the specialization
- The inheritance chain is acyclic and traceable

**New extension: `ext:type-inheritance`**

**Additions to `Type`:**

```typescript
extendsTypeId?: UUID
// The UUID of the base Type this Type specializes.
// When present, this Type's effective field list consists of:
//   1. All fields from the base Type (in base Type field order)
//   2. This Type's own fields[] (declared in this definition)
// Field UUIDs declared in fields[] must not duplicate any fieldId
// inherited from the base Type.

extendsTypeVersion?: integer
// The version of the base Type at the time this specialization was created.
// A version bump on the specializing Type is required when the base Type
// changes in ways that affect the specialization's semantics.

fieldOrder?: UUID[]
// Optional explicit ordering of ALL fields in the effective field list —
// both inherited and own. When present, this array defines the display and
// processing order for all fields in this Type.
// Must contain exactly the same set of UUIDs as the effective field list.
// Does not re-declare field assignments — purely an ordering declaration.
// Exempt from Invariant 42 (which governs fields[], not fieldOrder[]).
// When absent, inherited fields appear first (base Type order),
// followed by this Type's own fields[].

fieldAssignmentOverrides?: FieldAssignmentOverride[]
// Per-field presentation overrides for inherited fields.
// May only reference fieldIds inherited from the base Type or ancestors.
// Must not reference fieldIds declared in this Type's own fields[].
// Must not override aiGuidance, valueType, validationRules,
// or any semantic property — presentation only.
```

```typescript
FieldAssignmentOverride {
  fieldId: UUID           // must reference an inherited field
  displayLabel?: string   // override for this specialization context only
  displayHint?: string    // override for this specialization context only
  required?: boolean      // tightening only — may set true where base is false
                          // may not set false where base is true (Invariant 44)
}
```

**New invariants:**

**41.** `Type.extendsTypeId`, when present, must reference a valid `Type.id`. Inheritance chains must be acyclic — a Type may not directly or transitively extend itself.

**42.** A specializing Type must not declare a `fieldId` in `fields[]` that duplicates any `fieldId` inherited from its base Type or any ancestor Type.

**43.** When `Type.fieldOrder` is present, it must contain exactly the set of field UUIDs in the effective field list — the union of inherited fields, own `fields[]`, and domain-sourced fields from `includesDomains[]` (when `ext:field-domains` is declared). No UUID may appear more than once. No UUID may be absent that is in the effective field list.

**44.** Every `fieldId` in `Type.fieldAssignmentOverrides[]` must reference a field inherited from the base Type or an ancestor Type. It must not reference a `fieldId` declared in this Type's own `fields[]`. Setting `required: true` on a field whose base declaration has `required: false` is permitted (tightening). Setting `required: false` on a field whose base declaration has `required: true` is a conformance error (relaxation via inheritance is not permitted), because a Record instantiated against the specializing Type must remain valid when processed as the base Type.

**45.** When `ext:type-inheritance` is declared, `Package.dependencyRefs` must include a `Reference` for every Type in the **transitive closure** of base Types for any Type in `Package.types[]`. If Type A extends Type B and Type B extends Type C, a Package containing Type A must include References for both Type B and Type C. If `mode === "bundled"`, all Types in the transitive closure must be present in `types[]`.

**Graceful degradation** (see also Adoption D): a Record instantiated against a specializing Type must be processable as a Record against its base Type. Systems that know the base Type but not the specialization can read the inherited fields correctly. This is the interoperability guarantee that justifies the added complexity.

**μDemocracy example:**

```
Type: decision (core)
  fields: decision_statement, context, rationale, options_considered

    ↑ extendsTypeId
Type: org.mu-democracy/governance_decision
  inherits: decision
  adds: ratification_method, quorum_threshold, voting_record

    ↑ extendsTypeId
Type: org.mu-democracy/constitutional_decision
  inherits: governance_decision
  adds: amendment_procedure, supermajority_threshold
```

A system that knows `decision` can read a `constitutional_decision` Record — it sees `decision_statement`, `context`, `rationale`, `options_considered`. The specialised fields are not visible to it, but no data is corrupted.

---

### D — Graceful degradation guarantee
**Source**: DITA (processability of specializations as base types)

This is a documentation and invariant addition that accompanies Adoption C but is stated separately because it applies more broadly than type inheritance.

**Addition to rationale (`srs-rationale.md`):**

> **Graceful degradation**: a conforming implementation encountering a Type, Record, or Annotation with unknown extension fields should preserve and pass through those fields rather than rejecting the record. Implementations should validate what they know and surface unknown extension content (see Interoperability note, Section 9) rather than failing. This principle — understand what you can, pass through what you can't — is what makes the extension model useful in a federated ecosystem.

**Specific application to `ext:type-inheritance`**:

> When a Record is instantiated against a specializing Type and received by a system that knows only the base Type, the system must be able to read the base Type's fields correctly. The specialised fields are unknown extension content and should be preserved in `meta` or a designated extension namespace rather than discarded.

---

## Medium Priority Adoptions

---

### E — View protection levels
**Source**: DOCX (document protection modes: read-only, comments-only, form-filling)

DOCX's protection model distinguishes meaningfully between "this document is final" (read-only) and "this document accepts comments but not edits" (comments-only). SRS currently handles lock state via `meta` with no formal vocabulary. The `isFinal` lifecycle state signals settlement but does not constrain what operations are permitted through a View.

**Addition to `View` (ext:views-l1):**

```typescript
protection?: "none" | "read-only" | "comments-only" | "fill-in"
// Default: "none" — no restrictions applied by this View.
//
// "read-only"     — Records rendered through this View cannot be edited.
//                   Implementations must not surface edit affordances.
//
// "comments-only" — Field values are locked. Annotations are permitted
//                   (requires ext:annotations to be declared).
//                   Maps to governance review state: content settled,
//                   commentary open.
//
// "fill-in"       — Only fields with null/empty values may be populated.
//                   Fields with existing values are locked.
//                   Maps to form-completion workflows where prior
//                   content must not be overwritten.
//
// Protection is a View-level constraint. It does not modify the Record.
// A Record may be editable through one View and read-only through another.
// For record-level settlement, use ext:lifecycle isFinal states.
```

**New invariant (46)**:
When `View.protection === "comments-only"`, the implementation must have declared `ext:annotations`. A View declaring `comments-only` protection without `ext:annotations` is a conformance error.

**Relationship to lifecycle**: View protection is a *presentation constraint*; lifecycle `isFinal` is a *semantic declaration*. A record can have `isFinal: true` in its lifecycle and still be readable through an unprotected View for archival display. A record can be protected through a specific View even before reaching a final lifecycle state (e.g., protecting a draft shared for comment before approval).

---

### F — Field domains
**Source**: DITA (domain element sets that travel together as coherent groups)

DITA domains are named sets of elements designed to be included together in topic types. A "governance domain" defines the fields that characterise governance records and can be included as a group in any governance-related Type. This avoids re-declaring the same set of fields individually across multiple Types.

**New extension: `ext:field-domains`**

```typescript
FieldDomain {
  id: UUID
  namespace: string
  name: string          // snake_case programmatic key
  version: integer      // min: 1

  description: string   // what semantic concern this domain addresses
                        // e.g. "Fields common to all governance decisions"

  fields: FieldRef[]    // the Fields that constitute this domain;
                        // must reference independently defined Fields

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}

FieldDomainRef {
  domainId: UUID
  domainVersion?: integer
}
```

**Addition to `Type` (when ext:field-domains is declared):**

```typescript
includesDomains?: FieldDomainRef[]
// Named sets of Fields included as a group.
// Domain Fields appear in the Type's effective field list after
// explicitly declared fields[], in domain declaration order.
// Domain field UUIDs must not duplicate any fieldId in fields[]
// or in any other included domain.
```

**Addition to `Package` (when ext:field-domains is declared):**

```typescript
fieldDomains?: FieldDomain[]
```

**New invariants:**

**47.** A `FieldDomainRef.domainId` referenced in `Type.includesDomains[]` must appear in `Package.dependencyRefs`. If `mode === "bundled"`, the `FieldDomain` must be present in `Package.fieldDomains[]`.

**48.** Field UUIDs within a `FieldDomain.fields[]` must not duplicate each other. A Field may appear in multiple domains.

**μDemocracy example:**

```
FieldDomain: org.mu-democracy/governance_provenance
  fields: ratification_method, quorum_threshold, facilitator_id, session_date

FieldDomain: org.mu-democracy/deliberation_context  
  fields: context_summary, constraints, stakeholders_considered

Type: governance_decision
  fields: [decision_statement, rationale, options_considered]
  includesDomains: [governance_provenance, deliberation_context]
  // effective fields: decision_statement, rationale, options_considered,
  //                   ratification_method, quorum_threshold, facilitator_id,
  //                   session_date, context_summary, constraints,
  //                   stakeholders_considered
```

**Interaction with ext:type-inheritance**: domain fields are treated as part of the declaring Type's own fields for inheritance purposes. A specializing Type inherits both the explicit fields and the domain-sourced fields from its base Type.

---

### G — Navigational vs semantic relations
**Source**: DITA (relationship tables — relations declared at map level, not topic level)

DITA's relationship tables revealed an important distinction that SRS currently conflates. There are two kinds of inter-Record links:

**Semantic Relations** (current SRS `Relation`): assertions about the meaning of the relationship between Records. "D-004 supersedes D-001." "Stage A contains Task B." These are facts about the Records themselves. They belong on the Records. They are permanent.

**Navigational links**: assembly-time declarations about how sections of a document relate for reader navigation. "The Founding Principles section links to the Decision Log section." This is not a fact about the Records in those sections — it is a reading-aid declared by the document template.

Conflating these by requiring a semantic `Relation` between Records in order to create a navigational link in a Document View overloads the relation graph with presentation concerns.

**Addition to `DocumentView` (ext:views-l2):**

```typescript
navigationLinks?: NavigationLink[]
// Assembly-time declarations of cross-section navigation.
// These are reading aids for the rendered document, not semantic
// assertions about Records.
// They do not appear in the Relation graph.

NavigationLink {
  fromSectionId: string   // references DocumentSection.sectionId in this DocumentView
  toSectionId: string     // references DocumentSection.sectionId in this DocumentView
  label?: string          // human-readable link text
  bidirectional?: boolean // default: false
}
```

**New invariant (49)**:
Every `NavigationLink.fromSectionId` and `NavigationLink.toSectionId` must reference a `sectionId` declared in the enclosing `DocumentView.sections[]`.

**When to use which**:

| Need | Use |
|---|---|
| "D-004 replaced D-001" | `Relation` with `relationType: "supersedes"` |
| "This task depends on that task" | `Relation` with `relationType: "depends-on"` |
| "See also: the Principles section" | `NavigationLink` in `DocumentView` |
| "This document's intro links to the appendix" | `NavigationLink` in `DocumentView` |

---

### H — Field transclusion in Document Views
**Source**: DITA (`conref` — pulling specific content from another topic inline)

DITA's `conref` mechanism allows pulling the content of a specific element from another file inline into the current document. The value is maintained once, referenced many times.

For SRS Document Views, SectionSource already handles including whole Records in sections. But there is no mechanism for including the *value of a specific field from a specific Record* inline within a preamble or section description — for example, including the group's stated Purpose verbatim in the document header rather than as a separate section.

**Extension to variable substitution syntax** (ext:views-l2):

{% raw %}The existing preamble variable system (`{{container-title}}`, `{{date}}`, `{{container-id}}`) is extended with field transclusion:

```
{{field:{recordId}/{fieldId}}}
```

Resolves to the current `FieldValue.value` for the specified field in the specified Record at render time.

**Addition to `DocumentView`** (not `ExportConfig` — `ExportConfig` is on `View` in ext:views-l1 and does not apply to `DocumentView`):

```typescript
transclusionFallback?: "empty" | "placeholder" | "error"
// Behaviour when a {{field:...}} variable in any preamble, section title,
// or section description cannot be resolved.
// "empty"       — substitute empty string (default)
// "placeholder" — substitute the field's description or a generic notice
// "error"       — treat unresolvable transclusion as a render error
```

**New invariant (50)**:
`{{field:{recordId}/{fieldId}}}` syntax in `DocumentView.preamble`, `DocumentSection.title`, or `DocumentSection.description` is a render-time variable. Implementations declaring `ext:views-l2` must resolve this syntax at render time. Unresolvable transclusions behave according to `DocumentView.transclusionFallback`.

**Example**:

```
preamble: |
  # Founding Document
  ## {{container-title}}
  
  Our purpose: {{field:rec-purpose-001/fld-statement}}
  
  Ratified on: {{date}}
```
{% endraw %}

---

## Low Priority — Rationale Only

---

### I — Track changes visibility pattern
**Source**: DOCX (track changes with visible deletions, "all markup" view)

DOCX keeps deleted content visible until explicitly accepted, enabling reviewers to see not just what the current content is but what was removed and by whom. For governance documents, removed content can be as significant as added content.

This is a rendering pattern, not a data shape change. `ext:addressability` already provides Revision records with full field history. The missing piece is a recommended rendering pattern.

**Addition to rationale (`srs-rationale.md`)**, section on `ext:addressability`:

> **Diff rendering**: implementations rendering Revision history for governance review should support a diff view that shows field-level removals alongside additions, not only the current value. A Revision chain for a governance field should be renderable in three modes, analogous to DOCX track changes:
> - *Final* — current value only
> - *All markup* — current value with prior content shown as removed, new content as added, per Revision
> - *Original* — the value as at a specified Revision
>
> The Revision chain already provides the data; this guidance ensures implementations expose it in governance-appropriate form.

No schema change required. This is implementation guidance.

---

## Deferred

---

### J — Conditional processing
**Source**: DITA (`@audience`, `@platform`, `@product` filtering)

DITA allows marking content with conditions and filtering it for different audiences or outputs. The same source produces different publications. This would allow a Document View to render differently for full membership (including deliberation history) versus external stakeholders (summary only).

**Why deferred**: SectionSource queries (`lifecycleState` filter, `container-subset`) already handle the most common cases. Full conditional processing requires a condition evaluation model that adds significant complexity. The DITA warning is relevant: DITA's branch filtering (conditional processing at map level) is one of its most complex and least well-supported features. Defer until a concrete use case demands it.

**Placeholder**: a `conditions?: Record<string, string>` field on `DocumentSection` is reserved but not specified. Implementations must not use this field until the conditional processing extension is defined.

---

### K — Sub-field text selection
**Source**: DOCX (comment text anchors), DITA (element-level `conref` precision)

Both DITA and DOCX support anchoring annotations and references to specific text within an element. SRS Annotations have `meta` for forward-compatible storage. `ext:addressability` documents that sub-field text selection is a future extension.

No change to current deferred status. This requires a dedicated design pass on text selector semantics before standardisation.

---

---

## Proposed Section 8.5 — Extension Interactions

Cross-extension interactions are behavioural requirements that emerge when two extensions are declared together. They cannot be assigned to either extension alone. This section is the formal home for all such contracts.

**Format**: each entry declares the pair, the trigger condition, and the required behaviour.

---

### ext:annotations × ext:addressability

**Trigger**: an implementation declares both `ext:annotations` and `ext:addressability`.

**Required behaviour**: the Context Query for a field (`{recordId}/{fieldId}`) must include an annotation assembly step. Retrieve all Annotations where `recordId` and `fieldId` match and `excludeFromAssembly !== true`. Assemble in the following priority order:

1. Field-scoped annotations (non-null `fieldId`) matching the queried field — ordered by `createdAt`
2. Whole-record annotations (null `fieldId`) for the queried Record — ordered by `createdAt`

Thread replies are assembled as peers of their root annotations. Superseded annotations (`status: "superseded"`) are excluded.

**Assembly position**: annotations fall between Revision history and conversation chunks tagged via AttentionState:

```
1. Type and Field aiGuidance
2. Current value and Revision history          ← ext:addressability
3. Active annotations on this Field            ← ext:annotations × ext:addressability
4. Active whole-record annotations             ← ext:annotations × ext:addressability
5. Chunks tagged to this Field via AttentionState
6. Chunks tagged to parent Record
7. Related Records via Relations
```

Steps 3 and 4 are absent when either extension is not declared.

---

### ext:protocol × ext:addressability

**Trigger**: an implementation declares both `ext:protocol` and `ext:addressability`.

**Required behaviour**: Protocol stage advancement must update `AttentionState`. When a Protocol run advances from one stage to another, the active `AttentionState` must reflect the new stage before any conversation material is tagged. Specifically:

- `AttentionState.protocolRunId` must reference the active Protocol run
- `AttentionState.stageId` must reflect the current stage
- `AttentionState.fieldId`, when a specific field is the current focus within a stage, must be set accordingly

Conversation chunks produced while `AttentionState.stageId` is set are permanently associated with that stage. This is the mechanism that makes stage-level Context Queries (`{runId}/{stageId}`) return the correct material.

The non-normative Protocol chain example in `ext:protocol` illustrates this behaviour. This section is the normative statement of the same contract.

---

*Further interactions will be added here as extensions accumulate. The pattern: two extension identifiers, a trigger condition, and required behaviour stated as a behavioural requirement.*

---

## Open Questions

**1. ~~Package bundling for multi-level inheritance chains~~** — Resolved as Invariant 45.

The transitive closure rule answers this: `Package.dependencyRefs` must include every Type in the full transitive closure of base Types for any Type in `types[]`. This is Invariant 45 and requires no further open question. The rationale should include a worked example (A extends B extends C) to make the implementation expectation clear.

**2. Field domain versioning and base Type migration**

If a `FieldDomain` version is bumped (a new field is added to `governance_provenance`), Types pinned to `governance_provenance@1` are insulated. Guidance is needed on when a Type should update its domain version reference versus staying pinned. Mirrors existing guidance on Record/Type version migration but at the definition level.

**3. Protection levels and ext:lifecycle interaction**

`View.protection: "read-only"` and `Type.lifecycle.isFinal` both signal settlement. The relationship should be explicit in the rationale: `isFinal` is a semantic declaration; `protection: "read-only"` is a presentation constraint. They are independently settable. The common combined usage (isFinal + read-only protection) should be documented.

**4. Section 8.5 scope boundary**

As interactions accumulate, the question of what qualifies as a "Section 8.5 interaction" versus an extension-internal behaviour note needs a working definition. Proposed test: if the behaviour requires both extensions to be declared AND cannot be inferred from either extension's definition alone, it belongs in Section 8.5. If the behaviour is conditional on another extension but can be fully specified within one extension's section, it stays there with a conditional note.

**5. `fieldAssignmentOverrides` and ext:views-l1 interaction**

`FieldView.displayLabel` in ext:views-l1 already allows display label overrides at the View level. `FieldAssignmentOverride.displayLabel` in ext:type-inheritance allows the same at the Type specialization level. The precedence rule needs stating: View-level overrides take precedence over Type-level overrides, which take precedence over the base Field definition. This is probably a Section 8.5 entry for ext:type-inheritance × ext:views-l1.

---

## Complexity Budget

These adoptions add two new extensions (`ext:type-inheritance`, `ext:field-domains`), add fields to three existing extensions (`ext:views-l1`, `ext:views-l2`, `ext:annotations`), add one Field-level addition to core, and add a new structural section (Section 8.5) to the spec. The proposal adds Invariants 39–50 (12 invariants).

Against the complexity principle: every addition addresses a documented gap with a concrete use case. Type specialization (C) enables the μDemocracy Protocol and Type library to grow without duplicating field definitions. `fieldOrder` and `fieldAssignmentOverrides` solve the real gaps that `overrideFieldOrder` falsely appeared to solve. Field domains (F) enable coherent grouping of governance-specific fields. Annotation threading and supersession (B) enable the review workflow to be legible and auditable. View protection (E) enables formal read-only governance records. Section 8.5 resolves the interaction contract problem before it becomes a source of implementation divergence.

The DITA warning is worth restating: DITA's specialization model is powerful and in practice underused because tooling cost is high. `ext:type-inheritance` should be designed to work well at one level of inheritance with a handful of added fields — that is the common case. `fieldOrder` and `fieldAssignmentOverrides` are available for edge cases; they should not be the default path.
