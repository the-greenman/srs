# RFC-043 arrangement conformance fixture

Normative test data for container outline arrangement (RFC-043, `dataModelRevision` 8), with the
shape of `conformance/discovery/`: a `fixture-repo/` and a `scenarios.json`. RFC-043's conformance
section binds acceptance to this fixture, so a scenario here is contract: adding one adds an
obligation.

- `fixture-repo/` is a revision-8 repository created and populated with the CLI (never by hand): a
  Type `item`, seven records (Alpha to Eta), the container `Outline` (`0a0000c1-...`) holding them as a
  three-level outline (Alpha 0, Beta 1, Gamma 2, Delta 1, Epsilon 0, Zeta 1, Eta 2) with Alpha as its
  anchor, a root container whose entries give the navigation (Alpha 0, Beta 1, Epsilon 0), and two
  Compositions with one arranged `container-subset` section each and no `containerId` literal
  (`outline-view`, and `outline-view-desc` with `direction: desc`).
- `scenarios.json` has 14 scenarios covering [R1], [R2], [R3], [R5], [R7], [R9], [R10] and [R12].
  Every expectation was captured from the build.417 CLI (srs-rust 0a46716) running against this
  fixture, then checked against the rule it cites.

## Not yet covered

These RFC-043 scenarios need an engine that does not exist in `srs-rust` today
(the-greenman/srs-rust#1143) or a surface this fixture does not exercise yet:

- [R14] three-way merge and [R18] slice closure (no merge or slice engine).
- [R11] `depth` on `ProjectedRecord` in JSON output: the schema carries it, but the build.417
  renderer does not emit it yet, so the scenario is withheld until it does.
- [R15] the same entries through CLI, WASM and MCP; [R16] cross-revision refusal; [R17] migration
  gate refusals; [R20] repair; [R19] shared-anchor ambiguity; heading clamp at level 6, `typeFilter`
  with descendants, and a `rule` section flattening a nested container.
