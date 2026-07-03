> **GitHub issue**: [the-greenman/srs#114](https://github.com/the-greenman/srs/issues/114)

# RFC-015: View-Owned Ordering & Declared Root Presentations

**Status**: In Progress (Revision 2)
**Affects**: `document-view.json` (`DocumentSection.ordering`, `container-subset` SectionSource), `manifest.json` (new top-level `renderedPresentations`), `ext:views-l2` (Rules [N+28]–[N+30]), `ext:repository` / `manifest.json` (Rule [N+31])
**Author**: the-greenman (from epic the-greenman/srs#95, Phase 1 gate / issue #114)
**Date**: 2026-07-03
**Builds on**: RFC-013 (Required Root Container — structural navigation via `precedes`, nav-order Rule [N+12]), RFC-008 (Heterogeneous container-subset sections — Rules [N+12], [N+18], [N+19], [N+21], [N+22])

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-03 | Initial draft |
| 2 | 2026-07-03 | Add `direction: "desc"` step (4) to Rule [N+29]; close OQ-1 (resolved). Fix RFC-014 dangling reference in Rationale. Promote OQ-2 resolution into Rule [N+31] (multi-package conflict + `viewId` failure); close OQ-2. Add Migration section. Add diagnostic asymmetry rationale. Add New Invariants note. Add RFC-013 OQ-1 acknowledgment. Fix `[N+20]–[N+21]` → `[N+19]–[N+21]` in Change B. Fix `direction` description in schema snippets. Fix Affects header for [N+31]. Fix MUST wording in Rule [N+29] step (2). Implementation started; spec records authored in `srs/srs/`; PR opened as srs#115. |

---

## Abstract

RFC-013 established that navigation order derives from the `precedes` chain (Rule [N+12]) and explicitly declined to introduce a new ordering primitive, calling this the "no new ordering primitive" position. This RFC intentionally revisits that position at one specific layer: **presentation**. It draws a normative boundary between *semantic* order (`precedes` — where a different order would be *wrong*) and *presentational* order (view-owned — where many concurrent arrangements over the same records are legitimate and none is a semantic claim). It then introduces two concrete mechanisms: (1) an explicit `ordering.memberOrder` list on `container-subset` DocumentView sections, letting a View arrange members independently of `precedes`; and (2) a normative `renderedPresentations` field on the repository manifest that declares which DocumentView(s) constitute the repository's presentations and which is the default, so a conformant viewer opens the document the group intended.

---

## Motivation

### Problem 1 — `precedes` is being used for presentation, corrupting semantic data

`precedes` is the SRS relation for semantic sequence: spec sections belong in a specific order because changing the order changes the *meaning* (a normative rule must precede the paragraph that depends on it; a protocol stage must precede the one it enables). RFC-013 uses `precedes` to drive the root-container navigation order, which is appropriate because section A genuinely precedes section B in the repository's logical structure.

However, governance repositories (Decision Logs, meeting notes) frequently need to arrange decisions in a *rendered presentation* that differs from their logical order — newest first, or grouped by status, or manually curated — without asserting that a different order is *wrong*. If a scaffolding tool (Gate A `repo create`) emits `precedes` relations to achieve a presentational order, every repository created thereafter carries relations indistinguishable from genuine semantic precedence. This data cannot be recovered by tooling once repositories exist in the wild: code is rework, data is forever.

No mechanism currently exists to express view-level presentational arrangement without `precedes`. Implementors facing this gap either (a) misuse `precedes` for layout, polluting the semantic graph, or (b) invent per-system conventions outside the spec.

### Problem 2 — A repository has no normative way to declare its presentations

The spec repo's `manifest.json` carries `meta.renderedExports`, an informal hint listing the files produced by the publish script. There is no conformance-level concept of "which DocumentView is the default presentation for this repository" or "what should a viewer open when a user navigates to this repository." Viewers (srs-web, future consumers) each invent their own selection logic — opening the first DocumentView in the package, querying by `containerType`, or hardcoding a view name. These approaches are fragile, non-portable, and block the muDemocracy governance viewer from being built on a stable foundation.

### Problem 3 — View ordering and `precedes` ordering are conflated

RFC-013's nav order (filter-then-project over `precedes`) and a DocumentView's `container-subset` ordering (also `precedes`-based per Rule [N+12]) currently agree by construction. But when a View declares a custom arrangement — newest-first decisions, manual curation — it needs to diverge from `precedes` without invalidating the semantic graph. No rule currently permits this divergence; the only field-based alternative (`ordering.fieldId`) requires a field whose value determines the order, which is not available for manual curation or insertion-time-independent orderings.

---

## Proposed Changes

### Change A — Normative layering principle: `precedes` is semantic-only

The spec introduces a normative principle separating ordering concerns:

| Ordering concern | Owner | Characteristic |
|---|---|---|
| Semantic sequence | `precedes` relation | Changing the order changes the *meaning*; one correct order exists |
| Structural navigation | Root-container `precedes` chain (RFC-013 [N+12]) | Derived from semantic precedence among section roots |
| Presentational arrangement | DocumentView `ordering` | View-level; many concurrent arrangements are legitimate; none is a semantic claim |

Implementations MUST NOT create `precedes` relations to achieve a presentational ordering goal. `precedes` is reserved for sequences where a different order would be semantically wrong (spec sections in document order, protocol stages in execution sequence).

This principle explicitly supersedes the RFC-013 "no new ordering primitive" position at the *presentation* layer only. Structural navigation and semantic precedence continue to be derived from `precedes`; the new `memberOrder` field (Change B) is the ordering primitive for the presentation layer alone.

### Change B — `ordering.memberOrder` on `container-subset` sections

A new optional key `memberOrder` is added to `DocumentSection.ordering`:

| Property | Type | Required | Scope |
|---|---|---|---|
| `ordering.memberOrder` | `uuid[]` | optional | `container-subset` source only |

**Semantics:**

- `memberOrder` is a view-owned, explicit presentation sequence. It lists the `instanceId`s of container members in the order they should appear in this section's rendered output.
- `memberOrder` MUST NOT be combined with `ordering.fieldId` on the same section. A section that specifies both is invalid; validators MUST report an error.
- `memberOrder` applies only to sections whose `source.type` is `container-subset`. On any other section source variant it MUST be ignored by implementations (with a diagnostic) and SHOULD be rejected at package-validation time.
- **Unlisted/new members**: Container members not present in `memberOrder` are **appended** after the listed members, in [N+12] order (topological sort by `precedes`, `createdAt` tiebreak). This ensures new members added to the container always appear without requiring an update to the View.
- **Departed members**: `memberOrder` entries that name an `instanceId` no longer in the container MUST be silently skipped. Implementations MUST emit a diagnostic but MUST NOT treat this as a validation failure (the container changes over time; a stale `memberOrder` entry is expected and recoverable).
- **Interaction with `typeFilter`**: When both `typeFilter` and `memberOrder` are present, apply `typeFilter` first (per Rules [N+19]–[N+21]) to obtain the filtered member set, then apply `memberOrder` over that set. `memberOrder` entries that name members excluded by `typeFilter` are silently skipped. Unlisted filtered survivors are appended in [N+12] order.
- **Interaction with `ordering.direction`**: When `ordering.direction` is `"desc"`, the entire output sequence (listed members + unlisted-member tail, combined per steps (1)–(3) of Rule [N+29]) MUST be reversed before emission. This reversal applies to the declared list and the tail together, consistent with the existing `fieldId` + `direction` behaviour.
- **Interaction with Rules [N+18], [N+21], [N+22]**: `typeDispatch` (Rule [N+18]) still MUST NOT change ordering — `memberOrder`, like `fieldId`, governs ordering, not `typeDispatch`. Rule [N+21] (filter-then-project for `typeFilter` + [N+12]) applies to the unlisted-member tail when `memberOrder` is present; it does not apply to the explicitly listed members, whose sequence is defined by `memberOrder`. Rule [N+22] (`typeFilter` + `ordering.fieldId`) is rendered moot when `memberOrder` replaces `fieldId`.

**Shape change to `DocumentSection.ordering`:**

Before:
```json
"ordering": {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "fieldId": { "type": "string", "format": "uuid" },
    "direction": { "type": "string", "enum": ["asc", "desc"], "description": "Default: 'asc'." }
  }
}
```

After:
```json
"ordering": {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "fieldId": { "type": "string", "format": "uuid" },
    "direction": { "type": "string", "enum": ["asc", "desc"], "description": "Default: 'asc'." },
    "memberOrder": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" },
      "description": "RFC-015. View-owned explicit presentation sequence for container-subset sections. Lists instanceIds in presentation order. Members not listed are appended in [N+12] order. MUST NOT be combined with fieldId."
    }
  }
}
```

The mutual-exclusion constraint (`memberOrder` and `fieldId` MUST NOT coexist) is enforced by conformance Rule [N+29] and by package-validation logic; it is not expressed as a JSON Schema `not`/`oneOf` constraint to avoid breaking existing validators that do not yet understand `memberOrder`.

### Change C — Normative `renderedPresentations` on `manifest.json`

A new optional top-level property `renderedPresentations` is added to `manifest.json`. This promotes the informal `meta.renderedExports` pattern to a normative declaration:

| Property | Type | Required | Description |
|---|---|---|---|
| `renderedPresentations` | `RenderedPresentation[]` | optional | Declared presentations for this repository |

**`RenderedPresentation` shape:**

| Field | Type | Required | Description |
|---|---|---|---|
| `viewId` | `uuid` | required | UUID of the DocumentView (`DocumentView.id`) that constitutes this presentation. MUST resolve to a DocumentView in the repository's active package(s). |
| `isDefault` | `boolean` | optional | When `true`, this entry is the presentation a conformant viewer opens by default. At most one entry per array SHOULD carry `isDefault: true`; when multiple do, the first is used. |
| `format` | `string` | optional | Output format hint for tooling (e.g. `"markdown"`, `"html"`). Not normative for viewer selection; informational only. |
| `outputPath` | `string` | optional | Relative path hint for rendered export scripts. Not normative for viewer selection; informational only. |

**Semantics:**

- When `renderedPresentations` is absent or empty, viewer selection behaviour is unchanged (existing fallback: auto-select by `rootTypeRefs`, `containerType` hint, or implementation-defined heuristic).
- When `renderedPresentations` is present and non-empty, a conformant viewer MUST select the entry with `isDefault: true` as the default presentation. If no entry has `isDefault: true`, the first entry is the default.
- The selected DocumentView governs the repository's presentation: its section ordering (whether `precedes`-based [N+12], `ordering.fieldId`, or `ordering.memberOrder`) is what the viewer renders. `renderedPresentations` declares *which* View; the View's own definitions declare *how* it is arranged.
- `renderedPresentations` replaces `meta.renderedExports` for the normative use case. Authors SHOULD migrate existing `meta.renderedExports` entries to `renderedPresentations`, leaving only implementation-local hints in `meta`. The `meta.renderedExports` key becomes informally deprecated for normative use; it is not removed (to avoid breaking existing tooling).

**Schema addition:**

```json
"renderedPresentations": {
  "type": "array",
  "items": { "$ref": "#/$defs/RenderedPresentation" },
  "description": "RFC-015. Declared presentations for this repository. A conformant viewer opens the isDefault entry (or first entry) as the default view."
}
```

With a new `$defs` entry:

```json
"RenderedPresentation": {
  "type": "object",
  "required": ["viewId"],
  "additionalProperties": false,
  "description": "RFC-015. A declared presentation of this repository: a DocumentView that a conformant viewer should offer as a rendered entry point.",
  "properties": {
    "viewId": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the DocumentView (DocumentView.id) constituting this presentation. Must resolve to a DocumentView in the active package(s)."
    },
    "isDefault": {
      "type": "boolean",
      "description": "When true, this is the presentation a viewer opens by default. First isDefault:true entry wins when multiple are present."
    },
    "format": {
      "type": "string",
      "description": "Output format hint for render tooling (e.g. 'markdown', 'html'). Informational only; does not affect viewer selection."
    },
    "outputPath": {
      "type": "string",
      "description": "Relative path hint for rendered export scripts. Informational only; does not affect viewer selection."
    }
  }
}
```

### New Invariants

The following invariants will be assigned permanent I-numbers when spec records are authored in Stage 6. Provisional labels for cross-reference:

| Provisional label | Rule | Content |
|---|---|---|
| I-NEW-A | [N+28] | `precedes` is used only for sequences where a different order is semantically wrong |
| I-NEW-B | [N+29] | `memberOrder` application algorithm (four steps including `direction` reversal) |
| I-NEW-C | [N+30] | `typeFilter`-first then `memberOrder` on filtered set |
| I-NEW-D | [N+31] | `renderedPresentations` default selection and `viewId` resolution |

Actual I-numbers will be assigned after `srs record list --type com.semanticops.spec/invariant` confirms the highest existing number.

---

## Conformance Rules

> **[N+28]** (RFC-015, Change A — Semantic-only `precedes`) `precedes` relations MUST be used only to express sequences where a different order would be semantically wrong (e.g. spec sections in document order, protocol stages in execution sequence). Implementations MUST NOT create `precedes` relations between instances whose ordering is presentational (layout, curation, display preference). A `precedes` relation between two container members MUST be interpreted as a semantic claim about their sequence, not as a rendering hint.
>
> **[N+29]** (RFC-015, Change B — `ordering.memberOrder`) When `DocumentSection.ordering.memberOrder` is present and the section's `source.type` is `container-subset`, implementations MUST apply it as the presentation sequence: (1) emit listed `instanceId`s that are current container members in the declared order; (2) skip listed `instanceId`s that are no longer container members — implementations MUST emit a diagnostic; this MUST NOT be treated as a validation failure; (3) append surviving container members not in `memberOrder` in Rule [N+12] order (topological sort by `precedes`, `createdAt` tiebreak); (4) when `ordering.direction` is `"desc"`, the entire output sequence produced by steps (1)–(3) MUST be reversed before emission. `memberOrder` MUST NOT be combined with `ordering.fieldId` on the same section — a section carrying both is invalid; implementations MUST report a validation error. `memberOrder` on a non-`container-subset` section MUST be ignored with a diagnostic and SHOULD be rejected at package-validation time.
>
> **[N+30]** (RFC-015, Change B — `memberOrder` with `typeFilter`) When both `typeFilter` and `memberOrder` are present on a `container-subset` section, `typeFilter` is applied first per Rules [N+19]–[N+21] to obtain the filtered member set; `memberOrder` is then applied over that filtered set. `memberOrder` entries naming members excluded by `typeFilter` are silently skipped (no diagnostic). Unlisted filtered survivors are appended in [N+12] order as per Rule [N+29] step (3). The `direction` reversal in Rule [N+29] step (4) applies to the combined result after `typeFilter` and `memberOrder` are both applied.
>
> **[N+31]** (RFC-015, Change C — `renderedPresentations`) When `manifest.renderedPresentations` is present and non-empty, a conformant viewer MUST select as the default presentation the first entry whose `isDefault` is `true`. When no entry carries `isDefault: true`, the first entry in the array is the default. The selected DocumentView governs the repository's presentation. When a `renderedPresentations` entry's `viewId` does not resolve to a DocumentView in the active packages, implementations MUST skip that entry and MUST emit a diagnostic; if all entries fail to resolve, behaviour falls back to implementation-defined selection as if `renderedPresentations` were absent. When `viewId` resolves to DocumentViews in more than one active package, implementations MUST report a validation error (ambiguous view reference). When `renderedPresentations` is absent or empty, viewer behaviour falls back to implementation-defined selection (existing behaviour unchanged; no conformance obligation is added for the absent case).

---

## Schema changes

| Schema file | Change |
|---|---|
| `document-view.json` | Add `memberOrder: uuid[]` property to `$defs/DocumentSection.ordering` with description referencing RFC-015 Rule [N+29]. Preserve existing `direction` description. |
| `manifest.json` | Add `renderedPresentations: RenderedPresentation[]` as a top-level optional property; add `$defs/RenderedPresentation` with `viewId` (required), `isDefault`, `format`, `outputPath`. |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

Per multi-repo merge order rules, the mirror PRs in `srs-rust` and `srs-vscode` MUST be merged before this spec PR.

---

## Migration

### `meta.renderedExports` → `renderedPresentations`

Repositories carrying `meta.renderedExports` entries SHOULD add a corresponding `renderedPresentations` array. Each export entry maps as follows:

- `outputPath` → `outputPath` (unchanged)
- `format` → `format` (unchanged)
- The View referenced by name → `viewId`: look up the DocumentView by name/id in the active package and use its stable UUID
- Designate the primary presentation entry with `isDefault: true`

The `meta.renderedExports` key MAY remain for backward compatibility with tooling that reads it; it carries no normative meaning after this RFC. The spec repo's own `manifest.json` will be updated to carry both `renderedPresentations` (normative) and `meta.renderedExports` (tool hint for `scripts/publish-spec.mjs`) as part of Stage 6 work.

---

## Rationale

### Why `memberOrder` in `ordering` rather than in `SectionSource.container-subset`

`ordering.fieldId` and `ordering.direction` live on `DocumentSection`, not inside `SectionSource`. `memberOrder` is a parallel ordering specification — it is a different way to express section ordering alongside `fieldId`. Placing it inside `ordering` is consistent with the existing structure and keeps all ordering specifications in one object. The constraint that it only applies to `container-subset` is enforced by conformance rules, not schema structure — matching the existing treatment of `ordering.fieldId` (which also behaves differently per source type but is defined at the section level).

### Why not reuse `ordering.fieldId` with a synthetic "curation-order" field

`ordering.fieldId` requires a Field whose value determines the sort order. A manual curation order is not a property of the record — it is a property of the presentation. Creating a synthetic field on every record to encode curation order would pollute the data model with presentation concerns, exactly the conflation this RFC is designed to prevent.

### Why `renderedPresentations` at the manifest level rather than at the container level

A repository's declared presentations are a repository-level concept: "what should a viewer show when it opens this repository." Placing the declaration in `manifest.json` follows the pattern established by RFC-013 (`manifest.container` for the root container) and the `meta.upstreamPackage` field (introduced for package provenance tracking in the `ext:import-tracking` extension). Container-level placement would require every container to carry presentation declarations, creating duplication and ambiguity about which container's declarations govern the repository entry point.

### Why `viewId` (UUID) rather than a view name

View names are package-local and can collide across packages. `viewId` (the DocumentView's `id` field, a stable UUID) is globally unique and unambiguous. This follows the pattern of `rootTypeRefs` in RFC-009 and the general SRS preference for UUID-based references.

### Why keep `meta.renderedExports`

Removing `meta.renderedExports` immediately would break existing tooling (notably `scripts/publish-spec.mjs` which reads it). The field is deprecated for the normative use case but retained in `meta` for backward compatibility. See Migration section for the transition path.

### Relationship to RFC-013 "no new ordering primitive" position

RFC-013 declined to introduce a new ordering primitive because all ordering concerns (scope, sequence, presentation) already had owners. This RFC revisits only the *presentation* layer, where the existing owners (`precedes` for semantic, `ordering.fieldId` for field-based sort) do not cover manual curation or insertion-order-independent arrangements. `memberOrder` is the missing owner for that layer. It does not affect semantic ordering (`precedes`), structural navigation (still derived from `precedes` per RFC-013), or the field-based sort path (`ordering.fieldId`).

This RFC also serves as a partial answer to RFC-013 Open Question 1 (the "exact binding shape for the root container DocumentView" question deferred to Phase 3): `memberOrder` on a `container-subset` section is the mechanism by which a View declares an explicit arrangement of container members independently of `precedes`. The complete Phase 3 binding shape (how a scaffolded repository wires its root container DocumentView) builds on this foundation.

### Diagnostic asymmetry: departed `memberOrder` entries vs. non-`container-subset` usage

Rule [N+29] requires a diagnostic (not an error) for departed `memberOrder` entries, while `memberOrder` on a non-`container-subset` section SHOULD be rejected at package-validation time. This asymmetry is intentional: departed entries are expected and recoverable as containers evolve — stale UUID references accumulate naturally as records are removed from containers, and treating them as errors would make `memberOrder` fragile in practice. Non-`container-subset` usage, by contrast, is a schema-authoring mistake with no legitimate interpretation; it indicates the View author applied `memberOrder` to an incompatible section source type, warranting rejection rather than silent recovery.

---

## Alternatives Considered

### Alt A — Allow `precedes` for presentation; document the difference post-hoc

Rejected. Once `precedes` edges exist in data, they cannot be distinguished from semantic precedence by any tool that reads the graph. The data corruption is permanent and unrecoverable.

### Alt B — A new relation type `displayPrecedes` parallel to `precedes`

This would preserve `precedes` for semantics and introduce `displayPrecedes` for presentation ordering. Rejected because: (1) it proliferates the relation vocabulary with a concept that is purely a view concern — display order belongs in the DocumentView definition, not in the shared relation graph; (2) it makes relation-graph traversal more complex; (3) `memberOrder` on a DocumentView already solves the problem without touching the relation graph at all.

### Alt C — `renderedPresentations` on the root `Container` rather than on `manifest`

Rejected because the root Container is for structural identity (RFC-013). Presentation declarations are a manifest-level concept following the established pattern (RFC-013, `ext:import-tracking`). See Rationale above.

### Alt D — A separate `presentations.json` sidecar file

Rejected as unnecessary complexity. A top-level manifest field is simpler, consistent with the approach used for other manifest extensions, and avoids introducing a new file layout convention.

---

## Open Questions

**None.** All questions resolved in Revision 2:

- **OQ-1** (`direction` reversal behaviour): Resolved — reverse the entire output sequence (listed + tail) when `direction: "desc"`, per Rule [N+29] step (4). Consistent with `fieldId` + `direction` behaviour.
- **OQ-2** (`viewId` multi-package conflict): Resolved — a conflict (two packages with a DocumentView of the same UUID) is a validation error; implementations MUST report it, per Rule [N+31]. Single-package repos are unaffected.
