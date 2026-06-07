# Spec Release Workflow

This document describes how to keep all release artifacts in sync after making
changes to spec records, schemas, or rendered documents.

## Why this matters

Three repos consume the spec:

| Repo | Artifacts that drift |
|---|---|
| `srs` | Rendered docs in `docs/spec/` |
| `srs-rust` | JSON schemas in `crates/srs-schema/schemas/2.0/` + `SHA256SUMS` |
| `srs-vscode` | JSON schemas in `schemas/2.0/` |

CI checks in all three repos fail if these artifacts are stale. Because the
repos are independent git repositories, keeping them in sync requires committing
the updated artifacts in each repo after a spec change.

## When to run the alignment workflow

Run this whenever you change:
- Spec records (`srs/srs/records/`)
- Package definitions (`srs/package/` — fields, types, views)
- JSON schemas (`srs/docs/schema/2.0/`)
- Anything that affects rendered document output

## Running the workflow

From the `srs/` repo root:

```bash
node scripts/align-spec.mjs
```

The script runs five steps:

1. **Validate** — runs `validate-all.mjs` and `srs repo validate`
2. **Render** — re-renders all document views to `docs/spec/`
3. **Sync schemas** — copies schemas from `docs/schema/2.0/` into
   `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`,
   then regenerates `SHA256SUMS`
4. **Verify** — runs `check-release-drift.mjs` to confirm all drift checks pass
5. **Report** — prints which files changed in each repo and the exact commit
   commands to run

If any step fails the script exits non-zero with an error message pointing at
the problem.

## After the script succeeds

Commit the reported changes in each repo. The script prints the exact commands,
but the pattern is:

```bash
# srs (rendered docs + any schema copies committed in this repo)
cd /path/to/srs
git add docs/spec/ docs/schema/
git commit -m "chore: sync release artifacts"

# srs-rust (schema mirror + SHA256SUMS)
cd /path/to/srs-rust
git add crates/srs-schema/schemas/
git commit -m "chore: sync schemas from spec"

# srs-vscode (schema mirror)
cd /path/to/srs-vscode
git add schemas/
git commit -m "chore: sync schemas from spec"
```

## Ordering PRs to avoid red checks

The `srs` release-drift CI checks out the *current HEAD* of `srs-rust` and
`srs-vscode`. If you land spec changes in `srs` before the schema updates land
in the other repos, the drift checks will be red until all three are merged.

**Recommended order:**

1. Merge the `srs-rust` schema PR
2. Merge the `srs-vscode` schema PR
3. Then merge the `srs` spec PR (drift checks now pass against the updated heads)

If you need to develop across all three repos simultaneously, you can use draft
PRs and merge them in this order once all are ready.

## Sidestepping the sync entirely

If you are only changing spec *prose* (record field values, subsection text,
rationale notes) without touching schemas or adding/removing types, only step 2
(render) produces changes. In that case only the `srs` repo needs a commit —
the Rust and VS Code schema mirrors are unchanged.

Running `align-spec.mjs` handles this correctly: it will report nothing to
commit in `srs-rust` and `srs-vscode` if the schemas are already identical.

## Manual steps (if the script cannot run)

If the `srs` CLI binary is unavailable, follow these steps manually:

1. **Validate packages** — `node scripts/validate-all.mjs`
2. **Render docs** — `srs render document-view --view <id> --output <path>` for each view in `scripts/align-spec.mjs`'s `VIEW_EXPORTS`
3. **Sync schemas** — `node -e "require('./scripts/align-spec.mjs')"` is not possible without the CLI; instead copy `docs/schema/2.0/*.json` into both schema directories manually
4. **Regenerate checksums** — from `srs-rust/crates/srs-schema/schemas/2.0/`, run `sha256sum *.json | sort > SHA256SUMS`
5. **Verify** — `node scripts/check-release-drift.mjs`

## Reference

- `scripts/align-spec.mjs` — the alignment script
- `scripts/check-release-drift.mjs` — read-only drift verifier (used by CI)
- `scripts/publish-spec.mjs` — older sync script; `align-spec.mjs` supersedes it for interactive use
- `srs/.github/workflows/release-drift.yml` — CI workflow that runs the drift check
- `srs-rust/.github/workflows/schema-drift.yml` — schema-only drift check in srs-rust CI
- `srs-vscode/.github/workflows/schema-drift.yml` — schema-only drift check in srs-vscode CI
