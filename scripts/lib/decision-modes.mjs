// The five decision modes, loaded from the single JSON source of truth.
//
// rfc-decision-7caca3a1 makes naming a mode mandatory for every charter-checked decision, and the
// mode selects the machinery: clear and complicated resolve through rules (cell citation, governing
// preference, past-decision search); complex resolves into rulings for the owner and explicitly not
// into guard compliance — forcing a single-cell citation there is the named premature-classification
// pathology; chaotic is outside the spec boundary until the situation again admits mapping.
//
// This module exists for the same reason pattern-grid-cells.mjs does, and is deliberately its twin.
// The vocabulary was hardcoded in check-rfc-integration.mjs — fifty lines below that same file's
// correct import of the cell slugs — so one drift class was solved and its identical sibling was
// left open in the same file (found by the #490 meaning-placement sweep).
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const DATA_PATH = join(dirname(fileURLToPath(import.meta.url)), "decision-modes.json");

let cached;

/** The five legal decision modes, as a Set. Cached after the first read. */
export async function loadDecisionModes(dataPath = DATA_PATH) {
  if (cached) return cached;
  const doc = JSON.parse(await readFile(dataPath, "utf8"));
  if (!Array.isArray(doc.modes) || doc.modes.length === 0) {
    throw new Error(`${dataPath} declares no modes — the vocabulary is empty`);
  }
  cached = new Set(doc.modes);
  return cached;
}
