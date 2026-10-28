# Interoperability

> A .srsj file is semantically equivalent to the .srs ZIP archive defined by ext:repository, with the following differences:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

A `.srsj` file is semantically equivalent to the `.srs` ZIP archive defined by `ext:repository`, with the following differences:

| | `.srsj` JSON Store | `.srs` ZIP Archive |
|---|---|---|
| Format | Single JSON file | ZIP of directory tree |
| Manifest location | Top-level `manifest` key | `manifest.json` at ZIP root |
| Instance storage | Embedded in `data` object | Individual files in ZIP |
| Source document content | Not included | Included as files |
| Primary use | Tooling, fixtures, snapshots | Sharing, export, long-term storage |
