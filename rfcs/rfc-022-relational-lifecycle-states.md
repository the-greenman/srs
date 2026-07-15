> **GitHub issue**: [the-greenman/srs#158](https://github.com/the-greenman/srs/issues/158)

# RFC-022: Relational lifecycle states — `requiresRelation` + transition fulfillment

**Status**: Accepted (Revision 4)
**Affects**: `ext:lifecycle` (LifecycleState, transition semantics), `lifecycle.json`, `type.json`, canonical CLI contract (`record transition`), `repo validate` diagnostics
**Author**: design dialogue draft (issue #158 discussion)
**Date**: 2026-07-10

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-10 | Initial draft, consolidating the issue #158 proposal and its two review comments (relational-states / fulfillment design adopted over the transition-marker design). Renumbered from the issue's self-assigned RFC-021 — that number is taken by `rfc-021-blueprint-optional-schema.md`. |
| 2 | 2026-07-10 | Implementation started; RFC file committed to branch `claude/fulfillment-implementation-plan-q4m4rd`. |
| 3 | 2026-07-10 | Accepted; implemented across srs-rust (#503, #505), srs (#161, #162), srs-web (#206). Three lifecycle invariants + `ext:lifecycle` text authored. *(The acceptance header and invariant records were orphaned on the branch above; the invariants were re-landed as I-98/I-99/I-100 by srs#177 during the invariant-numbering cleanup — the numbers I-88/I-89/I-90 first claimed for them collided with pre-existing records; see #171.)* |
| 4 | 2026-07-14 | **Amendment (owner-directed, srs#171):** `requiresRelation` gains `enforcement: "hard" \| "advisory"` (default `hard`). Separates *definitional* relational states (hard — supersession) from *evidentiary/contextual* ones (advisory — e.g. ratification-needs-a-vote, relation may lag). Adds R2a; qualifies R2 to `hard`; incorporates the former Alt D as the advisory mode; adds Alt E (contextual case resolved by retype, a separate RFC). Schema: `enforcement` added to `RequiresRelation` in `lifecycle.json` + `type.json`. |

---

## Abstract

Supersession is today a compound act — flip the predecessor to `superseded`, create a successor, assert a `supersedes` relation — that the model cannot couple, so a bare state flip produces **orphan supersessions**: records marked superseded with no successor and no link. This RFC introduces **relational states**: a `LifecycleState` may declare `requiresRelation`, meaning a record may only *be* in that state if a declared relation exists. An `enforcement` strength (`hard`, the default, or `advisory`) selects whether entry is blocked until the obligation holds (definitional states like `superseded`) or merely permitted-and-flagged when it may legitimately lag (evidentiary states). Hard transitions may be **fulfilled** atomically through the existing transition operation (spawn a successor, adopt an existing record, or rely on an already-satisfied obligation). Validation surfaces at-rest violations as diagnostics.

---

## Motivation

### Problem 1 — Orphan supersessions break the audit trail

A record in `lifecycleState: "superseded"` with no incoming `supersedes` relation asserts "replaced by something" while pointing at nothing. The model permits this because state changes and relation assertions are fully decoupled: a plain lifecycle transition flips state and nothing else. The canonical gallery example ships exactly this defect (decision `38501856-26a5-4227-a877-eada79ce591a` is `superseded` with zero `supersedes` relations among the repository's relations), and the-greenman/srs-web#204 is a live client bug produced by the same gap.

### Problem 2 — Clients must string-match state names to route supersede UX

With today's allowed-transitions projection (`{name, to, toIsFinal}`), a client can only distinguish "supersede" from a sibling terminal transition such as "close" by matching `to === "superseded"` — lifecycle vocabulary leaking into presentation code, violating capability-layering (the the-greenman/srs-web#167 / ADR-001 residual).

### Problem 3 — Client-orchestrated supersession has a partial-failure window

"Create successor, then flip predecessor" is two operations. A crash between them leaves either a successor with no supersession or a flipped predecessor with no successor. The model offers no atomic form of the compound act.

---

## Proposed Changes

### Change A — `LifecycleState.requiresRelation` (relational states)

`LifecycleState` (in both the standalone `Lifecycle` schema and the inline `TypeLifecycle` block) gains an optional object:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `relationType` | string \| string[] (each non-empty) | yes | The relation type(s) that satisfy the obligation (any-of when an array). No implicit default — the obligation's content is always explicit. |
| `direction` | `"incoming"` \| `"outgoing"` | no (default `"incoming"`) | `incoming`: an edge whose **target** is the record (e.g. successor → predecessor `supersedes`). `outgoing`: an edge whose **source** is the record. |
| `enforcement` | `"hard"` \| `"advisory"` | no (default `"hard"`) | **`hard`**: a transition into the state is rejected unless the obligation is satisfied/fulfilled (§Change B). **`advisory`**: the transition is permitted even when unsatisfied; the unsatisfied obligation is surfaced only as an at-rest warning, never a rejection. |

```jsonc
// LifecycleState
{
  "key": "superseded",
  "isFinal": true,
  "requiresRelation": {
    "relationType": "supersedes",   // or ["supersedes", "replaces"]
    "direction": "incoming",
    "enforcement": "hard"           // default; omit for hard
  }
}
```

**Definitional vs contextual — what `enforcement` is for.** `hard` fits a **definitional** relational state, whose meaning *is* the relationship: a `superseded` record without a successor is not a valid superseded record, so entry must be blocked. `advisory` fits an **evidentiary/contextual** obligation that may legitimately lag — e.g. a `ratified` decision whose formal vote record is attached after the fact; the record is validly ratified now and flagged incomplete until the relation exists. Note that `requiresRelation` answers only *"does being in this state require this relation?"* — a property of the **state**. Whether the obligation *applies to a given record* is a contextual question `requiresRelation` does not model; that belongs to the Type/lifecycle the record is bound to (reached by **retype**, a separate RFC) or to the ratifying process. See the relational-states design note ([#158](https://github.com/the-greenman/srs/issues/158#issuecomment-4978979224)) and srs#171 principles R4 (definitional vs contextual coupling) and R11 (retype).

**Semantics — the invariant is on the state, not the edge**: a record may only *be* in a state declaring `requiresRelation` if a satisfying relation exists. Every path into the state — any transition edge, any client, import, migration — inherits the obligation; a state reachable via two edges cannot have door-dependent integrity. The invariant direction is deliberately `state ⇒ relation`, **not** `relation ⇒ state`: a drafted successor with a `supersedes` relation to a still-`ratified` predecessor is valid ("a replacement exists but has not been adopted").

States without `requiresRelation` are entirely unaffected; existing lifecycles keep working unchanged (opt-in per lifecycle definition).

### Change B — Transition fulfillment (atomic supersede through the existing write path)

The canonical transition operation (`record transition`; `set_lifecycle_state` on binding surfaces) gains an optional `fulfillment` input. No new verb is introduced — there remains exactly one lifecycle write path.

```jsonc
{
  "byTransition": "supersede",          // or "to": "superseded"
  "fulfillment": {
    // exactly one of:
    "newRecord": {
      "fieldValues": [ /* FieldValue[] for the successor */ ],
      "typeVersion": 3                  // optional; defaults to the predecessor's
    },
    "existingInstanceId": "<uuid>",
    // optional selector when the state declares an any-of relationType array:
    "relationType": "supersedes"        // must be one of the declared types; defaults to the first declared
  }
}
```

| Mode | Behaviour |
|---|---|
| `newRecord` | Atomically: (1) create the successor record of the same type (at the effective lifecycle's initial state, `typeVersion` optionally overridden), (2) assert the satisfying relation between successor and predecessor per `direction`, (3) transition the predecessor. |
| `existingInstanceId` | Atomically: (1) assert the satisfying relation to/from the referenced existing instance, (2) transition the predecessor. |
| omitted | Plain transition; into a `requiresRelation` state it succeeds **iff** the obligation is already satisfied by the relation graph. |

An unfulfillable transition fails with a **structured error** identifying the unmet obligation (state key, required relation type(s), direction), so clients can render "needs a successor" from the error payload without string-matching state names.

`record successor` (relation-only successor creation, predecessor untouched) is unchanged and remains the first half of the two-phase workflow (`existingInstanceId` is the second half).

### Change C — Expose the obligation on the allowed-transitions projection

Each entry in the allowed-transitions projection gains the **target state's** `requiresRelation` declaration (absent when the target declares none), alongside the existing `{name, to, toIsFinal}`. Clients route UX ("this transition opens the successor flow") purely from structure.

### Change D — At-rest validation diagnostic

Repository validation (`repo validate`) checks the declared invariant at rest: a record in a `requiresRelation` state with no satisfying relation yields a **warning-severity** diagnostic (`LIFECYCLE_RELATION_UNSATISFIED`), surfacing legacy orphans without failing existing repositories.

---

## Conformance Rules

> **[R1]** A record MUST NOT rest in a lifecycle state declaring `requiresRelation` unless at least one relation satisfies the obligation: its `relationType` equals one of the declared type(s) and the record is the relation's **target** when `direction` is `incoming` (or omitted) or its **source** when `direction` is `outgoing`.
>
> **[R2]** An implementation MUST reject a lifecycle transition whose target state declares `requiresRelation` with `enforcement: "hard"` (the default) unless the operation, upon completion, satisfies R1 — either because a satisfying relation already exists, or because the operation's `fulfillment` establishes one.
>
> **[R2a]** When the target state declares `requiresRelation` with `enforcement: "advisory"`, an implementation MUST permit the transition regardless of whether the obligation is satisfied, MUST NOT require a `fulfillment`, and MUST record the resulting at-rest state so R10's warning fires while the obligation is unsatisfied. (`fulfillment` MAY still be supplied to establish the relation atomically.)
>
> **[R3]** The rejection in R2 MUST produce a machine-readable error identifying the target state key, the required relation type(s), and the direction.
>
> **[R4]** A `fulfillment` with `newRecord` MUST, as one all-or-nothing operation: create a successor record of the predecessor's type (honouring an optional `typeVersion` override) in the effective lifecycle's initial state; assert one relation of the selected relation type between successor and predecessor oriented per `direction`; and transition the predecessor. If any step fails, no step's effect may remain observable.
>
> **[R5]** A `fulfillment` with `existingInstanceId` MUST, as one all-or-nothing operation: assert one relation of the selected relation type between the referenced instance and the record oriented per `direction`, and transition the record. The referenced instance MUST exist and MUST NOT be the record itself.
>
> **[R6]** When the state declares an any-of `relationType` array, `fulfillment.relationType` MUST be one of the declared types; when omitted it defaults to the first declared type. When the state declares a single type, a supplied `fulfillment.relationType` MUST equal it.
>
> **[R7]** A file-backed implementation MAY realize R4/R5 atomicity by write ordering in which the predecessor's state change is committed last, provided every committed prefix of the sequence is a valid repository under R1.
>
> **[R8]** Transitions whose target state does not declare `requiresRelation` MUST behave exactly as before this RFC; a `fulfillment` input supplied to such a transition MUST be rejected.
>
> **[R9]** Allowed-transitions projections MUST include the target state's `requiresRelation` declaration on each transition option whose target state declares one.
>
> **[R10]** Repository validation MUST emit a warning-severity diagnostic for every record at rest that violates R1, and MUST NOT treat such a violation as a hard validation error.

---

## Schema changes

| Schema file | Change |
|---|---|
| `lifecycle.json` | `$defs.RequiresRelation` — `relationType` (string \| string[], required), `direction` (`"incoming"`/`"outgoing"`, default `"incoming"`), **`enforcement` (`"hard"`/`"advisory"`, default `"hard"`) — added Rev 4**. Rev 3 added the object and `relationType`/`direction`; Rev 4 adds `enforcement`. |
| `type.json` | identical `RequiresRelation` definition (referenced by the inline `TypeLifecycle` `LifecycleState`), including the Rev 4 `enforcement` addition |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via its `scripts/sync-schemas-from-spec.sh`)

---

## Rationale

- **State-level, not edge-level.** An edge marker (`spawnsSuccessor` on `LifecycleTransition`, the original issue proposal) makes integrity depend on which door was used: a state reachable via a marked and an unmarked edge is incoherent, and imports/migrations bypass edges entirely. Declaring the obligation on the state makes every path inherit it, and orphan detection (Change D) is just the same invariant checked at rest.
- **An object, not booleans.** `spawnsSuccessor: true` + `successorRelationType` bakes the supersede special case into the schema permanently. `requiresRelation` names the obligation (a relationship), not the mechanism (spawning), and has room for future growth (cardinality, `targetTypeRef`) without another schema change.
- **No implicit relation-type default.** Defaulting to `supersedes` would re-encode the special case the object shape removes. Explicit `relationType` makes a domain's `replaces`-style vocabulary first-class without engine changes. (`direction` does default — `incoming` covers the successor pattern and is mechanism, not meaning.)
- **Extend the one write path, no new verb.** A `record supersede` verb forks the just-consolidated transition path and does not scale — each future relation-obligation would demand another verb. `fulfillment` on `record transition` covers one-shot supersede, two-phase adopt, and import/migration with three input shapes.
- **Hard by default, advisory as an opt-in mode.** `hard` is the default because the motivating case — supersession — is *definitional*: advisory-only enforcement leaves the invariant to per-client discipline, and srs-web#204 is precisely a well-meaning client doing the bare flip. But not every relational obligation is definitional; some are evidentiary and legitimately lag (ratification-needs-a-vote). Rather than force those into state-splitting or client discipline, `enforcement: "advisory"` expresses them directly — the state is valid without the relation but flagged incomplete. The write path is the single knob distinguishing the two modes (reject vs permit); at rest both surface the same warning-severity diagnostic. Because only lifecycles that declare the obligation are affected, and `hard` is the default, this is opt-in per lifecycle definition, not a breaking change to `set-lifecycle-state`.
- **`state ⇒ relation`, not the converse.** Keeping "drafted replacement exists, not yet adopted" valid preserves the existing `record successor` two-phase workflow and makes crash-ordering atomicity (R7) sound: every prefix of successor → relation → flip is valid.

---

## Alternatives Considered

### Alt A — Successor-spawning marker on the transition (`spawnsSuccessor` + `successorRelationType`)

The original issue #158 proposal. Rejected for door-dependence (invariant varies by edge), the supersede-shaped schema (two loose fields vs. one named obligation), and because at-rest orphan detection would need a separate hardcoded rule instead of falling out of a declared invariant.

### Alt B — New first-class `record supersede` verb / `supersede_record` binding

The shape originally tracked by the-greenman/srs-rust#492. Rejected: it forks the single validated lifecycle write path and needs a verb per future relation-obligation. The rescoped #492 implements this RFC instead.

### Alt C — Pure relational derivation (remove `superseded`-class states entirely)

The north-star end of the design space (issue OQ7): derive "is superseded" solely from the relation graph so state and relation can never desync — at the cost of changing every lifecycle consumer and read/filter surface (e.g. filters keyed on `lifecycleState`). Deferred: this RFC's marked-projection design is back-compatible and structurally prevents desync at the write path; the relational model remains recorded here as the long-term direction.

### Alt D — Advisory enforcement *as the only mode* (warn on bare flips, never reject)

Rejected **as the sole enforcement**: for a definitional state like `superseded` it preserves the exact failure mode this RFC exists to eliminate (srs-web#204), forcing every client to re-implement discipline the model can supply once. But advisory is the right behaviour for *evidentiary* obligations — so Rev 4 incorporates it as a per-state `enforcement: "advisory"` **mode** rather than rejecting it outright. `hard` remains the default.

### Alt E — Model the contextual case by conditional `requiresRelation`

Give `requiresRelation` a predicate so the obligation applies only when some record condition holds (e.g. `policy_class == "statutory"`). Rejected: it turns the lifecycle into a rules engine and re-encodes context that already lives elsewhere. The contextual case is resolved structurally instead — by **retype** to a specialist Type whose lifecycle makes the obligation definitional (a separate RFC) — leaving `requiresRelation` a clean per-state property with only an enforcement-strength dial.

---

## Open Questions

None. (The issue's OQ1–OQ7 are resolved in the text above: OQ1/OQ2 → Change A + Rationale; OQ3 → Change B; OQ4 → R2/R3; OQ5 → opt-in graceful degradation, Change A; OQ6 → Change D/R10; OQ7 → Alt C.)
