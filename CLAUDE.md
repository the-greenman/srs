# CLAUDE.md — srs

The SRS canonical specification, authored as an SRS repository. This is the source of truth for the SRS data model. The rendered specification under `spec/` and `docs/` is a projection of the records — not the source.

`srs-usage.md` (this repo, alongside this file) contains the authoritative rules for working with any SRS repository as an agent — follow them here. The data model summary below is a quick reference; `srs-usage.md` has the full detail.

This repo is part of a monorepo (`srs`, `srs-rust`, `srs-vscode`, `srs-web`) — when using Claude Code on the web, each repo is accessed independently.

## Read first

Before making or reviewing any design or spec decision, read **[`docs/charter/decision-compass.md`](docs/charter/decision-compass.md)** — the standard's governing preference layer (the Pattern Grid's six axes and twelve cells), its layer-stacking rules, decision modes, and review tests, each citing the `rfc-decision-…` record that rules it. Every new RFC and decision names its cell (and, since `rfc-decision-7caca3a1`, its decision mode) — the compass is where you find which cell and mode apply, and what the standing preference is before you propose something that contradicts it.

## SRS data model (quick reference)

**Field** — atomic semantic unit. Has a stable UUID `id`, `namespace`, `name` (snake_case), `version` (integer), a `fieldType` (RFC-032: `datatype` × `cardinality` × value-domain × `format` × `constraints`, where `datatype` may be `ref` to another Type, `dependent`, or `map`), and optional `aiGuidance`. Field semantics are immutable. The pre-RFC-032 scalar `valueType` enum no longer exists.

**Type** — named, versioned composition of Fields. Contains `fields[]` as FieldAssignments: `{ fieldId, order, required, displayLabel? }`. `displayLabel` is rendering-only.

**Presentation is view-owned, never type-owned.** RFC-015 established it for ordering and RFC-036 for rendering: a composite-range Field is dispatched to a renderer by `FieldView.compositeRenderer` or a `DocumentSection`/`DocumentView` directive, not by anything on the Type. When adding a presentational capability, put it in the view layer and check it against RFC-015's test — if many concurrent arrangements over the same records are legitimate and none is a semantic claim, it is presentation.

