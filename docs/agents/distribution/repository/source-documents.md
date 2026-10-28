# Source documents

> A SourceDocument records one piece of raw material a Record refers to but does not itself carry: a documentId, a contentPath, and a .meta.json sidecar with its provenance (title, media type, checksum…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

A `SourceDocument` records one piece of raw material a Record refers to but does not itself carry: a `documentId`, a `contentPath`, and a `.meta.json` sidecar with its provenance (title, media type, checksum) and where in a Tier 2 Record's content it was used, via a `SourceAnchor`. It lives under `sourceDocumentsPath` (default `source-documents/`); the sidecar sits in the same directory as its content file, and `contentPath` may name a subdirectory beneath that root but never escape it.

An `attachment_policy` record, at most one per repository, bounds how many of these a single Record may reference and how large each may be; a repository that declares no policy uses the built-in defaults. `RepositoryManifest.sourceDocumentIndex` lists every one by path and checksum (`SourceDocumentIndexEntry`), the same map-versus-tree relationship instance files have: the tree on disk is authoritative, the index is a validated cross-check.

## `SourceDocument`

A raw source document stored within the repository. Source documents are source material — transcripts, recordings, founding documents, email threads — that Records cite via `SourceReference`. They are not SRS instances and do not appear in the instance index.

Example: the `SourceDocument` shape.

Each source document is stored as a content file paired with a metadata sidecar in `source-documents/`:

Example: a source document and its sidecar.

The content file and sidecar share the same filename stem. `contentPath` in the sidecar is the content filename (including extension), making the pair resolvable by scanning for `.meta.json` files without requiring the content extension to be derivable from the `documentId`.

Source documents may themselves be excerpts. This supports manual, one-off chunking for provenance when the underlying source is large, awkward to cite precisely, or not guaranteed to remain immutable. An excerpt is still just a `SourceDocument`: it lives in `source-documents/`, has its own `documentId`, and is cited via `sourceType: "repository-document"` like any other repository-local source.

When `excerpt` is present, the content file is the frozen captured snippet. `excerpt.sourceDocumentId` identifies the repository-local parent source document it was taken from, and `excerpt.anchor` records where it came from using a lightweight locator such as a line range, message ID, timestamp range, or JSON Pointer. `sourceChecksumAtCapture`, when present, records the parent content digest at extraction time to preserve provenance even if the parent source later changes.


## The `SourceDocument` shape

`SourceDocument`, in pseudo-IDL:

```typescript
{
  documentId: UUID

  title?: string
  description?: string

  contentType: string        // MIME type, e.g. "text/plain", "audio/mp4", "application/pdf"
  encoding?: string          // e.g. "utf-8"; meaningful for text content types
  language?: string          // BCP 47 language tag, e.g. "en-GB"
  date?: string              // ISO 8601 date; when the source material itself was produced or recorded

  contentPath: string        // filename of the content file, relative to source-documents/

  processingNote?: string
  // Free-form note about how this document was produced or processed.
  // e.g. "auto-transcribed via speech-to-text; transcript not reviewed"

  excerpt?: {
    sourceDocumentId: UUID         // repository-local parent source document, when this file is an excerpt
    anchor?: SourceAnchor          // where the excerpt came from in the parent source, if known
    capturedAt?: ISO8601           // when the excerpt was extracted
    capturedBy?: string            // who or what extracted it
    sourceChecksumAtCapture?: string
    // optional checksum of the parent source content as it existed when the excerpt was captured
  }

  createdAt: ISO8601
  importedAt?: ISO8601
  meta?: Record<string, unknown>
}
```


## A source document and its sidecar

The content file and its metadata sidecar, sharing one filename stem:

```
source-documents/
  <stem>.<ext>               ← the content file (text, audio, PDF, etc.)
  <stem>.meta.json           ← SourceDocument metadata record (sidecar)
```


## `SourceDocumentIndexEntry`

One entry in the optional `sourceDocumentIndex`.

Example: the `SourceDocumentIndexEntry` shape.

When `sourceDocumentIndex` is present, every entry must correspond to a valid sidecar that satisfies Invariant 52. The index does not replace sidecar resolution; consumers must still parse the sidecar to obtain the full `SourceDocument` record.


## The `SourceDocumentIndexEntry` shape

`SourceDocumentIndexEntry`, in pseudo-IDL:

```typescript
{
  documentId: UUID          // matches SourceDocument.documentId in the sidecar
  sidecarPath: string       // relative path from sourceDocumentsPath to the .meta.json sidecar
  contentPath: string       // relative path from sourceDocumentsPath to the content file
  title?: string            // denormalised for display; not authoritative

  sidecarChecksum?: string  // digest of the .meta.json sidecar: "<algorithm>:<hex>"
  contentChecksum?: string  // digest of the content file: "<algorithm>:<hex>"
}
```
