#!/usr/bin/env node
/**
 * tests/relation-conformance/run.mjs — runs conformance/relations/scenarios.json (srs#180, the
 * relation layer's enforcement point, R10 of the relation principles srs#171) against the pinned
 * srs CLI. Each scenario works on a fresh copy of conformance/relations/fixture-repo: `steps` run
 * in order (`cli` arguments without --repo, optional `stdin` JSON, `expect` on the envelope:
 * `ok`, `errorCode`, `diagnosticIncludes`), then `afterValidate` (the `repo validate` error count
 * and each expected warning as a message substring). `$NAME` is substituted from the `ids` table.
 * A scenario with `pending` is not run; it must name its srs-rust issue.
 *
 * Bite pass: the runner then alters one expected error code and one expected warning in memory and
 * requires the run to fail, so the check cannot pass vacuously (guards-bite discipline).
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)
 *   node tests/relation-conformance/run.mjs
 */
import { spawnSync } from "child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { resolveSrsCli } from "../../scripts/lib/pinned-srs.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(REPO, "conformance/relations");
const SRS = await resolveSrsCli();
const loaded = JSON.parse(readFileSync(join(DIR, "scenarios.json"), "utf8"));

const sub = (doc, v) =>
  typeof v === "string"
    ? v.replace(/\$([A-Z0-9_]+)/g, (m, k) => doc.ids[k] ?? m)
    : Array.isArray(v)
      ? v.map((x) => sub(doc, x))
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(doc, x)]))
        : v;

function srs(repo, args, stdin) {
  const r = spawnSync(SRS, [...args, "--repo", repo], { encoding: "utf8", input: stdin === undefined ? "" : JSON.stringify(stdin) });
  try {
    return JSON.parse(r.stdout);
  } catch {
    return { ok: false, parseFailure: `${r.status} ${r.stderr || r.stdout}` };
  }
}

function validate(repo) {
  const env = srs(repo, ["repo", "validate"]);
  const d = env.payload?.diagnostics ?? [];
  return { errors: env.payload?.summary?.errors, warnings: d.filter((x) => x.severity === "warning").map((x) => x.message), env };
}

function checkValidate(repo, want, problems, label) {
  const got = validate(repo);
  if (got.errors !== want.errors) problems.push(`${label}: validate reported ${got.errors} errors, expected ${want.errors}`);
  for (const w of want.warnings ?? []) if (!got.warnings.some((m) => m.includes(w))) problems.push(`${label}: validate reported no warning containing ${JSON.stringify(w)}`);
  const known = (want.warnings ?? []).concat("RFC-013 I-82");
  for (const m of got.warnings) if (!known.some((w) => m.includes(w))) problems.push(`${label}: unexpected warning ${JSON.stringify(m.slice(0, 160))}`);
}

function run(doc) {
  let failures = 0;
  const tmp = mkdtempSync(join(tmpdir(), "relconf-"));
  try {
    const base = join(tmp, "base");
    cpSync(join(DIR, "fixture-repo"), base, { recursive: true });
    const problems = [];
    checkValidate(base, sub(doc, doc.baseline), problems, "fixture baseline");
    if (problems.length) {
      failures++;
      console.error(`  ✗ fixture baseline: ${problems.join("; ")}`);
    } else console.log("  ✓ fixture baseline");
    for (const sc of doc.scenarios) {
      if (sc.pending) {
        if (!/^the-greenman\/srs-rust#\d+$/.test(sc.pending.issue)) {
          failures++;
          console.error(`  ✗ ${sc.id}: pending names no srs-rust issue (${sc.pending.issue})`);
        } else console.log(`  - ${sc.id}: pending ${sc.pending.issue}`);
        continue;
      }
      const repo = join(tmp, sc.id);
      cpSync(join(DIR, "fixture-repo"), repo, { recursive: true });
      const bad = [];
      sc.steps.forEach((step, i) => {
        const s = sub(doc, step);
        const env = srs(repo, s.cli, s.stdin);
        const want = s.expect ?? {};
        if (env.parseFailure) return bad.push(`step ${i + 1}: no JSON (${env.parseFailure.slice(0, 120)})`);
        if (want.ok !== undefined && env.ok !== want.ok) bad.push(`step ${i + 1}: ok=${env.ok}, expected ${want.ok}`);
        if (want.errorCode !== undefined && env.errors?.[0]?.code !== want.errorCode) bad.push(`step ${i + 1}: error code ${env.errors?.[0]?.code}, expected ${want.errorCode}`);
        if (want.diagnosticIncludes !== undefined && !(env.diagnostics ?? []).some((m) => String(m).includes(want.diagnosticIncludes))) bad.push(`step ${i + 1}: no diagnostic contains ${JSON.stringify(want.diagnosticIncludes)}`);
      });
      if (sc.afterValidate) checkValidate(repo, sub(doc, sc.afterValidate), bad, "after");
      if (bad.length) {
        failures++;
        console.error(`  ✗ ${sc.id} [${sc.rule}]: ${bad.join("; ")}`);
      } else console.log(`  ✓ ${sc.id} [${sc.rule}]`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return failures;
}

console.log("srs#180 — relation-layer conformance");
const failures = run(loaded);

console.log("bite: altered expectations must fail");
const altered = structuredClone(loaded);
altered.scenarios.find((s) => s.id === "dangling-target-refused").steps[0].expect.errorCode = "altered-code";
altered.baseline.warnings = ["lifecycle-advisory-relation-unsatisfied: altered"];
const origErr = console.error;
const origLog = console.log;
console.error = () => {};
console.log = () => {};
const biteFailures = run(altered);
console.error = origErr;
console.log = origLog;
let exit = failures ? 1 : 0;
if (biteFailures < 2) {
  console.error(`  ✗ bite: only ${biteFailures} of 2 altered expectations failed the run`);
  exit = 1;
} else console.log("  ✓ bite: both altered expectations failed the run");
process.exit(exit);
