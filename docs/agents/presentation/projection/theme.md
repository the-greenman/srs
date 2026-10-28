# Theme

> A visual presentation layer attached to a rendered document (stylesheets, typography, assets, cover pages and templates that wrap each structural level of output), declared for named output formats a…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Projection](/agents/presentation/projection.md).

A visual presentation layer attached to a rendered document (stylesheets, typography, assets, cover pages and templates that wrap each structural level of output), declared for named output formats and applied only when the render is in one of them. A theme wraps finished content and may never replace, suppress or reorder it, so removing the theme changes how output looks and never what it says.

**Notes**: The semantic CSS class vocabulary is part of the output specification and not of the theme extension: a conforming implementation emits it whether or not any theme resolves.

## ext:themes-l1

Visual presentation layer for `Composition`. Attaches brand identity, typography, stylesheets, cover pages, and element wrapping to a rendered document without altering its semantic structure. Depends on `ext:views-l2`. Implementations that do not declare this extension MUST ignore `Composition.themeRef` and `Composition.themeVariants` and MUST NOT error on their presence.


## `AssetDeclaration`

A named asset (image, font, stylesheet, or data file) referenced in templates via `{{asset:name}}`.

Example: the `AssetDeclaration` shape.

Assets are declared in `Theme.assets` as a named dictionary. Asset names MUST be unique within the Theme.


## `PageTemplates`

Page-level chrome for paginated output formats (`"pdf"`, `"docx"`). Ignored for non-paginated formats.

Example: the `PageTemplates` shape.


## `ElementTemplates`

Templates that wrap auto-rendered content at each structural level. Each template receives finished content as `{{content}}` and wraps it — it does not re-render or reorder content.

Example: the `ElementTemplates` shape.

Override precedence: a specific override always takes precedence over the corresponding universal template. When neither is set, the element is rendered without wrapping.


## `StylesheetDeclaration`

Example: the `StylesheetDeclaration` shape.


## `TypographyHints`

Informative declarations. No normative rendering behaviour is derived from these values.

Example: the `TypographyHints` shape.


## `Theme`

Example: the `Theme` shape.

`Package` gains `themes?: Theme[]` when `ext:themes-l1` is declared. When `ThemeReference.mode === "bundled"`, the referenced `themeId` MUST appear in `Package.themes[]` (Rule [T-5]). `Reference.definitionType` and `ImportRecord.definitionType` gain `"theme"` as a portable value.


## CSS Class Injection

For `"html"` and `"pdf"` output, implementations MUST add semantic CSS classes to the rendered elements named in the table below. RFC-037 adds the field-row label and value elements, which are not wrappers.

**Class name normalisation** (5-step rule applied to all identifier components):
1. Convert to lowercase
2. Replace underscores, spaces, and dots with hyphens
3. Remove characters that are not alphanumeric or hyphens
4. Collapse consecutive hyphens to a single hyphen
5. Trim leading and trailing hyphens

| Element | Classes always applied | Classes conditionally applied |
|---|---|---|
| Document wrapper | `srs-document` | — |
| Section wrapper | `srs-section`, `srs-section-{sectionId}` | — |
| Record wrapper | `srs-record`, `srs-type-{typeNamespace}-{typeName}` | `srs-field-{fieldName}-{normalisedValue}` for each `cssClassFields` entry with a matching non-empty Field eligible under [T-9] |
| Field row | `srs-field`, `srs-fieldname-{fieldName}` where `{fieldName}` is `Field.name` | `srs-relationtype-{relationTypeKey}` in place of `srs-fieldname-*` on a relation row |
| Field row label | `srs-field-label` (+ compatibility alias `field-label`) | — |
| Field row value | `srs-field-value` (+ compatibility alias `field-value`) | `srs-empty-value` when the value is the `(empty)` placeholder |


## Template Variable Reference

Variables not applicable to a given template context MUST resolve to an empty string.

