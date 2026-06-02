# CLAUDE.md — srs

The SRS canonical specification, authored as an SRS repository. This is the source of truth for the SRS data model. The rendered specification under `spec/` and `docs/` is a projection of the records — not the source.

The top-level `semanticops/CLAUDE.md` contains the full SRS data model and CLI reference. `srs-usage.md` (this repo, alongside this file) contains the authoritative rules for working with any SRS repository as an agent — follow them here.

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
node scripts/render-spec.mjs

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
4. Re-render if the rendered spec is also being committed: `node scripts/render-spec.mjs`

## Spec Independence

The spec must remain valid without any Rust or JS implementation present. Do not add content that only makes sense in the context of the Rust implementation. The spec defines the model; the implementation follows.

## Namespaces in This Repo

- `com.semanticops.srs` — core SRS model types (Field, Type, Record, Relation, etc.)
- `com.semanticops.spec` — meta-types for authoring the specification itself (section, subsection, invariant, extension, etc.)

Do not create records or types under ad-hoc namespaces. Match the namespace to the existing convention for the content you are adding.

## Rendered Outputs

`spec/` contains committed rendered exports. These are generated — do not edit them directly. Re-render with `node scripts/render-spec.mjs` after modifying records, then commit both the record changes and the updated rendered output together.
