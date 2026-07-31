> **GitHub issue**: [the-greenman/srs#294](https://github.com/the-greenman/srs/issues/294)

# RFC-037: Normative field-row rendering baseline

**Status**: Draft (Revision 1)
**Affects**: `ext:views-l2` (RFC-001 Change A, Default Rendering Baseline Step 4; Heading Hierarchy table), `ext:themes-l1` (RFC-002 Rule `[T-8]` CSS class injection, `ElementTemplates.fieldRow`), RFC-027 Change C rule 3 (relation row shape), RFC-036 composite row-template ladder (Open Question 2)
**Author**: the-greenman (design decisions of 2026-07-31 on #294); drafted by the epic-256 worker
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft. Encodes the nine owner decisions of 2026-07-31 on #294 as normative rules `[FR-037-1]`–`[FR-037-14]`. |

---

## Abstract

RFC-001 Change A defines a Default Rendering Baseline in four steps: it fixes *which* fields render, in *what* order, and with *what* label — then stops. "Step 4 — Render" never says what a rendered field row **is**. This RFC supplies the missing referent: the normative emitted form of a field row in `markdown`, `adoc`, `text`, and `html`, for both single-valued and multi-entry values.

Doing so repairs a live defect rather than only filling a gap. RFC-027 Change C rule 3 is a ratified **MUST** requiring `html`, `adoc`, and `text` relation rows to use "the same label/value markup that implementation emits for a field row in that format" — a referent that does not exist for three of the four formats, making the rule unsatisfiable as written. This RFC gives it one. It also pins the portable placeholder, corrects the `[T-8]` field-name CSS class to derive from `Field.name` rather than `FieldAssignment.displayLabel`, brings the load-bearing label/value class names inside the contract, and makes an empty-string value absent in rendering as RFC-001 Step 2 already declares it to be.

---

## Motivation

### Problem 1 — "Step 4 — Render" does not define the emitted form

RFC-001's own problem statement is candid about this class of defect (`rfcs/rfc-001.md:47`):

> No definition of "default rendering" appears anywhere in the spec. Two conformant implementations will produce incompatible output for the same `DocumentView` — and neither is wrong, because there is no baseline to violate.

RFC-001 closed that gap for selection, ordering, and labelling. It left the emitted form open. The current Step 4 text (`srs/records/subsections/07-7-ext-views-l2.json`, rendered at `docs/spec/srs-spec.md:1847`) says only which fields to render and that presentation of multiple entries "is implementation-defined".

`ext:themes-l1` does not close it either. `ElementTemplates.fieldRow` is specified purely as a **wrapper** — "Wraps each field label + value pair", receiving `{{content}}` — and RFC-002 is explicit that element templates "receive finished content and wrap it — they do not re-render" (Rule `[T-3]`). The unwrapped element that `{{content}}` carries is precisely the thing nothing defines. RFC-002 even states that "when neither is set, the element is rendered without wrapping", naming the unspecified case without specifying it.

The asymmetry is the cleanest statement of the problem: `format: "json"` is fully pinned by a real schema (`docs/schema/2.0/document-view-output.json`). The rendered formats have no equivalent.

### Problem 2 — RFC-027 carries a live unsatisfiable MUST

RFC-027 specifies relation rows by pointing at the field row (`rfcs/rfc-027-document-view-relations-presentation.md:99`, folded into the canonical spec at `docs/spec/srs-spec.md:1709`):

> In `markdown` the normative row form is `**<label>**: <display label>, <display label>` on its own line. In `html`, `adoc`, and `text`, the row **MUST** use the same label/value markup that implementation emits for a field row in that format, with the row label in the label position.

Two consequences follow. First, the markdown field-row form `**<label>**: <value>` **is** already normative today — but only obliquely, as a side effect of specifying something else. Second, for `html`, `adoc`, and `text` the rule cannot be satisfied by any implementation, because there is nothing to conform to.

### Problem 3 — The only other normative pin is weak, and one format fails it

The `ext:views-l2` Heading Hierarchy table (`docs/spec/srs-spec.md:1881`) states:

> | Field label | Bold/formatted text — not a heading | Always |

This constrains only the label, offers a disjunction with no resolution, and says nothing about the separator, the value, or containment. What it does firmly exclude is "field label as a heading". A format that emits an undecorated `Label: value` — as `adoc` does in the reference implementation — satisfies neither disjunct.

### Problem 4 — The CSS class contract is derived from the wrong string, and half of it is outside the contract

Rule `[T-8]`'s injection table mandates `srs-fieldname-{fieldName}` for a field row, and RFC-002's template variable table defines `{{field-name}}` as "`Field.name` for the current field" — so `{fieldName}` unambiguously means `Field.name`. Deriving it instead from `FieldAssignment.displayLabel` makes the class unstable under a rendering-only change: a Type that sets `displayLabel: "Decision Rationale"` on field `rationale` would emit `srs-fieldname-decision-rationale`, and any stylesheet written against the published spec breaks. `displayLabel` is rendering-only and view-owned; a semantic identity hook must not depend on it.

Separately, a stylesheet cannot distinguish label from value using only `srs-field` and `srs-fieldname-*` — which is most of the point of a themes extension. Any implementation that is useful in practice therefore emits label/value class names that appear in no RFC, no record, and no schema, and that collide freely with host-page CSS.

### Problem 5 — An empty string renders, contradicting Step 2

Step 2 already declares that a field whose `FieldValue.value` is an empty string is **absent**, and Step 4 says absent fields are omitted. An implementation that treats `""` as a present value emits a label with no value — `**Content**: ` with a trailing space. This repository's own committed exports contain 92 such rows; `docs/spec/srs-spec.md:7` is one of them.

This is a conformance failure against the spec **as it already stands**, not a gap this RFC creates. It is recorded here because the correction is an expected export-diff event that must be anticipated rather than discovered (see *Expected export diff*).

### Problem 6 — RFC-036's row-template ladder bottoms out here

RFC-036 specifies composite baseline rendering, whose row-template ladder is `compositeFieldRowTemplates` → `fieldRow` → *the implementation's existing top-level field-row form*. That last rung is this gap; RFC-036 deliberately did not close it (its Open Question 2) because the gap predates RFC-036 and is spec-wide rather than composite-specific.

It becomes load-bearing at the point issue #242 reaches. The `srs` repository declares no themes, so every row of #242's spec-side parity fixture renders through precisely this undefined rung. Capturing that fixture against unspecified behaviour would freeze the current implementation as a golden without anyone having decided it is correct.

---

## Proposed Changes

Throughout, **row label** means the string resolved by RFC-001 Step 3 (`FieldAssignment.displayLabel`, falling back to `Field.name`), and **field identity** means `Field.name` — the two are distinct inputs and are never interchanged.

A field renders as **multi-entry** when the presence test of RFC-001 Step 2 is satisfied by an ordered sequence of entries rather than a single scalar value. This RFC is deliberately neutral about which model mechanism produces that sequence: it covers both `fieldType.cardinality: "list"` (RFC-032 R4, the current mechanism) and the legacy `ext:repeatable-fields` / `FieldValue.entries` path that Step 2 still names. See *Open Questions* on that vocabulary drift.

### Change A — Normative scalar field-row form

For a present field with a single value, the baseline MUST emit exactly one row per field, in the format-specific form below.

| Format | Normative row form |
|---|---|
| `markdown` | `**<label>**: <value>` on its own line |
| `adoc` | `*<label>*: <value>` on its own line |
| `text` | `<label>: <value>` on its own line |
| `html` | the element structure in Change A1 |

`markdown` ratifies the form that RFC-027 Change C rule 3 already made normative by reference. `adoc` uses AsciiDoc bold (`*…*`), satisfying the Heading Hierarchy table's "Bold/formatted text" requirement that an undecorated `Label: value` fails. `text` carries no bold requirement — the Heading Hierarchy table applies to `markdown`, `html`, and `adoc` only, and plain text has no portable emphasis convention.

In all three text formats the separator is a literal colon followed by a single space (U+003A U+0020) between the label and the value.

#### Change A1 — `html` scalar structure

The `html` scalar row is:

```html
<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>: <span class="srs-field-value field-value">{value}</span></div>
```

where `{name}` is `Field.name` normalised by the `[T-8]` five-step rule, `{label}` is the row label, and `{value}` is the rendered value.

Normative in this structure are: the element names and their nesting (`div` > `strong`, `span`), their order, the literal colon between `</strong>` and the value element, and the `srs-`-prefixed class names. Inter-element whitespace is **not** normative — an implementation MAY emit the structure across multiple indented lines.

This follows the precedent `[CR-036-15]` sets for pinned HTML output (`rfcs/rfc-036-composite-rendering.md:537-538`):

> This rule pins the elements, `<colgroup>` cardinality, rounding and escaping; it does not pin inter-element whitespace, so the migration parity gate is measured against the reference implementation's own output rather than against a byte form this RFC determines.

`[CR-036-15]` is self-scoped ("*This rule* pins…"), so `[FR-037-3]` states the exclusion for itself rather than relying on a repo-wide principle that the spec does not assert. Implementations SHOULD emit the single-line form above so that conformance fixtures have a canonical serialisation to compare against.

### Change B — Normative multi-entry field-row form

A multi-entry value MUST render as a block list, never as an inline comma-joined string. The label occupies its own line (or, in `html`, its own element), and each entry is a list item.

| Format | Label line | Entry marker |
|---|---|---|
| `markdown` | `**<label>**:` | `- ` |
| `adoc` | `*<label>*:` | `* ` |
| `text` | `<label>:` | `- ` |
| `html` | `<strong class="srs-field-label field-label">{label}</strong>:` | `<li>` (Change B1) |

The label line retains the trailing colon and carries no value.

> **Derived, not decided.** Spec research returned **UNRESOLVED** on this point: nothing in the specification states whether a value-less label line keeps its colon, and RFC-036 records that the question never arose because a field with no value is omitted outright (`rfcs/rfc-036-composite-rendering.md:220-221`). The colon is retained here because decision 9 requires the label/value structure and punctuation to remain identical across the shared relation/field primitive, and dropping it in the block form alone would make the punctuation vary by cardinality. Flagged for review.

In `markdown`, `adoc`, and `text`, the entry list begins on the line immediately after the label line, with no blank line between them, and entries appear in `FieldValue.entries` order.

#### Change B1 — `html` multi-entry structure

```html
<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>:<ul><li class="srs-field-value field-value">{entry}</li></ul></div>
```

One `<li>` is emitted per entry, in order, each carrying the value class names. The `<ul>` element itself carries no class.

> **Derived, not decided.** Decision 4 fixes the markup shape — "`<ul>` with one value-bearing `<li>` per entry" — and decision 3 fixes the class vocabulary, but neither states whether the `<li>` carries the value classes or whether the `<ul>` takes a class of its own. Spec research returned **UNRESOLVED**: the specification contains no `<ul>`/`<li>` token anywhere, and `[T-8]`'s injection table has no row below "Field row". This RFC composes the two decisions in the way that invents least — the `<li>` is the value-bearing element, so it takes the value role's classes, and no new class name is introduced for the `<ul>`. Flagged here so the composition is visible for review rather than absorbed silently.

#### Change B2 — Continuation indentation

When a single entry's rendered value spans more than one line, every line after the first MUST be indented so that it aligns with the entry's content column — two spaces in `markdown` and `text` (the width of `- `), and two spaces in `adoc` (the width of `* `). This keeps the continuation inside its list item rather than terminating the list.

Continuation indentation applies to **entries only**. A single-valued field's value is emitted verbatim after the label, and any lines it contains after the first are emitted at column zero, unindented and unaltered. Indenting a scalar value would corrupt every multi-line markdown body in this repository's own projection — see Change F.

### Change C — Empty values and the portable placeholder

**An empty string is absent.** RFC-001 Step 2 already states this; this RFC adds no new presence semantics and amends nothing in Step 2. What it adds is the consequence: a field that Step 2 finds absent MUST NOT emit a row, and in particular MUST NOT emit a label with an empty value.

When `DocumentSection.emptyBehavior` is `"show-placeholder"` **and** the field is `required: true` in the Type, the baseline MUST emit a row whose value position carries the literal placeholder `(empty)`. RFC-001's Step 4 previously left this as a MAY with no form given; the form is now fixed so that placeholder output is portable across implementations. In `html`, the value element additionally carries the class `srs-empty-value`:

```html
<span class="srs-field-value field-value srs-empty-value">(empty)</span>
```

Outside that condition — absent and not (`show-placeholder` and `required`) — no row is emitted at all.

**Scope against RFC-036.** This placeholder rule governs top-level field rows on the Default Rendering Baseline only. It does not disturb RFC-036 Change C item 3 (`rfcs/rfc-036-composite-rendering.md:220-224`), under which a field row *inside a composite block* whose value renders to nothing "MUST be omitted, unconditionally" and which `ExportConfig.omitEmptyFields` explicitly does not govern. The two rules operate at different levels and do not overlap: `DocumentSection.emptyBehavior` reaches the section's own field rows, not the assignments on a composite's `rangeType`.

### Change D — Class vocabulary and the `[T-8]` amendment

Rule `[T-8]`'s injection table row for a field row is amended to name the label and value elements, and to state the derivation of the field-identity class explicitly:

| Element | Classes always applied | Classes conditionally applied |
|---|---|---|
| Field row | `srs-field`, `srs-fieldname-{fieldName}` where `{fieldName}` is **`Field.name`** | — |
| Field row label | `srs-field-label` (+ alias `field-label`) | — |
| Field row value | `srs-field-value` (+ alias `field-value`) | `srs-empty-value` when the value is the `(empty)` placeholder |

`{fieldName}` MUST be derived from `Field.name` and MUST NOT be derived from `FieldAssignment.displayLabel`. This is a clarification of `[T-8]`'s existing intent, not a change to it: RFC-002's template variable table already defines `{{field-name}}` as "`Field.name` for the current field".

The unprefixed names `field-label` and `field-value` are **temporary compatibility aliases**. They are emitted alongside the prefixed names so that stylesheets written against existing implementation output continue to work. Only the `srs-`-prefixed names form the forward contract; a conforming stylesheet MUST NOT rely on the unprefixed names.

**Sunset.** The aliases are deprecated on acceptance of this RFC and are removed at the #242 cutover — the same cutover at which RFC-036 `[CR-036-19]` retires `FieldGroup` and its `[T-Gx*]` / `[T-Cx*]` rules. Binding the sunset to an already-scheduled cutover avoids introducing a second deprecation clock. After that cutover, implementations MUST emit only the prefixed names.

### Change E — Relation rows share the row primitive

RFC-027 Change C rule 3's reference to "the same label/value markup that implementation emits for a field row in that format" now has a defined referent for all four formats: Change A for a single related instance and, where a row carries several, the comma-joined display-label string that RFC-027 rule 3 already specifies, placed in the value position. RFC-027's own ordering, humanization, and determinism rules are unchanged.

Relation rows pass **relation identity** where a field row passes `Field.name`, so that `srs-fieldname-*` is never populated from a relation type key. Relation-specific wrapper classes MAY be applied additively, provided the label/value structure and punctuation are identical to the field row.

Note that RFC-027 rule 3 comma-joins multiple related instances into one row. That is a relation-row rule and is deliberately left intact; it is **not** overridden by Change B's prohibition on comma-joining, which governs multi-entry *field values*.

### Change F — Value content is emitted verbatim in text formats

In `markdown`, `adoc`, and `text`, the baseline MUST emit the rendered value verbatim and MUST NOT escape, quote, or otherwise alter it. Field values in this model routinely *are* markup — this specification's own body fields carry markdown that the projection renders as live markdown (`docs/spec/srs-spec.md:10-14`). Escaping them would corrupt the projection.

In `html`, label and value content MUST be HTML-escaped (`&`, `<`, `>`; and `"` where the content reaches an attribute position). Class-name components are separately normalised by the `[T-8]` five-step rule, which already removes every character that could escape an attribute.

### Change G — Conformance boundary

These rules bind any implementation that emits a `DocumentView` in `markdown`, `adoc`, `text`, or `html` through the Default Rendering Baseline. They do **not** bind native application UI that is not emitting a `DocumentView` — `srs-web` record cards, the `srs-vscode` record and editor views, and comparable surfaces are out of scope, and their independent DOM vocabularies are not a defect. A client-side renderer that emits a `DocumentView` in a covered format is **not** exempt.

This RFC makes no claim that independent native client DOM violates `capability-layering.md`. That document assigns format-specific rendering and UI layout to clients; divergence matters only where a surface claims to emit the normative `DocumentView` format.

### Change H — Label resolution is unchanged

Label resolution remains exactly RFC-001 Step 3: `FieldAssignment.displayLabel`, falling back to raw `Field.name`. The baseline MUST NOT humanise, case-convert, or otherwise transform the fallback. A snake_case `Field.name` therefore renders as-is, and authors who want human-facing text set `displayLabel`.

This is stated as an explicit non-change because RFC-027 defines a humanization ladder for relation type keys, and the absence of a corresponding rule here is a decision rather than an omission. Relation labels are derived from a type key that has no authored alternative; field labels have `displayLabel`.

RFC-036's composite baseline uses a three-rung ladder, `FieldAssignment.displayLabel` → `Field.name` → `fieldId` (`rfcs/rfc-036-composite-rendering.md:232`). That third rung is composite-specific — it covers an assignment on a `rangeType` whose Field cannot be resolved — and is not carried into the top-level baseline, which RFC-001 Step 3 already terminates at `Field.name`. The two ladders are consistent where they overlap.

---

## Conformance Rules

> **[FR-037-1]** These rules apply to any implementation emitting a `DocumentView` in `markdown`, `adoc`, `text`, or `html` via the Default Rendering Baseline (RFC-001 Change A). They MUST NOT be construed to bind rendering surfaces that do not emit a `DocumentView`. A client-side `DocumentView` renderer in a covered format is not exempt.
>
> **[FR-037-2]** For a present single-valued field, implementations MUST emit exactly one row: `markdown` — `**<label>**: <value>`; `adoc` — `*<label>*: <value>`; `text` — `<label>: <value>`; each on its own line, with a literal U+003A U+0020 separating label from value.
>
> **[FR-037-3]** For a present single-valued field in `html`, implementations MUST emit a `div` carrying `srs-field` and `srs-fieldname-{fieldName}`, containing a `strong` carrying `srs-field-label`, a literal colon, and a `span` carrying `srs-field-value`, in that order. Element names, nesting, order, the literal colon, and the `srs-`-prefixed class names are normative; inter-element whitespace is not. Implementations SHOULD emit the structure on a single line.
>
> **[FR-037-4]** For a present multi-entry field, implementations MUST render the value as a block list and MUST NOT comma-join entries. The label MUST occupy its own line (or, in `html`, its own `strong` element) and MUST retain its trailing colon. Entry markers are `- ` in `markdown` and `text`, `* ` in `adoc`, and `<li>` in `html`. Entries MUST appear in `FieldValue.entries` order.
>
> **[FR-037-5]** In `html`, a multi-entry value MUST be emitted as a `ul` containing one `li` per entry, each `li` carrying the field-value class names. The `ul` MUST NOT carry a class.
>
> **[FR-037-6]** When an entry's rendered value spans multiple lines, implementations MUST indent every line after the first by two spaces in `markdown`, `adoc`, and `text`. Implementations MUST NOT apply continuation indentation to a single-valued field's value, which MUST be emitted verbatim.
>
> **[FR-037-7]** A field that RFC-001 Step 2 resolves as absent — including a field whose `FieldValue.value` is an empty string — MUST NOT emit a row, except under `[FR-037-8]`. Implementations MUST NOT emit a label with an empty value.
>
> **[FR-037-8]** When `DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true` in the Type, implementations MUST emit a row whose value position carries the literal string `(empty)`. In `html`, that value element MUST additionally carry `srs-empty-value`.
>
> **[FR-037-9]** The `{fieldName}` component of `srs-fieldname-{fieldName}` MUST be derived from `Field.name`, normalised by the `[T-8]` five-step rule. Implementations MUST NOT derive it from `FieldAssignment.displayLabel`.
>
> **[FR-037-10]** For `html` and `pdf` output, implementations MUST emit both the `srs-`-prefixed class names and their unprefixed aliases (`field-label`, `field-value`) until the #242 cutover, and MUST emit only the prefixed names thereafter. Stylesheets claiming conformance MUST NOT depend on the unprefixed aliases.
>
> **[FR-037-11]** Relation rows (RFC-027 Change C rule 3) MUST use the row forms defined by `[FR-037-2]` and `[FR-037-3]`, with the resolved relation label in the label position. Implementations MUST pass relation identity, not `Field.name`, when rendering a relation row, so that `srs-fieldname-*` is never populated from a relation type key. Relation-specific wrapper classes MAY be applied additively provided label/value structure and punctuation are unchanged. RFC-027 rule 3's comma-joining of multiple related instances within one row is unaffected by `[FR-037-4]`.
>
> **[FR-037-12]** In `markdown`, `adoc`, and `text`, implementations MUST emit rendered value content verbatim and MUST NOT escape or alter it. In `html`, implementations MUST HTML-escape label and value content.
>
> **[FR-037-13]** Label resolution MUST remain `FieldAssignment.displayLabel` falling back to raw `Field.name`. Implementations MUST NOT humanise or case-convert the fallback.
>
> **[FR-037-14]** The forms defined by `[FR-037-2]`–`[FR-037-6]` are the content that `ElementTemplates.fieldRow` receives as `{{content}}`. A Theme MAY wrap or replace the row through `fieldRow`; when no `fieldRow` template resolves, implementations MUST emit these forms unwrapped. This satisfies the bottom rung of RFC-036's row-template ladder (`compositeFieldRowTemplates` → `fieldRow` → baseline field-row form).

---

## Schema changes

**None.**

This RFC specifies the emitted form of rendered output. It introduces no new entity property, changes no existing entity shape, and adds no portable enum value. `docs/schema/2.0/document-view-output.json` governs the `json` projection only and is unaffected — the `json` format was already fully pinned, which is the asymmetry Problem 1 identifies.

Because no schema file changes, no mirror sync is required in `srs-rust/crates/srs-schema/schemas/2.0/` or `srs-vscode/schemas/2.0/`.

---

## Expected export diff

Correcting Problem 5 deletes the 92 committed empty-value rows measured in this repository's exports:

| file | empty-value rows |
|---|---:|
| `docs/spec/srs-unified.md` | 45 |
| `docs/spec/srs-rationale.md` | 43 |
| `docs/spec/srs-spec.md` | 2 |
| `docs/spec/profiles/docx-dita-adoption.md` | 2 |
| **total** | **92** |

**Those deletions are not part of this RFC's own diff.** They occur only when the reference implementation changes (srs-rust#782) and the exports are re-rendered through the corrected binary. `docs/spec/` is generated output; hand-editing it to match a rule no implementation yet enforces would put a false projection in the tree. The deletion is recorded here as an expected future export-diff event, owned jointly with srs-rust#782, so that it is anticipated rather than discovered.

---

## Rationale

**Why ratify the existing markdown form rather than design a new one.** The markdown form `**<label>**: <value>` is already normative by reference through RFC-027 Change C rule 3, and it is what every committed export in this repository contains. Choosing a different form would invalidate the entire committed projection to no benefit. The cheap resolution is the correct one here; the expensive one — designing the row form from scratch — buys nothing that the existing form does not already deliver.

**Why the class identity is `Field.name` and not `displayLabel`.** `displayLabel` is rendering-only and view-owned (RFC-015). A CSS hook keyed to it changes whenever an author retitles a field for presentation, which is exactly when a stylesheet must *not* break. `Field.name` is stable and is what RFC-002's `{{field-name}}` variable already exposes.

**Why the unprefixed aliases survive at all.** Removing them immediately would break every stylesheet written against current implementation output, with no migration window. Emitting both names costs a few bytes per row and lets stylesheets migrate on their own schedule. Binding the sunset to the already-scheduled #242 cutover means the deprecation ends at a date the project has already committed to, rather than starting a second clock that nobody tracks.

**Why block lists rather than inline comma-joining.** An inline join is lossy: an entry containing a comma becomes indistinguishable from two entries. A block list is unambiguous, and it is the only form that can host a multi-line entry at all. The scalar `**Label**: value` form cannot host a block value on one line, which is why the block form moves the label to its own line rather than trying to keep it inline.

**Why relation rows keep their comma-join.** RFC-027 rule 3 joins related instances because a relation row's value is a *set of links*, not a set of independently-authored values; the ambiguity argument above does not apply in the same way, and re-opening a ratified rule is outside this RFC's remit. Change E therefore shares the label/value primitive without disturbing RFC-027's value composition.

**Why `text` carries no bold requirement.** The Heading Hierarchy table's "Bold/formatted text" row is scoped to `markdown`, `html`, and `adoc`; the table's own closing sentence excludes `text` from heading semantics. Plain text has no portable emphasis convention — `*label*` and `**label**` in plain text are literal asterisks, not formatting — so requiring emphasis there would mandate visible noise.

**Why whitespace is excluded from the `html` normative form.** `[CR-036-15]` already decided this question for the one other pinned HTML form in the specification, and decided it the same way: elements, cardinality and escaping are pinned; inter-element whitespace is not. Following that precedent keeps the two pinned HTML forms consistent with each other. The RECOMMENDED single-line serialisation gives conformance fixtures something byte-comparable without turning an insignificant difference into a conformance failure.

---

## Alternatives Considered

### Alt A — Declare the markdown form a theme default rather than a baseline

Under this alternative the baseline would emit an abstract label/value pair and every concrete form would come from a Theme. It was not chosen because it does not close the gap: RFC-027 rule 3 would still point at a form that theme-less output does not define, and the `srs` repository — which declares no themes — would still have undefined output for #242's fixture. Decision 1 settled this: theme-less output must remain defined.

### Alt B — Amend Step 2 so an empty string is present

This would make the 92 committed rows conformant by changing the rule rather than the implementation. It was rejected because it preserves generated defects as specification: a label with no value carries no information, and Step 2's existing "non-null and non-empty-string" test is the correct semantics. Decision 5 settled it.

### Alt C — Humanise the `Field.name` fallback

Reusing RFC-027's humanization ladder would turn `instance_id` into `Instance id` automatically. Rejected because it silently overrides authored intent — an author who wants human-facing text has `displayLabel`, and a baseline that rewrites labels makes the rendered output non-invertible against the record. Decision 7 settled it.

### Alt D — Extend the mandated vocabulary to all client surfaces

Requiring `srs-web` cards and the `srs-vscode` record view to adopt these class names would converge three DOM vocabularies into one. Rejected because those surfaces do not emit a `DocumentView`; `capability-layering.md` assigns UI layout to clients, and mandating a document-rendering vocabulary in a native card component would constrain UI work for no interoperability gain. Decision 8 drew the boundary at the `DocumentView` conformance surface.

---

## Open Questions

1. **Step 2's presence test still uses pre-RFC-032 vocabulary.** RFC-001 Step 2 defines multi-entry presence via `ext:repeatable-fields` and `FieldAssignment.repeatable === true`, while RFC-032 R4 makes `fieldType.cardinality` "the sole cardinality mechanism — former `multiselect` and standalone `repeatable` are subsumed here" (`docs/schema/2.0/field.json`). This RFC is written neutrally across both so that it is correct under either reading, and deliberately does not re-key Step 2 — doing so would be a model-level change beyond this RFC's remit. Reconciling Step 2 with RFC-032 warrants its own follow-up issue.

2. **`pdf` and `docx` row forms.** `[FR-037-10]` covers `pdf` for class injection because `[T-8]` already does, but this RFC defines no row form for paginated formats. They render through a different pipeline and no decision was taken about them. Out of scope here; flagged so the omission is visible rather than implied.

3. **Two points are composed from the decisions rather than stated by them**, and are marked *Derived, not decided* at their definitions. Spec research returned `UNRESOLVED` on both — the specification is silent, so neither could be settled by citation:
   - whether a multi-entry `<li>` carries the value classes and whether the `<ul>` takes a class of its own (Change B1);
   - whether a value-less label line retains its trailing colon (Change B).

   Neither was escalated as a blocking owner decision: decisions 3, 4 and 9 settle the substance in each case, and what remains is composition of the form this RFC exists to write. Both are called out explicitly so the owner can overturn either at review without re-reading the draft for hidden inferences.