| Variable | Available in | Resolves to |
|---|---|---|
| `{{container-title}}` | All | Container title from manifest |
| `{{container-id}}` | All | Container UUID |
| `{{date}}` | All | Render date (ISO 8601 date) |
| `{{heading-1}}` | `coverPage` only | Heading prefix at level `1 + depthOffset`. MUST resolve to empty string in all element wrapper templates. |
| `{{asset:name}}` | All | Resolved asset reference (URL, data URI, or path) |
| `{{section-title}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.title` |
| `{{section-id}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.sectionId` |
| `{{record-heading}}` | `recordWrapper`, `recordWrapperOverrides` | `titleFieldId` field value, or empty string |
| `{{type-namespace}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeNamespace` |
| `{{type-name}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeName` |
| `{{field-label}}` | `fieldRow` | Display label for the field |
| `{{field-value}}` | `fieldRow` | Rendered value of the field |
| `{{field-name}}` | `fieldRow` | `Field.name` |
| `{{content}}` | All element templates | Auto-rendered content this template wraps |
| `{{page-number}}` | `pageHeader`, `pageFooter` | Current page number (paginated formats only) |


## Conformance Rules

**[T-1]** Implementations that do not declare `ext:themes-l1` MUST ignore `Composition.themeRef` and MUST NOT error on its presence.

**[T-1b]** `Theme.targets` MUST contain at least one entry. An absent or empty `targets` array is a validation error. Enforced at package validation time.

**[T-2]** Implementations MUST apply a Theme only when `Composition.format` appears in `Theme.targets`. When the format does not match, the Theme MUST be ignored and structural output produced without it.

**[T-3]** Element templates receive auto-rendered content via `{{content}}`. Implementations MUST render structural content first and pass it to the template; they MUST NOT suppress or reorder content through template evaluation.

**[T-4]** Asset names within a single `Theme.assets` dictionary MUST be unique (case-sensitive).

**[T-5]** When `ThemeReference.mode === "bundled"`, the referenced `themeId` MUST appear in `Package.themes[]`. A missing theme in a bundled package is a validation error.

**[T-6]** Template variables not recognised by the implementation MUST be passed through as literal text. They MUST NOT cause a rendering error.

**[T-6b]** `{{heading-1}}`, `{{heading-2}}`, and `{{heading-3}}` MUST resolve to the empty string in all element wrapper templates (`documentWrapper`, `sectionWrapper`, `sectionWrapperOverrides`, `recordWrapper`, `recordWrapperOverrides`, `fieldRow`, `pageHeader`, `pageFooter`). Structural headings are delivered inside `{{content}}` and MUST NOT be re-emitted. `{{heading-1}}` is available only in `PageTemplates.coverPage`.

**[T-7]** When `recordWrapperOverrides` contains an entry whose `typeId` matches the current record's `typeId`, that template MUST be used instead of `recordWrapper`. When `sectionWrapperOverrides` contains an entry whose `sectionId` matches the current section's `sectionId`, that template MUST be used instead of `sectionWrapper`. Override arrays MUST NOT contain duplicate `typeId` or `sectionId` values. Enforced at package validation time.

