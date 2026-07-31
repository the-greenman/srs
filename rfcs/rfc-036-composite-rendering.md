> **GitHub issue**: [the-greenman/srs#292](https://github.com/the-greenman/srs/issues/292) · delivers Task #262 under epic #256

# RFC-036: Composite rendering — view-owned renderer dispatch for composite-range fields

**Status**: Accepted (Revision 5)
**Affects**: `ext:views-l1` (`FieldView`, Invariant 13), `ext:views-l2` (`DocumentView`, `DocumentSection`), `ext:themes-l1` (`ElementTemplates`); supersedes **in part**, for composite-range fields only, RFC-007's `FieldGroup.compositeRenderer`; `docs/schema/2.0/{view,document-view,theme}.json`; description-only touch to `docs/schema/2.0/type.json`.
**Builds on**: RFC-032 (Accepted Rev 6 — composite range), RFC-007 (Accepted Rev 5 — superseded in part), RFC-015 (Accepted — presentation is view-owned), RFC-008 (Accepted — `typeDispatch`), RFC-027 (Accepted — the `DocumentSection` presentation precedent), RFC-002 (Accepted — Theme resolution `[T-2]`), RFC-009 (Accepted — `ExactTypeRef`), RFC-033 (Accepted — the frozen bootstrap seed).
**Author**: Claude Code (agent), on behalf of the repository owner
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft |
| 2 | 2026-07-31 | Address Rev 1 review findings (8 blocking). Define composite baseline rendering normatively (new Change C) — it was the undefined fallback target of five MUST rules. Give `FieldGroup.label` a successor (`FieldAssignment.displayLabel`), without which the parity gate could not pass. Restate every RFC-007 per-format default in [CR-036-16] and make them apply without `ext:themes-l1`, which muSrs does not declare. Pad-only, never truncate — Rev 1's truncation destroyed record content. Strike the RFC-019 `CrossFieldRule` suggestion: `CrossFieldRule.type` is a closed enum with no arity predicate. Give the [CR-036-1] identifier regex and make every schema constraint well-formedness-only, so no runtime-fallback rule is pre-empted by a load failure (drops the `propertyNames` and `editorHintOverride` enum narrowings). Add the `DocumentSection` tier and a `"baseline"` unbind sentinel, per RFC-027's placement precedent. Add the diagnostic contract, the RFC-007 → RFC-036 rule mapping table, the theme-key and `FieldAssignment`-facet migration steps, tier and nesting scope, role-ambiguity tie-break, contract-matching semantics. Correct four misquotations, the `[R10]`-on-`ref` error, and the `section.commentary` row-Type claim; downgrade the byte-identical claim and enumerate all divergences. Rule IDs scoped `[CR-036-n]`. |
| 3 | 2026-07-31 | Address Rev 2 review findings (3 blocking). Drop the false "no Theme in play" premise: muSrs under-declares `ext:themes-l1` in its manifest while wiring both themes through `themeRef`, so [CR-036-16]'s theme-independence clause now rests on `[T-Cx*]` retirement and RFC-002 `[T-2]` instead, and the manifest defect goes to #242. Reconcile [CR-036-9] and [CR-036-13], which gave opposite answers for a `widths` Field omitting `constraints`: a required `constraints` key is advisory and never fails the contract test. Match the reference implementation on the baseline empty-field rule (omit unconditionally) rather than deferring to an `ExportConfig` that the baseline path never has. Require the composite label heading on the **bound** path too ([CR-036-12], [CR-036-15]) — naming the successor was not enough to save the parity gate. Make `rangeType` presence-matched, since a binding site has no literal value to match. Parameterise Change C's heading by nesting depth and specify nested-composite expansion. Add the zero-effective-column skip, non-HTML format routing, `{{subheading}}`/`{{label}}` token resolution, and a fourth `table` divergence (`captionTemplate`'s three-way split). Split the presentation guarantee across Invariant 1 and Invariant 13 rather than piling `FieldAssignment` facets onto the FieldView invariant, and add `ext-field-groups.json` to the amendments. Attribute the `FieldGroup.label` heading to the reference implementation, not RFC-007; correct the Problem 4 framing (RFC-007 already said its defaults apply without `ext:themes-l1`); relabel three mapping rows as broadened; correct "the trio `[R4]` deletes" to Change H deprecates. Disclose the one non-additive schema change. New Open Question 3 on the undefined default field-row form. |
| 4 | 2026-07-31 | Address Rev 3 review findings (1 blocking, found independently by both reviewers). [CR-036-16] said the `subheading` renders one level below the composite's heading while its own worked example said `<h4>`, i.e. the same level — the rule contradicted its example, and "plus one" would have moved 2 of the 30 muSrs table entries from `####` to `#####`, adding a fifth *observable* divergence that Change D and the parity gate both denied. Resolved by matching the reference implementation (same level), with the resulting label/subheading collision recorded as a deliberately preserved anomaly. Three accuracy fixes where Rev 3's own corrections had not propagated: the Rationale still argued from the retracted "no Theme in play" premise; [CR-036-20] was still headed "Amends Invariant 13" while listing a `FieldAssignment` facet, and omitted `FieldAssignment.displayHint`; Open Question 2 justified its urgency on muSrs, whose themes in fact cover every `items` row — the real dependency is #242's spec-side fixture. Softened Change D's absolute "no divergence" claim on the baseline path to three named inert differences (a `fieldRow` rung the reference omits, the `fieldId` tie-break, per-format separation). Scoped Change C's heading clamp to heading-bearing formats. |
| 5 | 2026-07-31 | Accepted after three review rounds with zero surviving blocking findings. Spec records authored in `srs/srs/`: `ext-views-l1` (the binding, the composite baseline, the `table` roles, `[CR-036-1]`–`[CR-036-9]`, `[CR-036-21]`, `[CR-036-22]`), `ext-views-l2` (the section and document directives), `ext-themes-l1` (`compositeFieldRowTemplates`, `[CR-036-16]`–`[CR-036-19]`), `ext-field-groups` (supersession note), and the Invariant 1 / Invariant 13 amendments. Schema changes applied to `view.json`, `document-view.json`, `theme.json` and a description-only touch to `type.json`. |
| 6 | 2026-07-31 | Correct Open Question 3 after researching it properly. Its named home was wrong: `com.semanticops.srs/metamodel` is generator-owned and CI-gated (`gen-metamodel-package.mjs --check`) and derivation-scoped to `field.json`/`type.json` properties, so a table row has no antecedent there and cannot be hand-added — a canonical Row needs a new distributable package under `packages/`. Dropped the "identity primitives" gloss on RFC-029, which scopes `com.semanticops.core` by *always-implicit availability*, not subject matter (its [R3] freezes v1.0.0 to `purpose`). Removed the claim that a design-only RFC cannot ship a package artefact — RFC-005 shipped seven canonical `RelationTypeDefinition`s normatively. Corrected the supersession framing: RFC-021 is blueprint `$schema` optionality and RFC-022 is Record lifecycle, so neither applies — there is **no** supersession path for Types. Added the two constraints that actually decide the question: this RFC's own [CR-036-8]/[CR-036-10] make a canonical Row functionally unnecessary, and muSrs is at `dataModelRevision` 0 so it could not consume one until it completes the RFC-032 migration. |

---

## Abstract

RFC-032 subsumes `FieldGroup` into composite range (a Field with `datatype: "ref"`, `mode: "inline"`), but
`FieldGroup` carried a live rendering-dispatch surface — RFC-007's `compositeRenderer` — that composite
range has no equivalent for. Removing `FieldGroup` (the #242 cutover) without a replacement strands that
capability, and tables are load-bearing in the real corpus. This RFC restores composite rendering on the
new model and relocates the dispatch from the **Type** to the **View**, where RFC-015 already places
presentation and where `FieldView` already carries `displayHint`/`editorHintOverride`. It specifies the
`table` renderer against a **structured** value shape (`columns: string[]`, `rows: ref(Row)[] inline`,
`Row.cells: string[]`, `widths: number[]`) rather than the JSON-in-text encoding the current
implementation parses; it specifies composite **baseline** rendering, which every fallback path depends on
and which no document has ever defined; it maps every RFC-007 `[FG-Cx*]`, `[T-Gx*]` and `[T-Cx*]`
conformance rule onto the new mechanism — including the one and a half that **cease to be renderer
concerns**; and it specifies the deterministic migration for the corpus. This RFC is **design only**: the
instance carrier for an inline composite value does not exist until #242, so the executable fixture, the
re-based renderer tests, and the muSrs data migration are #242's acceptance, per the repository owner's
scope boundary of 2026-07-31.

---

## Motivation

### Problem 1 — composite range has no rendering dispatch, and `FieldGroup` cannot be removed until it does

RFC-032 Change E subsumes `FieldGroup` into a `ref`/`inline` Field over a first-class Type, and states
plainly that "FieldGroup can be fully removed only once **both** #242 (carrier) and #262 (rendering)
land." `FieldGroup.compositeRenderer` is the only rendering-dispatch surface in the specification. A
composite-range Field has `datatype`, `cardinality`, `rangeType` and `mode` — all semantic, none of them
presentational. Nothing on the new model says "render this composite as a table."

Removing `FieldGroup` today would therefore delete a capability rather than migrate it. The
`docs/schema/2.0/type.json` `$defs.FieldGroup` deprecation notice already encodes this dependency:
"Retained … until the #242 cutover provides the inline-composite carrier **and #262 restores composite
rendering**; only then is FieldGroup removed."

Two capabilities are at stake, not one. Beyond the `table` renderer, `FieldGroup` also carried the
**baseline** rendering of a grouped field set — its label heading, its per-entry field rows, and the
`groupFieldRowTemplates` theme hook that styles them. That path is the majority path in the real corpus:
`com.semanticops.spec/table@2` declares no `compositeRenderer` at all, and muSrs's `items` groups are
likewise undispatched. A replacement that restores only the renderer would still strand most of the
corpus.

### Problem 2 — the dispatch is on the Type, which is the wrong layer and RFC-032 has already ruled it out

RFC-007 put `compositeRenderer` on the `FieldGroup` — i.e. inside the Type definition. RFC-032 Rev 3 then
declared `compositeRenderer` (with `editorHint`) **presentation, out of the type model**, "not semantic
type facets … not absorbed by these axes", and named this issue as where they are consolidated. RFC-015
independently established the governing principle for the whole specification:

> Implementations MUST NOT create `precedes` relations to achieve a presentational ordering goal.

and, rejecting a synthetic curation-order field, that encoding presentation on the data would "pollute
the data model with presentation concerns, exactly the conflation this RFC is designed to prevent."

RFC-007's own Rationale conceded the resulting defect: "A consequence: the dispatch applies uniformly
across all views — you cannot show a group as raw paired fields in one view and as a table in another."
A straight port of `compositeRenderer` onto the range Type would carry that defect forward and re-conflate
presentation with type at exactly the moment RFC-032 separated them.

RFC-007 rejected a view-level hint (its Alt A, `renderHint` on `FieldView`) for one specific reason:
"doesn't address multi-field composition (a table requires `columns` + `rows` together)." **That objection
is dissolved by composite range.** Under `FieldGroup` a table was several sibling fields with no single
carrier to hang a hint on. Under composite range a table is *one field* whose range is a Type, so a
field-scoped hint addresses the whole composite. The reason for the Type-level placement no longer exists.

### Problem 3 — the specified value shape is JSON-in-text, and structured values must win

RFC-007's `table` contract reads `columns` as "JSON array of strings" and `rows` as "JSON array of string
arrays" — strings that the renderer parses. The reference implementation does exactly that
(`render_service.rs` `coerce_to_array`: try `as_array()`, else `serde_json::from_str` a `str`), and one of
its tests, `composite_table_no_raw_json_in_output`, exists solely to assert that the un-parsed JSON does
not leak into output.

The repository owner ruled on 2026-07-31:

> Structured values should win over any JSON-in-text implementation. If it is possible to create a real
> structure, then we should always take it.

RFC-032 makes the real structure expressible for the first time: `cardinality: "list"` gives native lists,
and `datatype: "ref"` + `mode: "inline"` gives a list of composites — which is precisely a list of rows.
The JSON-in-text encoding exists only because neither was available when the corpus was authored.

The encoding is not merely inelegant; it is actively lossy in production. `com.mudemocracy/widths`
declares itself "JSON array of **CSS width strings** per column" while the renderer parses it as
`Vec<f64>` via `v.as_f64()` — a value like `["30%", "70%"]` silently `filter_map`s to an empty vector: no
`<colgroup>`, no diagnostic, every column falling back to default alignment. A typed `number[]` field with
`constraints: {minimum: 0, maximum: 1}` makes that class of defect unrepresentable.

### Problem 4 — the theme surface is keyed to a construct that is being removed

`ext:themes-l1` carries two RFC-007 additions. `compositeRendererConfig` is keyed by renderer identifier
and survives the model change unharmed. `groupFieldRowTemplates` is keyed to *group* entries and is
specified to apply "only when the group is rendered by the per-field baseline" — a rule stated in four
places with four different phrasings, naming a construct that #242 deletes. Both need reconciling before
the cutover, and the `table` config object needs a schema: `compositeRendererConfig` is today
`"additionalProperties": true` with zero structural validation, and both properties are mislabelled
`ext:field-groups` in their `theme.json` descriptions when RFC-007 itself calls them `ext:themes-l1`
additions.

A subtlety that governs Change F. RFC-007's per-format output defaults are split across two homes: the
`<h4>` subheading and the markdown/HTML output shapes sit in its Change A (`ext:field-groups`), while the
`<figure>` wrapper, the `<figcaption>` caption and the markdown `*label*` are stated as *defaults of
`ext:themes-l1` config properties* in `[T-Cx1]`–`[T-Cx5]`. RFC-007 was already clear that the former apply
without `ext:themes-l1`. The problem is the latter: they are not really configuration, they are what the
renderer emits when nothing configures it, and `[CR-036-19]` retires the rules that state them.

---

## Proposed Changes

### Change A — `CompositeRendererBinding`: a view-owned dispatch record

A binding declares that a composite-range Field is to be rendered by a named composite renderer, and
optionally states which Field plays which role in that renderer's contract.

```
CompositeRendererBinding:
  renderer: string                # REQUIRED, non-empty. Bare identifiers are SRS-reserved and introduced
                                  # only by a ratified RFC (known values: "table", and the sentinel
                                  # "baseline"). Vendor identifiers use "{reverse-domain}/{name}",
                                  # e.g. "com.example/gantt".
  roles?: { [roleName: string]: uuid }
                                  # OPTIONAL. Explicit, UUID-anchored role→Field binding. Overrides the
                                  # by-name defaults of [CR-036-8]. Role names are defined by the renderer.
```

`roles` is the deliberate improvement over RFC-007. RFC-007 resolved a renderer's contract by matching
`Field.name` against five hard-coded strings — an undeclared coupling between a project's field vocabulary
and the renderer. Under `roles` the binding is by `Field.id`, consistent with SRS's UUID-anchored
identity: RFC-009 describes its `Blueprint.rootTypes → DocumentView.rootTypeRefs → Container.rootInstanceIds`
chain as "fully UUID-anchored" with "no string joins anywhere in this linkage". By-name resolution is
retained as the zero-configuration default because both corpus table types already use the conventional
names.

`renderer: "baseline"` is a reserved sentinel meaning *explicitly no renderer* — the composite is rendered
by the baseline of Change C. It exists so that a more specific declaration site can cancel a broader one
([CR-036-6]); without it, precedence would be one-way and a document-wide directive could never be undone.

### Change B — three declaration sites in the view layer, with a total precedence order

**`ext:views-l1` — `FieldView.compositeRenderer`.** A `FieldView` is already scoped to one `fieldId`, so
the binding needs no field reference. This is the per-view, per-field site, and the one that delivers what
RFC-007 could not: the same records rendered as a table by one View and as nested field rows by another.
It is also the only site that applies when an L1 View is rendered outside any DocumentView.

**`ext:views-l2` — `DocumentSection.compositeRenderers[]`.** An array of `CompositeRendererDirective` —
a `CompositeRendererBinding` plus a required `fieldId`. This site follows RFC-027, which placed the
directly analogous per-record presentation control (`relationsPresentation`) on `DocumentSection`, and it
matches the granularity [CR-036-6] already reasons at: the L1 View is itself selected per section, by
`typeDispatch` then `renderViewId`. It is also the site that covers the **baseline path** — a section with
neither `typeDispatch` nor `renderViewId` renders through the default baseline, where no `FieldView`
exists. Without it, restoring RFC-007's zero-L1-View behaviour would be impossible.

**`ext:views-l2` — `DocumentView.compositeRenderers[]`.** The same array at document scope, as a default
for every section that does not override it. A document whose every section renders the same table type
declares one directive rather than *n*.

```
CompositeRendererDirective:
  fieldId: uuid                   # REQUIRED. The composite-range Field this directive binds.
  renderer: string                # REQUIRED. As CompositeRendererBinding.renderer.
  roles?: { [roleName: string]: uuid }
```

Resolution is most-specific-wins and total ([CR-036-6]): `FieldView`, then `DocumentSection`, then
`DocumentView`, then unbound. A `FieldView` that carries no `compositeRenderer` is *not* an override — it
falls through — which is why the `"baseline"` sentinel exists.

**Extension dependency (a narrowing this RFC accepts explicitly).** RFC-007 Change B declared
`compositeRenderer` "a pure `ext:field-groups` addition with no dependency on `ext:themes-l1`", so a
repository could dispatch a renderer while declaring no view extension at all. Every site in this RFC
lives in `ext:views-l1` or `ext:views-l2`, so composite **dispatch** now requires `ext:views-l1`.
Composite **baseline** rendering (Change C) requires nothing and is always available. The narrowing is
accepted because a repository that declares no view extension has no rendering pipeline to dispatch
within: `render document-view` is an `ext:views-l2` capability, and `ext:views-l2` depends on
`ext:views-l1`. Any repository that renders at all already has the site.

### Change C — composite baseline rendering (normative)

Every fallback in this RFC terminates in "the composite baseline". No document has ever defined it: RFC-007
defined a *FieldGroup* baseline, and RFC-032, which replaced FieldGroup with composite range, defined no
successor. It is specified here because five conformance rules depend on it, because `compositeFieldRowTemplates`
configures it, and because it is the majority rendering path for the migrated corpus.

For a composite-range Field on a Tier 2 Record that is rendered by the baseline — whether **unbound** per
[CR-036-6], or **fallen back** per [CR-036-7] or [CR-036-9] — implementations MUST render, in order:

1. **A heading**, when a label resolves (see below), at heading level `4 + d` shifted by
   `DocumentView.depthOffset`, where `d` is the composite's nesting depth (0 for a composite assigned
   directly to the Record's Type). `depthOffset` is 0 when no DocumentView is in play. Implementations
   MUST clamp the resulting level to 6 in heading-bearing formats (`html`, `markdown`, `adoc`); formats
   with no heading construct, such as `text`, render the label without a level.
2. **One block per value** in the field's value order — one block for a `single` field, *n* for a `list`.
3. **Within each block, one field row per assignment** on the composite's `rangeType`, ascending by
   `FieldAssignment.order`, with `fieldId` ascending in code-point order as tie-break. A field with no
   value, or whose value renders to nothing, MUST be omitted, unconditionally — this matches the reference
   implementation, and `ExportConfig.omitEmptyFields` does not govern it. (On the unbound path there is
   often no L1 View and therefore no `ExportConfig` at all; making the rule unconditional keeps the
   fallback paths of [CR-036-7]/[CR-036-9], where a View does exist, from rendering differently.)
4. **Separation** between consecutive blocks such that they do not run together: implementations SHOULD
   emit a blank line in `markdown`, `adoc` and `text`, and MUST NOT insert a separator element in `html`.

An assignment whose own `fieldType` is `ref`/`inline` is itself a composite: it MUST expand into a nested
baseline block per this Change at nesting depth `d + 1`, not into a single field row. Nested composites
are never bound ([CR-036-5]).

Each field row's label resolves by the ladder `FieldAssignment.displayLabel` → `Field.name` → `fieldId`,
and its template is `ElementTemplates.compositeFieldRowTemplates[Field.name]` when present, else
`ElementTemplates.fieldRow`, else the implementation's existing top-level field-row form, unchanged
([CR-036-17]). That terminal form is deliberately not specified here: the base specification has never
defined it — `ext:themes-l1` specifies `fieldRow` purely as a *wrapper* and says only that "when neither
is set, the element is rendered without wrapping" — and closing a spec-wide gap of that size is not this
RFC's business. It is noted as a follow-up in Open Question 3.

**The composite's label — the successor to `FieldGroup.label`.** The reference implementation renders
`FieldGroup.label` as a heading before the group, in *both* the baseline and the `table` arms, at heading
level 4 shifted by `depthOffset`. (RFC-007 itself never mentions `FieldGroup.label`; this is the shipped
behaviour the migration must preserve, not a rule RFC-007 states.) Its successor is
`FieldAssignment.displayLabel` on the composite field's assignment, overridable by `FieldView.displayLabel`.
Both already exist and both are already rendering-only, so no new schema is required, and the corpus's
"Tables"/"Items"/"Rows" headings survive the migration. The heading is required on the **bound** path too,
by [CR-036-12] and [CR-036-15] — without that, all 14 muSrs `section.table` records would lose their
"Tables" heading at cutover. This is distinct from the `table` renderer's `label` **role**, which is
RFC-007's caption field: the assignment label names the *field*, the role names the *table*. They may both
be present and both render.

### Change D — the `table` renderer, specified against a structured value

The `table` renderer applies to a composite-range Field whose `rangeType` (the *table Type*) satisfies:

| Role | Owner Type | Required | `fieldType` |
|---|---|---|---|
| `rows` | table Type | **yes** | `{ datatype: "ref", mode: "inline", cardinality: "list", rangeType: <row Type> }` |
| `cells` | row Type | **yes** | `{ datatype: "string", cardinality: "list" }` |
| `columns` | table Type | no | `{ datatype: "string", cardinality: "list" }` |
| `widths` | table Type | no | `{ datatype: "number", cardinality: "list", constraints: { minimum: 0, maximum: 1 } }` |
| `subheading` | table Type | no | `{ datatype: "string", cardinality: "single" }` |
| `label` | table Type | no | `{ datatype: "string", cardinality: "single" }` |

`rangeType` is written here as a Type name for readability; the normative shape is RFC-032 [R2]'s
`ExactTypeRef` — `{ typeId, typeVersion }`, version-exact per RFC-009.

The composite field's own `cardinality` governs how many tables the field carries: `single` is one table,
`list` is a sequence of tables — the direct replacement for RFC-007's `repeatable: true` group with one
entry per table. A table Type MAY assign fields beyond the roles; they are not rendered by the `table`
renderer ([CR-036-9]).

Output shapes are carried over from RFC-007 and its reference implementation. Markdown emits a GFM pipe
table with `widths` reinterpreted as an alignment bucket (`≤ 0.3` → `:---`, `≥ 0.7` → `---:`, else `---`);
HTML emits a `<table>` carrying `tableClass` and, when `widths` is present, a `<colgroup>`. `subheading`
and `label` wrap per `wrapperTemplate` / `captionTemplate`. **Four divergences from the reference
implementation's current output are specified deliberately** and are the complete list for this renderer:

1. **Headerless tables** (`columns` empty) get a header row of empty cells in markdown, so the output is a
   well-formed GFM table. RFC-007 permitted headerless tables under `[FG-Cx2]` but specified no output for
   them; 11 of the 30 muSrs tables are headerless. This is the only divergence observable on the corpus.
2. **Over-long rows widen the table** rather than being emitted ragged. The reference implementation emits
   exactly `row.len()` cells, which produces malformed GFM when rows disagree. The corpus has 0 ragged
   rows, so this is inert on migration.
3. **`<colgroup>` cardinality is fixed** at the effective column count, with `<col>` elements beyond
   `widths` carrying no `style`. The reference implementation emits one `<col>` per `widths` element and
   none for the remainder; RFC-007 specified neither. No corpus entry uses `widths`, so this is inert.
4. **`captionTemplate`'s default is three-way, not two-way.** [CR-036-16] restates RFC-007's split of
   HTML / markdown / other formats; the reference implementation applies the markdown form to *every*
   non-HTML format, so `text` and `adoc` output changes. No corpus view renders in those formats, so this
   is inert.

The baseline path of Change C introduces **no divergence observable on either corpus**, but it is not
byte-for-byte identical to the reference in three inert respects, listed here so #242's gate is not
surprised by them. It inserts a `fieldRow` rung the reference's group baseline omits — the reference calls
its field-row formatter directly, consulting only `groupFieldRowTemplates` — which is what RFC-007
`[T-Gx3]` implies by forbidding `fieldRow` *on rows that a template covers*, and is inert because muSrs's
themes cover every `items` row and the srs repo declares no themes at all. It adds a `fieldId` code-point
tie-break for equal `FieldAssignment.order`, which no `fieldGroups` entry in either repository exercises.
And it specifies block separation per format where the reference emits a newline unconditionally. The
empty-field rule, ordering, label ladder and heading level all match the reference exactly.

### Change E — `[FG-Cx3]` and half of `[FG-Cx2]` cease to be renderer concerns

Under structured values, one and a half of RFC-007's five rendering rules stop being rendering rules.

**`[FG-Cx3]` (clamp `widths` to `[0.0, 1.0]`) becomes a value constraint.** RFC-007 needed it because
`widths` arrived as parsed text with no type discipline. A `number[]` field carries
`constraints: { minimum: 0, maximum: 1 }`, which RFC-032 [R10] makes datatype-appropriate for `number` and
the validation layer enforces at load, per element. The bound is declared once on the Field instead of
re-checked on every render, and an out-of-range value becomes a *validation* error naming the record
rather than a *render* diagnostic naming the entry ([CR-036-13]).

**`[FG-Cx2]`'s absence-and-parse half disappears.** RFC-007 skipped an entry when it "contains neither a
`columns` field with at least one element nor a `rows` field with at least one element" — a condition that
conflated three distinct failures: the field is absent, the field's text did not parse as an array, and
the array is empty. Typed values eliminate the first two: an absent optional role is a well-defined empty
list, and a typed list cannot fail to parse. Only genuine emptiness survives, as [CR-036-10]. That rule
also resolves RFC-007's "neither/nor" ambiguity — which RFC-007's own canonical extension record
contradicts by glossing `columns` and `rows` as both "required": `columns` alone renders a header-only
table, `rows` alone renders a headerless table, and only both-empty is skipped.

The complete mapping, satisfying this issue's second acceptance criterion:

| RFC-007 rule | Successor | Disposition |
|---|---|---|
| `[FG-Cx0]` identifier grammar | `[CR-036-1]` | Carried forward; regex now given |
| `[FG-Cx1]` unknown renderer → baseline + diagnostic | `[CR-036-7]` | Carried forward |
| `[FG-Cx2]` empty entry skipped | `[CR-036-10]` | **Half ceases** — absence/parse half gone; emptiness half survives, ambiguity resolved |
| `[FG-Cx3]` clamp `widths` | `[CR-036-13]` | **Ceases to be a renderer concern** — becomes `fieldType.constraints` |
| `[FG-Cx4]` `widths` length mismatch | `[CR-036-14]` | Carried forward |
| `[T-Gx1]` templates only on baseline | `[CR-036-17]` | Carried forward, re-scoped to composites |
| `[T-Gx2]` unknown template keys ignored | `[CR-036-17]` | Carried forward |
| `[T-Gx3]` template beats `fieldRow` | `[CR-036-17]` | Carried forward |
| `[T-Cx1]`/`[T-Cx2]` `tableClass` default / empty | `[CR-036-16]` | Carried forward |
| `[T-Cx3]` config scoped to `table` groups | `[CR-036-16]` | Carried forward and **broadened** — re-scoped to bound fields, and to `tableClass`, which `[T-Cx3]` deliberately excluded |
| `[T-Cx4]` `DocumentView.format` authoritative | `[CR-036-16]` | Carried forward |
| RFC-007 Change A markdown/HTML output shapes, `<h4>` subheading | `[CR-036-12]`, `[CR-036-15]`, `[CR-036-16]` | Carried forward and **broadened** — heading level is now `depthOffset`-relative, which RFC-007 never addressed |
| `[T-Cx5]` unknown config properties ignored | `[CR-036-16]` | Carried forward and **broadened** — also covers keys naming renderers the implementation does not know |

### Change F — `ext:themes-l1` reconciliation, and the defaults that are not theme config

`compositeRendererConfig` is retained with unchanged semantics and unchanged keys. Its layering was
already correct — RFC-007's "`compositeRenderer` declares *what* the data is (a table);
`compositeRendererConfig` declares *how* to present it" — and moving dispatch to the View does not disturb
it, because config is keyed by *renderer identifier*, not by group. It gains the schema it never had: a
`$defs.TableRendererConfig` attached as `properties.table`, with `additionalProperties: true` retained at
both levels so that vendor renderer keys and unknown sub-properties remain schema-valid and are handled at
render time by [CR-036-7] and [CR-036-16]. No constraint is added that could turn a currently-loadable
Theme into a load failure.

`groupFieldRowTemplates` is **renamed** to `compositeFieldRowTemplates` and re-scoped from "group entries"
to "composite entries rendered by the baseline". Its behaviour is otherwise unchanged: keyed by
`Field.name`, applied instead of `fieldRow` for matching rows, unknown names silently ignored, applied
only when the composite is not rendered by a bound renderer. The old key is deprecated and retired with
`FieldGroup` at #242 ([CR-036-18]). Both keys are `Field.name`-keyed string joins, which sits awkwardly
beside this RFC's own argument for UUID anchoring in `roles`; the key shape is retained unchanged because
re-keying a theme surface is a migration cost with no rendering benefit, and because a theme is
package-local where a renderer contract is not.

RFC-007's **per-format output defaults are restated as renderer output specification** rather than as
config defaults ([CR-036-16]), and apply whether or not `ext:themes-l1` is declared or a Theme resolves.
This restates rather than reverses RFC-007, whose extension-independence clause already said a repository
without `ext:themes-l1` gets "the renderer's default output shapes", and whose `<h4>` subheading and
markdown output shapes were stated in its Change A (`ext:field-groups`) rather than in its themes block.
Relocating them matters for one reason: [CR-036-19] retires the `[T-Cx*]` rules that currently house half
of them, so leaving them there would delete the corpus's actual output specification at the cutover. It
also settles a case RFC-002 `[T-2]` leaves implicit — a Theme is ignored when `DocumentView.format` is
absent from `Theme.targets`, and structural output must still be produced, which for a table means these
shapes. One clause here is genuinely new rather than restated: the `subheading` heading level is specified
relative to `DocumentView.depthOffset`, which RFC-007 never mentions. It matches the reference
implementation.

*(A corpus note, not a spec claim: `muSrs/manifest.json` omits `ext:themes-l1` from `declaredExtensions`
while `package/document-views/guide-body-view-2aba4d85.json` carries both a `themeRef` and a
`themeVariants` entry, and the reference implementation reads the active Theme regardless. That is a
manifest under-declaration in the corpus, not evidence about the specification; #242 should fix the
manifest as part of the migration.)*

### Change G — `editorHint` consolidation, and the Invariant 1 / Invariant 13 amendments

RFC-032 named this issue as the consolidation point for `editorHint` as well as `compositeRenderer`. The
two are not symmetrical: `compositeRenderer` is an *output* concern that this RFC relocates, while
`editorHint` is an *input-modality* concern whose view-level override, `FieldView.editorHintOverride`,
already exists. `Field.editorHint` therefore stays where it is. `docs/schema/2.0/field.json` is the
RFC-033 frozen bootstrap seed, loaded as committed and never re-derived; relocating a property out of it
would require regenerating the metamodel package and re-running RFC-035's closure test for no rendering
benefit.

What this RFC contributes is the missing discipline, split across the two invariants that already own the
subject rather than piled onto one. **Invariant 13** owns the `FieldView` facets — "`FieldView.displayLabel`,
`FieldView.displayHint`, and `FieldView.editorHintOverride` are for rendering only. They must not affect AI
guidance, extraction logic, `fieldType` interpretation, or validation" — and gains
`FieldView.compositeRenderer`, the `DocumentView`/`DocumentSection` directives, and Discovery Text
Projection. **Invariant 1** already owns the `FieldAssignment` facets in identical words
(`FieldAssignment.displayLabel`, `FieldAssignment.displayHint`) and gains Discovery Text Projection so the
two do not drift ([CR-036-20]). [CR-036-21] then states the value set and precedence for
`editorHintOverride`, today an unconstrained string where `Field.editorHint` is a closed enum.

### Change H — RFC-007 supersession schedule

RFC-007 remains **Accepted** and its rules remain in force for `FieldGroup` for as long as `FieldGroup`
exists. This RFC supersedes it in part — for composite-range fields only — from acceptance, and RFC-007's
`[FG-Cx0]`–`[FG-Cx4]`, `[T-Gx1]`–`[T-Gx3]` and `[T-Cx1]`–`[T-Cx5]` retire together with `FieldGroup` at
the #242 cutover ([CR-036-19]). Until then the two mechanisms coexist without interaction: a binding names
a composite-range Field, which a `FieldGroup` is not, and `FieldGroup.compositeRenderer` names a group,
which a binding cannot reference. `type.json`'s `$defs.FieldGroup.compositeRenderer` description is
updated to name this RFC as its successor — a description-only change, no shape change to the frozen seed.

---

## Conformance Rules

### Dispatch

> **[CR-036-1]** A `renderer` identifier MUST match
> `^([a-z][a-z0-9-]*|[a-z0-9-]+(\.[a-z0-9-]+)+/[^/]+)$` — either a bare lower-kebab name, or
> `{reverse-domain}/{name}` where the reverse-domain has at least two dot-separated labels and the name
> contains no `/`. An identifier that does not match MUST be treated as unrecognised, and [CR-036-7]
> applies. This rule is enforced at render and validation time, not by JSON Schema, so that a malformed
> identifier degrades gracefully rather than failing the load of an entire View or Theme.

> **[CR-036-2]** *(Governance, addressed to authors of future RFCs rather than to implementations.)* Bare
> `renderer` identifiers are reserved for SRS-defined renderers and MUST only be introduced by a ratified
> RFC. The bare identifiers defined to date are `table` and the sentinel `baseline`. Vendor renderers MUST
> use the `{reverse-domain}/{name}` form.

> **[CR-036-3]** A binding or directive MUST reference a Field whose `fieldType.datatype` is `"ref"` and
> whose `fieldType.mode` is `"inline"`. When it references any other Field, or a `fieldId` that does not
> resolve in the effective package set, implementations MUST ignore the binding, MUST render the field by
> whatever rendering its `fieldType` normally receives — the composite baseline for a composite, the
> ordinary field row otherwise — and MUST emit a diagnostic.

> **[CR-036-4]** Composite rendering applies to **Tier 2** Records only. A binding whose `fieldId` does
> not appear on the rendered instance's resolved Type MUST be ignored without a diagnostic — this is the
> normal case for a heterogeneous section, which renders Tier 0 and Tier 1 members alongside Tier 2 ones.

> **[CR-036-5]** A binding MUST target a composite field assigned directly to the rendered Record's Type.
> Binding a composite **nested** inside another composite's `rangeType` is out of scope for this RFC; a
> nested composite is rendered by the baseline of Change C. Implementations MUST NOT infer a binding for a
> nested composite from a binding on its parent.

> **[CR-036-6]** For a given rendered Record and composite-range field, implementations MUST resolve at
> most one binding, taking the first that applies: (1) `FieldView.compositeRenderer` on the `FieldView`
> for that field in the `ext:views-l1` View selected to render the Record — the View chosen by
> `DocumentSection.typeDispatch`, else `DocumentSection.renderViewId`; (2) the `DocumentSection.compositeRenderers`
> entry whose `fieldId` matches; (3) the `DocumentView.compositeRenderers` entry whose `fieldId` matches.
> When none applies the field is **unbound**. A resolved `renderer` of `"baseline"` means the field is
> unbound and MUST NOT fall through to a broader site. A `FieldView` that exists but carries no
> `compositeRenderer` is not an override and MUST fall through. A field that is not visible in the
> selected View is not rendered at all and no binding applies. When an L1 View is rendered outside any
> DocumentView, only site (1) exists. More than one entry for the same `fieldId` within one array is a
> repository-validation diagnostic; implementations MUST use the first in array order and MUST emit a
> render diagnostic.

> **[CR-036-7]** When a resolved `renderer` is not recognised by the implementation, the implementation
> MUST fall back to the composite baseline (Change C) and MUST emit a diagnostic identifying the
> unrecognised value and the field. The fallback MUST NOT suppress the field's content.

> **[CR-036-8]** Role resolution proceeds per role: when `roles` declares that role, its `uuid` value is
> the bound Field and MUST resolve to an assignment on the owning Type; otherwise the role binds to the
> Field assigned to the owning Type whose `Field.name` equals the role name, compared exactly and
> independently of namespace. Assignments inherited via `ext:type-inheritance` are in scope. When two or
> more assigned Fields share the role name, implementations MUST bind the one with the lowest
> `FieldAssignment.order`, with `fieldId` ascending in code-point order as tie-break, and MUST emit a
> diagnostic. A `roles` entry naming a role the renderer does not define MUST be silently ignored.

> **[CR-036-9]** A role Field satisfies the renderer's contract when its `fieldType` declares every key the
> contract specifies, matching the specified value where the contract gives a literal one. Two exceptions:
> `rangeType` is **presence-matched** — the contract names a binding site, not a value, so the key MUST be
> present and MUST resolve, and its resolved Type is what dependent roles are then looked up on (for
> `table`, `cells` on the `rangeType` of the Field bound to `rows`); and a `constraints` key required by
> the contract is **advisory** — its absence MUST NOT fail the contract test, and is handled by the rule
> that requires it (for `widths`, [CR-036-13]). Additional `fieldType` keys MUST be ignored, and Fields
> assigned to the owning Type that fill no role MUST be ignored, not rendered. When a **required** role
> does not resolve, or resolves to a Field that does not satisfy the contract, the renderer is unsatisfied:
> implementations MUST fall back to the composite baseline and MUST emit a diagnostic identifying the role,
> the field and the reason. When an **optional** role does not satisfy the contract, implementations MUST
> drop that role only — rendering as though it were absent — and MUST emit a diagnostic.

### The `table` renderer

> **[CR-036-10]** The `table` renderer defines the roles `rows` and `cells` (required) and `columns`,
> `widths`, `subheading` and `label` (optional), with the owning Types and `fieldType` shapes given in
> Change D. `rows` MUST be owned by the composite field's `rangeType`; `cells` MUST be owned by the
> `rangeType` of the Field bound to `rows`. Implementations MUST NOT require any role Field to carry a
> particular `namespace`. When both `columns` and `rows` are empty for a given table value, implementations
> MUST skip that table and MUST emit a diagnostic identifying the field and the value's index. The same
> applies when the effective column count of [CR-036-11] is 0 — a table whose rows all carry empty `cells`
> and which declares no `columns` has no well-formed output in any format. Other tables carried by the same
> field MUST continue to render. A non-empty `columns` with no rows renders as
> a header-only table; a non-empty `rows` with empty `columns` renders headerless.

> **[CR-036-11]** The effective column count for a table value is the greater of the `columns` length and
> the greatest `cells` length among that value's rows. A row with fewer cells MUST be padded with empty
> cells and a `columns` shorter than the effective count MUST be padded with empty headers.
> Implementations MUST NOT truncate `cells` or `columns` under any circumstance — a rendered projection
> MUST NOT drop content the Record holds. When padding occurs because a row exceeds the `columns` length,
> implementations SHOULD emit a diagnostic identifying the field, the value index and the row index.

> **[CR-036-12]** Markdown output for one table value is a GFM pipe table: a header row, a delimiter row,
> then one row per `rows` entry, each row carrying exactly the effective column count of cells. Every cell
> MUST be emitted as ` {content} ` between `|` delimiters, with a leading and trailing `|` on each line;
> within `content`, a literal `|` MUST be escaped as `\|` and any newline MUST be replaced by a single
> space. The delimiter cell for column *i* is ` :--- `, ` ---: ` or ` --- ` according to [CR-036-14].
> When `columns` is empty, implementations MUST emit a header row of empty cells at the effective column
> count, so that the output is a well-formed GFM table. Where a field carries multiple table values they
> MUST be emitted in value order, separated by a blank line. When a label resolves for the composite field
> per Change C, implementations MUST emit it as a heading before the renderer's output, at the same level
> Change C specifies — the successor to the `FieldGroup.label` heading the reference implementation emits
> on this path today. Output formats other than `html` — including `adoc` and `text` — use this rule.

> **[CR-036-13]** A Field bound to the `widths` role MUST declare
> `fieldType.constraints: { minimum: 0, maximum: 1 }`, and a value outside that range is a validation
> error reported by the validation layer. On a `cardinality: "list"` field the bound applies **per
> element** — a clarification this RFC supplies, since RFC-032 states neither that a scalar `constraints`
> block distributes over list elements nor that it does not. A Field bound to `widths` that omits the
> constraint is still bound and its values are still used: per [CR-036-9] a missing `constraints` key is
> advisory and MUST NOT fail the contract test, and the implementation MUST emit a diagnostic. Should an out-of-range value reach a renderer, the renderer MUST clamp it to `[0.0, 1.0]`
> for output determinism and SHOULD emit a diagnostic. *(Replaces `[FG-Cx3]`.)*

> **[CR-036-14]** Column *i*'s alignment derives from `widths[i]`: left (` :--- ` in markdown) when the
> value is ≤ 0.3, right (` ---: `) when ≥ 0.7, and default (` --- `) otherwise. Boundary values are
> deterministic: exactly 0.3 is left, exactly 0.7 is right. When `widths` has fewer elements than the
> effective column count the remaining columns take the default alignment and, in HTML, no `style`
> attribute; when it has more, the excess MUST be ignored. In either case implementations SHOULD emit a
> diagnostic identifying the mismatch. *(Replaces `[FG-Cx4]`.)*

> **[CR-036-15]** HTML output for one table value is a `<table>` element carrying the resolved
> `tableClass`; when `widths` is non-empty implementations MUST emit a `<colgroup>` containing exactly the
> effective column count of `<col>` elements, where the *i*th carries `style="width:N%"` for `N` =
> `widths[i]` × 100 rounded half away from zero to an integer, and elements beyond `widths`'s length carry
> no `style`. A `<thead>` MUST be emitted only when `columns` is non-empty and a `<tbody>` only when
> `rows` is non-empty. All cell content MUST be HTML-escaped. Each table value MUST produce its own
> top-level element with no separator element between them. The composite field's resolved label, when one
> resolves, MUST be emitted as a heading before the renderer's output, as in [CR-036-12]. This rule pins
> the elements, `<colgroup>` cardinality, rounding and escaping; it does not pin inter-element whitespace,
> so the migration parity gate is measured against the reference implementation's own output rather than
> against a byte form this RFC determines.

### Theme surface

> **[CR-036-16]** `ElementTemplates.compositeRendererConfig` is keyed by the same identifier space as
> `renderer` ([CR-036-1]). Unknown properties within a known renderer's sub-object, and keys naming
> renderers the implementation does not know, MUST be silently ignored and MUST NOT cause a rendering or
> loading error. Config applies only to fields resolved to the corresponding renderer and MUST NOT affect
> any other field. `DocumentView.format` is the authoritative format signal for format-conditional
> defaults, and an explicitly set template applies regardless of output format. The `table` renderer reads:
>
> | Property | Effect | Default |
> |---|---|---|
> | `tableClass` | CSS class on `<table>` (HTML only) | `"srs-data-table"`; an explicit `""` suppresses the `class` attribute entirely |
> | `wrapperTemplate` | Wraps one rendered table value. Tokens `{{subheading}}`, `{{label}}`, `{{table}}`; an absent optional value MUST resolve to the empty string | HTML: `<figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>`. Other formats: no wrapper |
> | `captionTemplate` | Renders the `label` role. Token `{{field-value}}` | HTML: `<figcaption>{{field-value}}</figcaption>`. Markdown: `*{{field-value}}*`. Other formats: `{{field-value}}` undecorated |
>
> `{{subheading}}` resolves to the **rendered** subheading and `{{label}}` to the **output of
> `captionTemplate`**, both computed before wrapper substitution; `{{table}}` resolves to the table element
> or GFM block. The `subheading` role renders as a heading at the level Change C specifies for the
> composite's own heading — the **same** level, not one deeper (`<h4>` in HTML for a top-level composite at
> `depthOffset` 0), matching the reference implementation, and subject to Change C's clamp. It renders at
> that level whether or not a `wrapperTemplate` applies, since the wrapper substitutes the rendered result
> rather than replacing it. That the composite's label and its subheading land on the same level is a
> nesting anomaly inherited from the reference implementation and deliberately preserved: correcting it
> would add a fifth divergence observable on 2 of the 30 muSrs table entries, which is not a trade this
> RFC should make on a parity gate. A future RFC may. `"baseline"` is a dispatch sentinel, not a renderer, and a
> `compositeRendererConfig` key of `"baseline"` MUST be ignored. **These defaults are the renderer's
> output specification, not configuration defaults: implementations MUST apply them whether or not
> `ext:themes-l1` is declared and whether or not a Theme resolves.**

> **[CR-036-17]** `ElementTemplates.compositeFieldRowTemplates` is keyed by `Field.name` and supplies the
> template for an individual field row within a composite rendered by the baseline, in place of
> `ElementTemplates.fieldRow`. Keys that do not match a rendered field MUST be silently ignored.
> Implementations MUST NOT apply it to a composite field that resolved to a renderer under [CR-036-6]; a
> composite that falls back to the baseline under [CR-036-7] or [CR-036-9] is baseline-rendered and MUST
> have it applied.

> **[CR-036-18]** `ElementTemplates.groupFieldRowTemplates` is deprecated by `compositeFieldRowTemplates`
> and is retired with `FieldGroup` at the #242 cutover. While both exist, implementations MUST apply
> `groupFieldRowTemplates` to `FieldGroup` entries and `compositeFieldRowTemplates` to composite entries.
> Migrating a `FieldGroup` to a composite therefore silently disables any `groupFieldRowTemplates` key
> naming one of its fields: a migration that converts a group MUST carry every such key over to
> `compositeFieldRowTemplates`, and implementations SHOULD emit a diagnostic when a
> `groupFieldRowTemplates` key matches no `FieldGroup` field in the effective package set.

### Cross-cutting

> **[CR-036-19]** RFC-007's `[FG-Cx0]`–`[FG-Cx4]`, `[T-Gx1]`–`[T-Gx3]` and `[T-Cx1]`–`[T-Cx5]` remain in
> force for `FieldGroup` until `FieldGroup` is removed at the #242 cutover, at which point they are
> retired. A `FieldGroup` MUST NOT be the target of a binding ([CR-036-3]), and a composite-range field
> MUST NOT be dispatched by `FieldGroup.compositeRenderer`; the two mechanisms MUST NOT interact.

> **[CR-036-20]** *(Amends Invariant 1 — the `FieldAssignment` facets — and Invariant 13 — the `FieldView`
> facets.)* `CompositeRendererBinding`, `CompositeRendererDirective`, `FieldAssignment.displayLabel`,
> `FieldAssignment.displayHint`, `FieldView.compositeRenderer`, `FieldView.displayLabel`,
> `FieldView.displayHint`, `Field.editorHint` and `FieldView.editorHintOverride` are presentation only. They MUST NOT affect a Record's validity, its
> field values, its `fieldType` interpretation, its Relations, its AI guidance or extraction logic, or its
> Discovery Text Projection (`ext:discovery`). Two repositories differing only in these values MUST
> produce identical validation results and identical Discovery output.

> **[CR-036-21]** `FieldView.editorHintOverride`, when present, MUST take a value from the same set as
> `Field.editorHint` (`singleline`, `textarea`, `rich-text`, `date-picker`, `dropdown`, `multi-select`,
> `voice`) and supersedes it for Records rendered or edited through that View. A value outside that set
> MUST be ignored with a diagnostic and `Field.editorHint` MUST apply. As with [CR-036-1] this is enforced
> at validation and render time rather than by JSON Schema, so that an unrecognised value does not fail
> the load of the whole View.

> **[CR-036-22]** Every diagnostic required or recommended by a `[CR-036-n]` rule MUST carry that rule's
> identifier and MUST identify the instance, field, and — where the rule names one — the value or row
> index. Diagnostics raised by [CR-036-13]'s constraint bound are **validation-pass** diagnostics of
> severity `error`; every other `[CR-036-n]` diagnostic is a **render-pass** diagnostic of severity
> `warning`, except the duplicate-`fieldId` case in [CR-036-6], which is additionally reported at
> validation time. No `[CR-036-n]` diagnostic of either pass causes a non-zero exit code: consistent with
> the existing CLI contract, exit 0 means the command ran, not that the data is valid, and diagnostics are
> reported in the payload for the caller to inspect.

---

## Schema changes

| Schema file | Change |
|---|---|
| `view.json` | Add `$defs.CompositeRendererBinding`: `renderer` (required, `{"type": "string", "minLength": 1}` — no `pattern`, per [CR-036-1]) and optional `roles` (`object`, `additionalProperties: {"type": "string", "format": "uuid"}`). Add `FieldView.compositeRenderer` referencing it. Update `FieldView.editorHintOverride`'s description to state [CR-036-21]'s value set and precedence; **no type change**. |
| `document-view.json` | Add `$defs.CompositeRendererDirective`: `fieldId` (required, uuid) plus `renderer` and `roles` as above. Add `DocumentSection.compositeRenderers` and top-level `DocumentView.compositeRenderers`, both arrays of it. |
| `theme.json` | Add `ElementTemplates.compositeFieldRowTemplates` (same shape as `groupFieldRowTemplates`). Mark `groupFieldRowTemplates` `deprecated: true`, description naming its retirement at #242. Add `$defs.TableRendererConfig` (`tableClass`, `wrapperTemplate`, `captionTemplate`, all optional strings, `additionalProperties: true` per [CR-036-16]) and attach it as `compositeRendererConfig.properties.table`, retaining `additionalProperties: true` on `compositeRendererConfig` itself so vendor keys stay valid. Correct the `ext:field-groups` label on both pre-existing properties to `ext:themes-l1`. |
| `type.json` | **Description only.** `$defs.FieldGroup.compositeRenderer` names RFC-036 as its successor and its retirement at the #242 cutover. No shape change — `type.json` is the RFC-033 frozen bootstrap seed. |
| `field.json` | **None.** `editorHint` stays in place (Change G). |
| `record.json` | **None.** The inline-composite value carrier is #242. |
| `document-view-output.json` | **None in this RFC.** `ProjectedRecord.fieldGroups` / `$defs.ProjectedFieldGroup` are keyed to `FieldGroup` and are removed with it at the #242 cutover, which owns the composite projection shape because it owns the value carrier the projection would serialise. |

Every addition is a new optional property under an `additionalProperties: false` object, and the two
grammars this RFC defines ([CR-036-1], [CR-036-21]) are deliberately enforced outside JSON Schema so that
malformed values degrade per [CR-036-7]/[CR-036-21] rather than failing a load. One change is not purely
additive and is called out rather than glossed: attaching `TableRendererConfig` at
`compositeRendererConfig.properties.table` newly constrains a key that was previously unconstrained, so a
Theme carrying, say, `table.tableClass: 123` would newly fail to load. `additionalProperties: true` is
retained at both levels to keep the break as narrow as possible, and corpus impact is zero — no Theme in
either repository declares `compositeRendererConfig` at all.

### Spec record amendments

The canonical spec is `srs/records/` as well as `docs/schema/2.0/`. This RFC folds into:

| Record | Amendment |
|---|---|
| `srs/records/extensions/ext-views-l1.json` | `FieldView.compositeRenderer` + `CompositeRendererBinding`; `[CR-036-1]`–`[CR-036-9]`, `[CR-036-21]` |
| `srs/records/extensions/ext-views-l2.json` | `DocumentSection.compositeRenderers`, `DocumentView.compositeRenderers`; `[CR-036-6]` |
| `srs/records/extensions/ext-themes-l1.json` | `compositeFieldRowTemplates`; `groupFieldRowTemplates` deprecation; `[CR-036-16]`–`[CR-036-18]` |
| `srs/records/extensions/ext-field-groups.json` | `compositeRenderer`'s canonical shape block gains the supersession note, matching the `type.json` description so record and schema do not drift |
| `srs/records/invariants/invariant-013.json` | Extended per [CR-036-20]: the `FieldView` facets gain `compositeRenderer` and the Discovery Text Projection guarantee |
| `srs/records/invariants/invariant-001.json` | Extended per [CR-036-20]: the `FieldAssignment` facets gain the Discovery Text Projection guarantee, so I-1 and I-13 do not drift |

Schema changes must be synced to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`.
Both mirrors refresh from the `schemas-2.0.tar.gz` release artifact published on merge to `master`; this
RFC does not edit sibling trees.

---

## Migration

### The specification's own tables — a construct swap, no data migration

`com.semanticops.spec/table@2` assigns `intro`, `outro` and `columns` directly and carries a `FieldGroup`
`rows` (label "Rows", `repeatable: true`, `minItems: 1`) with one member field `cells`
(`displayLabel: "Cells"`). Both `com.semanticops.spec/columns` and `com.semanticops.spec/cells` declare
`fieldType.cardinality: "list"` (fixed by #276), so the group is *already* the shape composite range
expresses: a repeatable group of one list-valued field is a list of `{ cells: string[] }`.

Migration introduces `com.semanticops.spec/table-row@1` (one assignment, `cells`, carrying the
`displayLabel: "Cells"` from the group's member assignment) and republishes `table@3` with `intro`,
`outro` and `columns` unchanged and
`rows: { datatype: "ref", mode: "inline", cardinality: "list", minItems: 1, rangeType: table-row@1 }`.
The group's `minItems: 1` becomes `fieldType.minItems`; its `label: "Rows"` becomes
`FieldAssignment.displayLabel` on the `rows` assignment, per Change C. The 9 carrier records' 65 rows are
native arrays already, so the values move without transformation. `table@2` declares no
`compositeRenderer`, so no binding is created and the records render through the Change C baseline exactly
as they render through RFC-007's group baseline today.

**Spec-side parity is not currently measurable, and #242 must build the instrument.** All 9 `table`
records participate in zero Relations, so none is in a `precedes` chain and none appears in any of the
four committed exports — verified on the epic. A diff of the committed exports is therefore vacuously
clean and proves nothing. #242 must add a purpose-built fixture DocumentView over the `table` records and
measure parity against it.

### muSrs `com.mudemocracy/section.table` — a deterministic transform

The one production consumer of `compositeRenderer` is `com.mudemocracy/section.table@1`, whose `tables`
group holds five fields and encodes its payload as JSON-in-text. Its measured corpus:

| Metric | Value |
|---|---|
| Carrier records | 14 |
| Table entries | 30 |
| Data rows | 102 |
| JSON values that parse cleanly | 30 / 30 |
| Tables with headers whose row length equals the column count | 19 |
| Headerless (`columns: []`) — permitted under `[FG-Cx2]`, specified by [CR-036-10]/[CR-036-12] | 11 |
| Ragged rows | 0 |
| Entries using `widths` | 0 |

**Type transform.** Each `FieldGroup` becomes a Type and each group entry an inline composite value:

- `tables` → `com.mudemocracy/table@1` (`subheading`, `label` as `{string, single}`; `columns` as
  `{string, list}`; `widths` as `{number, list, constraints{0,1}}`; `rows` as
  `{ref → com.mudemocracy/table-row@1, inline, list}`), with `table-row@1` carrying `cells: {string, list}`.
- `items` → `com.mudemocracy/section-item@1` (`item-term`, `item-body`).
- `section.commentary@1`'s `items` group migrates by the same shape but **not** to the same Type: its
  members are `commentary-term` and `commentary-body`, which are different Fields, so it takes its own
  `com.mudemocracy/commentary-item@1`.
- `section.table@2` replaces both groups with composite fields `tables: {ref → table@1, inline, list}` and
  `items: {ref → section-item@1, inline, list}`.

**`FieldAssignment` facet transform.** Group-level `label` becomes `FieldAssignment.displayLabel` on the
composite assignment ("Tables", "Items"), preserving the heading each record renders today. Group-level
`required` and `minItems`/`maxItems` become the composite field's assignment `required` and
`fieldType.minItems`/`maxItems` — note muSrs's `tables.rows` member assignment carries `required: true`,
which becomes `required` on the `rows` assignment within `table@1`. Member `order` is preserved as
assignment `order` within the new Type. Member `repeatable`/`minItems`/`maxItems` are the trio RFC-032
Change H deprecates — they are retained on `FieldAssignment` until the #242 cutover removes them — and
where a member was list-valued its Field already declares `cardinality: "list"`.

**Value transform** — total and lossless. `columns` and `rows` are `JSON.parse`d (30/30 succeed), each
parsed row becomes one `{ cells: [...] }` inline composite, and `subheading`/`label` copy verbatim.
`widths` has **zero** instance data, so changing its declared type from "JSON array of CSS width strings"
to a constrained `number[]` migrates no values — and retires the silent `["30%"] → []` defect of Problem 3
rather than porting it.

**Binding transform.** `section.table@1`'s `compositeRenderer: "table"` becomes a
`CompositeRendererDirective` on each `DocumentSection` that renders `section.table` records — or a
`FieldView.compositeRenderer` on the L1 View the section's `typeDispatch` already selects for them. The
`items` groups were undispatched and stay unbound.

**Theme transform — required, and easy to miss.** `muSrs/package/themes/guide-prose-4f8a2c1e.json`
carries `groupFieldRowTemplates` for `item-term` and `item-body`; `guide-prose-html-5f3d230e.json` carries
those plus `commentary-term` and `commentary-body`. Once those groups are composites, [CR-036-18] stops
`groupFieldRowTemplates` applying to them, and every one of those rows would silently lose its styling.
Both files MUST have the key renamed to `compositeFieldRowTemplates` in the same change that migrates the
Types.

**Parity gate.** `render document-view` output for the migrated records MUST be diff-clean against the
**reference implementation's** pre-migration output, with exactly the four divergences enumerated in
Change D. Only the first is observable on this corpus: the 11 headerless tables gain a well-formed GFM
header row of empty cells, where RFC-007 specified no output at all. There are 0 ragged rows so the
padding rule is inert; `<colgroup>` is never emitted because no entry uses `widths`; and no corpus view
renders in `text` or `adoc`, so the `captionTemplate` split is inert. The baseline path — the `items`
groups and all 9 spec tables — must be diff-clean with no *observable* divergence; Change D names three
inert respects in which Change C is deliberately not byte-for-byte identical to the reference. Any other diff is a migration defect.

### Deferred to #242

The instance carrier does not exist: `docs/schema/2.0/record.json`'s `FieldValue.value` is
`oneOf[string, number, boolean, string[], null]` with no `object` branch, so an inline composite value has
nowhere to live until #242 provides it. Per the repository owner's scope boundary of 2026-07-31, #242
owns: the `record.json` inline-composite carrier; the executable fixture rendering a composite as a table;
re-basing the `render_service.rs` composite/table tests onto structured input (under which
`composite_table_no_raw_json_in_output` becomes trivially true and `coerce_to_array`'s string branch is
deleted rather than ported); executing both migrations above including the theme-key rename and the
`ext:themes-l1` declaration missing from `muSrs/manifest.json`; the spec-side parity fixture; the removal of `FieldGroup`, `groupValues`, `groupFieldRowTemplates` and
`document-view-output.json`'s `ProjectedFieldGroup`, together with the composite projection shape that
replaces it; and the retirement of RFC-007's rules per [CR-036-19].

Consequently `compositeFieldRowTemplates` is **inert on merge of this RFC** — no composite value can exist
until the carrier does — and becomes live at the cutover. It is specified now because [CR-036-18] requires
the migration to carry keys into it, and the migration is #242's.

---

## Rationale

**Why the View and not the range Type.** The range Type is a semantic object. Placing "render as a table"
on it would state a presentational fact in the type system, and would reproduce RFC-007's acknowledged
defect that dispatch "applies uniformly across all views." RFC-015 supplies the discriminating test —
presentation is where "many concurrent arrangements over the same records are legitimate and none is a
semantic claim" — and a table is exactly that: legitimate as a table in a guide and as nested rows in a
compact view. `FieldView` is already the home of `displayLabel`, `displayHint` and `editorHintOverride`,
so the binding lands beside its peers rather than opening a new layer.

**Why `DocumentSection` and not only `DocumentView`.** Rev 1 put the L2 directive at document scope.
RFC-027 had already placed the directly analogous control — `relationsPresentation`, a per-record
presentation directive — on `DocumentSection`, and [CR-036-6]'s first step selects the L1 View *per
section*, so a document-scoped fallback would sit one level coarser than the thing it falls back from.
Worse, it would reintroduce across sections the exact defect this RFC claims to fix across views: a
narrative section and an appendix could not render the same field differently. The section tier is the
consistent home; the document tier is retained above it purely as a default, and the `"baseline"`
sentinel makes the ladder cancellable in both directions.

**Why the composite baseline is specified here rather than deferred.** It is tempting to treat baseline
rendering as #242's, since no composite value can exist until the carrier does. But five rules in this RFC
name it as their fallback, `compositeFieldRowTemplates` configures it, and the majority of the migrated
corpus — every undispatched group, including the specification's own tables — renders through it. An RFC
whose every failure path terminates in an undefined behaviour is not implementable, and the acceptance
criterion is that the *design* exists.

**Why no grammar is enforced in JSON Schema.** Both [CR-036-1] and [CR-036-21] could be expressed as a
`pattern` or an `enum`. Doing so would convert a case the specification handles gracefully at runtime —
unknown renderer falls back with a diagnostic; unknown editor hint is ignored — into a hard load failure
of an entire View or Theme file, pre-empting the very rule written to handle it. RFC-007 made the same
choice implicitly by shipping `compositeRenderer` with no `pattern`. The schema constrains shape; the
conformance rules constrain meaning.

**Why padding rather than truncation.** Rev 1 truncated over-long rows to the header width. In a semantic
record store the canonical projection must not silently drop content the Record holds, and truncation
contradicted this RFC's own [CR-036-7] ("MUST NOT suppress the field's content"). Widening the table is
lossless, keeps the GFM output well-formed, and is unobservable on a corpus with no ragged rows.

**Why the RFC-007 output defaults are restated as renderer specification.** Half of them are stated only
as defaults of `ext:themes-l1` config properties, in the `[T-Cx*]` rules that [CR-036-19] retires — so
leaving them there would delete the renderer's actual output specification at the cutover. They are not
configuration in any case: they are what the renderer emits when nothing configures it, which RFC-002
`[T-2]` requires to still be produced whenever a Theme is ignored on format mismatch.

**Why `widths` keeps its name and its dual meaning.** RFC-007 considered renaming it `columnAlignments`
and declined because deployed repositories carry `widths` as a numeric array. That reasoning holds, and
the dual reading — alignment bucket in markdown, proportional width in HTML — is now at least honestly
typed. A distinct HTML-only width concept remains a future RFC's business.

**Why RFC-007 is superseded in part rather than replaced.** `FieldGroup` still exists and still renders
until #242 removes it. Retiring RFC-007's rules now would leave the surviving construct unspecified.
[CR-036-19] states the schedule so the retirement is a consequence of the #242 cutover rather than a
second decision.

**Why `editorHint` is consolidated in place.** Symmetry would suggest moving it to the View alongside
`compositeRenderer`. `field.json` is RFC-033's frozen bootstrap seed, loaded as committed and never
re-derived, so relocating a property would require regenerating the metamodel package and re-running
RFC-035's closure test to no rendering end. The override already exists on `FieldView`; what was missing
was the value set, the precedence and the non-semantic guarantee, and [CR-036-20]/[CR-036-21] supply them
as amendments to Invariants 1 and 13.

---

## Alternatives Considered

### Alt A — port `compositeRenderer` onto the range Type

The minimal change: move the string from `FieldGroup` to the Type named by `rangeType`. Rejected because
it binds the presentation to the Type rather than to the *use* of the Type — a Type reused for a
non-tabular purpose could not escape the renderer — and because it carries forward RFC-007's own
acknowledged limitation that dispatch cannot vary by view, which is the capability this RFC exists to add.
It would also contradict RFC-032 Rev 3's ruling that presentation is out of the type model, though that is
a consequence of the design objection rather than an independent reason.

### Alt B — dispatch on the `FieldAssignment`

`FieldAssignment` is a defensible middle: it already carries `displayLabel`, which is rendering-only, so
presentation on an assignment has precedent, and it scopes to the *use* of a Field rather than the Field
itself. Indeed Change C relies on exactly that property for the `FieldGroup.label` successor. Rejected on
two counts. The design objection is that it still cannot vary by view, so it does not deliver the
capability RFC-007 was missing. The practical objection is temporal: `FieldAssignment` lives in
`type.json`, RFC-033's frozen bootstrap seed, so adding a property forces the `FieldAssignment` metamodel
Type to gain a field and the RFC-035 closure test to be re-run — churn through a just-frozen bootstrap for
a rendering concern. Only the first objection is permanent; a future de-freezing would reopen the second.

### Alt C — `DocumentSection` as the only L2 site, with no `DocumentView` tier

The strictest reading of the RFC-027 precedent. Rejected only for ergonomics: a DocumentView whose every
section renders the same table type would repeat the directive *n* times, and the repetition is exactly
the kind of duplication that drifts. The document tier costs one clause in [CR-036-6] and one array in the
schema, and the `"baseline"` sentinel means it can never trap a section into an unwanted rendering. Had
the sentinel not been available, this alternative would have won.

### Alt D — infer the renderer structurally, with no dispatch at all

A composite whose range has `columns: string[]` and `rows: ref(Row)[]` where `Row.cells: string[]` *is* a
table; an implementation could simply recognise the shape. Genuinely attractive under structured values
and needs no new schema. Rejected because it is not overridable in either direction: a repository with a
table-shaped composite it wants rendered as prose has no way to say so, and a vendor renderer over a
different shape has no way to be selected. It also makes rendering silently sensitive to a Type edit that
happens to match the shape. Structural inference is a reasonable *default* layered on an explicit
mechanism; it is not a substitute for one, and Open Question 1 keeps it live.

### Alt E — dispatch on the Theme

`compositeRendererConfig` already lives on `ElementTemplates`, so co-locating dispatch there would keep
the whole rendering surface in one object. Rejected because a Theme is applied only when
`DocumentView.format` appears in `Theme.targets` (RFC-002 `[T-2]`, cited by RFC-007), and is otherwise
ignored with structural output still produced. Dispatch would then depend on theme resolution, so an
unmatched format would silently downgrade every table to baseline. Config may be format-conditional;
dispatch must not be. RFC-007 made the same separation for the same reason, and its extension-independence
clause is the precedent: a repository may dispatch a renderer while carrying no theme config at all.

### Alt F — keep JSON-in-text and port the parser

The lowest-effort path, and the only one that would have allowed an executable fixture before #242 lands
the carrier. Rejected by the repository owner's ruling of 2026-07-31 that structured values win wherever
real structure is expressible. The measured corpus supports the ruling on its own terms: the transform is
deterministic (30/30 parse, 0 ragged), the renderer loses a parsing path rather than gaining one, and the
`widths` CSS-string-versus-`f64` defect is a live example of what an untyped carrier costs.

---

## Open Questions

1. **Should structural inference (Alt D) be added as a default once the mechanism exists?** It would let a
   conforming table render with no binding at all, which is strictly more convenient, but makes rendering
   sensitive to Type edits. This RFC deliberately specifies the explicit mechanism first; the question is
   left for a follow-up once #242 provides real usage evidence.
2. **What is the specification's default field-row form?** Change C's template ladder ends at "the
   implementation's existing top-level field-row form, unchanged", because the base specification has
   never defined one — `ext:themes-l1` specifies `fieldRow` as a wrapper and says only that an element
   with no wrapper "is rendered without wrapping". That gap predates this RFC and is spec-wide rather
   than composite-specific, so closing it here would be scope creep. It is not on muSrs's critical path —
   both muSrs themes declare `groupFieldRowTemplates` covering every row their `items` groups produce, so
   the terminal rung is never reached there. It becomes load-bearing for the **spec-side** parity fixture
   that #242 must build, since the srs repo declares no themes at all and every row of its 9 `table`
   records would render through exactly this undefined form. It warrants its own issue before that
   fixture is written.
3. **Should the `table` renderer's row Type be shipped canonically?** Both migrations publish a
   project-local row Type with an identical single `cells` field, so deferring guarantees two Types a
   canonical `Row` would later deprecate — a cost this RFC accepts rather than overlooks. Three
   constraints bound the answer, and they are recorded here so the question is not reopened from
   scratch:

   - **This RFC's own rules make a canonical Row functionally unnecessary.** [CR-036-8] binds roles by
     `Field.name` *independently of namespace*, [CR-036-10] states that implementations MUST NOT require
     a role Field to carry a particular `namespace`, and `roles` supplies a UUID override for anything
     else. Two project-local row Types satisfy the contract with zero configuration. What is genuinely
     canonical here is the **role contract** ([CR-036-10] and Change D's role table), not a Type — a
     shared Type would be a second, weaker expression of something already normative.
   - **There is no home for it today.** RFC-029 [R3] freezes `com.semanticops.core` v1.0.0 to the
     `purpose` Type and requires a new RFC for any addition; RFC-033 explicitly declines to make
     `com.semanticops.srs` implicitly available, and `com.semanticops.srs/metamodel` is
     generator-owned (`gen-metamodel-package.mjs --check` gates it in CI) and derivation-scoped to the
     properties of `field.json`/`type.json`, so a table row has no antecedent there and cannot be
     hand-added. A canonical Row would need a **new distributable package** under `packages/`,
     following the RFC-029 / RFC-017 pattern — roughly six files. Note RFC-005 shipped seven canonical
     `RelationTypeDefinition`s normatively from an RFC, so "a design-only RFC cannot ship a package
     artefact" is a scope preference here, not a categorical bar.
   - **muSrs could not consume one yet.** Its manifest carries no `dataModelRevision` (⇒ 0) and its
     fields are still on the pre-RFC-032 `valueType` model, so a rev-1 canonical Row is unusable there
     until muSrs completes the RFC-032 migration — which #242 does not currently scope.

   Deferring is not free but the cost is bounded and non-stranding: inline composites are *values*, not
   instances, so no Relation is affected, and `compositeFieldRowTemplates` is `Field.name`-keyed so
   theme keys survive. Note there is **no supersession path for Types** — a canonical Row in a different
   namespace is a new UUID lineage, not a version bump — so the retarget is a mechanical rekey of 23
   records / 167 rows. The cost curve is *cheap now → cheapest at #242, when both corpora are rewritten
   anyway → expensive after*. Decide it at #242, not later.
