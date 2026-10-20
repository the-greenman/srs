# Staged schemas for RFC-051 (dataModelRevision 11)

These files are the `docs/schema/2.0/` replacements that RFC-051 (the-greenman/srs#940, accepted 2026-10-20) requires. They build on RFC-052's staged files (`docs/schema/staged/rfc-052/`), taken at `9ce755a`. They are **staged, not live**: nothing in `validate-all`, the closure tests, `release.yml` or the schema mirrors reads this directory.

- `stored-container-entry.json` is **new**: one entry file of a stored Container.
- `container.json`: the description now covers the head; the definition is unchanged.
- `manifest.json` and `srsj-envelope.json`: the `dataModelRevision` description gains revision 11.

## Promotion (after RFC-052's promotion, in the revision-11 corpus-migration PR)

1. RFC-052's promotion (`docs/schema/staged/rfc-052/README.md`) must already have landed.
2. Compare each staged file with the live one; carry across anything that changed outside RFC-051's edits.
3. Copy these files into `docs/schema/2.0/` and delete this directory.
4. Edit `scripts/gen-metamodel-package.mjs`: add a new `stored-container-entry` Type with Fields `container_id`, `instance_id`, `parent` and `key`. The existing `container-entry` Type is the logical `{instanceId, depth}` and stays. Regenerate `srs/package/metamodel/**`, add a `generation-ledger.md` row, and cover the new schema in the closure tests.
5. Advance `SRS_RUST_CLI_TAG` to a build with srs-rust#1414, run the `rfc051-container-entries` registry migration on `srs/srs` and the fixtures, update the three `srs` scripts that read container files (RFC-051 Change F), re-render, and run both gates.
