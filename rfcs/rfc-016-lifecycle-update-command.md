> **GitHub issue**: [the-greenman/srs#119](https://github.com/the-greenman/srs/issues/119)

# RFC-016: Lifecycle Update Command

**Status**: Accepted (Revision 2)
**Affects**: `ext:lifecycle` (CLI contract), `srs-usage.md` (agentic write-workflow reference)
**Author**: the-greenman (from issue the-greenman/srs#81)
**Date**: 2026-07-04

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-04 | Initial draft |
| 2 | 2026-07-04 | Address review findings: expand R5 to cover all RFC-006 V9 obligations (blocking); fix Behaviour §4/R5 cardinality contradiction; add R2/R5 two-pass clarification; add R8 (stable UUID SHOULD); add extension-cascade behaviour note; specify bare-JSON-only input; add Documentation Changes section; add usage-pattern jq extraction step; add `extendsLifecycleId` scope note; fix R5 `===` notation; add `createdAt` preservation note; address LifecycleState substrate compliance. |
| 3 | 2026-07-04 | Implementation started; spec records authored in `srs/srs/` (RFC record `5c5422b9`, Change A `5601eb2e`); PR opened on branch `rfc/016-lifecycle-update-command`. |

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

**Input**: Full Lifecycle JSON object read from stdin, conforming to `docs/schema/2.0/lifecycle.json`. The command reads bare Lifecycle JSON only — it does not unwrap a `{ "lifecycle": { ... } }` envelope.

**Argument**: `<lifecycleId>` — the UUID of the lifecycle to update. The lifecycle MUST already exist in the package.

**Behaviour**:
1. Read the full Lifecycle JSON from stdin.
2. Validate the JSON against the `lifecycle.json` schema (same validation as `lifecycle create`); also verify that each `LifecycleState` entry supplies `id` (UUID), `version` (integer ≥ 1), and `namespace` (string), consistent with the RFC-006 VocabularyEntry substrate contract (these fields are required by RFC-006 but not marked `required` in the schema file — schema validity alone is not sufficient).
3. Require that the `id` field in the stdin JSON matches `<lifecycleId>`. If they differ, return an error without writing.
4. Validate referential integrity and RFC-006 V9 lifecycle invariants (see R5). These are enforced as a service-layer check distinct from schema validation.
5. Write the updated lifecycle back to the package (replace the existing definition in full).
6. Return `{ "lifecycle": <stored Lifecycle JSON> }`.

**Extension cascade note**: The command does not scan for lifecycles that extend this one via `extendsLifecycleId`. When a base lifecycle's `version` is incremented, any extending lifecycle whose `extendsLifecycleVersion` no longer matches will fail RFC-006 V5 hard-error validation on the next `srs repo validate`. Callers who update a base lifecycle MUST update any dependents' `extendsLifecycleVersion` fields to match.

**Options**: Same global options as `srs lifecycle create` — `--repo`, `--format`, `--pretty`, `--store`.

**Error cases**:
- Lifecycle not found: `"ok": false`, diagnostic `"lifecycle not found: <lifecycleId>"`.
- Schema validation failure: `"ok": false`, diagnostics list all violations.
- ID mismatch between argument and stdin `id` field: `"ok": false`, diagnostic `"lifecycle id in body does not match argument"`.
- Referential integrity failure: `"ok": false`, diagnostics list all V9 violations.

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
# 1. Fetch the current lifecycle definition and extract bare lifecycle JSON
srs lifecycle get --repo <path> <lifecycleId> --pretty | jq '.payload.lifecycle'

# 2. Edit the extracted JSON (add/change states or transitions)
#    Preserve existing state and transition `id` values — they are stable UUIDs.
#    Preserve `createdAt` from the fetched definition.

# 3. Send the full updated JSON back
srs lifecycle update --repo <path> <lifecycleId> <<'EOF'
{
  "id": "<lifecycleId>",
  "version": 2,
  "namespace": "com.example",
  "name": "governance_lifecycle",
  "states": [
    { "id": "<existing-state-uuid>", "version": 1, "namespace": "com.example", "key": "draft", "isInitial": true },
    { "id": "<existing-state-uuid-2>", "version": 1, "namespace": "com.example", "key": "ratified", "isFinal": true },
    { "id": "<new-uuid>", "version": 1, "namespace": "com.example", "key": "abandoned", "isFinal": true }
  ],
  "transitions": [
    { "id": "<existing-transition-uuid>", "name": "ratify", "from": "draft", "to": "ratified" },
    { "id": "<new-transition-uuid>", "name": "abandon", "from": "draft", "to": "abandoned" }
  ],
  "initialState": "draft",
  "createdAt": "<original-iso8601>"
}
EOF
```

---

## Conformance Rules

R2 (schema validation) and R5 (referential integrity) are two distinct validation passes. Schema validity is a necessary but not sufficient condition; all R5 checks MUST also pass before writing.

> **[R1]** A conformant CLI MUST accept `srs lifecycle update <lifecycleId>` and read the full Lifecycle JSON from stdin.
>
> **[R2]** A conformant implementation MUST validate the stdin Lifecycle JSON against `docs/schema/2.0/lifecycle.json` before writing. A schema-invalid input MUST be rejected with a diagnostic listing all violations; nothing is written.
>
> **[R2a]** A conformant implementation MUST additionally verify that each `LifecycleState` entry in the stdin JSON supplies `id` (a valid UUID string), `version` (integer ≥ 1), and `namespace` (a non-empty string), consistent with the RFC-006 VocabularyEntry substrate contract. Schema-validity alone (R2) is not sufficient to establish substrate compliance.
>
> **[R3]** A conformant implementation MUST reject the update and return an error diagnostic when the `id` field in the stdin JSON does not match the `<lifecycleId>` positional argument.
>
> **[R4]** A conformant implementation MUST reject the update and return an error diagnostic when no lifecycle with `id == <lifecycleId>` exists in the package.
>
> **[R5]** A conformant implementation MUST validate all RFC-006 V9 lifecycle invariants before writing:
> - `initialState` MUST equal the `key` of exactly one state in `states[]` where `isInitial` is `true`.
> - A state where `isInitial` is `true` MUST have effective `status: active` (absent `status` is treated as active per RFC-006 absent=active rule; a state with `status` set to `deprecated`, `tombstone`, or `retired` MUST NOT be the initial state).
> - Every `from` and `to` value in `transitions[]` MUST reference a `key` present in `states[]`.
> - A state where `isFinal` is `true` MUST NOT appear as the `from` value of any transition.
> - Transition `id` values, when present, MUST be unique within the lifecycle's `transitions[]` array.
>
> `extendsLifecycleId` referential integrity (RFC-006 V5 — the referenced lifecycle exists in the package) is enforced by `srs repo validate`, not by `lifecycle update`.
>
> **[R6]** On success, the command MUST return `{ "lifecycle": <stored Lifecycle JSON> }` wrapped in the standard `{ "ok": true, "command": "lifecycle update", "payload": { ... } }` envelope.
>
> **[R7]** The update MUST be a full replace of the existing lifecycle definition. The stored JSON after the command MUST be exactly the validated stdin JSON; no fields are merged or carried forward from the prior definition.
>
> **[R8]** Callers SHOULD preserve existing `id` values from prior states and transitions when making incremental updates using the fetch-edit-send pattern, to maintain stable UUID identity for those entries.

---

## Schema changes

**None.**

The `lifecycle.json` schema in `docs/schema/2.0/` already covers the full Lifecycle shape. No schema file changes are required. The `update` command uses the same schema as `create` for R2 validation; the additional R2a and R5 checks are service-layer invariants that the schema does not programmatically enforce.

---

## Documentation changes

`srs-usage.md §3` (Vocabulary and Lifecycle Discovery, currently listing only `lifecycle list` and `lifecycle get`) MUST be updated to add a lifecycle write-workflow subsection, parallel to the existing "Importing a Protocol Definition" subsection. The addition MUST include:

1. The `srs lifecycle update` usage pattern (fetch → extract with `jq '.payload.lifecycle'` → edit → send bare JSON).
2. A note that the command accepts bare Lifecycle JSON only — it does not unwrap a `{ "lifecycle": { ... } }` envelope.
3. The extension-cascade warning: callers who increment a base lifecycle's `version` MUST update any extending lifecycles' `extendsLifecycleVersion` fields to match.

---

## Rationale

**Full-replace semantics (not patch/merge)**: `srs type update` and `srs protocol update` both use full-replace. This keeps the contract simple: the caller fetches the current state, edits it, and sends the whole thing back. Partial-patch semantics would require a patch format, conflict resolution rules, and a way to express "remove a state" — none of which exist elsewhere in the CLI. Full-replace is consistent with the existing package-definition update pattern.

**Caller-owned `version` field**: Auto-incrementing the version would hide the semantic intent of an update (a caller incrementing version signals a meaningful schema change; leaving it unchanged signals a metadata correction). Auto-increment also creates divergence if the same lifecycle is managed across multiple repos. Leaving `version` caller-owned is consistent with `lifecycle create`, which also trusts the caller to supply it.

**`id` must match argument**: Requiring the stdin `id` to match the positional argument prevents silent overwrites where an operator pastes the wrong lifecycle JSON. The check costs nothing and prevents a hard-to-debug class of mistake.

**No `--force` flag**: The command validates fully before writing. There is no scenario where bypassing validation produces a useful result, so no escape hatch is provided.

**Bare-JSON-only input (no wrapper acceptance)**: `srs lifecycle create`, `srs vocabulary create`, and `srs type update` all read bare entity JSON. `srs protocol update`'s wrapper-acceptance is an exception motivated by the `protocol export → update` pipe pattern. Lifecycle does not have an equivalent export command, and aligning with the create/update majority (`bare JSON only`) is simpler and more consistent. If a pipe pattern from `lifecycle get` is needed, `| jq '.payload.lifecycle'` is the explicit extraction step.

**`createdAt` and stable UUIDs are caller-preserved**: R7 stores exactly the stdin JSON. Callers SHOULD preserve `createdAt` from the fetched definition and SHOULD preserve existing state and transition `id` values, as these carry stable UUID identity per RFC-006. The command does not enforce preservation — doing so would require comparing against the prior definition and would prevent legitimate corrections. The SHOULD rule (R8) signals intent without making the command unnecessarily restrictive.

**Extension cascade is caller responsibility**: Checking whether any installing repo has a dependent lifecycle with a mismatched `extendsLifecycleVersion` would require cross-package scanning. This is outside the scope of a single-package write command; `srs repo validate` is the correct gate. The caller note is sufficient.

---

## Alternatives Considered

### Alt A — Patch/merge semantics (partial update)

A `PATCH`-style command would accept only the fields to change (e.g. just the `states` array). Rejected because: no other CLI command uses partial-update semantics; it would require a new patch-format spec; expressing "remove a state" requires explicit null-or-empty semantics that conflict with the omit-means-preserve pattern on records.

### Alt B — Require the caller to delete-and-recreate

Force callers to `srs lifecycle delete <id>` then `srs lifecycle create`. Rejected because: `lifecycle delete` does not exist either (and would need its own spec work); delete-recreate would break any `Type.lifecycleRef` pointing to the old lifecycle ID; it is a poor ergonomic for what is a simple "change one state" operation.

### Alt C — Infer `lifecycleId` from the stdin JSON `id` field (no positional argument)

Skip the positional argument and derive the target from the stdin `id`. Rejected because: `srs type update`, `srs protocol update`, and `srs record update` all take the target ID as a positional argument; consistency is more valuable than saving a few characters.

### Alt D — Accept wrapped input (like `srs protocol update`)

Accept both bare JSON and the `{ "lifecycle": { ... } }` envelope returned by `lifecycle get`. Rejected: `srs lifecycle create`, `srs vocabulary create`, and `srs type update` all use bare-JSON input. The protocol-update exception exists because `protocol export` produces the same wrapper, creating a natural pipe. No equivalent export command exists for lifecycle; adding wrapper-acceptance before there is a pipeline that produces wrappers would add complexity with no current benefit.

---

## Open Questions

**None.** Extension-cascade behaviour (resolved: caller responsibility, noted in Behaviour and Rationale) and wrapped-input handling (resolved: bare JSON only, see Alt D and Rationale) were raised during review and are settled above.
