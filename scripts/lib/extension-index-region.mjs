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

// srs#801 successor finding (idempotency defect, same class as invariant-region.mjs): bound the
// inserted region with markers so a re-run recognises and replaces a PRIOR injection rather than
// inserting a second copy after the same anchor. Without this, a second `publish-spec.mjs` run
// over already-injected content leaves the anchor text intact (it is never consumed) and inserts
// the table again immediately after it.
const REGION_START = "<!-- srs-generated:extension-index:start -->";
const REGION_END = "<!-- srs-generated:extension-index:end -->";

/**
 * Insert the generated extension index immediately after the "Extensions" overview concept's
 * Description paragraph, replacing any previously-injected copy. Returns the new content, or
 * `null` if the anchor is not present in the de-injected base content (caller decides whether
 * that's an error).
 */
export function injectExtensionIndex(rawContent, injectedContent) {
  // Normalize before scanning, same reason invariant-region.mjs does: an untranslated CRLF would
  // put a trailing '\r' on the anchor line the regex looks for.
  const normalized = rawContent.replace(/\r\n/g, "\n");
  // Strip any previously-injected region before searching for the anchor, so a repeat run
  // replaces rather than duplicates. The whitespace immediately outside the markers is trimmed
  // too (not just the markers themselves) — otherwise the blank-line padding this function always
  // adds around the region accumulates by one line pair per call, which is non-idempotent in a
  // way a content-only diff (e.g. `(match(...) ?? []).length`) would not catch, only a byte-for-
  // byte comparison would (srs#801 successor finding).
  const startIdx = normalized.indexOf(REGION_START);
  const endIdx = normalized.indexOf(REGION_END);
  const content =
    startIdx !== -1 && endIdx !== -1 && endIdx > startIdx
      ? `${normalized.slice(0, startIdx).replace(/\n+$/, "")}\n${normalized
          .slice(endIdx + REGION_END.length)
          .replace(/^\n+/, "")}`
      : normalized;

  const anchorMatch = ANCHOR_RE.exec(content);
  if (!anchorMatch) return null;

  const anchorEnd = anchorMatch.index + anchorMatch[0].length;
  const before = content.slice(0, anchorEnd).replace(/\n+$/, "");
  const after = content.slice(anchorEnd).replace(/^\n+/, "");
  return `${before}\n\n${REGION_START}\n${injectedContent.trimEnd()}\n${REGION_END}\n\n${after}`;
}
