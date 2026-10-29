# Heading Hierarchy

> For format: "markdown", "html", or "adoc":

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

For `format: "markdown"`, `"html"`, or `"adoc"`:

| Element | Heading level | Condition |
|---|---|---|
| Document title | `1 + depthOffset` | When `preamble` is absent |
| Section title | `2 + depthOffset` | When `DocumentSection.title` is set |
| Per-record heading | `3 + depthOffset` | When `titleFieldId` is set on the section and present in the record's Type's effective field set, or (RFC-020, Rule [N+37]) as a fallback in either absence |
| Field label | Bold/formatted text, not a heading; exact per-format form per *Normative Field-Row Form* (RFC-037) | Always |

For `format: "text"` or implementation-defined values, heading level semantics do not apply.

**`identityFieldId` fallback (RFC-020, Rule [N+37], amended Rev 7, srs#728).** For any `DocumentSection`/record pairing where the section's `titleFieldId` is absent, or is declared but does not resolve within the record's Type's effective field set (own `fields[]` plus, under `ext:type-inheritance`, inherited fields), on either rendering path (Default Rendering Baseline or dispatched L1 View), implementations SHOULD emit the per-record heading from the record's Type's effective `identityFieldId` (`ext:type-inheritance`), if present, in place of omitting it. `titleFieldId`, when it resolves in that set, MUST continue to take precedence. An authored `titleFieldId` that resolves but fails the eligibility test above (cardinality/datatype/domain/format) is a distinct case: it still omits the heading, with no identity fallback (unchanged, srs-rust PR #341).

**Amended by RFC-042 Rev 5 (2026-09-19, srs#796).** A nested section (RFC-042 [R21]) at nesting depth `d` renders its title at `2 + depthOffset + d` and its per-record headings at `3 + depthOffset + d`. The `contains` recursion inside a record continues one level deeper per level from there.

For `format` `"markdown"`, `"html"` and `"adoc"`, a computed heading level above 6 MUST be emitted at 6 and MUST produce a diagnostic. The render MUST NOT fail: a presentation arrangement never decides whether a repository is valid. Implementations SHOULD warn when a composition's projected maximum heading level exceeds 6, as they already warn for a `depthOffset` above 4.

**Duplicate-heading suppression (RFC-001 Rule [N+38], amended Rev 11, srs#827).** When the resolved per-record heading equals the enclosing `DocumentSection`'s title, implementations MUST NOT emit it; the rows render under the section heading, at their existing levels. Equality is exact after an outer-whitespace trim: no case folding, no collapsing, no substring match. A titleless section emits every heading. The rule is unconditional and suppresses the heading alone.
