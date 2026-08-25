#!/usr/bin/env node
/**
 * check-decision-cell-tags.mjs — every `com.semanticops.spec/rfc-decision` record dated on or
 * after 2026-08-23 carries a `cell:<slug>` tag naming one of the Pattern Grid's twelve cells
 * (srs#462, rfc-decision-cce3c00e's standing rule).
 *
 * rfc-decision-cce3c00e ratified the Pattern Grid and, with it, a standing rule: "every new RFC
 * and decision names its cell. A proposal that contradicts its cell's preference is flagged at
 * review; a proposal that lands in no cell is a finding against the grid itself." That rule held
 * only by convention until now — a decision record could be written and ratified with no cell
 * attached, and nothing would notice. This guard makes it mechanical, the same way #410 made
 * invariant placement mechanical: fail-closed on every decision dated in the grid's own era or
 * later.
 *
 * The cutoff is the ratification date itself (2026-08-21) shifted to 2026-08-23, per the pool
 * issue's scope — the standing rule applies to decisions FROM this guard's landing forward; the
 * charter-era records already on the books before it (2026-08-19..22, the "August charter
 * records") are backfilled by hand as ordinary data, not required to have shipped with a mechanism
 * that did not exist yet. Records older than that (pre-charter) stay grandfathered indefinitely —
 * the grid did not exist when they were written and imposing it on them retroactively would not be
 * a "backfill", it would be inventing history.
 *
 * The vocabulary of legal slugs is the single JSON file `scripts/lib/pattern-grid-cells.json`
 * (`scripts/lib/pattern-grid-cells.mjs`) — the same one the RFC-integration checker
 * (`check-rfc-integration.mjs`) and the future Decision Compass (#461) read, so the three
 * consumers cannot each drift to their own copy of the twelve names.
 *
 * Node pipeline only, per ADR-004 — this is an authoring-corpus rule, not a load-time invariant
 * the embedded binary knows about.
 *
 *   node scripts/check-decision-cell-tags.mjs [root]   # root defaults to the repo root
 */
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadInstances } from "./lib/rfc-038-tree.mjs";
import { loadCellSlugs, isCellTag, CELL_TAG_PREFIX, CELL_RULE_EFFECTIVE_DATE } from "./lib/pattern-grid-cells.mjs";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = `${ROOT}/srs`;

const TYPE_NAMESPACE = "com.semanticops.spec";
const TYPE_NAME = "rfc-decision";
const F_DECISION_DATE = "decision_date";

// The standing rule binds decisions dated on or after the day this guard lands — see file header.
// Shared with check-rfc-integration.mjs's CELL_RULE_FLOOR via pattern-grid-cells.mjs, so the two
// checks cannot drift to different effective dates for what is meant to be one rule.
const ENFORCEMENT_FLOOR = CELL_RULE_EFFECTIVE_DATE;

async function main() {
  const slugs = await loadCellSlugs();
  const instances = await loadInstances(REPO);
  const decisions = instances.filter(
    ({ record }) => record?.typeNamespace === TYPE_NAMESPACE && record?.typeName === TYPE_NAME,
  );

  console.log("Decision-record cell tags (srs#462)");

  // A guard that checked nothing is not a guard that found nothing — the live corpus carries well
  // over 20 rfc-decision records.
  if (decisions.length === 0) {
    console.log(`\n✗ No ${TYPE_NAMESPACE}/${TYPE_NAME} records found anywhere under ${REPO}.`);
    console.log(`  This repository normally carries well over 20 — an empty walk means the root is wrong.`);
    process.exit(1);
  }

  const inScope = decisions.filter(({ record }) => {
    const date = record.fieldValues?.[F_DECISION_DATE];
    return typeof date === "string" && date >= ENFORCEMENT_FLOOR;
  });

  console.log(`  ${TYPE_NAMESPACE}/${TYPE_NAME} records checked: ${decisions.length}`);
  console.log(`  Dated ${ENFORCEMENT_FLOOR} or later (in scope for this guard): ${inScope.length}`);
  console.log(`  Legal cell slugs: ${[...slugs].join(", ")}`);

  const violations = [];
  for (const { path, record } of inScope) {
    const tags = Array.isArray(record.tags) ? record.tags : [];
    if (tags.some((t) => isCellTag(t, slugs))) continue;

    const cellTags = tags.filter((t) => typeof t === "string" && t.startsWith(CELL_TAG_PREFIX));
    const reason =
      cellTags.length === 0
        ? `carries no ${CELL_TAG_PREFIX}<slug> tag at all`
        : `carries ${cellTags.map((t) => `"${t}"`).join(", ")}, none of which names a slug in the vocabulary`;
    violations.push({ path, record, reason });
  }

  if (violations.length > 0) {
    console.log("");
    for (const { path, record, reason } of violations) {
      console.log(`  ✗ ${path}`);
      console.log(
        `    ${TYPE_NAMESPACE}/${TYPE_NAME} record ${record.instanceId} (decision_date ` +
          `${record.fieldValues?.[F_DECISION_DATE]}) ${reason}. Every decision dated ` +
          `${ENFORCEMENT_FLOOR} or later must carry at least one ${CELL_TAG_PREFIX}<slug> tag from ` +
          `the Pattern Grid vocabulary (rfc-decision-cce3c00e's standing rule; slugs in ` +
          `scripts/lib/pattern-grid-cells.json). A decision that lands in no cell is a finding ` +
          `against the grid itself, not a reason to skip the tag.`,
      );
    }
    console.log(`\n✗ ${violations.length} decision record(s) missing a valid cell tag.`);
    process.exit(1);
  }

  console.log(
    `\n✓ Every ${TYPE_NAMESPACE}/${TYPE_NAME} record dated ${ENFORCEMENT_FLOOR} or later carries a valid ${CELL_TAG_PREFIX}<slug> tag`,
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
