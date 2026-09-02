#!/usr/bin/env node
/**
 * check-ledger-completeness.mjs — every docs/schema/2.0/*.json file has a row in the generation
 * ledger (srs#522).
 *
 * Cheap by design: the ledger only needs to *mention* each schema's filename in backticks
 * somewhere in its text — this is a completeness floor, not a content check. It exists because
 * every prior attempt to enumerate this file set grew on inspection (18 rows -> 24 files -> "24 +
 * up to 4"), and nothing asserted the ledger actually covers what is on disk today. A file added to
 * docs/schema/2.0/ with no ledger row is exactly the failure #522 was filed to close.
 *
 *   node scripts/check-ledger-completeness.mjs [root]
 */
import { readFile, readdir } from "fs/promises";
import { realpathSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SCHEMA_DIR = join(ROOT, "docs/schema/2.0");
const LEDGER = join(SCHEMA_DIR, "generation-ledger.md");

async function main() {
  const files = (await readdir(SCHEMA_DIR)).filter((f) => f.endsWith(".json")).sort();
  const ledger = await readFile(LEDGER, "utf8");
  const mentioned = new Set([...ledger.matchAll(/`([a-zA-Z0-9._-]+\.json)`/g)].map((m) => m[1]));

  console.log(`Generation ledger completeness (#522): ${files.length} schema file(s) in docs/schema/2.0/`);

  const missing = files.filter((f) => !mentioned.has(f));
  if (missing.length > 0) {
    console.log("");
    missing.forEach((f) => console.log(`  ✗ ${f}: no row in docs/schema/2.0/generation-ledger.md`));
    console.log(
      `\n✗ ${missing.length} schema file(s) have no ledger row. Add one (generated / generatable ` +
        "via a #272 unit / explicit exclusion + reason + decision citation), per srs#522.",
    );
    process.exit(1);
  }

  console.log(`\n✓ Every schema file in docs/schema/2.0/ has a row in the generation ledger (${files.length} checked)`);
}

// Run only when invoked as a script, not when imported. REALPATH BOTH SIDES — process.argv[1] is
// the literal string typed and is never symlink-resolved, so a raw comparison silently no-ops (and
// exits 0) for any invocation whose path traverses a link.
const invokedDirectly = (() => {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return realpathSync(resolve(argv1)) === realpathSync(self);
  } catch {
    return true; // fail towards running: a check that silently doesn't run reads as a pass
  }
})();

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
