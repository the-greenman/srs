> **GitHub issue**: [the-greenman/srs#121](https://github.com/the-greenman/srs/issues/121)

# RFC-017: Decision-log Attachments, Base-package Settings, Archive Determinism, and srsj-gzip Retirement

**Status**: Draft (Revision 1)
**Affects**: `com.semanticops.srs` package (new `attaches` relation type); `ext:repository` (archive determinism, attachment model, subdirectory support); `ext:json-store` (retire srsj-gzip); `docs/schema/2.0/source-document-meta.json` (subdirectory contentPath clarification)
**Author**: the-greenman (from issue the-greenman/srs#101)
**Date**: 2026-07-06

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-06 | Initial draft |

---

## Abstract

This RFC introduces seven normative changes that together define the attachment model for decision-log repositories. It adds an `attaches` canonical relation type (record → source-document link), specifies an optional `com.semanticops.base` package that carries attachment-policy settings, establishes that SRS MUST operate with no base package present, strengthens `ext:repository` to require deterministic ZIP archives so `.srs` files are content-hashable, introduces soft size-warning conformance as non-blocking diagnostics, retires gzip-of-srsj from `ext:json-store` (binary content is the archive's job), and clarifies the attachment model including subdirectory support under `source-documents/`. These changes ship together because `attaches`, the base package, and the archive format are mutually dependent: you need the relation type to link records to files, the policy to govern acceptable attachments, and the archive format to carry binary content portably.

---

## Motivation

### Problem 1 — No canonical relation for record → file attachment

`evidences` expresses that a source instance is evidence for a claim. It does not express material attachment. A decision record that *includes* a signed PDF as part of its provenance needs a distinct relation type: the PDF is not merely evidence — it is *attached* to the decision as a material component of the record. Without `attaches`, implementations invent ad-hoc links or overload `evidences`, losing the semantic distinction.

### Problem 2 — No normative home for attachment-policy settings

There is no defined mechanism for a repository to declare which MIME types it accepts, maximum file sizes, or total archive budget. Settings today go into custom fields on ad-hoc record types, with no portability across repositories or implementations.

### Problem 3 — No invariant that base-package absence is safe

An implementation encountering a repository with no `com.semanticops.base` package installed currently has no normative guidance: it may silently fail, refuse to load, or apply unknown defaults. The spec must state that absence is a valid state with known, safe behavior.

### Problem 4 — `.srs` archives are not content-hashable

The current `ext:repository` archive spec allows arbitrary ZIP entry order, live timestamps, and host metadata. Two archives of identical content may produce different byte streams, making content-addressing, deduplication, and reproducible builds impossible.

### Problem 5 — No conformance rule for size limits

There is no normative guidance on what an implementation must do when a source document or archive exceeds practical size limits. Hard caps would break legitimate use cases (e.g., large video recordings); the spec should define soft warnings surfaced as diagnostics, not hard rejections.

### Problem 6 — srsj-gzip creates a dead format branch

`ext:json-store` originally implied a gzip-of-srsj variant for transport efficiency. Binary source-document content (the driver for compression) is now handled by the deterministic `.srs` archive. gzip-of-srsj addresses no remaining use case and adds an implementation surface that serves no user.

### Problem 7 — Subdirectory layout under `source-documents/` is unspecified

The `ext:repository` source-document model is silent on whether `source-documents/` may contain subdirectories (e.g., `source-documents/audio/`, `source-documents/2026/`). Implementations disagree on whether `contentPath` may include a slash.

---

## Proposed Changes

### Change A — Add `attaches` canonical relation type

Add a new `RelationTypeDefinition` to the `com.semanticops.srs` package (version bump: `2.0.0` → `2.1.0`):

```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  "id": "f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "version": 1,
  "key": "attaches",
  "namespace": "com.semanticops.srs",
  "label": "Attaches",
  "description": "Source instance has a file materially attached to it. The target is a source document stored within the same repository. Use when a document is a material component of a decision or record — not merely supporting evidence — and the attachment relationship must survive as an explicit typed edge independent of SourceReference citation.",
  "category": "evidence",
  "canonicalDirection": "source is the record that owns the attachment; target is the source document (identified by documentId)",
  "irreflexive": true,
  "createdAt": "2026-07-06T00:00:00Z"
}
```

**Distinction from `evidences`**: `evidences` expresses epistemic support — the source instance substantiates a claim in the target. `attaches` expresses material attachment — the source document is a component of the record regardless of evidentiary weight. A signed approval PDF for a governance decision is an attachment (it is part of the decision package); a transcript that informed the decision is evidence. Both may be present on the same record.

**Target constraint**: the target of an `attaches` relation MUST be a source document in the same repository (i.e., identified by a `documentId` present in `sourceDocumentIndex` or discoverable via `.meta.json` scan). Cross-repository attachment is not supported.

**Package version-bump strategy**: The `com.semanticops.srs` package is declared at version `2.0.0` in the spec repo's local package. Adding `attaches` is a backward-compatible addition (no existing definitions change). The new package version is `2.1.0`. Because published packages are immutable (RFC-005), the srs-rust bundled core copy must be updated to `2.1.0` in a companion implementation issue. A companion issue is tracked in `the-greenman/srs-rust` to update the bundled package and regenerate schemas.

### Change B — Optional `com.semanticops.base` package with `attachment_policy` type

Define an optional package namespace `com.semanticops.base` that a repository MAY install. Its sole initial content is a `repo_settings` type with an optional `attachment_policy` record.

**`attachment_policy` record shape** (expressed as SRS type fields, not a raw JSON schema):

| Field key | Value type | Description |
|---|---|---|
| `allowedMimeTypes` | `Text` (JSON array of strings) | MIME types accepted as attachments. When absent, all MIME types are permitted. |
| `maxPerFileBytes` | `Number` | Maximum size in bytes for a single attachment file. When absent, no per-file limit. |
| `maxDocBytes` | `Number` | Maximum size in bytes for a single source document content file. When absent, no limit. |
| `maxTotalBytes` | `Number` | Maximum aggregate size in bytes of all source documents in the repository. When absent, no limit. |

At most one `attachment_policy` record of this type may exist per repository. An implementation encountering a second `attachment_policy` record MUST surface a diagnostic and treat the policy as absent.

### Change C — No-base-package invariant

SRS MUST operate with no `com.semanticops.base` package installed and no `attachment_policy` record present. When the base package is absent:

- All MIME types are accepted for attachments.
- No per-file, per-document, or aggregate size limits are enforced.
- No diagnostics are emitted solely due to the absence of the base package.

An implementation MUST NOT refuse to load, validate, or export a repository on the grounds that no base package is present.

### Change D — `ext:repository` deterministic-ZIP clause

Strengthen the archive section of `ext:repository` to require deterministic archive production. A conforming archive producer MUST:

1. **Sort entries by path**: entries MUST appear in the ZIP central directory in byte-lexicographic order of their forward-slash-normalised relative paths. `manifest.json` is not exempt — it sorts alphabetically with all other entries.
2. **Zero local file header timestamps**: the `last mod file time` and `last mod file date` fields in every local file header and central directory entry MUST be set to `0x0000` (DOS time zero = 1980-01-01 00:00:00). No other timestamp fields (e.g. Info-ZIP extended timestamp) may be written.
3. **Use Deflate or Store only**: compression method MUST be 0 (Store) or 8 (Deflate). Methods 1–7 and 9–255 are not permitted. The choice between Store and Deflate is implementation-defined, but it MUST be consistent per file across repeated invocations of the same content (i.e., a producer that uses Deflate for `.json` files must always use Deflate for `.json` files).
4. **Omit host-metadata extra fields**: the `extra` field in each local file header and central directory entry MUST be empty (`0x0000` length). Host-originated extra fields (Info-ZIP, NTFS, Unix, WinZip AES) MUST NOT be written.
5. **UTF-8 filenames**: the general-purpose bit flag byte 11 (Language encoding flag) MUST be set to 1 in all local file headers and central directory entries.

A conforming `.srs` archive produced from identical repository content MUST produce an identical byte stream. Two implementations satisfying these rules, given the same repository content in the same logical order, MUST produce byte-for-byte equal archives.

### Change E — Soft size-warning conformance

An implementation MAY enforce the limits in `attachment_policy` as hard rejections. If it does not enforce them as hard limits, it MUST surface violations as non-blocking diagnostics (severity: warning) when:

- A source document content file exceeds `maxPerFileBytes` or `maxDocBytes`.
- The aggregate content of all source documents exceeds `maxTotalBytes`.
- An attached file's MIME type is not in `allowedMimeTypes`.

Non-blocking diagnostics MUST NOT prevent the record from being stored or the repository from being exported. They SHOULD be surfaced in `srs repo validate` output. Hard caps are not part of this RFC and are explicitly deferred to a future extension.

### Change F — `ext:json-store` — retire srsj-gzip

The concept of gzip-of-srsj (a gzip-compressed `.srsj` file) is retired. Normative text:

- `.srsj` files MUST be plain UTF-8 JSON, not gzip-compressed.
- An implementation MUST reject a file that is gzip-compressed and claims to be a `.srsj` JSON Store.
- Binary source-document content is not included in the JSON Store (unchanged from current spec). Implementors requiring binary portability MUST use the `.srs` ZIP archive defined by `ext:repository`.
- This change supersedes issue srs#31.

### Change G — Attachment model clarification

The following normative clarifications apply to the attachment model:

1. **Dual-path citation**: a decision record cites an attachment in two ways — (a) via `sourceRefs` with `sourceType: "repository-document"` and the `documentId`, which expresses that the document is a source; and (b) via an `attaches` relation from the record to the source document, which expresses material attachment. Both may be present. The `attaches` relation is required only when the material-attachment semantic matters beyond citation provenance.

2. **Subdirectory support**: `source-documents/` MAY contain subdirectories to any depth. `contentPath` in a `.meta.json` sidecar MAY contain forward-slash-separated path segments (e.g., `audio/meeting-2026-06-15.mp4`). Implementations MUST resolve `contentPath` relative to the `sourceDocumentsPath` root. A sidecar at `source-documents/audio/meeting.meta.json` with `contentPath: "meeting-2026-06-15.mp4"` refers to `source-documents/audio/meeting-2026-06-15.mp4`.

3. **Sidecar co-location**: the sidecar MUST reside in the same directory as the content file it describes. A sidecar at `source-documents/audio/meeting.meta.json` with `contentPath: "../transcripts/meeting.txt"` is non-conformant.

---

## Conformance Rules

> **[R1]** A conformant implementation MUST accept `attaches` as a canonical relation type in the `com.semanticops.srs` namespace. An `attaches` relation whose target `instanceId` does not correspond to a source document in the same repository MUST be rejected with a diagnostic at validation time.
>
> **[R2]** The target of an `attaches` relation MUST be identified by a `documentId` present in `sourceDocumentIndex` or discoverable via `.meta.json` sidecar scan within `sourceDocumentsPath`. A target that is a Tier 0, 1, or 2 instance (not a source document) is non-conformant.
>
> **[R3]** A conformant implementation MUST NOT refuse to load, validate, or export a repository solely because the `com.semanticops.base` package is absent or because no `attachment_policy` record is present.
>
> **[R4]** When no `attachment_policy` record exists, a conformant implementation MUST apply the no-policy defaults: all MIME types accepted, no size limits enforced, no size-related diagnostics emitted.
>
> **[R5]** A conformant archive producer MUST produce deterministic ZIP archives: lexicographically sorted entries, zeroed timestamps, Deflate or Store compression only, empty extra fields, UTF-8 filename flag set.
>
> **[R6]** Given identical repository content, a conformant archive producer MUST produce a byte-for-byte identical `.srs` file across invocations and across conformant implementations.
>
> **[R7]** A conformant implementation MAY enforce `attachment_policy` limits as hard rejections. If it does not enforce them as hard limits, it MUST emit non-blocking warning diagnostics at `srs repo validate` time when limits are exceeded.
>
> **[R8]** A conformant implementation MUST reject a gzip-compressed file presented as a `.srsj` JSON Store.
>
> **[R9]** `contentPath` in a source-document sidecar MAY contain forward-slash-separated sub-path segments. A conformant implementation MUST resolve `contentPath` relative to `sourceDocumentsPath`.
>
> **[R10]** A sidecar MUST reside in the same directory as the content file it describes. A `contentPath` that traverses upward (e.g., `../other/file.pdf`) is non-conformant.
>
> **[R11]** At most one `attachment_policy` record of the `com.semanticops.base/repo_settings` type MAY exist per repository. A conformant implementation encountering two or more MUST surface a diagnostic and treat the policy as absent.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/source-document-meta.json` | Update `contentPath` description to explicitly state that forward-slash-separated sub-path segments are permitted and are resolved relative to `sourceDocumentsPath`. |

No other files in `docs/schema/2.0/` require changes:
- `relation-type.json` already covers the `attaches` definition shape.
- Archive determinism (Change D) is a conformance rule on existing ZIP production, not a data structure addition.
- The `attachment_policy` type is defined using the SRS field/type model, not as a raw JSON schema in `docs/schema/2.0/`.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**`attaches` as a distinct type from `evidences`**: Overloading `evidences` would lose the distinction between epistemic support and material attachment. A tool rendering a decision's "attached files" list must distinguish between PDFs that are part of the record package and transcripts that informed it. The distinction has indexing and UI consequences that cannot be recovered from a single overloaded type.

**`attaches` category as `evidence`**: The relation still concerns a source document and its relationship to a record. `evidence` is the closest structural category. A new category (e.g., `attachment`) was considered but rejected — it would require adding a value to the `category` enum in `relation-type.json`, a schema change with wide ripple effects, for a single new type. The `category` field is used for structural grouping in rendering; `attaches` fits the `evidence` group.

**Optional base package, not mandatory settings type**: Making attachment policy a required part of the core model would force all repositories — including those that never use attachments — to carry a settings record. An optional package keeps the core model minimal and ensures SRS continues to work with no configuration layer.

**No-base-package invariant is explicit**: Without an explicit invariant, implementations may interpret absence as misconfiguration. The invariant is necessary because SRS's design goal is repositories that work out of the box with only the core package.

**Deterministic ZIP rather than content-addressed format**: Content-addressing (e.g., packing files by hash name) would require consumers to maintain a name→content mapping. Standard ZIP with deterministic entry ordering and zeroed metadata achieves the same reproducibility property while remaining compatible with all existing ZIP tooling.

**Sort order includes manifest.json**: Alphabetic sorting without exceptions means any file can be located by binary search over the central directory. Exceptions for `manifest.json` (e.g., "must come first") would require special-casing in producers and consumers.

**Soft warnings, not hard caps**: Hard size caps at the spec level would set arbitrary limits that may not suit all use cases (e.g., video-heavy documentary repositories). The spec establishes the warning mechanism and defers cap enforcement to the application layer or a future hard-cap extension.

**srsj-gzip retirement**: The original motivation for gzip-of-srsj was compressing large repositories for transport. The deterministic `.srs` archive now fulfils that role with the added benefit of including binary source-document content (which `.srsj` explicitly excludes). Maintaining gzip-of-srsj requires implementations to detect the compression wrapper and adds surface for format confusion. No implementation currently relies on it.

**Sidecar co-location rule**: Requiring the sidecar to reside in the same directory as its content file ensures that `source-documents/` subtrees are self-contained. A subtree at `source-documents/audio/` with its own sidecars can be moved or exported without path correction. Cross-directory `contentPath` would make the sidecar dependent on the parent directory's state.

---

## Alternatives Considered

### Alt A — Add `attaches` as a field on the Record shape rather than a relation

A `Record.attachments[]` field carrying `documentId` references was considered. Rejected: it would require a schema change to `record.json`, would not be queryable as a typed relation edge, and would deviate from the SRS principle that typed connections between instances are expressed as Relations, not embedded arrays.

### Alt B — A mandatory `attachment_policy` type in the core package

Making `attachment_policy` part of `com.semanticops.srs` with default values applied when the record is absent was considered. Rejected: the core package already has no opinion about policy; adding a policy type makes the core package concern-coupled to the application layer. Optional packages are the correct mechanism for capability-specific configuration.

### Alt C — Hard archive format: content-addressed tarball

Replacing ZIP with a deterministic tarball (e.g., tar + sorted entries + zero timestamps) was considered. Rejected: ZIP is universal; every platform and every browser can read a `.srs` ZIP without additional tooling. Tar requires platform support that is less universal. The determinism properties required by this RFC are achievable within ZIP without switching formats.

### Alt D — Per-archive size limit rather than per-file and aggregate

A single aggregate cap would not surface the case where a single large file degrades performance even when total size is acceptable. Separate per-file and aggregate limits give implementations more precise diagnostic signals.

### Alt E — Rename srsj-gzip to a first-class compressed format

Defining a `.srsjz` format (gzip of srsj, with a declared MIME type and magic number) was considered. Rejected: the same transport goal is met by the `.srs` archive, which is already defined and now required to be deterministic. Adding a second compressed format forks the ecosystem.

---

## Open Questions

1. **Package version tag for `com.semanticops.srs` v2.1.0**: This RFC proposes a minor bump. If the srs-rust team has already issued `2.0.x` patches that are considered `2.0.x`-series-final, a `2.1.0` bump may conflict with their release conventions. Confirm the version tag with the srs-rust maintainer before merging the companion implementation issue. *(Resolution expected during Stage 5 / implementation.)*

2. **`attaches` target identity — `documentId` vs. `instanceId`** ⚠️ **BLOCKING**: The `Relation` shape stores `toInstanceId`. Source documents are not instances — they have `documentId`, not `instanceId`, and do not appear in `instanceIndex`. Options: **(a)** extend the `Relation` shape to accept `toDocumentId` as an alternative target field (targeted data-model extension, changes `record.json` + `relations-collection.json`); **(b)** require source documents that are attachment targets to be registered in `instanceIndex` as Tier 1 TypedRecord instances (promotes the sidecar to a full instance, no schema changes); **(c)** define `attaches` as carrying the `documentId` in `Relation.properties.toDocumentId` rather than `toInstanceId` (no schema change, but semantically awkward). **Waiting for owner input before implementation.**
