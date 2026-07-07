# Semantic Record System Specification

## RFCs

**Title**: RFC-002: ext:themes-l1 — Visual Theming for Document Views
**RFC Number**: 002
**Status**: accepted
**Content**: **Affects**: defines new extension `ext:themes-l1`; `ext:views-l2` (`DocumentView.themeRef` defined in RFC-001 Change D)  
**Applied with**: RFC-001 — co-application required; `ThemeReference` is defined in RFC-001 Change D  
**Author**: Peter Brownell  
**Date**: 2026-05-27  

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-05-27 | Initial draft |
| 2 | 2026-05-27 | Remove `ThemeReference` definition — moved to RFC-001 Change D; RFC-001 and RFC-002 are co-applied |
| 3 | 2026-05-27 | Add `recordWrapperOverrides` and `sectionWrapperOverrides` to `ElementTemplates`; add `cssClassFields` to `Theme`; add normative CSS class injection section and class-naming convention |
| 4 | 2026-05-27 | Add `"theme"` to `Reference.definitionType` and `ImportRecord.definitionType` base-spec enums; extend bundled-resolution rule to cover `themeVariants[]`; resolve fieldRow/L1-View open question with explicit composition rule |
| 5 | 2026-05-29 | Make `Theme.targets` required (min 1 entry) — close open question 2; remove `{{heading-N}}` from element template variables (keep in `coverPage` only) — themes wrap structural content, not re-emit headings; add enforcement timing to Rule [T-7]; add note on `"pdf"`/`"docx"` as not-yet-portable pending RFC-001 follow-on |

---

## Abstract

SRS `DocumentView` defines structural projection (what records go in the document, in what order, at what heading depth) but says nothing about visual presentation — brand identity, typography, stylesheets, cover pages, or asset references. This RFC defines `ext:themes-l1`, a new extension that attaches a `Theme` to a `DocumentView`. A `Theme` specifies assets, element templates, and stylesheets without touching the semantic structure. Implementations that do not support `ext:themes-l1` ignore the attachment and produce structurally correct but unstyled output.

---

## Motivation

Three concerns exist in document rendering, and they need to stay in separate layers so each can evolve independently:

| Layer | Controlled by | Concern |
|---|---|---|
| Structure | `ext:views-l2` `DocumentView` | What records, what sections, what order, what heading depth |
| Element presentation | `ext:views-l1` `View` + `ExportConfig` | How a single record's fields are laid out and labelled |
| Visual brand | `ext:themes-l1` `Theme` (this RFC) | Assets, stylesheets, cover page, typography, element wrapping |

Without the third layer, branded output requires either embedding styling concerns inside `DocumentView` (mixing layers) or leaving them entirely outside the spec (no interoperability). `ext:themes-l1` gives implementations a defined, ignorable hook for visual identity that keeps structure and style cleanly separated.

---

## Design Principles

**Themes are non-destructive.** A Theme wraps or decorates auto-rendered content; it does not replace or reorder it. Structural decisions remain in `DocumentView` and L1 Views.

**Graceful degradation is required.** An implementation without `ext:themes-l1` support must produce valid structural output. `themeRef` on `DocumentView` is always optional.

**Assets are named, not inline.** Images, fonts, and other assets are declared by name in the `Theme` and referenced in templates as `{{asset:name}}`. This decouples the template string from the asset's physical location, which may change across environments (local path vs CDN URL vs base64 inline).

**Templates wrap; they do not replace.** Element templates receive the auto-rendered content of an element as `{{content}}` and wrap it in format-appropriate markup. They cannot suppress fields or reorder records — that would violate the structure layer.

---

## Proposed Changes

### New extension: `ext:themes-l1`

Add `ext:themes-l1` to the conformance extension table. Dependency: `ext:views-l2`.

---

### New type: `AssetDeclaration`

```typescript
{
  type: "image" | "font" | "stylesheet" | "data"
  mode: "local" | "remote" | "inline"

  path?: string      // local path; required when mode === "local"
  url?: string       // remote URL; required when mode === "remote"
  data?: string      // when mode === "inline": base64 for binary types, raw text for stylesheet/data
  mimeType?: string  // e.g. "image/png", "font/woff2", "text/css"
}
```

Assets are declared in `Theme.assets` as a named dictionary. The name is the key used in template variables: an asset named `"logo"` is referenced in any template as `{{asset:logo}}`.

---

### New type: `PageTemplates`

Templates for page-level chrome. Applicable to paginated output formats (`"pdf"`, `"docx"`). Ignored for non-paginated formats (`"html"`, `"markdown"`).

```typescript
{
  coverPage?: string
  // Rendered as the first page of the document.
  // Available variables: all DocumentView preamble variables + {{asset:*}}

  pageHeader?: string
  // Repeated at the top of each page.
  // Additional variable: {{page-number}}

  pageFooter?: string
  // Repeated at the bottom of each page.
  // Additional variable: {{page-number}}
}
```

---

### New type: `ElementTemplates`

Templates that wrap auto-rendered content at each structural level. Each template receives the auto-rendered content of that element as `{{content}}` and returns the full output for that element.

```typescript
{
  documentWrapper?: string
  // Wraps the entire rendered document body (after the cover page, if any).
  // Available: {{content}}, {{container-title}}, {{date}}, {{asset:*}}

  sectionWrapper?: string
  // Wraps each section (heading + all records within it).
  // Available: {{content}}, {{section-title}}, {{section-id}}, {{asset:*}}

  sectionWrapperOverrides?: Array<{
    sectionId: string   // matches DocumentSection.sectionId; case-sensitive
    template: string    // same variables as sectionWrapper
  }>
  // Per-section overrides. When a section's sectionId matches, this template is used
  // instead of sectionWrapper. When no match, sectionWrapper (if present) applies.
  // sectionId values must be unique within sectionWrapperOverrides.

  recordWrapper?: string
  // Wraps each record (record heading + all field rows).
  // Available: {{content}}, {{record-heading}}, {{type-namespace}}, {{type-name}}, {{asset:*}}
  // {{record-heading}} is the value of titleFieldId for this section, or empty string.

  recordWrapperOverrides?: Array<{
    typeId: UUID      // matches Record.typeId; targets all records of this type
    template: string  // same variables as recordWrapper
  }>
  // Per-type overrides. When a record's typeId matches, this template is used instead of
  // recordWrapper. When no match, recordWrapper (if present) applies.
  // typeId values must be unique within recordWrapperOverrides.

  fieldRow?: string
  // Wraps each field label + value pair.
  // Available: {{field-label}}, {{field-value}}, {{field-name}}, {{content}}
  // {{content}} is the default rendering of the label+value pair.
}
```

Override precedence: a specific override (`sectionWrapperOverrides`, `recordWrapperOverrides`) always takes precedence over the corresponding universal template (`sectionWrapper`, `recordWrapper`). When neither an override nor a universal template is set, the element is rendered without wrapping.

**`fieldRow` and L1 View composition**: When `DocumentSection.renderViewId` is set, `fieldRow` applies to each field row that the L1 View renders — after the L1 View's `ExportConfig.fieldOrder` has reordered fields and `ExportConfig.omitEmptyFields` has filtered absent ones. The L1 View determines which fields appear and in what order; `fieldRow` wraps each surviving field row independently. `fieldRow` does not apply to content emitted by `ExportConfig.preamble` (preamble content is L1 View chrome, not a field row).

Element templates apply after the structural rendering baseline (RFC-001 Change A) and after any L1 View rendering. They receive finished content and wrap it — they do not re-render.

---

### New type: `StylesheetDeclaration`

```typescript
{
  mode: "inline" | "local" | "remote"
  content?: string   // inline CSS; required when mode === "inline"
  path?: string      // local path; required when mode === "local"
  url?: string       // remote URL; required when mode === "remote"
}
```

---

### New type: `TypographyHints`

Informative declarations. Implementations map these to format-appropriate directives (CSS variables, document style settings, etc.). No normative rendering behaviour is derived from these values.

```typescript
{
  baseFont?: string        // e.g. "Inter", "Georgia"
  headingFont?: string
  monoFont?: string
  baseFontSize?: string    // e.g. "16px", "1rem", "11pt"
  lineHeight?: string      // e.g. "1.5", "24px"
}
```

---

### New type: `Theme`

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string
  // What this theme is for; intended output format and audience.

  targets: string[]   // required; min 1 entry
  // Output formats this theme is designed for.
  // Must reference portable format values from RFC-001 Change C ("markdown", "adoc", "html", "text").
  // Note: "pdf" and "docx" are anticipated but not yet portable values — see Open Question 4.
  // A Theme may target multiple formats; implementations apply it only when
  // DocumentView.format is in this list. A Theme with an empty targets array is a validation error.

  assets?: { [assetName: string]: AssetDeclaration }
  // Named asset declarations. Names must be unique within the Theme.

  cssClassFields?: UUID[]
  // fieldIds whose values are injected as CSS classes on record wrapper elements.
  // For each fieldId listed, if the record contains that field with a string, text,
  // or select value, the class srs-field-{fieldName}-{normalisedValue} is added.
  // Only applies to "html" and "pdf" output. Ignored for other formats.
  // Only string, text, and select valueTypes are supported; other types are silently skipped.

  pageTemplates?: PageTemplates
  elementTemplates?: ElementTemplates
  stylesheet?: StylesheetDeclaration

  typography?: TypographyHints

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

---

### `ThemeReference` (defined in RFC-001 Change D)

`ThemeReference` is the type used by `DocumentView.themeRef`. It is defined in RFC-001 Change D and is not repeated here. `themeId` within a `ThemeReference` references `Theme.id` as defined in this RFC.

---

### `DocumentView.themeRef` (defined in RFC-001 Change D)

`DocumentView.themeRef?: ThemeReference` is added to `DocumentView` by RFC-001 Change D. RFC-002 defines the `Theme` that is the target of the reference. The graceful-degradation rule (ignore when `ext:themes-l1` is not declared) is also in RFC-001 Rule [N+7].

---

### Modification to `Package`

Add:

```typescript
themes?: Theme[]   // ext:themes-l1; omit if not in use
```

**Bundled-package theme resolution**: When `Package.mode === "bundled"`, every `ThemeReference` with `mode === "bundled"` that appears in `Package.documentViews[]` — whether in `DocumentView.themeRef` or in any entry of `DocumentView.themeVariants[]` — MUST be resolved to a `Theme` that appears in `Package.themes[]`. A `themeId` referenced in either location that is absent from `themes[]` is a validation error.

#### Modifications to base-spec enums

`Reference.definitionType` (base spec §5.2) gains a new portable value:

```
"field" | "type" | "view" | "schema" | "protocol" | "theme"
```

`ImportRecord.definitionType` (`ext:import-tracking`) gains the same addition, making theme definitions trackable in consumer registries.

`dependencyRefs` may include `Reference` entries with `definitionType: "theme"` to declare theme dependencies for `standalone` packages.

---

## CSS class injection

For `"html"` and `"pdf"` output formats, implementations MUST add semantic CSS classes to rendered wrapper elements. These classes enable the theme stylesheet to target any element by its structural position, type, or field state without requiring separate templates for each combination.

