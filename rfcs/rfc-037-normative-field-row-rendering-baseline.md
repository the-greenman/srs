> **GitHub issue**: [the-greenman/srs#294](https://github.com/the-greenman/srs/issues/294)

# RFC-037: Normative field-row rendering baseline

**Status**: Accepted (Revision 2)
**Affects**: `ext:views-l2` (RFC-001 Change A, Default Rendering Baseline Step 4; Heading Hierarchy table; the RFC-027 Rows bullet), `ext:themes-l1` (RFC-002 Rule `[T-8]` and its class injection table, `ElementTemplates.fieldRow`), RFC-027 Change C rule 3, RFC-036 Change C (composite baseline boundary) and its Open Question 2
**Implementation**: [the-greenman/srs-rust#782](https://github.com/the-greenman/srs-rust/issues/782)
**Author**: the-greenman (design decisions of 2026-07-31 on #294); drafted by the epic-256 worker
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft. Encodes the nine owner decisions of 2026-07-31 on #294. |
| 2 | 2026-07-31 | Spec-integrity and completeness review. Adds Change 0 (exact Step 4 replacement text) and a fold-in target table; adds row separation and block-list termination (`[FR-037-7]`), without which a block list swallows the following row; makes entry ordering cardinality-neutral; carves composite-range fields out to RFC-036 Change C; covers Tier 1 and Tier 0; resolves the relation-row class contradiction via `srs-relationtype-*`; makes class emission independent of `ext:themes-l1`; amends `[T-8]`'s rule text, not only its table; drops "or replace" (contradicted `[T-3]`); corrects the export-diff count to 86 and states the measurement; declares the MAY→MUST placeholder promotion; adds `adoc` `+` continuation. Value stringification for non-string datatypes recorded as out of scope (Open Question 2). |

---

## Abstract

RFC-001 Change A defines a Default Rendering Baseline in four steps: it fixes *which* fields render, in *what* order, and with *what* label — then stops. "Step 4 — Render" never says what a rendered field row **is**. This RFC supplies the missing referent: the normative emitted form of a field row in `markdown`, `adoc`, `text`, and `html`, for both single-valued and multi-entry values, together with the separation rules that make a sequence of rows well-formed.

Doing so repairs live defects rather than only filling a gap. RFC-027 Change C rule 3 requires `html`, `adoc`, and `text` relation rows to use "the same label/value markup that implementation emits for a field row in that format" — a referent that does not exist for three of the four formats. This RFC gives it one. It also pins the portable placeholder and **promotes RFC-001's "MAY render a placeholder" to a MUST**; corrects the `[T-8]` field-name CSS class to derive from `Field.name` rather than `FieldAssignment.displayLabel`; brings the load-bearing label/value class names inside the contract; and makes an empty-string value absent in rendering as RFC-001 Step 2 already declares it to be.

---

## Motivation

### Problem 1 — "Step 4 — Render" does not define the emitted form

RFC-001's own problem statement is candid about this class of defect (`rfcs/rfc-001.md:47`):

> No definition of "default rendering" appears anywhere in the spec. Two conformant implementations will produce incompatible output for the same `DocumentView` — and neither is wrong, because there is no baseline to violate.

RFC-001 closed that gap for selection, ordering, and labelling. It left the emitted form open. The canonical Step 4 text (`srs/records/subsections/07-7-ext-views-l2.json`, rendered at `docs/spec/srs-spec.md:1849`) says only which fields to render, that a placeholder **MAY** be emitted, and that presentation of multiple entries "is implementation-defined".

`ext:themes-l1` does not close it either. `ElementTemplates.fieldRow` is specified purely as a **wrapper** — "Wraps each field label + value pair", receiving `{{content}}` — and RFC-002 is explicit that element templates "receive finished content and wrap it — they do not re-render" (Rule `[T-3]`). The unwrapped element that `{{content}}` carries is precisely the thing nothing defines. RFC-002 even states that "when neither is set, the element is rendered without wrapping", naming the unspecified case without specifying it.

The asymmetry is the cleanest statement of the problem: `format: "json"` is fully pinned by a real schema (`docs/schema/2.0/document-view-output.json`). The rendered formats have no equivalent.

### Problem 2 — RFC-027's relation-row rule has no referent

The canonical text is the Rows bullet of the `ext:views-l2` subsection record (`srs/records/subsections/07-7-ext-views-l2.json`, rendered at `docs/spec/srs-spec.md:1709`):

> **Rows.** One row per (entry, direction) with at least one edge: the resolved label followed by the related instances' display labels, comma-joined. Markdown normative form: `**<label>**: <display label>, <display label>`. Other formats use the same label/value markup that implementation emits for a field row.

The RFC-027 proposal text is stronger, phrasing the same rule as a **MUST** scoped to `html`, `adoc`, and `text` (`rfcs/rfc-027-document-view-relations-presentation.md:99`). The record is the source of truth, and it is both weaker (no MUST) and *broader*: "other formats" is unbounded, so it reaches `pdf`, `docx`, and implementation-defined values as well.

Either way the defect is the same and it is live: the referent does not exist. Two consequences follow. First, the markdown field-row form `**<label>**: <value>` **is** already normative today — but only obliquely, as a side effect of specifying something else. Second, for every other format the rule cannot be satisfied, because there is nothing to conform to. Change E bounds the clause to the four formats this RFC defines and states what happens beyond them.

### Problem 3 — The only other normative pin is weak, and one format fails it

The `ext:views-l2` Heading Hierarchy table (`docs/spec/srs-spec.md:1881`) states:

> | Field label | Bold/formatted text — not a heading | Always |

This constrains only the label and says nothing about the separator, the value, or containment. What it does firmly exclude is "field label as a heading". A format that emits an undecorated `Label: value` — as `adoc` does in the reference implementation — satisfies neither reading.

*(RFC-001's own wording at `rfcs/rfc-001.md:149` is "Formatted text (e.g. bold) — not a heading", where bold is an example rather than a disjunct. The projection's "Bold/formatted" is what the canonical record carries. The conclusion is the same under either wording: undecorated `Label: value` is not formatted text.)*

### Problem 4 — The CSS class contract is derived from the wrong string, and half of it is outside the contract

Rule `[T-8]`'s injection table mandates `srs-fieldname-{fieldName}` for a field row, and RFC-002's template variable table defines `{{field-name}}` as "`Field.name` for the current field" (`rfcs/rfc-002.md:326`) — so `{fieldName}` unambiguously means `Field.name`. Deriving it instead from `FieldAssignment.displayLabel` makes the class unstable under a rendering-only change: a Type that sets `displayLabel: "Decision Rationale"` on field `rationale` would emit `srs-fieldname-decision-rationale`, and any stylesheet written against the published spec breaks. `displayLabel` is rendering-only and view-owned (RFC-015); a semantic identity hook must not depend on it.

Separately, a stylesheet cannot distinguish label from value using only `srs-field` and `srs-fieldname-*` — which is most of the point of a themes extension. Any implementation that is useful in practice therefore emits label/value class names that appear in no RFC, no record, and no schema, and that collide freely with host-page CSS.

### Problem 5 — An empty string renders, contradicting Step 2

Step 2 already declares that a field whose `FieldValue.value` is an empty string is **absent**, and Step 4 says absent fields are omitted. An implementation that treats `""` as a present value emits a label with no value — `**Content**: ` with a trailing space. This repository's own committed exports contain 86 such rows; `docs/spec/srs-spec.md:7` is one of them.

This is a conformance failure against the spec **as it already stands**, not a gap this RFC creates. It is recorded here because the correction is an expected export-diff event that must be anticipated rather than discovered (see *Expected export diff*).

### Problem 6 — RFC-036's row-template ladder bottoms out here

RFC-036 specifies composite baseline rendering, whose row-template ladder is `compositeFieldRowTemplates` → `fieldRow` → *the implementation's existing top-level field-row form*. That last rung is this gap; RFC-036 deliberately did not close it (its Open Question 2) because the gap predates RFC-036 and is spec-wide rather than composite-specific.

It becomes load-bearing at the point issue #242 reaches. The `srs` repository declares no themes, so every row of #242's spec-side parity fixture renders through precisely this undefined rung. Capturing that fixture against unspecified behaviour would freeze the current implementation as a golden without anyone having decided it is correct.

---

## Proposed Changes

Throughout, **row label** means the string resolved by RFC-001 Step 3 (`FieldAssignment.displayLabel`, falling back to `Field.name`), and **field identity** means `Field.name` — the two are distinct inputs and are never interchanged.

**Rendered value.** The `<value>` in every form below is the field's value after the implementation's value-to-string conversion, then subject to Change F's escaping rule for the target format. This RFC does not define that conversion for non-string datatypes — see Open Question 2.

**Value sequence.** A field renders as **multi-entry** when RFC-001 Step 2 finds it present through an ordered sequence of values rather than a single scalar. Two mechanisms produce such a sequence and this RFC covers both without preferring either: `fieldType.cardinality: "list"` (RFC-032 `[R4]`, the current mechanism, whose values are carried as an array in `FieldValue.value`) and the legacy `ext:repeatable-fields` path (`FieldValue.entries`). "Sequence order" below means array index order on the former and `entries` order on the latter.

### Change 0 — Amended Step 4 text

The canonical Step 4 in `srs/records/subsections/07-7-ext-views-l2.json` is replaced in full. The existing text contradicts this RFC in two places — "implementations MAY render a placeholder" and "presentation (list vs inline) is implementation-defined" — and both must go rather than sit alongside the new rules. Replacement:

> **Step 4 — Render.** Render only present fields. A field that Step 2 resolves as absent — including one whose `FieldValue.value` is an empty string, and one whose value sequence has no surviving entries — MUST NOT emit a row, and implementations MUST NOT emit a label with an empty value. The sole exception is `DocumentSection.emptyBehavior` `"show-placeholder"` with the field `required: true`, which MUST emit a row whose value position carries the literal placeholder `(empty)`. Multi-entry values render as a block list, never comma-joined. The emitted form of a field row, and the separation between consecutive rows, is normative per output format — see *Normative Field-Row Form* below (RFC-037).

### Change A — Normative scalar field-row form

For a present single-valued field, the baseline MUST emit exactly one row, beginning on its own line, in the format-specific form below.

| Format | Normative row form |
|---|---|
| `markdown` | `**<label>**: <value>` |
| `adoc` | `*<label>*: <value>` |
| `text` | `<label>: <value>` |
| `html` | the element structure in Change A1 |

`markdown` ratifies the form that RFC-027's Rows bullet already made normative by reference. `adoc` uses AsciiDoc bold (`*…*`), satisfying the Heading Hierarchy table's formatted-text requirement that an undecorated `Label: value` fails. `text` carries no bold requirement — the Heading Hierarchy table's **preamble** scopes it to `markdown`, `html`, and `adoc` — and plain text has no portable emphasis convention.

In all three text formats the separator is a literal colon followed by a single space (U+003A U+0020).

"Beginning on its own line" rather than "on its own line": a scalar value may itself contain line breaks, which Change B2 requires to be emitted verbatim at column zero. The row starts a line; it does not necessarily occupy only one.

#### Change A1 — `html` scalar structure

```html
<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>: <span class="srs-field-value field-value">{value}</span></div>
```

where `{name}` is `Field.name` normalised by the `[T-8]` five-step rule, `{label}` is the row label, and `{value}` is the rendered value.

Normative in this structure are: the element names and their nesting (`div` > `strong`, `span`), their order, the literal colon between `</strong>` and the value element, and the `srs-`-prefixed class names. Inter-element whitespace is **not** normative.

This follows the precedent `[CR-036-15]` sets for pinned HTML output (`rfcs/rfc-036-composite-rendering.md:537-538`):

> This rule pins the elements, `<colgroup>` cardinality, rounding and escaping; it does not pin inter-element whitespace, so the migration parity gate is measured against the reference implementation's own output rather than against a byte form this RFC determines.

`[CR-036-15]` is self-scoped ("*This rule* pins…"), so `[FR-037-4]` states the exclusion for itself rather than relying on a repo-wide principle the spec does not assert. Implementations SHOULD emit the single-line form above so conformance fixtures have a canonical serialisation.

**These classes are part of the baseline's output specification, not of `ext:themes-l1`.** Implementations MUST emit them whether or not `ext:themes-l1` is declared and whether or not a Theme resolves. Without this, the `srs` repository — which declares no themes and is this RFC's own motivating fixture — would have undefined class output, and RFC-002 `[T-2]` already requires structural output when a Theme is ignored. RFC-036 `[CR-036-16]` sets the same precedent for its renderer defaults.

### Change B — Normative multi-entry field-row form

A multi-entry value MUST render as a block list, never as an inline comma-joined string. The label occupies its own line (in `html`, its own element) and each entry is a list item.

| Format | Label line | Entry marker |
|---|---|---|
| `markdown` | `**<label>**:` | `- ` |
| `adoc` | `*<label>*:` | `* ` |
| `text` | `<label>:` | `- ` |
| `html` | see Change B1 | `<li>` |

The label line retains the trailing colon and carries no value.

> **Derived, not decided.** Spec research returned **UNRESOLVED** on the colon: nothing in the specification states whether a value-less label line keeps it, and RFC-036 records that the question never arose because a field with no value is omitted outright (`rfcs/rfc-036-composite-rendering.md:220-221`). It is retained here because decision 9 requires label/value punctuation to remain identical across the shared relation/field primitive, and dropping it in the block form alone would make punctuation vary by cardinality. Flagged for review.

In `markdown`, `adoc`, and `text`, the entry list begins on the line immediately after the label line, with no blank line between them. Entries appear in **sequence order**.

**Cardinality, not element count, selects the form.** A field whose value is a sequence renders in block form even when the sequence holds exactly one element. Selecting the form by element count would make a Type's rendered shape depend on instance data, so two records of the same Type would disagree on structure.

**Entries that render to nothing are omitted** from the list, following RFC-036 Change C item 3. A sequence in which no entry survives that filter is **absent**, and emits no row at all — the same outcome Step 2 gives an empty string, and the reason Change 0 restates absence to cover it.

#### Change B1 — `html` multi-entry structure

```html
<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>:<ul><li class="srs-field-value field-value">{entry}</li></ul></div>
```

One `<li>` is emitted per surviving entry, in sequence order, each carrying the value class names. The `<ul>` element itself carries no class.

> **Derived, not decided.** Decision 4 fixes the markup shape — "`<ul>` with one value-bearing `<li>` per entry" — and decision 3 fixes the class vocabulary, but neither states whether the `<li>` carries the value classes or whether the `<ul>` takes a class of its own. Spec research returned **UNRESOLVED**: the specification contains no `<ul>`/`<li>` token anywhere, and `[T-8]`'s injection table has no row below "Field row". This RFC composes the two decisions in the way that invents least — the `<li>` is the value-bearing element, so it takes the value role's classes, and no new class name is introduced for the `<ul>`. Flagged for review.

#### Change B2 — Continuation and verbatim scalars

When a surviving entry's rendered value spans more than one line, every line after the first MUST be indented to the entry's content column — two spaces in `markdown` and `text`. In `adoc`, indentation alone does not attach a following block to a list item; implementations MUST emit an AsciiDoc list continuation line (`+`) before each subsequent block of a multi-block entry, and indentation is not normative there.

An entry whose rendered value contains a **blank line** is outside the block form: implementations MUST emit such an entry as a single item whose subsequent blocks are attached by the format's own continuation mechanism (`+` in `adoc`; four-space content indentation in `markdown` and `text`). This case is reachable because Change F requires values to be emitted verbatim.

Continuation indentation applies to **entries only**. A single-valued field's value is emitted verbatim after the label, and any lines it contains after the first are emitted at column zero, unindented and unaltered. Indenting a scalar value would corrupt every multi-line markdown body in this repository's own projection (`docs/spec/srs-spec.md:10-14`).

#### Change B3 — Row separation and block-list termination

Consecutive field rows MUST be separated so that they do not run together, and a block list MUST be terminated before whatever follows it.

- In `markdown`, `adoc`, and `text`, implementations MUST emit a blank line between consecutive field rows, and MUST emit a blank line after the final entry of a block list before any following row, heading, or relations block.
- In `html`, implementations MUST NOT insert a separator element between rows; the `div` boundary is the separation.

This is not cosmetic. In CommonMark, `**A**: x` immediately followed by `**B**: y` is a *single* soft-wrapped paragraph, not two rows; and a row following a block list without an intervening blank line is a **lazy continuation** of the list's final item, so the next field row is swallowed into the list. RFC-036 Change C item 4 solves the analogous problem for composite blocks the same way, though it states the text-format rule as SHOULD; this RFC states it as MUST because without it the emitted document is not merely ugly but structurally wrong.

### Change C — Empty values and the portable placeholder

**An empty string is absent.** RFC-001 Step 2 already states this; this RFC adds no new presence semantics and amends nothing in Step 2. What it adds is the consequence: a field that Step 2 finds absent MUST NOT emit a row, and in particular MUST NOT emit a label with an empty value.

When `DocumentSection.emptyBehavior` is `"show-placeholder"` **and** the field is `required: true` in the Type, the baseline MUST emit a row whose value position carries the literal placeholder `(empty)`. In `html`, the value element additionally carries the class `srs-empty-value`:

```html
<span class="srs-field-value field-value srs-empty-value">(empty)</span>
```

Outside that condition — absent and not (`show-placeholder` and `required`) — no row is emitted at all.

**This promotes a MAY to a MUST.** RFC-001 Step 4 currently reads "in which case implementations **MAY** render a placeholder". An implementation that today emits nothing in that situation is conformant and becomes non-conformant under `[FR-037-11]`. The promotion is deliberate: a MAY with no stated form gives two implementations licence to differ on both *whether* and *how*, which is the same interoperability hole this RFC exists to close, and the placeholder is only useful to a document consumer if its presence is predictable. Change 0 carries the replacement text.

**The placeholder is a scalar row** regardless of the field's cardinality: an absent field has no sequence to enumerate, so a list-cardinality field's placeholder is `**Label**: (empty)`, not a one-item block list.

**L1-View path unchanged.** `DocumentSection.emptyBehavior` "does not apply in the L1 View rendering path" (`docs/spec/srs-spec.md:1853`); empty handling there is governed by `ExportConfig.omitEmptyFields`. `[FR-037-11]` inherits that exclusion and does not extend `emptyBehavior` into the L1-View path.

**Scope against RFC-036.** This placeholder rule governs top-level field rows only. It does not disturb RFC-036 Change C item 3 (`rfcs/rfc-036-composite-rendering.md:220-224`), under which a field row *inside a composite block* whose value renders to nothing "MUST be omitted, unconditionally" and which `ExportConfig.omitEmptyFields` explicitly does not govern.

### Change D — Class vocabulary and the `[T-8]` amendment

`[T-8]`'s injection table gains the label and value elements, and states the derivation of the field-identity class explicitly:

| Element | Classes always applied | Classes conditionally applied |
|---|---|---|
| Field row | `srs-field`, `srs-fieldname-{fieldName}` where `{fieldName}` is **`Field.name`** | `srs-relationtype-{relationTypeKey}` in place of `srs-fieldname-*` on a relation row (Change E) |
| Field row label | `srs-field-label` (+ alias `field-label`) | — |
| Field row value | `srs-field-value` (+ alias `field-value`) | `srs-empty-value` when the value is the `(empty)` placeholder |

`[T-8]`'s **rule text** is amended too, not only its table. It currently binds "each rendered **wrapper element**", and the new `strong` and `span` rows are not wrapper elements. Replacement:

> **[T-8]** For `"html"` and `"pdf"` output, implementations MUST apply the CSS classes in the injection table to each rendered element named in that table. Class name components MUST be normalised using the five-step rule. The `{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from `FieldAssignment.displayLabel`.

`{fieldName}` MUST be derived from `Field.name`. This is a clarification of `[T-8]`'s existing intent, not a change to it: RFC-002's template variable table already defines `{{field-name}}` as `Field.name`.

**Two naming notes.** First, the aliases `field-label` / `field-value` are spelled identically to the `{{field-label}}` / `{{field-value}}` template variables in the `ext:themes-l1` variable table; they are CSS class names, not template tokens, and the two namespaces do not interact. Second, `srs-field-label` sits alongside the pre-existing generated family `srs-field-{fieldName}-{normalisedValue}` applied to *record wrappers* for `cssClassFields` entries — so a Field named `label` with value `active` yields `srs-field-label-active`. The two families are distinguished by exact match, never by prefix matching.

**Sunset.** The unprefixed aliases are **temporary compatibility aliases**, emitted alongside the prefixed names so existing stylesheets keep working. Only the `srs-`-prefixed names form the forward contract. They are deprecated on acceptance of this RFC and removed at the #242 cutover — the same cutover at which RFC-036 `[CR-036-19]` retires `FieldGroup` and its `[T-Gx*]` / `[T-Cx*]` rules. Binding the sunset to an already-scheduled cutover avoids introducing a second deprecation clock.

### Change E — Relation rows share the row primitive

RFC-027's Rows bullet now has a defined referent. A relation row uses the label/value structure of Change A and Change A1, with the resolved relation label in the label position and the comma-joined related-instance display labels — which RFC-027 already specifies — in the value position.

**The identity class differs.** A relation row has no `Field.name`, so `srs-fieldname-*` has no legal value on it. On a relation row, implementations MUST omit `srs-fieldname-*` and emit `srs-relationtype-{relationTypeKey}` instead, normalised by the five-step rule. `srs-field` is retained, so a stylesheet can target both row kinds together. Relation-specific wrapper classes MAY be applied additively provided the label/value structure and punctuation are unchanged.

**Bounded to the four covered formats.** The record's clause says "other formats", which is unbounded. It is amended to name `html`, `adoc`, and `text` — the formats this RFC defines — and to state that for any other format the relation row form remains implementation-defined, consistent with Open Question 3.

RFC-027 rule 3 comma-joins multiple related instances into one row. That is a relation-row rule, deliberately left intact, and is **not** overridden by Change B's prohibition on comma-joining, which governs multi-entry *field values*. Change B's ambiguity argument does not apply: a relation row's value is a set of resolved links, not independently authored strings.

### Change F — Escaping and verbatim emission

In `markdown`, `adoc`, and `text`, the baseline MUST emit the rendered value **and the label** verbatim, and MUST NOT escape or otherwise alter them, except for the continuation indentation Change B2 requires. Field values in this model routinely *are* markup — this specification's own body fields carry markdown that the projection renders as live markdown (`docs/spec/srs-spec.md:10-14`) — and escaping them would corrupt the projection.

Verbatim label emission has a known consequence: a `displayLabel` containing `*` or `**` will disturb the emphasis span, and one containing a colon makes the row ambiguous to a consumer splitting on the first colon. This RFC accepts that rather than introducing an escaping scheme, because escaping labels would equally corrupt authored markup in labels; it is recorded in Open Question 4.

In `html`, label and value content MUST be HTML-escaped: `&`, `<`, `>`, `"`, and `'`. This matches `[CR-036-15]`'s "All cell content MUST be HTML-escaped" and follows decision 3's "content is escaped".

**The consequence is explicit:** a markdown-bearing field value renders in `html` output as literal markdown source, not as converted HTML. The baseline performs no markup conversion — it has no rule for which values are markup, and `fieldType.format` does not currently carry one. An implementation wanting converted output must supply it through a Theme or an L1 View, not through the baseline. This is a real limitation of `html` baseline output and is recorded in Open Question 5.

### Change G — Conformance boundary

These rules bind any implementation that emits a `DocumentView` in `markdown`, `adoc`, `text`, or `html` through the Default Rendering Baseline, **or through RFC-036's composite baseline where that baseline emits an individual field row**. They do **not** bind native application UI that is not emitting a `DocumentView` — `srs-web` record cards, the `srs-vscode` record and editor views, and comparable surfaces are out of scope, and their independent DOM vocabularies are not a defect. A client-side renderer that emits a `DocumentView` in a covered format is **not** exempt.

This RFC makes no claim that independent native client DOM violates `capability-layering.md`. That document assigns format-specific rendering and UI layout to clients; divergence matters only where a surface claims to emit the normative `DocumentView` format.

**Composite-range fields are carved out.** A Field whose `fieldType.datatype` is `ref`/`inline` — a composite — is rendered by RFC-036 Change C, which requires a heading plus one block per value with nested rows. Changes A and B do **not** apply to the composite field itself; they apply to the individual field rows *within* each composite block, which is exactly the terminal rung RFC-036's ladder points at. Without this carve-out `[FR-037-3]`'s "exactly one row per present field" would contradict RFC-036's "one block for a `single` field, *n* for a `list`".

**Tier 1 and Tier 0.** A Tier 1 `TypedRecord` carries name-keyed `TypedField` entries with no `FieldAssignment` and no `Field` UUID. For Tier 1 members the row label is the `TypedField` name, the identity class is derived from that same name, and `[FR-037-11]`'s placeholder rule does not apply because there is no `required: true` to consult. Tier 0 Notes have no fields and emit no field rows; RFC-027 relation rows still render for both tiers per Change E.

### Change H — Label resolution is unchanged

Label resolution remains exactly RFC-001 Step 3: `FieldAssignment.displayLabel`, falling back to raw `Field.name`. The baseline MUST NOT humanise, case-convert, or otherwise transform the fallback. A snake_case `Field.name` therefore renders as-is, and authors who want human-facing text set `displayLabel`.

This is stated as an explicit non-change because RFC-027 defines a humanization ladder for relation type keys, and the absence of a corresponding rule here is a decision rather than an omission. Relation labels are derived from a type key that has no authored alternative; field labels have `displayLabel`.

RFC-036's composite baseline uses a three-rung ladder, `FieldAssignment.displayLabel` → `Field.name` → `fieldId` (`rfcs/rfc-036-composite-rendering.md:232`). That third rung is composite-specific — it covers an assignment whose Field cannot be resolved — and is not carried into the top-level baseline, which RFC-001 Step 3 already terminates at `Field.name`.

### Change I — Theme interaction and the RFC-036 ladder

The forms defined above are the content that `ElementTemplates.fieldRow` receives as `{{content}}`. A Theme MAY **wrap** the row through `fieldRow`; it MAY NOT replace it. RFC-002 is explicit on this in both its rule text (`[T-3]`: implementations "MUST NOT suppress or reorder content through template evaluation") and its design principles (`rfcs/rfc-002.md:51`: "A Theme wraps or decorates auto-rendered content; it does not replace or reorder it").

When no `fieldRow` template resolves, implementations MUST emit these forms unwrapped. This is the terminal rung of RFC-036's row-template ladder (`compositeFieldRowTemplates` → `fieldRow` → baseline field-row form), closing RFC-036 Open Question 2.

### Change J — Heading Hierarchy table

The `ext:views-l2` Heading Hierarchy table's Field label row is amended to point at the now-defined forms:

> | Field label | Bold/formatted text — not a heading; exact per-format form per *Normative Field-Row Form* (RFC-037) | Always |

---

## Fold-in targets

What Change 0 and Changes A–J apply to in the canonical spec:

| Target | What changes |
|---|---|
| `srs/records/subsections/07-7-ext-views-l2.json` | Step 4 replaced (Change 0); Rows bullet bounded and pointed at the new forms (Change E); Heading Hierarchy Field label row amended (Change J); new *Normative Field-Row Form* subsection carrying Changes A–C, G–I |
| `srs/records/extensions/ext-themes-l1.json` | `[T-8]` rule text and injection table amended (Change D); `[FR-037-13]`, `[FR-037-14]`, `[FR-037-19]` recorded |
| `docs/schema/2.0/` | **No file changes** — see *Schema changes* |

Integration manifest: `ext:views-l2`, `ext:themes-l1`.

---

## Conformance Rules

> **[FR-037-1]** These rules apply to any implementation emitting a `DocumentView` in `markdown`, `adoc`, `text`, or `html` via the Default Rendering Baseline (RFC-001 Change A), or via RFC-036 Change C's composite baseline where it emits an individual field row. They MUST NOT be construed to bind rendering surfaces that do not emit a `DocumentView`. A client-side `DocumentView` renderer in a covered format is not exempt.
>
> **[FR-037-2]** A Field whose `fieldType.datatype` is `ref` or `inline` is rendered by RFC-036 Change C and is outside `[FR-037-3]` and `[FR-037-5]`. These rules govern the field rows *within* a composite block, not the composite field itself.
>
> **[FR-037-3]** For a present single-valued field, implementations MUST emit exactly one row, beginning on its own line: `markdown` — `**<label>**: <value>`; `adoc` — `*<label>*: <value>`; `text` — `<label>: <value>`; with a literal U+003A U+0020 separating label from value.
>
> **[FR-037-4]** For a present single-valued field in `html`, implementations MUST emit a `div` carrying `srs-field` and the identity class, containing a `strong` carrying `srs-field-label`, a literal colon, and a `span` carrying `srs-field-value`, in that order. Element names, nesting, order, the literal colon, and the `srs-`-prefixed class names are normative; inter-element whitespace is not. Implementations SHOULD emit the structure on a single line.
>
> **[FR-037-5]** For a present multi-entry field, implementations MUST render the value as a block list and MUST NOT comma-join entries. The label MUST occupy its own line (in `html`, its own `strong`) and MUST retain its trailing colon. Entry markers are `- ` in `markdown` and `text`, `* ` in `adoc`, and `<li>` in `html`. Entries MUST appear in sequence order — array index order where `fieldType.cardinality` is `"list"`, `FieldValue.entries` order on the `ext:repeatable-fields` path. A sequence of exactly one element MUST render in block form, not scalar form.
>
> **[FR-037-6]** In `html`, a multi-entry value MUST be emitted as a `ul` containing one `li` per surviving entry, each `li` carrying the field-value class names. The `ul` MUST NOT carry a class.
>
> **[FR-037-7]** In `markdown`, `adoc`, and `text`, implementations MUST emit a blank line between consecutive field rows, and MUST emit a blank line after the final entry of a block list before any following row, heading, or relations block. In `html`, implementations MUST NOT insert a separator element between rows.
>
> **[FR-037-8]** When a surviving entry's rendered value spans multiple lines, implementations MUST indent every line after the first by two spaces in `markdown` and `text`. In `adoc`, implementations MUST emit a `+` list continuation line before each subsequent block of a multi-block entry; indentation is not normative in `adoc`. Implementations MUST NOT apply continuation indentation to a single-valued field's value, which MUST be emitted verbatim at column zero.
>
> **[FR-037-9]** An entry whose rendered value is empty MUST be omitted from the list. A field whose value sequence has no surviving entries MUST be treated as absent.
>
> **[FR-037-10]** A field that RFC-001 Step 2 resolves as absent — including a field whose `FieldValue.value` is an empty string, and one caught by `[FR-037-9]` — MUST NOT emit a row, except under `[FR-037-11]`. Implementations MUST NOT emit a label with an empty value.
>
> **[FR-037-11]** When `DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true` in the Type, implementations MUST emit a row whose value position carries the literal string `(empty)`. This supersedes RFC-001 Step 4's "MAY render a placeholder". The placeholder row MUST take scalar form regardless of the field's cardinality. In `html`, the value element MUST additionally carry `srs-empty-value`. This rule MUST NOT be applied in the L1 View rendering path, where `ExportConfig.omitEmptyFields` governs.
>
> **[FR-037-12]** On a field row the identity class is `srs-fieldname-{fieldName}`, whose `{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from `FieldAssignment.displayLabel`. On a relation row implementations MUST omit `srs-fieldname-*` and MUST emit `srs-relationtype-{relationTypeKey}` instead. Both are normalised by the `[T-8]` five-step rule.
>
> **[FR-037-13]** Implementations MUST emit the field-row class vocabulary in baseline `html` output whether or not `ext:themes-l1` is declared and whether or not a Theme resolves. This broadens `[T-8]`'s scope, which is otherwise conditional on that extension.
>
> **[FR-037-14]** For `html` and `pdf` output, implementations MUST emit both the `srs-`-prefixed class names and their unprefixed aliases (`field-label`, `field-value`) until the #242 cutover, and MUST emit only the prefixed names thereafter. Stylesheets claiming conformance MUST NOT depend on the unprefixed aliases.
>
> **[FR-037-15]** Relation rows MUST use the row forms defined by `[FR-037-3]` and `[FR-037-4]`, with the resolved relation label in the label position, subject to the identity-class substitution in `[FR-037-12]`. RFC-027's comma-joining of multiple related instances within one row is unaffected by `[FR-037-5]`. For formats other than `markdown`, `adoc`, `text`, and `html`, the relation row form remains implementation-defined.
>
> **[FR-037-16]** In `markdown`, `adoc`, and `text`, implementations MUST emit rendered label and value content verbatim and MUST NOT escape or otherwise alter it, except for the continuation required by `[FR-037-8]`. In `html`, implementations MUST escape `&`, `<`, `>`, `"`, and `'` in label and value content.
>
> **[FR-037-17]** The baseline MUST NOT perform markup conversion on a field value. A markup-bearing value is emitted verbatim in the text formats and escaped as literal text in `html`.
>
> **[FR-037-18]** Label resolution MUST remain `FieldAssignment.displayLabel` falling back to raw `Field.name`. Implementations MUST NOT humanise or case-convert the fallback. For a Tier 1 `TypedRecord` the label and the identity class are both derived from the `TypedField` name; `[FR-037-11]` does not apply to Tier 1. Tier 0 Notes emit no field rows.
>
> **[FR-037-19]** The forms defined by `[FR-037-3]`–`[FR-037-9]` are the content that `ElementTemplates.fieldRow` receives as `{{content}}`. A Theme MAY wrap the row through `fieldRow` and MUST NOT replace it, per `[T-3]`. When no `fieldRow` template resolves, implementations MUST emit these forms unwrapped. This satisfies the bottom rung of RFC-036's row-template ladder.

---

## Schema changes

**None.**

This RFC specifies the emitted form of rendered output. It introduces no new entity property, changes no existing entity shape, and adds no portable enum value. `docs/schema/2.0/document-view-output.json` governs the `json` projection only and is unaffected — the `json` format was already fully pinned, which is the asymmetry Problem 1 identifies.

One description-level drift was identified during review and deliberately **not** fixed here: `docs/schema/2.0/document-view.json` describes `DocumentSection.emptyBehavior` as "What to do when the section has no records", a section-level reading, while RFC-001 Step 4 and `[FR-037-11]` use it as a per-field placeholder switch. The drift is pre-existing and `[FR-037-11]` makes it load-bearing, but correcting it would touch a schema file and trigger the mirror-sync sequence in `srs-rust` and `srs-vscode` for a change that alters no validation behaviour. It is recorded as Open Question 6 with a follow-up rather than widened into this RFC.

Because no schema file changes, no mirror sync is required.

---

## Expected export diff

Correcting Problem 5 deletes the committed empty-value rows from this repository's exports. Measured as generated rows — a bold label, a colon, and a trailing space with no value — with:

```bash
grep -cE '^\*\*[^*]+\*\*: $' <file>
```

| file | empty-value rows |
|---|---:|
| `docs/spec/srs-unified.md` | 43 |
| `docs/spec/srs-rationale.md` | 41 |
| `docs/spec/srs-spec.md` | 2 |
| **total** | **86** |

`docs/spec/profiles/docx-dita-adoption.md` contributes **0**: its bold-lead-in lines are hand-authored prose inside body field values, not generated rows.

**This corrects the figure of 92 given on #294.** That number came from a looser pattern that also matches authored markdown lead-ins such as `**New invariant (49)**:`; the looser pattern yields 96 in total, not 92, so the original table reproduced under neither measure. The figure to expect on re-render is **86**.

**Those deletions are not part of this RFC's own diff.** They occur only when the reference implementation changes (srs-rust#782) and the exports are re-rendered through the corrected binary. `docs/spec/` is generated output; hand-editing it to match a rule no implementation yet enforces would put a false projection in the tree. The deletion is recorded here as an expected future export-diff event, owned jointly with srs-rust#782.

---

## Rationale

**Why ratify the existing markdown form rather than design a new one.** The markdown form `**<label>**: <value>` is already normative by reference through RFC-027's Rows bullet, and it is what every committed export in this repository contains. Choosing a different form would invalidate the entire committed projection to no benefit.

**Why the class identity is `Field.name` and not `displayLabel`.** `displayLabel` is rendering-only and view-owned (RFC-015). A CSS hook keyed to it changes whenever an author retitles a field for presentation, which is exactly when a stylesheet must *not* break. `Field.name` is stable and is what RFC-002's `{{field-name}}` variable already exposes.

**Why the row-separation rule is a MUST where RFC-036's is a SHOULD.** RFC-036 Change C item 4 asks for a blank line between composite blocks so they "do not run together" — a legibility concern. Here the same omission changes the parse: an unseparated row after a block list becomes a lazy continuation of the last list item and disappears into it. A rule whose violation silently destroys a row cannot be advisory.

**Why cardinality selects the form rather than element count.** If a one-element sequence rendered as a scalar row, the same Type would render structurally different documents depending on how many values an instance happened to carry, and a consumer could not parse the output without inspecting the data. Keying on cardinality keeps the rendered shape a property of the Type.

**Why the placeholder MAY becomes a MUST.** A MAY with no stated form lets two implementations differ on both whether a placeholder appears and what it looks like — the same interoperability hole this RFC exists to close. A placeholder is only useful to a consumer if its presence is predictable from `emptyBehavior` and `required` alone. The cost is that an implementation emitting nothing today becomes non-conformant, which is why Change C states it rather than burying it.

**Why the unprefixed aliases survive at all.** Removing them immediately would break every stylesheet written against current implementation output, with no migration window. Emitting both names costs a few bytes per row. Binding the sunset to the already-scheduled #242 cutover means the deprecation ends at a date the project has already committed to.

**Why block lists rather than inline comma-joining.** An inline join is lossy: an entry containing a comma becomes indistinguishable from two entries. A block list is unambiguous, and it is the only form that can host a multi-line entry.

**Why relation rows keep their comma-join.** A relation row's value is a set of resolved links, not independently authored values; the ambiguity argument does not apply, and re-opening a ratified rule is outside this RFC's remit.

**Why `text` carries no bold requirement.** The Heading Hierarchy table's preamble scopes it to `markdown`, `html`, and `adoc`. Plain text has no portable emphasis convention — `*label*` in plain text is a literal asterisk — so requiring emphasis there would mandate visible noise.

**Why whitespace is excluded from the `html` normative form.** `[CR-036-15]` already decided this for the one other pinned HTML form in the specification, and decided it the same way. Following that precedent keeps the two consistent. The RECOMMENDED single-line serialisation gives fixtures something byte-comparable without turning an insignificant difference into a conformance failure.

**Why the baseline performs no markup conversion.** Converting requires knowing which values are markup, and the model carries no such signal at the baseline: `fieldType.format` is not a render-mode switch and no rule maps it to one. Guessing — treating `text` datatype as markdown, say — would make `html` output depend on an inference the spec does not license. Emitting escaped literal text is the honest behaviour, and conversion remains available through a Theme or L1 View.

---

## Alternatives Considered

### Alt A — Declare the markdown form a theme default rather than a baseline

Under this alternative the baseline would emit an abstract label/value pair and every concrete form would come from a Theme. It was not chosen because it does not close the gap: RFC-027's Rows bullet would still point at a form that theme-less output does not define, and the `srs` repository — which declares no themes — would still have undefined output for #242's fixture. Decision 1 settled this: theme-less output must remain defined.

### Alt B — Amend Step 2 so an empty string is present

This would make the committed empty rows conformant by changing the rule rather than the implementation. Rejected because it preserves generated defects as specification: a label with no value carries no information, and Step 2's existing "non-null and non-empty-string" test is the correct semantics. Decision 5 settled it.

### Alt C — Humanise the `Field.name` fallback

Reusing RFC-027's humanization ladder would turn `instance_id` into `Instance id` automatically. Rejected because it silently overrides authored intent — an author who wants human-facing text has `displayLabel`, and a baseline that rewrites labels makes the rendered output non-invertible against the record. Decision 7 settled it.

### Alt D — Extend the mandated vocabulary to all client surfaces

Requiring `srs-web` cards and the `srs-vscode` record view to adopt these class names would converge three DOM vocabularies into one. Rejected because those surfaces do not emit a `DocumentView`; `capability-layering.md` assigns UI layout to clients, and mandating a document-rendering vocabulary in a native card component would constrain UI work for no interoperability gain. Decision 8 drew the boundary at the `DocumentView` conformance surface.

### Alt E — Convert markup-bearing values to HTML in the `html` baseline

This would make `html` output of this repository's own spec bodies render as formatted HTML rather than literal markdown source. Rejected because it requires a per-value markup signal the model does not carry, and because decision 3 states that content is escaped. Adopting it would also diverge from `[CR-036-15]`, which escapes all cell content. Recorded as Open Question 5 so the limitation is visible.

---

## Open Questions

1. **Step 2's presence test still uses pre-RFC-032 vocabulary.** RFC-001 Step 2 defines multi-entry presence via `ext:repeatable-fields` and `FieldAssignment.repeatable === true`, while RFC-032 `[R4]` makes `fieldType.cardinality` "the sole cardinality mechanism — former `multiselect` and standalone `repeatable` are subsumed here". This RFC's rules are written across both mechanisms so they are correct under either, and deliberately do not re-key Step 2 — that would be a model-level change beyond this remit. Reconciling Step 2 with RFC-032 warrants its own follow-up issue.

2. **Value stringification for non-string datatypes is undefined.** `fieldType.datatype` admits `string`, `number`, `integer`, `boolean`, `date`, `date-time`, `ref`, `dependent`, and `map`. This RFC defines the row *form* but not how a boolean, a date, or a `map` becomes the `<value>` inside it, so byte-comparable output is not yet achievable for those datatypes. The gap predates this RFC — RFC-001 Step 4 never defined it either — and closing it is a separate piece of work. Flagged rather than guessed.

3. **`pdf` and `docx` row forms.** `[FR-037-14]` covers `pdf` for class injection because `[T-8]` already does, but this RFC defines no row form for paginated formats, and `[FR-037-14]` therefore names classes without naming the elements that carry them. `[FR-037-15]` leaves relation rows in those formats implementation-defined. Out of scope; flagged so the omission is visible rather than implied.

4. **Labels are emitted verbatim and can therefore be ambiguous.** A `displayLabel` containing `*`, `**`, or a colon produces output that a consumer splitting on the first colon will misparse. Escaping labels was rejected because it would corrupt authored markup symmetrically. Whether labels should be constrained at authoring time instead is left open.

5. **`html` baseline output shows markup-bearing values as literal source.** A consequence of `[FR-037-17]`, stated in Change F and Alt E. Whether the baseline should eventually carry a markup signal is left open.

6. **`document-view.json`'s `emptyBehavior` description is section-level while the rule is per-field.** Pre-existing drift that `[FR-037-11]` makes load-bearing. Not corrected here because it would trigger schema mirror-sync for a description-only change; see *Schema changes*.

7. **Two points are composed from the decisions rather than stated by them**, marked *Derived, not decided* at their definitions. Spec research returned `UNRESOLVED` on both:
   - whether a multi-entry `<li>` carries the value classes and whether the `<ul>` takes a class of its own (Change B1);
   - whether a value-less label line retains its trailing colon (Change B).

   Neither was escalated as a blocking owner decision: decisions 3, 4 and 9 settle the substance in each case, and what remains is composition of the form this RFC exists to write. Both are called out so the owner can overturn either at review.
