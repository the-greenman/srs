# Semantic Record System Specification

The SRS specification, authored as an SRS repository. Records in `srs/` are the source of truth; the rendered documents in `docs/spec/` are projections from those records.

## What is SRS?

SRS (Semantic Record System) is a structured data model for authoring and managing semantic records — typed, versioned, addressable pieces of information that can be composed, related, rendered, and validated by tooling. This repository contains the canonical specification for SRS 2.0.

## Repository layout

```
srs/                  the SRS repository (records are the source of truth)
  records/            spec sections, subsections, design notes, RFCs, type definitions, ...
  package/            field and type definitions used by this repository
  relations/          relation files
  manifest.json       repository manifest
docs/
  spec/               rendered exports (generated — do not edit by hand)
    srs-spec.md       the specification
    srs-rationale.md  design notes and rationale
    srs-unified.md    spec + rationale combined
    rfcs/             rendered RFC documents
    profiles/         adoption profiles
    examples/         usage examples
  schema/             JSON Schema files for SRS data structures
scripts/              tooling for rendering, validating, and migrating records
rfcs/                 RFC proposal artifacts (review material, not live package content)
```

## Reading the spec

Start with [docs/spec/srs-spec.md](docs/spec/srs-spec.md) for the normative specification.

For design rationale and the thinking behind decisions, see [docs/spec/srs-rationale.md](docs/spec/srs-rationale.md).

The combined document [docs/spec/srs-unified.md](docs/spec/srs-unified.md) interleaves spec text with rationale sections for reading in one pass.

## Scripts

Run from the `srs/` directory:

```bash
node scripts/validate-all.mjs        # validate all spec records
node scripts/check-release-drift.mjs # validate docs/schema mirrors are in sync
node scripts/publish-spec.mjs        # render docs + sync schemas across sibling repos
```

## Active RFCs

| RFC | Title | Status |
|-----|-------|--------|
| [RFC-001](docs/spec/rfcs/rfc-001.md) | Views L2 — Rendering Hierarchy and Default Rendering Baseline | accepted |
| [RFC-002](docs/spec/rfcs/rfc-002.md) | ext:themes-l1 — Visual Theming for Document Views | accepted |
| [RFC-003](docs/spec/rfcs/rfc-003.md) | Definition Distribution and Repository Slices | draft |
| [RFC-004](docs/spec/rfcs/rfc-004.md) | Language-Neutral Schema Notation for Spec Records | draft |

## Authoring

The rendered markdown files in `docs/spec/` are generated outputs. To change the specification, edit the source records in `srs/records/`, then run `node scripts/publish-spec.mjs`. Schema changes must be committed in `docs/schema/2.0` and mirrored into `../srs-rust` and `../srs-vscode` by the same publish step. The `instanceIndex` in `srs/manifest.json` is the authoritative list of which records belong to this repository.
