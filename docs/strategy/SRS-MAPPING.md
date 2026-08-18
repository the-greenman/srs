# Future SRS mapping for the strategic map

`roadmap.json` is deliberately an authoring projection, not a second wire
format. Each entity already has a stable `instanceId`; each `links` entry has
typed endpoints. A later materializer can create this SRS repository without
inferring relationships from prose or presentation order.

| Bootstrap entity | Future SRS Type | Mutable? |
| --- | --- | --- |
| Boundary | `com.semanticops.strategy/release-boundary` | The release assessment changes; the promise changes only by an explicit roadmap decision. |
| Capability stage | `com.semanticops.strategy/capability-stage` | Evolves as the practice path is refined. |
| Strategy contract | `com.semanticops.strategy/strategy-contract` | Stable architectural promise. |
| Normative subject | Existing SRS Record, such as `com.semanticops.spec/extension` | Owned by the specification, not strategy. |
| Assessment | `com.semanticops.strategy/assessment` | Revised at milestones. |

| Bootstrap link | Future Relation | Direction |
| --- | --- | --- |
| `contains` | `contains` | Architectural parent → child. |
| `depends-on` | `depends-on` | Dependent → prerequisite. |
| `com.semanticops.strategy/requires-contract` | Same installed relation type | Boundary or stage → contract. |
| `com.semanticops.strategy/assesses` | Same installed relation type | Assessment → assessed boundary or contract. |
| `com.semanticops.strategy/aligns-with` | Same installed relation type | Stage → boundary. |
| `evidences` | `evidences` | Assessment → stage it supports. |

DocumentViews own the capability tree, release matrix, extension register and
other presentation choices. They must not change the graph or introduce a
semantic ordering claim.

`ext:addressability` is the reference example: the roadmap uses the extension
Record's existing UUID as its subject. Its separate ContractAssessment carries
the provisional specification, absent implementation, absent conformance, and
release placement. The roadmap therefore does not duplicate the extension's
normative Address, AttentionState, or Revision definitions.
