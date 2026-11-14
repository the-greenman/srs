# Staged schema for RFC-006 Revision 9 (dataModelRevision 12)

`lifecycle.json` is the `docs/schema/2.0/lifecycle.json` replacement that RFC-006 Revision 9 requires (srs-programme decision 7324ac6f; the-greenman/srs#1025). The only change is `$defs.LifecycleState.required`, now `id`, `version`, `namespace`, `key`, plus its description. It is **staged, not live**: nothing in `validate-all`, the closure tests, `release.yml` or the schema mirrors reads this directory.

## Promotion (phase 2, the-greenman/srs#1027, after srs-rust ships revision 12)

1. Compare the staged file with the live one; carry across anything that changed outside this edit.
2. Copy it into `docs/schema/2.0/` and delete this directory.
3. Update `scripts/gen-metamodel-package.mjs` if the `LifecycleState` metamodel Type lists its fields as optional, regenerate `srs/package/metamodel/**`, and cover the change in the closure tests.
4. Advance `SRS_RUST_CLI_TAG` to a build with srs-rust#1638, run the `rfc006-lifecycle-state-identity` registry migration on `srs/srs` and the fixtures ([S2]: `version` 1, `namespace` of the owner, `id` = UUIDv5(owner id, state key)), add `dataModelRevision` 12 to the `manifest.json` and `srsj-envelope.json` descriptions, re-render, and run both gates.
