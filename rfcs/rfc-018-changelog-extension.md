> **GitHub issue**: [the-greenman/srs#141](https://github.com/the-greenman/srs/issues/141)

# RFC-018: Repository Changelog Extension (`ext:changelog`)

**Status**: Accepted (Revision 3)
**Affects**: `manifest.json` (new `changelogPath` property); new schema file `changelog.json`; `ext:changelog` extension declaration
**Author**: the-greenman (from issue the-greenman/srs#52)
**Date**: 2026-07-09

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-09 | Initial draft |
| 2 | 2026-07-09 | Address Revision 1 review findings: (a) add initialization paragraph — changelog file MUST be created eagerly on extension declaration, no backfill; (b) make Change D normative, add R9; (c) replace `"noted"` with distinct `"note-created"` / `"note-updated"` / `"note-deleted"` values, removing consumer ambiguity; (d) fix R3 grammar; (e) add JSON Schema `if/then` for `noteId`; (f) strengthen R4 declarative sentence to normative; (g) fix abstract operation list; (h) strengthen R7 SHOULD to MUST; (i) add R5 behavioral note to schema changes table; (j) add Alt D to Alternatives; (k) add manifest.json property snippet; (l) add conformance note to Change D; (m) add R10 locking SHOULD; (n) cross-reference `declaredExtensions`; (o) close Open Question 3 via $schema URL; (p) add UUID4/UUID7 rationale |
| 3 | 2026-07-09 | Implementation started; RFC file committed to branch rfc/018-changelog-extension; schema files added (docs/schema/2.0/changelog.json new, docs/schema/2.0/manifest.json changelogPath added) |

---

## Abstract

SRS repositories have no first-class mechanism to record which entities changed and when. This RFC introduces `ext:changelog`, an opt-in extension that maintains a lightweight, append-only log of entity-level changes. A conformant implementation appends a `ChangelogEntry` on every successful `record create`, `record update`, `record delete`, `note create`, `note update`, and `note delete` operation. The log is queryable by timestamp range and by instance identity, enabling sync tooling and round-trip workflows to operate on precise change sets rather than diffing raw files.

---

## Motivation

### Problem 1 — No way to determine what changed since a sync point

The `repo copy` workflow — editing an `.srsj`, then copying changes back to a file repository — has no safe way to determine which records were actually modified versus which file paths merely changed due to tool behaviour (path rewriting, checksum recalculation). Without a changelog, a caller must diff all files to detect changes, which is fragile and slow. A log answering "what instanceIds are newer than timestamp T?" makes round-trip editing correct and efficient.

This gap is not theoretical: `srs-rust#139` (repo copy path rewriting and silent record loss) exposed it directly. A changelog would have caught the discrepancy at sync time.

### Problem 2 — Sync and replication tooling must rely on git history

Tools that replicate or federate repositories currently depend on git history to determine change sets. This binds SRS sync to a specific VCS backend and makes it impossible to detect changes in non-git stores (in-memory, `.srsj`, embedded databases). A first-class changelog decouples change detection from the storage medium.

### Problem 3 — No normative record of operation provenance

There is no standard way to record *who or what* asserted a change — whether a human operator, an agent, or a specific CLI invocation. This matters for governance repositories where an audit trail is a hard requirement. The changelog provides a natural home for this information without polluting instance records.

---

## Proposed Changes

### Change A — New extension: `ext:changelog`

Introduce a new extension key `ext:changelog`. A repository opts in by declaring `"ext:changelog"` in `manifest.declaredExtensions`. The `declaredExtensions` field is defined in the core manifest spec (`docs/schema/2.0/manifest.json`); this RFC does not alter its definition.

When `ext:changelog` is declared:
- The repository MUST maintain a changelog file at the path given by `manifest.changelogPath` (defaulting to `"changelog/changelog.json"` relative to `manifest.json`).
- A conformant implementation MUST append a `ChangelogEntry` to that file on every successful mutating operation: `record create`, `record update`, `record delete`, `note create`, `note update`, `note delete`.
- The changelog file MUST NOT have entries removed or modified once written.

**Initialization:** When `ext:changelog` is declared (either on repository creation or by adding it to an existing repository's `declaredExtensions`), a conformant implementation MUST create the changelog file at `changelogPath` (containing `{"$schema": "https://srs.semanticops.com/schema/2.0/changelog.json", "entries": []}`) if it does not already exist, as part of the declaration operation, before any subsequent validation is run. Enabling `ext:changelog` on a repository with existing records does NOT backfill historical entries; the changelog is prospective from the point of declaration.

When `ext:changelog` is not declared, the `changelogPath` field MUST be absent and no changelog file is maintained. Implementations MUST NOT silently write changelog files for repositories that have not declared the extension.

### Change B — New field on `manifest.json`: `changelogPath`

Add an optional `changelogPath` string property to the `manifest.json` schema:

| Field | Type | Required when | Description |
|---|---|---|---|
| `changelogPath` | `string` | `ext:changelog` declared | Relative path from `manifest.json` to the changelog collection file. Default: `"changelog/changelog.json"`. |

The property definition to add to `manifest.json` `properties` (alongside existing path fields `relationsPath`, `sourceDocumentsPath`, `federationPath`):

```json
"changelogPath": {
  "type": "string",
  "description": "ext:changelog only. Relative path from manifest.json to the ChangelogCollection file. Default: 'changelog/changelog.json'."
}
```

When `ext:changelog` is declared and `changelogPath` is absent, a conformant implementation MUST treat the path as `"changelog/changelog.json"`.

### Change C — New schema: `changelog.json` (ChangelogCollection)

Introduce `srs/docs/schema/2.0/changelog.json` defining the `ChangelogCollection` shape:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://srs.semanticops.com/schema/2.0/changelog.json",
  "title": "SRS Changelog Collection (ext:changelog)",
  "type": "object",
  "required": ["$schema", "entries"],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string",
      "const": "https://srs.semanticops.com/schema/2.0/changelog.json"
    },
    "entries": {
      "type": "array",
      "items": { "$ref": "#/$defs/ChangelogEntry" }
    }
  },
  "$defs": {
    "ChangelogEntry": {
      "type": "object",
      "required": ["entryId", "instanceId", "changeKind", "timestamp"],
      "additionalProperties": false,
      "if": {
        "properties": { "changeKind": { "enum": ["note-created", "note-updated", "note-deleted"] } }
      },
      "then": {
        "required": ["noteId"]
      },
      "properties": {
        "entryId": {
          "type": "string",
          "format": "uuid",
          "description": "Stable UUID4 for this entry. Immutable once written."
        },
        "instanceId": {
          "type": "string",
          "format": "uuid",
          "description": "The instance affected by this change."
        },
        "changeKind": {
          "type": "string",
          "enum": ["created", "updated", "deleted", "note-created", "note-updated", "note-deleted"],
          "description": "The kind of change. 'created'/'updated'/'deleted' cover record-level operations. 'note-created'/'note-updated'/'note-deleted' cover note-level operations on the instance; noteId is required for these."
        },
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "ISO8601 timestamp when this change was committed by the implementation."
        },
        "assertedBy": {
          "type": "string",
          "description": "Optional. Identifier for the agent, tool, or user that asserted the change. Free-form string; implementations SHOULD use a stable identifier (e.g. CLI process name, agent UUID, user handle)."
        },
        "noteId": {
          "type": "string",
          "format": "uuid",
          "description": "Required when changeKind is 'note-created', 'note-updated', or 'note-deleted'. The UUID of the note affected."
        }
      }
    }
  }
}
```

**Field-level spec for `ChangelogEntry`:**

| Field | Type | Required | Description |
|---|---|---|---|
| `entryId` | UUID4 | yes | Stable, immutable identifier for this log entry. MUST be a freshly-minted UUID4. |
| `instanceId` | UUID | yes | The `instanceId` of the record affected. For deleted records, this is the former `instanceId`. |
| `changeKind` | enum | yes | One of: `created`, `updated`, `deleted`, `note-created`, `note-updated`, `note-deleted`. |
| `timestamp` | date-time | yes | ISO8601 timestamp (UTC preferred). Set by the implementation at write time. |
| `assertedBy` | string | no | Identifier of the asserting agent or user. |
| `noteId` | UUID | required when `changeKind` is a note variant | The UUID of the note affected. MUST be present when `changeKind` is `"note-created"`, `"note-updated"`, or `"note-deleted"`. |

### Change D — CLI command: `srs changelog list` (normative)

Introduce a normative `srs changelog list` command:

```
srs changelog list --repo <path> [--since <iso8601>] [--instance <uuid>]
```

A conformant implementation MUST support:
- `--since <iso8601>`: return only entries with `timestamp >= <iso8601>`.
- `--instance <uuid>`: return only entries where `instanceId == <uuid>`.
- Both filters MAY be combined; when combined, both constraints apply (AND semantics).
- Output MUST follow the standard SRS JSON envelope: `{"ok": true, "command": "changelog list", "payload": {"entries": [...]}}`.

This command is read-only and MUST NOT modify the changelog file.

Implementations that support the `ext:changelog` data contract (R1–R9) but do not expose `srs changelog list` as a CLI command are not fully conformant. The CLI surface is normative because the sync use case (Problem 1) depends on a queryable, standard-envelope interface.

---

## Conformance Rules

> **[R1]** A repository that declares `ext:changelog` in `manifest.declaredExtensions` MUST maintain a `ChangelogCollection` file at the path given by `manifest.changelogPath` (or `"changelog/changelog.json"` when `changelogPath` is absent).

> **[R2]** A conformant implementation MUST append a `ChangelogEntry` to the changelog on every successful `record create`, `record update`, `record delete`, `note create`, `note update`, and `note delete` operation when `ext:changelog` is declared for the target repository.

> **[R3]** All `entryId` values within a single changelog MUST be unique. Implementations MUST NOT write an entry whose `entryId` is already present in the file. Each `entryId` MUST be a freshly-minted UUID4.

> **[R4]** Once written, a `ChangelogEntry` MUST NOT be modified or removed. Implementations MUST treat the changelog as an append-only structure. Implementations MUST NOT accept as valid, produce, or emit a changelog file in which any previously written entry has been modified or removed.

> **[R5]** A repository that does NOT declare `ext:changelog` MUST NOT have a `manifest.changelogPath` field. Implementations MUST NOT write changelog files for repositories that have not declared the extension.

> **[R6]** `ChangelogEntry.timestamp` MUST be a valid ISO8601 date-time string. Implementations SHOULD record the timestamp in UTC.

> **[R7]** When `changeKind` is `"note-created"`, `"note-updated"`, or `"note-deleted"`, the `noteId` field MUST be present and MUST be the UUID of the note affected.

> **[R8]** Validation of a repository declaring `ext:changelog` MUST check: (a) the changelog file exists at `changelogPath`; (b) the file is schema-valid against `changelog.json`; (c) all `entryId` values are unique within the file; (d) every entry with a note-variant `changeKind` has a `noteId` present.

> **[R9]** A conformant implementation MUST expose a `srs changelog list` command that returns `ChangelogEntry` items from the changelog file in standard SRS JSON envelope format, and MUST support `--since` and `--instance` filter flags with the semantics defined in Change D.

> **[R10]** Implementations SHOULD acquire an exclusive write lock on the changelog file before appending an entry, and MUST release the lock immediately after the write completes.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Add optional `changelogPath` string property to root `properties` (see Change B snippet). The R5 absence constraint (no `changelogPath` without `ext:changelog`) is a behavioral rule for conformant tools; it is not expressed as a JSON Schema `if/then` conditional. |
| `docs/schema/2.0/changelog.json` | **New file** — `ChangelogCollection` and `ChangelogEntry` shapes (see Change C) |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**Why an extension, not core?** Most repositories do not need a changelog; making it core would impose file-system overhead and schema requirements on every existing conformant repository. An extension keeps it strictly opt-in. Repositories using `repo copy` or federation workflows can declare it; simple single-user repositories need not.

**Why an append-only flat file rather than per-record sidecars?** A single file at a known path is simple to read atomically, easy to tail, and straightforward to replicate. Per-record sidecars would scatter the log across the filesystem, making "what changed since T?" queries require scanning all instance directories. The flat file trades write concurrency (not a SRS design goal — SRS targets single-writer workflows) for query simplicity.

**Why `instanceId`-centric rather than file-path-centric?** SRS's primary key is `instanceId`. File paths are an implementation detail of `ext:repository`. A log keyed on `instanceId` is portable across storage backends (file repo, `.srsj`, memory store) and survives path changes caused by copy operations.

**Why not a full diff/event-sourcing log?** The goal is answering "what is newer than T?" and "what happened to instance X?" — not replaying the full history of a record. A full diff log (storing before/after field values) would be substantially larger, harder to write atomically, and would constrain the implementation more than warranted by the use case. The current shape is deliberately minimal and can be extended in a future RFC if full diffs are required.

**Why distinct `changeKind` values for note operations (`note-created` / `note-updated` / `note-deleted`) rather than a single `"noted"` value?** A single `"noted"` value would require sync consumers to re-fetch the entire current note collection for an instance on every `noted` entry in order to determine whether a note was added, changed, or deleted. A deleted note that is fetched will produce an error; the consumer cannot distinguish this from a transient error. Three distinct values make all six operations first-class and allow consumers to act precisely — delete the note from their replica on `note-deleted`, upsert it on `note-created` or `note-updated`. This is critical to satisfying Problem 1 (round-trip editing).

**Why UUID4 for `entryId` rather than UUID7?** UUID7 (RFC 9562) encodes a timestamp, which would provide natural sort order for entries. UUID4 is specified here to keep entry identity orthogonal from the `timestamp` field (which records the wall-clock time of the write). The `timestamp` field is already the canonical ordering field; using UUID7 would duplicate that information in the key and couple ID generation to clock quality and monotonicity. UUID4 is a better identity than a temporal key.

**Why no version field on `ChangelogCollection`?** The `$schema` URI (`https://srs.semanticops.com/schema/2.0/changelog.json`) is the version signal. A breaking format change will mint a new schema URL; a reader can detect the format version by checking `$schema`. A separate `version` or `schemaVersion` field would duplicate this signal. Format evolution is handled via the `$schema` URL, not via an in-document version field.

