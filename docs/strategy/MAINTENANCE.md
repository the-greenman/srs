# Maintaining the owner strategic map

`roadmap.json` is the curated logical SRS projection for strategy and assessed
reality. It is not a second issue tracker: GitHub supplies a live execution
overlay through `node scripts/roadmap.mjs --status`.

Strategic entities keep stable UUIDs and readable keys. Their relationships
belong in `links`, not in repeated arrays on boundaries, stages, contracts or
assessments. Normative SRS meaning belongs in the referenced SRS Record; the
roadmap records only release significance and assessed readiness.

When a release promise, capability boundary, or evidence-backed reality claim
materially changes, update the corresponding JSON entry. Every reality check
names typed evidence, the date it was assessed, and the date it must be
reviewed again. Do not update a claim merely because an issue changed state.

Before opening a roadmap change, run:

```sh
node scripts/roadmap.mjs --audit
node scripts/roadmap.mjs --write
node scripts/roadmap.mjs --check
```

`--audit` reports review-due evidence and verifies local repository paths. It
does not infer a new state, update dates, or contact GitHub. `--status` is the
separate, non-committed current task view.

## Milestone review

At boundary planning, a release candidate, or a major semantic change:

1. Confirm every normative SRS subject still resolves to its stated Record.
2. Review changed contracts and their dependencies.
3. Update specification, implementation and conformance maturity separately.
4. Update evidence, open conditions, `assessedAt`, and `reviewBy`.
5. Confirm each boundary and stage requirement through `links`.
6. Regenerate the projections and ratify the resulting snapshot.

The prospective SRS Type and Relation mapping is documented in
[SRS-MAPPING.md](SRS-MAPPING.md).
