// RFC-042 Revision 4 [R18] — the generated extension index region boundary.
//
// Modelled on invariant-region.mjs's injectKeyInvariants: a Node-side text transform over the
// already-rendered composition output, not a change to `srs render composition` (the pinned Rust
// CLI) — the generated-index capability is scoped to this repo's scripts, same as the Key
// Invariants projection, to avoid a coordinated cross-repo release for a capability the CLI's
// renderer cannot express yet.
//
// Anchored on the "Extensions" overview concept's own Description paragraph
// (`record:concepts/extensions-overview`) rather than a heading: three unrelated headings in the
// rendered output are literally the text "Extensions" (the Part, the `part:extensions` concept, and
// this overview concept), so a heading-text anchor would be ambiguous. The Description text is
// unique in the corpus. The index is inserted immediately after it, before the first extension leaf.
//
// The "**Description**: " label prefix is optional (srs#794): concept-leaf-view renders a
// concept's description with labelMode: "none", so the label no longer precedes the text on
// spec-document-view/unified-document-view. Matching both forms keeps this anchor valid
// regardless of which View (if any) a future composition change dispatches this record through.
const ANCHOR_RE =
  /^(?:\*\*Description\*\*: )?Extensions are optional, independently adoptable capability modules\. Each declares its identifier, dependencies, and the types it defines\.\s*$/m;

/**
 * Insert the generated extension index immediately after the "Extensions" overview concept's
 * Description paragraph. Returns the new content, or `null` if that anchor is not present (caller
 * decides whether that's an error).
 */
export function injectExtensionIndex(rawContent, injectedContent) {
  // Normalize before scanning, same reason invariant-region.mjs does: an untranslated CRLF would
  // put a trailing '\r' on the anchor line the regex looks for.
  const content = rawContent.replace(/\r\n/g, "\n");
  const anchorMatch = ANCHOR_RE.exec(content);
  if (!anchorMatch) return null;

  const anchorEnd = anchorMatch.index + anchorMatch[0].length;
  const before = content.slice(0, anchorEnd);
  const after = content.slice(anchorEnd);
  return `${before}\n\n${injectedContent.trimEnd()}\n${after}`;
}
