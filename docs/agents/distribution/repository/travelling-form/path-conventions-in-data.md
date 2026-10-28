# Path conventions in `data`

> Keys in data follow the same relative-path conventions as ext:repository:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

Keys in `data` follow the same relative-path conventions as `ext:repository`:

- `package/package.json` — package index
- `package/fields/<filename>.json` — field definitions
- `package/types/<filename>.json` — type definitions
- `package/views/<filename>.json` — view definitions
- `records/<subfolder>/<filename>.json` — Tier 2 Record instances
- `notes/<filename>.json` — Tier 0 Note instances
- `relations/<filename>.json` — relation collections

There is no `instanceIndex` in `manifest`; it is retired (RFC-038 [R2]). The authoritative list of members is the `data` object's own contents — the tree-authoritative store, enumerated the same way as a filesystem repository (RFC-038 [R1]).
