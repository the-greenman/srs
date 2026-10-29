# Semantic succession

> The rule that meaning is never silently rewritten.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

The rule that meaning is never silently rewritten. Correcting how something is expressed (a typo, phrasing, a clarification that leaves the understanding unchanged) is an in-place edit. Changing what was actually committed to produces a new instance linked to the prior one, and the prior one remains valid. The test is whether a reasonable reader meeting the record a year later would recognise it as the same understanding they would have read before the change.

**Notes**: Cross-check both ways: if a `supersedes` link would read as the group reversing itself when it only clarified, it was an edit; if a silent edit would read as the record being revised after the fact, it was a successor.

**Intro**: The underlying question: *Would a reasonable reader, encountering this Record a year later, recognise it as the same understanding they would have read before the change?*

**Outro**: Cross-check: if a `supersedes` Relation would feel misleading — as if the group reversed itself when it only clarified — it is probably an edit. If a silent edit would feel misleading — as if the record was silently revised after the fact — it is probably a new Record.

| Scenario | Guidance |
| --- | --- |
| Correcting how something is expressed (typo, phrasing) | Edit in-place |
| Adding context that reinforces the existing understanding | Edit in-place |
| Clarifying a detail that was ambiguous but understanding is unchanged | Edit in-place |
| Adding information that changes what was actually committed to | New Record + `refines` or `supersedes` |
| Reversing or materially replacing a prior commitment | New Record + `supersedes` |
| Producing a more detailed version from a rough original | New Record + `refines` |
