> **GitHub issue**: [the-greenman/srs#125](https://github.com/the-greenman/srs/issues/125)

# RFC-017: Governance Package — Primary-Export DocumentView and Seed Root Container

**Status**: Draft (Revision 1)
**Affects**: `packages/com.mudemocracy.governance/1.0.0/` (new `governance-document` DocumentView; seed `manifest.container` + `renderedPresentations`)
**Author**: the-greenman (from epic the-greenman/srs#95, Phase 3 / Gate C, issue #97)
**Date**: 2026-07-06
**Builds on**: RFC-013 (Required Root Container — `manifest.container` required, I-79–I-82), RFC-015 (View-Owned Ordering & Declared Root Presentations — `renderedPresentations`, Rule [N+31])

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-06 | Initial draft |

---

## Abstract

RFC-013 required `manifest.container` on every conforming SRS repository and deferred the explicit top-level DocumentView binding (OQ-1) to Phase 3. RFC-015 resolved OQ-1 by introducing `renderedPresentations` on the manifest. This RFC closes the remaining Phase 3 work for the governance package: it adds a new `governance-document` DocumentView that renders the complete governance corpus (articles, roles, decisions) as a single export, and updates the empty-governance seed so that every governance repository created from it ships a conforming root container and a `renderedPresentations` declaration naming this view as the default presentation. No new types or schema fields are introduced.

---

## Motivation

### Problem 1 — The governance package has no whole-document export view

The governance package ships three DocumentViews: `articles-and-roles`, `decision-deliberation`, and `decision-log`. Each renders one section of the governance corpus. No view assembles the complete document — articles, roles, and the decision log — into a single export. The Gate C milestone requires a CLI-renderable whole-document export (`srs render document-view … --container <root>`); without a view that covers all governance sections, this gate cannot be satisfied.

### Problem 2 — The root note is Tier 0, so rootTypeRefs cannot select the top-level view

RFC-009 `rootTypeRefs` selects a DocumentView by matching the container root's resolved Type. The root note produced by `repo create` is a Tier 0 note with no Type. `rootTypeRefs` matching therefore cannot select any view for the root container. RFC-013 R7 and RFC-015 Rule [N+31] together specify the conformant path: the top-level presentation must be declared explicitly via `renderedPresentations`, not inferred from the container root's type.

### Problem 3 — The governance seed ships no root container, violating RFC-013 I-79

RFC-013 made `manifest.container` required (I-79). The current empty-governance-document seed's `manifest` section omits `container` entirely. Any governance repository initialised from the existing seed is immediately invalid under RFC-013, and `srs repo validate` will report an error. The seed is the canonical starting point for governance repositories and must be corrected so that newly created governance repositories are conformant out of the box.

---

## Proposed Changes

### Change A — Add `governance-document` DocumentView to the governance package

A new DocumentView file is added at:
```
packages/com.mudemocracy.governance/1.0.0/package/document-views/governance-document-732a982b.json
```

Properties:

| Field | Value |
|---|---|
| `id` | `732a982b-3765-4f22-90e0-e456463bac54` |
| `name` | `governance-document` |
| `namespace` | `governance` |
| `version` | `1` |
| `format` | `markdown` |
| `rootTypeRefs` | absent (binding is explicit via `renderedPresentations`) |

Sections (in order):

| sectionId | title | source type | containerId | ordering |
|---|---|---|---|---|
| `articles` | Articles of Association | `container-subset` | `f7562aa3-98c7-44be-b4c5-5474df6441f2` | by `articlenumber` field asc |
| `roles` | Roles | `container-subset` | `b30db206-e9a7-4588-a9aa-53451aacd243` | default |
| `decisions` | Decision Log | `container-subset` | `138e2fac-6a8a-4a06-9511-5aefd99ceae9` | default |

All sections carry `emptyBehavior: "hide"` so a newly created governance repository (with no records) renders a valid but empty document without errors.

The view is intentionally absent `rootTypeRefs`. Its selection is governed exclusively by `renderedPresentations` (Change B below). The three sub-container IDs (`f7562aa3`, `b30db206`, `138e2fac`) are stable package-defined identifiers that the governance package always creates; they are the same IDs already used by the existing `articles-and-roles` and `decision-deliberation` views.

The `package.json` manifest is updated to list the new file:
```
"document-views/governance-document-732a982b.json"
```

### Change B — Update the empty-governance seed to add `manifest.container` and `renderedPresentations`

The seed file at `packages/com.mudemocracy.governance/1.0.0/seed/empty-governance-document.srsj` is updated. Its `manifest` section gains two new top-level properties:

**`container`** (RFC-013 R1, I-79): a well-formed root container with a stable containerId. For the seed, membership is empty (no records have been created yet); `identityInstanceId` is absent because no identity record exists. A `srs-gov repo-create` invocation MUST populate membership and set `identityInstanceId` after creating the Tier 0 root note.

```json
"container": {
  "containerId": "54432eb2-7961-4538-ac16-9e25dcfa2f42",
  "memberInstanceIds": [],
  "rootInstanceIds": []
}
```

**`renderedPresentations`** (RFC-015 Rule [N+31]): declares the `governance-document` view as the default presentation for the repository.

```json
"renderedPresentations": [
  {
    "viewId": "732a982b-3765-4f22-90e0-e456463bac54",
    "isDefault": true,
    "format": "markdown"
  }
]
```

The seed's `data` section also gains the new DocumentView file so it is bundled into every repository created from it.

---

## Conformance Rules

> **[R1]** Every governance repository initialised from the `com.mudemocracy.governance` empty seed MUST ship a `manifest.container` with `containerId` equal to `54432eb2-7961-4538-ac16-9e25dcfa2f42`. A governance repository lacking `manifest.container` is invalid under RFC-013 I-79.
>
> **[R2]** The `governance-document` DocumentView (id `732a982b-3765-4f22-90e0-e456463bac54`) MUST NOT declare `rootTypeRefs`. Its selection MUST be driven exclusively by a `renderedPresentations` entry in the repository manifest, as specified by RFC-015 Rule [N+31].
>
> **[R3]** A conformant governance repository's manifest MUST include a `renderedPresentations` entry with `viewId` equal to `732a982b-3765-4f22-90e0-e456463bac54` and `isDefault: true`. When multiple entries are present, the `governance-document` entry SHOULD be the first `isDefault: true` entry.
>
> **[R4]** All three sections of the `governance-document` view MUST carry `emptyBehavior: "hide"`. An empty section MUST NOT cause a render failure; it MUST be silently omitted from output.

---

## Schema changes

**None.** `manifest.container` was added by RFC-013; `renderedPresentations` was added by RFC-015. No schema files require modification for this RFC.

---

## Rationale

**Explicit binding over rootTypeRefs.** The root container's root is a Tier 0 note with no Type; `rootTypeRefs` auto-match is therefore structurally inapplicable. Using `renderedPresentations` is the spec-correct mechanism (RFC-013 R7; RFC-015 [N+31]) and avoids creating a special-case "untyped root → fallback view" rule that would constitute a second selection mechanism.

**Single primary-export view for the whole corpus.** The existing views are per-section; a viewer opening a governance repository has no single view it can render to obtain the full document. Adding one unified view satisfies Gate C and gives tooling a stable, declared default.

**Stable container IDs in the view.** The three sub-container IDs (`f7562aa3`, `b30db206`, `138e2fac`) are already used in the existing governance package views. Reusing them in the new view introduces no new package constraints. All three containers are created by the seed and by `srs-gov repo-create`, so they are always present in any governance repository.

**Empty seed membership is intentional.** The seed represents a repository with zero records. The root container's membership is empty by design; `srs-gov repo-create` populates membership after creating the Tier 0 identity note. Asserting a fictional identity instance in the seed would create an invalid reference (I-80: every id in the membership set must resolve to a member of the instance set).

---

## Alternatives Considered

### Alt A — Use `rootTypeRefs` with a new "root" type

Introduce a new `governance-root` Type and use `rootTypeRefs` to auto-select the view. **Rejected:** the issue explicitly prohibits new types, and creating a type whose sole purpose is to enable `rootTypeRefs` matching adds a type to the data model for a pure presentation concern. `renderedPresentations` already solves this problem.

### Alt B — One view per section, declared separately in `renderedPresentations`

List all three existing per-section views in `renderedPresentations` instead of creating a single whole-document view. **Rejected:** Gate C requires a view that renders the whole governance document as a single export from the CLI. Individual per-section views do not satisfy `srs render document-view … --container <root>` as a whole-document operation.

### Alt C — `container-subset` from the root container, populated at render time

Design the view to draw from the root container's members directly, so section membership is derived dynamically rather than hardcoding sub-container IDs. **Rejected:** the `container-subset` source requires a static `containerId`; there is no "use the container provided at render time" variant in the current schema. The three sub-container IDs are stable package identifiers already in use; referencing them is not a new constraint.

---

## Open Questions

None.
