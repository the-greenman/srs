# CLAUDE.md — srs

The SRS canonical specification, authored as an SRS repository. This is the source of truth for the SRS data model. The rendered specification under `spec/` and `docs/` is a projection of the records — not the source.

`srs-usage.md` (this repo, alongside this file) contains the authoritative rules for working with any SRS repository as an agent — follow them here. The data model summary below is a quick reference; `srs-usage.md` has the full detail.

This repo is part of a monorepo (`srs`, `srs-rust`, `srs-vscode`, `srs-web`) — when using Claude Code on the web, each repo is accessed independently.

## SRS data model (quick reference)

**Field** — atomic semantic unit. Has a stable UUID `id`, `namespace`, `name` (snake_case), `version` (integer), `valueType` (string|text|number|boolean|date|url|select|multiselect), and optional `aiGuidance`. Field semantics are immutable.

**Type** — named, versioned composition of Fields. Contains `fields[]` as FieldAssignments: `{ fieldId, order, required, displayLabel? }`. `displayLabel` is rendering-only.

**Record tiers:**
- **Tier 0 (Note)**: free text sections, no type binding
- **Tier 1 (TypedRecord)**: named fields with values, no Type binding
- **Tier 2 (Record)**: instantiated Type via `typeId` + `typeVersion`; contains `fieldValues[]` mapping `fieldId → value`

**Relation** — typed edge between two instance UUIDs. Canonical types: `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`.

**Container** — lightweight grouping boundary. Its `containerId` is distinct from instance IDs and must not appear as a Relation source/target.

**Repository** — directory with `.srs/` marker + `manifest.json`. The `instanceIndex` in the manifest is the authoritative member list.

## Git commit signing (local CLI use)

All commits use an SSH signing key. Before committing, verify the key is loaded:

```bash
ssh-add -l | grep -q "SHA256:vHuO6si5w3RLL4IJZofWbyvEi42WA2fYX7bM" || echo "SIGNING KEY NOT LOADED"
```

If missing, stop and reload the key — do not bypass signing.

## What this repo is

`srs/srs/` is itself an SRS repository. Its records encode the specification using types like `com.semanticops.spec/section`, `com.semanticops.spec/subsection`, `com.semanticops.spec/invariant`, `com.semanticops.spec/extension`. The `relations/relations.json` defines `precedes` ordering between sections. The `spec/` directory contains rendered exports committed for human readability — they are derived, not authoritative.

**The records are the source of truth. The markdown is a projection.**

## Commands

```bash
# Validate the spec repo — should always be 0 errors
srs repo validate --repo srs/srs --pretty

# Inspect
srs repo map --repo srs/srs --pretty
srs type list --repo srs/srs --pretty
srs record list --repo srs/srs --type com.semanticops.spec/section --pretty

# Render the spec to markdown
SRS_CLI_PATH=$(which srs) node scripts/publish-spec.mjs

# Validate all records via Node scripts
node scripts/validate-all.mjs
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
4. Re-render if the rendered spec is also being committed: `SRS_CLI_PATH=$(which srs) node scripts/publish-spec.mjs`

## Spec Independence

The spec must remain valid without any Rust or JS implementation present. Do not add content that only makes sense in the context of the Rust implementation. The spec defines the model; the implementation follows.

## Namespaces in This Repo

- `com.semanticops.srs` — core SRS model types (Field, Type, Record, Relation, etc.)
- `com.semanticops.spec` — meta-types for authoring the specification itself (section, subsection, invariant, extension, etc.)

Do not create records or types under ad-hoc namespaces. Match the namespace to the existing convention for the content you are adding.

## Rendered Outputs

`spec/` contains committed rendered exports. These are generated — do not edit them directly. Re-render with `SRS_CLI_PATH=$(which srs) node scripts/publish-spec.mjs` after modifying records, then commit both the record changes and the updated rendered output together.

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
