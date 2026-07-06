> **GitHub issue**: [the-greenman/srs#125](https://github.com/the-greenman/srs/issues/125)

# RFC-017: Governance Package — Primary-Export DocumentView and Seed Root Container

**Status**: Accepted (Revision 3)
**Affects**: `packages/com.mudemocracy.governance/1.0.0/` (new `governance-document` DocumentView; seed `manifest.container` + `renderedPresentations`)
**Author**: the-greenman (from epic the-greenman/srs#95, Phase 3 / Gate C, issue #97)
**Date**: 2026-07-06
**Builds on**: RFC-013 (Required Root Container — `manifest.container` required, I-79–I-82), RFC-015 (View-Owned Ordering & Declared Root Presentations — `renderedPresentations`, Rule [N+31]; **merged** as PR #115 on 2026-07-03 — RFC-015's own header still reads "In Progress" as a known status lag; the schema changes are live in `docs/schema/2.0/manifest.json`)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-06 | Initial draft |
| 2 | 2026-07-06 | Address Stage 3 review findings. Blocking: add `$schema`, `description`, `createdAt` to DocumentView properties table; add `order` integers and `titleFieldId` UUID to sections table; specify `articlenumber` fieldId UUID in ordering; add `title` to seed container JSON; add Rationale entry for stable root containerId. Should-fix: add seed `data` key name; add Migration section; reframe R1 with provenance anchor; promote R3 SHOULD→MUST for isDefault ordering; add R3 enforcement surface; add Rationale entry for decisions lifecycle decision. Nits: "absent" ordering terminology; acknowledge `identityInstanceId` omission; name `documentViews` array; trim R4. Declined: RFC-015 dependency flag (RFC-015 merged as PR #115 on 2026-07-03). |
| 3 | 2026-07-06 | Address Stage 3 Round 2 findings. Blocking: specify that seed's embedded `data["package/package.json"]["documentViews"]` must also be updated to include the new view path. Should-fix: scope R1's `containerId` requirement prospectively (applies to repos newly created from the updated seed); update Migration step 1 to distinguish RFC-017 full conformance (use `54432eb2-...`) from RFC-013-only conformance (any valid UUID). |

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

**Properties:**

| Field | Value |
|---|---|
| `$schema` | `"https://srs.semanticops.com/schema/2.0/document-view.json"` |
| `id` | `"732a982b-3765-4f22-90e0-e456463bac54"` |
| `namespace` | `"governance"` |
| `name` | `"governance-document"` |
| `version` | `1` |
| `description` | `"Renders the complete governance corpus — articles of association, roles, and decision log — as a single whole-document export."` |
| `format` | `"markdown"` |
| `createdAt` | `"2026-07-06T00:00:00Z"` |
| `rootTypeRefs` | absent — binding is explicit via `renderedPresentations` (see Change B) |

**Sections** (all carry `emptyBehavior: "hide"`):

| `order` | `sectionId` | `title` | source type | `containerId` | `titleFieldId` | `ordering` |
|---|---|---|---|---|---|---|
| 0 | `articles` | `"Articles of Association"` | `container-subset` | `f7562aa3-98c7-44be-b4c5-5474df6441f2` | `d7e82557-9045-5e92-a494-d99112bbec4a` | `fieldId: "60be1468-01bc-5d12-9eea-628f02801893"`, `direction: "asc"` |
| 1 | `roles` | `"Roles"` | `container-subset` | `b30db206-e9a7-4588-a9aa-53451aacd243` | `d7e82557-9045-5e92-a494-d99112bbec4a` | absent ([N+12] `precedes`-topological order) |
| 2 | `decisions` | `"Decision Log"` | `container-subset` | `138e2fac-6a8a-4a06-9511-5aefd99ceae9` | `d7e82557-9045-5e92-a494-d99112bbec4a` | absent ([N+12] `precedes`-topological order) |

- `titleFieldId` `d7e82557-...` is the `title` field UUID, consistent with all existing governance DocumentViews.
- `fieldId` `60be1468-...` for the `articles` section is the `articlenumber` field UUID (from `fields/articlenumber-60be1468.json`), consistent with the `articles-and-roles` view.
- The three `containerId` values (`f7562aa3`, `b30db206`, `138e2fac`) are stable package-defined identifiers already used by the existing governance views; see Rationale.

The `documentViews` array in `package.json` is updated to include the new path:
```
"document-views/governance-document-732a982b.json"
```

### Change B — Update the empty-governance seed to add `manifest.container` and `renderedPresentations`

The seed file at `packages/com.mudemocracy.governance/1.0.0/seed/empty-governance-document.srsj` is updated. Its `manifest` section gains two new top-level properties:

**`container`** (RFC-013 R1, I-79): a well-formed root container with a stable, package-defined `containerId`. For the seed, membership is empty because no records have been created yet. The `title` value is a placeholder; `srs-gov repo-create` SHOULD overwrite it with the repository's actual title. The `identityInstanceId` pointer is intentionally absent: no identity record exists at seed time; `srs-gov repo-create` MUST set `identityInstanceId` to the `instanceId` of the Tier 0 root note it creates before handing the repository to the user.

```json
"container": {
  "containerId": "54432eb2-7961-4538-ac16-9e25dcfa2f42",
  "title": "Governance Repository",
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

The seed's `data` section also gains the new DocumentView file, keyed at:
```
"package/document-views/governance-document-732a982b.json"
```
The value is the DocumentView JSON object (identical to the standalone file specified in Change A).

The embedded `data["package/package.json"]` entry MUST also have its `documentViews` array updated to include `"document-views/governance-document-732a982b.json"`, matching the Change A update to the standalone `package.json`. Without this update, a `renderedPresentations` entry referencing `viewId: "732a982b-..."` cannot be resolved: implementations look up the view via the `documentViews` manifest, and a missing entry causes [N+31] resolution to skip the entry with a diagnostic.

---

## Conformance Rules

> **[R1]** The `com.mudemocracy.governance` package seed MUST ship `manifest.container.containerId` equal to `54432eb2-7961-4538-ac16-9e25dcfa2f42`. Tools creating governance repositories from this seed MUST preserve that `containerId` in the initialised repository. A governance repository newly initialised from the seed at or after RFC-017 that does not carry this `containerId` is non-conformant under this RFC. Repositories that predate RFC-017 are subject to the Migration procedure (see below) — they achieve full RFC-017 conformance by adopting `containerId: "54432eb2-7961-4538-ac16-9e25dcfa2f42"`, but remain RFC-013-conformant with any valid `containerId`. (Note: RFC-013 I-79 makes `manifest.container` itself required for all SRS repositories, independent of this RFC.)
>
> **[R2]** The `governance-document` DocumentView (id `732a982b-3765-4f22-90e0-e456463bac54`) MUST NOT declare `rootTypeRefs`. Its selection MUST be driven exclusively by a `renderedPresentations` entry in the repository manifest, as specified by RFC-015 Rule [N+31].
>
> **[R3]** A conformant governance repository's manifest MUST include a `renderedPresentations` entry with `viewId` equal to `732a982b-3765-4f22-90e0-e456463bac54` and `isDefault: true`. When multiple entries carry `isDefault: true`, the `governance-document` entry MUST appear before any other `isDefault: true` entry (so that RFC-015 [N+31]'s "first `isDefault: true` wins" rule selects it as the default). This is a governance-package constraint enforced by `srs-gov` tooling (not by `srs repo validate`); a governance repository missing or mis-ordering this entry MUST be reported as an error by `srs-gov repo validate`.
>
> **[R4]** All three sections of the `governance-document` view MUST carry `emptyBehavior: "hide"`.

---

## Schema changes

**None.** `manifest.container` was added by RFC-013; `renderedPresentations` was added by RFC-015 (merged PR #115). No schema files require modification for this RFC.

---

## Migration

### Existing governance repositories (pre-RFC-017)

Governance repositories created from the seed before RFC-017 is applied are already non-conformant under RFC-013 I-79 (missing `manifest.container`). R1's `containerId` requirement is **prospective** — it applies to repositories newly created from the updated seed, not to repositories that predate this RFC.

For pre-existing governance repositories:
1. **Add `manifest.container`**: Follow RFC-013's generic migration procedure — assign `containerId: "54432eb2-7961-4538-ac16-9e25dcfa2f42"` for full RFC-017 conformance, or any valid UUID for RFC-013 conformance only; populate `memberInstanceIds` from existing containers; set `identityInstanceId` to the `instanceId` of the Tier 0 root note.
2. **Add `renderedPresentations`**: Add an entry for `viewId: "732a982b-3765-4f22-90e0-e456463bac54"` with `isDefault: true`. This is a manifest-only edit; no records, relations, or instance data change.
3. Run `srs repo validate` after both edits; 0 errors is the acceptance criterion.

---

## Rationale

**Explicit binding over rootTypeRefs.** The root container's root is a Tier 0 note with no Type; `rootTypeRefs` auto-match is therefore structurally inapplicable. Using `renderedPresentations` is the spec-correct mechanism (RFC-013 R7; RFC-015 [N+31]) and avoids creating a special-case "untyped root → fallback view" rule that would constitute a second selection mechanism.

**Single primary-export view for the whole corpus.** The existing views are per-section; a viewer opening a governance repository has no single view it can render to obtain the full document. Adding one unified view satisfies Gate C and gives tooling a stable, declared default.

**Stable root container `containerId` follows the package's own convention.** The governance package already ships stable, package-defined UUIDs for its sub-containers (`f7562aa3` for articles, `b30db206` for roles, `138e2fac` for decisions). These are identical across every governance repository. The root container follows the same pattern. Per RFC-013 invariant 20, `containerId` is explicitly not an instance ID and MUST NOT appear as a source or target of any Relation — it is a structural identifier, not a unique repository identity. The `repositoryId` in the manifest is what uniquely identifies a repository instance; the `containerId` identifies the container shape, comparable to how a TypeId identifies a type shape. Sharing a root `containerId` across governance repositories is therefore consistent with the spec's identity model.

**Empty seed membership is intentional.** The seed represents a repository with zero records. Asserting a fictional identity instance would create an invalid reference (RFC-013 I-80: every id in the membership set must resolve to a member of the authoritative instance set).

**Decisions section uses `container-subset` (all lifecycle states) by design.** The existing `decision-log` view uses `type-query` with `excludeLifecycleStates: ["superseded", "closed"]` to render only active decisions — appropriate for a live governance dashboard. The `governance-document` view is a **complete corpus export** intended for archival and whole-document rendering; it includes decisions at all lifecycle states so the full record of a group's governance history is present. Implementations that need a filtered whole-document export can add a `renderedPresentations` entry pointing to a custom view without altering this RFC's primary export.

---

## Alternatives Considered

### Alt A — Use `rootTypeRefs` with a new "root" type

Introduce a `governance-root` Type and use `rootTypeRefs` to auto-select the view. **Rejected:** the issue explicitly prohibits new types, and `renderedPresentations` already solves this problem without polluting the type namespace.

### Alt B — One view per section, declared separately in `renderedPresentations`

List all three existing per-section views in `renderedPresentations`. **Rejected:** Gate C requires a single whole-document export; individual per-section views do not satisfy `srs render document-view … --container <root>` as a unified operation.

### Alt C — `container-subset` from the root container, populated at render time

Design the view to draw from the root container's members dynamically. **Rejected:** `container-subset` requires a static `containerId`; no "use the container provided at render time" variant exists in the current schema. The three sub-container IDs are stable package identifiers already in use.

### Alt D — `type-query` with lifecycle filtering for the decisions section

Use `type-query` with `excludeLifecycleStates: ["superseded", "closed"]` for the decisions section, matching the existing `decision-log` view. **Rejected:** the whole-document view is an archival export; lifecycle filtering belongs in presentation views, not corpus exports. Consumers wanting a filtered view can declare a custom `renderedPresentations` entry.

---

## Open Questions

None.
