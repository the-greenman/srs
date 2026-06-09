# SRS Agentic Usage Rules

This document governs how AI agents interact with SRS repositories. It applies in any context — whether you are working inside `srs/` (the spec), a project repo, or any other directory that contains a `.srs/` marker.

**The CLI is the only stable interface to SRS data.** Everything else — JSON files, directory layout, `manifest.json` structure — is a storage implementation detail that may change between backends (file, SQL, in-memory). Agent workflows that reach past the CLI are brittle and will break.

---

## 1. Recognising an SRS Repository

A directory is an SRS repository when it contains a `.srs/` marker subdirectory. The presence of `records/`, `manifest.json`, or `package/` alone does not confirm an SRS repo — look for `.srs/`.

When you encounter `.srs/`, stop and orient before doing anything:

```bash
srs repo map --repo <path> --pretty       # counts, relation summary, package info, description
srs repo validate --repo <path> --pretty  # full validation; read diagnostics[] before proceeding
```

Never assume you understand the repo's content from its directory listing.

---

## 2. The CLI-First Rule

**Do not create, edit, or delete SRS JSON files directly.** Use the CLI for all read and write operations.

The only exception is when the CLI cannot yet express the operation — for example, a field or type definition that has no `create` command yet. In that case:
1. Document why the CLI cannot be used.
2. Make the minimal edit required.
3. Immediately run `srs repo validate --repo <path>` and fix every diagnostic before continuing.

This exception is narrow. If a CLI command exists for the operation, use it — even if direct file editing feels faster.

### Why this matters

- Writing a record file without registering it in `manifest.json → instanceIndex` creates a ghost file the system ignores.
- Editing `typeId`, `fieldId`, or `relationId` values by hand bypasses referential integrity checks.
- The file layout (`records/`, `package/`, `relations/`) is a FileStore detail. A future SQL-backed repo has no files; agent code that touches the filesystem directly will not port.

---

## 3. Discovery Ladder

Always run discovery before writing. The ladder is:

```bash
# 1. Orientation — what is this repo, what's in it?
srs repo map --repo <path> --pretty

# 2. What types are available?
srs type list --repo <path> --pretty

# 3. What instances exist? (filter by type as needed)
srs record list --repo <path> --pretty
srs record list --repo <path> --type <namespace/name> --pretty
srs note list --repo <path> --pretty

# 4. Inspect a specific instance
srs record get --repo <path> <instanceId> --pretty
srs note get --repo <path> <instanceId> --pretty

# 5. Inspect a type's field assignments (required before creating a record)
srs type get --repo <path> <typeId> --pretty
srs field list --repo <path> --pretty
```

Do not guess field IDs from filenames. Always resolve them from `srs type get` or `srs field list`. Field IDs are UUIDs — `fieldId` is the authoritative key, not `name`.

### Vocabulary and Lifecycle Discovery

When a repo uses the vocabulary substrate (RFC-006), inspect vocabularies, lifecycles, and terms before writing tagged records or attempting a lifecycle transition:

```bash
# What vocabularies exist in the package?
srs vocabulary list --repo <path> --pretty

# Inspect a vocabulary (including all terms and their status)
srs vocabulary get --repo <path> <vocabularyId> --pretty

# Classify in-use tag keys against an open vocabulary (V10 pre-flight, read-only)
srs vocabulary derive-tag-set --repo <path> <vocabularyId> --pretty

# List all terms across all vocabularies
srs term list --repo <path> --pretty

# Get a single term by ID
srs term get --repo <path> <termId> --pretty

# What lifecycles exist in the package?
srs lifecycle list --repo <path> --pretty

# Inspect a lifecycle (states, transitions, isInitial)
srs lifecycle get --repo <path> <lifecycleId> --pretty
```

A vocabulary in `open` mode accepts any tag key. A vocabulary in `closed` mode only accepts keys that resolve to an active term. Check the vocabulary's `mode` field before tagging records.

### Blueprint Discovery and Schema Projection

When a repo's package declares Blueprints (multi-record document definitions), use the blueprint commands to inspect structure and generate validation schemas:

