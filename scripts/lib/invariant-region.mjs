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
const HEADING_RE = /^### Key Invariants$/m;

/**
 * Replace the Key Invariants region body in `content` with `injectedContent`.
 * Returns the new content, or `null` if the heading is not present (caller decides whether that's
 * an error).
 */
export function injectKeyInvariants(rawContent, injectedContent) {
  // Normalize before scanning, same as check-release-drift.mjs's normalizeMarkdownForComparison —
  // an untranslated CRLF puts a trailing '\r' on the heading line the boundary regex looks for.
  const content = rawContent.replace(/\r\n/g, "\n");
  const headingMatch = HEADING_RE.exec(content);
  if (!headingMatch) return null;

  const level = headingMatch[0].match(/^#+/)[0].length;
  const headingEnd = headingMatch.index + headingMatch[0].length;
  const rest = content.slice(headingEnd);
  const boundaryRe = new RegExp(`^#{1,${level}}(?!#) `, "m");
  const closingMatch = boundaryRe.exec(rest);

  const beforeRegion = content.slice(0, headingEnd);
  const afterRegion = closingMatch ? rest.slice(closingMatch.index) : "";
  return `${beforeRegion}\n\n${injectedContent.trimEnd()}\n\n${afterRegion}`;
}
