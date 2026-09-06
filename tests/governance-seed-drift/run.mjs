#!/usr/bin/env node
/**
 * tests/governance-seed-drift/run.mjs — red-then-green for srs#550's governance-seed drift gate.
 *
 * `build-governance-seed.mjs --check` needs a real `srs` CLI (pinned) and resolves its own
 * REPO_ROOT from the script's own file location rather than an argv override (unlike the
 * Node-only guards under tests/guards/run.mjs, which pass a synthetic fixture root). So this test
 * works on a throwaway copy of the tree instead of a synthetic fixture, perturbing the CURRENT
 * governance version's committed seed and confirming the check catches it, then restoring it and
 * confirming the check passes again.
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)   # or set SRS_CLI_PATH/SRS_BIN yourself
 *   node tests/governance-seed-drift/run.mjs
 */
import { spawnSync } from "child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveSrsCli } from "../../scripts/lib/pinned-srs.mjs";
import { latestGovernanceVersion } from "../../scripts/lib/governance-versions.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let failures = 0;

function runCheck(cwd, env) {
  const r = spawnSync("node", [join(cwd, "scripts", "build-governance-seed.mjs"), "--check"], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function expect(label, { code, out }, { exit, contains = [] }) {
  const problems = [];
  if (code !== exit) problems.push(`exit ${code}, expected ${exit}`);
  for (const needle of contains) {
    if (!out.includes(needle)) problems.push(`output does not mention ${JSON.stringify(needle)}`);
  }
  if (problems.length === 0) {
    console.log(`  ✓ ${label}`);
    return;
  }
  failures++;
  console.error(`  ✗ ${label}: ${problems.join("; ")}`);
  console.error(out.split("\n").map((l) => `      ${l}`).join("\n"));
}

console.log("srs#550 — governance seed drift guard");

const srsCli = await resolveSrsCli(); // fails fast with the standard message if unset
const env = { SRS_CLI_PATH: srsCli, SRS_BIN: srsCli };

expect(
  "the committed seed for the CURRENT governance version matches a fresh build",
  runCheck(REPO, env),
  { exit: 0, contains: ["check: committed seed matches a fresh build"] },
);

// The violation: perturb the CURRENT version's committed seed on a throwaway copy of the tree
// (never the real checkout) and confirm the guard catches it.
const work = await mkdtemp(join(tmpdir(), "governance-seed-drift-"));
try {
  await cp(join(REPO, "scripts"), join(work, "scripts"), { recursive: true });
  await cp(join(REPO, "packages"), join(work, "packages"), { recursive: true });

  const version = latestGovernanceVersion(work);
  const seedPath = join(work, "packages", "com.mudemocracy.governance", version, "seed", "empty-governance-document.srsj");
  const original = await readFile(seedPath, "utf8");
  await writeFile(seedPath, `${original.trimEnd()} \n`); // one byte of drift: trailing whitespace

  expect(
    `rejects a perturbed committed seed for the current version (${version})`,
    runCheck(work, env),
    { exit: 1, contains: ["DRIFT: committed seed differs from a fresh build"] },
  );

  // Fixed forward: restore the original committed bytes. The guard is not simply always red.
  await writeFile(seedPath, original);
  expect(
    "accepts again once the committed seed is restored",
    runCheck(work, env),
    { exit: 0, contains: ["check: committed seed matches a fresh build"] },
  );
} finally {
  await rm(work, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} case(s) did not behave as specified.`);
  process.exit(1);
}
console.log("\n✓ The governance seed drift guard fails on the violation it exists to catch, and passes without it.");
