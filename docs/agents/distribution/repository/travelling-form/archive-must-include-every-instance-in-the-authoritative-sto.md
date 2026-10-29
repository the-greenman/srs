# archive must include every instance in the authoritative store's…

> An archive must include every instance discovered by enumerating the repository's authoritative store — the instance set (RFC-038 [R1], [R17]) — not a manifest instanceIndex, which is retired (RFC-03…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: 49

An archive must include every instance discovered by enumerating the repository's authoritative store — the instance set (RFC-038 [R1], [R17]) — not a manifest `instanceIndex`, which is retired (RFC-038 [R2]). An archive missing any enumerated instance file is malformed; a conforming consumer must reject it or surface the missing instances explicitly before processing.