#### Class name normalisation

All identifier components (type namespace, type name, field name, field value, section ID) MUST be normalised before use in a CSS class name using the following rule:

1. Convert to lowercase
2. Replace underscores, spaces, and dots with hyphens
3. Remove any character that is not alphanumeric or a hyphen
4. Collapse consecutive hyphens to a single hyphen
5. Trim leading and trailing hyphens

Examples: `governance` → `governance`; `article_text` → `article-text`; `Phase 1 scope` → `phase-1-scope`; `active` → `active`.

#### Classes applied per element

| Element | Classes always applied | Classes conditionally applied |
|---|---|---|
| Document wrapper | `srs-document` | — |
| Section wrapper | `srs-section`, `srs-section-{sectionId}` | — |
| Record wrapper | `srs-record`, `srs-type-{typeNamespace}-{typeName}` | `srs-field-{fieldName}-{normalisedValue}` for each `cssClassFields` entry that has a matching non-empty string, text, or select value |
| Field row | `srs-field`, `srs-fieldname-{fieldName}` | — |

`{sectionId}`, `{typeNamespace}`, `{typeName}`, `{fieldName}`, and `{normalisedValue}` are all normalised per the rule above.

#### Example

A Decision record with `status: "superseded"` in a section with `sectionId: "decision-log"`, where `status` fieldId is listed in `Theme.cssClassFields`:

- Section wrapper classes: `srs-section srs-section-decision-log`
- Record wrapper classes: `srs-record srs-type-governance-decision srs-field-status-superseded`

A stylesheet can then target `.srs-field-status-superseded { opacity: 0.5; }` without any template changes.

**Namespaced type example**: A record with `typeNamespace: "com.semanticops.srs"` and `typeName: "meta.section"` produces the class `srs-type-com-semanticops-srs-meta-section` (dots normalised to hyphens per step 2 of the normalisation rule).

---

## Template variable reference

The following variables are available in template strings across the extension. Variables not applicable to a given template context MUST resolve to an empty string (not an error).

| Variable | Available in | Resolves to |
|---|---|---|
| `{{container-title}}` | All | Container title from manifest |
| `{{container-id}}` | All | Container UUID |
| `{{date}}` | All | Render date (ISO 8601 date, not datetime) |
| `{{heading-1}}` | `coverPage` only | Heading prefix at level `1 + depthOffset` (RFC-001 Change B). Not available in element wrapper templates — structural headings are already inside `{{content}}` and must not be re-emitted. |
| `{{asset:name}}` | All | Resolved asset reference — URL, data URI, or path depending on context |
| `{{section-title}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.title` |
| `{{section-id}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.sectionId` |
| `{{record-heading}}` | `recordWrapper`, `recordWrapperOverrides` | Value of `titleFieldId` field for the current record, or empty string |
| `{{type-namespace}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeNamespace` |
| `{{type-name}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeName` |
| `{{field-label}}` | `fieldRow` | Display label for the current field |
| `{{field-value}}` | `fieldRow` | Rendered value of the current field |
| `{{field-name}}` | `fieldRow` | `Field.name` for the current field |
| `{{content}}` | All element templates | Auto-rendered content that this template wraps |
| `{{page-number}}` | `pageHeader`, `pageFooter` | Current page number (paginated formats only) |

`{{asset:name}}` resolution:
- In `"html"` output: resolves to a data URI for `mode === "inline"`, an `href`/`src` URL for `mode === "remote"`, or a relative path for `mode === "local"`.
- In `"pdf"` output: implementations embed the asset directly.
- In `"markdown"` output: resolves to the URL or path string only (no embedding).

---

## Conformance rules

**Rule [T-1]** (ext:themes-l1 — graceful degradation): Implementations that do not declare `ext:themes-l1` MUST ignore `DocumentView.themeRef` and MUST NOT produce a validation error when it is present.

**Rule [T-1b]** (ext:themes-l1 — `targets` required): `Theme.targets` MUST contain at least one entry. A `Theme` with an absent or empty `targets` array is a validation error. This is enforced at package validation time.

**Rule [T-2]** (ext:themes-l1 — targets matching): Implementations MUST apply a Theme only when `DocumentView.format` appears in `Theme.targets`. When the format does not match, the Theme MUST be ignored and structural output produced without it.

**Rule [T-3]** (ext:themes-l1 — templates wrap, do not replace): Element templates receive auto-rendered content via `{{content}}`. Implementations MUST render the structural content first and pass it to the template; they MUST NOT suppress or reorder content through template evaluation.

**Rule [T-4]** (ext:themes-l1 — asset name uniqueness): Asset names within a single `Theme.assets` dictionary MUST be unique. Asset names are case-sensitive.

**Rule [T-5]** (ext:themes-l1 — bundled theme resolution): When `ThemeReference.mode === "bundled"`, the referenced `themeId` MUST appear in `Package.themes[]` if `Package.mode === "bundled"`. A missing theme in a bundled package is a validation error.

**Rule [T-6]** (ext:themes-l1 — unknown variables): Template variables that are not defined in this spec and not recognised by the implementation MUST be passed through as literal text. They MUST NOT cause a rendering error.

**Rule [T-6b]** (ext:themes-l1 — `{{heading-N}}` scope): `{{heading-1}}` is available only in `PageTemplates.coverPage`, resolving via `DocumentView.depthOffset` per RFC-001 Change B. In all element wrapper templates (`documentWrapper`, `sectionWrapper`, `sectionWrapperOverrides`, `recordWrapper`, `recordWrapperOverrides`, `fieldRow`, `pageHeader`, `pageFooter`), `{{heading-1}}`, `{{heading-2}}`, and `{{heading-3}}` MUST resolve to the empty string. Structural headings are delivered inside `{{content}}` and MUST NOT be re-emitted by wrapper templates.

**Rule [T-7]** (ext:themes-l1 — override precedence): When `recordWrapperOverrides` contains an entry whose `typeId` matches the current record's `typeId`, that entry's template MUST be used instead of `recordWrapper`. When `sectionWrapperOverrides` contains an entry whose `sectionId` matches the current section's `sectionId`, that entry's template MUST be used instead of `sectionWrapper`. Override arrays MUST NOT contain duplicate `typeId` or `sectionId` values respectively. Duplicate detection is enforced at package validation time.

**Rule [T-8]** (ext:themes-l1 — CSS class injection): For `"html"` and `"pdf"` output formats, implementations MUST apply the CSS classes defined in the class injection table to each rendered wrapper element. Class name components MUST be normalised using the five-step normalisation rule.

**Rule [T-9]** (ext:themes-l1 — `cssClassFields` scope): Only fields with `valueType` of `"string"`, `"text"`, or `"select"` listed in `Theme.cssClassFields` generate CSS classes. Fields with other value types are silently skipped. Fields listed in `cssClassFields` that are absent or empty on a given record generate no class for that record.

**Rule [T-10]** (ext:themes-l1 — `fieldRow` scope with L1 View): When `DocumentSection.renderViewId` is set, `fieldRow` MUST be applied to each field row that survives the L1 View's `ExportConfig.omitEmptyFields` filtering and is ordered by `ExportConfig.fieldOrder`. `fieldRow` MUST NOT wrap content emitted by `ExportConfig.preamble`.

**Rule [T-11]** (ext:themes-l1 — base-spec enum extension): Implementations that support `ext:themes-l1` MUST accept `"theme"` as a valid value for `Reference.definitionType` and (when `ext:import-tracking` is also declared) for `ImportRecord.definitionType`. A `definitionType: "theme"` value in a received document MUST NOT cause a validation error.

---

## Rationale

### Why templates wrap rather than replace

Allowing templates to replace auto-rendered content would silently break the structural layer — fields could disappear, record order could change, and the semantic guarantees of `DocumentView` would be undermined. A theme is a presentation concern; a `DocumentView` is a semantic concern. The wrapping model enforces that separation mechanically.

### Why assets are named rather than referenced inline

Template strings are stored as JSON and distributed across systems. Embedding binary data or absolute paths directly in template strings makes them non-portable. A named asset dictionary allows the same template to work in a local development environment (local path), a CI pipeline (relative path), or a CDN-hosted production environment (URL) by changing the asset declaration, not the template.

### Why `TypographyHints` is informative rather than normative

Typography maps to very different constructs across output formats: CSS variables in HTML, document style settings in DOCX, font embedding in PDF. Requiring a specific rendering outcome for a typography hint would over-constrain implementations. The hints provide enough signal for a human-readable output without mandating a particular rendering mechanism.

### Why `recordWrapperOverrides` rather than a single universal `recordWrapper` with conditionals

A conditional template language inside a string (e.g. `{{#if type == "article"}}...{{/if}}`) would require specifying a template expression syntax, escaping rules, and evaluation semantics — a substantial addition for what is effectively a lookup table. An override array is a lookup table with no expression language, which is simpler to specify, simpler to implement, and simpler to audit. The CSS class injection mechanism handles value-driven styling (e.g. status-based) without any conditional template logic.

### Why CSS class injection rather than exposing field values as template variables

Making every field value available as a template variable would require either a fixed variable namespace per type (coupling the template language to specific field names) or a dynamic namespace that implementations must query per record. CSS classes solve the value-targeting problem cleanly for HTML/PDF output: the theme stylesheet handles the conditional styling, the implementation just emits normalised identifiers, and no template logic is needed.

### Why `cssClassFields` is opt-in rather than injecting all field values

Field values may be long prose, private content, or binary-encoded data. Blindly normalising all field values as CSS class components could produce unwieldy or unsafe class names. The `cssClassFields` array lets the theme author explicitly select the fields that are meaningful for styling purposes — typically status, lifecycle, and categorisation fields.

### Why `ext:themes-l1` rather than inline styling on `DocumentView`

If visual properties were placed directly on `DocumentView`, the same `DocumentView` would need to be duplicated for each branded variant — one for the governance team, one for external publication, one for print. With `themeRef`, the structural projection is authored once and visual themes are swapped without touching the record definitions.

---

## Alternatives considered

**CSS class hints on `DocumentSection` and element templates**  
Adding `cssClass?: string` fields to structural objects would let a renderer apply CSS without full template wrapping. Rejected: it only addresses HTML/CSS output and leaks format-specific concerns into the structural layer.

**A Theme registry separate from Package**  
Themes could be published to a separate registry (analogous to an npm registry) and referenced by name. Rejected for this RFC as premature: the Package distribution model (bundled/standalone) is already established and sufficient. A Theme registry could be a follow-on.

**Single `pageAndElementTemplates` flat object**  
Merging `PageTemplates` and `ElementTemplates` into one object simplifies the schema slightly but conflates page-level chrome (which only applies to paginated formats) with element-level wrapping (which applies to all formats). Keeping them separate makes the format-applicability rule easier to express and implement.

---

## Open questions

1. **`fieldRow` and L1 View composition** — resolved in Rev 4. `fieldRow` wraps each field row that the L1 View renders (after `omitEmptyFields` and `fieldOrder` are applied). It does not wrap preamble content. See Rule [T-10].

2. ~~**Should `Theme.targets` be required or optional?**~~ Resolved in Rev 5. `targets` is required with min 1 entry (Rule [T-1b]). Silent application to unintended formats is worse than the minor authoring cost of declaring targets explicitly.

