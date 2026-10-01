# Staged schemas for RFC-043 (dataModelRevision 8)

These nine files are the complete `docs/schema/2.0/` replacements that RFC-043
(the-greenman/srs#849, accepted 2026-10-01) requires. They are **staged, not live**: nothing in
`validate-all`, the closure tests, `release.yml` (which publishes `docs/schema/2.0/` only) or the
schema mirrors reads this directory. They were taken from `origin/master` at `8ffb21d`.

## Why they are not in `docs/schema/2.0/` yet

They describe the revision-8 shapes (container members as `{instanceId, depth?}` entries, no
`rootInstanceIds`, no `ordering.memberOrder`, `ordering.source`, an optional `containerId` on
`container-subset`). The `srs` corpus is still revision 7, and the CI pins an exact `srs` binary
that cannot load revision 8, so promoting these now would make the whole corpus invalid against
its own schemas. This is the revision-bump choreography (`CLAUDE.md`, "Gates and choreography"):
the spec-side schema change lands with the corpus migration, after srs-rust ships revision 8
(srs-rust#1133).

## Promotion (the corpus-migration PR, under muDemocracy.org#225)

1. Compare each staged file with the live one at the commit being promoted from
   (`diff docs/schema/2.0/<f> docs/schema/staged/rfc-043/<f>`); anything that changed in the live
   file since `8ffb21d` outside RFC-043's edits must be carried across.
2. `cp docs/schema/staged/rfc-043/*.json docs/schema/2.0/` and delete this directory.
3. Edit `scripts/gen-metamodel-package.mjs` (new `member_instance_ids` Field, new
   `container-entry` Type with a new `depth` Field, retire `root_instance_ids` and `member_order`,
   add `source` to `section-ordering`) and regenerate `srs/package/metamodel/**` and the
   `generated-type-reference` records; `rfc-272`, `rfc-541` and `rfc-534` closure tests must pass.
4. Update the `container.json`, `manifest.json`, `composition.json`, `document-view-output.json`
   and `srsj-envelope.json` rows of `generation-ledger.md`.
5. Advance `SRS_RUST_CLI_TAG`, run the registry migration on `srs/srs`, re-render, and run both
   gates. Mirror refresh in srs-rust and srs-vscode follows the release artifact.

`blueprint.json` and `discovery.json` change description text only; `package-manifest.json` and
`package-bundle.json` change the `dataModelRevision` description only.
