# Staged schemas for RFC-052 (dataModelRevision 10)

These three files are the `docs/schema/2.0/` replacements that RFC-052 (the-greenman/srs#941, accepted 2026-10-20) requires. They are **staged, not live**: nothing in `validate-all`, the closure tests, `release.yml` or the schema mirrors reads this directory. They were taken from `origin/master` at `4a555c5`.

## Why they are not in `docs/schema/2.0/` yet

They describe the revision-10 manifest: `rootContainerId` replaces the inline `container`, and the root container is stored in `containers/`. The corpus is still revision 9, and the CI pins an `srs` binary that cannot load revision 10. Promoting these now would make the corpus invalid against its own schemas. This is the revision-bump choreography in `CLAUDE.md`: the schema change lands with the corpus migration, after srs-rust ships revision 10 (srs-rust#1417).

## Promotion (the corpus-migration PR)

1. Compare each staged file with the live one at the commit being promoted from. Carry across anything that changed in the live file since `4a555c5` outside RFC-052's edits.
2. `cp docs/schema/staged/rfc-052/*.json docs/schema/2.0/`, then delete this directory.
3. Edit `scripts/gen-metamodel-package.mjs`: add a new `root_container_id` Field, retire the manifest's `container` Field (165) and its assignment. Regenerate `srs/package/metamodel/**` and the `generated-type-reference` records. The `rfc-541` and `rfc-534` closure tests must pass.
4. Update the `manifest.json` and `srsj-envelope.json` rows of `generation-ledger.md`.
5. Advance `SRS_RUST_CLI_TAG`, run the `rfc052-root-container` registry migration on `srs/srs` and the fixtures, update the scripts that read `manifest.container` (RFC-052, What breaks), re-render, and run both gates. Mirror refresh in srs-rust and srs-vscode follows the release artifact.

`container.json` changes description text only: three mentions of `manifest.container`.
