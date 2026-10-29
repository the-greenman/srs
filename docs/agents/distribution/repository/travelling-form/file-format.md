# File format

> A .srsj file is a pretty-printed UTF-8 JSON object with the following top-level structure:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

A `.srsj` file is a pretty-printed UTF-8 JSON object with the following top-level structure:

Example: the top-level shape of a `.srsj` file.

| Field | Type | Description |
|---|---|---|
| `srsj` | string | Format version. Current value: `"1"`. Implementations must reject files with unrecognised versions. |
| `manifest` | object | The `RepositoryManifest` object as defined by `ext:repository`. There is no `manifest.instanceIndex`; it is retired (RFC-038 [R2]). The `data` object's own contents are the authoritative instance set (RFC-038 [R1]), the root container included: the manifest names it by `rootContainerId`, and it is stored at `containers/<containerId>/` like every other container (RFC-052): a `container.json` head and one `entries/<instanceId>.json` file per member (RFC-051). |
| `data` | object | Flat key-value store. Keys are forward-slash-normalised relative paths as they would appear in a filesystem repository. Values are the parsed JSON content of each file. |

The `.srsj` extension is conventional; an implementation may accept any filename. The extension must not be used as an authoritative indicator of format — implementations must inspect the `srsj` field to confirm the format and version.