```bash
# What blueprints exist in the package?
srs blueprint list --repo <path> --pretty

# Inspect a blueprint's declared relation structure
srs blueprint structure --repo <path> <blueprintId> --pretty

# Emit a nested draft-07 JSON Schema for the whole document
# (root type + child collections, each with $ref into definitions)
srs blueprint schema --repo <path> <blueprintId> --pretty

# Compose full layered AI guidance context for a Blueprint
# (blueprint aiGuidance, each root type's aiGuidance + fields in order,
#  structure RelationSpecs, and any targeting Protocol)
srs blueprint brief --repo <path> <blueprintId> --pretty
```

`blueprint schema` composes per-type schemas (via `type schema`) into a single document schema.
Property keys for child collections use lowerCamelCase of the relation type
(e.g. relation type `"section-sequence"` → property key `"sectionSequence"`). Each child
array property carries `x-srs-ordered-by` recording the original relation type string.

`blueprint brief` assembles guidance for AI extraction pipelines. The payload always includes
both a `rendered` markdown string (human/LLM-readable) and all structured fields (`types`,
`structure`, `protocol`, etc.) so callers can use either form. Non-fatal issues (unresolvable
root types, no protocol found) appear in `payload.diagnostics`.

To inspect the JSON Schema for a single type:

```bash
srs type schema --repo <path> <typeId> --pretty
```

The payload is `{ "payload": { "schema": { ... }, "diagnostics": [] } }`. Non-fatal warnings
(unresolvable type references, unparseable cardinality) appear in `payload.diagnostics` rather
than causing a command failure.

---

## 4. Write Workflows

### Creating a Note (Tier 0)

```bash
srs note create --repo <path> <<'EOF'
{
  "instanceId": "<new-uuid4>",
  "title": "My Note",
  "sections": [
    { "name": "body", "content": "Content here.", "label": "Body" }
  ],
  "tags": [],
  "createdAt": "<iso8601>"
}
EOF
```

### Creating a Record (Tier 2)

First resolve the type's field IDs:

```bash
srs type get --repo <path> <typeId> --pretty
# read fieldAssignments[].fieldId for each field you need to populate
```

Then create:

```bash
srs record create --repo <path> --type <namespace/name> <<'EOF'
{
  "fieldValues": [
    { "fieldId": "<uuid>", "value": "<value>" },
    ...
  ]
}
EOF
```

### Updating a Record

Fetch the current state first, then send only the fields you are changing:

```bash
srs record get --repo <path> <instanceId> --pretty
srs record update --repo <path> <instanceId> <<'EOF'
{
  "fieldValues": [
    { "fieldId": "<uuid>", "value": "<new-value>" }
  ]
}
EOF
```

### Validating a Record Before Saving (preflight)

Use `record validate` to check a record input **without persisting it**. This is the preflight for multi-record editors that save several records in a loop and want to confirm the whole document is valid before writing any of it. The input is self-contained — it carries its own `typeId`/`typeVersion`, so no record needs to exist yet:

```bash
srs record validate --repo <path> <<'EOF'
{
  "typeId": "<uuid>",
  "typeVersion": 1,
  "fieldValues": [
    { "fieldId": "<uuid>", "value": "<value>" }
  ]
}
EOF
```

`payload.ok` is `true` with an empty `payload.errors` when the input is valid; otherwise the envelope is `"ok": false` and **every** problem is listed in the top-level `diagnostics` — `validate` reports all violations at once (missing required fields, unknown fields, cardinality), so you can fix the whole input in one pass rather than one-error-at-a-time. Nothing is written either way (the command runs and exits 0 regardless of validity — check `payload.ok`/`diagnostics`, not the exit code).

`record validate` runs **exactly the same validation** that `record create` / `record update` run before they persist — unknown fields, missing required fields, and repeatable/field-group cardinality. A passing `validate` therefore guarantees a passing write. (It does not add stricter checks such as enum or value-type conformance; those are not validated on the write path either.)

### Asserting a Relation

```bash
srs relation create --repo <path> <<'EOF'
{
  "relationId": "<new-uuid4>",
  "relationType": "depends-on",
  "sourceInstanceId": "<uuid>",
  "targetInstanceId": "<uuid>",
  "createdAt": "<iso8601>"
}
EOF
```