**Record tiers:** two tiers; numbering keeps the historical gap at 1 (Tier 1/`TypedRecord` was removed as an unexercised construct — rfc-decision-53635966, srs#448).
- **Tier 0 (Note)**: free text sections, no type binding
- **Tier 2 (Record)**: instantiated Type via `typeId` + `typeVersion`; carries `fieldValues` — an object keyed by `Field.name` verbatim, values recursive per the Field's `fieldType` (RFC-039)

**Relation** — typed edge between two instance UUIDs. Canonical types: `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`.

**Container** — lightweight grouping boundary. Its `containerId` is distinct from instance IDs and must not appear as a Relation source/target.

**Repository** — directory with `.srs/` marker + `manifest.json`. Membership is tree-authoritative: the repository's catalog, enumerated from the tree under the reserved instance roots, is the authoritative member list (RFC-038 [R1]). There is no `instanceIndex` in the manifest; it is retired (RFC-038 [R2]), except the root container, which the manifest carries inline at `manifest.container` (RFC-038 [R1]).

## Git commit signing (local CLI use)

All commits use an SSH signing key. Before committing, verify the key is loaded:

```bash
ssh-add -l | grep -q "SHA256:vHuO6si5w3RLL4IJZofWbyvEi42WA2fYX7bM" || echo "SIGNING KEY NOT LOADED"
```

If missing, stop and reload the key — do not bypass signing.

## What this repo is

`srs/srs/` is itself an SRS repository. Its records encode the specification using types like `com.semanticops.spec/section`, `com.semanticops.spec/subsection`, `com.semanticops.spec/invariant`, `com.semanticops.spec/extension`. The `relations/relations.json` defines `precedes` ordering between sections. The `spec/` directory contains rendered exports committed for human readability — they are derived, not authoritative.

**The records are the source of truth. The markdown is a projection.**

## RFC → canonical-spec integration (issue #204)

An RFC lives in two places, with a clear canonical split:

- **`rfcs/rfc-NNN-*.md`** — the RFC **proposal and design history** (the full text). Not canonical spec.
- **`srs/records/` + `docs/schema/2.0/`** — the **canonical spec**. When an RFC is accepted, its normative changes MUST be folded in here.

Every RFC is also a **stub record** (type `com.semanticops.spec/rfc`) — metadata + `proposal-artifact-path` pointing at its `.md` + an integration manifest. A stub record never embeds the full RFC body.

An accepted/implemented RFC declares what it folded in as a machine-checkable manifest block appended to its `affected-components` field, inside an HTML comment:

```
<!-- srs-integration:v1
ext:changelog
schema:changelog.json
I-90
-->
```

Tokens: `I-<n>`, `ext:<name>`, `schema:<file>.json`, `type:<ns>/<name>`, `section:<slug>`, `subsection:<slug>`, or `tooling-only` (no record/schema artifact — tooling/CLI/downstream-package only). `scripts/check-rfc-integration.mjs` enforces that every accepted RFC declares a non-empty manifest whose tokens all resolve, and that the `.md` `**Status**:` line matches the record `rfc-status`. Genuinely-incomplete folds are grandfathered in `rfcs/integration-allowlist.json` with a follow-up issue. See `.claude/commands/rfc.md` Stage 6.

Before any of that: `.claude/commands/rfc.md` Stage 1.5 — the **Charter Check** — runs before drafting begins, naming the RFC's cell(s), decision mode, past decisions consulted, one-way-per-goal answer, and the compass's layer test; its output becomes the RFC's required `## Charter alignment` section, and `check-rfc-integration.mjs` enforces the section's presence for RFCs created after 2026-08-23 (srs#463).

## Commands

```bash
# Validate the spec repo — should always be 0 errors
srs repo validate --repo srs/srs --pretty

# Inspect
srs repo map --repo srs/srs --pretty
srs type list --repo srs/srs --pretty
srs record list --repo srs/srs --type com.semanticops.spec/section --pretty

# Render the spec to markdown — requires the pinned CLI, see "Rendered Outputs"
export $(node scripts/fetch-pinned-srs.mjs)
node scripts/publish-spec.mjs

# Validate all records via Node scripts (includes the RFC integration + process checks)
node scripts/validate-all.mjs

# RFC → canonical-spec drift gate on its own (issue #204)
node scripts/check-rfc-integration.mjs
```

## Working with Spec Content

Before adding or modifying spec content, run the discovery ladder:

```bash
srs type list --repo srs/srs --pretty                                   # 30 types across two namespaces
srs record list --repo srs/srs --type com.semanticops.spec/section      # top-level sections
srs relation list --repo srs/srs --pretty                               # ordering relations
```

When adding a new section or subsection:
1. Create the record via `srs record create`
2. Assert a `precedes` relation to establish its position in document order
3. Run `srs repo validate --repo srs/srs` — zero diagnostics before committing
4. Re-render if the rendered spec is also being committed — with the **pinned** CLI (see [Rendered Outputs](#rendered-outputs)):
   ```bash
   export $(node scripts/fetch-pinned-srs.mjs)
   node scripts/publish-spec.mjs
   ```

## Spec Independence

The spec must remain valid without any Rust or JS implementation present. Do not add content that only makes sense in the context of the Rust implementation. The spec defines the model; the implementation follows.

## Namespaces in This Repo

- `com.semanticops.srs` — core SRS model types (Field, Type, Record, Relation, etc.)
  - `com.semanticops.srs/metamodel` (RFC-033) — the **self-hosted meta-model**: `Field`, `Type`, `FieldAssignment`, `FieldType`, `ExactTypeRef`, `AiGuidance`, etc. expressed as SRS Type/Field definitions under `srs/package/metamodel/`. This is the **frozen-seed source** for `docs/schema/2.0/{field,type}.json` — those hand-authored schemas remain the bootstrap fixed point (loaded as committed, never re-derived at runtime); the metamodel records are what they must stay consistent with. Two checks enforce this (Node pipeline only — ADR-004: the installed binary can't load the fieldType package): `scripts/rfc-033-closure-test.mjs` (per-field), and the **RFC-035 reference emitter** `scripts/lib/schema-emitter.mjs` (whole-entity) — `tests/rfc-035/run.mjs` proves its output is byte-for-byte reproducible and `scripts/rfc-035-closure-test.mjs` proves it is `emitter ⊆ frozen seed` over the authoritative features. The normative source→JSON-Schema contract is `docs/schema/2.0/projection-rules.md`; `docs/schema/2.0/metamodel-fidelity.md` declares per-emitter authoritative-vs-approximated fidelity. The emitter does **not** overwrite the seed (that authorship flip is #260). The package is generated deterministically by `scripts/gen-metamodel-package.mjs` (with `--check`); do not hand-edit `srs/package/metamodel/**` — edit the generator.
- `com.semanticops.spec` — meta-types for authoring the specification itself (section, subsection, invariant, extension, etc.)

Do not create records or types under ad-hoc namespaces. Match the namespace to the existing convention for the content you are adding.

**`dataModelRevision` (RFC-033 / #265).** `manifest.json` and package manifests may carry an optional monotonic-integer `dataModelRevision` (absent ⇒ 0) stamping which data-model generation the data satisfies. RFC-032 (`valueType → fieldType`) is migration #1 → revision 1; srs#448 (Tier 1/TypedRecord removed, rfc-decision-53635966) is the migration to revision 4; srs#433 (substrate escape bag `properties → meta` on Term/RelationTypeDefinition/LifecycleState/LifecycleTransition — rfc-decision-6fc7e142, rfc-decision-628cf6c4) is the migration to revision 5; the spec repo is stamped `dataModelRevision: 5`. Not dotted semver.

## Rendered Outputs

`spec/` contains committed rendered exports. These are generated — do not edit them directly. Re-render after modifying records, then commit both the record changes and the updated rendered output together:

```bash
export $(node scripts/fetch-pinned-srs.mjs)   # sets SRS_CLI_PATH to the pinned build
node scripts/publish-spec.mjs
```

**Render with the pinned binary — the constraint is an equality, not a floor.** The committed exports correspond to **exactly** the `srs-rust` release named by `SRS_RUST_CLI_TAG` in `.github/workflows/release-drift.yml`, which is where the tag is declared and the only place it may be. Rendering with any other build — older *or* newer — produces a diff `check-release-drift` rejects, and the failure reads `docs/spec/... is stale`, naming the records as the culprit when the binary is what changed. So "install the latest `srs`" is wrong, not merely imprecise.

`scripts/fetch-pinned-srs.mjs` reads that tag and fetches that release; `publish-spec.mjs` and `check-release-drift.mjs` refuse to run with `SRS_CLI_PATH` unset and log the resolved binary's sha256 at startup. Never use `which srs` — the binary on `PATH` is whichever was installed last, and `srs --version` prints `srs 0.1.0` for every build, so it cannot tell you which one you have. If a render looks wrong, **compare the sha256 before touching a record.**

`release-drift.yml` also carries the procedure for advancing the pin (bump the tag and re-render in the same PR). `check-release-drift` is a required check and is **not** part of `validate-all.mjs`.

## Project & priority management

Issues across the ecosystem are tracked on **Project #5 "SRS"** and prioritised **top-down from
user stories**. The authoritative process lives in the `srs-rust` repo:
**`docs/project-management.md`** (canonical).

Quick rules:
- **Never hand-set an implementation issue's priority.** It is derived from the user stories it
  serves (as native GitHub sub-issues): humans set **MoSCoW** on stories; `gh-project rollup`
  derives `priority: Pn` (Must→P0, Should→P1, Could→P2).
- **Bugs** floor at `priority: P1` (fixed ASAP, even without a story); **unlinked non-bug** work
  is flagged ("could get lost"), never dropped — link it to a story.
- Skills here: `/triage`, `/stories`, `/roadmap`. They fetch the released tool (works in an
  isolated checkout):
  `gh release download --repo the-greenman/srs-rust --pattern gh-project.mjs --output /tmp/gh-project.mjs --clobber`.

## Branch & PR hygiene

Every branch must trace to a GitHub issue, and every PR must link its issue. This is how the ecosystem avoids the recurring failure mode where an issue is marked closed but its fix survives only on an unmerged, abandoned branch.

- **Naming** — human-created branches use `type/<issue#>-slug` (e.g. `feat/242-cross-field-rules`, `docs/432-migrate-identity`). Cloud-agent branches (`claude/<name>-<hash>`) are exempt from the scheme but their PR **must** carry `Closes #N`.
- **Linking** — every PR body includes `Closes #N` (or `Refs #N` if it should not auto-close). No PR without an issue reference. See `.github/pull_request_template.md`.
- **Merged branches auto-delete** — the repo has `deleteBranchOnMerge` enabled; a branch is removed automatically once its PR merges. Don't recreate deleted merged branches.
- **Abandoning work** — if a PR is closed **without merging** and the work is still wanted, reopen/flag the linked issue with a pointer to the branch **before** walking away. Otherwise the issue looks done while the fix lives only on a dead branch.
- **Automated safety net** — the weekly **SRS Branch Auditor** cloud routine reports merged-but-undeleted branches and reopens any issue whose fix survives only on an unmerged branch.
