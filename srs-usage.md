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

`srs record list` returns each record as `{ instanceId, displayLabel, record }`. `displayLabel` is the core-resolved human label — the **same** label `srs tree`, `srs find`, `srs repo navigation`, and `srs container resolve-view` show. Priority (RFC-020): the record's Type's effective `identityFieldId` (own or inherited via `ext:type-inheritance`), when set on a field with a non-empty value; otherwise a field named `title` → `name` → `label`; otherwise the record's type name. Render `displayLabel` directly for headings and list rows; do not re-derive a title from `record.fieldValues`.

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

A vocabulary in `open` mode accepts any tag key.

### Updating a Lifecycle (RFC-016)

Use `srs lifecycle update` to modify an existing lifecycle definition (add states, change transitions, etc.). The command accepts **bare Lifecycle JSON only** — it does not unwrap a `{ "lifecycle": { ... } }` envelope. Fetch-edit-send pattern:

```bash
# 1. Fetch the current lifecycle and extract bare Lifecycle JSON
srs lifecycle get --repo <path> <lifecycleId> --pretty | jq '.payload.lifecycle'

# 2. Edit the extracted JSON (add/change states or transitions)
#    Preserve existing state and transition `id` values — they are stable UUIDs (RFC-006 substrate).
#    Preserve `createdAt` from the fetched definition.

# 3. Send the full updated JSON back — bare Lifecycle JSON, not the CLI envelope
srs lifecycle update --repo <path> <lifecycleId> <<'EOF'
{
  "id": "<lifecycleId>",
  "version": 2,
  "namespace": "com.example",
  "name": "governance_lifecycle",
  "states": [
    { "id": "<state-uuid>", "version": 1, "namespace": "com.example", "key": "draft", "isInitial": true },
    { "id": "<state-uuid-2>", "version": 1, "namespace": "com.example", "key": "ratified", "isFinal": true },
    { "id": "<new-state-uuid>", "version": 1, "namespace": "com.example", "key": "abandoned", "isFinal": true }
  ],
  "transitions": [
    { "id": "<transition-uuid>", "name": "ratify", "from": "draft", "to": "ratified" },
    { "id": "<new-transition-uuid>", "name": "abandon", "from": "draft", "to": "abandoned" }
  ],
  "initialState": "draft",
  "createdAt": "<original-iso8601>"
}
EOF
```

The command validates the full RFC-006 V9 lifecycle invariants (exactly-one initial state, initial state must be active, transition key references, `isFinal` states have no outgoing transitions, transition id uniqueness) before writing. Returns `{ "lifecycle": { ... } }` on success.

**Extension cascade warning**: If you increment `version` on a lifecycle that other lifecycles extend via `extendsLifecycleId`, those extending lifecycles' `extendsLifecycleVersion` fields will become stale and will fail RFC-006 V5 hard-error validation on the next `srs repo validate`. Update `extendsLifecycleVersion` in any dependent lifecycles immediately after updating the base. A vocabulary in `closed` mode only accepts keys that resolve to an active term. Check the vocabulary's `mode` field before tagging records.

### Blueprint Discovery and Schema Projection

Blueprint JSON files are validated against `docs/schema/2.0/blueprint.json` (RFC-009, `ext:blueprint`). Key constraint: `rootTypes` is `ExactTypeRef[]` — both `typeId` (UUID) and `typeVersion` (integer) are required. See [I-78 rules](#blueprintrootypes-must-be-exacttyperef-rfc-009-i-78-change-e) for migration guidance.

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
root types, no protocol found) appear in `payload.diagnostics`. Each stage entry in
`payload.protocol.stages[]` includes `stageId`, `name`, `purpose` (optional epistemic
description), `order`, `dependsOn`, plus optional `question`, `completionCriteria`,
`contributesTo`, `aiGuidance`, and `outputType`.

To inspect the JSON Schema for a single type:

```bash
srs type schema --repo <path> <typeId> --pretty
```

The payload is `{ "payload": { "schema": { ... }, "diagnostics": [] } }`. Non-fatal warnings
(unresolvable type references, unparseable cardinality) appear in `payload.diagnostics` rather
than causing a command failure.