3. **Versioning and theme inheritance**: should a Theme be able to extend another Theme (analogous to `ext:type-inheritance`)? Useful for brand variants (light/dark, language editions) but adds meaningful schema complexity. Deferred to a follow-on RFC if the use case proves common.

4. **`pdf` and `docx` in the format vocabulary**: RFC-001 Change C defined portable format values but excluded `"pdf"` and `"docx"` because they require richer rendering infrastructure. With `ext:themes-l1` now providing asset and stylesheet mechanisms, these formats become more tractable. A follow-on to RFC-001 should add them with appropriate conformance caveats. Until then, `"pdf"` and `"docx"` are implementation-defined values in `Theme.targets` — implementations that support them may use them, but they are not portable and MUST NOT cause a validation error in implementations that do not recognise them (per Rule [T-2], an unrecognised format simply means the theme is not applied).


**Title**: RFC-001: Views L2 — Rendering Hierarchy and Default Rendering Baseline
**RFC Number**: 001
**Status**: accepted
**Content**: **Affects**: `ext:views-l2`, `ext:views-l1` (`ExportConfig`)  
**Applied with**: RFC-002 (`ext:themes-l1`) — see Change D  
**Author**: Peter Brownell  
**Date**: 2026-05-27  

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-05-27 | Initial draft |
| 2 | 2026-05-27 | Fix model mismatch in Change A (FieldValue/FieldAssignment); remove View-dependent hidden-field rule; add `titleFieldId` to DocumentSection; remove phantom `DocumentSection.format` and dependent conformance rule |
| 3 | 2026-05-27 | Add Change D: `themeRef` stub on `DocumentView` to reserve visual-layer attachment point ahead of RFC-002 |
| 4 | 2026-05-27 | Fix format precedence (DocumentView.format vs ExportConfig.format); fix repeatable fields; add value-type constraint on `titleFieldId`; make absent-preamble document-title heading normative; clarify titleFieldId validation as render-time primary |
| 5 | 2026-05-27 | Define `ThemeReference` inline in Change D (RFC-001 and RFC-002 are co-applied; RFC-001 must be self-contained as a pair); define full L1/L2 ExportConfig boundary rule; extend `{{heading-N}}` variables to `ExportConfig.preamble` in section context; close open question 1 |
| 6 | 2026-05-27 | Add `ThemeVariant` and `themeVariants` to Change D — named theme switching; Rule [N+8] for variant selection |
| 7 | 2026-05-27 | Scope Rule [N+1] to section pipeline heading only (not L1 preamble content); remove undefined `{{name}}` example; fix Rule [N+8] to distinguish variant-not-found (fall back to themeRef) from variant-found-but-format-incompatible (render without theme, no fallback) |
| 8 | 2026-05-29 | Close open question 1 (add Rule [N+4b] warning for depthOffset > 4); add enforcement-timing note to ThemeVariant.name uniqueness; add Rule [N+6b] for {{heading-3}} in standalone export; clarify absent-format case in Rule [N+2]; clarify emptyBehavior/Change A interaction for L1 View path |
| 9 | 2026-06-05 | Close open question 2: amend Rule [N+1] to allow per-record heading omission when record type lacks titleFieldId field (not a render failure); add Rule [N+12] for container-subset default ordering by precedes chain |

---

## Abstract

`ext:views-l2` defines `DocumentView` as a projection mechanism but leaves several behaviours undefined: what "default rendering" means when no L1 View is referenced; what heading level structure a renderer should produce; which `ExportConfig` properties from a referenced L1 View survive in section rendering versus standalone export; and how a visual theme attaches to a document view. This RFC addresses all four, and defines `ThemeReference` for use by RFC-002 (`ext:themes-l1`).

---

## Motivation

### Problem 1 — "Default rendering" is referenced but undefined

`DocumentSection.renderViewId` is optional. The spec states:

> When absent, implementations use a default rendering for the instance type.

No definition of "default rendering" appears anywhere in the spec. Two conformant implementations will produce incompatible output for the same `DocumentView` — and neither is wrong, because there is no baseline to violate.

### Problem 2 — No normative heading hierarchy

A `DocumentView` has a `preamble`, sections with titles, and records within each section. The natural hierarchy (document → section → record → field) is structurally implied by the data model but never made normative. A renderer has no rule for which heading level to assign to a section title versus a record title, and no mechanism for a document author to declare that the document is being embedded inside a larger one.

### Problem 3 — `format` is an open string with no portable values or precedence rule

`DocumentView.format` and `ExportConfig.format` are both left as open strings. This creates two interoperability gaps: implementations cannot agree on a shared vocabulary, and when an L1 View referenced from a `DocumentSection` carries its own `exportConfig.format`, there is no rule for which format governs.

### Problem 4 — The L1/L2 rendering boundary is underspecified

When `DocumentSection.renderViewId` is set, the spec says the L1 View is "used to render each instance in this section." But `ExportConfig` contains four properties (`format`, `preamble`, `fieldOrder`, `omitEmptyFields`), and there is no rule for which of them apply in section context versus standalone export context. Two conformant renderers can disagree.

---

## Proposed Changes

### Change A — Define the default rendering baseline

Add the following subsection to `ext:views-l2`, immediately after the `DocumentSection` definition.

---

#### Default Rendering

When `DocumentSection.renderViewId` is absent, implementations MUST render each instance in the section using the following baseline. This baseline is View-agnostic: no L1 View influences field visibility or ordering in the default rendering path.

**Step 1 — Determine the effective field list and ordering.**

Use the Type's effective field list as defined in the spec. With `ext:type-inheritance`, the effective field list includes inherited fields. Ordering is determined as follows:

- If the Type declares `fieldOrder` (requires `ext:type-inheritance`), use that ordering.
- Otherwise, order fields ascending by `FieldAssignment.order` within the Type's effective field list.

**Step 2 — Resolve field values.**

For each field in the ordered effective field list, find the matching `FieldValue` in `Record.fieldValues[]` by `fieldId`. A field is considered present if:

- `FieldValue.value` is non-null and non-empty-string, **or**
- `ext:repeatable-fields` is declared and `FieldAssignment.repeatable === true` and `FieldValue.entries` is a non-empty array.

Fields with neither a scalar value nor repeatable entries are considered absent.

**Step 3 — Determine labels.**

For each field, the display label is `FieldAssignment.displayLabel` from the Type's effective field list entry for that field. If `displayLabel` is absent, fall back to `Field.name`.

**Step 4 — Render.**

Render only fields that are present (Step 2). Fields that are absent are omitted unless `DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true` in the Type, in which case implementations MAY render a placeholder.

For repeatable fields (where `FieldAssignment.repeatable === true` and `ext:repeatable-fields` is declared), render each entry in `FieldValue.entries` in sequence. The specific presentation of multiple entries (comma-separated inline list, bulleted list, etc.) is implementation-defined for the default rendering baseline.

The default rendering baseline is a floor, not a ceiling. An L1 View referenced via `renderViewId` always takes precedence and may override any of the above.

**`emptyBehavior` in the L1 View path**: Step 4's `emptyBehavior: "show-placeholder"` rule applies only to the default rendering baseline (when `renderViewId` is absent). When `renderViewId` is set, empty field handling is governed by `ExportConfig.omitEmptyFields` on the referenced L1 View (see Change C, L1/L2 ExportConfig boundary rule). `DocumentSection.emptyBehavior` does not apply in the L1 View rendering path.

---

### Change B — Add `titleFieldId` and `depthOffset`

#### B1 — Add `titleFieldId` to `DocumentSection`

Add the following field to `DocumentSection`:

```typescript
titleFieldId?: UUID
// The fieldId whose value provides the per-record heading within this section.
// Constraints:
//   - Must appear in the effective field list of every instance type in the section.
//   - The referenced field must have valueType "string" or "text".
//   - The referenced field must not be repeatable (FieldAssignment.repeatable !== true).
// When absent, no per-record heading is emitted; instances render as a
// sequential list with only field labels and values.
```

The value-type and repeatability constraints ensure the heading value is always a single renderable string. A boolean, number, select, or repeatable field cannot produce an unambiguous heading.

This is primarily a **render-time** validity check. For section sources that are statically determinable at package validation time (e.g. `type-query` where `semanticObjectType` resolves to a known Type in the Package), implementations SHOULD enforce this constraint during package validation. For dynamically resolved sources, validation is deferred to render time.

#### B2 — Add `depthOffset` to `DocumentView`

Add the following field to `DocumentView`:

```typescript
depthOffset?: integer   // min: 0; default: 0
// Shifts all auto-rendered heading levels by this amount.
// At depthOffset 0 (default): document title H1, sections H2, records H3.
// At depthOffset 1: H2, H3, H4 respectively.
// Field labels are never rendered as headings regardless of depthOffset.
```

#### Normative heading level table

For outputs where `DocumentView.format` is `"markdown"`, `"html"`, or `"adoc"`, implementations MUST apply the following heading levels:

| Element | Heading level | Condition |
|---|---|---|
| Document title | `1 + depthOffset` | When `preamble` is absent (see below) |
| Section title | `2 + depthOffset` | When `DocumentSection.title` is set |
| Per-record heading | `3 + depthOffset` | When `titleFieldId` is set on the section |
| Field label | Formatted text (e.g. bold) — not a heading | Always |

**Default document title (when `preamble` is absent):** When `DocumentView.preamble` is absent and `format` is `"markdown"`, `"html"`, or `"adoc"`, implementations MUST render a document title heading at level `1 + depthOffset` containing `container-title` immediately before the first section.

**When `preamble` is present:** The document title heading is the author's responsibility. The `{{heading-1}}` variable (defined below) is provided to keep the preamble consistent with `depthOffset` without hardcoding a heading level.

For outputs where `format` is `"text"` or an implementation-defined value, heading level semantics do not apply.

#### Template variables for `DocumentView.preamble`

The following additional standard variables are added to `DocumentView.preamble`:

| Variable | Resolves to |
|---|---|
| `{{heading-1}}` | Heading prefix at level `1 + depthOffset` |
| `{{heading-2}}` | Heading prefix at level `2 + depthOffset` |

In Markdown, `{{heading-1}}` at `depthOffset: 0` resolves to `#`. At `depthOffset: 1` it resolves to `##`.

A portable preamble template:

```
{{heading-1}} {{container-title}}

Founded {{date}}. This document is the living record...
```

---

### Change C — Define a controlled `format` vocabulary and precedence rule

Replace the current open-string description of `format` on `DocumentView` and `ExportConfig` with the following.

#### Portable `format` values

The following values are portable across implementations:

| Value | Meaning |
|---|---|
| `"markdown"` | CommonMark-compatible Markdown |
| `"adoc"` | AsciiDoc |
| `"html"` | HTML (fragment or full document at implementation discretion) |
| `"text"` | Plain text; no markup |

`"json"` is intentionally excluded from the portable set in this RFC. A JSON projection format requires a normative output schema; that is deferred to a follow-on RFC.

Implementations MAY support additional format values. Non-portable values MUST be treated as opaque implementation hints by receivers that do not recognise them; they MUST NOT cause a validation error.

