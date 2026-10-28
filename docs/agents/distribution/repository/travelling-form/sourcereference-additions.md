# `SourceReference` additions

> When ext:repository is declared, SourceReference.sourceType gains the value "repository-document".

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

When `ext:repository` is declared, `SourceReference.sourceType` gains the value `"repository-document"`. A reference with `sourceType: "repository-document"` uses `sourceId` to carry the `SourceDocument.documentId`. The content file is located via the matching sidecar in `sourceDocumentsPath`.

`"external-document"` remains valid for documents that are genuinely external to the repository. `"repository-document"` must be used for documents stored within the same repository.

For standalone transcript and chat repositories, the recommended pattern is:

- store the full export or dump as a `SourceDocument`
- cite it using `sourceType: "repository-document"`
- when exact quoted provenance matters and the parent source may change, capture a repository-local excerpt as its own `SourceDocument` and cite the excerpt instead of the mutable parent