Canonical relation types: `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`.

Relations are semantic claims, not ownership. Asserting a relation does not change lifecycle state on either endpoint.

### Creating a Vocabulary (RFC-006)

Pipe a Vocabulary JSON object to `srs vocabulary create`. The CLI assigns a UUID if `id` is empty:

```bash
srs vocabulary create --repo <path> <<'EOF'
{
  "id": "",
  "version": 1,
  "namespace": "com.example",
  "name": "my-vocabulary",
  "mode": "open",
  "terms": []
}
EOF
```

`mode` is either `open` (any tag key accepted) or `closed` (only active terms accepted). Start with `open`; promote to `closed` once the term set is stable.

You may include an initial `terms` array; the service assigns UUIDs to any term missing one. The example above starts with `"terms": []` and adds terms incrementally via `vocabulary term-create`.

### Adding a Term to a Vocabulary (RFC-006)

Use `vocabulary term-create` with the vocabulary's ID and pipe a Term JSON object. The CLI appends the term to the vocabulary file and returns both the term and the updated vocabulary:

```bash
srs vocabulary term-create --repo <path> --vocabulary-id <vocabularyId> <<'EOF'
{
  "id": "",
  "version": 1,
  "namespace": "com.example",
  "key": "my-key",
  "label": "My Key"
}
EOF
```

`key` must be unique within the vocabulary (no other active term may share the same key or alias). `status` may be omitted; absent status is treated as `active` by all resolution rules (V1, V6, V10).

### Inspecting the Tag Set Before Promotion (RFC-006 V10)

Run `vocabulary derive-tag-set` to see, without writing anything, how every in-use tag key would be classified if the vocabulary were closed. This is the explicit, read-only form of the V10 pre-flight that `promote` runs implicitly:

```bash
srs vocabulary derive-tag-set --repo <path> <vocabularyId>
```

The response carries the resolved `payload.vocabulary` and a sorted `payload.entries` array. Each entry has `key`, `usageCount`, and a `classification`:

- `used-and-active` — the key resolves to an active term; fine after promotion.
- `read-only-after-close` — the key resolves to a deprecated or tombstone term; existing reads survive, new writes are rejected after close.
- `will-be-invalid` — the key has no active term; reads break after close. These are exactly the keys `promote` will block on.

An unknown vocabulary id returns `"ok": false` with a diagnostic (the command ran; nothing was written).

### Promoting a Vocabulary from Open to Closed (RFC-006 V10)

Before promoting, run `vocabulary derive-tag-set` (above) to see which in-use tag keys would become invalid:

```bash
# V10 pre-flight is implicit in promote — it blocks if any in-use key
# has no active term in the vocabulary. Promotion succeeds or fails
# with a structured error payload listing the unresolvable keys.
srs vocabulary promote --repo <path> <vocabularyId>
```

If promotion is blocked, the response has `"ok": false` and `payload.unresolvableKeys` lists the tag keys with no active term. Add terms for those keys (or accept that existing records will carry invalid tags after close) before retrying. If the vocabulary has a `promotionWindow.until` date that has not yet passed, promotion succeeds even with unresolvable keys (grace window).

### Validate After Every Write Batch

```bash
srs repo validate --repo <path> --pretty
```

Check `payload.diagnostics` — a non-empty array means something is broken. Zero exit code does not mean zero errors; diagnostics are in the payload, not the exit code.

---

## 5. Repository Portability

### Copying a Repository

`repo copy` transfers all instances, relations, packages, and manifest from one store to another. Both paths must be explicit — `--repo` auto-detection is not used.

```bash
# File repo → file repo
srs repo copy --from <source-path> --to <target-path>

# File repo → single .srsj JSON bundle
srs repo copy --from <source-path> --to <bundle.srsj>

# .srsj bundle → file repo
srs repo copy --from <bundle.srsj> --to <target-path>
```

`--from-store` and `--to-store` (`file` | `json`) override the store type when auto-inference is wrong. Auto-inference: a path ending in `.srsj` or pointing to an existing file → `json`; otherwise → `file`.