**[T-8]** For `"html"` and `"pdf"` output, implementations MUST apply the CSS classes in the injection table to each rendered element named in that table. Class name components MUST be normalised using the five-step rule. The `{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from `FieldAssignment.displayLabel` (RFC-037 [FR-037-12]) — `{{field-name}}` in the template variable table already carries that meaning. The rule text now names elements rather than wrapper elements because the label and value rows added by RFC-037 are not wrappers.

**[T-9]** A Field listed in `Theme.cssClassFields` generates a CSS class only when it is effective-single (`fieldType.cardinality` absent/`"single"` and, until #242 Phase B, effective `FieldAssignment.repeatable !== true`), `fieldType.datatype == "string"`, and `fieldType.format` is absent or one of `"plain"` or `"markdown"`. `valueDomain` may be open or closed. URI-, UUID-, and email-formatted strings, list/repeatable Fields, and every non-string or composite datatype are silently skipped. Absent or empty fields generate no class. This preserves scalar legacy `string`, `text`, and `select`; the scalar requirement intentionally closes the previously undefined array-to-one-CSS-class case. (RFC-032 Rev-7 erratum.)

**[T-10]** When `DocumentSection.renderViewId` is set, `fieldRow` MUST be applied to each FieldView row that survives `ExportConfig.omitEmptyFields` filtering, in `View.fieldViews[].order`. `fieldRow` MUST NOT wrap RecordPropertyView rows or `ExportConfig.preamble` content.

**[T-11]** Implementations that support `ext:themes-l1` MUST accept `"theme"` as a valid value for `Reference.definitionType` and (when `ext:import-tracking` is also declared) for `ImportRecord.definitionType`. A `definitionType: "theme"` value MUST NOT cause a validation error.

**[T-Gx1]** When `FieldGroup.compositeRenderer` is set to a known value, implementations MUST NOT apply `groupFieldRowTemplates` to that group's entries. `groupFieldRowTemplates` MUST only be applied when the group is rendered by the per-field baseline (i.e. `compositeRenderer` is absent or falls back via `[FG-Cx1]`).

**[T-Gx2]** Field names in `groupFieldRowTemplates` that do not appear in the rendered group MUST be silently ignored and MUST NOT cause an error.

**[T-Gx3]** When a field row in a group entry is covered by a matching key in `groupFieldRowTemplates`, implementations MUST use that template instead of `fieldRow`. The `fieldRow` template MUST NOT be applied to field rows rendered via `groupFieldRowTemplates`.

**[T-Cx1]** When `compositeRendererConfig["table"]` is absent or its `tableClass` property is absent, implementations MUST use `"srs-data-table"` as the default CSS class on the `<table>` element for HTML output.

**[T-Cx2]** When `tableClass` in `compositeRendererConfig["table"]` is explicitly set to an empty string `""`, implementations MUST emit the `<table>` element with no `class` attribute.

**[T-Cx3]** `wrapperTemplate` and `captionTemplate` in `compositeRendererConfig["table"]` apply to each entry rendered by `compositeRenderer: "table"`. They MUST NOT affect groups with other `compositeRenderer` values or groups without a `compositeRenderer`.

**[T-Cx4]** When evaluating format-conditional defaults for `wrapperTemplate` and `captionTemplate`, implementations MUST use `Composition.format` as the authoritative active format signal. When `wrapperTemplate` is explicitly set in `compositeRendererConfig["table"]`, implementations MUST apply it regardless of output format.

**[T-Cx5]** Unknown properties in a `compositeRendererConfig` sub-object for a known renderer name MUST be silently ignored and MUST NOT cause a rendering error.


## Composite rendering reconciliation (RFC-036)

`ElementTemplates` gains `compositeFieldRowTemplates?: { [fieldName: string]: string }` — the successor to
`groupFieldRowTemplates`, re-scoped from `FieldGroup` entries to composite-range values rendered by the
composite baseline. `groupFieldRowTemplates` is deprecated and retires with `FieldGroup` at the #242
cutover.

`compositeRendererConfig` is unchanged in shape and keying, and gains a schema for its `table` sub-object
(`tableClass`, `wrapperTemplate`, `captionTemplate`), with `additionalProperties: true` retained at both
levels so vendor renderer keys and unknown sub-properties stay valid.

**[CR-036-16]** `compositeRendererConfig` is keyed by the same identifier space as a composite renderer identifier [CR-036-1]. Unknown properties within a known renderer's sub-object, and keys naming renderers the implementation does not know, MUST be silently ignored and MUST NOT cause a rendering or loading error. Config applies only to fields resolved to the corresponding renderer. `Composition.format` is the authoritative format signal for format-conditional defaults, and an explicitly set template applies regardless of output format. `{{subheading}}` resolves to the rendered subheading and `{{label}}` to the output of `captionTemplate`, both computed before wrapper substitution. `"baseline"` is a dispatch sentinel, not a renderer; a `compositeRendererConfig` key of `"baseline"` MUST be ignored. The `table` renderer reads:

| Property | Effect | Default |
|---|---|---|
| `tableClass` | CSS class on `<table>` (HTML only) | `"srs-data-table"`; an explicit `""` suppresses the attribute |
| `wrapperTemplate` | Wraps one rendered table value; tokens `{{subheading}}`, `{{label}}`, `{{table}}`, absent optional values resolving to `""` | HTML: `<figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>`. Other formats: no wrapper |
| `captionTemplate` | Renders the `label` role; token `{{field-value}}` | HTML: `<figcaption>{{field-value}}</figcaption>`. Markdown: `*{{field-value}}*`. Other formats: undecorated |

The `subheading` role renders as a heading at the same level as the composite's own heading. **These
defaults are the renderer's output specification, not configuration defaults: implementations MUST apply
them whether or not `ext:themes-l1` is declared and whether or not a Theme resolves.** This matters
because [CR-036-19] retires the `[T-Cx*]` rules that currently house half of them, and because RFC-002
`[T-2]` requires structural output when a Theme is ignored on format mismatch.

**[CR-036-17]** `compositeFieldRowTemplates` is keyed by `Field.name` and supplies the template for an individual field row within a composite rendered by the baseline, in place of `fieldRow`. Keys matching no rendered field MUST be silently ignored. Implementations MUST NOT apply it to a composite that resolved to a renderer under [CR-036-6]; a composite that falls back to the baseline under [CR-036-7] or [CR-036-9] is baseline-rendered and MUST have it applied.

**[CR-036-18]** `groupFieldRowTemplates` is deprecated by `compositeFieldRowTemplates` and retires with `FieldGroup` at the #242 cutover. While both exist, implementations MUST apply `groupFieldRowTemplates` to `FieldGroup` entries and `compositeFieldRowTemplates` to composite entries. Migrating a `FieldGroup` to a composite therefore silently disables any `groupFieldRowTemplates` key naming one of its fields: a migration that converts a group MUST carry every such key over to `compositeFieldRowTemplates`, and implementations SHOULD emit a diagnostic when a `groupFieldRowTemplates` key matches no `FieldGroup` field in the effective package set.

**[CR-036-19]** RFC-007's `[FG-Cx0]`–`[FG-Cx4]`, `[T-Gx1]`–`[T-Gx3]` and `[T-Cx1]`–`[T-Cx5]` remain in force for `FieldGroup` until `FieldGroup` is removed at the #242 cutover, at which point they are retired. A `FieldGroup` MUST NOT be the target of a composite renderer binding, and a composite-range field MUST NOT be dispatched by `FieldGroup.compositeRenderer`; the two mechanisms MUST NOT interact.


## Normative field-row rendering (RFC-037)

`ElementTemplates.fieldRow` is a wrapper: it receives finished content as `{{content}}` and does not
re-render it ([T-3]). RFC-037 defines what that finished content is, so theme-less output — "the
element is rendered without wrapping" — is defined rather than implementation-chosen. The per-format
forms are normative in `ext:views-l2`, *Normative Field-Row Form*.

The class injection table above gains the label and value elements. Both carry an `srs-`-prefixed
name and an unprefixed compatibility alias; only the prefixed names form the forward contract.

Two naming notes. The aliases `field-label` / `field-value` are spelled identically to the
`{{field-label}}` / `{{field-value}}` template variables above; they are CSS class names, not
template tokens, and the namespaces do not interact. And `srs-field-label` sits alongside the
pre-existing generated family `srs-field-{fieldName}-{normalisedValue}` applied to record wrappers
for `cssClassFields` entries — a Field named `label` with value `active` yields
`srs-field-label-active`. The two families are distinguished by exact match, never by prefix.

**[FR-037-12]** On a field row the identity class is `srs-fieldname-{fieldName}`, whose
`{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from
`FieldAssignment.displayLabel`. On a relation row implementations MUST omit `srs-fieldname-*` and
MUST emit `srs-relationtype-{relationTypeKey}` instead. Both are normalised by the five-step rule.

**[FR-037-13]** Implementations MUST emit the field-row class vocabulary in baseline `html` output
whether or not `ext:themes-l1` is declared and whether or not a Theme resolves. This broadens
[T-8]'s scope, which is otherwise conditional on the extension, and matches the precedent
[CR-036-16] sets for renderer output defaults.

**[FR-037-14]** For `"html"` and `"pdf"` output, implementations MUST emit both the `srs-`-prefixed
class names and their unprefixed aliases (`field-label`, `field-value`) until the #242 cutover, and
MUST emit only the prefixed names thereafter. The aliases are deprecated on acceptance of RFC-037
and retire at the same cutover that [CR-036-19] retires `FieldGroup` and the `[T-Gx*]`/`[T-Cx*]`
rules, so the deprecation ends on a clock the project already keeps. A stylesheet claiming
conformance MUST NOT depend on the unprefixed aliases. No `pdf` row form is yet defined, so for
`pdf` this rule names the classes without naming the elements that carry them (RFC-037 Open
Question 3).

**[FR-037-19]** The row forms defined in `ext:views-l2` are the content `fieldRow` receives as
`{{content}}`. A Theme MAY wrap the row and MUST NOT replace it, per [T-3]. When no `fieldRow`
template resolves, implementations MUST emit those forms unwrapped. This is the terminal rung of the
RFC-036 row-template ladder, and (Rev 5) what [T-10] wraps on a bound View.