When `format` is absent from `DocumentView`, the output format is implementation-defined.

#### L1/L2 ExportConfig boundary rule

When `DocumentSection.renderViewId` is set, the referenced L1 View's `ExportConfig` properties apply to section rendering as follows:

| `ExportConfig` property | Behaviour in section rendering context |
|---|---|
| `format` | **Superseded.** `DocumentView.format` governs. `ExportConfig.format` applies to standalone record export only. |
| `preamble` | **Applies.** Rendered before each record's field values within the section. |
| `fieldOrder` | **Applies.** Overrides `FieldAssignment.order` for field rendering within the section. |
| `omitEmptyFields` | **Applies.** Controls whether absent fields are rendered within the section. |

This boundary means a renderer using an L1 View inside a `DocumentView` section produces the same per-record layout as standalone export of that View, except that the output format is always governed by `DocumentView.format`.

#### Template variables in `ExportConfig.preamble` when used in section context

When `ExportConfig.preamble` renders inside a `DocumentView` section (i.e. when `renderViewId` is set), the following additional variable is available, resolving using the enclosing `DocumentView.depthOffset`:

| Variable | Resolves to |
|---|---|
| `{{heading-3}}` | Heading prefix at level `3 + depthOffset` |

The `{{heading-3}}` variable is available only when the preamble is rendered inside a `DocumentView` section; it resolves to an empty string in standalone export context. The existing `ExportConfig.preamble` standard variables (`{{instance-id}}`, `{{date}}`, `{{status}}`, `{{namespace}}`, `{{name}}`) continue to apply.

**Heading content in L1 preambles and Rule [N+1]**: An `ExportConfig.preamble` that contains a heading marker (e.g. `{{heading-3}} {{instance-id}}`) is emitting *L1 View content*, not the section pipeline's structural per-record heading. Rule [N+1]'s prohibition on per-record headings when `titleFieldId` is absent applies only to the *section pipeline's structural heading injection mechanism* — it does not prohibit headings appearing inside `ExportConfig.preamble` content. L1 View authors who include heading markers in preambles are responsible for heading depth consistency; `{{heading-3}}` is provided for this purpose. When both `titleFieldId` is set and the L1 preamble includes a heading, a redundant double-heading will be produced — this is a View authoring error, not a spec violation.

---

### Change D — Define `ThemeReference` and reserve `themeRef` on `DocumentView`

**Co-application note**: This change and RFC-002 (`ext:themes-l1`) are applied together. RFC-001 defines `ThemeReference` (the reference pointer type) because it appears on `DocumentView`, which is part of `ext:views-l2`. RFC-002 defines `Theme` (the target of the reference) and the full `ext:themes-l1` extension. Neither RFC is a complete spec delta without the other.

#### New type: `ThemeReference`

```typescript
{
  mode: "local" | "remote" | "bundled"

  path?: string    // path to a Theme JSON file; required when mode === "local"
  url?: string     // URL to a Theme JSON file; required when mode === "remote"
  themeId?: UUID   // references Theme.id in Package.themes[]; required when mode === "bundled"
}
```

Follows the same `mode`-based reference pattern as `packageRef` in the manifest.

#### New type: `ThemeVariant`

A named alternative theme that can be selected at render time instead of the default `themeRef`.

```typescript
{
  name: string           // identifier used to request this variant; case-sensitive
  description?: string   // human-readable note on intended use (e.g. "web", "print", "accessible")
  themeRef: ThemeReference
}
```

Variant names have no format constraints but MUST be unique within the enclosing `DocumentView.themeVariants` array. This uniqueness constraint is enforced at package validation time (it is statically determinable from the `DocumentView` definition).

#### Additions to `DocumentView`

```typescript
themeRef?: ThemeReference
// Default Theme (ext:themes-l1). Applied when no variant is selected at render time.
// When ext:themes-l1 is not declared, implementations MUST ignore this field.
// They MUST NOT error on its presence.

themeVariants?: ThemeVariant[]
// Named alternative themes. A caller selects a variant by name at render invocation.
// When a requested variant name is not found, implementations SHOULD fall back to
// themeRef and MAY emit a warning. When neither themeRef nor a matching variant is
// present, the document renders without a theme.
// When ext:themes-l1 is not declared, implementations MUST ignore this field.
```

---

## Conformance Rules

**Rule [N]** (ext:views-l2 — Default rendering): When `DocumentSection.renderViewId` is absent, implementations MUST use the default rendering baseline: fields in effective-field-list order (governed by `fieldOrder` when `ext:type-inheritance` is active, otherwise by `FieldAssignment.order`), using `FieldAssignment.displayLabel` or `Field.name` as label, resolved from `FieldValue.value` for scalar fields and from `FieldValue.entries` for repeatable fields (when `ext:repeatable-fields` is declared), omitting absent fields. No L1 View influences this baseline.

**Rule [N+1]** (ext:views-l2 — `titleFieldId` constraints): When `DocumentSection.titleFieldId` is set, it MUST reference a `fieldId` that (a) appears in the effective field list of every instance type in that section, (b) has `valueType` of `"string"` or `"text"`, and (c) is not repeatable. The section pipeline MUST NOT inject a structural per-record heading when `titleFieldId` is absent. This rule applies to the section rendering pipeline's heading injection mechanism only; it does not constrain headings that may appear inside `ExportConfig.preamble` content when an L1 View is bound via `renderViewId`. This is enforced at render time; implementations SHOULD also enforce it at package validation time when the section source is statically determinable.

**Rule [N+2]** (ext:views-l2 — Heading hierarchy): When rendering for `format: "markdown"`, `"html"`, or `"adoc"`, section titles MUST render at heading level `2 + depthOffset`. When `titleFieldId` is set on a section, per-record headings MUST render at heading level `3 + depthOffset`. Field labels MUST NOT be rendered as headings. When `format` is absent or is an implementation-defined value other than `"markdown"`, `"html"`, or `"adoc"`, this rule does not apply; heading level semantics are implementation-defined.

**Rule [N+3]** (ext:views-l2 — Default document title): When `DocumentView.preamble` is absent and `format` is `"markdown"`, `"html"`, or `"adoc"`, implementations MUST render a document title heading at level `1 + depthOffset` containing the container title before the first section.

**Rule [N+4]** (ext:views-l2 — `depthOffset` range): `depthOffset` MUST be a non-negative integer. Implementations MAY clamp computed heading levels that exceed the maximum supported by the target format and render such elements as formatted text.

**Rule [N+4b]** (ext:views-l2 — `depthOffset` warning): When `depthOffset` exceeds 4, the per-record heading level reaches H7 or higher in the default configuration (`3 + depthOffset ≥ 7`). Implementations SHOULD emit a warning diagnostic when `depthOffset > 4`. This is a quality-of-authoring warning only; it MUST NOT cause a validation failure or prevent rendering.

**Rule [N+5]** (ext:views-l2 — Format precedence): `DocumentView.format` governs the output format for all section rendering. When a referenced L1 View's `exportConfig.format` differs, it is ignored for section rendering. `ExportConfig.format` applies to standalone record export only.

**Rule [N+6]** (ext:views-l2 — L1 ExportConfig in section context): When `DocumentSection.renderViewId` is set, `ExportConfig.preamble`, `ExportConfig.fieldOrder`, and `ExportConfig.omitEmptyFields` MUST apply to section rendering. `ExportConfig.format` MUST be ignored in favour of `DocumentView.format` (Rule [N+5]).

**Rule [N+6b]** (ext:views-l2 — `{{heading-3}}` in standalone export): When `ExportConfig.preamble` is rendered in standalone export context (i.e. `renderViewId` is not set, or the View is exported directly rather than embedded in a `DocumentView` section), implementations MUST substitute `{{heading-3}}` with the empty string. Implementations MUST NOT emit the literal `{{heading-3}}` token in any output.

**Rule [N+7]** (ext:views-l2 — `themeRef` graceful degradation): Implementations that do not declare `ext:themes-l1` MUST ignore `DocumentView.themeRef` and `DocumentView.themeVariants` and MUST NOT produce a validation error on their presence.

**Rule [N+8]** (ext:views-l2 — theme variant selection): When `ext:themes-l1` is declared and a variant name is supplied at render invocation, implementations MUST apply the following resolution in order:

1. Find the `ThemeVariant` in `DocumentView.themeVariants` whose `name` matches the requested name (case-sensitive).
2. If found: resolve that variant's `ThemeReference` to a `Theme` and apply RFC-002 Rule [T-2] (targets check). If the format matches, use that Theme. If the format does not match, render **without a theme** — implementations MUST NOT fall back to `DocumentView.themeRef`.
3. If not found: fall back to `DocumentView.themeRef` (applying Rule [T-2]). If `themeRef` is absent or format-incompatible, render without a theme.
4. If no variant name is supplied: use `DocumentView.themeRef` (applying Rule [T-2]).

`ThemeVariant.name` values MUST be unique within a `DocumentView.themeVariants` array. This is enforced at package validation time.

---

## Rationale

### Why `depthOffset` rather than explicit per-element levels?

`depthOffset` preserves the invariant that sections are always one level below the document and records always one level below sections. Explicit per-element levels would allow authors to violate this invariant, producing documents where heading levels do not reflect structural depth.

### Why `titleFieldId` on `DocumentSection` rather than on the Type?

A Type does not know how it will be assembled. Multiple `DocumentView` definitions could include the same Type in sections where different fields serve as the heading. Making the designation per-section keeps the Type semantically stable.

### Why restrict `titleFieldId` to scalar string/text fields?

A heading must be a single renderable string. Boolean, number, select, and repeatable fields cannot produce an unambiguous heading without additional normalisation logic. Restricting to scalar string/text eliminates ambiguity without practical loss — a record's human-readable identifier is almost always a string field.

### Why make the absent-preamble document title normative?

Without this rule, the container title only appears as a heading if the author explicitly writes a preamble containing one. A document where the container title is absent or appears as plain text would silently contradict the heading hierarchy that sections and records follow.

### Why does `DocumentView.format` win over `ExportConfig.format`?

`ExportConfig` is a record-export configuration. In standalone export, the record's format is self-determined. In section rendering, the record is a constituent of a larger document — the document format governs. Allowing `ExportConfig.format` to override `DocumentView.format` would make a section's output format dependent on an L1 View definition that could be updated independently of the `DocumentView`.

### Why do `preamble`, `fieldOrder`, and `omitEmptyFields` survive in section context?

These properties control how the record's content is laid out and what it contains — they are presentation concerns that are equally valid whether the record is exported standalone or embedded in a section. The L1 View author defines the record layout once; it is consistent across both contexts. Only `format` is context-dependent.

### Why define `ThemeReference` in RFC-001 rather than RFC-002?

`ThemeReference` appears on `DocumentView`, which is part of `ext:views-l2`. RFC-001 must be self-contained as a spec delta for `ext:views-l2`. `Theme` (the target of the reference) belongs in RFC-002 because it defines the full `ext:themes-l1` extension. The two types are split at the boundary between what belongs to the views layer and what belongs to the theming layer.

### Why is default rendering View-agnostic?

