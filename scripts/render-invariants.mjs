#!/usr/bin/env node
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const INVARIANT_NUMBER_FIELD = "1a000020-0000-4000-a000-000000000020";
const CONSTRAINT_FIELD = "1a000003-0000-4000-a000-000000000003";
const GROUP_FIELD = "1a000021-0000-4000-a000-000000000021";

function getFieldValue(record, fieldId) {
  const fv = record.fieldValues?.find((f) => f.fieldId === fieldId);
  return fv !== undefined ? fv.value : undefined;
}

function parseSortKey(rawValue, filename) {
  if (typeof rawValue === "number") {
    return rawValue;
  }
  if (typeof rawValue === "string" && /^I-\d+$/.test(rawValue)) {
    return parseInt(rawValue.slice(2), 10);
  }
  throw new Error(
    `Malformed invariant-number value in ${filename}: ${JSON.stringify(rawValue)} — ` +
      `expected a JSON number or a string matching ^I-\\d+$`
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

export async function renderInvariants(repoPath) {
  const invariantsDir = join(repoPath, "records", "invariants");
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
