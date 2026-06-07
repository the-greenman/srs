> **GitHub issue**: [the-greenman/srs#12](https://github.com/the-greenman/srs/issues/12)

# RFC-007: Composite Group Rendering

**Status**: Accepted (Revision 5)
**Affects**: `ext:field-groups` (`FieldGroup.compositeRenderer`), `ext:themes-l1` (`ElementTemplates.groupFieldRowTemplates`, `ElementTemplates.compositeRendererConfig` — formerly `tableConfig`, renamed in Rev 3), `type.json` schema, `theme.json` schema
**Author**: Peter Brownell
**Date**: 2026-06-06

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-06 | Initial draft: `compositeRenderer` on `FieldGroup`, `groupFieldRowTemplates` retroactive spec alignment, `tableConfig` on `ElementTemplates` |
| 2 | 2026-06-06 | Address review findings: add extensibility naming convention for `compositeRenderer` values; require diagnostic in [FG-Cx2]; close `widths` boundary ambiguity (≤/≥); clarify `tableConfig` scope to Theme instance; document `compositeRenderer` placement on Type not record; per-format `wrapperTemplate` defaults; rename `groupFieldTemplates` → `groupFieldRowTemplates`; add `[T-Cx*]` conformance rules |
| 3 | 2026-06-06 | Generalise config surface: replace bespoke `tableConfig` with dispatch-keyed `compositeRendererConfig`; document three-part renderer definition; note `what`-on-Type / `how`-on-Theme separation in Alternatives |
| 4 | 2026-06-07 | Address Rev 3 review findings: add `[FG-Cx0]` naming convention rule; tighten `[FG-Cx2]` "non-empty" + add other-entries-continue clause; rewrite `[T-Gx1]`; add `[T-Gx3]` (`groupFieldRowTemplates` vs `fieldRow`); add `[T-Cx4]` format detection; add `[T-Cx5]` unknown config properties; add multi-entry separation rule; specify `subheading` default HTML element; add `widths` out-of-range clamp rule; update implementor note (rename already in srs-rust#49); extend note to cover srs-vscode; add extension independence clause; clarify `captionTemplate` defaults per format; tighten schema changes table |
| 5 | 2026-06-07 | Address Rev 4 review findings: specify absent-field token resolution in `wrapperTemplate`; add `[FG-Cx4]` for `widths` length mismatch; tighten `[FG-Cx0]` reverse-domain definition |

---

## Abstract

The current group rendering baseline (`render_field_groups`) treats every field in a group entry as an independent row, producing `**label**: value` output for each. This is correct for heterogeneous groups but wrong for groups whose fields compose into a single structure — most importantly, the `tables` group pattern where `columns` + `rows` + `widths` should produce a rendered table, not three raw JSON strings.

Separately, `groupFieldRowTemplates` was added to the srs-rust implementation without a corresponding spec change. This RFC introduces a composite renderer dispatch mechanism (`compositeRenderer` on `FieldGroup`), retroactively specifies `groupFieldRowTemplates`, and adds a generalised per-renderer config surface (`compositeRendererConfig` on `ElementTemplates`) that scales to future renderers without schema amendments.

---

## Motivation

### Problem 1 — JSON array fields rendering as raw strings

A `section.table` record has a `tables` field group with entries containing `columns` (JSON array), `rows` (JSON array of arrays), and `widths` (JSON array). The rendering baseline outputs:

```
**columns**: ["Question","What to write"]
**rows**: [["What was decided?","One clear sentence..."]]
```

The intended output is a rendered table:

```
| Question | What to write |
|---|---|
| What was decided? | One clear sentence... |
```

No mechanism in the current spec allows this transformation.

### Problem 2 — Per-field group templates shipped without spec backing

`groupFieldRowTemplates` (a `HashMap<fieldName, templateString>` on `ElementTemplates`) was added in srs-rust to allow per-field formatting within group entries (e.g. bold term + plain body for `item-term`/`item-body` pairs). This is a correct and useful feature but was never specified.

---

## Proposed Changes

### Change A — `compositeRenderer` on `FieldGroup` (ext:field-groups)

Add an optional `compositeRenderer` property to `FieldGroup`:

```typescript
compositeRenderer?: string
// When set, the renderer treats this group's entries as a single composite
// structure rather than iterating fields individually.
//
// Naming convention (normative — see [FG-Cx0]):
//   Bare identifiers (e.g. "table", "timeline") are reserved for SRS-defined renderers
//   and MUST only be introduced by a ratified RFC.
//   Vendor-specific values MUST use the form "{reverse-domain}/{name}"
//   (e.g. "com.example/gantt"). Implementations MUST NOT reject namespaced values;
//   rule [FG-Cx1] applies to all unrecognised values regardless of form.
//
// Known SRS-defined value: "table"
```

**`compositeRenderer: "table"`** — the group's entries each contain the following named fields (resolved via `FieldGroup.fields[].fieldId → Field.name`):

| Field name | Type | Role |
|---|---|---|
| `columns` | JSON array of strings | Column headers |
| `rows` | JSON array of string arrays | Row data |
| `widths` | JSON array of numbers in [0.0, 1.0] (optional) | Column proportional widths; alignment hint in markdown, `style="width:N%"` in HTML |
| `subheading` | string (optional) | Heading rendered before the table |
| `label` | string (optional) | Caption for the table |

`compositeRenderer` is a property of the **`FieldGroup` in the Type definition**, not a per-record property. Existing records are unaffected until the Type definition is updated to include `compositeRenderer`. There is no record-level migration — the change applies to all records of the updated type on next render.

**Markdown output** — each entry produces a GFM pipe table:

```markdown
#### Subheading (if present)

*Label text* (if present)

| col1 | col2 |
| --- | --- |
| val1 | val2 |
```

Column alignment from `widths` (values clamped to [0.0, 1.0] per `[FG-Cx3]`): value ≤ 0.3 → `:---` (left-align), value ≥ 0.7 → `---:` (right-align), else `---` (default). Boundary values are deterministic — exactly 0.3 aligns left, exactly 0.7 aligns right.

**HTML output** — each entry produces a `<figure>` / `<table>` structure (see Change C for theming hooks). `widths` values are rendered as `<col style="width:{n*100}%">`. Default element for `subheading` when no `wrapperTemplate` is set: `<h4>`.

**Multi-entry rendering** — when a group has multiple entries (i.e. `repeatable: true`), each entry is rendered independently in sequence. In markdown output, entries are separated by a blank line. In HTML output, each entry produces its own `<figure>` element; no separator element is inserted.

**Composite renderer definition** — every composite renderer is fully specified by three things:

1. **A name** — bare (SRS-reserved, RFC-ratified) or `{reverse-domain}/{name}` (vendor).
2. **A field-name contract** — the `Field.name` values it resolves from each group entry.
3. **A per-format output spec** — what it emits for markdown, HTML, and other formats.

`table` is the first worked example of this template.

### Change B — `groupFieldRowTemplates` on `ElementTemplates` (ext:themes-l1 — retroactive alignment)

Add `groupFieldRowTemplates` to `ElementTemplates`:

```typescript
groupFieldRowTemplates?: { [fieldName: string]: string }
// Per-field-name templates for rendering individual field rows within group entries.
// Key: Field.name (e.g. "item-term")
// Value: template string supporting {{field-value}} and {{field-label}}
// When present, overrides fieldRow for that field within group entries (see [T-Gx3]).
// Applied only when compositeRenderer is absent or unknown (fallen back to baseline).
// When compositeRenderer is set to a known value, the composite renderer
// controls all output for the group — groupFieldRowTemplates is ignored [T-Gx1].
```

Template variables: `{{field-value}}`, `{{field-label}}`.

> **Implementation note**: The rename from `groupFieldTemplates` to `groupFieldRowTemplates` was applied in srs-rust#49 (merged). No further JSON key migration is required in the Rust implementation. The corresponding srs-vscode schema at `srs-vscode/schemas/2.0/theme.json` must also carry `groupFieldRowTemplates` (not `groupFieldTemplates`), and any srs-vscode theme-parsing code must be updated accordingly.

**Extension independence** — `groupFieldRowTemplates` and `compositeRendererConfig` (Change C) are `ext:themes-l1` additions and require that extension to be declared. `compositeRenderer` on `FieldGroup` (Change A) is a pure `ext:field-groups` addition with no dependency on `ext:themes-l1`. A repository that declares `ext:field-groups` but not `ext:themes-l1` may use `compositeRenderer: "table"` — rendering will apply the renderer's default output shapes (no theme-level config surface is available until `ext:themes-l1` is also declared).

### Change C — `compositeRendererConfig` on `ElementTemplates` (ext:themes-l1)

Add `compositeRendererConfig` to `ElementTemplates`. This is a dispatch-keyed map using the same identifier space as `FieldGroup.compositeRenderer`:

```typescript
compositeRendererConfig?: { [rendererName: string]: object }
// Per-renderer configuration, keyed by the same identifier space as
// FieldGroup.compositeRenderer (bare SRS names or "{reverse-domain}/{name}").
// Unknown properties within a known renderer's sub-object MUST be silently ignored [T-Cx5].
//
// The "table" renderer reads its config from compositeRendererConfig["table"]:
//   {
//     tableClass?: string
//     // CSS class on <table> element (HTML output only).
//     // Default: "srs-data-table". Set to "" to suppress the class attribute.
//
//     wrapperTemplate?: string
//     // Wraps the full rendered entry. Tokens: {{subheading}}, {{label}}, {{table}}.
//     // When a group entry does not have a value for an optional field token
//     // ({{subheading}} or {{label}}), that token MUST resolve to the empty string.
//     // Default (HTML): <figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>
//     // Default (other formats): no wrapper applied (entries rendered inline).
//     // When explicitly set, applies regardless of output format [T-Cx4].
//
//     captionTemplate?: string
//     // Template for the label field. Token: {{field-value}}.
//     // Default (HTML): <figcaption>{{field-value}}</figcaption>
//     // Default (markdown): *{{field-value}}*
//     // Default (other formats): {{field-value}} with no decoration.
//   }
```

`compositeRendererConfig` is scoped to the `ElementTemplates` instance — i.e. the `Theme`. A render pass resolves at most one active `Theme` per `DocumentView` (via `[T-2]` in RFC-002); that Theme's `compositeRendererConfig` applies to all composite renderers active in that pass. When `DocumentView.format` is used to determine format-conditional defaults, implementations MUST consult `DocumentView.format` as the authoritative signal (see `[T-Cx4]`).

A vendor renderer reads `compositeRendererConfig["com.example/gantt"]` using whatever schema that renderer defines. No spec amendment is required for a vendor to carry config.

---

## Conformance Rules

> **[FG-Cx0]** Bare `compositeRenderer` identifiers (containing no `/` character) are reserved for SRS-defined renderers and MUST only be introduced by a ratified RFC. Vendor-defined renderer identifiers MUST use the form `{reverse-domain}/{name}` where `reverse-domain` is a dot-separated string with at least two labels (e.g. `"com.example"`) and `name` is a non-empty string with no `/` character (e.g. `"com.example/gantt"`). Single-label left-hand sides (e.g. `"example/gantt"`) MUST be treated as malformed and are subject to `[FG-Cx1]`. An identifier that is neither a bare SRS-reserved name nor a valid `{reverse-domain}/{name}` form MUST be treated as unrecognised; `[FG-Cx1]` applies.

> **[FG-Cx1]** When `FieldGroup.compositeRenderer` is set to a value not recognised by the implementation, the implementation MUST fall back to the default per-field rendering baseline and MUST emit a diagnostic identifying the unrecognised renderer value and the group. The fallback MUST NOT suppress group content.

> **[FG-Cx2]** For `compositeRenderer: "table"`, if an entry contains neither a `columns` field with at least one element nor a `rows` field with at least one element, that entry MUST be skipped and the implementation MUST emit a diagnostic identifying the group and the entry. Other entries in the same group that satisfy the field contract MUST continue to render normally.

> **[FG-Cx3]** Values in a `widths` array that fall outside [0.0, 1.0] MUST be clamped to [0.0, 1.0] before alignment or width calculation. Implementations SHOULD emit a diagnostic identifying the out-of-range value and the group entry.

> **[FG-Cx4]** When the `widths` array has fewer elements than `columns`, the remaining columns MUST use the default alignment (`---` in markdown; no `style` attribute in HTML). When `widths` has more elements than `columns`, the excess elements MUST be silently ignored. In either case, implementations SHOULD emit a diagnostic identifying the mismatch.

> **[T-Gx1]** When `FieldGroup.compositeRenderer` is set to a known value, implementations MUST NOT apply `groupFieldRowTemplates` to that group's entries. `groupFieldRowTemplates` MUST only be applied when the group is rendered by the per-field baseline (i.e. `compositeRenderer` is absent or falls back via `[FG-Cx1]`).

> **[T-Gx2]** Field names in `groupFieldRowTemplates` that do not appear in the rendered group MUST be silently ignored and MUST NOT cause an error.

> **[T-Gx3]** When a field row in a group entry is covered by a matching key in `groupFieldRowTemplates`, implementations MUST use that template instead of `fieldRow`. The `fieldRow` template MUST NOT be applied to field rows rendered via `groupFieldRowTemplates`.

> **[T-Cx1]** When `compositeRendererConfig["table"]` is absent or its `tableClass` property is absent, implementations MUST use `"srs-data-table"` as the default CSS class on the `<table>` element for HTML output.

> **[T-Cx2]** When `tableClass` is explicitly set to an empty string `""`, implementations MUST emit the `<table>` element with no `class` attribute.

> **[T-Cx3]** `wrapperTemplate` and `captionTemplate` in `compositeRendererConfig["table"]` apply to each entry rendered by `compositeRenderer: "table"`. They MUST NOT affect groups with other `compositeRenderer` values or groups without a `compositeRenderer`.

> **[T-Cx4]** When evaluating format-conditional defaults for `wrapperTemplate` and `captionTemplate`, implementations MUST use `DocumentView.format` as the authoritative active format signal. When `wrapperTemplate` is explicitly set in `compositeRendererConfig["table"]`, implementations MUST apply it regardless of output format.

> **[T-Cx5]** Unknown properties in a `compositeRendererConfig` sub-object for a known renderer name MUST be silently ignored and MUST NOT cause a rendering error.

---

## Schema changes

| Schema file | Change |
|---|---|
| `type.json` | Add `compositeRenderer?: string` to `FieldGroup.$defs` |
| `theme.json` | Add `groupFieldRowTemplates?: { [fieldName: string]: string }` and `compositeRendererConfig?: { [rendererName: string]: object }` to `ElementTemplates` |

Schema files were updated in srs-rust#49 (merged). The schemas at `srs-rust/crates/srs-schema/schemas/2.0/` already carry these changes.

Schema changes must also be synced to:
- `srs-vscode/schemas/2.0/` (manual copy — not yet done; required before srs-vscode implementation)

---

## Rationale

**Dispatch on `FieldGroup` (Type), config on `ElementTemplates` (Theme)** — `compositeRenderer` declares *what* the data is (a table); `compositeRendererConfig` declares *how* to present it. Keeping these separate preserves the semantic/presentation split. A consequence: the dispatch applies uniformly across all views — you cannot show a group as raw paired fields in one view and as a table in another. This is the correct trade-off for data with a clear inherent structure. Authors who need format-specific behaviour should use different `DocumentView` configurations with different `Theme.targets`.

**Dispatch-keyed config map over per-renderer top-level properties** — `tableConfig` as a direct property of `ElementTemplates` would require a new property for every future renderer. `compositeRendererConfig` as a keyed map scales without schema amendments. The same identifier convention used for dispatch now governs config — one pattern applied consistently.

**`widths` not renamed to `columnAlignments`** — `widths` already exists in deployed repos as a numeric array. The name is accurate for both interpretations (alignment hint in markdown, proportional width in HTML). Renaming deferred unless a distinct HTML-only width concept arises.

---

## Alternatives Considered

### Alt A — `renderHint` on `FieldView`

Adding `renderHint: "markdown-table"` to individual fields would avoid the FieldGroup change but doesn't address multi-field composition (a table requires `columns` + `rows` together). Architecturally insufficient.

### Alt B — Template DSL with iteration

A Handlebars/Mustache-style template with iteration over rows. Adds a template expression language with significant spec and implementation surface area for a fixed use case. Rejected.

### Alt C — `compositeRenderer` on the group entry rather than the FieldGroup type

Per-entry composition mode would be more flexible but makes the Type definition ambiguous and complicates validation. Group-level declaration is cleaner and aligns with how Types define structure.

### Alt D — Rename `widths` to `columnAlignments` with enum values

Cleaner separation of concerns but breaks existing deployed repos with `widths` as numeric arrays. Numeric proportions serve both alignment (markdown) and width (HTML) correctly.

---

## Open Questions

**None.** All open questions resolved.

| # | Summary | Resolution |
|---|---|---|
| 1 | `widths` dual-purpose (alignment vs. HTML width) | `widths` serves both: alignment hint in markdown (≤ 0.3 left, ≥ 0.7 right), proportional width in HTML |
| 2 | `tableClass` default value | Default `"srs-data-table"`; empty string suppresses the class attribute |
| 3 | `groupFieldTemplates` vs `groupFieldRowTemplates` naming | Renamed to `groupFieldRowTemplates` — adopted in Rev 2, shipped in srs-rust#49 |
