# SRS Documentation

Generated outputs and reference material for the Semantic Record System specification.

## Overview — start here

New to SRS? These hand-written pages give the conceptual big picture before the normative
detail.

| Document | Description |
|----------|-------------|
| [overview/](overview/README.md) | The big picture — what SRS is and how the project fits together |
| [overview/concepts.md](overview/concepts.md) | Key elements — Field, Type, Record, Relation, Container, Vocabulary, Extensions |
| [overview/how-it-works.md](overview/how-it-works.md) | How the pieces fit together — repository layout, loading/validation pipeline, the three repos |

## Specification

| Document | Description |
|----------|-------------|
| [srs-spec.md](spec/srs-spec.md) | Normative specification |
| [srs-rationale.md](spec/srs-rationale.md) | Design notes and rationale |
| [srs-unified.md](spec/srs-unified.md) | Spec and rationale combined |

## RFCs

| RFC | Title | Status |
|-----|-------|--------|
| [RFC-001](spec/rfcs/rfc-001.md) | Views L2 — Rendering Hierarchy and Default Rendering Baseline | draft |
| [RFC-002](spec/rfcs/rfc-002.md) | ext:themes-l1 — Visual Theming for Document Views | draft |
| [RFC-003](spec/rfcs/rfc-003.md) | Definition Distribution and Repository Slices | draft |
| [RFC-004](spec/rfcs/rfc-004.md) | Language-Neutral Schema Notation for Spec Records | draft |

## Profiles and Examples

| Document | Description |
|----------|-------------|
| [profiles/](spec/profiles/) | Adoption profiles for specific use cases |
| [examples/](spec/examples/) | Usage examples |

## Schema

JSON Schema definitions for SRS data structures are in [schema/](schema/).

---

All documents in `spec/` are generated from source records in `srs/srs/records/`. Do not edit them by hand — run `node scripts/render-spec.mjs` from the `srs/` directory to regenerate.
