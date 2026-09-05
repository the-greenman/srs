# `.srs/` — the repository marker

The presence of this **directory** is what makes the parent an SRS repository.
`manifest.json` alone does not: a tool detects a repository by finding `.srs/`
beside it.

This file exists because a directory containing no regular file does not
survive git, `archive pack`/`unpack`, or most copy paths — it round-trips as
absent, and the repository silently stops being one. The placeholder is the
marker's durability; its filename is not authoritative and nothing should read
it.

Same remedy as `docs/spec/examples/gallery-project-v2/.srs/README.md`, and the
same reasoning as `check-gallery-conformance.mjs`.