The `repositoryId` is preserved across copies — the copy is the same logical repository in a different storage format, not a new one.

### Diffing Two Repository Copies

`repo diff` compares two SRS repositories keyed on stable `instance_id` and `relation_id`, not on file paths. This means a record that was renamed or moved within the repo will appear as a modification, not a remove+add, as long as its `instance_id` is unchanged.

```bash
srs repo diff --from <path-a> --to <path-b> --pretty
```

Accepts the same `--from-store` / `--to-store` overrides as `repo copy`. Typical round-trip workflow:

```bash
# Export to .srsj, edit, copy back, then diff to see what changed semantically
srs repo copy --from my-repo --to /tmp/my-repo.srsj
# ... edit /tmp/my-repo.srsj ...
srs repo copy --from /tmp/my-repo.srsj --to /tmp/my-repo-edited
srs repo diff --from my-repo --to /tmp/my-repo-edited --pretty
```

The `payload.summary` gives counts at a glance:

```json
{
  "instancesAdded": 0, "instancesRemoved": 0, "instancesModified": 1,
  "relationsAdded": 0,  "relationsRemoved": 0,  "relationsModified": 0
}
```

`payload.instances.modified[]` entries carry the full `fromValue` and `toValue` so the caller can inspect what changed without a second round-trip. `payload.manifest` reports whether the namespace, srsVersion, or declared extensions differ.

---

## 6. Common Traps

### The instanceIndex trap
`manifest.json → instanceIndex` is the authoritative membership list. A record file on disk that is not listed there does not exist to the system. The CLI manages this automatically. Direct file writes do not.

### The typeId-wins rule
A Record carries both `typeId`/`typeVersion` (authoritative) and `typeNamespace`/`typeName` (denormalized hints). If they conflict, `typeId` wins and the Record is invalid. Do not try to fix a broken Record by patching the name fields — fix the `typeId` or recreate the Record.

### Relations are not inline
Records do not contain their relations. Relations live in `relations/relations.json` (or the path declared in `manifest.json → relationsPath`). A record that looks complete when read in isolation may have significant relations elsewhere. Always run `srs relation list --repo <path>` when building a picture of a record's context.

### repositoryId is immutable
The `repositoryId` in `manifest.json` uniquely identifies this repository across all time and space. Never change it, even when copying or exporting a repo. If you need a new logical repo, create one with a new ID.

### Field semantics are immutable
Field definitions cannot be overridden by the Types that use them. `displayLabel` in a FieldAssignment is rendering-only — it does not change what a field means. If you need different semantics, you need a different Field with a new UUID.

### Version lineage
Changing a Field's `namespace` or `name` requires a new UUID — it is a new Field, not a new version of the old one. Version increments within the same UUID lineage only. The same applies to Types.

---

## 7. Reading CLI Output

All commands return a JSON envelope:

```json
{ "ok": true, "command": "...", "version": "...", "payload": { ... } }
```

Always check `ok` before reading `payload`. On failure: `ok: false`, details in top-level `diagnostics[]`.

Exit code `0` means the command ran. It does not mean the data is valid. Check `payload.diagnostics` (for `repo validate`) separately.

Use `--pretty` for human reading. Omit it when piping to `jq` or a script.

---

## 8. Ordering: Read, Then Write

Never write to an SRS repo without first reading the current state of what you intend to change. The sequence is always:

1. `srs repo map` — orient
2. `srs <entity> get` or `srs <entity> list` — read current state
3. `srs <entity> create/update/delete` — write
4. `srs repo validate` — confirm no diagnostics

Multi-step operations (create a record and add it to a container, for example) should be treated as atomic from the agent's perspective: plan all steps before executing any, and validate once at the end.

---

## 9. When the CLI Cannot Help

If a command is missing or broken, the correct response is:

1. Note the gap explicitly in the task log or commit message.
2. Make the minimal direct JSON edit required.
3. Validate with `srs repo validate`.
4. File the missing capability as a known gap — do not build workarounds that become load-bearing.

Do not silently bypass the CLI. The gap is signal.
