# SRS 2.0 JSON Schemas

These files express the production contract for SRS 2.0 data. Start with the canonical
“Schemas closed, engines tolerant” rule in
[Foundational values and development phase](../../spec/srs-spec.md#foundational-values-and-development-phase).
The normative emitter details, including the definition-facing and instance-facing distinction,
are in [The facing distinction](projection-rules.md#the-facing-distinction-rfc-040-change-g-rfc-decision-2e0cd70a).

Do not infer the engine's load or round-trip policy from `additionalProperties: false`: schema
validation identifies content outside the production contract, while the engine's tolerance and
preservation obligations are governed by `rfc-decision-2e0cd70a`.
