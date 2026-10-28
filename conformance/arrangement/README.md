# Arrangement conformance fixture (RFC-043, RFC-051)

Normative test data for container outline arrangement (RFC-043, `dataModelRevision` 8), with the
shape of `conformance/discovery/`: a `fixture-repo/` and a `scenarios.json`. RFC-043's conformance
section binds acceptance to this fixture, so a scenario here is contract: adding one adds an
obligation.

- `fixture-repo/` is a repository created and populated with the CLI (never by hand), at revision 8,
  and since migrated by the registry to revision 11 (each container a directory of a head and one
  entry file per member, RFC-051); it holds a
  Type `item`, seven records (Alpha to Eta), the container `Outline` (`0a0000c1-...`) holding them as a
  three-level outline (Alpha 0, Beta 1, Gamma 2, Delta 1, Epsilon 0, Zeta 1, Eta 2) with Alpha as its
  anchor, a root container whose entries give the navigation (Alpha 0, Beta 1, Epsilon 0), and two
  Compositions with one arranged `container-subset` section each and no `containerId` literal
  (`outline-view`, and `outline-view-desc` with `direction: desc`). Two more containers serve the
  render scenarios: `Mixed` (`0a0000c2-...`, anchor a `purpose` record; an item nested to depth 4 and
  a second `purpose` record with descendants) and `Anchored` (`0a0000c3-...`, Alpha 0, Beta 1 and a
  `purpose` anchor), with two more Compositions: `outline-view-clamp` (`depthOffset` 3) and
  `outline-view-items` (arranged, `typeFilter` on the item Type), and two that name a Container by
  literal `containerId` (allowlisted in `scripts/composition-container-literal-allowlist.json`, srs#851):
  `outline-view-rule` (a rule section on `Outline`, ordered by title) and `outline-view-literal` (an
  arranged section on `Anchored`).
- `scenarios.json` has 31 scenarios covering [R1], [R2], [R3], [R5], [R7], [R8], [R9], [R10], [R11], [R12],
  [R19] and [R20].
  Every expectation was captured from the build.417 CLI (srs-rust 0a46716) running against
  this fixture, then checked against the rule it cites; `json_projection_carries_depth` ([R11]) and
  the ten render and Composition scenarios added for [R7], [R8], [R9] and [R10] (heading levels to
  depth 4 and the clamp at 6, `typeFilter` promotion and an excluded anchor, the three [R10] refusals,
  a rule section flattening a nested container, and a supplied container against a literal) were
  captured from the pinned build.554 CLI.
- Two keys are new for these scenarios and a runner must handle them: the operation
  `{"composition": "create", "definition": {...}}` (the Composition is refused with
  `composition-validation`, so the [R10] exclusions are tested where they are enforced), and the
  expectation `expectedDiagnosticContains` (a substring that some diagnostic of the render contains).
- A scenario with `given.files` writes those files (path under the repository, JSON content) into the
  fresh copy of `fixture-repo/` before it runs, so a dangling entry or a second container lives in
  scenario-local scratch containers (`0a0000c6-...`, `0a0000c7-...`) and no existing scenario's
  expectation moves. The [R19] scenarios read `sectionContainerId` per navigation section
  (`expectedSectionContainers`, `null` for none) and the navigation diagnostics
  (`expectedDiagnostics`); the [R20] scenarios run `container: "members-repair"` and check
  `expectedMembers` / `expectedPromoted` / `expectedRemoved`, `expectedAnchorInstanceId` and
  `expectedValidateCode` (after repair, `repo validate` still reports it), and `expectedSecondRun`
  (the same expectations after a second repair).

## Not yet covered

These RFC-043 scenarios need an engine that does not exist in `srs-rust` today
(the-greenman/srs-rust#1143) or a surface this fixture does not exercise yet:

- [R14] three-way merge and [R18] slice closure (no merge or slice engine).
- [R15] the same entries through CLI, WASM and MCP; [R16] cross-revision refusal; [R17] migration
  gate refusals.

## RFC-051 storage scenarios

RFC-051 (per-entry container storage, `dataModelRevision` 11) adds `storage-scenarios.json`: 30
scenarios covering every case in RFC-051's conformance fixture list, run against the pinned srs CLI
by `tests/arrangement-storage/run.mjs` (registered as `arrangement-storage-conformance`, tier
`pinned-cli`, run in Release Drift). Each scenario works on a fresh copy of `fixture-repo/`: it writes
its `given` files into a scratch container (`0a0000c5-...`), runs CLI steps (and, for the merge cases,
plain `git` branches merged twice: per path, with rename detection off, as RFC-051 [R10] defines, and with stock git, which may conflict more but must agree when clean), then checks the outline, the exact files written with their
bytes, the `repo validate` diagnostics or the fatal load code. Expectations were captured from
v0.1.0-build.554 and checked against the rule each cites.

| RFC-051 case | Scenarios |
|---|---|
| concurrent appends with equal keys | `concurrent_appends_with_equal_keys_merge_cleanly` |
| an orphan | `orphan_follows_the_attached_top_level`, `repair_reattaches_orphans_and_loop_breaks` |
| a loop with a tail | `loop_with_a_tail`, `repair_reattaches_orphans_and_loop_breaks` |
| a loop with no attached entry | `loop_with_no_attached_entry` |
| add/add, with equal and with different values | `add_add_equal_merges_cleanly`, `add_add_different_conflicts` |
| a dangling pointer | `dangling_pointer_is_a_validation_error` |
| a container deleted against an added entry | `container_deleted_against_an_added_entry`, `headless_directory_is_a_warning` |
| rename pairing | `rename_pairing_is_a_visible_conflict` (per path a delete/modify conflict; stock git pairs the files as a rename and conflicts in the new file: visible either way) |
| rename/delete and rename/rename | `rename_delete`, `rename_rename` (clean per path; stock git conflicts, which [R10] allows, and a clean stock result would have to equal the per-path one) |
| write sets with tie runs | `write_set_tie_placed_by_instance_id`, `write_set_tie_rekeys_the_run_after_the_place` |
| detached entries followed by an operation | `detached_entries_followed_by_an_operation` ([R8], Revision 15, the-greenman/srs#954) |
| deterministic migration | `migration_is_deterministic` (the fixture's flat outlines migrate to the committed directories byte for byte) |
| head versus entry classification | `head_versus_entry_classification`, `head_carrying_members_refused` |
| a stray file | `stray_file_refused`, `entry_misplaced_refused`, `entry_name_mismatch_refused` |
| the key vectors | `appends_write_one_entry_each_never_the_head`, `key_*` (every Appendix vector, and the two `arrangement-key` refusals) |

The srs-web `rfc038-concurrency` end-to-end acceptance (two writers, one container, a plain merge) is
srs-web's test (the-greenman/srs-web#584); `concurrent_appends_with_equal_keys_merge_cleanly` is the
same property at the CLI.