The baseline must be computable from the Type and Record alone. Ambient L1 Views could suppress fields, making the baseline non-deterministic from the document author's perspective.

---

## Alternatives Considered

**Per-section `headingDepth` instead of document-level `depthOffset`**: Removed the invariant that sections are at consistent depth relative to each other. Dropped.

**Infer record title from first `required: true` string field**: Fragile and order-dependent. Explicit `titleFieldId` is unambiguous.

**Use `instanceIndex[].title` from the manifest**: Ties rendering to the manifest, which is a container concern. `titleFieldId` keeps rendering self-contained within the Package and Record.

**`ExportConfig.format` takes precedence in section context**: Would allow per-section format mixing. Rejected — format mixing at section granularity produces output most renderers cannot handle as a single document, and it makes the output format unpredictable from the `DocumentView` definition alone.

**Define `ThemeReference` only in RFC-002**: Left RFC-001 with an unresolved type on `DocumentView`. Since the two RFCs are co-applied, `ThemeReference` belongs in RFC-001 where `DocumentView` is defined.

---

## Open Questions

1. ~~**Maximum `depthOffset` value**~~: Resolved in Rev 8. Rule [N+4b] adds a warning-level diagnostic when `depthOffset > 4`. No hard cap is imposed; clamping (Rule [N+4]) remains the fallback.

2. ~~**`titleFieldId` in heterogeneous sections**~~: Resolved in Rev 9. Rule [N+1] is amended: when a record's type does not carry the designated `titleFieldId` field, the per-record heading is omitted silently — this is not a render failure. Rule [N+12] adds that `container-subset` sections order by `precedes` chain when no `ordering.fieldId` is declared.


**Title**: RFC-004: Language-Neutral Schema Notation for Spec Records
**RFC Number**: 004
**Status**: draft
**Proposal Artifact Path**: rfcs/rfc-004/
**Content**: **Status**: Draft (Revision 2)
**Affects**: Distribution Group - Package; new extension `ext:schema-notation`; `spec-authoring-core`; JSON Schema projection package
**Author**: SemanticOps contributors
**Date**: 2026-05-27

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-05-27 | Initial draft: schema-member records with compact type-ref strings |
| 2 | 2026-05-27 | Reframed schema notation as a semantic, target-neutral schema IR with JSON Schema as the first exact projection |

---

## Abstract

SRS and TSS specifications contain formal data shapes: Field, Type, Record, Session, Event, Participant, Stream, and other implementation-facing entities. Today many of those shapes are written as TypeScript-style prose blocks embedded in text fields. That makes them readable, but not semantic SRS data.

This RFC defines `ext:schema-notation`: a semantic, target-neutral schema definition model for spec authoring. The extension represents logical schemas, members, type expressions, constraints, defaults, examples, deprecation state, and semantic purpose as SRS records and field values. JSON Schema, TypeScript, protobuf, Rust structs, and other formats are projections from that shared semantic source; none of those target syntaxes is the source of truth.

Revision 2 deliberately moves away from compact string `type-ref` expressions as the normative representation. Renderers may show compact strings for humans, but the normative source is structured `typeExpression` JSON.

---

## Motivation

### Problem 1 - Schema prose is not SRS data

TypeScript-style blocks in `content` fields are implementation-flavoured notation. SRS tools cannot reliably traverse them, cite individual members, validate them, or render them to other targets without ad-hoc parsing.

### Problem 2 - Meaning must survive target projection

A JSON Schema definition can validate JSON shape, but it cannot carry all the semantic intent needed by SRS authoring. Protobuf can express efficient wire contracts, but it requires target-specific concerns such as field numbers and `oneof` names. The source model must describe meaning first, then allow target packages to render appropriate forms.

### Problem 3 - TSS needs the same source for multiple outputs

TSS has data shapes such as `Session`, `Participant`, `Stream`, `Event`, and many event subtypes. A useful SRS-authored TSS spec should be able to render JSON Schema for validation and later render protobuf from as much of the same source as possible. That requires a portable semantic schema IR, not a JSON-Schema-only design.

### Problem 4 - `ext:schema` is a different layer

`ext:schema` describes runtime extraction and package structure: what records a package expects and how source material may be transformed into records. `ext:schema-notation` describes spec-level data shapes: the schemas that implementations should produce, consume, and validate. The two extensions are complementary and must not be conflated.

---

## Design Principles

**Semantic first.** The extension describes meaning, not target form. Field numbers, JSON Schema keywords, TypeScript punctuation, and Rust derives are projection concerns.

**Target-neutral core, target-specific packages.** The main extension defines portable schema meaning. Exact renderers live in projection packages such as `spec-authoring-json-schema` and a future `spec-authoring-protobuf`.

**Structured type expressions.** Type meaning is represented as JSON data using explicit expression kinds. Compact strings are allowed as display conveniences only.

**Addressable members.** Schema definitions and schema members are SRS records with stable identity, so invariants, examples, migration notes, and conformance rules can cite them directly.

**Migration-friendly.** Existing prose blocks may coexist while structured schema records are introduced. Structured schema records become authoritative when a migration is complete.

---

## Proposed Changes

### Change A - Add `json` as a core Field value type

`Field.valueType` gains `json` for structured JSON values whose meaning is supplied by the field definition and validating schema. This is required for recursive or nested semantic values such as schema type expressions and portable constraint objects.

`json` is not a target renderer. It is a storage primitive for structured semantic values inside SRS records.

### Change B - New extension: `ext:schema-notation`

Add the following extension entry:

| Extension | Identifier | Depends on | Notes |
|---|---|---|---|
| Schema Notation | `ext:schema-notation` | none | Semantic schema IR for spec authoring and target projections |

### Change C - New type: `schema-definition`

`com.semanticops.spec/schema-definition` represents one logical data shape. It is not a JSON Schema object, TypeScript interface, or protobuf message, though projection packages may render it to those forms.

Core fields:

| Field | Meaning |
|---|---|
| `title` | Human-readable title |
| `namespace` | Logical schema namespace |
| `schema-name` | Stable machine-readable schema name |
| `version-label` | Version of the schema definition |
| `description` | Short description |
| `semantic-purpose` | Domain meaning of this schema |
| `status` | Draft, active, deprecated, etc. |
| `content` | Optional prose guidance |
| `examples` | Non-normative examples |
| `deprecated` | Whether the schema remains only for compatibility |
| `notes` | Editorial notes |

Members are attached by `schema-member-sequence` relations.

### Change D - New type: `schema-member`

`com.semanticops.spec/schema-member` represents one addressable member of a schema definition.

Core fields:

| Field | Meaning |
|---|---|
| `member-name` | Stable member/property name |
| `type-expression` | Structured semantic type expression JSON |
| `required` | Whether the member must be present |
| `nullable` | Whether explicit `null` is allowed |
| `constraints` | Portable target-neutral constraints |
| `schema-default-value` | Concrete JSON default value for this schema member |
| `examples` | Non-normative examples |
| `deprecated` | Whether the member remains only for compatibility |
| `semantic-purpose` | Domain meaning of this member |
| `notes` | Editorial notes |

`required` and `nullable` are separate. Optional means the member may be absent. Nullable means the member may be present with the explicit value `null`.

### Change E - Structured `typeExpression` JSON

The normative source for member type meaning is a structured JSON value held in the `type-expression` field. It has a `kind` property and kind-specific properties.

Supported expression kinds:

| Kind | Meaning | Required portable properties |
|---|---|---|
| `scalar` | Portable primitive value | `name` |
| `ref` | Reference to a named schema/type | `namespace`, `name`; optional `version` |
| `array` | Ordered list of values | `items` |
| `map` | Key/value object map | `values`; optional `keys` |
| `object` | Inline anonymous object shape | `members` |
| `union` | One of several alternatives | `variants` |
| `literal` | One exact value | `value` |
| `enum` | One of a finite set of values | `values` |
| `unknown` | Preserved but unconstrained value | none |

Portable scalar names:

`string`, `text`, `integer`, `number`, `boolean`, `date`, `date-time`, `uuid`, `uri`, `duration-ms`, `json`.

Inline `object` expressions are allowed only for genuinely local anonymous shapes. Reusable shapes must be separate `schema-definition` records referenced with `ref`.

`union` must not be used to smuggle optionality. Nullability is represented by the member-level `nullable` field.

### Change F - Portable constraints

The generic IR defines only constraints that can reasonably project across multiple targets:

- required and nullable state
- numeric minimum and maximum
- string minimum length, maximum length, and pattern
- array minimum items, maximum items, and uniqueness
- enum and literal values
- scalar format
- map key and value shape
- cardinality where the target supports it

Cross-field validation, conditional validation, and protocol-level invariants are out of scope for Revision 2. They remain prose or invariant records until a later RFC defines a semantic rule notation.

### Change G - Relation semantics

Add these relation types to the recommended relation vocabulary:

| Relation type | Source | Target | Meaning |
|---|---|---|---|
| `schema-member-sequence` | `schema-definition` | ordered list of `schema-member` records | Declares the ordered members of a schema |
| `defines-schema-for` | `schema-definition` | `type-definition` or other spec record | Declares that the schema formalizes the target record/type shape |

When an existing `type-definition` has a related `schema-definition`, renderers that support `ext:schema-notation` should use the structured schema definition rather than any prose TypeScript block.

### Change H - JSON Schema projection package

Add `com.semanticops.spec/spec-authoring-json-schema` as a target projection package. It defines exact JSON Schema rendering rules and metadata; it does not own the semantic schema source.

JSON Schema `$id` values follow:

`https://srs.semanticops.com/schema/domain/<namespace>/<schemaName>/<version>.json`

Projection rules:

- A `schema-definition` renders as a JSON Schema object with `$id`, `title`, `type: "object"`, `properties`, and `required`.
- A `schema-member` renders as one property.
- `required: true` adds the member to the parent `required` array.
- `nullable: true` adds `null` to the property shape but does not make it optional.
- `ref` renders to `$ref`.
- `union` renders to `oneOf`.
- `literal` renders to `const`.
- `enum` renders to `enum`.
- `array` renders to `type: "array"` with `items`.
- Portable constraints render to matching JSON Schema keywords where available.

### Change I - Protobuf compatibility

The semantic IR should be designed so protobuf can be rendered from the same source where portable constructs are used. However, protobuf-specific details are target metadata, not core schema meaning.

The following are reserved for a future `spec-authoring-protobuf` package:

- protobuf package names
- message and field naming overrides
- field numbers
- reserved ranges
- `oneof` naming
- map encoding details
- target-specific scalar mappings

RFC-004 Revision 2 intentionally does not add protobuf fields to `spec-authoring-core`.

---

## Proposal Artifacts

Proposal artifacts live under `rfcs/rfc-004/`. They are review material only and must not be loaded into active `package/` or `schemas/` directories until RFC-004 is accepted and implemented. The proposed `schema-default-value` field intentionally has a distinct identity from the active `default-value` field because concrete JSON schema-member defaults are not the same concept as prose documentation of ordinary field defaults.

---

## Migration Path

Existing TypeScript prose blocks remain valid during migration. For a given spec entity:

