> **GitHub issue**: [the-greenman/srs#119](https://github.com/the-greenman/srs/issues/119)

# RFC-016: Lifecycle Update Command

**Status**: Draft (Revision 1)
**Affects**: `ext:lifecycle` (CLI contract), `srs-usage.md` (agentic write-workflow reference)
**Author**: the-greenman (from issue the-greenman/srs#81)
**Date**: 2026-07-04

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-04 | Initial draft |

---

## Abstract

`srs lifecycle` supports `list`, `get`, and `create` but has no `update` subcommand. This omission forces any agent or human wishing to modify an existing lifecycle definition (e.g. add a new state or transition) to fall back to direct JSON file editing, violating the CLI-first rule in `srs-usage.md §2`. This RFC adds `srs lifecycle update <lifecycleId>` to the spec, modelling it exactly on the existing `srs type update` command.

---

## Motivation

### Problem 1 — No CLI path to modify an existing lifecycle

The `ext:lifecycle` extension installs lifecycle definitions as package objects in `package/lifecycles/`. Once created via `srs lifecycle create`, the only way to modify a lifecycle (add a state, change a transition, update the description) is to edit the underlying JSON file directly. This:

- Violates `srs-usage.md §2` (CLI-first rule), which explicitly prohibits direct JSON file editing when a CLI command can express the operation.
- Bypasses the service-layer validation that `srs lifecycle create` runs (schema conformance, referential integrity of `initialState`, `from`/`to` state keys in transitions).
- Is not portable to non-file storage backends; a future SQL-backed or in-memory repo has no file to edit.

The gap was discovered during authoring of srs#69 (Decision Logger v1 gallery data), where the acceptance criterion required adding an `abandoned` terminal state to `governance_lifecycle`. The workaround taken was a direct file edit followed by `srs repo validate`.

### Problem 2 — Asymmetry with peer package-definition commands

`srs type update`, `srs vocabulary` (through `promote` / `term-create`), and `srs protocol update` all provide write paths for their respective package definitions. `srs lifecycle` has no equivalent. The omission is a gap in the package-definition write surface, not a design choice.

---

## Proposed Changes

### Change A — Add `srs lifecycle update <lifecycleId>` command

Add an `update` subcommand to `srs lifecycle` with the following contract:

**Synopsis**
```bash
srs lifecycle update [OPTIONS] <lifecycleId>
```

**Input**: Full Lifecycle JSON object read from stdin, conforming to `docs/schema/2.0/lifecycle.json`.

**Argument**: `<lifecycleId>` — the UUID of the lifecycle to update. The lifecycle MUST already exist in the package.

**Behaviour**:
1. Read the full Lifecycle JSON from stdin.
2. Validate it against the `lifecycle.json` schema (same validation as `lifecycle create`).
3. Require that the `id` field in the stdin JSON matches `<lifecycleId>`. If they differ, return an error without writing.
4. Validate internal referential integrity: `initialState` MUST reference a `key` present in `states[]` with `isInitial: true`; every `from` and `to` value in `transitions[]` MUST reference a `key` present in `states[]`.
5. Write the updated lifecycle back to the package (replace the existing definition in full).
6. Return `{ "lifecycle": <stored Lifecycle JSON> }`.

**Options**: Same global options as `srs lifecycle create` — `--repo`, `--format`, `--pretty`, `--store`.

**Error cases**:
- Lifecycle not found: `"ok": false`, diagnostic `"lifecycle not found: <lifecycleId>"`.
- Schema validation failure: `"ok": false`, diagnostics list all violations.
- ID mismatch between argument and stdin `id` field: `"ok": false`, diagnostic `"lifecycle id in body does not match argument"`.

**Payload shape** (on success):
```json
{
  "ok": true,
  "command": "lifecycle update",
  "payload": {
    "lifecycle": { /* full stored Lifecycle JSON */ }
  }
}
```

**Idempotence**: Sending the same lifecycle JSON twice produces the same stored state. The command is a full-replace, not a merge.

**Version field**: The `version` field is part of the caller-supplied JSON and is stored as-is. It is the caller's responsibility to increment `version` when making a meaningful change. The command does not auto-increment.

**Usage pattern** (mirrors `srs type update`):
```bash
# 1. Fetch the current lifecycle definition
srs lifecycle get --repo <path> <lifecycleId> --pretty

# 2. Edit the returned JSON (add/change states or transitions)

# 3. Send the full updated JSON back
srs lifecycle update --repo <path> <lifecycleId> <<'EOF'
{
  "id": "<lifecycleId>",
  "version": 2,
  "namespace": "com.example",
  "name": "governance_lifecycle",
  "states": [ ... ],
  "transitions": [ ... ],
  "initialState": "draft",
  "createdAt": "<original-iso8601>"
}
EOF
```

---

## Conformance Rules

> **[R1]** A conformant CLI MUST accept `srs lifecycle update <lifecycleId>` and read the full Lifecycle JSON from stdin.
>
> **[R2]** A conformant implementation MUST validate the stdin Lifecycle JSON against `docs/schema/2.0/lifecycle.json` before writing. A schema-invalid input MUST be rejected with a diagnostic listing all violations; nothing is written.
>
> **[R3]** A conformant implementation MUST reject the update and return an error diagnostic when the `id` field in the stdin JSON does not match the `<lifecycleId>` positional argument.
>
> **[R4]** A conformant implementation MUST reject the update and return an error diagnostic when no lifecycle with `id == <lifecycleId>` exists in the package.
>
> **[R5]** A conformant implementation MUST validate referential integrity before writing: `initialState` MUST equal the `key` of exactly one state in `states[]` where `isInitial === true`; every `from` and `to` value in `transitions[]` MUST reference a `key` present in `states[]`.
>
> **[R6]** On success, the command MUST return `{ "lifecycle": <stored Lifecycle JSON> }` wrapped in the standard `{ "ok": true, "command": "lifecycle update", "payload": { ... } }` envelope.
>
> **[R7]** The update MUST be a full replace of the existing lifecycle definition. The stored JSON after the command MUST be exactly the validated stdin JSON; no fields are merged or carried forward from the prior definition.

---

## Schema changes

**None.**

The `lifecycle.json` schema in `docs/schema/2.0/` already covers the full Lifecycle shape. No schema file changes are required. The `update` command uses the same schema as `create` for input validation.

---

## Rationale

**Full-replace semantics (not patch/merge)**: `srs type update` and `srs protocol update` both use full-replace. This keeps the contract simple: the caller fetches the current state, edits it, and sends the whole thing back. Partial-patch semantics would require a patch format, conflict resolution rules, and a way to express "remove a state" — none of which exist elsewhere in the CLI. Full-replace is consistent with the existing package-definition update pattern.

**Caller-owned `version` field**: Auto-incrementing the version would hide the semantic intent of an update (a caller incrementing version signals a meaningful schema change; leaving it unchanged signals a metadata correction). Auto-increment also creates divergence if the same lifecycle is managed across multiple repos. Leaving `version` caller-owned is consistent with `lifecycle create`, which also trusts the caller to supply it.

**`id` must match argument**: Requiring the stdin `id` to match the positional argument prevents silent overwrites where an operator pastes the wrong lifecycle JSON. The check costs nothing and prevents a hard-to-debug class of mistake.

**No `--force` flag**: The command validates fully before writing. There is no scenario where bypassing validation produces a useful result, so no escape hatch is provided.

---

## Alternatives Considered

### Alt A — Patch/merge semantics (partial update)

A `PATCH`-style command would accept only the fields to change (e.g. just the `states` array). Rejected because: no other CLI command uses partial-update semantics; it would require a new patch-format spec; expressing "remove a state" requires explicit null-or-empty semantics that conflict with the omit-means-preserve pattern on records.

### Alt B — Require the caller to delete-and-recreate

Force callers to `srs lifecycle delete <id>` then `srs lifecycle create`. Rejected because: `lifecycle delete` does not exist either (and would need its own spec work); delete-recreate would break any `Type.lifecycleRef` pointing to the old lifecycle ID; it is a poor ergonomic for what is a simple "change one state" operation.

### Alt C — Infer `lifecycleId` from the stdin JSON `id` field (no positional argument)

Skip the positional argument and derive the target from the stdin `id`. Rejected because: `srs type update`, `srs protocol update`, and `srs record update` all take the target ID as a positional argument; consistency is more valuable than saving a few characters.

---

## Open Questions

**None.**
