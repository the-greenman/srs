#!/usr/bin/env node
/**
 * check-decision-record-shape.mjs — a `com.semanticops.spec/rfc-decision` record dated after
 * 2026-09-07 carries exactly one independently reversible position (srs#607, owner ruling
 * 2026-09-07, comment 5573379090 — Option 1: "the guidance is sufficient; compound records are
 * the defect").
 *
 * Heuristic (deliberately cheap, per the ruling — not a semantic parse): a decision record is
 * compound if its `decision_statement` contains a numbered or bulleted disposition list of two or
 * more items (lines starting with `1.`, `2)`, `-`, or `*`). A record that lists two or more
 * separately-reversible dispositions under one instanceId is the defect the ruling names; one that
 * merely uses a list for exposition inside a single position is a false positive this heuristic
 * cannot distinguish — known ceiling, not a bug to chase without a real failure.
 *
 * `rfc-decision-4f1e12e5` is the legacy compound record (14 numbered dispositions) the ruling
 * explicitly grandfathers rather than rewrites — decomposing it would itself be a rewrite of a
 * charter record. It and every other pre-existing compound record found by this same heuristic are
 * seeded into scripts/decision-record-shape-allowlist.json; the enforcement floor (decision_date >
 * 2026-09-07) already excludes them, and the allowlist is a second, explicit line of defense against
 * a decision_date being backdated or corrected.
 *
 * Node pipeline only, per ADR-004 — an authoring-corpus rule, not a load-time invariant.
 *
 *   node scripts/check-decision-record-shape.mjs [root]   # root defaults to the repo root
 */
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadInstances } from "./lib/rfc-038-tree.mjs";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = `${ROOT}/srs`;
const ALLOWLIST_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "decision-record-shape-allowlist.json");

const TYPE_NAMESPACE = "com.semanticops.spec";
const TYPE_NAME = "rfc-decision";
const F_DECISION_DATE = "decision_date";
const F_DECISION_STATEMENT = "decision_statement";

// The ruling's floor: decision records dated on or before the ruling day are pre-existing corpus,
// not new violations. Shared shape with check-decision-cell-tags.mjs's ENFORCEMENT_FLOOR pattern.
const ENFORCEMENT_FLOOR = "2026-09-07";

// Two or more numbered/bulleted lines = a disposition list, the ruling's compound-record signal.
const LIST_ITEM_RE = /^[ \t]*(?:[0-9]+[.)]|[-*])\s+\S.*$/gm;

function listItemCount(statement) {
  if (typeof statement !== "string") return 0;
  return (statement.match(LIST_ITEM_RE) || []).length;
}

async function loadAllowlist() {
  const doc = JSON.parse(await readFile(ALLOWLIST_PATH, "utf8"));
  return new Map((doc.entries ?? []).map((e) => [e.instanceId, e]));
}

async function main() {
  const allowlist = await loadAllowlist();
  const instances = await loadInstances(REPO);
  const decisions = instances.filter(
    ({ record }) => record?.typeNamespace === TYPE_NAMESPACE && record?.typeName === TYPE_NAME,
  );

  console.log("Decision-record shape (srs#607)");

  if (decisions.length === 0) {
    console.log(`\n✗ No ${TYPE_NAMESPACE}/${TYPE_NAME} records found anywhere under ${REPO}.`);
    console.log(`  This repository normally carries well over 20 — an empty walk means the root is wrong.`);
    process.exit(1);
  }

  const inScope = decisions.filter(({ record }) => {
    const date = record.fieldValues?.[F_DECISION_DATE];
    return typeof date === "string" && date > ENFORCEMENT_FLOOR;
  });

  console.log(`  ${TYPE_NAMESPACE}/${TYPE_NAME} records checked: ${decisions.length}`);
  console.log(`  Dated after ${ENFORCEMENT_FLOOR} (in scope for this guard): ${inScope.length}`);
  console.log(`  Allowlisted legacy compound records: ${allowlist.size}`);

  const violations = [];
  for (const { path, record } of inScope) {
    if (allowlist.has(record.instanceId)) continue;
    const count = listItemCount(record.fieldValues?.[F_DECISION_STATEMENT]);
    if (count >= 2) violations.push({ path, record, count });
  }

  if (violations.length > 0) {
    console.log("");
    for (const { path, record, count } of violations) {
      console.log(`  ✗ ${path}`);
      console.log(
        `    ${TYPE_NAMESPACE}/${TYPE_NAME} record ${record.instanceId} (decision_date ` +
          `${record.fieldValues?.[F_DECISION_DATE]}) has a ${count}-item numbered/bulleted ` +
          `disposition list in decision_statement — not one independently reversible position. ` +
          `Split it into separate rfc-decision records, one per position (srs#607, owner ruling ` +
          `2026-09-07). If this really is one position, rewrite decision_statement as prose without ` +
          `a disposition list.`,
      );
    }
  }

  if (violations.length > 0) {
    console.log(`\n✗ ${violations.length} compound decision record(s).`);
    process.exit(1);
  }

  console.log(
    `\n✓ Every ${TYPE_NAMESPACE}/${TYPE_NAME} record dated after ${ENFORCEMENT_FLOOR} carries one position (or is a documented legacy allowlist entry)`,
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
