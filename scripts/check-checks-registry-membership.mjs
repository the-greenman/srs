#!/usr/bin/env node
/**
 * check-checks-registry-membership.mjs — every scripts/check-*.mjs file is declared in the one
 * conformance-checks registry (rfc-decision-19997e24, srs#495).
 *
 * The registry (scripts/checks.json) exists to make piecemeal addition of a new check
 * structurally impossible: a check script landing on disk with nobody adding it to the declared
 * surface is exactly the undeclared-structure defect the registry was built to close (the PR #493
 * incident, where check-release-drift.mjs sat outside the surface validate-all.mjs actually ran).
 * This guard is the enforcement half — it fails the build the moment the two go out of sync.
 *
 * Scope is deliberately narrow, matching the registry's own membership rule: only files directly
 * under scripts/ matching `check-*.mjs`. Registry entries for other shapes (gen-*.mjs --check,
 * migrate-*.mjs --check, the tests/ suites under `run.mjs`) are exempt from this naming
 * convention — issue #495's "no renames" ground rule binds new checks only, and only check-*.mjs
 * is a naming CONVENTION in the first place.
 *
 * This script is itself a check-*.mjs file, so it is declared in scripts/checks.json too —
 * self-referential, on purpose, so the registry cannot exempt its own enforcement mechanism.
 *
 *   node scripts/check-checks-registry-membership.mjs [root]   # root defaults to the repo root
 */
import { readFile, readdir } from "fs/promises";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS_DIR = join(ROOT, "scripts");
const REGISTRY_PATH = join(SCRIPTS_DIR, "checks.json");

const CHECK_SCRIPT_PATTERN = /^check-.*\.mjs$/;

async function main() {
  let registryRaw;
  try {
    registryRaw = await readFile(REGISTRY_PATH, "utf8");
  } catch (err) {
    console.log(`\n✗ could not read ${REGISTRY_PATH}: ${err.message}`);
    process.exit(1);
    return;
  }

  let registry;
  try {
    registry = JSON.parse(registryRaw);
  } catch (err) {
    console.log(`\n✗ ${REGISTRY_PATH} could not be parsed as JSON: ${err.message}`);
    process.exit(1);
    return;
  }

  const entries = Array.isArray(registry.checks) ? registry.checks : [];
  const declared = new Set(
    entries.map((entry) => entry.script).filter((script) => CHECK_SCRIPT_PATTERN.test(script)),
  );

  let dirEntries;
  try {
    dirEntries = await readdir(SCRIPTS_DIR, { withFileTypes: true });
  } catch (err) {
    console.log(`\n✗ could not read ${SCRIPTS_DIR}: ${err.message}`);
    process.exit(1);
    return;
  }

  const onDisk = dirEntries
    .filter((entry) => entry.isFile() && CHECK_SCRIPT_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  // A walk that found nothing is not a scripts/ directory with nothing to declare — it means the
  // root argument is wrong.
  if (onDisk.length === 0) {
    console.log(`\n✗ No scripts/check-*.mjs files found under ${SCRIPTS_DIR} — refusing to report success.`);
    process.exit(1);
    return;
  }

  const undeclared = onDisk.filter((name) => !declared.has(name));

  if (undeclared.length > 0) {
    console.log("");
    for (const name of undeclared) {
      console.log(`  ✗ scripts/${name} exists on disk but is not declared in scripts/checks.json`);
    }
    console.log(
      `\n✗ ${undeclared.length} check script(s) undeclared. Add an entry to scripts/checks.json ` +
        `for each — id, script, tier, cell, governing, description — before landing a new check.`,
    );
    process.exit(1);
    return;
  }

  console.log(`\n✓ Every scripts/check-*.mjs file is declared in scripts/checks.json (${onDisk.length} checked)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
