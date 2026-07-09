> **GitHub issue**: [the-greenman/srs#134](https://github.com/the-greenman/srs/issues/134)

# RFC-018: Core Base Package and Required `com.semanticops.core/purpose` Identity Type

**Status**: Accepted (Revision 4)
**Affects**: `com.semanticops.core` namespace (new); `purpose` Type (new Tier-2 type); `manifest.json` Container `identityInstanceId` description; `container.json` `identityInstanceId` description; `ext:repository` (`repo create` behaviour); invariants I-85 (`9d686444`), I-86 (`890d7d54`), I-87 (`818d636c`); RFC-013 I-81 (retained, I-87 layers on top)
**Author**: the-greenman (from issue the-greenman/srs#134)
**Date**: 2026-07-08
**Builds on**: RFC-013 (Required Root Container & Structural Navigation — `identityInstanceId` pointer, I-79–I-82); RFC-014 (Import Tracking & Package Binding — `packageRefs` resolution, RFC-014 R6)
**Supersedes**: RFC-013 Change B default ("the existing root note is the default identity record"), RFC-013 Alt C (previously rejected "new universal repository identity Type and base package"), RFC-013 Non-Goal ("No new identity Type and no base package")

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-08 | Initial draft |
| 2 | 2026-07-08 | Address review findings. **Blocking:** (a) Resolve R5/R7 contradiction — R7 now explicitly overrides R5 during migration grace period; (b) add RFC-014 R6 integration clause to Change A and R1; (c) replace pre-assigned invariant numbers I-85–I-87 with provisional labels I-CORE-A/B/C; (d) add missing rationale and Alt E for `com.semanticops.core` vs `com.semanticops.srs` namespace choice. **Should-fix:** extend R7 grace to all non-purpose identities (not just Tier-0 notes); qualify `container.json` description update to root container only; remove untestable truncation from R8; add R6 no-intent-text behaviour; fix Change C bullet conflict with Change D; add `--intent` citation for R6; add migration command signature; scope R2 namespace reservation; clarify I-81 vs I-CORE-C layering; close identityInstanceId optional-but-required gap; replace "Stage 6" references with concrete deliverable text. **Nits:** affirm core bundle conforms to `package-bundle.json`; improve R8 behavioural description; standardize Force column; open OQ-1 for packageId; add Non-Goals section; add `title` usage guidance; clarify R4 whitespace rule; add Tier-2 justification. |
| 3 | 2026-07-08 | Implementation started; RFC file committed to branch `rfc/018-core-base-package-identity-type`; schema descriptions updated in `docs/schema/2.0/manifest.json` and `docs/schema/2.0/container.json` to reference RFC-018 and qualify the type constraint to the root container only. |
| 4 | 2026-07-08 | Accepted; spec records authored in `srs/srs/` — invariants I-85 (`9d686444`), I-86 (`890d7d54`), I-87 (`818d636c`) as `com.semanticops.spec/invariant` records under `records/invariants/`; `srs repo validate` clean (0 errors, 5 pre-existing warnings). Provisional labels I-CORE-A/B/C → permanent I-85, I-86, I-87. |

---

## Abstract

RFC-013 introduced `identityInstanceId` as a pointer from the root container to the repository's identity record, with the existing Tier-0 root note as the default target. That default is un-navigable in the reference implementation and non-semantic: a Tier-0 note has no type, making discovery by type impossible, and its body shape is not a reliable contract. This RFC introduces a minimal `com.semanticops.core/purpose` Tier-2 type — carrying only a `statement` field (required) and a `title` field (optional) — defined in an **always-available core base package** that every conforming SRS implementation implicitly merges into every repository's resolved package (RFC-014 R6 union), without requiring any `packageRef` declaration. `identityInstanceId` on the root container is tightened to MUST reference a Tier-2 `purpose` Record, superseding RFC-013's Tier-0-note default.

---

## Motivation

### Problem 1 — The Tier-0 root note is non-semantic as an identity record

RFC-013 I-81 requires `identityInstanceId` to point at a member of the root container but places no constraint on what that record *is*. The RFC-013 default — a Tier-0 root note created by `repo create` — has no type, no stable contract, and no resolvable `typeId`. A client asking "what type is this repository's identity?" cannot answer using SRS's own type machinery. A type-driven discovery layer (`resolve_type_by_name`, `repository_navigation`) must special-case the absent type, which contradicts the purpose of having a typed record system.

### Problem 2 — There is no universally available type for a repository's purpose statement

A repository that wants to upgrade its identity from a Tier-0 note to a typed record must first choose or install a package that defines a suitable type. But the right place for a universal "this repository exists and has this purpose" declaration is not a domain-specific package — it is a foundational type available in every repository without configuration. Without such a type, every ecosystem package must either invent its own identity type or import a shared one through an agreed package distribution channel, both of which create unnecessary coupling.

### Problem 3 — Type resolution fails for `identityInstanceId` in the reference implementation

`repository_navigation` (srs-rust) and the WASM bindings cannot return a typed identity record when `identityInstanceId` points at a Tier-0 note, because the note has no type and none can be inferred. This makes identity resolution a special code path rather than an ordinary `resolve_type`/`record_get` call. RFC-018 removes the special path by making identity a real typed record.

---

## Proposed Changes

### Change A — New namespace `com.semanticops.core` and core base package

Introduce the `com.semanticops.core` namespace as a **reserved core namespace**. Types and fields in this namespace are defined once, in the SRS specification itself, and made available in every conforming SRS repository without per-repository configuration.

The **core base package** is an always-available package artifact:

- It is embedded in every conforming SRS implementation (analogous to how `srs-rust` embeds `governance-seed.srsj` via `include_str!`, built deterministically from the spec records in `srs/srs/`).
- At repository load time, a conforming implementation MUST implicitly merge the core package's field and type definitions into the package union **before** any type resolution. Specifically, the core base package's definitions MUST be treated as logically present in the RFC-014 R6 union (the union of all installed package version directories) even though no `packageRef` entry points to them. `com.semanticops.core/*` `typeId`s and `fieldId`s MUST resolve against this implicitly merged union exactly as if they appeared in an explicit local package. A validator applying RFC-014 R6 MUST include the core package in the resolution union; failure to do so is non-conformance with RFC-018, not a validation error on the repository.
- A repository declaring any Type or Field under the `com.semanticops.core` namespace in a local or external package MUST be rejected with a conflict error. Core namespace definitions are exclusively the implementation's responsibility.
- The canonical definition of the core base package is the SRS records authored in `srs/srs/` (tracked in srs-rust#135). The artifact consumed by implementations is a deterministic `.srsj` export of those records, valid against `docs/schema/2.0/package-bundle.json` with `mode: bundled`; its `packageId` UUID is minted when those records are authored (see Open Questions OQ-1). The artifact is rebuilt whenever the spec records change and verified by a `--check` rebuild test.
- The core bundle is a valid instance of `docs/schema/2.0/package-bundle.json`. Implementations MUST validate it against that schema during build, not at repository load time.

**Core package identity:**

| Field | Value |
|---|---|
| Namespace | `com.semanticops.core` |
| Name | `core` |
| Version | `1.0.0` (first stable) |

**Namespace reservation scope.** This RFC reserves only the `com.semanticops.core` namespace under Change A and R2. Other `com.semanticops.*` sub-namespaces — including `com.semanticops.base` (RFC-017), `com.semanticops.spec` (spec-authoring meta-types), and `com.semanticops.srs` (core model types) — are governed by their own RFC or by general package conflict rules; R2 does not implicitly extend to them.

### Change B — Introduce `com.semanticops.core/purpose` Type

The core base package defines a single Tier-2 type:

| Property | Value |
|---|---|
| Namespace | `com.semanticops.core` |
| Name | `purpose` |
| Tier | 2 (TypedRecord) |
| Version | 1 |

**Fields:**

| Field name | Type | Required | Description |
|---|---|---|---|
| `statement` | text | **Required** | The repository's purpose or mission statement. MUST be non-empty. |
| `title` | text | Optional | Short human-readable label for the identity record. Distinct from the repository manifest's `title` (the manifest title is the canonical display name; `purpose.title` is an optional narrow-context label a consumer MAY prefer when displaying the identity record in constrained UI contexts such as a sidebar). |

**Why Tier-2.** A `purpose` record must carry typed, schema-validated fields (`statement`, `title`). Tier-2 (TypedRecord) is the correct tier for typed content with named fields. Tier-1 would require a Container root, adding unnecessary structural overhead for what is essentially a single structured record. Tier-0 is explicitly what this RFC supersedes.

### Change C — Tighten `identityInstanceId` to require a `purpose` Record

RFC-013 I-81 requires `identityInstanceId` to resolve to a member of the root container. This RFC **layers an additional constraint** on top: `identityInstanceId` on the root container MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`.

**I-81 is not modified.** It continues to state the membership requirement. I-87 (this RFC) is a separate, additive invariant that constrains the target's type. Both I-81 and I-87 apply simultaneously to `identityInstanceId` on a root container under RFC-018.

The existing RFC-013 properties are **preserved**:
- The pointer is reassignable at any time (RFC-013 R8).
- The new target must be a member of the root container before the pointer is moved (I-81 remains).
- `identityInstanceId` is carried on the Container, not the manifest.
- Core Container invariants 20–21 are unchanged.

**`identityInstanceId` remains an optional field** in both schemas. R5 (type constraint) applies only when the field is present. A repository with a root container and no `identityInstanceId` field set is valid under RFC-018; the grace rule R7 applies only where `identityInstanceId` is present but resolves to a non-`purpose` record.

What RFC-018 **supersedes** in RFC-013:
- Change B default: "A conforming `repo create` MUST set `identityInstanceId` to a `purpose` Record, not to a Tier-0 note." (A `repo create` implementation MAY still create a Tier-0 root note for use as a navigation section; it MUST NOT set `identityInstanceId` to it — see Change D step 4.)
- Alt C (rejected): "A new universal repository identity Type and base package" → **superseded**: Alt C is the accepted design.
- Non-Goal: "No new identity Type and no base package" → **removed**.

### Change D — `repo create` produces a `purpose` Record as the identity

`repo create` (the `ext:repository` initialisation command) currently creates a Tier-0 root note as the initial identity record. RFC-018 changes this:

1. `repo create` MUST create a Tier-2 `purpose` Record using the intent text supplied via the `--intent <text>` argument (as defined in the `ext:repository` spec) as the `statement`. The `purpose` Record's `title` SHOULD be set to the repository name (the value passed to `--name` or equivalent).
2. If no `--intent` text is supplied at invocation time, the implementation MUST either prompt the user interactively for a purpose statement or halt with an error before creating the repository. It MUST NOT initialize the repository with an empty or whitespace-only `statement`.
3. The `purpose` Record MUST be added to the root container's membership set (`rootInstanceIds` or `memberInstanceIds`).
4. `manifest.container.identityInstanceId` MUST be set to the new `purpose` Record's `instanceId`.
5. A `repo create` implementation MAY still create a Tier-0 root note for use as a navigation section, but MUST NOT set `identityInstanceId` to it.

---

## Conformance Rules

> **[R1]** A conforming SRS implementation MUST include the core base package's definitions in the package union resolved by RFC-014 R6 for every repository, without requiring any `packageRef` or `packageRefs` declaration in the manifest. `com.semanticops.core/*` types and fields MUST resolve against this union exactly as if they appeared in an explicit local package. An implementation that fails to resolve core types in a structurally valid repository is non-conformant with RFC-018.

> **[R2]** A repository MUST NOT declare any Type or Field under the `com.semanticops.core` namespace in a local or external package. An implementation MUST reject the repository load with a conflict error if any such declaration is encountered. This reservation covers the `com.semanticops.core` namespace only; other `com.semanticops.*` sub-namespaces are not affected.

> **[R3]** The core base package MUST define exactly the `purpose` Type described in Change B — Tier-2, with a required `statement` text field and an optional `title` text field. No other Types or Fields are introduced in the initial core base package (version 1.0.0).

> **[R4]** A `purpose` Record's `statement` field value MUST be non-empty. Implementations SHOULD trim leading and trailing whitespace before storing `statement`; the validation rule is applied to the stored value as-is. A stored value that is empty or consists solely of whitespace is a validation error.

> **[R5]** `manifest.container.identityInstanceId`, when present, MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. An implementation MUST report a validation error if `identityInstanceId` resolves to a record of any other tier or type, subject to the migration grace rule in R7. (Layers on RFC-013 I-81: the membership requirement of I-81 is retained; RFC-018 adds a type constraint on top.)

> **[R6]** A repository initialized by `repo create` MUST have `manifest.container.identityInstanceId` set to a `purpose` Record created at initialization time. The `purpose` Record's `statement` MUST be the value of the `--intent` argument passed to `repo create` (as defined in the `ext:repository` spec); its `title` SHOULD be the repository name. If no `--intent` value is supplied, the implementation MUST prompt the user or halt with an error — it MUST NOT create the repository with an empty or whitespace-only `statement`. (Supersedes RFC-013 Change B default.)

> **[R7]** **Migration grace rule (overrides R5 for existing repositories).** Notwithstanding R5, during the migration grace period established by RFC-018: an implementation MUST emit a migration warning in place of the R5 validation error for any existing repository whose `identityInstanceId` is present but resolves to a record that is not a Tier-2 `com.semanticops.core/purpose` Record (including Tier-0 notes and Tier-1 TypedRecords of any type). All other R5 constraints — non-purpose targets in newly created repositories, and `identityInstanceId` values that fail I-81 membership — remain hard errors. This grace rule expires when a migration deadline is established by a future RFC or platform announcement; no deadline is set by RFC-018 itself.

> **[R8]** A conforming implementation MUST expose a deterministic migration operation — a CLI command, API call, or equivalent — that accepts a repository with a non-`purpose` `identityInstanceId` and produces a repository where: (a) a new Tier-2 `purpose` Record exists with its `statement` set to the full text of the previous identity record's body (verbatim, without truncation or summarization), (b) `identityInstanceId` is repointed to the new `purpose` Record's `instanceId`, and (c) `srs repo validate` reports 0 errors. The proposed CLI form is `srs repo migrate-identity [--repo <path>]` (non-normative example; final command name is implementation-defined). The new `purpose` Record's `instanceId` MUST be freshly minted; the previous identity record's `instanceId` is not reused. The previous identity record MAY be retained as a navigation section member or removed; this is implementation policy. Implementation tracked in srs-rust#426.

---

## New Invariants

| # | Invariant | Force | instanceId |
|---|---|---|---|
| **I-85** | `com.semanticops.core/*` types and fields MUST resolve in every conforming repository without any package declaration. An implementation that fails to resolve them in a structurally valid repository is non-conformant. | MUST — implementation conformance | `9d686444-89d9-4a30-a9c3-b08bd31b62ca` |
| **I-86** | No Type or Field with namespace `com.semanticops.core` MAY be declared in any local or external package installed by a repository. An implementation MUST reject the load with a conflict error on such a declaration. | MUST NOT — validation error | `890d7d54-81f6-4001-bf31-30b156844431` |
| **I-87** | `manifest.container.identityInstanceId`, when present, MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. Layers on RFC-013 I-81 (membership requirement retained; RFC-018 adds the type constraint). During the migration grace period (RFC-018 R7), an implementation MUST emit a migration warning rather than a validation error for existing repositories whose `identityInstanceId` resolves to a non-`purpose` record. | MUST — validation error (see R7 grace period) | `818d636c-8347-46a1-a9a2-c99e2ee90d21` |

---

## Non-Goals

This RFC deliberately does not introduce, and the following are out of scope:

- **No additional types in core base package v1.0.0.** Only `purpose` (Change B). Future types under `com.semanticops.core` require a new RFC.
- **No mandatory `packageRef` entry.** The core package is always implicitly available; repositories MUST NOT be required to declare it.
- **No attachment-policy or settings functionality.** That is `com.semanticops.base` (RFC-017), a separate optional package.
- **No graduation tooling in this RFC.** The migration command (R8) is specified here but its implementation is tracked separately (srs-rust#426). No deadline is set for migration grace expiry.
- **No DocumentView or navigation changes.** Change C and D affect only `identityInstanceId` semantics; the structural navigation model (RFC-013 Change C) is unchanged.

---

## Schema Changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Update `$defs/Container.properties.identityInstanceId` description to reference RFC-018 and the `com.semanticops.core/purpose` type constraint on the root container. |
| `docs/schema/2.0/container.json` | Update `properties.identityInstanceId` description: add "RFC-018 additionally requires that on the root container (`manifest.container`), this MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. For non-root containers this type constraint does not apply." |

No new schema files are required. The `purpose` type shape is defined as SRS Field and Type records authored in `srs/srs/` (tracked in srs-rust#135), not as JSON Schema artifacts. The core base package bundle artifact (`.srsj` export of those records) is a valid instance of `docs/schema/2.0/package-bundle.json` with `mode: bundled`; no additional schema file is needed.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

Per the `/rfc` single-repo workflow, this session edits only the canonical schema in `srs/docs/schema/2.0/`; the mirrors refresh from the `srs` release artifact through their own pipelines.

---

## Rationale

**Why `com.semanticops.core` rather than `com.semanticops.srs`.** The `com.semanticops.srs` namespace holds the SRS core model types (Field, Type, Record, Relation, etc.) — types defined by and within the SRS spec's own package mechanism, installed via `packageRefs`. Those types are present because a repository explicitly installs the SRS core model package. The `com.semanticops.core` namespace carries a different guarantee: **always implicitly available, no installation required**. Mixing them would mean either (a) the core SRS model types would need to become always-implicit (a breaking change to how `packageRefs` works), or (b) the `purpose` type would need to be explicitly installed (defeating the goal of Problem 2). A separate namespace makes the always-implicit guarantee explicit and allows the core base package to be versioned independently of the SRS model package. See Alt E for the rejected alternative.

**Why a universal type rather than a per-ecosystem package type.** The problem RFC-013 left open is that any repository — not just governance repositories — needs a machine-navigable identity record. A per-ecosystem type (e.g. in `com.mudemocracy.governance`) would require a governance-package installation just to give a non-governance repository a typed identity, which is circular. A core type in a universally available namespace solves this without creating inter-package dependencies.

**Why implicit merge rather than a mandatory `packageRef`.** Requiring every repository to declare a `packageRef` for `com.semanticops.core` would mean every `repo create`, migration script, and package template must be updated, and any omission would cause type-resolution failures for the most fundamental type in the system. An implicit merge (analogous to how `srs-rust` already embeds `governance-seed.srsj`) achieves universal availability without burdening repository manifests. The conflict rule (R2) keeps the implicit merge from becoming a silent shadowing mechanism.

**Why tighten `identityInstanceId` to a specific type rather than leave it open.** RFC-013's membership-only constraint leaves the implementation unable to resolve identity in a type-driven way. Code that retrieves the identity record must branch on "is this a Note or a TypedRecord?" before it can do anything useful. A typed constraint turns identity resolution into an ordinary `resolve_type` + `record_get` call, eliminating the special path.

**Why a grace rule (R7) rather than a hard error for existing non-`purpose` identities.** Existing conformant RFC-013 repositories should not suddenly break when RFC-018 is adopted. R7 gives implementations time to ship a migration operation (R8, tracked in srs-rust#426) before enforcement is tightened.

**Why R8 requires verbatim note text (no truncation).** The `statement` field is declared as `text` with no length cap; a long statement is still a valid statement. Allowing discretionary truncation would make migration non-reproducible — two conformant tools could produce different `statement` values from the same note body, which is unacceptable for a deterministic migration.

---

## Alternatives Considered

### Alt A — Reuse an existing package type (e.g. from a governance package)

Use an identity type from `com.mudemocracy.governance` or another ecosystem package as the universal identity type. **Rejected**: creates a mandatory governance-package dependency for non-governance repositories, which is architecturally inverted.

### Alt B — An optional `packageRef` for the core package

Keep the core package optional — repositories may install it when they want a `purpose` record. **Rejected**: fails to solve Problem 2 (no universally available type) and Problem 3 (reference implementation type-resolution failure), since both require the type to be *always* present.

### Alt C — Keep RFC-013 default (Tier-0 note) and add type inspection heuristics

Leave `identityInstanceId` pointing at a Tier-0 note and add heuristics that infer identity from the note's content. **Rejected**: heuristics diverge across implementations and do not compose with the SRS type system. The root cause is a missing typed contract, which Alt C does not address.

### Alt D — Add `identityInstanceId` type constraint directly to the JSON Schema (as an `if/then`)

Express the `purpose`-type requirement as a JSON Schema `if/then` or `const typeId` constraint. **Rejected**: the `typeId` UUID is minted when spec records are authored and is not known at schema authoring time; `if/then` cross-document constraints are difficult to express in JSON Schema without a resolver that understands SRS package semantics; and the invariant layer (I-87) is the right normative home for cross-entity constraints.

### Alt E — Define `purpose` under `com.semanticops.srs`

Add the `purpose` type to the existing `com.semanticops.srs` namespace. **Rejected**: see Rationale above — `com.semanticops.srs` types are installed via explicit `packageRefs`, not implicitly available. Placing `purpose` there would either require every repository to install the SRS core model package (defeating the always-implicit goal) or force all SRS model types to become implicitly available (a breaking change to the `packageRefs` resolution model). A dedicated `com.semanticops.core` namespace with a distinct always-implicit guarantee is the clean separation.

---

## Migration

Existing repositories that were conformant under RFC-013 (with a Tier-0 note or any other non-`purpose` record as `identityInstanceId`) are non-conformant under RFC-018 until migrated. The R7 grace rule prevents hard errors until migration. The migration is one-time and mechanical, executed by `srs repo migrate-identity` (R8):

1. Create a new Tier-2 `purpose` Record: `statement` = existing identity record's full body text (verbatim), `title` = existing record's title (or repository manifest `title` if absent).
2. Add the new `purpose` Record to the root container's membership (`rootInstanceIds` or `memberInstanceIds`) **before** updating `identityInstanceId` (so I-81 remains satisfied at all steps).
3. Repoint `manifest.container.identityInstanceId` to the new `purpose` Record's `instanceId`.
4. The old identity record MAY be retained as a navigation section member or removed, at the repository owner's discretion.
5. Run `srs repo validate` — must report 0 errors.

The migration command is implemented in srs-rust#426. The dogfood repos (`srs/srs` and the `srs-gov` seed) are migrated as part of that issue's scope.

---

## Open Questions

1. **OQ-1 — Core package `packageId` UUID.** The `packageId` UUID for the core base package is deferred to when the core package spec records are authored in `srs/srs/` (tracked in srs-rust#135). The UUID is stable once minted and is used by the RFC-014 R10 linkage check and conflict-detection logic. **To resolve before srs-rust#423 ships the core-type registry.**
