# renderedPresentations default selection and compositionId resolution

> When manifest.renderedPresentations is present and non-empty, a conformant viewer MUST select as the default presentation the first entry whose isDefault is true.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Projection](/agents/presentation/projection.md).

**Number**: I-128

When `manifest.renderedPresentations` is present and non-empty, a conformant viewer MUST select as the default presentation the first entry whose `isDefault` is `true`. When no entry carries `isDefault: true`, the first entry in the array is the default. The selected Composition governs the repository's presentation. When a `renderedPresentations` entry's `compositionId` does not resolve to a Composition in the active packages, implementations MUST skip that entry and MUST emit a diagnostic; if all entries fail to resolve, behaviour falls back to implementation-defined selection as if `renderedPresentations` were absent. When `compositionId` resolves to Compositions in more than one active package, implementations MUST report a validation error (ambiguous composition reference). When `renderedPresentations` is absent or empty, viewer behaviour falls back to implementation-defined selection (existing behaviour unchanged; no conformance obligation is added for the absent case). (RFC-015 Change C.)
