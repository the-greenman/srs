// srs#396 — the Key Invariants region boundary.
//
// The region body being replaced must stop at the next heading of the same or higher level
// (fewer or equal '#'s), never at the next '---' rule. A '---' is a generic subsection separator
// used throughout the rendered document for reasons unrelated to Key Invariants, so scanning for it
// finds whichever one happens to come next — which can, and did, land inside a wholly different
// top-level section (RFC-016 Change B previously specified the '---' scan; amended by srs#396).
//
// This stays a Node-side text transform rather than a change to `srs render document-view` (the
// pinned Rust CLI) — RFC-016 deliberately confined the whole Key-Invariants-projection feature to
// this repo's scripts, to avoid a coordinated cross-repo release for a capability the CLI's
// document-view renderer cannot express yet.
//
// ponytail: the boundary regex is a line-anchored heading scan, not fenced-code-block aware — a
// future invariant `normative_statement` containing a fenced block with a line like "## example"
// would be misread as the boundary. No invariant record contains a code fence today (checked
// against the corpus this fix landed against); if one ever does, this needs real markdown parsing.
//
// srs#710 (RFC-042 Change B, `rfc-decision-5f8204bc`): the `section`-typed "Key Invariants" record
// that used to author this heading is retired — no record exists any more to source a
// "Key Invariants" heading from, and none was created to replace it: the record's own authored
// `content` field ("Conforming implementations must uphold the following invariants.") was always
// dead weight, byte-identical to the first line `renderInvariants()` already generates on its own,
// discarded on every previous injection anyway. So the heading itself is now generated here too,
// rather than found. It is inserted immediately before the "Validation" concept heading
// (`record:concepts/validation`), which was Key Invariants' next sibling under the Conformance Part
// before the record existed and remains its next sibling in the composition's raw, pre-injection
// output — confirmed empirically against both `srs-spec.md` and `srs-unified.md` (srs#710 Ground
// stage) and unique across each composition's raw render, so it is safe to match by heading text the
// same way the old code matched "Key Invariants" itself. carried-context-31ea3659 is the record of
// why this redesign was required before the record could be deleted.
const ANCHOR_HEADING_RE = /^(#{1,6}) Validation$/m;
const INJECTED_HEADING_TEXT = "Key Invariants";

/**
 * Insert the generated Key Invariants heading and region body into `content`, immediately before
 * the "Validation" heading. Returns the new content, or `null` if that anchor heading is not
 * present (caller decides whether that's an error).
 */
export function injectKeyInvariants(rawContent, injectedContent) {
  // Normalize before scanning, same as check-release-drift.mjs's normalizeMarkdownForComparison —
  // an untranslated CRLF puts a trailing '\r' on the heading line the anchor regex looks for.
  const content = rawContent.replace(/\r\n/g, "\n");
  const anchorMatch = ANCHOR_HEADING_RE.exec(content);
  if (!anchorMatch) return null;

  const heading = anchorMatch[1];
  const beforeAnchor = content.slice(0, anchorMatch.index);
  const fromAnchor = content.slice(anchorMatch.index);
  return `${beforeAnchor}${heading} ${INJECTED_HEADING_TEXT}\n\n${injectedContent.trimEnd()}\n\n${fromAnchor}`;
}
