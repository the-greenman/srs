# Migration: `governance/status` select field → shared `Lifecycle`

RFC-006 Task 4 (the-greenman/srs#8). This records how the LiMoMa governance example
moved from a free-standing `governance/status` `select` field to a referenceable
`Lifecycle` bound to each governance Type via `lifecycleRef`, and the state of CLI
support discovered along the way.

## What changed

| Before | After |
|---|---|
| `governance/status` `select` field (`draft … archived`) on Article, Role, Decision | field removed |
| each Record carried a `status` fieldValue (`"active"`) | each Record carries top-level `lifecycleState: "ratified"` |
| no lifecycle | shared `governance/governance_lifecycle` Lifecycle, referenced by `Type.lifecycleRef` |

### The Lifecycle

`package/lifecycles/governance-lifecycle-3c504040.json` (per RFC-006 Rev 6 note #2):

```
draft ──propose──▶ proposed ──ratify──▶ ratified ──supersede──▶ superseded (final)
  ▲────revise──────┘                         └────────close──────▶ closed   (final)
```

`initialState: draft`. `closed` and `superseded` are `isFinal`. States and transitions
each carry a stable `id` (RFC-006 keeps these reachable for future ontology work).

### Value mapping

All 16 governance Records were `status: "active"`. The target state set has no
`active`; these are settled founding-meeting records, so all map to **`ratified`**.

## Steps (CLI-first; direct edits only where the CLI cannot yet do it)

1. **Lifecycle definition** — hand-authored the lifecycle file and added it to
   `package.json` `lifecycles[]`. *(CLI gap: no `srs lifecycle create` — srs-rust#116.)*
   Verified with `srs lifecycle get 3c504040-… --repo .` → `result: found`.
2. **Types** — for Article/Decision/Role: `srs type get` → drop the `status`
   FieldAssignment, add `lifecycleRef` → `srs type update` (CLI write). ✅
3. **Records (drop status)** — for each of the 16 governance Records: `srs record get`
   → drop the `status` fieldValue → `srs record update` (CLI write). ✅
4. **Records (set state)** — set `lifecycleState: "ratified"` by **direct edit** of the
   record JSON. *The CLI cannot do this for a `lifecycleRef`-bound Record:*
   - `srs record transition` errors `has no lifecycle defined on its Type` because the
     write path resolves only inline `Type.lifecycle`, not `lifecycleRef` (srs-rust#114).
   - `srs record update` silently ignores `lifecycleState` on stdin (state is
     transition-guarded) (srs-rust#114).
5. **Remove the field** — `srs field delete aee7afe9-… --repo .` (CLI write; removes the
   file and the `package.json` `fields[]` entry; passes the in-use check now that no
   Type or Record references it). ✅
6. **Validate** — `srs repo validate --repo .` → `ok: true`, 0 diagnostics. Negative
   check: setting a bogus `lifecycleState` yields `V8: … is not a valid state key in the
   resolved lifecycle`, confirming `lifecycleRef` resolution is enforced on read/validate.
7. **Snapshot** — regenerated `../gallery.srsj` via `srs repo copy`. See the known
   `.srsj` lifecycle-portability limitation in `../gallery-srsj.md` (srs-rust#115).

## CLI gaps found (filed)

| Issue | Severity | Summary |
|---|---|---|
| srs-rust#114 | bug | `record create`/`transition` ignore `Type.lifecycleRef` (only inline `lifecycle`); validation already resolves it — write paths are out of step |
| srs-rust#115 | bug | JsonStore (`.srsj`) drops package `lifecycles`/`vocabularies` → `lifecycleRef` fails after `repo copy` |
| srs-rust#116 | enhancement | no `srs lifecycle create` (lifecycle commands are list/get only) |
| srs-rust#117 | bug | Lifecycle loader rejects top-level `$schema` (Field loader tolerates it) |

Once srs-rust#114 lands, steps 4 should become `srs record transition`
(`draft → propose → proposed → ratify → ratified`) instead of a direct edit.