1. Create a `schema-definition` record for the logical shape.
2. Create one `schema-member` record for each member.
3. Link members to the schema with `schema-member-sequence`.
4. Link the schema to the existing prose `type-definition` using `defines-schema-for`.
5. Render JSON Schema from the structured schema definition and compare against any hand-authored schema.
6. Once accepted, mark the prose TypeScript block as superseded or remove it from the type-definition content.

TSS should be evaluated against this model before authoring all TSS schema records. The goal is to verify that `Session`, `Participant`, `Stream`, `Event`, event subtypes, merge records, and package records can be represented without making JSON Schema or protobuf the source of truth.

---

## Consequences

### Benefits

- Schema meaning is represented as SRS data rather than target syntax.
- Individual schema members become addressable and citable.
- JSON Schema can be rendered exactly from the semantic source.
- Protobuf can later reuse the same source with target metadata layered separately.
- TSS and SRS can share spec-authoring primitives without forcing TSS to become an SRS semantic object model.

### Tradeoffs

- Schema authoring produces more records than prose blocks.
- Recursive or nested type expressions require `json` field values and schema-aware tooling.
- Some validation concerns remain outside the generic IR until a future rule-notation RFC.
- Projection packages must be maintained for exact target output.

---

## Open Questions

1. Should `schema-definition` version use the existing `version-label` field long term, or should spec-authoring-core add a numeric schema version field?

2. Should `type-expression` and `constraints` get dedicated JSON Schemas in the root `schemas/` directory, or should they remain specified textually until the first renderer is implemented?

3. Should `defines-schema-for` point from schema to type-definition, or should the inverse relation also be recommended for easier traversal from prose type records?

4. Which TSS shape should be migrated first as a proof case: `Session`, `Event`, or one narrow event subtype such as `MessageEvent`?

**Title**: RFC-003: Definition Distribution and Repository Slices
**RFC Number**: 003
**Status**: draft
**Content**: **Status**: Draft (Revision 4)  
**Affects**: Distribution Group (Core), `ext:import-tracking`, `ext:repository`, `ext:federation`, `ext:binding`, `ext:themes-l1`  
**Author**: Codex draft  
**Date**: 2026-05-27  

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-05-27 | Initial draft |
| 2 | 2026-05-27 | Add declared binding modes, authoritative hierarchy semantics, and explicit conflict surfacing for imported and derived elements |
| 3 | 2026-05-27 | Incorporate review refinements: clarify `entryRefs` locality, add inheritance closure, support explicit instance binding, move `ConflictRecord` to `ext:import-tracking`, and add repository-slice selection intent |
| 4 | 2026-05-27 | Reconcile with RFC-002 themes: add `theme` to discovery/binding/closure rules, tighten `ConflictRecord` identity typing, define `autoUpdate` mode semantics, add tracked-mirror marker, and allow intentional source-document omission |

---

## Abstract

SRS already defines the core ingredients for sharing semantic definitions and exchanging repository content: `Package`, `Lineage`, `Provenance`, `ext:import-tracking`, `ext:registry`, `ext:repository`, and `ext:federation`. What remains underspecified is the practical distribution model: how reusable fields, "templates", and protocols should be packaged for reuse; how a subset of an existing repository should be exported as a portable artefact; and how consumers should distinguish "install this shared library" from "import this slice of semantic content".

This RFC makes that distinction explicit.

- **Reusable definitions** are shared as **Packages**
- **Repository content** is shared as **Repository Archives** or **Repository Slices**
- **Registries** catalog definition packages
- **Bindings** determine whether upstream content is authoritative, tracked, or explicit-only
- **Federation** and archive import rules govern repository-level exchange

The RFC also introduces package entry points for discoverability and a new optional repository-slice descriptor so a partial export can be imported without pretending to be a full repository mirror.

---

## Motivation

### Problem 1 — "fields, templates, and protocols" are shareable, but the share unit is ambiguous

Older planning documents describe a field library and decision templates as the reusable authoring surface:

- fields are atomic reusable definitions
- templates are curated compositions of fields
- template-level prompt framing is distinct from field-level extraction semantics

That model remains correct in spirit, but in SRS v2 the formal shareable artefact is not "a template" as a standalone core type. The current spec's reusable unit is `Package`, which may contain `Field`, `Type`, `View`, `DocumentView`, `Schema`, `Protocol`, and `RelationTypeDefinition`.

Without a clear statement of this mapping, implementers will invent parallel export formats for "field libraries" and "template bundles" instead of using the Package system already present in the spec.

### Problem 2 — subset export is implied, but not defined

`ext:repository` defines a full archive as a self-contained snapshot of a live repository. Import and re-import are identity-based. This is correct for full exchange, but many real workflows require exporting only part of a repository:

- a small library of reusable governance definitions
- one protocol family
- one document kit built from fields, views, and document views
- a selected set of records and supporting evidence for handoff to another repository

Today a producer can construct such an export ad hoc, but the spec does not say what closure rules apply, when a new `repositoryId` is required, or how the receiving side should interpret the result.

### Problem 3 — distribution mechanism is described structurally but not operationally

The spec defines `Registry` and `RepositoryRegistry` as data shapes, but does not yet say what a typical publishing pipeline looks like. As a result, it is unclear whether "distribution" means:

- publishing a definition package to a registry
- zipping a repository snapshot
- exporting a subset as a new repository
- or all three

This RFC defines those roles cleanly without introducing a central service requirement.

### Problem 4 — binding and override behaviour is not declared

Real systems do not all relate to upstream content in the same way.

- In a **governance hierarchy**, a subordinate repository may be bound to a core SRS such that core decisions, protocols, and other scoped content automatically become effective locally
- In a **federated environment**, another group's content may be visible and discoverable, but adoption should happen only by explicit import
- In both cases, a local repository may hold derived or forked elements that conflict with upstream changes

The current spec has import modes and lineage, but it does not yet let a repository declare the governing relationship it wants with an upstream source, nor how conflicts should be surfaced when authority and local derivation collide.

---

## Design Principles

**Keep definitions separate from content.** Reusable semantic definitions are not the same thing as semantic instances. Packages and repositories must remain distinct artefact types.

**Preserve existing identity rules.** Distribution must continue to rely on `id`, `version`, `instanceId`, `relationId`, `documentId`, `packageId`, and `repositoryId`, not filenames or storage paths.

**Subset export must be closure-based.** A portable subset is not an arbitrary file copy; it is a selected root plus the dependencies required to make it valid and comprehensible elsewhere.

**Local-first publication is valid.** A package registry may be a static JSON file in Git or object storage. A repository slice may be handed over as a `.srs` ZIP file with no server infrastructure.

**"Template" remains an informal umbrella term.** The spec should not reintroduce a new core template type. In SRS v2, template-like behaviour is expressed through `Type`, `View`, `DocumentView`, `Schema`, and `Protocol`.

**Binding must be declared, not assumed.** Consumers must be able to state whether an upstream source is authoritative, merely tracked, or only importable on explicit request.

**Authority does not erase conflict.** Even when an upstream source has precedence, conflicting local content must remain visible and addressable rather than being silently discarded.

---

## Proposed Changes

### Change A — Clarify the reusable distribution model around `Package`

Add the following normative clarification to the `Package` section in the Distribution Group.

> `Package` is the primary reusable distribution unit for semantic definitions. A Package may contain any combination of Fields, Types, Views, DocumentViews, Schemas, Protocols, and Relation type definitions. Implementations that colloquially speak of "field libraries", "template libraries", "protocol packs", or "document kits" must express those libraries as Packages rather than as implementation-specific export formats.

Add the following explanatory note:

> In older field-library terminology, a "template" is usually not a single SRS construct. Depending on behaviour, it may correspond to a `Type`, `View`, `DocumentView`, `Schema`, `Protocol`, or a package-level combination of several of these. "Template" remains a valid user-facing label, but it is not introduced here as a new core schema type.

This makes the mapping from the older field-library architecture to SRS explicit:

- field library → `Package.fields[]`
- reusable record template → `Type` plus optional `View`
- reusable document template → `DocumentView`
- reusable extraction kit → `Schema`
- reusable facilitation pattern → `Protocol`

---

### Change B — Add package entry points for discoverability and subset publication

Extend `Reference.definitionType` and `ImportRecord.definitionType` so that, when this RFC is co-applied with RFC-002, the resulting portable vocabulary is:

```typescript
"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type"
```

This aligns the reference and import-tracking vocabularies with objects that are already package content and may reasonably appear in a package's public surface. In particular, visual themes introduced by RFC-002 `ext:themes-l1` are already first-class sharable artefacts and participate in the same package and registry mechanisms.

Add the following optional field to `Package`:

```typescript
entryRefs?: Reference[]
// Definitions intended as the package's direct public entry points.
// Examples: a top-level Type, DocumentView, Schema, or Protocol that a consumer
// would intentionally install, select, or build from.
```

`entryRefs` is not a dependency list. It is the authored public surface of the package.

#### Semantics

- A package may contain helper definitions that are not in `entryRefs`
- Every `entryRefs[]` item must either:
  - resolve to a definition present in the package's own content arrays, or
  - appear in `dependencyRefs[]` when the package is exposing an externally supplied dependency
- In `mode: "bundled"`, every locally defined `entryRefs[]` item must be present in the corresponding package content array
- `entryRefs` may reference `field`, `type`, `view`, `document-view`, `schema`, `protocol`, `theme`, or `relation-type`

#### Purpose

`entryRefs` solves two related problems:

1. It tells a registry consumer which definitions are meant to be selected directly
2. It provides a clean starting set for subset package export

For example, a governance package may contain twenty shared fields, four types, three single-record views, one `DocumentView`, and one `Protocol`, but expose only:

- `governance/decision@2`
- `governance/decision_record@1`
- `governance/decision_protocol@1`

as its public entry points.

#### Registry surfacing

Add the following optional field to `RegistryEntry`:

```typescript
entryRefs?: Reference[]
// Optional copy of the package's public entry surface for lightweight discovery.
// Allows clients to browse installable protocol/type/document-view entry points
// without downloading the entire package first.

declaredExtensions?: string[]
// Optional list of SRS extensions the package's public surface depends on or enables.
// Examples: "ext:protocol", "ext:views-l2", "ext:themes-l1".
// Supports UI and AI discovery workflows such as "find packages that provide
// sharable themes" or "find protocol packages for ext:protocol".

providedDefinitionTypes?: Array<"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type">
// Optional summary of definition kinds exposed by the package's public surface.
// Examples: "protocol", "document-view", "theme".

themeCount?: integer
// Optional count of Theme definitions in the package.
```

Registry consumers should be able to filter by `entryRefs`, `declaredExtensions`, and `providedDefinitionTypes` without downloading full package payloads. This is intended to support both human-facing package browsers and AI-assisted discovery and installation workflows.

---

### Change C — Define subset package export

Add a new normative subsection under `Package` titled **Subset package export**.

#### Subset package export

A producer may create a new Package from a selected subset of definitions in one or more source packages. The export algorithm is:

