# SRS specification

SRS (pronounced "source") is an open standard for portable semantic documents that people and AI can both understand and use. [semanticops.com](https://semanticops.com) explains it, and its [llms.txt](https://semanticops.com/llms.txt) is the entry point for agents.

## What this repository is

The specification, authored as its own data. The specification is itself an SRS repository, [`srs/`](srs/): its prose, invariants, extensions and decisions are records. The rendered specification under [`docs/spec/`](docs/spec/) is a projection of those records, and the JSON Schemas and conformance fixtures are published alongside as files. This repository defines the model; it does not implement it.

The `docs/` directory is published at [srs.semanticops.com](https://srs.semanticops.com), the host for the specification and the schemas. For the concepts, start with the [model](https://semanticops.com/model/) on semanticops.com.

## Reading the spec

- [docs/spec/srs-spec.md](docs/spec/srs-spec.md): the normative specification.
- [docs/spec/srs-rationale.md](docs/spec/srs-rationale.md): design rationale and the thinking behind decisions.
- [docs/spec/srs-unified.md](docs/spec/srs-unified.md): specification and rationale interleaved, for a single-pass read.
- [docs/spec/srs-glossary.md](docs/spec/srs-glossary.md): the terms the specification defines.
- [docs/schema/2.0/](docs/schema/2.0/): the JSON Schemas for SRS data structures.

## The SemanticOps projects

Four projects share one standard. The [projects page](https://semanticops.com/projects/) on semanticops.com describes each in full.

| Project | Kind | What it is |
|---|---|---|
| [srs](https://github.com/the-greenman/srs) (this repository) | Open standard | The specification, authored as its own data. |
| [srs-rust](https://github.com/the-greenman/srs-rust) | Reference engine | One core behind a CLI, WebAssembly bindings and an MCP server. |
| [srs-web](https://github.com/the-greenman/srs-web) | Browser editor | Edit SRS repositories entirely client-side, on storage you own. |
| [srs-vscode](https://github.com/the-greenman/srs-vscode) | VS Code extension | Repositories in your workspace, with views for navigating them. |

The specification is upstream of the others: schema changes here reach them through the release asset described under [Schemas](#schemas).

## Repository layout

```
srs/                  the specification as an SRS repository (records are the source of truth)
  records/            concepts, invariants, extensions, design notes, RFC records and decisions
  package/            field and type definitions used by the repository
  relations/          relation files, one per relation
  manifest.json       repository manifest
docs/                 published at https://srs.semanticops.com
  spec/               rendered specification, rationale, glossary and RFC catalog (generated, do not edit by hand)
  schema/2.0/         JSON Schemas for SRS data structures
  charter/            the decision compass that governs the specification
  strategy/           the strategic map
packages/             base packages (com.semanticops.core, com.mudemocracy.governance)
rfcs/                 RFC proposal artifacts (review material, not live package content)
conformance/          conformance scenarios with fixture repositories
scripts/              tooling for rendering, validating and checking records
tests/                tests for the scripts
srs-usage.md          rules for working with any SRS repository as an agent
```

## RFCs

The specification evolves through numbered RFCs. Proposal artifacts live in [`rfcs/`](rfcs/). RFCs that have been incorporated as records render into [`docs/spec/rfcs/rfc-catalog.md`](docs/spec/rfcs/rfc-catalog.md), the generated and current source of RFC status; the rulings behind them render into [`docs/spec/rfcs/rfc-decision-log.md`](docs/spec/rfcs/rfc-decision-log.md). Prefer them to any hand-maintained list.

Candidate spec changes surfaced by downstream tooling are staged in [`rfcs/mudemocracy-rfc-candidates.md`](rfcs/mudemocracy-rfc-candidates.md) until they are promoted through the `/rfc` process.

## Validating

Run from the repository root:

```bash
node scripts/validate-all.mjs          # validate the spec records and run every declared check
node scripts/check-release-drift.mjs   # verify docs/spec is byte-identical to a fresh render (needs the pinned srs CLI, see below)
srs repo validate --repo srs           # validate the spec repository with the srs CLI
```

The two scripts are separate gates, and both must exit 0. `validate-all.mjs` runs the checks declared in [`scripts/checks.json`](scripts/checks.json); `check-release-drift.mjs` is not part of it.

## Generating the spec

The files under `docs/spec/` are generated from the records. Render them with the `srs` engine from [srs-rust](https://github.com/the-greenman/srs-rust):

```bash
export $(node scripts/fetch-pinned-srs.mjs)   # reads the pinned tag, fetches that release, sets SRS_CLI_PATH
node scripts/publish-spec.mjs                 # renders docs/spec from the records
```

The committed projections correspond to **exactly** the srs-rust release named by `SRS_RUST_CLI_TAG` in [`.github/workflows/release-drift.yml`](.github/workflows/release-drift.yml), not "that release or newer". Both scripts refuse to run with `SRS_CLI_PATH` unset and log the resolved binary's sha256 at startup. Do not use `which srs`: it resolves to whichever build was installed last, and `srs --version` reports the same version for every build, so it cannot tell them apart.

## Authoring

Never edit the generated files in `docs/spec/` directly. To change the specification:

1. Edit the source records under `srs/records/`, through the `srs` CLI or its MCP server rather than by hand.
2. For a new section, place it in its container's entry order and, where the order is a semantic claim, assert a `precedes` relation.
3. Validate: `srs repo validate --repo srs` must report no errors before you commit.
4. Re-render with the pinned CLI (see [Generating the spec](#generating-the-spec)) and commit the record and rendered changes together.

Membership is tree-authoritative: the `records/` and `relations/` trees under `srs/` define what belongs to the repository.

**Spec independence** is the foundational constraint: this repository must remain valid with no Rust or JS implementation present. Do not add content that only makes sense in the context of an implementation.

See [`srs-usage.md`](srs-usage.md) for the rules for agents and [`CLAUDE.md`](CLAUDE.md) for contributor guidance.

## Schemas

The JSON Schemas are committed in [`docs/schema/2.0/`](docs/schema/2.0/) and are canonical. Each is served at `https://srs.semanticops.com/schema/2.0/<name>.json`, and that URL is the schema's `$id`, so it must keep resolving.

[srs-rust](https://github.com/the-greenman/srs-rust) and [srs-vscode](https://github.com/the-greenman/srs-vscode) keep read-only mirrors of this directory. The release workflow publishes it as the `schemas-2.0.tar.gz` asset on every merge to `master`, and each mirror syncs from that asset after the specification change merges. Never edit a mirror by hand, and never sync from a stale local checkout.

## Licence

The SRS specification, JSON schemas, and reference packages are released under the [Apache License 2.0](LICENSE).

Contributions to this repository are made under the terms of the [Developer Certificate of Origin](docs/CONTRIBUTING.md#developer-certificate-of-origin). By submitting a pull request, you certify that you have the right to submit that work under the Apache License 2.0 by signing off your commits with `git commit -s`.
