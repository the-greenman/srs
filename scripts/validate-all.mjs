#!/usr/bin/env node
/**
 * Run all validation scripts.
 *
 * The set of checks this runs is declared, not hand-wired: scripts/checks.json is the one
 * registry of every spec-repo conformance check (rfc-decision-19997e24, srs#495), each entry
 * naming its id, script, tier, guarded grid cell, and governing decision/RFC — read that file for
 * what each check asserts and why. This script is a loop over the registry's `always`-tier
 * entries, in array order (order matters for at least one entry — see its `afterId`). Checks
 * declared under other tiers (`pinned-cli`, `ci-only`) are NOT run here; they are named at the end
 * of every run precisely so an exit 0 here can never again be mistaken for full gate coverage —
 * that ambiguity is what shipped PR #493 red while check-release-drift.mjs sat outside this
 * surface undetected.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = join(__dirname, '..');
const CHECKS_REGISTRY_PATH = join(__dirname, 'checks.json');

async function loadChecksRegistry() {
  const raw = await readFile(CHECKS_REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(raw);
  return Array.isArray(registry.checks) ? registry.checks : [];
}

/**
 * Every package in the tree, DISCOVERED rather than listed (#391).
 *
 * A hardcoded list is the same defect #391 fixes at the kind level, one level up: `package/base`
 * and `package/core` carried package.json files that no run ever reached, and the published
 * governance packages — the only ones populating `views`, `documentViews`, `lifecycles`,
 * `blueprints` and `protocols`, so the only ones that exercise five of the ten kinds against
 * anything — were never validated either. Adding a 1.2.0 to a list would have left it unvalidated
 * forever, silently. So nothing is listed: the two package roots are walked.
 *
 * Scoped to `srs/package/**` and `packages/**` deliberately. `rfcs/rfc-004/proposed-package/**`
 * also holds package.json files; those are the historical RFC-004 proposal that #308's guard
 * likewise excludes, and they are not live packages.
 *
 * Paths come back relative to `srs/`, because validate-package.mjs joins them onto the spec repo
 * root — so the published packages are reached with a leading `../`.
 */
async function discoverPackages() {
  const walkRoot = async (absRoot, relFromSrs) => {
    const found = [];
    const walk = async (absDir, rel) => {
      let entries;
      try {
        entries = await readdir(absDir, { withFileTypes: true });
      } catch {
        return;
      }
      if (entries.some((e) => e.isFile() && e.name === 'package.json')) found.push(rel);
      for (const entry of entries) {
        // `node_modules` would be fed to validate-package.mjs as an SRS manifest and turn the run
        // red for a reason unrelated to the corpus. Nothing puts one here today; excluding it costs
        // one line and removes a way for this walk to be wrong later.
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          await walk(join(absDir, entry.name), `${rel}/${entry.name}`);
        }
      }
    };
    await walk(absRoot, relFromSrs);
    return found;
  };

  // PER-ROOT floors, not one floor on the union. A single `packages.length === 0` check cannot fire
  // while the other root still yields something: rename `srs/package` and the walk would return the
  // two published packages, print "Discovered 2 packages" and exit 0 having validated none of the
  // six spec packages. Each root must independently produce at least one.
  const roots = [
    { abs: join(REPO_ROOT, 'srs/package'), rel: 'package', label: 'srs/package/**' },
    { abs: join(REPO_ROOT, 'packages'), rel: '../packages', label: 'packages/**' },
  ];
  const found = [];
  const emptyRoots = [];
  for (const root of roots) {
    const packages = await walkRoot(root.abs, root.rel);
    if (packages.length === 0) emptyRoots.push(root.label);
    found.push(...packages);
  }
  return { packages: found.sort(), emptyRoots };
}

async function runScript(script, args = []) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    const child = spawn('node', [join(__dirname, script), ...args], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Where this runs: `scripts/check-release-drift.mjs` invokes this script as its first step, and
// that is what `.github/workflows/release-drift.yml` (a required check on every push and pull
// request) and `hooks/pre-commit` both run. Grepping the workflows for `validate-all` finds nothing
// and reads as "no CI runs this" — it does, one call deep.
async function validateAll() {
  console.log('Running all validations...\n');

  let allValid = true;

  const { packages, emptyRoots } = await discoverPackages();
  console.log(`Discovered ${packages.length} packages: ${packages.join(', ')}`);
  if (emptyRoots.length > 0) {
    // A walk that found nothing is not a tree with nothing to validate.
    console.log(`\n\u2717 No packages discovered under ${emptyRoots.join(' or ')} — refusing to report success.`);
    process.exit(1);
  }

  const registry = await loadChecksRegistry();
  const alwaysChecks = registry.filter((entry) => entry.tier === 'always');
  const deferredChecks = registry.filter((entry) => entry.tier !== 'always');

  // `afterId` is a real execution-order dependency (e.g. field-name-convention must run after
  // rfc-032-conformance-fixture regenerates its Field files, or it reads the previous run's
  // output), not a display grouping — so it is enforced here, against the registry's own declared
  // array order, rather than trusted to hold by convention.
  const positionById = new Map(alwaysChecks.map((entry, index) => [entry.id, index]));
  for (const entry of alwaysChecks) {
    if (!entry.afterId) continue;
    const afterPosition = positionById.get(entry.afterId);
    if (afterPosition === undefined || afterPosition > positionById.get(entry.id)) {
      console.log(
        `\n✗ scripts/checks.json: "${entry.id}" declares afterId "${entry.afterId}", but that check ` +
          `does not appear earlier in the registry array.`,
      );
      process.exit(1);
    }
  }

  for (const entry of alwaysChecks) {
    if (entry.dynamic === 'discovered-packages') {
      for (const pkg of packages) {
        const valid = await runScript(entry.script, [pkg]);
        if (!valid) allValid = false;
      }
      continue;
    }
    const valid = await runScript(entry.script, entry.args ?? []);
    if (!valid) allValid = false;
  }

  console.log(`\n${'='.repeat(60)}`);
  if (deferredChecks.length > 0) {
    console.log(`\n${deferredChecks.length} check(s) deferred to other tiers (not run by validate-all):`);
    for (const entry of deferredChecks) {
      const argsSuffix = entry.args?.length ? ` ${entry.args.join(' ')}` : '';
      console.log(`  - ${entry.id} (${entry.tier}): ${entry.script}${argsSuffix}`);
    }
  } else {
    console.log('\n0 checks deferred to other tiers.');
  }

  console.log(allValid ? '\n✓ All validations passed' : '\n✗ Some validations failed');
  process.exit(allValid ? 0 : 1);
}

validateAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
