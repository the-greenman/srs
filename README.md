# Semantic Record System — Specification

The canonical specification for **SRS 2.0**, authored as an SRS repository. The records in [`srs/`](srs/) are the source of truth; the rendered documents under [`docs/spec/`](docs/spec/) are projections generated from those records.

## What is SRS?

SRS (Semantic Record System) is a structured data model for authoring and managing **semantic records** — typed, versioned, addressable pieces of information that tooling can compose, relate, render, and validate. This repository defines the model; it does not implement it.

The defining property of this repo is that it is **self-hosting**: the specification is itself an SRS repository (`srs/srs/`), so the model is demonstrated by using it. Running the renderer over those records produces the human-readable spec.

## The SemanticOps ecosystem

SRS is developed as a four-repository monorepo. Each repo is an independent git repository under a shared parent:

| Repo | Role |
|------|------|
| **srs** (this repo) | Canonical spec: RFCs, JSON schemas, and the spec-as-records source of truth |
| [`srs-rust`](../srs-rust) | Reference implementation — the `srs` CLI engine + WASM bindings |
| [`srs-vscode`](../srs-vscode) | VS Code extension (thin client over the `srs` CLI) |
| [`srs-web`](../srs-web) | Governance web editor (thin client over the WASM bindings) |

The spec is upstream of everything: schema changes here are mirrored into the implementation repos by the publish step (see [Authoring](#authoring)).

## Scale

The spec-as-records repository (`srs/srs/`) currently holds **~311 records** — 76 invariants, 68 subsections, 43 design notes, 17 extensions, 13 RFC records, plus sections, tables, and type/field definitions — across two namespaces (`com.semanticops.srs` for the core model, `com.semanticops.spec` for the meta-types that author the spec). The model is described by **24 JSON schemas** under [`docs/schema/2.0/`](docs/schema/2.0/).

## Repository layout

```
srs/                  the SRS repository (records are the source of truth)
  records/            spec sections, subsections, design notes, RFCs, type definitions, ...
  package/            field and type definitions used by this repository
  relations/          relation files (precedes ordering, contains hierarchy)
  manifest.json       repository manifest (includes the required root container — RFC-013)
docs/
  spec/               rendered exports (generated — do not edit by hand)
    srs-spec.md       the normative specification
    srs-rationale.md  design notes and rationale
    srs-unified.md    spec + rationale combined
    rfcs/             rendered RFC documents (rfc-catalog.md)
    profiles/         adoption profiles
    examples/         usage examples
  schema/2.0/         JSON Schema files for SRS data structures
  overview/           concepts.md, how-it-works.md
packages/             base packages (com.semanticops.core, com.mudemocracy.governance)
scripts/              tooling for rendering, validating, and migrating records
rfcs/                 RFC proposal artifacts (review material, not live package content)
conformance/          discovery conformance scenarios + fixture repo
srs-usage.md          authoritative agent rules for working with any SRS repository
```

Every repository has a **required root container** (`manifest.container`, RFC-013): the repo's identity object and the top of structural navigation. Its `identityInstanceId` names the repository identity record — on the root container this MUST be a Tier-2 Record of type `com.semanticops.core/purpose` (RFC-018); its non-identity members are the navigation sections, ordered by the `precedes` chain. Enforcement and `repo create` scaffolding land in the epic's Phase 1 — the constraint is defined in the spec now and dogfooded as the implementation catches up.

## Reading the spec

- [docs/spec/srs-spec.md](docs/spec/srs-spec.md) — the normative specification.
- [docs/spec/srs-rationale.md](docs/spec/srs-rationale.md) — design rationale and the thinking behind decisions.
- [docs/spec/srs-unified.md](docs/spec/srs-unified.md) — spec text interleaved with rationale, for a single-pass read.
- [docs/overview/concepts.md](docs/overview/concepts.md) — a gentler conceptual introduction.

## RFCs

The specification evolves through numbered RFCs. Proposal artifacts live in [`rfcs/`](rfcs/); the RFCs that have been incorporated as records render into [`docs/spec/rfcs/rfc-catalog.md`](docs/spec/rfcs/rfc-catalog.md), which is the live, generated source of RFC status — prefer it over any hand-maintained list.

There are 26 assigned RFC numbers (016 and 018 each cover two distinct RFCs; 024 is unassigned). Current status at a glance:

- **Accepted / incorporated** — RFC-001 (Views L2 rendering baseline), 002 (`ext:themes-l1`), 006 (vocabulary substrate), 007 (composite group rendering), 008 (heterogeneous container-subset sections), 009 (root-record type anchor), 011 (DocumentView query extensions), 012 (discovery contract text projection), 013 (required root container), 014 (import tracking & package binding), 015 (view-owned ordering / declared presentations), 016 (invariant record projection; lifecycle update command), 017 (attachments / base-package archive determinism), 018 (changelog extension `ext:changelog`; core base-package identity type), 019 (cross-field validation rules), 020 (type-level identity field), 022 (relational lifecycle states), 023 (SourceReference vocabulary disjointness), 025 (governance primary-export DocumentView), 026 (`ext:slices` subset export), 027 (per-record relation display in document views).
- **Draft** — RFC-003 (definition distribution & repository slices), 004 (language-neutral schema notation), 005 (installable/verifiable relation types), 010 (assisted three-way merge), 021 (blueprint optional `$schema`).

Un-numbered candidate spec changes surfaced by downstream tooling are staged in [`rfcs/mudemocracy-rfc-candidates.md`](rfcs/mudemocracy-rfc-candidates.md) awaiting promotion through the `/rfc` process.

## Scripts

Run from the `srs/` directory:

```bash
node scripts/validate-all.mjs          # validate all spec records
node scripts/check-release-drift.mjs   # verify docs/schema mirrors are in sync
node scripts/publish-spec.mjs          # render docs + sync schemas across sibling repos
```

Rendering uses the `srs` engine; point it at your CLI build with `SRS_CLI_PATH=$(which srs) node scripts/publish-spec.mjs`.

## Authoring

The rendered markdown files in `docs/spec/` are **generated outputs** — never edit them directly. To change the specification:

1. Edit the source records under `srs/records/` (create/modify via the `srs` CLI where possible).
2. For a new section/subsection, assert a `precedes` relation to place it in document order.
3. Validate: `srs repo validate --repo srs/srs` — zero diagnostics before committing.
4. Re-render: `SRS_CLI_PATH=$(which srs) node scripts/publish-spec.mjs`, and commit the record and rendered changes together.

Schema changes are committed in `docs/schema/2.0/` and mirrored into `../srs-rust` and `../srs-vscode` by the publish step. The `instanceIndex` in `srs/manifest.json` is the authoritative list of which records belong to this repository.

**Spec independence** is the foundational constraint: this repo must remain valid with no Rust or JS implementation present. Do not add content that only makes sense in the context of an implementation.

See [`srs-usage.md`](srs-usage.md) for the authoritative agent rules and [`CLAUDE.md`](CLAUDE.md) for contributor guidance.
