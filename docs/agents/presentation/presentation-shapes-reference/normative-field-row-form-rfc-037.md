# Normative Field-Row Form (RFC-037)

> The emitted form of a field row in a rendered Composition, and on RFC-036 Change C's

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

The emitted form of a field row in a rendered `Composition`, and on RFC-036 Change C's
composite baseline where that baseline emits an individual field row. These forms are the content
`ElementTemplates.fieldRow` receives as `{{content}}`; a Theme may wrap the row and MUST NOT replace
it ([T-3]), and when no `fieldRow` template resolves the forms below are emitted unwrapped. They are
the terminal rung of RFC-036's row-template ladder (`compositeFieldRowTemplates` -> `fieldRow` ->
baseline field-row form), closing RFC-036 Open Question 2.

A composite is a Field whose `fieldType.datatype` is `"ref"` **and** whose `fieldType.mode` is
`"inline"` — the pair [CR-036-3] requires; `inline` is a `mode` value, not a datatype. A composite is
rendered by RFC-036 Change C, not by these rules; these rules govern the field rows *within* each
composite block. A `ref` Field whose `mode` is `"reference"` is **not** a composite and renders as an
ordinary field row under these rules, as [CR-036-3] directs for any Field that is not a `ref`+`inline`
composite.

**Value sequence.** A field renders as multi-entry when Step 2 finds it present through an ordered
sequence. Both mechanisms are covered without preference: `fieldType.cardinality: "list"` (RFC-032
[R4], values carried as a JSON array at the field's key) — the legacy `ext:repeatable-fields` path is removed (RFC-039 [R7]).
(`FieldValue.entries`). *Sequence order* means array index order on the former, `entries` order on
the latter. Cardinality — not element count — selects the form: a one-element sequence renders in
block form, so a Type's rendered shape does not vary with instance data.

**Scalar rows.** For a present single-valued field, exactly one row, beginning on its own line.
Whether the value shares the label's line is a property of the value's own nature, never of the
renderer: a value **opens a block-level construct** when its first line is a fenced code block's
opening fence, an unordered or ordered list item, a table row (`|`), an ATX heading (`#`), a
blockquote (`>`), or a thematic break. A value whose first line is none of these is *inline*.

**Inline**: label and value share the label's line.

| Format | Normative row form |
|---|---|
| `markdown` | `**<label>**: <value>` |
| `adoc` | `*<label>*: <value>` |
| `text` | `<label>: <value>` |
| `html` | `<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>: <span class="srs-field-value field-value">{value}</span></div>` |

**Block-opening (RFC-037 Revision 4)**: the label occupies its own line, retaining the trailing
colon and carrying no value. The value begins on the line immediately following.

| Format | Label line |
|---|---|
| `markdown` | `**<label>**:` |
| `adoc` | `*<label>*:` |
| `text` | `<label>:` |
| `html` | unaffected: the value already sits in its own `span`, distinct from the label |

In the three text formats the separator, where label and value share a line, is a literal colon and
single space (U+003A U+0020); where they do not, the label line ends in the colon itself. In
`html`, the element names, nesting, order, literal colon and `srs-`-prefixed class names are
normative; inter-element whitespace is not, following the precedent [CR-036-15] sets for pinned HTML
output. Implementations SHOULD emit the single-line form so conformance fixtures have a canonical
serialisation. **These classes belong to the baseline's output specification, not to
`ext:themes-l1`:** implementations MUST emit them whether or not that extension is declared and
whether or not a Theme resolves.

The block-opening rule fixes the presentation layer instead of constraining record content
(`finding-153f4d63`): a rendering-layer quirk that dictates what a value may contain is a layer
violation in the direction the charter cares about, and the fix belongs where the defect is.

**Multi-entry rows.** A multi-entry value MUST render as a block list and MUST NOT be comma-joined.
The label occupies its own line (in `html`, its own element) and retains its trailing colon:

| Format | Label line | Entry marker |
|---|---|---|
| `markdown` | `**<label>**:` | `- ` |
| `adoc` | `*<label>*:` | `* ` |
| `text` | `<label>:` | `- ` |
| `html` | the `strong` element, inside the same `div` the scalar row uses | one `<li class="srs-field-value field-value">` per entry inside an unclassed `<ul>` |

The full `html` multi-entry row is:

Example: the html multi-entry field row.

The enclosing `div` is the same one the scalar row uses: a multi-entry row is still a field row and
must carry what [T-8] requires of one.

In the text formats the list begins on the line immediately after the label line with no blank line
between. An entry whose rendered value is empty is omitted from the list; a sequence with no
surviving entries is absent and emits no row.

**Row separation.** In `markdown`, `adoc` and `text`, implementations MUST emit a blank line between
consecutive field rows, and MUST emit a blank line after a block list's final entry before any
following row, heading or relations block. In `html` implementations MUST NOT insert a separator
element between rows. The same separation applies between consecutive relation rows in a links block.
This is structural, not cosmetic: without the blank line a following row is a CommonMark lazy
continuation of the list's last item and is swallowed into it.

**Continuation.** When a surviving entry's value spans several lines, every line after the first is
indented two spaces in `markdown` and `text` — the width of the `- ` marker, and never more, since four
spaces would make the continuation an indented code block. An entry whose value contains a blank line
remains a single list item, its subsequent blocks attached at that same content column; no blank line
terminates the item. In `adoc`, indentation does not attach a block to a list item: implementations
MUST emit a `+` continuation line before each subsequent block, and indentation is not normative there. Continuation applies to entries only — a single-valued field's
value is emitted verbatim, and any further lines sit at column zero, unindented and unaltered.

**Empty and placeholder.** A field Step 2 resolves as absent emits no row. When
`DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true`,
implementations MUST emit a row carrying the literal `(empty)` — this supersedes Step 4's former
MAY. The placeholder row takes scalar form regardless of cardinality. In `html` the value element
additionally carries `srs-empty-value`. The rule does not reach the L1 View path, where
`ExportConfig.omitEmptyFields` governs.

**Class identity.** `{name}` in `srs-fieldname-{name}` is `Field.name` normalised by the five-step
rule ([T-8]), never `FieldAssignment.displayLabel` — a rendering-only label must not move a stylesheet
hook. The class vocabulary and the five-step rule are normative for baseline output independently of
whether `ext:themes-l1` is declared, so a non-declaring implementation is not required to read that
extension in order to comply. A relation row has no `Field.name`: it omits `srs-fieldname-*` and
carries `srs-relationtype-{relationTypeKey}` instead. The five-step rule has no replacement for `/`, so
step 3 deletes it and `core/depends-on` normalises to `coredepends-on` — deterministic, and noted so no
implementer treats it as a bug to fix unilaterally.

**Content.** In `markdown`, `adoc` and `text` the rendered label and value are emitted verbatim and
MUST NOT be escaped or altered, except for the continuation above — field values in this model
routinely are markup. In `html`, label and value content MUST be escaped (`&`, `<`, `>`, `"`, `'`).
The baseline performs no markup conversion, so a markdown-bearing value appears in `html` as literal
source; converted output is a Theme or L1 View concern.

**Labels.** Resolution stays exactly Step 3: `FieldAssignment.displayLabel`, falling back to raw
`Field.name`, with no humanisation or case conversion.
Tier 0 Notes emit no field rows.

**Label mode (amended by RFC-037 Rev 5).** A bound View's `FieldView.labelMode` selects which of two
forms a row takes. `inline`, the default, is every form above. `none` emits the field's rendered
value alone, with no label and no separating colon: in `markdown`, `adoc` and `text` a single-valued
value begins the row at column zero, whether or not its first line opens a block-level construct,
and a multi-entry value keeps its block list with the label line omitted; in `html` the `strong`
label element and the literal colon are not emitted, and the enclosing `div`, its classes and the
value element are unchanged. Row separation, continuation, entry omission, absence, escaping and the
class vocabulary apply to a `none` row exactly as to an `inline` one. A `FieldView` reaches a row
only where a View is bound to the rendering; where none is, `inline` applies.

`labelMode` is presentation only, in the sense Invariant 13 fixes for `displayLabel`, `displayHint`
and `editorHintOverride`: it never affects validation, AI guidance, extraction, `fieldType`
interpretation, Relations or Discovery Text Projection, and it never changes which fields are
present in a Record or in a structured projection of it. It is not a way to remove a field from
rendering. `FieldView.visible` is that, and a row whose label is suppressed still carries its whole
value. `labelMode` is the only mechanism by which a field row's label is omitted: a Theme neither
suppresses a label it did not suppress nor restores one it did, and `fieldRow` keeps wrapping,
unchanged, what the baseline emits ([T-3]).

**[FR-037-20]** `FieldView.labelMode` is an optional string whose value MUST be `"inline"` or
`"none"`; when absent, `"inline"` applies. Under `"inline"` implementations MUST emit the forms above.
Under `"none"`, on every path these rules cover, implementations MUST emit the field's rendered value
with no resolved label and no separating colon, in the per-format forms described above. Row
separation, continuation, entry omission, absence, escaping and the class vocabulary apply
unchanged.

**[FR-037-21]** `labelMode` is presentation only (Invariant 13). It MUST NOT affect validation, AI
guidance, extraction, `fieldType` interpretation, Relations or Discovery Text Projection, and it MUST
NOT change which fields are present in a Record or in any structured projection of it. It MUST NOT be
used to remove a field from rendering; `FieldView.visible` is the sole mechanism for that.

**[FR-037-22]** `FieldView.labelMode` is the only mechanism by which a field row's label is omitted.
A Theme MUST NOT suppress a label that `labelMode` did not, and MUST NOT reintroduce one that it did;
`ElementTemplates.fieldRow` continues to wrap, unchanged, what these rules emit ([T-3]).

**Conformance boundary (amended by RFC-037 Rev 5).** These forms bind any implementation emitting a
`Composition` in `markdown`, `adoc`, `text` or `html`, whether or not a section's `renderViewId` (or
a `typeDispatch` binding) resolves a View for it. A bound View still decides which rows are emitted
and in what order: its `omitEmptyFields`, `fieldOrder` and `preamble` apply unchanged, and [T-10]
still applies `fieldRow` to each surviving row. The forms above say what each surviving row looks
like, on both paths. They do not bind native application UI that is not emitting a `Composition`; a
client-side `Composition` renderer in a covered format is not exempt.
