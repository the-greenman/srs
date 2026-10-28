# Conformance requirements

> 1.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

1. A conforming producer must write every instance in the repository's authoritative instance set (RFC-038 [R1]) as an entry in `data` under its path.
2. A conforming producer must write all relation files declared in `manifest.relationsPath` as entries in `data`.
3. A conforming producer must write the local package under `package/package.json` when `packageRef.mode === "local"`.
4. A conforming consumer must reject a `.srsj` file whose `srsj` value is not a recognised version string.
5. A conforming consumer must apply the same identity-based import rules as `ext:repository` when loading a `.srsj` file into an existing store.
6. A conforming implementation must be able to round-trip a repository between the JSON Store format and the filesystem layout without data loss.
