#!/usr/bin/env node
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

// RFC-039: the carrier keys by Field.name.
const INVARIANT_NUMBER_FIELD = "invariant_number";
const CONSTRAINT_FIELD = "normative_statement";

const CONCEPT_TYPE = "com.semanticops.spec/concept";

function getFieldValue(record, name) {
  return record.fieldValues?.[name];
}

function parseSortKey(rawValue, filename) {
  if (typeof rawValue === "number") {
    return rawValue;
  }
  if (typeof rawValue === "string" && /^I-\d+$/.test(rawValue)) {
    return parseInt(rawValue.slice(2), 10);
  }
  // srs#242 Phase B: invariant_number is a string Field (v2) — legacy numeric
  // values were stringified display-identically ("17"), so bare digit strings
  // carry the same sort key they always did.
  if (typeof rawValue === "string" && /^\d+$/.test(rawValue)) {
    return parseInt(rawValue, 10);
  }
  throw new Error(
    `Malformed invariant-number value in ${filename}: ${JSON.stringify(rawValue)} — ` +
      `expected a digit string, an I-<n> string, or a legacy JSON number`
  );
}

function renderLabel(rawValue) {
  if (typeof rawValue === "number") return `**${rawValue}.**`;
  return `**${rawValue}.**`;
}

function sanitizeConstraint(body) {
  return body.replace(/\n\n---\s*$/, "").replace(/\n---\s*$/, "");
}

/**
 * The repository-relative root this projection reads, exported so the publication reachability
 * guard (#285) takes the projection's scope *from the projection* instead of restating it. RFC-016
 * [R1] makes every record here a published record even though no DocumentView section selects it —
 * injection happens after render — so a reachability definition quantifying only over views would
 * call all 125 of them invisible.
 */
export const INVARIANT_PROJECTION_ROOT = "records/invariants";

/**
 * True when a repo-relative instance path is a DIRECT child of the projection root — the exact test
 * `renderInvariants` applies by construction (a flat `readdir`, not a recursive walk), and the one
 * both placement guards (#285's reachability guard and #410's stray-invariant guard) must apply too.
 * Defined once so the two guards cannot drift on what "in the root" means, the same reason
 * INVARIANT_PROJECTION_ROOT itself is exported rather than restated.
 */
export function isInInvariantProjectionRoot(path) {
  if (!path.startsWith(`${INVARIANT_PROJECTION_ROOT}/`)) return false;
  const rest = path.slice(INVARIANT_PROJECTION_ROOT.length + 1);
  return !rest.includes("/");
}

/**
 * The two rendered presentations whose output MUST contain the `### Key Invariants` heading —
 * they render the full specification via a discovery-query over `com.semanticops.spec/section`, which
 * includes the Key Invariants section, so its absence from their output is a regression rather
 * than an expected omission (unlike the rationale/RFC-catalog/RFC-decision-log presentations,
 * which never render that section).
 *
 * This is orthogonal to `manifest.renderedPresentations` (#411 / RFC-015): that field is
 * authoritative for *what is rendered* (viewId, output path, format). This set is a Node-pipeline
 * assertion, scoped by RFC-016 [R1], about which of those renders must carry the projection — a
 * different question with a different owner, so it is not a property on RenderedPresentation.
 */
export const REQUIRES_KEY_INVARIANTS_VIEW_IDS = new Set([
  "3a000001-0000-4000-a000-000000000001", // srs-spec-document-view (docs/spec/srs-spec.md)
  "3a000004-0000-4000-a000-000000000004", // srs-unified-document-view (docs/spec/srs-unified.md)
]);

/** Walk a directory tree and return every parsed JSON file. */
async function walkJson(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkJson(p)));
    else if (e.name.endsWith(".json")) out.push(JSON.parse(await readFile(p, "utf8")));
  }
  return out;
}

/**
 * The concept tree's reading order (RFC-042 [R3]): the pre-order traversal of the root container's
 * Parts (its non-identity members, in Rule [N+12] `precedes` order), descending each Part's `contains`
 * subtree with siblings ordered by their own `precedes` chain. Returns { childrenOf, precedesOrder,
 * order, visited, visit } — `order` is filled in as `visit(partId)` is called by the caller for each
 * Part in root-container order.
 *
 * #563 has not yet hung every concept under a Part, so a concept unreachable from any Part is appended
 * after every reachable one by the caller — this keeps grouping deterministic without inventing a
 * position the tree does not yet assign.
 */
