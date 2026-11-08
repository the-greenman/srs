# Relation-layer conformance fixture

Executes recorded relation rules as a fixture (srs#180; R10 of the relation principles, srs#171). It adds no rule: every scenario cites the rule it checks. Run it with the pinned CLI:

```bash
export $(node scripts/fetch-pinned-srs.mjs)
node tests/relation-conformance/run.mjs
```

- `fixture-repo/` is one small SRS repository at `dataModelRevision` 11, built with the pinned CLI (`repo create`, `field create`, `lifecycle create`, `type create`, `record create`, `record transition`): a `doc` type with the `doc_flow` lifecycle (`draft`; `superseded` with a hard `requiresRelation` on an incoming `supersedes`; `reviewed` with an advisory one on an incoming `refines`) and three documents, one of which rests in `reviewed`.
- `scenarios.json` holds each case: the rule, the CLI steps, the expected envelope (`ok`, error code, diagnostic text) and, where it matters, what `repo validate` reports afterwards. Expectations were produced by running the pinned build.
- The runner also alters two expectations in memory and requires the run to fail (the bite pass), so the check cannot pass vacuously.

## Cases and their rules

| Case | Rule | Expected from the pinned build |
|---|---|---|
| dangling target / source | mechanism *Resolution invariants* (`mechanism-eec1e40c`) | write refused, `relation-validation` (`E2UnknownEndpoint`) |
| unresolvable relation type | `mechanism-eec1e40c` V1 | write refused, `relation-validation` (`E1UnknownRelationType`) |
| containerId as source / target | I-20 | write refused, `relation-validation` (`E2UnknownEndpoint`: a container id resolves to no instance) |
| hard `requiresRelation` unsatisfied | I-98 | transition refused, `lifecycle-relation-required` |
| hard `requiresRelation` satisfied | I-98 | transition allowed once the relation exists |
| advisory `requiresRelation` | I-98, I-100 | transition allowed; `lifecycle-advisory-relation-unsatisfied` warning at rest, no error |
| sourceRole outside the closed set | I-88 (RFC-023 closed enum) | write refused, `invalid-input` |

## Pending

- **I-88 key collision** (`relation-type-key-equals-source-role-collision`): the pinned build accepts a relation type keyed like a `sourceRole` value and reports nothing at rest, against I-88's MUST. Filed as srs-rust#1610. The scenario is not run until that lands; then drop its `pending` block.

## Needs a ruling (left out, not added)

No recorded rule says what a build must do with these, so no scenario encodes one:

- a duplicate edge (same type, source and target twice);
- `precedes` fan-out (one source with several `precedes` targets);
- a legacy `relationType` key inside a SourceReference (the pinned build ignores it silently; RFC-023 says `sourceRole` replaces it, but no rule says to refuse it).

A relation that dangles *at rest* cannot be written through the CLI (the write is refused), so it has no fixture here; `repo doctor` covers repair.