1. Select one or more root definitions, typically from `entryRefs`
2. Compute the transitive dependency closure required for those roots to validate and render correctly
3. Emit a new Package containing exactly that closure
4. Preserve the original definition `id`, `namespace`, `name`, and `version` for all carried definitions
5. Assign a new `packageId` and `packageVersion` to the exported package as a publication event

#### Dependency closure rules

- Exporting a `Type` includes all referenced `Field`s
- When `ext:type-inheritance` is declared, exporting a derived `Type` includes the full transitive closure of its base Types and the Fields required by those base Types
- Exporting a `View` includes its referenced `Type` and that Type's referenced `Field`s
- Exporting a `DocumentView` includes any referenced `View`s, all `Type`s those Views require, all `Field`s those Types require, and any referenced `Theme`s reachable through `themeRef` or `themeVariants[]` when `ext:themes-l1` is declared
- Exporting a `Schema` includes all referenced `Type`s and their dependent `Field`s
- Exporting a `Protocol` includes `targetType`, all `outputType`s, all `contributesTo` field references, and their dependent Types/Fields

#### Import semantics

Import of subset packages uses the existing definition identity rules:

- same `id` + `version`, same content → no-op
- same `id` + `version`, different content → conflict
- new `id` + `version` → insert

#### Relationship to import tracking

Consumers importing a subset package should record imported definitions in `ext:import-tracking` exactly as they would for a full package:

- `upstream-tracked` when they expect updates from the source lineage
- `local-copy` when they are taking a frozen snapshot
- `local-fork` when they intend to diverge intentionally

This RFC also extends `ext:import-tracking` with a shared conflict surface so plain import collisions and binding collisions use one canonical mechanism.

#### `ConflictRecord`

When `ext:import-tracking` is declared, implementations may persist conflicts detected during package import, repository import, or binding evaluation as:

```typescript
{
  conflictId: UUID

  targetKind: "definition" | "instance"
  bindingId?: string

  localIdentity:
    | { definitionRef: Reference }
    | { instanceId: UUID }
  sourceIdentity?:
    | { definitionRef: Reference }
    | { instanceId: UUID }

  conflictType: "same-identity-different-content" | "derived-divergence" | "authority-shadow" | "incompatible-upgrade"

  effectiveResolution: "prefer-source" | "prefer-local" | "manual-pending"
  status: "open" | "resolved" | "dismissed"

  detectedAt: ISO8601
  resolvedAt?: ISO8601
  note?: string
}
```

#### Conflict semantics

- When `targetKind === "definition"`, identity must be expressed using `definitionRef`
- When `targetKind === "instance"`, identity must be expressed using `instanceId`
- `same-identity-different-content` means the same stable identity key resolved to different content
- `derived-divergence` means a local element sharing lineage with an upstream element has materially diverged
- `authority-shadow` means local content remains stored but is not effective because an authoritative source has precedence
- `incompatible-upgrade` means an upstream change cannot be applied cleanly to the local dependent content

Implementations may automatically choose an effective side according to binding or import policy, but they must still create and preserve a `ConflictRecord` until the divergence is acknowledged or resolved.

---

### Change D — Define `ext:binding`

Add a new optional extension:

| Extension | Identifier | Depends on | Notes |
|---|---|---|---|
| Binding | `ext:binding` | `ext:import-tracking` | Declared binding mode, authoritative precedence, and conflict surfacing for imported definitions and repository content |

This extension allows a repository to declare how it is bound to upstream packages and repositories.

#### `BindingMode`

```typescript
"authoritative-upstream" | "tracked-upstream" | "explicit-import"
```

| Mode | Meaning |
|---|---|
| `"authoritative-upstream"` | Matching upstream content becomes locally effective automatically within the declared scope. Conflicts are still recorded and surfaced. |
| `"tracked-upstream"` | Upstream updates are discovered and tracked, but do not become effective until explicitly accepted by the consumer. |
| `"explicit-import"` | Upstream content is available only for deliberate manual import. No automatic tracking or adoption occurs. |

#### `BindingResolution`

```typescript
"prefer-source" | "manual" | "prefer-local"
```

This field controls which side becomes the effective version when content in scope conflicts. It does not suppress conflict recording.

#### `BindingScope`

```typescript
type BindingScope =
  | {
      targetKind: "definitions"
      definitionTypes?: Array<"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type">
      namespaces?: string[]
      names?: string[]
    }
  | {
      targetKind: "instances"
      typeNamespace?: string
      typeName?: string
      typeId?: UUID
      instanceIds?: UUID[]
    }
```

#### `BindingSource`

When `ext:binding` is declared, `RepositoryManifest` gains:

```typescript
bindings?: Array<{
  bindingId: string

  sourceKind: "package" | "repository"

  sourcePackageId?: UUID
  sourceRepositoryId?: UUID

  mode: BindingMode
  resolution: BindingResolution
  autoUpdate?: boolean
  // Meaning depends on mode; see auto-update behaviour table below.

  scope: BindingScope[]

  note?: string
}>
```

`sourcePackageId` is used when the authority is a definition package. `sourceRepositoryId` is used when the authority is a repository, such as a core governance SRS containing authoritative decisions or protocols.

#### Binding semantics

Bindings are declarations of governing relationship, not just import history.

- A repository may bind to a **core governance source** using `mode: "authoritative-upstream"` and `resolution: "prefer-source"`
- A repository may bind to a **federated peer source** using `mode: "explicit-import"` and `resolution: "manual"`
- A repository may track an evolving upstream package using `mode: "tracked-upstream"`

#### Normative behaviour

1. `authoritative-upstream` may automatically install or refresh newer upstream content for items in scope
2. `tracked-upstream` may automatically detect updates, but must not make them effective without an explicit accept/promote action
3. `explicit-import` must never change local effective content without an explicit import action
4. No binding mode may silently delete local conflicting content
5. Existing bound runs or records must not be silently rebound in place

This last rule is especially important for facilitation. If a `ProtocolRun` started against protocol version 3, a later import of version 4 may become the effective default for future runs, but it must not mutate the already-running or already-recorded run.

Conflicts produced under this extension must be recorded using `ext:import-tracking` `ConflictRecord`s.

#### Auto-update behaviour

| `mode` | `autoUpdate` | Required behaviour |
|---|---|---|
| `"authoritative-upstream"` | `true` | Implementation should automatically fetch/install updates for items in scope when reachable. Updated source content becomes effective per `resolution`. |
| `"authoritative-upstream"` | `false` or absent | Implementation may require manual sync/fetch, but once the upstream update is accepted locally, source precedence still governs effective content. |
| `"tracked-upstream"` | `true` | Implementation may automatically detect or fetch updates, but must keep them non-effective until an explicit accept/promote action occurs. |
| `"tracked-upstream"` | `false` or absent | Update detection and fetch are manual. No upstream change becomes effective automatically. |
| `"explicit-import"` | `true` | Invalid. Implementations must reject the binding or treat `autoUpdate` as `false` and surface a validation warning. |
| `"explicit-import"` | `false` or absent | Only explicit import actions may create or update local content from the source. |

#### Governance hierarchy example

A local cooperative repository may declare:

```json
{
  "bindings": [
    {
      "bindingId": "core-governance-protocols",
      "sourceKind": "repository",
      "sourceRepositoryId": "11111111-1111-1111-1111-111111111111",
      "mode": "authoritative-upstream",
      "resolution": "prefer-source",
      "autoUpdate": true,
      "scope": [
        {
          "targetKind": "definitions",
          "definitionTypes": ["protocol"],
          "namespaces": ["mudemocracy"]
        },
        {
          "targetKind": "instances",
          "typeNamespace": "governance",
          "typeName": "decision",
          "instanceIds": [
            "33333333-3333-3333-3333-333333333333",
            "44444444-4444-4444-4444-444444444444"
          ]
        }
      ]
    }
  ]
}
```

In this model, upstream governance decisions and protocols are authoritative for the declared scope. Local conflicting content may remain stored, but the effective content is the source-preferred version until the conflict is addressed.

#### Federated example

A repository consuming another group's protocol library in a federation may declare:

```json
{
  "bindings": [
    {
      "bindingId": "community-protocols",
      "sourceKind": "package",
      "sourcePackageId": "22222222-2222-2222-2222-222222222222",
      "mode": "explicit-import",
      "resolution": "manual",
      "scope": [
        {
          "targetKind": "definitions",
          "definitionTypes": ["protocol"],
          "namespaces": ["community.adr"]
        }
      ]
    }
  ]
}
```

In this model, the peer library is visible and importable, but it has no automatic override power.

---

### Change E — Define `ext:repository-slices`

Add a new optional extension:

| Extension | Identifier | Depends on | Notes |
|---|---|---|---|
| Repository Slices | `ext:repository-slices` | `ext:repository` | Portable subset export/import for repository content |

This extension defines how a subset of repository content is exported as an importable artefact without claiming to be a full mirror of the source repository.

#### New type: `RepositorySliceDescriptor`

When `ext:repository-slices` is declared, `RepositoryManifest` gains:

```typescript
slice?: {
  sourceRepositoryId: UUID
  exportedAt: ISO8601
  isTrackedMirror?: boolean
  // When true, this slice intentionally preserves source repository identity semantics
  // for mirror/sync workflows instead of minting a new independent repository identity.

  rootInstanceIds: UUID[]
  // The selected root instances that defined the slice.

  selectionStrategy?: "manual-select" | "contains-closure" | "relation-closure" | "custom"
  // Optional informative description of how the slice was chosen.
  // Does not replace the authoritative exported instance set.

  relationMode: "between-selected" | "outbound-closure"
  // between-selected: include only Relations whose source and target are both in the slice
  // outbound-closure: also include Relations from selected instances to external cited instances

  idStrategy: "preserve-ids" | "new-ids-with-lineage"
  // How instance identities in the slice relate to the source repository.

  omitSourceDocuments?: boolean
  // When true, the producer is intentionally omitting one or more repository-document
  // sources from the slice. Receiving implementations must surface the slice as
  // provenance-incomplete rather than treating missing sources as silent corruption.

  note?: string
}
```

#### Slice semantics

A repository slice is still a conforming repository snapshot, but it is not required to represent the full source repository. It must:

- include only the selected instance set plus required closure
- include all source documents cited by included instances or Relations, unless `omitSourceDocuments === true`
- include relation files consistent with `relationMode`
- include a valid `packageRef`, and when `packageRef.mode === "local"`, the full local package required by the selected Tier 2 Records
- include a manifest `instanceIndex` that lists only the instances in the slice repository

#### Repository identity

To avoid accidental sync semantics, a repository slice exported for handoff must mint a new `repositoryId` unless `slice.isTrackedMirror === true` and the producer is explicitly creating a tracked mirror of an existing repository. `slice.sourceRepositoryId` preserves the source identity.

This preserves the current rule that `repositoryId` is the sync key while making slices safe to exchange as independent artefacts.

#### Import modes for slices

A consumer importing a repository slice may choose one of two behaviours:

1. **Mount as independent repository**
   The slice remains a standalone repository with its own `repositoryId`

2. **Merge into an existing repository**
   The consumer copies included instances into a local repository using either:
   - `preserve-ids`
   - `new-ids-with-lineage`

When merged into an existing repository, the receiving repository should record a `FederationEvent` with `event: "import"`.

