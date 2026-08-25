#!/usr/bin/env node
/**
 * check-decision-compass-drift.mjs — the Decision Compass (`docs/charter/decision-compass.md`)
 * stays bidirectionally in sync with the charter-class decision records it exists to surface
 * (srs#461, part of the charter-presence stack srs#435).
 *
 * The defect this closes: the charter lives in decision records agents read only when pointed,
 * and the charter's own standing rule warns against exactly the failure shape that produces — "a
 * rule stated once, remaining sites silent". The compass is the ambient pointer surface; without
 * this guard the compass itself could drift the same way — a citation left dangling after a record
 * is renamed or removed, or a new charter-class ruling landed without ever being added to the page.
 *
 * Two independent checks, both fail-closed:
 *
 *   1. FORWARD — every `rfc-decision-<id>` citation appearing anywhere in the compass body
 *      resolves to an existing `srs/records/tier-2/rfc-decision-<id>.json`. Catches a dangling or
 *      mistyped citation, or a citation to a record that was later removed/renamed.
 *   2. BACKWARD — every id listed in the compass's own machine-readable `<!-- srs-charter-ids:v1
 *      -->` block (the charter-class record roster the compass maintains at its top) is cited
 *      somewhere in the body. Catches a charter-class ruling added to the roster without the
 *      section that actually documents it — declaring presence without delivering it.
 *
 * This is bidirectional presence, not text equality (per srs#461): the roster and the body are two
 * different lists that must agree, not one list checked against itself.
 *
 *   node scripts/check-decision-compass-drift.mjs [root]   # root defaults to the repo root
 */
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const COMPASS_PATH = `${ROOT}/docs/charter/decision-compass.md`;
const RECORDS_DIR = `${ROOT}/srs/records/tier-2`;

const ROSTER_BLOCK_RE = /<!--\s*srs-charter-ids:v1([\s\S]*?)-->/;
const CITATION_RE = /rfc-decision-([0-9a-f]{8})/g;
const ROSTER_ID_RE = /\b([0-9a-f]{8})\b/g;

function recordExists(id) {
  return existsSync(`${RECORDS_DIR}/rfc-decision-${id}.json`);
}

async function main() {
  console.log("Decision Compass drift (srs#461)");

  let text;
  try {
    text = await readFile(COMPASS_PATH, "utf8");
  } catch {
    console.log(`\n✗ ${COMPASS_PATH} does not exist.`);
    process.exit(1);
  }

  const rosterMatch = text.match(ROSTER_BLOCK_RE);
  if (!rosterMatch) {
    console.log(
      `\n✗ No <!-- srs-charter-ids:v1 ... --> block found in ${COMPASS_PATH}. ` +
        `The compass must carry a machine-readable roster of the charter-class decision records ` +
        `it documents.`,
    );
    process.exit(1);
  }

  // The roster block itself is excluded from the citation scan below, so a record id merely
  // *listed* in the roster comment does not count as being *cited* in the body — the roster is the
  // requirement, the body outside it is what must satisfy the requirement.
  const rosterBlockText = rosterMatch[0];
  const bodyText = text.slice(rosterMatch.index + rosterBlockText.length);

  const rosterIds = [...new Set([...rosterMatch[1].matchAll(ROSTER_ID_RE)].map((m) => m[1]))];
  const bodyCitations = [...new Set([...bodyText.matchAll(CITATION_RE)].map((m) => m[1]))];

  if (rosterIds.length === 0) {
    console.log(`\n✗ The srs-charter-ids:v1 roster in ${COMPASS_PATH} is empty.`);
    process.exit(1);
  }

  console.log(`  Roster ids: ${rosterIds.length}`);
  console.log(`  Body citations: ${bodyCitations.length}`);

  // FORWARD: every citation in the body resolves to an existing record.
  const danglingCitations = bodyCitations.filter((id) => !recordExists(id));

  // BACKWARD: every roster id is cited somewhere in the body.
  const uncitedRosterIds = rosterIds.filter((id) => !bodyCitations.includes(id));

  let ok = true;

  if (danglingCitations.length > 0) {
    ok = false;
    console.log("");
    for (const id of danglingCitations) {
      console.log(
        `  ✗ The compass cites rfc-decision-${id}, but ${RECORDS_DIR}/rfc-decision-${id}.json ` +
          `does not exist. Fix the citation or remove it — a compass line must point at a real ` +
          `ruling, never a dangling one.`,
      );
    }
  }

  if (uncitedRosterIds.length > 0) {
    ok = false;
    console.log("");
    for (const id of uncitedRosterIds) {
      console.log(
        `  ✗ rfc-decision-${id} is in the compass's srs-charter-ids:v1 roster but is not cited ` +
          `anywhere in the compass body. A charter-class record needs the section that documents ` +
          `it, not just a roster entry — write the section, or remove the id if it is not (or no ` +
          `longer) charter-class.`,
      );
    }
  }

  if (!ok) {
    console.log(`\n✗ Decision Compass drift found.`);
    process.exit(1);
  }

  console.log(`\n✓ Every roster id is cited in the compass, and every citation resolves to a record.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
