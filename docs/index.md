# SRS Documentation

Generated outputs and reference material for the Semantic Record System specification.

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
