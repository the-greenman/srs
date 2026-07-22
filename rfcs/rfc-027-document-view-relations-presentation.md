> **GitHub issue**: [the-greenman/srs#212](https://github.com/the-greenman/srs/issues/212)

# RFC-027: Per-record relation display in document views (`relationsPresentation`)

**Status**: Draft (Revision 3)
**Affects**: `ext:views-l2` (`DocumentSection`), `document-view.json` schema, `document-view-output.json` schema
**Builds on**: RFC-005 (installed `RelationTypeDefinition`s — `label`, `inverseType`, definition `status`), RFC-008 (heterogeneous container-subset sections), RFC-015 (ordering/presentation layering, Rule [N+28]), RFC-020 (`Type.identityFieldId`, Rules [N+32]–[N+37]), RFC-022 (relational lifecycle / supersession)
**Author**: Peter Brownell (seeded from the-greenman/srs#212)
**Date**: 2026-07-22

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-22 | Initial draft |
| 2 | 2026-07-22 | Review round 1 (Spec Integrity + RFC Completeness; 5 blocking, 10 should-fix). Inverse-label ladder rebuilt on the RFC-005 Rev-7 fact that `inverseType` values are query labels, not installed definitions (humanization rule added); JSON projection shape specified and `document-view-output.json` added to Schema changes + Affects; spec-side display-label ladder for related instances (RFC-020 identity field → section `titleFieldId` → `instanceId`); Tier 0/1 member placement defined; per-format row rule tightened + normative markdown form; definition-`status` interplay (RFC-005) and RFC-026 slice interaction specified; code-point collation; dedupe rules; `label` property made explicitly reserved/ignored; worked example added; I-027-2 split into authoring vs render-time rules; new I-027-8; supersession claims qualified (`directions` opt-in); anchors non-goal recorded; Spec record amendments section added. |
| 3 | 2026-07-22 | Review round 2 (1 blocking, 6 should-fix, 8 nits; all round-1 blockers confirmed resolved). JSON-projection rules scoped to members projectable as `ProjectedRecord` — Tier 0/1 members (which the output schema cannot represent) are outside the JSON projection's `relations` property; RFC-026 rule-9 MAY removed (cut edges simply do not render); rule-5 step 1 restricted to non-empty string values and reworded to effective (declared-or-inherited, [N+34]) identity fields; rule-5 vs [N+37] precedence inversion explained in Rationale; worked example gains its effective-package-set assumption (canonical definitions resolve; governance 1.1.0 updates its package at adoption) and required `order`; dangling [I-027-2] citations fixed ([I-027-2a]/[I-027-2b]); humanization pinned to Unicode default case conversion; [I-027-4] clarified as Relation-`status`-not-lifecycle; [I-027-2a] timing pinned to repository validation; field groups attributed to Tier 2 only; stale revision self-references removed. |

---

## Abstract

Adds one optional property to `DocumentSection` in `ext:views-l2`: `relationsPresentation`. When present, each member rendered by the section is followed by a deterministic links block listing the member's Relations of the declared types — forward edges under a forward label, incoming edges (opt-in via `directions`) under an inverse label. Forward labels default to the installed `RelationTypeDefinition.label`; inverse labels default to a mechanical humanization of the definition's declared `inverseType` query label (RFC-005); either can be overridden per view, keeping phrasing in the presentation layer. This closes the gap where document-view output cannot reflect any relation other than `precedes` ordering and `contains` nesting, and — when a view opts into inverse display for `supersedes` — gives supersession a visible audit trail in rendered documents.

---

## Motivation

### Problem 1 — Relations are invisible in rendered documents

A DocumentView render uses Relations only twice: `precedes` chains impose record order, and `contains` edges nest subsections in structured mode. Every other Relation — `supersedes`, `depends-on`, `refines`, custom types — is absent from the output. A decision log whose decisions are linked with `supersedes` and `depends-on` exports a document in which none of those links appear. The semantic graph is first-class in the repository but invisible in its own rendered projection.

There is no workaround at the package layer. Exhaustively: `DocumentSection` has no relation option; `SectionSource.relation-query` selects records from one *fixed* `fromInstanceId` and cannot express "each record's own links"; L1 `View`/`ExportConfig` has no relation surface; template variables expose only container/date/heading/instance-id/type names. A view author cannot opt into link display because the capability does not exist.

### Problem 2 — Supersession has no rendered audit trail

`ext:lifecycle` and the `supersedes` relation (RFC-022) make record succession first-class: the old record stays, its lifecycle state changes, and a `supersedes` edge points from successor to predecessor. But a rendered document shows none of this — a superseded decision renders identically to an active one except for lifecycle filtering or CSS classes. The audit-trail property ("old decisions are never edited or deleted, only succeeded") is real in the data and invisible in the export. Because `supersedes` is stored successor→predecessor (Invariant 16), surfacing it **on the superseded record** requires displaying incoming edges — which is exactly what `directions: "both"` (or `"inverse"`) declares; see the worked example.

---

## Proposed Changes

### Change A — `DocumentSection.relationsPresentation?: RelationsPresentation`

Add one optional property to `DocumentSection`:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `relationsPresentation` | `RelationsPresentation` | no | When present, render a links block after each member rendered by this section. |

The property applies to every `SectionSource` variant (`fixed-instances`, `type-query`, `relation-query`, `container-subset`) and to every member the section renders, regardless of tier (see Change C rule 2).

**`RelationsPresentation`** (new `$defs` entry in `document-view.json`):

| Property | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `include` | `RelationPresentationEntry[]` | yes, `minItems: 1` | — | Which relation types to display, in display order. |
| `label` | `string` | no | reserved — no rendering behaviour in this RFC | Reserved for a future grouped/headed presentation. Implementations MUST ignore it when rendering under this RFC. |

Two `include` entries sharing the same `relationType` are a validation diagnostic ([I-027-2a]); a renderer encountering them anyway renders each entry independently, as declared ([I-027-2b]).

**`RelationPresentationEntry`** (new `$defs` entry):

| Property | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `relationType` | `string` | yes | — | A relation type key (`supersedes`, or `namespace/name` for custom types). Expected to resolve to an installed `RelationTypeDefinition` (RFC-005); see [I-027-2a]/[I-027-2b]. |
| `directions` | `"forward" \| "inverse" \| "both"` | no | `"forward"` | Which edge directions to display for this member. |
| `forwardLabel` | `string` | no | see Change B | Row label for edges where the member is the **source**. |
| `inverseLabel` | `string` | no | see Change B | Row label for edges where the member is the **target**. |

Only the forward form of a Relation is ever stored (Invariant 16). `directions` controls *display* only: `"inverse"`/`"both"` render incoming edges under an inverse label; they do not imply — and MUST NOT cause implementations to store or synthesise — any inverse edge.

### Change B — Label resolution ladders

**Humanization** (used below) is mechanical and testable: take the key's name segment (the part after the last `/` for namespaced keys, the whole key otherwise), replace every `-` and `_` with a single space, and uppercase the first character using Unicode default (locale-independent) case conversion. No other casing changes. Examples: `superseded-by` → `Superseded by`; `com.example/reviewed-by` → `Reviewed by`.

**Forward row label**, first match wins:

1. `forwardLabel` declared on the entry (view-level override — presentation belongs to the view).
2. The installed `RelationTypeDefinition.label`.
3. Humanization of the relation type key.

**Inverse row label**, first match wins:

1. `inverseLabel` declared on the entry.
2. Humanization of the installed definition's declared `inverseType` value. Per RFC-005 (Rev 7), `inverseType` values such as `superseded-by` are **query labels only**, not installed definitions — this step reads the string and does not require (or attempt) resolution to a definition. Example: `supersedes` declares `inverseType: "superseded-by"` → inverse row label `Superseded by`.
3. The forward-row result with the suffix `" (incoming)"`.

### Change C — Rendering rules

For each member rendered by a section with `relationsPresentation`:

1. **Edge selection.** For each `include` entry, collect stored Relations of that `relationType` where — forward: `sourceInstanceId` = the member; inverse: `targetInstanceId` = the member — as permitted by `directions`. Only edges whose `status` is absent or `"active"` are displayed. When several selected edges of one (entry, direction) connect to the same related instance, that instance renders once in the row.
2. **Placement and tiers.** The links block applies to every rendered member. It renders after the member's rendered content — for Tier 2 Records, after field content and field groups; for Tier 1 TypedRecords, after field content; for Tier 0 Notes, after the note's body content — and before any nested subsection members (structured mode).
3. **Row shape.** One row per (entry, direction) with at least one edge: the resolved label followed by the related instances' display labels, comma-joined. In `markdown` the normative row form is `**<label>**: <display label>, <display label>` on its own line. In `html`, `adoc`, and `text`, the row MUST use the same label/value markup that implementation emits for a field row in that format, with the row label in the label position.
4. **Determinism.** Rows follow `include[]` order; per entry, the forward row precedes the inverse row. Within a row, related instances order by display label ascending, ties by `instanceId` ascending — both comparisons in Unicode code point order.
5. **Related-instance display labels.** Resolve per related instance, first match wins; each step MUST be deterministic:
   1. The instance's value for its effective `identityFieldId` — one in effect for its resolved Type, declared or inherited per RFC-020 [N+34] — when that value resolves to a non-empty string. Non-string values fall through.
   2. The instance's value for the rendering section's `titleFieldId`, when declared and carried as a non-empty string.
   3. The instance's `instanceId`.

   Tier 0 and Tier 1 related instances always fall through to step 3: step 1 applies to Tier 2 only ([N+35]), and Tier 1 field values are name-keyed, so a `titleFieldId` UUID never matches.
6. **Empty behaviour.** When no edge survives selection for a member, no block and no rows are emitted for that member — regardless of the section's `emptyBehavior`.
7. **Failure containment and definition status.** An `include` entry whose `relationType` does not resolve to an installed `RelationTypeDefinition`, resolves only to a `retired` definition, or resolves ambiguously (RFC-005 unresolved conflict) emits a diagnostic and is skipped; entries resolving to `active`, `deprecated`, or `tombstone` definitions display (rendering is a historical read per RFC-005). A selected edge whose related instance cannot be loaded renders the `instanceId` in the row and emits a diagnostic. The render MUST NOT fail on any of these.
8. **JSON projection.** In the JSON projection (`document-view-output.json`), a member that projects as a `ProjectedRecord` and has a non-empty links block carries `relations: ProjectedRelationRow[]`, preserving row order. Each `ProjectedRelationRow` is `{ relationType, direction: "forward" | "inverse", label, targets: [{ instanceId, displayLabel }] }` with `targets` in the rule-4 order. Members with no surviving edges omit the property. Tier 0/1 members — which `ProjectedRecord` cannot represent (its `typeId`/`typeNamespace`/`typeName` are required) — are outside the JSON projection's `relations` property, their links rows with them; their rendered-format blocks (rules 2–3) are unaffected.
9. **Sliced repositories (RFC-026).** In a subset-export slice, cross-boundary Relations are removed from the relations collection and recorded in `slice.externalRelationRefs[]` (RFC-026 R6); such edges therefore do not render — an accepted consequence, since the related instance is outside the slice.

### Worked example — decision log with a supersession audit trail

The governance `decision-deliberation` section, opting in:

```json
{
  "sectionId": "decisions",
  "order": 0,
  "source": { "type": "container-subset", "containerId": "138e2fac-6a8a-4a06-9511-5aefd99ceae9" },
  "title": "Decisions",
  "titleFieldId": "d7e82557-9045-5e92-a494-d99112bbec4a",
  "relationsPresentation": {
    "include": [
      { "relationType": "supersedes", "directions": "both" },
      { "relationType": "depends-on" }
    ]
  }
}
```

The example assumes an effective package set in which the canonical relation-type definitions resolve — `supersedes` with `label: "Supersedes"` and declared `inverseType: "superseded-by"`, and `depends-on` installed — with no conflicting same-key definitions. The governance package as shipped in 1.0.0 declares `supersedes` **without** `inverseType` and does not install `depends-on`; adopting this configuration is part of the package update that accompanies this RFC's adoption (`com.mudemocracy.governance` 1.1.0), which adds `inverseType` to its `supersedes` definition and installs `depends-on`.

Rendered markdown for a superseded decision (`Old mounting rule`) whose successor is `Mounting system`, which in turn depends on `Eye level standard`:

```markdown
### Old mounting rule

**Decision Statement**: …
**Superseded by**: Mounting system

### Mounting system

**Decision Statement**: …
**Supersedes**: Old mounting rule
**Depends on**: Eye level standard
```

(`Supersedes`/`Depends on` from the definitions' `label`s via ladder step 2; `Superseded by` from `supersedes`' declared `inverseType: "superseded-by"` via humanization. One stored edge per link — the successor's forward row and the predecessor's inverse row render the same `supersedes` Relation.)

---

## Conformance Rules

> **[I-027-1]** `relationsPresentation` is optional. A `DocumentSection` without it MUST render exactly as before this RFC.
>
> **[I-027-2a]** (authoring/validation) `relationsPresentation.include` MUST be non-empty. An `include` entry whose `relationType` does not resolve to an installed `RelationTypeDefinition` in the effective package set, and any two entries sharing a `relationType`, are validation diagnostics on the DocumentView. Resolution is checked at repository validation time — when the effective package set is known — not at package-authoring time (mirroring `typeDispatch`'s render/package-validation-time enforcement). `include[]` is a presentation declaration — the RFC-005 resolution requirement on **stored** Relations (V1) is unaffected.
>
> **[I-027-2b]** (render-time) A non-resolving, `retired`-only, or conflict-ambiguous entry MUST produce a render diagnostic and be skipped; entries resolving to `active`, `deprecated`, or `tombstone` definitions MUST display. Duplicate entries render independently as declared. None of these conditions may abort the render.
>
> **[I-027-3]** Only stored forward edges are read. Implementations MUST NOT synthesise, store, or require inverse Relations to satisfy `directions: "inverse"` or `"both"` (Invariant 16).
>
> **[I-027-4]** Only Relations whose `status` is absent or `"active"` are displayed. Relations with `status` `"proposed"`, `"rejected"`, or `"superseded"` MUST NOT be displayed. The filter reads the Relation's own `status`, never the related record's `lifecycleState` — a lifecycle-`superseded` record's active edges display normally (as in the worked example).
>
> **[I-027-5]** Output MUST be deterministic: rows in `include[]` order, forward before inverse per entry; within a row, related instances ordered by display label ascending then `instanceId` ascending, both in Unicode code point order; repeated related instances within one (entry, direction) rendered once.
>
> **[I-027-6]** The links block MUST render after the member's rendered content (fields and field groups for Tier 2; fields for Tier 1; body content for Tier 0) and before any nested subsection members. When no edge survives selection for a member, the block MUST be omitted entirely for that member.
>
> **[I-027-7]** The rendered row label MUST be identical to the Change B ladder result. Related-instance display labels MUST be resolved by the Change C rule-5 ladder.
>
> **[I-027-8]** In the JSON projection, for members that project as `ProjectedRecord`, surviving rows MUST be emitted as `ProjectedRecord.relations` in the Change C rule-8 shape and order; members with no surviving edges MUST omit the property. Tier 0/1 members are outside the JSON projection's `relations` property (rule 8).

---

## Schema changes

| Schema file | Change |
|---|---|
| `document-view.json` | Add optional `relationsPresentation` property to `$defs.DocumentSection`; add `$defs.RelationsPresentation` and `$defs.RelationPresentationEntry`. |
| `document-view-output.json` | Add optional `relations` property (array of `ProjectedRelationRow`) to `$defs.ProjectedRecord`; add `$defs.ProjectedRelationRow` and `$defs.ProjectedRelationTarget`. |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via the release artifact + `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (same release pipeline)

**Compatibility note.** Both `$defs.DocumentSection` and `$defs.ProjectedRecord` declare `additionalProperties: false`, so validators running pre-RFC-027 schemas reject documents/projections that use the new properties until their mirror syncs. This is the standard additive-schema path (as with RFC-011's additions): both properties are optional, no existing document changes meaning, and no migration is required.

---

## Spec record amendments

At integration time (spec-records stage), this RFC lands as:

- Rules [I-027-1], [I-027-2a], [I-027-2b], and [I-027-3]–[I-027-8] as invariant records under the `ext:views-l2` section.
- An amendment to the `ext:views-l2` subsection record (`srs/records/subsections/07-7-ext-views-l2.json`) describing `relationsPresentation`.
- The RFC record itself (`com.semanticops.spec-rfc-process/rfc`, rfc-number 027) with a `supersedes`-free, standalone lineage.

---

## Rationale

- **Presentation lives in the view.** Ordering and phrasing are presentation concerns; RFC-015 [N+28] confines `precedes` to semantic sequence, and the same layering keeps display phrasing out of the relation data model. Hence per-view label overrides (Change B step 1) rather than adding display fields to `RelationTypeDefinition` — while the definition's existing `label` and declared `inverseType` provide mechanical defaults so most views declare nothing beyond `include`.
- **Opt-in per section.** A repository-wide default would change every existing rendered document; scoping to `DocumentSection` means only views that ask for links get them, and different sections of one document can differ.
- **`status` filter is fixed, not configurable.** Displayed links are *current claims*. `proposed` edges are pending suggestions, `rejected`/`superseded` are non-claims; showing them in a corpus export would misrepresent the record. A future RFC can add configurability if a real need appears; starting fixed keeps the initial capability small and its output trustworthy.
- **Link labels prefer the identity field over the section's `titleFieldId`** — the reverse of [N+37]'s precedence for a member's own heading. Deliberate: a related instance need not be a member of the rendering section, so that section's `titleFieldId` is only a heuristic for it, while the effective `identityFieldId` (RFC-020) is a property of the instance's own Type wherever it appears. When a related instance is also a member and the two fields differ, its heading and the link text referencing it can diverge; accepted.
- **Default `directions: "forward"`** mirrors the storage rule (Invariant 16): what you stored is what you see unless the view opts into incoming edges. Inverse display is most valuable for `supersedes` ("Superseded by"), which is exactly where a view author declares `"both"` deliberately — as the worked example does.
- **No intra-document anchors in this revision.** Rows emit plain display labels, not hyperlinks, even when the related record renders in the same document. Anchor-ID schemes are theme- and implementation-specific (no spec-level per-record anchor exists today); emitting unstable anchors would break the determinism guarantee across implementations. A future revision can add anchors once a spec-level record-anchor convention exists.
- **`label` reserved, not rendered.** Field-row-shaped rows are already self-labelling; a block heading adds noise in the common single-row case. Reserving the property keeps the shape stable if grouped presentation is added later without a schema break.

---

## Alternatives Considered

### Alt A — A relations appendix section (new `SectionSource`)

A dedicated section listing all relations in the document. Rejected: it loses per-record locality (the reader wants a decision's links *on the decision*), cannot serve the supersession audit trail on the record itself, and sections render members — an edge list is a different output shape.

### Alt B — Theme/template variable (e.g. `{{relations}}`)

Rejected: themes are wrappers around already-rendered content, with a fixed variable vocabulary; giving templates data access inverts the theme model and makes output format-inconsistent.

### Alt C — Mirror links into record fields

Have tooling write a "related decisions" field alongside each Relation. Rejected outright: it duplicates first-class Relations into field values, creating divergence the validator cannot reconcile, and violates the relation model.

### Alt D — Display fields on `RelationTypeDefinition`

Add `forwardDisplayLabel`/`inverseDisplayLabel` to the definition. Rejected for this revision: presentation belongs to views; the definition's existing `label` + declared `inverseType` already provide mechanical defaults, and per-view overrides handle the rest without touching the substrate schema.

---

## Open Questions

None.
