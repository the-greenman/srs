// The Pattern Grid's twelve cell slugs, loaded from the single JSON source of truth (srs#462).
//
// rfc-decision-cce3c00e's standing rule: "every new RFC and decision names its cell. A proposal
// that contradicts its cell's preference is flagged at review; a proposal that lands in no cell is
// a finding against the grid itself." This module is what lets that rule be checked mechanically —
// the decision-record guard and the RFC-integration checker both import it, so neither can drift
// from the other's notion of which slugs are legal (the failure mode #462 exists to close: two
// consumers each hardcoding their own copy of the twelve names).
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const DATA_PATH = join(dirname(fileURLToPath(import.meta.url)), "pattern-grid-cells.json");

export const CELL_TAG_PREFIX = "cell:";

// rfc-decision-cce3c00e's standing rule ("every new RFC and decision names its cell") binds
// decisions and RFCs from this date forward (srs#462). Centralized here — not restated as an
// independent constant in each consumer — so the decision-record guard and the RFC-integration
// checker cannot drift to two different effective dates for what is meant to be one rule.
export const CELL_RULE_EFFECTIVE_DATE = "2026-08-23";

let cached;

/** The twelve legal cell slugs, as a Set. Cached after the first read. */
export async function loadCellSlugs(dataPath = DATA_PATH) {
  if (cached) return cached;
  const doc = JSON.parse(await readFile(dataPath, "utf8"));
  if (!Array.isArray(doc.cells) || doc.cells.length === 0) {
    throw new Error(`${dataPath} declares no cells — the vocabulary is empty`);
  }
  cached = new Set(doc.cells);
  return cached;
}

/** True when `tag` is a well-formed `cell:<slug>` tag naming a slug in the vocabulary. */
export function isCellTag(tag, slugs) {
  return typeof tag === "string" && tag.startsWith(CELL_TAG_PREFIX) && slugs.has(tag.slice(CELL_TAG_PREFIX.length));
}