function computeConceptReadingOrder(records, relations) {
  const conceptIds = new Set(
    records.filter((r) => r.typeNamespace && `${r.typeNamespace}/${r.typeName}` === CONCEPT_TYPE).map((r) => r.instanceId)
  );
  const childrenOf = new Map(); // parent concept -> [child concept...], contains edges only
  for (const r of relations) {
    if (r.relationType !== "contains") continue;
    if (!conceptIds.has(r.sourceInstanceId) || !conceptIds.has(r.targetInstanceId)) continue;
    childrenOf.set(r.sourceInstanceId, [...(childrenOf.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
  }
  const precedesOf = new Map(); // id -> [id...] this precedes
  for (const r of relations) {
    if (r.relationType !== "precedes") continue;
    precedesOf.set(r.sourceInstanceId, [...(precedesOf.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
  }
  /** topological order of `ids` under the `precedes` chain restricted to `ids` */
  function precedesOrder(ids) {
    const idSet = new Set(ids);
    const before = new Map(ids.map((id) => [id, new Set()]));
    for (const id of ids) {
      for (const next of precedesOf.get(id) ?? []) {
        if (idSet.has(next)) before.get(next).add(id);
      }
    }
    const result = [];
    const remaining = new Set(ids);
    while (remaining.size) {
      const ready = ids.filter((id) => remaining.has(id) && [...before.get(id)].every((p) => !remaining.has(p)));
      if (ready.length === 0) {
        // a cycle or otherwise undetermined subset — fall back to declaration order for the rest,
        // deterministic rather than a build failure (check-spec-coherence is the place that fails
        // the build over ordering defects; this projection renders best-effort).
        for (const id of ids) if (remaining.has(id)) { result.push(id); remaining.delete(id); }
        break;
      }
      for (const id of ready) { result.push(id); remaining.delete(id); }
    }
    return result;
  }

  const order = [];
  const visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    order.push(id);
    for (const child of precedesOrder(childrenOf.get(id) ?? [])) visit(child);
  }

  return { conceptIds, childrenOf, precedesOf, precedesOrder, order, visited, visit };
}

export async function renderInvariants(repoPath) {
  const invariantsDir = join(repoPath, INVARIANT_PROJECTION_ROOT);
  const entries = await readdir(invariantsDir);
  const jsonFiles = entries.filter((f) => f.endsWith(".json")).sort();

  const records = [];
  for (const filename of jsonFiles) {
    const raw = await readFile(join(invariantsDir, filename), "utf8");
    const record = JSON.parse(raw);

    const rawNum = getFieldValue(record, INVARIANT_NUMBER_FIELD);
    const constraint = getFieldValue(record, CONSTRAINT_FIELD);

    if (rawNum === undefined) {
      throw new Error(
        `Invariant record ${filename} is missing the Number field (${INVARIANT_NUMBER_FIELD})`
      );
    }
    if (constraint === undefined) {
      throw new Error(
        `Invariant record ${filename} is missing the Constraint field (${CONSTRAINT_FIELD})`
      );
    }

    const sortKey = parseSortKey(rawNum, filename);

    records.push({
      instanceId: record.instanceId,
      filename,
      sortKey,
      rawNum,
      constraint: sanitizeConstraint(constraint),
    });
  }

  records.sort((a, b) => a.sortKey - b.sortKey);

  // Invariant numbers must be unique. Duplicates previously went undetected
  // because records created via `record create` landed in records/tier-2/
  // (outside this scan) and repo validate does not check number uniqueness
  // (srs#171 cleanup). Fail loudly here so it cannot recur silently.
  const seen = new Map();
  for (const rec of records) {
    if (seen.has(rec.sortKey)) {
      throw new Error(
        `Duplicate invariant number ${rec.rawNum}: at least two invariant records ` +
          `in records/invariants/ share it. Invariant numbers must be unique.`
      );
    }
    seen.set(rec.sortKey, rec.rawNum);
  }

  // RFC-042 [R9]: an invariant's group is its `contains` parent, which must be a `concept` —
  // superseding RFC-016 [R6]'s free-text `applies_to` grouping. An invariant with no parent, or
  // whose parent is not a concept, is check 2's job to report (`check-spec-coherence.mjs`, one-home
  // / no-orphan-leaf); this projection assumes a clean corpus and fails loudly rather than inventing
  // an "Other" bucket if that assumption is violated, matching RFC-042 Change E's text exactly.
  const allRecords = await walkJson(join(repoPath, "records"));
  const allRelations = await walkJson(join(repoPath, "relations"));
  const conceptTitleById = new Map();
  for (const r of allRecords) {
    if (r.typeNamespace && r.typeName && `${r.typeNamespace}/${r.typeName}` === CONCEPT_TYPE) {
      conceptTitleById.set(r.instanceId, r.fieldValues?.title ?? r.instanceId);
    }
  }
  const invariantIds = new Set(records.map((r) => r.instanceId));
  const parentOf = new Map();
  for (const r of allRelations) {
    if (r.relationType !== "contains" || !invariantIds.has(r.targetInstanceId)) continue;
    if (parentOf.has(r.targetInstanceId)) {
      throw new Error(
        `Invariant ${r.targetInstanceId} has more than one contains parent — check-spec-coherence.mjs ` +
          `(one-home) should have caught this before render`
      );
    }
    parentOf.set(r.targetInstanceId, r.sourceInstanceId);
  }
  for (const rec of records) {
    const parentId = parentOf.get(rec.instanceId);
    if (!parentId) {
      throw new Error(
        `Invariant ${rec.rawNum} (${rec.filename}) has no contains parent — check-spec-coherence.mjs ` +
          `(no-orphan-leaf) should have caught this before render`
      );
    }
    if (!conceptTitleById.has(parentId)) {
      throw new Error(
        `Invariant ${rec.rawNum} (${rec.filename})'s contains parent ${parentId} is not a ` +
          `${CONCEPT_TYPE} record — RFC-042 [R9] requires the parent to be a concept`
      );
    }
    rec.parentId = parentId;
  }

  // Reading order (RFC-042 [R3]): pre-order traversal of the concept tree, Parts in root-container
  // order, siblings by `precedes`. Groups render in that order; a concept unreachable from any Part
  // (#563 not yet complete) falls back to first-invariant-encountered order, appended after every
  // reachable concept.
  const manifestPath = join(repoPath, "manifest.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : {};
  const rootContainer = manifest.container ?? {};
  const identity = rootContainer.identityInstanceId;
  const rootMembers = [...new Set([...(rootContainer.memberInstanceIds ?? []), ...(rootContainer.rootInstanceIds ?? [])])];
  const parts = rootMembers.filter((m) => m !== identity);

  const { childrenOf, precedesOrder, order, visit } = computeConceptReadingOrder(allRecords, allRelations);
  for (const part of precedesOrder(parts.filter((p) => childrenOf.has(p) || conceptTitleById.has(p)))) visit(part);
  // any concept with invariants that the Part walk did not reach (pre-#563 gap) still needs a position
  for (const rec of records) if (!order.includes(rec.parentId)) order.push(rec.parentId);

  const positionOf = new Map(order.map((id, i) => [id, i]));
  const groupOrder = [];
  const groups = new Map();
  for (const rec of records) {
    if (!groups.has(rec.parentId)) {
      groupOrder.push(rec.parentId);
      groups.set(rec.parentId, []);
    }
    groups.get(rec.parentId).push(rec);
  }
  groupOrder.sort((a, b) => (positionOf.get(a) ?? Infinity) - (positionOf.get(b) ?? Infinity));

  const lines = ["Conforming implementations must uphold the following invariants."];
  for (const parentId of groupOrder) {
    lines.push(`#### ${conceptTitleById.get(parentId)}`, "");
    for (const rec of groups.get(parentId)) {
      lines.push(`${renderLabel(rec.rawNum)} ${rec.constraint}`, "");
    }
  }

  return lines.join("\n");
}