Each field property carries vendor keys: `x-srs-order`, `x-srs-field-id`, `x-srs-widget`
(e.g. `"textarea"` for Text fields), `x-srs-ai-guidance` (structured `aiGuidance`, when not a
plain string), `x-srs-description` (the field's own `description`, when non-empty), and
`x-srs-instructions` (the field's `instructions`, when authored) — the last two let an editor
show help text without colliding with `title` (the display label) or `description` (already
occupied by string `aiGuidance`).

### Protocol Discovery

Protocols are package definitions — JSON files under `package/protocols/`, registered in `package.json → protocols[]`, parallel to blueprints. They are not instance Records and do not appear in `srs record list` output. The `protocol list` entries use **short field names** (`namespace`, `name`, `version`); the full Protocol JSON returned by `get`, `export`, `import`, and `update` uses **prefixed field names** (`protocolNamespace`, `protocolName`, `protocolVersion`). Do not confuse the two shapes when piping commands.

```bash
# What protocols exist in the package?
srs protocol list --repo <path> --pretty

# Get a protocol definition by ID (returns full Protocol JSON with prefixed names)
srs protocol get <protocolId> --repo <path> --pretty

# List stages for a protocol
srs protocol stages <protocolId> --repo <path> --pretty

# Validate a protocol definition (checks stage dependency invariants: no cycles, order consistent with dependsOn)
srs protocol validate <protocolId> --repo <path> --pretty

# Export a protocol definition as portable JSON (for import into another repo)
srs protocol export <protocolId> --repo <path> --pretty

# Find the first protocol whose target type matches a given typeId
srs protocol find-by-target-type --type-id <typeId-uuid> --repo <path> --pretty
```

Payload shapes (all wrapped in the standard `{ "ok": true, "payload": { ... } }` envelope):

- `protocol list` → `{ "protocols": [{ "protocolId", "namespace", "name", "version", "stageCount", "sourcePackage"? }] }`. The optional `sourcePackage` is present only when the protocol is defined in a sub-package (e.g. `package/ext`); it is omitted for protocols in the primary package.
- `protocol get` / `protocol export` → `{ "protocol": { "protocolId", "protocolNamespace", "protocolName", "protocolVersion", "protocolDescription"?, "protocolTargetType", "protocolStages": [...], "protocolTags"?, "protocolCreatedAt" } }`. The `protocol` field is the raw stored JSON; `get` and `export` return identical shapes.
- `protocol stages` → `{ "stages": [{ "stageId", "name", "purpose"?, "order", "dependsOn": ["<stageId>", ...] }] }`. The optional `purpose` field carries the spec-defined epistemic description of what understanding the stage builds (`ProtocolStage.purpose`); it is omitted when absent.
- `protocol validate` → `{ "protocolId", "valid": true/false, "diagnostics": ["<message>", ...] }`. A valid protocol has `valid: true` and an empty `diagnostics` array.
- `protocol find-by-target-type` → `{ "protocolId", "protocolName", "stages": [...], "diagnostics": ["<message>", ...] }`. Returns the first protocol whose `protocolTargetType` matches the given type ID. Returns an error envelope if no protocol targets that type.

---

## 3b. Discovery and authored lists (`find` + `resolve-view`)

`srs find` (ext:discovery, RFC-012) is the deterministic query primitive: filter records by structured axes and/or a content substring, recall-floor matching over every searchable text field (not just title).

```bash
# Structured + content query (all axes optional, AND-combined)
srs find --repo <path> --type-namespace governance --type-name decision \
  --text "budget" --tag finance \
  --lifecycle-state ratified \
  --exclude-lifecycle-state superseded --exclude-lifecycle-state closed \
  --tier 2 --container <containerId> --pretty
```

`find` → `{ "result": { "hits": [{ "instanceId", "label", "typeNamespace", "typeName", "lifecycleState"?, "score"?, "snippet"?, "matchedFields": [...] }], "total", "diagnostics" } }`. `--tag` and `--exclude-lifecycle-state` are repeatable; `--exclude-lifecycle-state` drops records whose `lifecycleState` is in the set (records without a lifecycle state are never excluded).

**Authored lists = `resolve-view` + `find`.** An interactive list (e.g. a governance decision log) is an *authored* view composed with a *runtime* query — never a bespoke client filter. `srs container resolve-view <containerId>` returns the authored columns, the ordered members, **and** the authored default-hidden lifecycle states:

```
container resolve-view <containerId> →
  { "containerView": { "containerId", "documentViewId"?, "root"?, "members": [...],
                       "columns": [...], "excludeLifecycleStates": [...], "diagnostics": [...] } }
```

Each entry in `members` (and `root` when present) carries `{ "instanceId", "tier", "displayLabel", "isVisibleByDefault", "record" }`. `isVisibleByDefault` is `false` when the member's `lifecycleState` is in `excludeLifecycleStates`, and `true` otherwise (including when `lifecycleState` is absent). A web client uses this field to implement a "show all" toggle without re-querying the repository.

`excludeLifecycleStates` is populated only when the governing `DocumentView` section is a `type-query` declaring `excludeLifecycleStates` (else `[]`). A client renders the **default-hidden** list by passing those states to `find --exclude-lifecycle-state`, and a **show-all** toggle simply drops them. Clients consume `excludeLifecycleStates` and `isVisibleByDefault` from `resolve-view` — they do not re-derive either from the DocumentView source. (See S14 in `srs-rust/docs/dogfooding.md`.)

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

### Graduating a Note to a Record

`srs note graduate` promotes a Tier-0 Note to a typed Tier-2 Record in one atomic step: the Record is created, `graduatedAt` is stamped on the Note, and both are returned in a single envelope.

First resolve the target type's field IDs (same as for `record create`):

```bash
srs type get --repo <path> <typeId> --pretty
# read fieldAssignments[].fieldId for each field you need to populate
```

Then graduate:

```bash
srs note graduate --repo <path> <noteId> --type <namespace/name> <<'EOF'
{
  "fieldValues": [
    { "fieldId": "<uuid>", "value": "<value>" }
  ]
}
EOF
```

The stdin shape is the same `CreateRecordInput` used by `record create`: `fieldValues`, optional `groupValues`, optional `tags`.

The response `data` contains:
- `note` — the original Note with `graduatedAt` stamped (ISO-8601 UTC)
- `record` — the newly created typed Record

On error (note not found, entity is not a Note, type not found, required field missing) neither write is applied.

Optional:
- `--type-version <N>` — pin a specific type version (default: latest)
- `--container <id>` (global flag) — add the new Record to a container atomically

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

Fetch the current state first. Then send the **complete** `fieldValues` array — all fields, with changed values substituted. Omitting a field from `fieldValues` removes its value; required fields will fail validation if omitted:

```bash
srs record get --repo <path> <instanceId> --pretty
# edit the output: substitute the new value in the full fieldValues array
srs record update --repo <path> <instanceId> <<'EOF'
{
  "fieldValues": [
    { "fieldId": "<uuid-of-field-1>", "value": "<unchanged-value>" },
    { "fieldId": "<uuid-of-field-2>", "value": "<new-value>" }
  ]
}
EOF
```

`groupValues` uses three-way semantics: **omit** (or `null`) to preserve existing groups; **empty array** (`[]`) to clear all groups; **non-empty array** to replace all groups. Tags follow the same three-way pattern.

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

### Transitioning a Record's Lifecycle State

Use `record transition` to move a record to a new lifecycle state. Inspect the lifecycle first to know valid state names and transition names (`srs lifecycle get --repo <path> <lifecycleId> --pretty`).

```bash
# Transition by target state name
srs record transition --repo <path> --id <instanceId> <<'EOF'
{ "to": "<state-name>" }
EOF

# Or transition by named transition
srs record transition --repo <path> --id <instanceId> <<'EOF'
{ "byTransition": "<transition-name>" }
EOF
```

Returns `{ "record": <Record>, "warnings": [] }`. When the target state is a final state (marked `isFinal: true` in the lifecycle definition), a `LIFECYCLE_FINAL_STATE` warning appears in `payload.warnings` — this is non-fatal and the transition succeeds. The record is written; the warning is informational.

The transition is validated against the lifecycle definition: the target state must exist, the transition must be allowed from the current state, and the record must already have a `lifecycleState` (records without a lifecycle assignment cannot be transitioned). A rejected transition returns `"ok": false` with a `diagnostics` entry.

### Asserting a Relation

> The relation layer is governed by eleven ratified principles (**R1–R11**, spec §"Key Invariants → Relations"). The rules below are their agent-facing projection. The load-bearing ones for authoring: types must resolve to an installed definition (R3), never infer meaning by string-matching a type name (R5), `precedes` is semantic order only (R6), relations never mutate an endpoint (R4), and "a record became something else" is always a new instance linked by a relation, never an in-place retype (R11).

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

Relations are semantic claims, not ownership. Asserting a relation does not change lifecycle state on either endpoint.

**Directionality.** Every relation reads `source [relationType] target` (Invariant 16). Store only the canonical forward form; inverses (`part-of`, `superseded-by`, `follows`, …) are derived by consumers, never asserted. The full convention:

| relationType | sourceInstanceId | targetInstanceId |
|---|---|---|
| `supersedes` | the newer Record | the older Record |
| `contains` | the whole (e.g. stage) | the part (e.g. task inside it) |
| `depends-on` | the dependent item | the item it needs |
| `refines` | the detailed version | the rough version |
| `derived-from` | the successor | the source Note or Record |
| `evidences` | the source material | the claim it supports |
| `precedes` | the earlier item | the later item |

**Choosing a type.** Every `relationType` must resolve to an installed `RelationTypeDefinition` in the effective package set (RFC-005) — the seven canonical types above ship in the core package. To use a domain-specific relation (`delegates`, `amends`, `com.acme.hr/transferred-to`), first install a namespaced definition via `srs relation-type create`; a string that resolves to nothing is a validation error, not a soft convention.

**Ordering.** `precedes` is for *semantic* sequence only — where a different order would be wrong (spec sections, process steps). For presentational ordering use the view layer (`ordering.memberOrder`; see "Presentational vs semantic ordering" below). Never assert `precedes` to make a list look right.

### Superseding a Record (use `record successor`, not a hand-assembled edge)

Superseding is a compound act: create the replacement, link it, retire the old one. Do **not** hand-assert a `supersedes` relation and edit the ratified record — edit-in-place destroys the audit trail. Use the atomic operation:

```bash
srs record successor --repo <path> --id <predecessorId> <<'EOF'
{
  "relationType": "supersedes",
  "fieldValues": [ { "fieldId": "<uuid>", "value": "<value>" }, ... ]
}
EOF
```

This creates the successor (in the type's initial lifecycle state), asserts the `supersedes` relation successor→predecessor, and returns both. `"relationType": "refines"` produces a refinement instead. The predecessor's lifecycle state is deliberately untouched — a drafted-but-unadopted successor is valid; transition the predecessor to its superseded state as a separate, explicit act (RFC-022 adds atomic transition fulfillment for this).

**Relations vs `sourceRefs`.** A Relation connects two *instances* in the repository. A `sourceRefs[]` entry on a record is a *provenance pointer* to source material (a transcript chunk, an external or repository document) — it is not an edge, does not appear in `relation list`, and uses its own separate vocabulary: the `sourceRole` field (`evidence | extracted-from | quoted-from | inspired-by`, RFC-023 — deliberately disjoint from relation types; `relationType` on a sourceRef is the deprecated legacy alias). If both ends are instances in the index, use a Relation; if you are citing where content came from, use a sourceRef. When source material is later promoted to an instance, convert the sourceRef to its Relation edge per the graduation mapping in §4.4 (note: `evidence` → `evidences` flips direction).

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

### Importing a Protocol Definition

Protocols are package definitions (not instance Records). Use `protocol import` to register a new protocol in a repo's package, and `protocol update` to replace an existing one.

**`protocol import`** reads a bare Protocol JSON object from stdin and writes it as a package definition:

```bash
srs protocol import --repo <path> <<'EOF'
{
  "protocolId": "<new-uuid4>",
  "protocolNamespace": "com.example",
  "protocolName": "my-extraction-protocol",
  "protocolVersion": 1,
  "protocolDescription": "Optional description of the protocol",
  "protocolTargetType": "<typeId-uuid>",
  "protocolStages": [
    {
      "stageId": "<uuid>",
      "name": "Stage One",
      "order": 1,
      "dependsOn": []
    },
    {
      "stageId": "<uuid>",
      "name": "Stage Two",
      "order": 2,
      "dependsOn": ["<stage-one-stageId>"]
    }
  ],
  "protocolTags": ["optional-tag"],
  "protocolCreatedAt": "<iso8601>"
}
EOF
```

Use `--package <sub-path>` to import into a sub-package (e.g. `--package package/ext`); defaults to the primary package.

`protocol import` accepts **only the bare Protocol JSON object** — it does not unwrap `{ "protocol": { ... } }` envelopes. Do not pipe the output of `protocol export` directly into `protocol import`.

**`protocol update`** is a full replace. It accepts either the bare Protocol JSON object or a `{ "protocol": { ... } }` wrapper (so piping from `protocol export` works directly):

```bash
# Fetch current state first; then send the full Protocol JSON
srs protocol get <protocolId> --repo <path> --pretty
# edit the output, then:
srs protocol update <protocolId> --repo <path> < updated-protocol.json
```

Export-pipe patterns:

```bash
# Works — update unwraps the { "protocol": {...} } envelope automatically
srs protocol export <protocolId> --repo source-repo --pretty | \
  jq '.payload' | \
  srs protocol update <protocolId> --repo target-repo

# Does NOT work for import — .payload gives { "protocol": {...} }, which import won't unwrap
srs protocol export <protocolId> --repo source-repo --pretty | \
  jq '.payload' | \
  srs protocol import --repo target-repo

# Works for import — strip to the bare Protocol object first
srs protocol export <protocolId> --repo source-repo --pretty | \
  jq '.payload.protocol' | \
  srs protocol import --repo target-repo
```

Both `import` and `update` return `{ "protocol": { ... } }` — the stored Protocol JSON.

**`protocol delete`** removes the definition file and its `package.json` entry:

```bash
srs protocol delete <protocolId> --repo <path> --pretty
```

Payload: `{ "protocolId": "<deleted-id>" }`.

`protocol create` (a successor to `import` — pending srs-rust#177) will be documented here once it lands.

### Validate After Every Write Batch

```bash
srs repo validate --repo <path> --pretty
```

Check `payload.diagnostics` — a non-empty array means something is broken. Zero exit code does not mean zero errors; diagnostics are in the payload, not the exit code.

### Managing Declared Extensions

The manifest `declaredExtensions` array records which SRS extensions a repository uses. Three commands manage it:

```bash
# List currently declared extensions
srs repo extensions list --repo <path> --pretty

# Declare that this repo uses an extension
srs repo extensions enable --repo <path> --extension ext:lifecycle

# Remove a declaration
srs repo extensions disable --repo <path> --extension ext:lifecycle
```

### Checking Extension Conformance

`repo extensions conformance` compares three sets and reports mismatches:

- `declared` — what the manifest says is used (`manifest.extra.declaredExtensions`)
- `supported` — what this build of the engine actively implements
- `declaredButUnsupported` — declared but not implemented (may cause silent no-ops)
- `usedButUndeclared` — detected in repo content but not declared (a documentation gap)

```bash
srs repo extensions conformance --repo <path> --pretty
```

Detection is content-based:

| Extension | Detected when |
|---|---|
| `ext:lifecycle` | Any Tier-2 record has a `lifecycleState` field |
| `ext:relations` | The relations collection is non-empty |
| `ext:type-inheritance` | Any package type declares `extendsTypeId` |
| `ext:field-groups` | Any package type declares `fieldGroups` |
| `ext:addressability` | Any `.revisions.json` sidecar file exists |
| `ext:repository` | Not detected (structural; always available) |
| `ext:discovery` | Not detected (structural; always available) |
| `ext:registry` | Not detected (standalone catalog files, not SRS repo content) |

A healthy repo should report empty `declaredButUnsupported` and empty `usedButUndeclared`. Run this command after importing a package or enabling a new extension to confirm the manifest is in sync with the repo content.

---

## 5. Repository Portability

### Seeding a New Repository from a Governance Package

Some governance packages ship as a pre-configured `.srsj` seed bundle that carries upstream provenance (`meta.upstreamPackage` in the manifest). After receiving the seed, re-stamp it with the new organization's identity before doing any further work:

```bash
srs repo init-new --repo <path-to-seed.srsj> \
  --namespace com.example.myorg \
  --title "My Organisation Governance" \
  --description "Optional free-text description"
```

`--repository-id` is optional; if omitted, a fresh UUID v4 is minted automatically.

The command:
- Writes a new `repositoryId` (auto-generated or caller-supplied)
- Updates `namespace`, `title`, and (if provided) `description` in the manifest
- Stamps `meta.upstreamPackage.installedAt` with the current UTC timestamp, preserving all other provenance fields (`packageId`, `namespace`, `name`, `version`)

Payload:
```json
{
  "repositoryId": "<new-uuid>",
  "namespace": "com.example.myorg",
  "packageId": "<upstream-pkg-id>",
  "packageVersion": "<upstream-pkg-version>"
}
```

The store must already contain `meta.upstreamPackage` (written by the governance-seed install step). If it is absent, the command returns an error.

---

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

`.srsj` writes are deterministic: entries are serialised in sorted key order, so re-exporting unchanged content reproduces the file byte-for-byte and a single-entry edit yields a single-entry diff. This makes committed `.srsj` bundles reviewable with `git diff` and safe to regenerate.

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

### Upgrading Instance File Paths In-Place

`repo upgrade` normalises all instance file paths in a file-backed repository to the canonical `{slug}-{id8}.json` convention (ADR-008). Repositories created before this convention was introduced may have arbitrary file names in `instanceIndex`; `repo upgrade` renames the files, updates the manifest, and removes the old files atomically. Only valid for `--store file` repos.

```bash
srs repo upgrade --repo <path>
```

The payload reports each rename performed and the count of already-canonical paths:

```json
{
  "renames": [
    {
      "instanceId": "aabbccdd-...",
      "fromPath": "records/tier-2/old-name.json",
      "toPath":   "records/tier-2/com-example-widget-aabbccdd.json"
    }
  ],
  "alreadyCanonicalCount": 12
}
```

`repo upgrade` is idempotent — running it twice on the same repo returns `renames: []` on the second call. Follow with `srs repo validate` to confirm zero diagnostics.

### Migrating Repository Identity

`repo migrate-identity` ensures a repository has a `com.semanticops.core/purpose` record and that `manifest.container.identityInstanceId` points to it. Two cases are handled:

**Case 1 — repo already has an `identityInstanceId` pointing to a Tier-0 note** (pre-dates the `purpose` type): the command promotes the note to a `com.semanticops.core/purpose` record, writes the new record, updates `identityInstanceId` in the manifest, and swaps the container membership.

**Case 2 — repo has no `identityInstanceId`** (created before the identity feature was introduced): the command derives the purpose statement from `container.description` (trimmed, falling back to `container.title` if description is absent or empty) and creates a fresh `com.semanticops.core/purpose` record. The container's `identityInstanceId` and `memberInstanceIds` are both updated.

```bash
srs repo migrate-identity --repo <path>
```

Payload (`oldIdentityId` and `oldIdentityTier` are absent when there was no prior identity):

```json
{
  "oldIdentityId": "aabbccdd-...",
  "oldIdentityTier": 0,
  "newIdentityId": "eeff0011-...",
  "statement": "A concise statement of the repository's purpose",
  "title": "Optional display title"
}
```

`oldIdentityTier` is `0` for a Tier-0 note. A Tier-2 record that is not already a `purpose` type returns an error — manual migration is required in that case.

The command returns an error (`"already a com.semanticops.core/purpose record; no migration needed"`) if the existing `identityInstanceId` already points to a `purpose` record — it does not silently no-op. After migration, run `srs repo validate --repo <path>` to confirm zero diagnostics.

---

## 5b. Changelog (`ext:changelog`, RFC-018)

Repositories that declare `"ext:changelog"` in `manifest.declaredExtensions` maintain an append-only log of every entity-level mutation. The implementation writes a `ChangelogEntry` automatically on every successful `record create/update/delete` and `note create/update/delete`. No agent action is required to produce entries.

### Querying the changelog

```bash
srs changelog list --repo <path> [--since <iso8601>] [--instance <uuid>]
```

`--since` returns entries with `timestamp >= <iso8601>`. `--instance` returns entries for a specific `instanceId`. Both filters may be combined (AND semantics).

```json
{
  "ok": true,
  "command": "changelog list",
  "payload": {
    "entries": [
      {
        "entryId": "<uuid4>",
        "instanceId": "<uuid>",
        "changeKind": "updated",
        "timestamp": "2026-07-09T08:00:00Z",
        "assertedBy": "srs-cli/0.1.0"
      }
    ]
  }
}
```

`changeKind` is one of: `created`, `updated`, `deleted`, `note-created`, `note-updated`, `note-deleted`. Note variants always include a `noteId` field.

### Round-trip sync pattern

```bash
# Before editing: capture a sync point
SYNC_POINT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Export, edit, copy back...
srs repo copy --from my-repo --to /tmp/my-repo.srsj
# ... edit ...
srs repo copy --from /tmp/my-repo.srsj --to my-repo

# After: query only what changed since the sync point
srs changelog list --repo my-repo --since "$SYNC_POINT" --pretty
```

This is more reliable than `repo diff` for large repos because `changelog list` is O(1) per query regardless of repo size.

---

## 5c. Registry Catalog (`ext:registry`)

A registry catalog is a **standalone JSON file** (not an SRS repository) that lists available packages for discovery and installation. It follows the `ext:registry` schema. The `srs registry` commands read catalog files directly — no `--repo` flag is needed.

### Listing catalog entries

```bash
srs registry list --path /path/to/catalog.json --pretty
# Optional filters (ANDed):
srs registry list --path /path/to/catalog.json --publisher com.example --tag governance --pretty
```

Returns:
```json
{
  "ok": true,
  "command": "registry list",
  "payload": {
    "registryId": "<uuid>",
    "registryName": "Example Registry",
    "catalogVersion": "1.0.0",
    "updatedAt": "2026-07-01T00:00:00Z",
    "homepage": "https://example.com/registry",
    "entries": [
      {
        "packageId": "<uuid>",
        "packageName": "com.example.governance",
        "packageVersion": "2.1.0",
        "publisher": "com.example",
        "description": "Governance types and protocols",
        "publishedAt": "2026-06-01T00:00:00Z",
        "tags": ["governance", "risk"],
        "fieldCount": 12,
        "typeCount": 5,
        "downloadUrl": "https://example.com/packages/governance-2.1.0.tar.gz",
        "checksum": "sha256:..."
      }
    ],
    "totalCount": 42,
    "filteredCount": 1
  }
}
```

`totalCount` is the unfiltered count; `filteredCount` is what matched. Optional fields (`description`, `homepage`, `tags`, `viewCount`, `schemaCount`, `protocolCount`, `relationTypeCount`, `downloadUrl`, `checksum`) are omitted when absent.

`--publisher` matches the exact `publisher` field. `--tag` matches membership in `tags` (entry must carry the tag). Both filters may be combined (AND).

### Getting a single entry

```bash
srs registry get --path /path/to/catalog.json --package-name com.example.governance --pretty
```

Returns:
```json
{
  "ok": true,
  "command": "registry get",
  "payload": {
    "registryId": "<uuid>",
    "entry": { /* same shape as a single entry above */ }
  }
}
```

Returns an error envelope (`"ok": false`) when the package name is not found in the catalog — it does not return null.

### Relationship to `srs package install`

`srs registry` is discovery-only: it reads catalog files and returns structured metadata. To install a package from a registry entry, pass the `downloadUrl` from a registry entry to `srs package install --url <downloadUrl> --repo <path>`.

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

### containerType is an advisory hint, not the join (RFC-009)
A `DocumentView` selects which `Container`s it applies to via `rootTypeRefs` — a list of version-exact `ExactTypeRef` (`{ typeId, typeVersion }`) anchors matched against a Container's root Record's resolved Type. `containerType` on both `DocumentView` and `Container` is a soft-deprecated, free-string back-compat hint; it is **not** the load-bearing join when `rootTypeRefs` is present. Two `repo validate` diagnostics are **advisory `Warning`s** — they do not make the repository or container invalid, and `ok`/exit code are unaffected:
- **I-63** — a `rootTypeRefs` entry that does not resolve to a package Type (it is simply ignored for matching).
- **I-64** — a Container whose `containerType` does not equal its root Record's resolved Type `name` (the hint is stale). Fix by updating `containerType` to the bare type name, or ignore it. Filter views by anchor with `srs document-view list --root-type <typeId>`.

### Container tags and vocabulary resolution (RFC-009 I-65)
Container `tags` follow the same vocabulary resolution rules as Record tags (RFC-006). When a Vocabulary in the package declares Terms for a given tag key, Container tags bearing that key **MUST** resolve against those Terms. Free-string tags are valid when no Vocabulary governs the key.

### `containers_for_instance` is a normative core operation (RFC-009 I-66)
The reverse lookup `containers_for_instance(instanceId) → Container[]` is a **normative** SRS operation, not an implementation detail. A Container includes an instance if:
1. the instance appears in `Container.rootInstanceIds`, or
2. the instance appears in `Container.memberInstanceIds`, or
3. a `contains` Relation exists from any of the Container's root instances to the queried instance (direct or transitive, per implementation policy).

CLI: `srs container list --member <instanceId> --repo <path>`. The result is consistent with current `rootInstanceIds`, `memberInstanceIds`, and `contains` Relations in the repository.

### Blueprint.rootTypes must be ExactTypeRef[] (RFC-009 I-78, Change E)
`Blueprint.rootTypes` uses the same `ExactTypeRef` shape as `DocumentView.rootTypeRefs` — **both** `typeId` (UUID) and `typeVersion` (integer ≥ 1) are **required**. Each entry MUST resolve against the Package at Blueprint load time; an unresolvable entry produces a diagnostic but does not invalidate the whole Blueprint.

This completes the fully UUID-anchored typed chain: `Blueprint.rootTypes → DocumentView.rootTypeRefs → Container.rootInstanceIds`. No string joins remain in this linkage.

**Migration:** existing Blueprint files whose `rootTypes` entries carry only `typeId` (no `typeVersion`) will fail `blueprint.json` schema validation and produce a diagnostic. Add the `typeVersion` integer to restore full ExactTypeRef conformance. An empty `rootTypes: []` array is valid.

### Presentational vs semantic ordering (RFC-015 [N+28]–[N+29])
Do not create `precedes` relations to achieve a presentational goal. `precedes` is the SRS relation for semantic sequence — the kind of ordering where a different arrangement would be semantically *wrong* (e.g. Step 1 must precede Step 2). For purely presentational ordering (newest-first decisions, manual curation, display preference), use `ordering.memberOrder` on a `container-subset` DocumentView section:

```json
{
  "sectionId": "decisions",
  "source": { "type": "container-subset", "containerId": "<uuid>" },
  "ordering": {
    "memberOrder": ["<instanceId-1>", "<instanceId-2>", "<instanceId-3>"]
  }
}
```

`memberOrder` lists instanceIds in presentation order; container members not listed are appended in [N+12] order (topological then `createdAt` tiebreak). It MUST NOT be combined with `fieldId` on the same section. On non-`container-subset` sources it is ignored with a diagnostic.

Creating `precedes` for presentation pollutes the semantic graph permanently — tooling cannot distinguish semantic from presentational `precedes` edges, and the relation persists even when the DocumentView is removed.

### Declaring the default repository presentation (RFC-015 [N+31])
When a repository has a canonical presentation, declare it in `manifest.json` so conformant viewers open it by default:

```json
"renderedPresentations": [
  { "viewId": "<DocumentView-UUID>", "isDefault": true }
]
```

The first entry with `isDefault: true` is the default; when none carry `isDefault`, the first entry is the default. When `renderedPresentations` is absent or empty, viewer falls back to implementation-defined selection. `viewId` MUST resolve to a DocumentView in the active package(s) — a resolution failure is a validation error. `format` and `outputPath` are informational hints for render tooling and do not affect viewer selection.

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
