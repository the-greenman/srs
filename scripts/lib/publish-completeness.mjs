// srs#396 guard — post-publish completeness.
//
// Every heading the renderer emits for a view must survive into the committed export, with one
// deliberate exception: the subsections RFC-016 (Change B) authorises `renderInvariants()` to
// replace wholesale — the direct `contains` members of the section titled "Key Invariants". Their
// hand-authored prose is superseded by the projected invariant list by design (Phase 2 cleanup of
// that prose is tracked separately, srs#117); everything else that disappears between render and
// publish is a real loss, which is exactly what this bug did to "Extension Interactions" and its
// subsections.
//
// Two independence properties matter for this to be a real guard rather than a check that agrees
// with itself:
//
// 1. The exempt set is derived from container membership (relations + record titles), discovered by
//    walking the whole `records/` tree the RFC-038-authoritative way (`rfc-038-tree.mjs`) rather than
//    two hardcoded subdirectories — a member record can land anywhere under `records/` (`record
//    create` output has landed in `records/tier-2/` before; see render-invariants.mjs's own note on
//    this exact failure mode).
// 2. Which raw headings are even eligible for exemption is scoped by SEQUENCE, not by a text-boundary
//    regex shared with `injectKeyInvariants`: walking the raw headings in document order, exemption
//    starts right after the "### Key Invariants" heading and continues only while each subsequent
//    heading's title is still owed against the per-title membership count; the first heading whose
//    title is not (or no longer) owed ends the run. A later, unrelated heading that happens to reuse
//    an exempt title (several are generic — "Distribution", "Relations", "Containers") is therefore
//    never exempted. This needs no boundary algorithm at all, so a regression in the fix's own
//    boundary logic cannot also blind this guard — the failure mode #396 itself was.
import { readFile } from "fs/promises";
import { loadInstances, loadRelations } from "./rfc-038-tree.mjs";

// ponytail: line-anchored, not fenced-code-block aware — see the matching note in
// invariant-region.mjs. A heading-shaped line inside a fenced example would misparse as a real
// heading here too. No invariant record contains a code fence today.
const HEADING_RE = /^(#{1,6}) (.+)$/gm;
const KEY_INVARIANTS_TITLE = "Key Invariants";

/**
 * Computed once per run and passed to both `checkPublishCompleteness` and its negative test
 * (tests/guards/check-publish-completeness.mjs) — a full walk + parse of `records/` and `relations/`
 * is not free, and both callers want the same answer from the same repository state.
 */
export async function keyInvariantsExemptTitleCounts(repoRoot) {
  const titleById = new Map();
  let keyInvariantsId = null;
  for (const { record } of await loadInstances(repoRoot)) {
    if (typeof record?.instanceId !== "string") continue;
    const title = record.fieldValues?.title;
    if (typeof title === "string") titleById.set(record.instanceId, title);
    if (title === KEY_INVARIANTS_TITLE && record.typeName === "section") {
      keyInvariantsId = record.instanceId;
    }
  }
  if (!keyInvariantsId) {
    throw new Error(`no records/**/*.json record has typeName "section" and title ${JSON.stringify(KEY_INVARIANTS_TITLE)}`);
  }

  // The full `contains` subtree, not just direct children — `render_service.rs` descends
  // recursively (gated on `titleFieldId`, which every com.semanticops.spec/section and /subsection
  // record carries), so a grandchild under one of Key Invariants' 21 current members would render
  // inside the same wholesale-replaced region just as they do. No such grandchild exists in the
  // corpus today, but the exemption should track what the renderer actually does, not today's depth.
  const childrenOf = new Map();
  for (const { relation } of await loadRelations(repoRoot)) {
    if (relation.relationType !== "contains") continue;
    if (!childrenOf.has(relation.sourceInstanceId)) childrenOf.set(relation.sourceInstanceId, []);
    childrenOf.get(relation.sourceInstanceId).push(relation.targetInstanceId);
  }

  const counts = new Map();
  const queue = [...(childrenOf.get(keyInvariantsId) ?? [])];
  const seen = new Set();
  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const title = titleById.get(id);
    if (title) counts.set(title, (counts.get(title) ?? 0) + 1);
    queue.push(...(childrenOf.get(id) ?? []));
  }
  return counts;
}

function extractHeadings(content) {
  // Normalize before scanning — same reason as invariant-region.mjs's injectKeyInvariants.
  const normalized = content.replace(/\r\n/g, "\n");
  return [...normalized.matchAll(HEADING_RE)].map((m) => ({ line: m[0], text: m[2] }));
}

function lineMultiset(headings) {
  const counts = new Map();
  for (const h of headings) counts.set(h.line, (counts.get(h.line) ?? 0) + 1);
  return counts;
}

/**
 * entries: VIEW_EXPORTS-shaped list ({ id, output, requiresKeyInvariants? }).
 * rawContentsById: { [entry.id]: freshly rendered, un-injected markdown for that view }.
 * exemptCounts: from `keyInvariantsExemptTitleCounts(repoRoot)`.
 *
 * Throws with every offending export + heading named if anything is missing.
 */
export async function checkPublishCompleteness(entries, rawContentsById, exemptCounts) {
  const problems = [];

  for (const entry of entries) {
    const raw = rawContentsById[entry.id];
    if (raw === undefined) {
      throw new Error(`no raw render captured for view ${entry.id} (${entry.output})`);
    }
    const committedCounts = lineMultiset(extractHeadings(await readFile(entry.output, "utf8")));
    const remainingExempt = new Map(exemptCounts);
    let inRegion = false;

    for (const h of extractHeadings(raw)) {
      if (h.text === KEY_INVARIANTS_TITLE) {
        inRegion = entry.requiresKeyInvariants === true;
      } else if (inRegion) {
        const left = remainingExempt.get(h.text) ?? 0;
        if (left > 0) {
          remainingExempt.set(h.text, left - 1);
          continue;
        }
        inRegion = false;
      }

      const have = committedCounts.get(h.line) ?? 0;
      if (have > 0) {
        committedCounts.set(h.line, have - 1);
      } else {
        problems.push(`${entry.output}: renderer emits ${JSON.stringify(h.line)} but it is missing from the published file`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `${problems.length} heading(s) the renderer emits are missing from published exports:\n` +
        problems.map((p) => `  - ${p}`).join("\n")
    );
  }
}
