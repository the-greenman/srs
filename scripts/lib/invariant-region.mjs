// srs#396 — the Key Invariants region boundary.
//
// srs#801 (X1, ruling R1 on srs#787): Key Invariants moves from "spliced in front of the
// Conformance Part's Validation heading" to the very end of the rendered document, and the
// injected content itself becomes a generated INDEX (render-invariants.mjs's `indexEntry`), not a
// second verbatim printing of every invariant's normative text — see that file. Both changes are
// this repo's rendering scripts only; no record or relation changed to make them.
//
// The old code anchored on the "Validation" heading (srs#710 history below) because that was Key
// Invariants' next sibling under Conformance at the time. Reprinting a heading-anchored splice
// mid-document doesn't fit "the very end", and it collided directly with #794's `labelMode: "none"`
// work in the exact way #801's hazard note called out (the "Validation" text is no longer a safe
// anchor once other content near it changes shape) — so this version appends after ALL rendered
// content instead of searching for an anchor at all, which is both simpler and matches "very end"
// literally. `injectKeyInvariants` now always succeeds; the `| null` "anchor not found" branch this
// module used to have has no case left that would trigger it, but callers still check for `null` in
// case a future revision reintroduces an anchor requirement (fail loud, not silently skip).
//
// ponytail: heading level for the appended section is hardcoded at "## " (Part level) rather than
// read from the document's own heading structure — every current export renders Parts at that
// level, checked against both requiresKeyInvariants views (srs-spec.md, srs-unified.md); if a
// future composition renders Parts at a different level this needs to read that level from the
// content instead of assuming it.
//
// srs#710 (RFC-042 Change B, `rfc-decision-5f8204bc`): the `section`-typed "Key Invariants" record
// that used to author this heading is retired — no record exists any more to source a
// "Key Invariants" heading from, and none was created to replace it: the record's own authored
// `content` field ("Conforming implementations must uphold the following invariants.") was always
// dead weight, byte-identical to the first line `renderInvariants()` already generates on its own,
// discarded on every previous injection anyway. So the heading itself is generated here, rather
// than found. carried-context-31ea3659 is the record of why this redesign was required before the
// record could be deleted.
const INJECTED_HEADING_TEXT = "Key Invariants (generated index)";
const INJECTED_HEADING_LEVEL = "##";

/**
 * Append the generated Key Invariants index heading and body to the very end of `content`.
 * Returns the new content. Kept returning `null` never in practice today, but callers still treat
 * a `null` return as "anchor not found" so a future revision can reintroduce that failure mode
 * without also having to change every call site.
 */
export function injectKeyInvariants(rawContent, injectedContent) {
  // Normalize before appending, same as check-release-drift.mjs's normalizeMarkdownForComparison —
  // an untranslated CRLF elsewhere in the file would make a byte-for-byte drift comparison flap.
  const content = rawContent.replace(/\r\n/g, "\n");
  return `${content.trimEnd()}\n\n\n${INJECTED_HEADING_LEVEL} ${INJECTED_HEADING_TEXT}\n\n${injectedContent.trimEnd()}\n`;
}
