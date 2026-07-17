> **GitHub issue**: [the-greenman/srs#101](https://github.com/the-greenman/srs/issues/101)

# RFC-017: Decision-log Attachments, Base-package Settings, Archive Determinism, and srsj-gzip Retirement

**Status**: Accepted (Revision 5)
**Affects**: `SourceReference.sourceRole` enum (RFC-023) — new `attaches` value in all four SourceReference-bearing schemas (`record.json`, `note.json`, `typed-record.json`, `relations-collection.json`); `ext:repository` (archive determinism, attachment model, tombstone reference-only state, subdirectory support); `ext:json-store` (retire srsj-gzip); `docs/schema/2.0/source-document-meta.json` (subdirectory contentPath clarification)
**Author**: the-greenman (from issue the-greenman/srs#101)
**Date**: 2026-07-06

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-06 | Initial draft |
| 2 | 2026-07-06 | Resolve Open Question 2. Attachment is modelled as a `SourceReference` (`sourceType: repository-document`, new `sourceRole: "attaches"`), not a `Relation` edge — source documents are not instances, so the `Relation.targetInstanceId` framing was a category error. This dissolves both open questions: no `com.semanticops.srs` v2.1.0 bump and no new canonical Relation type (OQ1), and no `Relation`-shape change (OQ2). Add the tombstone reference-only state: `sourceDocumentIndex` entries persist as durable pointers after content is pruned. Change A, Change G, and R1/R2 rewritten accordingly. |
| 3 | 2026-07-14 | Rebased onto RFC-023 (SourceReference vocabulary disjointness): the field is `sourceRole` (renamed from `relationType`), the base enum is `[evidence, extracted-from, quoted-from, inspired-by]`, and the `attaches` addition now covers **all four** SourceReference-bearing schemas (Rev 2 touched only `record.json` + `relations-collection.json`). Noted invariant I-88 (RFC-023 SourceReference/Relation vocabulary disjointness) is satisfied by `attaches`; the legacy `relationType` alias does not gain `attaches`. Required by RFC-023's cross-RFC coordination section. |
| 4 | 2026-07-17 | Review pass (Spec Integrity + Completeness reviewers): fix Change A to list all four SourceReference-bearing schemas (prose body was not updated when Rev 3 expanded scope); narrow [R6] byte-identity guarantee to within-implementation consistency (the cross-implementation claim contradicted [R5]'s implementation-defined Store/Deflate choice); add gzip magic-byte detection to Change F; upgrade Change E non-blocking-diagnostics emission from SHOULD to MUST; add UUID-assignment note to Change B; define "identical repository content" for [R6]; expand [R7] with explicit trigger conditions; add [R3]/[R4] cross-reference to [R11]; add `manifest.json` to schema changes table; correct Rationale srsj-gzip history; scope [R4] diagnostics clause. |
| 5 | 2026-07-17 | Accepted; spec records authored in `srs/srs` — RFC record `747f61db`, Changes A–G, invariants I-101–I-112. PR #186 merged to master. |

---

## Abstract

This RFC introduces seven normative changes that together define the attachment model for decision-log repositories. It adds an `attaches` value to the `SourceReference.sourceRole` enum so a record can express *material attachment* to a source document (distinct from evidentiary citation), specifies an optional `com.semanticops.base` package that carries attachment-policy settings, establishes that SRS MUST operate with no base package present, strengthens `ext:repository` to require deterministic ZIP archives so `.srs` files are content-hashable, introduces soft size-warning conformance as non-blocking diagnostics, retires gzip-of-srsj from `ext:json-store` (binary content is the archive's job), and clarifies the attachment model — including the *tombstone* reference-only state (an index entry outlives its pruned content) and subdirectory support under `source-documents/`. These changes ship together because the attachment reference, the base package, and the archive format are mutually dependent: you need the reference to link records to files, the policy to govern acceptable attachments, and the archive format to carry binary content portably.

**Attachment is a reference, not an edge.** The attachment link is carried by the record's existing `SourceReference` mechanism (`sourceType: "repository-document"`, `sourceId` = the target's `documentId`), *not* by a `Relation`. A `Relation`'s `targetInstanceId` addresses an instance; a source document is deliberately not an instance (it has a `documentId`, lives under `source-documents/`, and never appears in `instanceIndex`). Modelling attachment as a `SourceReference` avoids that category error and gives two properties this RFC relies on: the reference is minted only through the core import path (so attachments cannot be hand-authored — see Change G), and it is durable independent of content presence (so content may be pruned, or later migrated to an external document store, while the pointer survives — see the tombstone rule).

---

## Motivation

### Problem 1 — No way to express material attachment of a source document

A `SourceReference` with `sourceType: "repository-document"` already links a record to a source document, and its `sourceRole` enum (RFC-023) already distinguishes citation flavours (`evidence`, `extracted-from`, `quoted-from`, `inspired-by`). None of these expresses *material attachment*. A decision record that *includes* a signed PDF as part of its provenance needs to say the PDF is not merely evidence for a claim — it is *attached* to the decision as a material component of the record package. Without an `attaches` value, implementations overload `evidence` or invent ad-hoc links, losing a distinction that has indexing and rendering consequences (a tool listing a decision's "attached files" must separate the attachment package from documents that merely informed it).

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

### Change A — Add `attaches` to the `SourceReference.sourceRole` enum

Add `"attaches"` as a value in the `SourceReference.sourceRole` enum (the field renamed from `relationType` by RFC-023). The enum currently reads `["evidence", "extracted-from", "quoted-from", "inspired-by"]`; it becomes:

```json
"sourceRole": {
  "type": "string",
  "enum": ["evidence", "extracted-from", "quoted-from", "inspired-by", "attaches"]
}
```

This definition appears in **all four SourceReference-bearing schemas** and all MUST be updated identically. Each schema carries its own local `$defs.SourceReference` copy (not a shared `$ref`), so the enum must not fork across them:
- `docs/schema/2.0/record.json` — `SourceReference` on a Record's `sourceRefs[]`.
- `docs/schema/2.0/note.json` — `SourceReference` on a Note's `sourceRefs[]`.
- `docs/schema/2.0/typed-record.json` — `SourceReference` on a TypedRecord's `sourceRefs[]`.
- `docs/schema/2.0/relations-collection.json` — `SourceReference` on a Relation's `sourceRefs[]`.

An **attachment** is a `SourceReference` on a record with `sourceType: "repository-document"`, `sourceId` equal to the target source document's `documentId`, and `sourceRole: "attaches"`:

```json
{
  "sourceType": "repository-document",
  "sourceId": "b7c1e2a4-…",          // documentId in sourceDocumentIndex
  "sourceRole": "attaches"
}
```

This adds no new canonical `Relation` type and no `com.semanticops.srs` package version bump. The `attaches` value lives in the `SourceReference` vocabulary (the closed enum on citations), which is a distinct concept from the canonical `Relation` type vocabulary (`contains`, `depends-on`, `evidences`, …). No `RelationTypeDefinition` is added and no package definition changes, so RFC-005 package immutability is not engaged and no companion package-bump issue is required. The only implementation follow-up is regenerating the schema mirrors and teaching the validator the new enum value plus the tombstone/content-absent handling (Change G).

**Why a `SourceReference`, not a `Relation`.** A `Relation` connects two instances via `targetInstanceId` (a `uuid` resolving in `instanceIndex`). A source document is deliberately not an instance — it carries a `documentId`, lives under `source-documents/`, and is registered in `sourceDocumentIndex`, never in `instanceIndex`. Forcing an attachment into a `Relation` would require either a bogus `targetInstanceId`, a polymorphic target field, or promoting source documents to instances — each a structural distortion. The `SourceReference` mechanism already exists to point a record at a `documentId` and is therefore the honest home for the attachment link. (See *Alternatives Considered → Alt F* for the Rev 1 canonical-relation design and why it was withdrawn.)

**Distinction from `evidence`**: `sourceRole: "evidence"` expresses epistemic support — the source document substantiates a claim in the record. `sourceRole: "attaches"` expresses material attachment — the source document is a component of the record package regardless of evidentiary weight. A signed approval PDF for a governance decision is an attachment (it is part of the decision package); a transcript that informed the decision is evidence. Both may be present on the same record as separate `sourceRefs[]` entries.

**Target constraint**: the `sourceId` of an `attaches` `SourceReference` MUST be a `documentId` present in `sourceDocumentIndex` of the same repository (or discoverable via a `.meta.json` sidecar scan of `sourceDocumentsPath`). Resolution is against the **index entry**, not the content file — an index entry whose content has been pruned still satisfies this constraint (see the tombstone rule in Change G). Cross-repository attachment is not supported in this RFC.

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

Stable UUIDs for the four fields (`allowedMimeTypes`, `maxPerFileBytes`, `maxDocBytes`, `maxTotalBytes`) and the `attachment_policy` type definition MUST be assigned when the `com.semanticops.base` package records are created in the `srs/srs` repository as part of implementing this RFC. Those records are authoritative; implementations MUST NOT mint independent UUID assignments for the canonical `com.semanticops.base` fields and types.

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

A conforming `.srs` archive producer, given identical repository content on repeated invocations, MUST produce an identical byte stream. (Cross-implementation byte identity is not guaranteed because the choice of Deflate vs. Store is implementation-defined per rule 3 above; see [R6].)

### Change E — Soft size-warning conformance

An implementation MAY enforce the limits in `attachment_policy` as hard rejections. If it does not enforce them as hard limits, it MUST surface violations as non-blocking diagnostics (severity: warning) when:

- A source document content file exceeds `maxPerFileBytes` or `maxDocBytes`.
- The aggregate content of all source documents exceeds `maxTotalBytes`.
- An attached file's MIME type is not in `allowedMimeTypes`.

Non-blocking diagnostics MUST NOT prevent the record from being stored or the repository from being exported. They MUST be surfaced in `srs repo validate` output. Whether to emit a warning at the time of a write operation (e.g., `srs source import`) is implementation-defined; conformance is required at validate time. Hard caps are not part of this RFC and are explicitly deferred to a future extension.

### Change F — `ext:json-store` — retire srsj-gzip

The concept of gzip-of-srsj (a gzip-compressed `.srsj` file) is retired. Normative text:

- `.srsj` files MUST be plain UTF-8 JSON, not gzip-compressed.
- An implementation MUST reject a file that is gzip-compressed and claims to be a `.srsj` JSON Store. Detection is by content inspection: a file whose first two bytes are `0x1f 0x8b` MUST be treated as gzip-compressed regardless of its filename or MIME type.
- Binary source-document content is not included in the JSON Store (unchanged from current spec). Implementors requiring binary portability MUST use the `.srs` ZIP archive defined by `ext:repository`.
- This change supersedes issue srs#31.

### Change G — Attachment model clarification

The following normative clarifications apply to the attachment model:

1. **Single-path attachment via `SourceReference`**: a record expresses attachment with exactly one mechanism — a `SourceReference` in its `sourceRefs[]` with `sourceType: "repository-document"`, `sourceId` = the target's `documentId`, and `sourceRole: "attaches"`. There is no separate `Relation` edge for attachment (Rev 1's dual-path model is withdrawn — see Alt F). A record MAY additionally carry a `sourceRole: "evidence"` (or other) `SourceReference` to the same or a different document; attachment and evidence are independent citations that may coexist.

2. **Attachments are managed only through core operations**: because an `attaches` `SourceReference` is valid only when its `sourceId` resolves to a `documentId` in `sourceDocumentIndex`, and index entries are minted by the source-document import path, an attachment cannot be validly hand-authored by inventing a `documentId`. A `SourceReference` with `sourceType: "repository-document"` whose `sourceId` resolves to no index entry (and no sidecar) is non-conformant. This is the mechanism by which attachments "can only be managed through core functionality".

3. **Tombstone — reference-only state**: a `sourceDocumentIndex` entry (the `documentId` pointer) is durable and MAY outlive its content. When a content file at `contentPath` is pruned, the index entry and its sidecar are retained as a *tombstone*: the `documentId` still resolves, the sidecar retains provenance metadata (`contentType`, `title`, `date`, checksum, …), and any `attaches` `SourceReference` targeting it remains conformant. An index entry whose content file is absent is a valid reference-only state — NOT a validation error; an implementation MAY surface an informational (non-blocking) diagnostic noting that content is unavailable, and MUST NOT reject, refuse to load, or refuse to export the repository on that basis. Rationale: internal SRS attachments are transient — a transport mechanism — and a document may later be replaced by a reference to an external document store, or in a federated environment migrate into an addressable retrieval store; the `documentId` pointer must survive all of these transitions. Removing the index entry itself (not merely the content) severs the reference and is a distinct destructive operation outside the scope of this RFC.

4. **Subdirectory support**: `source-documents/` MAY contain subdirectories to any depth. `contentPath` in a `.meta.json` sidecar MAY contain forward-slash-separated path segments (e.g., `audio/meeting-2026-06-15.mp4`). Implementations MUST resolve `contentPath` relative to the `sourceDocumentsPath` root. A sidecar at `source-documents/audio/meeting.meta.json` with `contentPath: "meeting-2026-06-15.mp4"` refers to `source-documents/audio/meeting-2026-06-15.mp4`.

5. **Sidecar co-location**: the sidecar MUST reside in the same directory as the content file it describes. A sidecar at `source-documents/audio/meeting.meta.json` with `contentPath: "../transcripts/meeting.txt"` is non-conformant.

---

## Conformance Rules

> **[R1]** A conformant implementation MUST accept `"attaches"` as a value of `SourceReference.sourceRole`. An attachment is a `SourceReference` with `sourceType: "repository-document"`, `sourceRole: "attaches"`, and `sourceId` equal to a source document's `documentId`. Attachment MUST NOT be modelled as a `Relation` edge; there is no `attaches` canonical `Relation` type.
>
> **[R2]** The `sourceId` of an `attaches` `SourceReference` MUST resolve to a `documentId` present in `sourceDocumentIndex` (or discoverable via a `.meta.json` sidecar scan of `sourceDocumentsPath`) in the same repository. Resolution is against the index/sidecar entry, not the content file. A `sourceId` that resolves to no such entry is non-conformant and MUST be reported with a diagnostic at validation time.
>
> **[R3]** A conformant implementation MUST NOT refuse to load, validate, or export a repository solely because the `com.semanticops.base` package is absent or because no `attachment_policy` record is present.
>
> **[R4]** When no `attachment_policy` record exists, a conformant implementation MUST apply the no-policy defaults: all MIME types accepted, no size limits enforced, no size-or-MIME-type-policy diagnostics emitted.
>
> **[R5]** A conformant archive producer MUST produce deterministic ZIP archives: lexicographically sorted entries, zeroed timestamps, Deflate or Store compression only, empty extra fields, UTF-8 filename flag set.
>
> **[R6]** Given identical repository content, a conformant archive producer MUST produce a byte-for-byte identical `.srs` file across invocations of the same implementation. Cross-implementation byte identity is not guaranteed because [R5] allows the producer to choose between Deflate and Store. For the purposes of this rule, two repositories have identical content if and only if the set of archive entries — identified by their forward-slash-normalised relative paths and byte contents — is identical; filesystem timestamps, permissions, and host metadata are excluded from this definition and MUST NOT influence archive output (see Change D).
>
> **[R7]** A conformant implementation MAY enforce `attachment_policy` limits as hard rejections. If it does not enforce them as hard limits, it MUST emit non-blocking warning diagnostics at `srs repo validate` time when limits are exceeded — specifically: when a source document content file exceeds `maxPerFileBytes` or `maxDocBytes`; when the aggregate byte size of all source document content files exceeds `maxTotalBytes`; or when an attached file's MIME type is not listed in `allowedMimeTypes`.
>
> **[R8]** A conformant implementation MUST reject a gzip-compressed file presented as a `.srsj` JSON Store.
>
> **[R9]** `contentPath` in a source-document sidecar MAY contain forward-slash-separated sub-path segments. A conformant implementation MUST resolve `contentPath` relative to `sourceDocumentsPath`.
>
> **[R10]** A sidecar MUST reside in the same directory as the content file it describes. A `contentPath` that traverses upward (e.g., `../other/file.pdf`) is non-conformant.
>
> **[R11]** At most one `attachment_policy` record of the `com.semanticops.base/repo_settings` type MAY exist per repository. A conformant implementation encountering two or more MUST surface a diagnostic and treat the policy as absent (i.e., apply the no-policy defaults specified in [R3] and [R4]: all MIME types accepted, no size limits enforced, no size-or-MIME-type-policy diagnostics emitted).
>
> **[R12]** A `sourceDocumentIndex` entry whose content file (at `contentPath`) is absent is a valid *tombstone* (reference-only) state. A conformant implementation MUST NOT reject, refuse to load, or refuse to export a repository solely because an indexed source document's content is missing, and an `attaches` `SourceReference` targeting a tombstoned `documentId` remains conformant under [R2]. An implementation MAY surface an informational (non-blocking) diagnostic that the content is unavailable.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/record.json` | Add `"attaches"` to the `SourceReference.sourceRole` enum (Change A). |
| `docs/schema/2.0/note.json` | same — all four SourceReference-bearing schemas carry the identical `$defs.SourceReference` (RFC-023); the enum must not fork across them |
| `docs/schema/2.0/typed-record.json` | same |
| `docs/schema/2.0/relations-collection.json` | same (Relations also carry `sourceRefs[]`) |
| `docs/schema/2.0/source-document-meta.json` | Update `contentPath` description to explicitly permit forward-slash-separated sub-path segments (Change G). Suggested wording: "Relative path from sourceDocumentsPath to the document file. May contain forward-slash-separated sub-path segments (e.g., `audio/meeting.mp4`); MUST be resolved relative to sourceDocumentsPath." |
| `docs/schema/2.0/manifest.json` | Add a `description` to `SourceDocumentIndexEntry.contentPath` (currently `"type": "string"` with no description). Use the same wording as the `source-document-meta.json` update above, since both fields represent the same path concept and validators consult the manifest index entry first (Change G). |

No other files in `docs/schema/2.0/` require changes:
- The deprecated legacy `relationType` alias retained by RFC-023's migration window does **not** gain `attaches` — `attaches` never existed as a legacy value, and writers emit `sourceRole` only (RFC-023 R1).
- No `Relation` shape changes: attachment is a `SourceReference`, not a `Relation` edge, so `relations-collection.json`'s `Relation` def and `record.json`'s structure are otherwise untouched (only the shared `SourceReference.sourceRole` enum grows).
- No `relation-type.json` change and no new `RelationTypeDefinition`: `attaches` is a `SourceReference.sourceRole` value, not a canonical `Relation` type.
- Archive determinism (Change D) is a conformance rule on existing ZIP production, not a data-structure addition.
- The tombstone state (Change G / [R12]) reuses the existing `SourceDocumentIndexEntry` shape (`contentPath` remains required and points at the now-absent file); content-absence is a conformance stance, not a schema field.
- The `attachment_policy` type is defined using the SRS field/type model, not as a raw JSON schema in `docs/schema/2.0/`.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**Attachment is a `SourceReference`, not a `Relation`**: A `Relation` connects two instances (`targetInstanceId` resolves in `instanceIndex`); a source document is not an instance. The `SourceReference` mechanism already exists precisely to link a record to a source document by `documentId`, so it is the honest home for the attachment link — no polymorphic target, no bogus `targetInstanceId`, no promotion of source documents to instances. It also gives two properties this RFC depends on: the reference is minted only through the core import path (attachments cannot be hand-authored), and it is durable independent of content presence (the tombstone rule). The cost is that attachments are queried through `sourceRefs`, not through relation-graph traversal — an acceptable trade because the `SourceReference` is the intended link and the relation graph is reserved for instance-to-instance edges.

**`attaches` as a distinct value from `evidence`**: Overloading `evidence` would lose the distinction between epistemic support and material attachment. A tool rendering a decision's "attached files" list must distinguish between PDFs that are part of the record package and transcripts that informed it. The distinction has indexing and UI consequences that cannot be recovered from a single overloaded value. Adding `"attaches"` to the existing closed `sourceRole` enum is a backward-compatible additive change whose only ripple is the four SourceReference-bearing schemas and their mirrors. It satisfies invariant I-88 (RFC-023 disjointness): `attaches` collides with no canonical or installed `RelationTypeDefinition` key.

**Tombstone / reference-only state**: The `documentId` pointer is the durable spine; the content file is a prunable leaf. Keeping the index entry after content removal preserves two things at once — the reference survives (a citation can outlive a large file that was pruned, replaced by an external-store reference, or migrated into a federated retrieval store), and validation stays crisp (an attachment must resolve to an *indexed* `documentId`, so a legitimately-pruned attachment is distinguishable from a hand-fabricated dangling one, which resolves to nothing). Removing the index entry rather than merely the content is the only way to sever a reference, and is deliberately a separate, out-of-scope destructive operation.

**Optional base package, not mandatory settings type**: Making attachment policy a required part of the core model would force all repositories — including those that never use attachments — to carry a settings record. An optional package keeps the core model minimal and ensures SRS continues to work with no configuration layer.

**No-base-package invariant is explicit**: Without an explicit invariant, implementations may interpret absence as misconfiguration. The invariant is necessary because SRS's design goal is repositories that work out of the box with only the core package.

**Deterministic ZIP rather than content-addressed format**: Content-addressing (e.g., packing files by hash name) would require consumers to maintain a name→content mapping. Standard ZIP with deterministic entry ordering and zeroed metadata achieves the same reproducibility property while remaining compatible with all existing ZIP tooling.

**Sort order includes manifest.json**: Alphabetic sorting without exceptions means any file can be located by binary search over the central directory. Exceptions for `manifest.json` (e.g., "must come first") would require special-casing in producers and consumers.

**Soft warnings, not hard caps**: Hard size caps at the spec level would set arbitrary limits that may not suit all use cases (e.g., video-heavy documentary repositories). The spec establishes the warning mechanism and defers cap enforcement to the application layer or a future hard-cap extension.

**srsj-gzip retirement**: Gzip-of-srsj was never formally specified; `ext:json-store` has always defined `.srsj` as "a pretty-printed UTF-8 JSON object" with no gzip variant in the spec record. Change F codifies explicit rejection of gzip-compressed input presented as `.srsj`, superseding the informal practice tracked in srs#31. No migration path is required because no conformant implementation ever accepted gzip `.srsj` files. The deterministic `.srs` archive now fulfils any transport-compression need with the added benefit of including binary source-document content (which `.srsj` explicitly excludes). Maintaining a gzip wrapper over `.srsj` would require implementations to detect and remove it, adding format-confusion surface for no remaining benefit.

**Sidecar co-location rule**: Requiring the sidecar to reside in the same directory as its content file ensures that `source-documents/` subtrees are self-contained. A subtree at `source-documents/audio/` with its own sidecars can be moved or exported without path correction. Cross-directory `contentPath` would make the sidecar dependent on the parent directory's state.

---

## Alternatives Considered

### Alt A — Add `attaches` as a dedicated field on the Record shape

A `Record.attachments[]` field carrying `documentId` references was considered. Rejected: it would require a new field on `record.json` and would introduce a second record→document linking mechanism alongside the existing `sourceRefs[]`. Reusing `sourceRefs` with a new `sourceRole` value achieves the same intent with no new field and no divergence in how records reference source documents.

### Alt B — A mandatory `attachment_policy` type in the core package

Making `attachment_policy` part of `com.semanticops.srs` with default values applied when the record is absent was considered. Rejected: the core package already has no opinion about policy; adding a policy type makes the core package concern-coupled to the application layer. Optional packages are the correct mechanism for capability-specific configuration.

### Alt C — Hard archive format: content-addressed tarball

Replacing ZIP with a deterministic tarball (e.g., tar + sorted entries + zero timestamps) was considered. Rejected: ZIP is universal; every platform and every browser can read a `.srs` ZIP without additional tooling. Tar requires platform support that is less universal. The determinism properties required by this RFC are achievable within ZIP without switching formats.

### Alt D — Per-archive size limit rather than per-file and aggregate

A single aggregate cap would not surface the case where a single large file degrades performance even when total size is acceptable. Separate per-file and aggregate limits give implementations more precise diagnostic signals.

### Alt E — Rename srsj-gzip to a first-class compressed format

Defining a `.srsjz` format (gzip of srsj, with a declared MIME type and magic number) was considered. Rejected: the same transport goal is met by the `.srs` archive, which is already defined and now required to be deterministic. Adding a second compressed format forks the ecosystem.

### Alt F — `attaches` as a canonical `Relation` type (the Rev 1 design, withdrawn)

Rev 1 defined `attaches` as a new canonical `Relation` type in `com.semanticops.srs` (v2.0.0 → v2.1.0), with the record as `sourceInstanceId` and the source document as target. This foundered on Open Question 2: a `Relation` addresses its target via `targetInstanceId`, but a source document is not an instance and has no `instanceId`. The three sub-options considered were **(a)** extend the `Relation` shape with an optional `targetDocumentId` (makes the most-traversed edge polymorphic; a real one-time cost across every relation consumer); **(b)** promote attachment-target source documents to Tier 1 instances in `instanceIndex` (gives one artifact two identities — `documentId` and `instanceId` — and drags raw files into discovery/views/lifecycle); **(c)** carry the `documentId` in the relation's untyped `meta` bag while `targetInstanceId` holds a placeholder (leaves the real target unvalidatable). All three are workarounds for the same category error. Rev 2 withdraws the canonical-relation approach entirely: attachment is a `SourceReference`, which already models record→document by `documentId`, needs no `Relation`-shape change, and — because the reference is minted through the core import path and survives content pruning — directly delivers the "managed only through core" and durable-pointer properties the owner requires. The `attaches` value therefore lives in the `SourceReference.sourceRole` enum, not the canonical `Relation` vocabulary.

---

## Open Questions

1. **Package version tag for `com.semanticops.srs` v2.1.0** — ✅ **RESOLVED (Rev 2): moot.** No package version bump is required. `attaches` is a `SourceReference.sourceRole` enum value in the JSON Schemas, not a `RelationTypeDefinition` in the `com.semanticops.srs` package, so RFC-005 package immutability is not engaged and there is no companion package-bump issue.

2. **`attaches` target identity — `documentId` vs. `instanceId`** — ✅ **RESOLVED (Rev 2).** Attachment is modelled as a `SourceReference` (`sourceType: "repository-document"`, `sourceId` = `documentId`, `sourceRole: "attaches"`), not a `Relation`. Because a `SourceReference` already addresses a source document by `documentId`, the `Relation.targetInstanceId` mismatch disappears — no `Relation`-shape change, no instance promotion, no `meta`-bag workaround. See Change A, Alt F, and [R1]/[R2]. Sub-options (a)/(b)/(c) from Rev 1 are all withdrawn.
