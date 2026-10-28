# Changelog

> Removed surface (historical, introduced by RFC-018, srs#141): the ChangelogCollection/ChangelogEntry schema (changelog.json); the srs changelog list CLI command.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:changelog

**Content**: **Status: Dormant** (removed under `rfc-decision-2a1e1590`, 2026-08-21). The 2026-08-21 usage attestation found zero `changelog/changelog.json` files anywhere in the corpus: the mechanism was speculative, never exercised in production. It is removed under the dormancy rule (`rfc-decision-cce3c00e`) alongside the per-field Revision sidecar mechanism it paired with, removed by the same ruling.

**Removed surface** (historical, introduced by RFC-018, srs#141): the `ChangelogCollection`/`ChangelogEntry` schema (`changelog.json`); the `srs changelog list` CLI command. `manifest.changelogPath` is deprecated, not deleted, so existing declarations remain readable.

**Return trigger**: a consumer needs transition history or field-level audit — anticipated first claimant is the muDemocracy Decision Log governance audit surface. When a real consumer's requirements are known, the mechanism is redesigned against them, not reinstated as specified here.

**Status**: dormant
