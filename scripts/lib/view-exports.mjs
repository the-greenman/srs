/**
 * view-exports.mjs — the DocumentViews this repository actually publishes.
 *
 * This list is the operative answer to "which views produce something a reader sees". It is not the
 * same question as "which views does a package declare": `srs/package/package.json` declares
 * `srs-spec-document-view` (`ec34f54b`), which appears nowhere below and is therefore rendered by
 * nothing. Nor is it `manifest.renderedPresentations`, which names exactly one view (`3a000004`)
 * while five are exported — that property is stale.
 *
 * It lived in two places until #285: `publish-spec.mjs` wrote the exports from its copy and
 * `check-release-drift.mjs` verified them against its own, so the gate and the generator agreed only
 * by hand. `check-publication-reachability.mjs` needs the same list to decide what publishes, which
 * would have made three. One definition, three consumers.
 *
 * `output` is relative to the repository root; each consumer joins it.
 */
export const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: "docs/spec/srs-spec.md", requiresKeyInvariants: true },
  { id: "3a000003-0000-4000-a000-000000000003", output: "docs/spec/srs-rationale.md" },
  { id: "3a000004-0000-4000-a000-000000000004", output: "docs/spec/srs-unified.md", requiresKeyInvariants: true },
  { id: "7a000001-0000-4000-a000-000000000001", output: "docs/spec/rfcs/rfc-catalog.md" },
  { id: "7a000002-0000-4000-a000-000000000002", output: "docs/spec/rfcs/rfc-decision-log.md" },
];

/** The exported view ids, for consumers that only need to ask "is this view published?". */
export const EXPORTED_VIEW_IDS = new Set(VIEW_EXPORTS.map((e) => e.id));
