# Repository layout

> A conforming repository has the following root structure:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

A conforming repository has the following root structure:

Example: the repository root layout.

The `.srs` marker is a directory that identifies the repository root. It `SHOULD` contain at least one regular file — by convention `.srs/README.md`, an *About SRS* orientation document — so it survives storage and archive round-trips that do not preserve empty directories; its contents are implementation-private and carry no normative weight. A reader must locate the marker before treating a directory as a repository.

Only `manifest.json` and `.srs` are required at root. Other folders are created as content is added. Implementations may add folders for application-local purposes; folder names defined by this extension are reserved.

Reserved content folders may contain implementation-defined subfolders. For example, a repository may store Tier 2 instances under `records/decisions/`, `records/articles/`, or `records/roles/` so long as every instance remains listed in `RepositoryManifest.instanceIndex` with its full relative path.

**Folder responsibilities:**

| Folder | Contents | Required when |
|---|---|---|
| `source-documents/` | Raw source files with `.meta.json` sidecars | Source documents are present |
| `notes/` | `Note` instance files (Tier 0) | Notes are present |
| `records/` | `Record` instance files (Tier 2) | Records are present |
| `relations/` | `Relation` record files | Relations are present |
| `package/` | Local `Package` and definition source files | Local definitions are present |

## The repository root layout

The directories a conforming repository has at its root:

```
<repository-root>/
  .srs/                          ← required marker directory
  manifest.json                  ← required: root manifest and instance index
  source-documents/              ← raw source material with sidecar metadata
  notes/                         ← Tier 0 Note instances
  records/                       ← Tier 2 Record instances
  relations/                     ← Relation records
  package/                       ← local Package, field, type, and view definitions
```


## File naming

Instance files may be named by the implementation. The authoritative identifier (`instanceId`, `relationId`, `documentId`) is stored inside the file; it is not derived from the filename.

Recommended convention: `<human-readable-slug>.json`. Where uniqueness within a folder cannot be guaranteed, `<slug>-<first-8-chars-of-uuid>.json` is recommended.
