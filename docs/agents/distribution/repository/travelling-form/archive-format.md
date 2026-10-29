# Archive format

> An archive is a self-contained, shareable snapshot of a live repository.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

An archive is a self-contained, shareable snapshot of a live repository.

**Format**: ZIP file. Recommended file extension: `.srs`.

**Archive root**: The repository root maps to the ZIP root. `manifest.json` must be at the ZIP root, not inside a subdirectory.

**Self-containment requirements**: A conforming archive must include:
- `manifest.json` and the `.srs` marker
- All instance files referenced in the manifest instance index
- All relation files declared in `relationsPath`
- All source document content files and sidecars referenced by any `SourceReference` within any instance **or Relation** in the archive
- When `PackageRef.mode === "local"`: the full local package

Remote package dependencies (`mode: "remote"`) are declared in `packageRef` and expected pre-installed at the consumer. They are not bundled in the archive.

**Producing an archive:**
1. Verify the manifest instance index is complete and consistent with the filesystem
2. Collect all files per the self-containment requirements above
3. ZIP from the repository root such that `manifest.json` is at the ZIP root
4. Verify the archive contains `manifest.json` at root before publishing

**Consuming an archive:**
1. Unzip to a staging or working location
2. Locate and parse `manifest.json`
3. Read `conformance`; surface any unsupported extensions to the user before proceeding
4. Load all instances via the instance index
5. Load relations from `relationsPath`
6. Resolve `repository-document` source references via `sourceDocumentsPath`

A conforming consumer must not silently discard instances, relations, or source documents present in the archive. Unknown extension content should be preserved and surfaced rather than dropped.

When importing into an existing store, apply the identity-based import rules defined in the next section.
