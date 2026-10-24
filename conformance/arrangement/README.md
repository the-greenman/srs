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

## RFC-051 storage scenarios

RFC-051 (per-entry container storage, `dataModelRevision` 11) adds `storage-scenarios.json`: 30
scenarios covering every case in RFC-051's conformance fixture list, run against the pinned srs CLI
by `tests/arrangement-storage/run.mjs` (registered as `arrangement-storage-conformance`, tier
`pinned-cli`, run in Release Drift). Each scenario works on a fresh copy of `fixture-repo/`: it writes
its `given` files into a scratch container (`0a0000c5-...`), runs CLI steps (and, for the merge cases,
plain `git` branches and a merge), then checks the outline, the exact files written with their
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
| rename pairing | `rename_pairing_is_a_visible_conflict` |
| rename/delete and rename/rename | `rename_delete`, `rename_rename` (git MAY conflict; a clean result MUST equal the per-path one, [R10]) |
| write sets with tie runs | `write_set_tie_placed_by_instance_id`, `write_set_tie_rekeys_the_run_after_the_place` |
| detached entries followed by an operation | `detached_entries_followed_by_an_operation` ([R8], Revision 15, the-greenman/srs#954) |
| deterministic migration | `migration_is_deterministic` (the fixture's flat outlines migrate to the committed directories byte for byte) |
| head versus entry classification | `head_versus_entry_classification`, `head_carrying_members_refused` |
| a stray file | `stray_file_refused`, `entry_misplaced_refused`, `entry_name_mismatch_refused` |
| the key vectors | `appends_write_one_entry_each_never_the_head`, `key_*` (every Appendix vector, and the two `arrangement-key` refusals) |

The srs-web `rfc038-concurrency` end-to-end acceptance (two writers, one container, a plain merge) is
srs-web's test (the-greenman/srs-web#584); `concurrent_appends_with_equal_keys_merge_cleanly` is the
same property at the CLI.