When `new-ids-with-lineage` is used, the importer must create a `derived-from` Relation from each newly minted local instance to its original source instance. Implementations may use `refines` instead only when the import semantics are explicitly refinement rather than duplication. When `ext:federation` is declared, the Relation should preserve `targetRepositoryId` so the original source location remains addressable.

---

### Change F — Define repository-slice closure rules

Add the following normative closure rules to `ext:repository-slices`.

#### Instance closure

The producer selects one or more `rootInstanceIds`. The slice must contain:

- the selected root instances
- any selected descendant or explicitly included instances according to implementation policy
- every included instance file referenced by `instanceIndex`

The spec does not define one mandatory graph traversal policy beyond the selected roots; implementations may offer different selection UIs. What is normative is that the exported manifest precisely declares the resulting included set.

#### Relation closure

For `relationMode: "between-selected"`:

- include only Relations whose `sourceInstanceId` and `targetInstanceId` are both included in the slice

For `relationMode: "outbound-closure"`:

- include all Relations from included instances to other included instances
- include outbound Relations from included instances to excluded instances when those Relations are meaningful citations or dependency references
- preserve cross-repository qualifiers when present

#### Source-document closure

Every `SourceReference` with `sourceType: "repository-document"` appearing in any included instance or included Relation must resolve within the slice archive unless `slice.omitSourceDocuments === true`. When `omitSourceDocuments` is true, the producer must surface the omission explicitly and the consumer must treat the slice as provenance-incomplete rather than silently valid.

---

### Change G — Clarify the distribution mechanism

Add the following non-normative guidance after `ext:registry` and `ext:federation`.

#### Recommended distribution workflow

**For reusable definitions:**

1. Author or edit definitions locally
2. Publish them as a `Package`
3. Add a `RegistryEntry` with `downloadUrl`, `checksum`, `entryRefs`, and discovery metadata such as `declaredExtensions`
4. Consumers declare binding mode for that source: authoritative, tracked, or explicit-import
5. Consumers install or update the package through their local registry/import-tracking workflow

**For hierarchical governance:**

1. Declare a `BindingSource` pointing to the core repository or package
2. Use `mode: "authoritative-upstream"` when the core source should become effective automatically
3. Record and surface local derived conflicts rather than discarding them

**For federated exchange:**

1. Discover peer repositories or packages through federation or registries
2. Use `mode: "explicit-import"` when peer content should be adopted only by explicit local choice
3. Preserve conflict records for any imported derived divergence

**For repository content handoff:**

1. Export either a full repository archive or a repository slice
2. Share the resulting `.srs` ZIP via filesystem, Git, object storage, or HTTP
3. Consumers either mount it as a repository or merge it into an existing repository

**For long-lived repository discovery:**

1. Maintain a `RepositoryRegistry`
2. Optionally federate registries via `childRegistries`
3. Preserve unresolved external repository citations rather than rejecting them

This makes the intended roles explicit:

- `Registry` → catalogs reusable definition packages
- `Registry` metadata → supports human and AI discovery by extension, entry point, and definition kind
- `BindingSource` → declares whether an upstream source is authoritative, tracked, or explicit-only
- `RepositoryRegistry` → catalogs repositories
- `.srs` archive → shareable transport format for repository content

No central service is required for any of the above.

---

## Consequences

### Benefits

- Reuses the current Package/Registry/Import Tracking model instead of creating a parallel "template sharing" mechanism
- Gives a clean answer to the field-library requirement that fields are atomic and templates are curated compositions
- Adds an explicit answer for governance hierarchies versus federated peer exchange
- Makes subset export portable and auditable
- Preserves the identity-based import rules already defined by the spec
- Makes conflict handling a first-class, addressable concern instead of an implementation footnote
- Supports both offline file exchange and hosted distribution

### Tradeoffs

- Introduces one more optional extension: `ext:repository-slices`
- Introduces one more optional extension: `ext:binding`
- Requires producers to compute dependency closure deliberately rather than copying files loosely

---

## Deferred Follow-Ons

The following items are intentionally deferred rather than treated as blockers for this RFC:

1. **Extension-expandable definition kinds**
   A future RFC should decide whether `Reference.definitionType` remains a closed core enum extended piecemeal, or becomes an extension-expandable registry/open union so future packageable extension constructs can participate without repeated core amendments. The addition of `theme` in RFC-002 demonstrates that this pressure already exists.

2. **Richer slice-selection expressions**
   `selectionStrategy` is sufficient as informative metadata for now. A future RFC may define a richer machine-readable selection model, such as a closure DSL, query object, or standard traversal expression for reproducible repository-slice generation.

---

## Summary

This RFC does not propose a new universal sharing mechanism. It sharpens the ones SRS already has:

- share reusable definitions as **Packages**
- declare governing relationships through **Bindings**
- track updates with **Import Tracking**
- publish discoverability metadata with **Registry**
- share content as **Repository Archives**
- share subsets as **Repository Slices**

That separation aligns with both the current SRS spec and the older field-library architecture: reusable fields stay reusable, template-like compositions stay packageable, and repository content can move independently without being confused for a definition library.

**Title**: RFC-009: Root-record Type as the typing anchor for Containers, Document Views, and distributable units
**RFC Number**: 009
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: ext:views-l2 (DocumentView), Container (core), ext:blueprint (Blueprint), document-view.json, container.json, manifest.json, blueprint.json
**Content**: Adds UUID-based typed anchors to the Blueprint→View→Container linkage: DocumentView.rootTypeRefs (ExactTypeRef[]) for Container matching; Blueprint.rootTypes formally defined as ExactTypeRef[]; containers_for_instance as a normative core operation; Container metadata spec alignment (description, vocabulary-backed tags). Invariants I-63 through I-66 and I-78. Tracked in srs#39 (original), srs#67 (blueprint extension).

**Title**: RFC-011: DocumentView query extensions — lifecycle-state exclusion and repository-wide type queries
**RFC Number**: 011
**Status**: draft
**Author**: Peter Brownell
**Affected Components**: ext:views-l2 (SectionSource.type-query), document-view.json
**Content**: Adds three optional fields to SectionSource.type-query: lifecycleStates (multi-value inclusion filter), excludeLifecycleStates (exclusion filter), and containerScope (explicit | repository | subtree). Enables the decision-log pattern: rendering all non-superseded/non-abandoned decisions across a repository without listing every container ID. Tracked in the-greenman/srs#41.

**Title**: RFC-014: Import Tracking & Package Binding
**RFC Number**: 014
**Status**: in-progress
**Author**: Peter Brownell
**Affected Components**: `Package`, `PackageRef`, `UpstreamPackage` (Distribution Group); `ext:import-tracking`; `manifest.json` schema
**Proposal Artifact Path**: rfcs/rfc-014-import-tracking-package-binding.md
**Content**: Formalises the minimum viable provenance and upgrade contract for SRS repositories created from upstream packages.

**Problems addressed:** (1) `meta.upstreamPackage` is informal — stored in the non-normative `meta` object, tools may ignore it. (2) Upgrade semantics are unspecified — no spec guidance on whether old package versions must be retained when a new version is installed. (3) Divergence detection has no formal definition — `ImportRecord.conflictState: "diverged"` exists but its trigger and meaning at the repository level are undefined.

**Changes:** (A) Promotes `upstreamPackage` from `manifest.meta` to a first-class top-level manifest property. (B) Removes the `external`-mode restriction from `PackageRef.packageVersion` and `PackageRef.packageId`, making both applicable to local-mode entries. (C) Specifies multi-version install semantics: prior `PackageRef` entries MUST be retained when a new version is installed (install-alongside, not replace). (D) Makes record-definition version pinning normative: tools MUST NOT rewrite `typeId`/`fieldId`/`fieldValues` as a result of a package upgrade. (E) Defines repository-level divergence detection: when `upstreamPackage` is set, a tool MAY compare locally installed definition files against a reference copy and populate `ImportRecord.conflictState: "diverged"` for differing definitions.

**Scope exclusions:** registry distribution (`ext:registry`), federation (`ext:federation`), package authoring workflows, and upstream-ahead detection (requires registry access). These remain in RFC-003.

**Conformance rules:** R1–R10. Key structural rules: R6 extends Invariant 50 to multi-version repos (union resolution); R10 requires `upstreamPackage.packageId` to match a `PackageRef` entry.

**GitHub issue:** srs#109. Gates srs-rust#234 (Gate 0) and muDemocracy.org#37.

**Title**: RFC-016: Invariant Record Projection
**RFC Number**: 016
**Status**: accepted
**Affected Components**: `com.semanticops.spec/invariant` (rendering); `scripts/publish-spec.mjs`
**Content**: Fixes the rendering pipeline so the Key Invariants section of rendered spec views is projected from `com.semanticops.spec/invariant` records rather than hand-written subsection prose.

**Problems addressed:** (1) Invariant records I-63–I-66 and I-78–I-84 (added by RFC-009, RFC-013, and RFC-014) are invisible in all rendered spec views because the Rust CLI renders the Key Invariants section from subsection Content field prose, not from invariant records. (2) Invariants 1–62 are duplicated — encoded as records and again as inline prose — creating a silent divergence risk with no validation.

**Changes:** (A) Adds `scripts/render-invariants.mjs`, an ESM module that reads all `com.semanticops.spec/invariant` records from `srs/records/invariants/`, sorts by `invariant-number` (type-aware: JSON number used directly; `"I-NN"` string parsed to integer), groups by normalised `group` field, and returns the Key Invariants region body as a markdown string. (B) Updates `scripts/publish-spec.mjs` to import and call `renderInvariants` after `renderDocumentViews()`, performing wholesale region replacement of the Key Invariants section in each rendered view. (C, Phase 2) Removal of inline `**N.**` prose from subsection Content fields — deferred; tracked in srs#117.

**Scope exclusions:** Rust CLI changes to `srs render document-view`, Phase 2 subsection body cleanup (srs#117), new invariant type fields.

**Conformance rules:** R1–R7. Key rules: R1 (all invariant records appear in rendered output), R2 (ascending sort by derived integer key), R3 (no duplicates), R5 (pipeline fails on malformed records), R6 (absent group → "Other" heading), R7 (trailing `---` artifacts stripped).

**GitHub issue:** srs#116. Closes srs#99.

**Title**: RFC-016: Lifecycle Update Command
**RFC Number**: 016
**Status**: in-progress
**Author**: the-greenman (from issue the-greenman/srs#81)
**Affected Components**: ext:lifecycle (CLI contract), srs-usage.md (agentic write-workflow reference)
**Proposal Artifact Path**: rfcs/rfc-016-lifecycle-update-command.md
**Content**: srs lifecycle supports list, get, and create but has no update subcommand. This forces direct JSON file editing to modify an existing lifecycle definition, violating the CLI-first rule in srs-usage.md. This RFC adds srs lifecycle update <lifecycleId> to the spec, modelling it on srs type update. No schema changes are required. Full-replace semantics: caller fetches, edits, and sends the complete lifecycle JSON back. Seven conformance rules covering schema validation, id-match, RFC-006 V9 integrity (isFinal, transition id uniqueness, initial-state active-status), and full-replace write semantics.

