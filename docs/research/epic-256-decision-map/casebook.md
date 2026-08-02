# Epic 256 foundational-axes casebook

Status: contributor-facing research aid; non-normative.

Use this casebook to reason with the axes, not to copy a past answer. Start with the atomic choice: when two valid values conflict, which cost would the proposal accept and which value would it protect? Then name the counter-pole safeguard. The complete evidence and coding are in [`decision-ledger.json`](decision-ledger.json).

## Reading a coordinate

A coordinate records evidenced direction, not moral rank. `Integrity · Evolution · Coherence`, for example, says the choice protected exact meaning, changed an established model, and imposed one shared contract. It does not say that every future change should do the same.

Partial coordinates are equally valid. They mean the evidence did not put every lens in tension. Do not fill a missing direction from intuition.

## Six occupied vertices

### 1. Integrity · Evolution · Coherence — replace a conflated model

**Card:** E256-A01, “Replace `valueType` with orthogonal `fieldType` facets.” [Accepted RFC-032 evidence](https://github.com/the-greenman/srs/blob/de2310bc5d90ed47597c0a1a99beffa26ac396b1/rfcs/rfc-032-composite-field-range.md#change-a--the-fieldtype-model-replaces-valuetype).

The project rejected another patch on the convenient legacy enum and accepted a corpus-wide breaking migration. It protected independent semantic facets and one shared way to express them.

The important safeguard was not “tests exist.” The migration was deterministic, idempotent, corpus-wide, and separately gated from the instance cutover. Apply this case when an existing representation cannot state the intended meaning without ambiguity. Do not apply it when a smaller compatible correction preserves the same semantic result.

### 2. Integrity · Continuity · Coherence — retain a bootstrap fixed point

**Card:** E256-A08, “Retain committed Field and Type schemas as the runtime bootstrap fixed point.” [Accepted RFC-033 evidence](https://github.com/the-greenman/srs/blob/e6d94bba0a9d78d0e3be3a46d9b25a50f6b0d30f/rfcs/rfc-033-self-host-metamodel-frozen-seed.md#change-b--frozen-seed-bootstrap-fixed-point-never-re-derived-at-runtime).

Self-hosting did not justify removing the independent base case. Runtime derivation from records that require the same schema to parse would make bootstrap trust circular. Continuity protected loadability; Coherence protected one committed artifact.

The counter-value remains active: self-hosted records can become the build-time authorship source after closure is proven. Apply this case when a stable base case is necessary for recovery or interpretation. Watch for the shadow: a bootstrap artifact quietly becoming a second hand-edited authority.

### 3. Expression · Evolution · Coherence — standardize a projection boundary

**Card:** E256-B05, “Standardize field-row output at the DocumentView boundary.” [Accepted RFC-037 evidence](https://github.com/the-greenman/srs/blob/f467593204e6f11cb78a4599a8c76cae4bd95e5a/rfcs/rfc-037-normative-field-row-rendering-baseline.md#conformance-rules). Classification: `principled-contextual` exception to the Integrity bias.

The project changed previously variable rendering behavior to make covered exports portable and legible. It protected Practical Expression and Shared Coherence without promoting rendered prose to semantic authority.

Apply this case when interoperability is explicitly claimed at a presentation or serialization boundary. Keep stable identity, ordering, and semantic provenance available beneath the projection.

### 4. Expression · Continuity · Coherence — degrade a failed presentation, not the record

**Card:** E256-B04, “Specify a normative composite baseline.” [Accepted RFC-036 evidence](https://github.com/the-greenman/srs/blob/f120e9f3174b2eddd773e259a91034eb958b60c2/rfcs/rfc-036-composite-rendering.md#change-c--composite-baseline-rendering-normative). Classification: `counterpole-protection`.

When a specialized presentation is unavailable, the baseline keeps the record usable through one portable fallback. Continuity protects existing readable output; Coherence prevents each renderer inventing a different failure mode.

The safeguard for Integrity is structural: assignment order, identity, and nested values remain recoverable, and a presentation failure does not rewrite semantic data. Apply this case to optional views and projections, not to failed semantic interpretation.

### 5. Integrity · Continuity · Autonomy — use ordinary package ownership

**Card:** E256-A07, “Resolve the metamodel through ordinary `packageRefs` rather than implicit merge.” [Accepted RFC-033 evidence](https://github.com/the-greenman/srs/blob/e6d94bba0a9d78d0e3be3a46d9b25a50f6b0d30f/rfcs/rfc-033-self-host-metamodel-frozen-seed.md#rationale). Classification: `counterpole-protection` for Coherence.

The foundational metamodel did not receive a hidden global dependency or an entire reserved namespace. Existing resolution semantics and explicit package ownership were preserved.

Autonomy is bounded: canonical metamodel identities and the shared package-resolution contract still apply. Apply this case when common infrastructure can participate through an existing explicit extension mechanism. Watch for substitution of incompatible foundational definitions.

### 6. Integrity · Evolution · Autonomy — let views own presentation

**Card:** E256-B01, “Place composite-renderer dispatch in the view layer.” [Accepted RFC-036 evidence](https://github.com/the-greenman/srs/blob/f120e9f3174b2eddd773e259a91034eb958b60c2/rfcs/rfc-036-composite-rendering.md#change-b--three-declaration-sites-in-the-view-layer-with-a-total-precedence-order). Classification: `principled-contextual`.

The same semantic records may have different legitimate presentations. Moving renderer selection out of Field and Type protects semantic identity while granting the view owner local choice.

The shared safeguard is a common identifier grammar, precedence, diagnostic, sentinel, and fallback contract. Apply this case when variability is genuinely view-specific. Do not use it to make semantic interpretation implementation-defined.

## Boundary and transition cases

### Closed inside, autonomous outside

**Card:** E256-D04, “Apply a closed policy only inside explicit repository locations.” [Accepted RFC-038 evidence](https://github.com/the-greenman/srs/blob/1a1746d3ebf8346914fd88920dcaf2b80b07d877/rfcs/rfc-038-tree-authoritative-storage.md#L324-L363). Classification: `counterpole-protection`.

Reserved SRS locations fail closed; content outside them is application-owned and repository operations do not interpret or modify it. This is the reusable pattern for Coherence without total jurisdiction: make the boundary explicit, make shared behavior strict inside it, and avoid claims outside it.

### Repository authority can create a temporary gap

**Card:** E256-G08, “Keep mirror repairs inside repository authority boundaries.” [Owner dispatch evidence](https://github.com/the-greenman/srs-rust/issues/787#issuecomment-5147100327). Classification: `transitional`.

A worker was not authorized to edit sibling repositories and could not claim one repaired mirror meant the ecosystem was current. The accepted cost was a visible temporary inconsistency requiring separately authorized work.

Use this case only when the gap is explicit, bounded, and owned. A temporary exception becomes a contradiction if no follow-up authority, drift signal, or closure condition exists.

### Fail the migration rather than invent meaning

**Card:** E256-E08, “Abort rather than partially migrate ambiguous data.” [Accepted RFC-039 evidence](https://github.com/the-greenman/srs/blob/e0fb4b050447febcd5ecb8f6ccb7864196e656d6/rfcs/rfc-039-record-field-value-carrier.md#the-transform-must-be-total--every-schema-legal-branch-has-a-rule).

One ambiguous value blocks the repository transform. This protects Integrity and Continuity together: it does not preserve the old carrier indefinitely, and it does not guess at the new meaning. Known intentional losses require their own explicit, logged disposition.

### Make normative work reviewable

**Card:** E256-G04, “Make normative RFC review understandable without generated diffs.” [Delivered process evidence](https://github.com/the-greenman/srs/issues/304). Classification: `counterpole-protection`.

Human-readable explanation protects Practical Expression inside a semantically strict process. It must enumerate the normative rule, consequence, breakage, migration, and owner question; it explains the canonical artifact rather than replacing it.

## Applying the values to a new decision

Write a small decision card before choosing:

1. State one independently reversible choice and its real alternatives.
2. For each relevant lens, name the cost the choice accepts and the value it protects.
3. Name the counter-pole safeguard. If none exists, say so.
4. Identify the over-rotation signal that would make the choice self-defeating.
5. Mark the coordinate only where evidence supports a named pole at medium or high confidence.
6. If the choice moves against a ratified default, name its context, boundary, exit condition, and safeguard. “Exception” is not a waiver from shared meaning.

Three diagnostic questions catch most misuse:

- Is this changing meaning, or only changing how established meaning is expressed?
- What evidence makes the transition safe, and what would let us recover?
- Where exactly may local choice vary without creating incompatible interpretations?
