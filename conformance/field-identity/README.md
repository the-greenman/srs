# RFC-053 conformance fixture: a Field's id beside its name

Normative test data for RFC-053 [R1]-[R6]. Every scenario here is contract, not a test convenience:
adding one adds an obligation, and changing an expectation changes what conformance means.

- `fixture-repo/` is the repository under test: nine Fields and six Types, one record per case.
  - `alpha` and `beta` each assign a Field named `kind`, and the two Fields differ (`note|task`
    against `red|green`). `gamma` assigns the first `kind` again, so one facet spans two Types.
  - `tone` is closed in one Field and open in another, so only the closed Field has a facet.
  - `derived` extends `base` (an inherited property), adds `stage`, and holds an inline composite,
    `size`, whose range Type `measure` assigns `unit`.
  - The `stage` Field's id sorts before the red `kind` Field's id, while its name sorts after. The two
    facets tie on total, so ascending `fieldId` and ascending name give opposite orders.
- `scenarios.json` holds the scenarios (`facets`, `projections`) and the `owed` cases.
- `tests/field-identity/run.mjs` evaluates them against the pinned `srs` CLI (check
  `field-identity-conformance` in `scripts/checks.json`). A build from before RFC-053 fails it.

The fixture was built with the CLI (`repo create`, `field create`, `type create`, `record create`).
Its random instance ids (the root container's purpose record) are not referenced by any scenario.

## Owed

[R3]'s unresolvable-Type case and [R6]'s unresolvable-assignment case have no scenario yet. The
CLI cannot produce either state (`type delete` refuses a Type a record uses, and no command writes
an assignment to a missing Field), and the repository rules forbid a hand-written tree. They are
listed under `owed` in `scenarios.json` and stay owed until the CLI can express them.
