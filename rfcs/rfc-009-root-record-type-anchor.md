> **GitHub issue**: [the-greenman/srs#39](https://github.com/the-greenman/srs/issues/39)

# RFC-009: Root-record Type as the typing anchor for Containers, Document Views, and distributable units

**Status**: In Progress (Revision 3)
**Affects**: `ext:views-l2` (`DocumentView`), `Container` (core), `document-view.json` schema, `container.json` schema, `manifest.json` schema
**Author**: Peter Brownell
**Date**: 2026-06-09
**Builds on**: RFC-006 (Vocabulary Substrate — Terms, Vocabularies, Lifecycles), RFC-008 (Heterogeneous ContainerSubset Sections — `typeDispatch`)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-09 | Initial draft |
| 2 | 2026-06-09 | Address review findings: add exact TypeRef JSON Schema shape to Schema changes table; tighten I-64 definition of "consistent" (bare `name`, not `namespace/name`); fix I-65 to cite Vocabulary (RFC-006) not ext:lifecycle; clarify rootInstanceIds-absent semantics; move containers_for_instance to core; strengthen DV-Rx2; move Change E to Rationale; reword DV-Rx1; fix Open Questions phrasing |
| 3 | 2026-06-09 | Address Rev 2 review findings: rename document-view-scoped type `TypeRef` → `ExactTypeRef` to avoid name collision with existing spec-level `TypeRef` (Protocol/Blueprint, `typeVersion?: optional`); add RFC-008 to Builds on; clarify I-64 validity semantics (hint mismatch is diagnostic-only, Container stays valid); add migration note for I-64; split I-65 vocabulary rule from existing fieldValues prohibition (cross-reference only); reword DV-Rx2 "disqualify" → explicit non-match semantics; drop "primary" qualifier from Change B MUST NOT; add manifest.json to schema sync list; join note for ExactTypeRef schema fragments; rename section "Resolved Questions"; improve DV-Rx1 "fallback" wording |

---

## Abstract

The blueprint → view → container linkage is currently load-bearing on free-form strings: a Blueprint declares `name` ("guide"), a `DocumentView` declares `containerType: "guide"`, and a `Container` stores `containerType: "guide"`. Nothing validates these strings, nothing enforces referential integrity, a rename breaks the join silently, and namespace collisions are possible. This RFC adds `rootTypeRefs?: ExactTypeRef[]` to `DocumentView` as a validated, UUID-based typed anchor that replaces the string join. `containerType` is soft-deprecated to a validated hint; tools that predate this RFC may continue to use `containerType` string matching. This RFC also blesses the `containers_for_instance` reverse lookup as a normative operation, and reconciles the Container metadata drift in the Rust implementation (`description` and `tags` are already present in the deployed struct but absent from the spec Container definition).

---

## Motivation

### Problem 1 — `containerType` string join is fragile

`DocumentView.containerType` and `Container.containerType` are both free-form strings used as a join key: "show this DocumentView for containers of type X." The same free-form string appears as a Blueprint's `name`. No mechanism validates these strings, resolves them against any definition, or enforces uniqueness. Consequences:

- A rename of a container-type key silently breaks all DocumentViews and Containers that reference the old key.
- Namespace collisions between different packages are undetectable.
- Tools cannot reliably discover which DocumentViews apply to a given Container.
- The join is inconsistent with the rest of the SRS data model, where UUIDs are the stable primary identity for all entities.

Meanwhile, a far stronger typed identity already exists: the **root Record's Type** (`typeId` + `typeVersion`). A "guide" container is really *"a Container whose root Record is of Type `com.mudemocracy/guide@1`"*. The `containerType` string is a weak, denormalised restatement of what the type system already knows precisely.

### Problem 2 — Container metadata drift

The Rust `Container` struct has grown `description` and `tags` fields that the spec Container does not formally specify. The deployed implementation is richer than the spec, creating a gap where:

- The spec says nothing normative about `description` — its semantics are implementation-defined.
- The `tags` field in the schema carries the description "Free-form topic labels," but RFC-006 established a vocabulary substrate (`Vocabulary`, `Term`) that makes tags vocabulary-backed and resolvable. The spec Container's `tags` have not been aligned with this substrate.

### Problem 3 — No normative `containers_for_instance` operation

The reverse lookup "given an instance, which Containers include it?" is already implemented in srs-rust (`containers_for_instance`) and exposed via CLI (`srs container list --member <id>`) and WASM. Tools depend on this operation for discovery. However, the spec does not define its semantics, leaving the operation as an implementation detail rather than a guaranteed behaviour.

---

## Proposed Changes

### Change A — Add `rootTypeRefs` to `DocumentView`

Add an optional `rootTypeRefs` property to `DocumentView`:

```typescript
rootTypeRefs?: ExactTypeRef[]
// When set, this DocumentView applies to Containers whose root Record's resolved
// Type (typeId + typeVersion) is included in this list.
//
// An ExactTypeRef is: { typeId: UUID, typeVersion: integer (≥ 1) }
//
// This replaces containerType as the load-bearing join key for DocumentView↔Container
// matching. containerType is retained as an optional back-compat hint (see Change B).
//
// Resolves against Package.types[] at package-validation time (per I-63).
// When absent, the DocumentView applies to all Containers (no root-type restriction).
```

**`ExactTypeRef` definition:**

```typescript
ExactTypeRef {
  typeId:      UUID       // stable identity — the Type's id field
  typeVersion: integer    // min: 1 — the specific version this reference targets (required)
}
```

`ExactTypeRef` is named to distinguish it from the existing spec-level `TypeRef` (used in Protocol and Blueprint, where `typeVersion` is optional). The distinguishing constraint: `ExactTypeRef.typeVersion` is **required** — it is a version-exact anchor validated against the Package. The existing `TypeRef` in Protocol/Blueprint contexts allows `typeVersion` to be omitted when a "any version" reference is sufficient. Future RFCs may unify these into a single shared type if the semantics converge (see Resolved Questions).

**Multi-value semantics:** when `rootTypeRefs` contains multiple entries, a Container matches if its root Record's type matches **any** entry (OR semantics). This allows a DocumentView to apply to multiple related root types (e.g. a view suitable for both `guide@1` and `guide@2`).

**Resolution semantics:** a DocumentView with `rootTypeRefs` present applies to a Container when the Container's `rootInstanceIds` is non-empty and the root Record (first entry of `rootInstanceIds`) has a `typeId`/`typeVersion` that matches one of the listed `ExactTypeRef` entries. When `rootInstanceIds` is **absent or empty**, no root-type restriction applies — the DocumentView applies to all Containers, the same as when `rootTypeRefs` is absent. Implementations SHOULD emit an informational diagnostic when `rootTypeRefs` is present but no root instance exists to validate against.

**Relationship to RFC-008 `typeDispatch`:** RFC-008 keys dispatch maps on `namespace/name` strings (version-independent) for render dispatch within a single section. `rootTypeRefs` keys on `typeId`+`typeVersion` (UUID-based, version-specific) for the DocumentView↔Container typed anchor. These are different concerns with different precision requirements: dispatch should survive type version bumps; the typed anchor is a validation claim resolved against a specific package version.

### Change B — Demote `containerType` to a derived/validated hint

On both `DocumentView` and `Container`, `containerType` is demoted from a load-bearing join key to an optional, validated hint.

**On `Container`:** When a Container has one or more `rootInstanceIds` and also carries `containerType`, the `containerType` value SHOULD equal the resolved Type's `name` field (the local name within its namespace — not `namespace/name`). For example, a Container rooted in a Record of Type `com.mudemocracy/guide@1` SHOULD have `containerType: "guide"` (not `"com.mudemocracy/guide"`) if it carries `containerType` at all.

The root Record's resolved Type is authoritative; `containerType` is the hint. A mismatch means the hint is stale — the Container itself remains valid. Implementations SHOULD emit a diagnostic when `containerType` does not equal the resolved root Type's `name` (invariant I-64). Implementations MAY derive `containerType` from the root Record's Type `name` and MAY populate or normalise it on write.

Containers that carry `containerType` but have **no `rootInstanceIds`** are unchecked — I-64 does not apply. The string is freely permitted as a label when no root instance exists to validate against.

**Migration note:** existing repositories that carry fully-qualified `containerType` values (e.g. `"com.example/guide"` instead of `"guide"`) are valid under this RFC. The mismatch against the resolved Type's bare `name` will produce a SHOULD diagnostic, not an error. Authors SHOULD update such values to the bare `name` form to eliminate the diagnostic; no records or relations need to change.

**On `DocumentView`:** `containerType` is retained as a soft-deprecated back-compat hint. It MUST NOT be used for Container matching when `rootTypeRefs` is present. It remains useful as a human-readable label and as a fallback for tools that predate RFC-009.

### Change C — Add `description` and specify vocabulary-backed `tags` on Container

**`description`:** The spec Container gains an explicit `description?: string` field — a boundary label describing the Container's purpose. This is already present in the Rust implementation; this change makes it normative.

**`tags`:** The Container's `tags` field already appears in the spec schema as `string[]`. This RFC aligns it with the RFC-006 vocabulary substrate: when a `Vocabulary` (open or closed) in the package declares `Term` entries for the relevant tag keys, Container tags MUST resolve against those Terms. Free-string tags remain valid when no Vocabulary is installed; the vocabulary is the curation overlay, not a hard requirement. This follows the RFC-006 "emergent vocabulary" pattern exactly: free strings are valid; a Vocabulary overlays curation.

Containers continue to carry **no typed `fieldValues`** (existing invariant, preserved without change), **no Relation participation** (Invariant 20 is unchanged), and **no semantic state** beyond the typed root Record pattern.

### Change D — Define `containers_for_instance` as a normative core operation

Add the following normative operation to the **core Container specification** (not an extension):

> **`containers_for_instance(instanceId: UUID) → Container[]`**: Given an instance ID, returns the set of Containers that include that instance. An instance is included in a Container if:
> 1. Its `instanceId` appears in `Container.rootInstanceIds[]`, OR
> 2. Its `instanceId` appears in `Container.memberInstanceIds[]`, OR
> 3. It is reachable via transitive `contains` Relation traversal from any instance in `Container.rootInstanceIds[]`.
>
> All conforming SRS implementations that support Containers MUST provide this operation or an equivalent query. The three conditions are evaluated as a union (OR); any one condition is sufficient for inclusion. A Container with no `rootInstanceIds` but with `memberInstanceIds` is still included if condition 2 is satisfied.

This is a core operation, not an extension-gated one, because Containers are core entities and tools need reliable root-record→container discovery regardless of which optional extensions are declared.

---

## Conformance Rules

> **[I-63]** When `DocumentView.rootTypeRefs` is present and non-empty, each `ExactTypeRef` entry MUST resolve to a Type that exists in the Package (matched by both `typeId` and `typeVersion`). An `ExactTypeRef` entry that does not resolve MUST produce a diagnostic and MUST NOT be used for Container matching.

> **[I-64]** When a Container has one or more `rootInstanceIds` and also carries `containerType`, implementations SHOULD emit a diagnostic if `containerType` does not equal the resolved root Type's `name` field (the local name within its namespace, not `namespace/name`). The root Record's Type is authoritative; a `containerType` mismatch does NOT make the Container invalid — it means the hint is stale. Containers with no `rootInstanceIds` may carry any `containerType` value without triggering this rule.

> **[I-65]** When a `Vocabulary` in the repository package declares `Term` entries for a given tag key, Container `tags` bearing that key MUST resolve against those Terms per RFC-006 vocabulary resolution rules. Free-string tags are valid when no Vocabulary entry governs the key.

> **[I-66]** All conforming SRS implementations that support Containers MUST implement the `containers_for_instance` operation as defined in Change D. The operation MUST return every Container satisfying at least one of the three inclusion conditions. The result set MUST be consistent with the repository's current state of `rootInstanceIds`, `memberInstanceIds`, and `contains` Relations.

> **[DV-Rx1]** When a DocumentView declares `rootTypeRefs`, Container matching MUST use UUID-based `rootTypeRefs` validation. When `rootTypeRefs` is absent on a DocumentView, implementations MAY use `containerType` string matching for Container selection (pre-RFC-009 behavior).

> **[DV-Rx2]** `DocumentView.rootTypeRefs` matching is NOT affected by the resolution order defined in RFC-008 [DV-Dx2]. RFC-009 `rootTypeRefs` governs which DocumentViews apply to a given Container (view selection); RFC-008 `typeDispatch` governs which L1 View renders a record within a section (render dispatch). These operate at different levels and do not interact. A type version change does **not** automatically invalidate a DocumentView. `rootTypeRefs` matching is version-exact: a DocumentView whose `rootTypeRefs` lists `guide@1` will not match Containers rooted in `guide@2` — it simply does not apply to them (it is not broken or invalid). To extend coverage to a new type version, the DocumentView author must explicitly add the new `ExactTypeRef` entry.

---

## Schema changes

The two fragments in the `document-view.json` row together form a single coherent edit: the `rootTypeRefs` array property references `ExactTypeRef` by `$ref`, and `ExactTypeRef` is defined in `$defs`. An implementer applies both in the same pass.

| Schema file | Change |
|---|---|
| `document-view.json` | **(1)** Add `rootTypeRefs` optional property to the DocumentView object: `{ "type": "array", "items": { "$ref": "#/$defs/ExactTypeRef" }, "description": "When set, this DocumentView applies to Containers whose root Record's resolved Type (typeId + typeVersion) matches one of these refs (version-exact). When absent, no root-type restriction applies." }` **(2)** Add `ExactTypeRef` to `$defs` (note: distinct from the existing spec-level `TypeRef` in Protocol/Blueprint where typeVersion is optional): `{ "type": "object", "required": ["typeId", "typeVersion"], "additionalProperties": false, "properties": { "typeId": { "type": "string", "format": "uuid", "description": "Stable UUID of the Type." }, "typeVersion": { "type": "integer", "minimum": 1, "description": "Version of the Type this ref targets (required — version-exact anchor)." } } }` **(3)** Update `containerType` description to: "Soft-deprecated back-compat hint. When rootTypeRefs is present, MUST NOT be used for Container matching. Retained for pre-RFC-009 tools." |
| `container.json` | **(1)** Update `tags` description to: "Vocabulary-backed topic labels. When a Vocabulary in the package declares Terms for a tag key, tags MUST resolve per RFC-006. Free-string tags are valid when no Vocabulary governs the key." **(2)** Update `containerType` description to: "Soft-deprecated hint. When rootInstanceIds is present, SHOULD equal the resolved root Type's name field (bare name, not namespace/name). A mismatch is diagnostic-only; the Container remains valid. See I-64." The `description` field is already present in the schema and requires no structural change. |
| `manifest.json` | Update `containerType` description in both the embedded Container object and `ContainerIndexEntry` to match the updated `container.json` description: "Soft-deprecated hint. When rootInstanceIds is present, SHOULD equal the resolved root Type's name field (bare name, not namespace/name). See I-64." |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (`document-view.json` update; `container.json` and `manifest.json` if present)

**Note on spec records:** in addition to the JSON Schema files, the spec records in `srs/srs/records/` that describe the Container entity, the `ext:views-l2` extension, and the new invariants I-63 through I-66 must be created or updated when Stage 6 (authoring spec records) runs.

---

## Rationale

### Why UUID+version rather than `namespace/name` for `rootTypeRefs`

RFC-008's `typeDispatch` intentionally uses `namespace/name` string keys (version-independent) for render dispatch, so that dispatch does not break when a Record's type increments from version 1 to version 2. The rationale is explicit in RFC-008: "dispatch selection MUST NOT change when a record binds to a newer version of the same `namespace/name` type lineage."

`rootTypeRefs` is a fundamentally different concept: a typed anchor that asserts "this DocumentView is valid for Containers rooted in this specific Type at this specific version." It is a **structural claim** validated against the Package at package-validation time (I-63). When a Type is versioned, the DocumentView author must explicitly decide whether the new version is compatible and update `rootTypeRefs` accordingly — exactly as Records bind to specific Type versions. Using `namespace/name` would lose the version constraint and allow a DocumentView intended for `guide@1` to silently match containers rooted in an incompatible `guide@2`.

The two mechanisms are complementary: `rootTypeRefs` selects which DocumentView to use for a Container; `typeDispatch` selects which L1 View renders each Record within the Document.

### Why `ExactTypeRef` is distinct from the existing spec `TypeRef`

The existing spec defines `TypeRef` (used in Protocol and Blueprint) with `typeVersion` as optional — a loose reference sufficient when "any version of this Type" is the intent. `ExactTypeRef` requires `typeVersion` because it is a package-validation-time claim: I-63 mandates that each entry resolves to a specific Type version in the Package. Sharing the name `TypeRef` with an incompatible shape would create a path-dependency problem: a future RFC attempting to promote `ExactTypeRef` to a shared canonical type would need to break the existing optional-typeVersion contracts in Protocol/Blueprint. The distinct name defers that unification decision to a future RFC with full visibility of both usage contexts.

### Why `containerType` matches bare `name` not `namespace/name`

`containerType` predates RFC-009 and is used as a short, human-readable label ("guide", "decision", "report") without namespace qualification. Requiring `namespace/name` for I-64 conformance would make the diagnostic fire for all existing repositories that carry short-form `containerType` values. The bare-`name` match is backward-compatible while providing a useful consistency check. If namespace qualification is needed in future, a vocabulary Term key (per RFC-006) provides the mechanism without changing the existing `containerType` string format.

### Why `containerType` mismatch is diagnostic-only (not a validity error)

`containerType` is an **optional hint**. The existing Invariant 28 (which makes Records invalid on typeId/typeName conflict) applies to required denormalised fields that must be consistent. `containerType` is not required; its absence is valid. When it is present but stale, the Container's identity and meaning are still fully determined by the root Record's Type — the hint is just wrong. Making the Container invalid would penalise authors who wrote `containerType` values before RFC-009 and haven't yet updated them. A SHOULD diagnostic flags the stale hint without breaking existing data.

### Why `description` and `tags` on Container do not make it semantic

RFC-006 established the vocabulary substrate. Container `tags` backed by `Vocabulary` Terms are discovery metadata — they answer "find all containers tagged with governance/active" — not semantic assertions about the Container's Records. `description` is a boundary label for human orientation, not a field value.

The fundamental prohibition stands: Containers carry no typed `fieldValues`, do not participate in the Relation graph (Invariant 20), and own no semantic state. Their identity derives from the root Record's Type (via `rootInstanceIds`), not from any Container-level schema. This RFC makes that typing relationship explicit and normative, without adding semantic weight to the Container itself.

### Why `containers_for_instance` is a core operation, not an extension

The three conditions for container inclusion (rootInstanceIds, memberInstanceIds, contains traversal) are all core Container and Relation concepts. Gating this operation behind `ext:repository` would mean that a system supporting Containers but not the repository layout extension could not reliably answer "which containers hold this instance?" — a fundamental navigation need. Core operations on core entities belong in the core spec.

### Why the typed "head" Record pattern matters (informative)

A distributable unit (guide, report, governance document) is a Container whose **root Record is a typed head Record** carrying distribution fields (title, version, author, theme reference, intended views). This pattern:

- Is consistent with "semantic state lives in Records" (the core spec constraint on Containers).
- Makes the unit's identity and metadata discoverable via the root Record's Type.
- Applies per-container independently, so a future container-nesting RFC (srs#40) can layer on top without requiring changes to this RFC.

This is an emerging pattern that this RFC endorses informatively. Authors implementing distributable units SHOULD follow it, but it is not a new normative constraint.

---

## Alternatives Considered

### Alt A — Use `namespace/name` string keys for `rootTypeRefs`

Version-independent string keys would align with RFC-008's `typeDispatch` pattern and be more tolerant of type version changes. **Rejected.** The DocumentView-to-Container match is a structural, package-validation-time claim (per I-63). A version-independent key cannot be resolved against the Package — you cannot confirm that `com.example/guide` exists without knowing the version. UUID+version preserves the full resolution chain.

### Alt B — Introduce a first-class `ContainerType` definition entity

Define a new `ContainerType` entity analogous to `RelationTypeDefinition`, with its own UUID and vocabulary entry, replacing the `containerType` free string entirely. **Rejected.** The root Record's Type already serves as the identity anchor — a parallel `ContainerType` entity would be a redundant vocabulary alongside the existing Type system. The "type" of a container is its root Record's type; there is no value in a second namespace of type-definitions.

### Alt C — Derive `containerType` automatically, remove it entirely

Remove `containerType` from both `Container` and `DocumentView` and require all tooling to use `rootTypeRefs` / root-record type resolution. **Rejected.** This is a breaking change for existing repositories and tooling. The soft-deprecation path (retain `containerType` as a validated hint) preserves back-compat while directing new authoring toward `rootTypeRefs`.

### Alt D — Add `rootTypeRefs` to Blueprint (not DocumentView)

Target the Blueprint struct directly, since the Blueprint defines the authoring side of the container→view join. **Rejected for this RFC.** The Blueprint↔Container typed association is a separate concern tracked in srs#42 (RFC-P). This RFC focuses on the DocumentView↔Container typed anchor.

### Alt E — Make I-64 a hard validity error (matching Invariant 28)

Invariant 28 makes Records invalid when `typeId`/`typeVersion` conflict with `typeNamespace`/`typeName`. Applying the same treatment to `containerType` would make Containers with stale hints invalid. **Rejected.** `typeNamespace`/`typeName` are mandatory denormalised fields that must be consistent; `containerType` is an optional hint. A stricter validity rule would penalise authors of existing repositories without meaningful benefit: the root Record's Type is already the authoritative anchor regardless of whether `containerType` is present, absent, or stale.

---

## Resolved Questions

| # | Question | Resolution |
|---|---|---|
| 1 | Should the RFC introduce a new named type or reuse the existing `TypeRef`? | New named `ExactTypeRef` in `document-view.json` `$defs`, distinct from the existing spec-level `TypeRef` (Protocol/Blueprint) where `typeVersion` is optional. `ExactTypeRef` requires `typeVersion` as a version-exact anchor. Future RFC may unify them if semantics converge. |
| 2 | Should `rootTypeRefs` matching be version-exact or version-range? | Version-exact (matching both `typeId` and `typeVersion`). Version ranges add implementation complexity; multi-entry OR semantics handle the common "document view works for both v1 and v2" case. |
| 3 | What happens when `rootInstanceIds` is absent? | No root-type restriction applies — same as when `rootTypeRefs` is absent. Implementations SHOULD warn when `rootTypeRefs` is present but unvalidatable. |
