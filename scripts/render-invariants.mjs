#!/usr/bin/env node
import { readdir, readFile } from "fs/promises";
import { join } from "path";

// RFC-039: the carrier keys by Field.name.
const INVARIANT_NUMBER_FIELD = "invariant_number";
const CONSTRAINT_FIELD = "normative_statement";
const GROUP_FIELD = "applies_to";

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

function normalizeGroup(groupValue) {
  if (!groupValue) return null;
  let result = groupValue;
  const semiIdx = result.indexOf(";");
  if (semiIdx !== -1) {
    result = result.slice(0, semiIdx).trim();
  }
  const extIdx = result.indexOf(", ext:");
  const coreIdx = result.indexOf(", core");
  const splitIdx =
    extIdx !== -1 && coreIdx !== -1
      ? Math.min(extIdx, coreIdx)
      : extIdx !== -1
        ? extIdx
        : coreIdx;
  if (splitIdx !== -1) {
    result = result.slice(0, splitIdx).trim();
  }
  return result || null;
}

function sanitizeConstraint(body) {
  return body.replace(/\n\n---\s*$/, "").replace(/\n---\s*$/, "");
}

/**
 * The repository-relative root this projection reads, exported so the publication reachability
 * guard (#285) takes the projection's scope *from the projection* instead of restating it. RFC-016
 * [R1] makes every record here a published record even though no DocumentView section selects it —
 * injection happens after render — so a reachability definition quantifying only over views would
 * call all 124 of them invisible.
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
 * they render the full specification via a type-query over `com.semanticops.spec/section`, which
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
    const rawGroup = getFieldValue(record, GROUP_FIELD);
    const displayGroup = normalizeGroup(rawGroup);

    records.push({
      sortKey,
      rawNum,
      constraint: sanitizeConstraint(constraint),
      displayGroup,
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

  const groupOrder = [];
  const groups = new Map();
  let otherRecords = [];

  for (const rec of records) {
    if (rec.displayGroup === null) {
      otherRecords.push(rec);
    } else {
      if (!groups.has(rec.displayGroup)) {
        groupOrder.push(rec.displayGroup);
        groups.set(rec.displayGroup, []);
      }
      groups.get(rec.displayGroup).push(rec);
    }
  }

  if (otherRecords.length > 0) {
    groupOrder.push("Other");
    groups.set("Other", otherRecords);
  }

  const lines = ["Conforming implementations must uphold the following invariants."];
  for (const groupLabel of groupOrder) {
    lines.push(`#### ${groupLabel}`, "");
    for (const rec of groups.get(groupLabel)) {
      lines.push(`${renderLabel(rec.rawNum)} ${rec.constraint}`, "");
    }
  }

  return lines.join("\n");
}