---

## Alternatives Considered

### Alt A — Store changelog entries as SRS records (Tier 2 instances)

Changelog entries could be modelled as records in the `instanceIndex`, using a package-defined `ChangelogEntry` type. This would make the changelog queryable via the standard `record list` machinery.

Rejected because: it creates a circular dependency (the changelog records would themselves generate changelog entries), inflates the `instanceIndex` with operational metadata that is not domain content, and requires a package definition just to opt in to basic audit logging.

### Alt B — One changelog file per record directory

A `changelog.json` sidecar alongside each instance file would keep the log local to the record.

Rejected because: it makes the "since T" query O(N) in the number of records, requires scanning all record directories, and complicates atomic writes. The aggregate pattern is simpler for all known query shapes.

### Alt C — Rely on git history for change detection

Git history already provides a change log for file-based repositories.

Rejected because: it binds SRS change detection to git, breaks for `.srsj` and in-memory stores, requires understanding path-level changes rather than instance-level changes, and does not support `assertedBy` provenance. The changelog extension makes change detection backend-agnostic.

### Alt D — Single `"noted"` value for all note operations

A single `changeKind` value of `"noted"` would cover all three note operations (create, update, delete), keeping the enum smaller.

Rejected because: consumers cannot determine whether a note was created, updated, or deleted from the entry alone. A sync tool receiving a `noted` entry for a `noteId` that no longer exists (note was deleted) would attempt to fetch a non-existent resource. The consumer would be forced to re-diff the entire note collection for every `noted` entry, which is exactly the O(N) scan the changelog was designed to avoid. Distinct values (`note-created`, `note-updated`, `note-deleted`) make the operation first-class and allow precise consumer action.

---

## Open Questions

1. **Changelog size management**: The spec does not define a rotation or truncation policy. Long-lived repositories with high write rates will accumulate large changelog files. A future RFC could define `ext:changelog-rotation` or a `retentionPolicy` field. For now, the changelog is unbounded.
