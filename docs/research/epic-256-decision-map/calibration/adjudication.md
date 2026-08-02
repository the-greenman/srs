# Wave 1 calibration adjudication

Status: completed calibration review. This document is non-normative.

## Result

The initial passes shared eight subjects and independently selected two different tail subjects. Targeted supplements then independently coded the two missing counterparts: Pass A coded Pass B's pinned-tooling subject, and Pass B coded Pass A's package-ID repair subject. The resulting pilot now contains ten genuinely double-coded decisions and clears the directional-agreement threshold on every axis.

Unknown-extension round-tripping and the interim prose/schema drift gate remain useful single-coded research leads. They are excluded from `calibrated-pilot.json` and do not affect calibration statistics.

## Corpus reconciliation

| Shared subject | Pass A | Pass B | Splitting assessment |
| --- | --- | --- | --- |
| Field type model | CAL-A-001 | E256-A90 | Same atomic commitment |
| Frozen bootstrap seed | CAL-A-002 | E256-A91 | Same bootstrap commitment; Pass A also mentions the self-hosted representation as context |
| Neutral schema emitter | CAL-A-003 | E256-A92 | Same architecture commitment |
| View-owned composite dispatch | CAL-A-004 | E256-B90 | Same ownership commitment |
| Portable field-row baseline | CAL-A-005 | E256-B91 | Same baseline commitment |
| Name-keyed record carrier | CAL-A-006 | E256-C90 | Pass A bundles the key choice with recursive values, validation failures, and lossless migration; Pass B isolates the independently reversible key choice |
| Authoritative repository store | CAL-A-007 | E256-D90 | Same authority commitment; Pass A additionally bundles discovery and classification rules |
| Legacy predicate port | CAL-A-008 | E256-C91 | Same compatibility commitment |
| Package-ID collision repair | CAL-A-009 | E256-A98 (supplement; reconciled as E256-A93) | Same minimal identity repair and repository-wide prevention commitment |
| Pinned release renderer | E256-G98 (supplement; reconciled as E256-G90) | E256-G90 | Same exact-version and coordinated-upgrade commitment |

Pass A alone still selected unknown-extension round-tripping (CAL-A-010), and Pass B alone still selected the interim prose/schema drift gate (E256-F101). Neither receives an adjudicated card here because independent comparison is unavailable.

## Directional agreement

Agreement is exact named-direction agreement on the ten shared subjects before adjudication. Confidence differences do not count as directional disagreement.

| Axis | Exact agreements | Rate | Threshold | Result |
| --- | ---: | ---: | ---: | --- |
| Semantic Integrity ↔ Practical Expression | 9 / 10 | 90% | 80% | Pass |
| Continuity ↔ Evolution | 10 / 10 | 100% | 80% | Pass |
| Shared Coherence ↔ Local Autonomy | 10 / 10 | 100% | 80% | Pass |

There is no systematic pole confusion. The sole directional disagreement is explained by atomic scope: Pass A codes a compound carrier decision as Integrity because it includes fail-closed validation and lossless migration, while Pass B codes the isolated choice of readable Field.name keys as Practical Expression. The reconciled card adopts the narrower decision and therefore codes Expression. The bundled strict-validation and lossless-migration commitments belong on separate cards in family C.

The passes also differed on confidence for five otherwise matching directions. Adjudication uses high confidence for the bootstrap coherence, renderer evolution, rendering-baseline continuity, repository autonomy, and pinned-tooling Integrity directions because accepted or delivered evidence explicitly states the common-source, replacement, compatibility, shared-write-hotspot, and unpinned-tool ambiguity alternatives respectively.

Both supplemental pairs agree on all three directions. Package repair is assigned family A because its substantive commitment repairs the RFC-033 metamodel bootstrap identity; its repository-wide guard is operational enforcement. Pinned tooling retains family G and Pass B's E256-G90 identifier.

## Final coding precedents

1. **Freeze subjects before independent coding.** The targeted supplements repaired this pilot, but future calibration manifests must identify the same ten atomic subjects and source boundaries for both researchers. Independent corpus selection tests discovery, not coding agreement.
2. **Split by independent reversibility.** Key choice, value carrier shape, invalid-input behavior, provenance placement, and migration policy are separate when any could change without reversing the others.
3. **Code the protected value, not the artifact noun.** Schemas, migrations, and shared rules do not imply a pole by themselves; the accepted cost and rejected alternative determine direction.
4. **Readable wire keys can favor Expression.** Choosing authored names over UUID keys protects legibility and ordinary tool use even when strong semantic safeguards—Type pinning and uniqueness—remain.
5. **Layer separation can combine Integrity and Autonomy.** Keeping presentation out of semantic Types protects meaning; allowing views to choose presentations protects bounded local choice.
6. **Transition safeguards do not reverse the main direction.** A breaking replacement remains Evolution when rollback, parity, and staged gates preserve Continuity as safeguards. A frozen bridge remains Continuity when it explicitly prepares later evolution.
7. **Scope determines Coherence versus Autonomy.** Removing a central write authority favors Autonomy even when every backend must obey a coherent enumeration contract. Conversely, a portable output contract favors Coherence when its scope deliberately leaves native UI free.
8. **Do not classify historical exceptions during calibration.** `exception_class` remains `none` until synthesis establishes an axis bias. Candidate exception language belongs in coding notes or later analysis.
9. **Use partial mappings when evidence warrants them.** A named pole requires high- or medium-confidence evidence. Safeguards and shadow signals do not manufacture relevance on an otherwise unexpressed axis.
10. **Normalize status to effective evidence.** Accepted and delivered becomes `implemented`; accepted but not delivered becomes `ratified`. Coordinator descriptions alone do not establish either state.

## Reconciled pilot conventions

`calibrated-pilot.json` uses the decision-card schema field names, stable `E256` family IDs, explicit pole-name coordinates, `review_state: adjudicated`, and no premature exception classifications. It preserves the strongest stable evidence across the passes and supplements together with the adjudicated atomic-splitting interpretation above.
