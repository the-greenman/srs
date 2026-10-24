#!/usr/bin/env node
/**
 * tests/arrangement-storage/run.mjs — runs conformance/arrangement/storage-scenarios.json (RFC-051,
 * per-entry container storage, srs#949) against the pinned srs CLI.
 *
 * Each scenario works on a fresh copy of conformance/arrangement/fixture-repo:
 *   1. `given.files` are written (an object as one line with sorted keys and a trailing LF, RFC-051
 *      [R3]; `null` deletes the path); `given.flatten` turns every container back into its revision-10
 *      flat file (the logical form `container get` reports) and stamps the manifest 10;
 *   2. `git` (optional) commits that tree, runs each branch's `steps` on its own branch, then merges
 *      the second branch into the first with plain git;
 *   3. `steps` run in order (`cli` arguments without `--repo`, optional `expect` on the envelope by
 *      dotted path);
 *   4. `expect` is checked: `merge`, `outline` (container get), `writes` (the exact set of container
 *      files the steps changed, with their bytes), `diagnostics` (each `{code, severity}` reported by
 *      `repo validate`), `fatal` (the code that makes the catalog unloadable), `noArrangementWarnings`,
 *      `fixtureBytes` (every container file equals the committed fixture's).
 * Ids are written `$NAME` in the scenario file and substituted from its `ids` table.
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)
 *   node tests/arrangement-storage/run.mjs
 */
import { spawnSync } from "child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { resolveSrsCli } from "../../scripts/lib/pinned-srs.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(REPO, "conformance/arrangement");
const FIXTURE = join(DIR, "fixture-repo");
const SRS = await resolveSrsCli();
const doc = JSON.parse(readFileSync(join(DIR, "storage-scenarios.json"), "utf8"));
const sub = (v) =>
  typeof v === "string"
    ? v.replace(/\$([A-Z0-9_]+)/g, (m, k) => doc.ids[k] ?? m)
    : Array.isArray(v)
      ? v.map(sub)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [sub(k), sub(x)]))
        : v;

// RFC-051 [R3]: one line, keys in byte order, no insignificant whitespace, trailing LF.
const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const line = (v) => (typeof v === "string" ? v : `${JSON.stringify(sortKeys(v))}\n`);

function srs(repo, args) {
  const r = spawnSync(SRS, [...args, "--repo", repo], { encoding: "utf8" });
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new Error(`srs ${args.join(" ")}: no JSON (${r.status}) ${r.stderr}`);
  }
}

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
function git(repo, args, mustPass = true) {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8", env: GIT_ENV });
  if (mustPass && r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.status === 0;
}

function snapshot(repo) {
  const out = {};
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else out[p.slice(repo.length + 1)] = readFileSync(p, "utf8");
    }
  };
  walk(join(repo, "containers"));
  return out;
}

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const codeOf = (d) => (typeof d === "string" ? d : d.message ?? "").replace(/^\[[^\]]*\]\s*/, "").split(":")[0].trim();

function flatten(repo) {
  // Read every container before writing any: one flat file makes the catalog unloadable.
  const all = srs(repo, ["container", "list"]).payload.containers.map(({ containerId }) => srs(repo, ["container", "get", containerId]).payload.container);
  for (const c of all) {
    const { containerId } = c;
    rmSync(join(repo, "containers", containerId), { recursive: true, force: true });
    writeFileSync(join(repo, "containers", `${containerId}.json`), `${JSON.stringify(c, null, 2)}\n`);
  }
  const m = JSON.parse(readFileSync(join(repo, "manifest.json"), "utf8"));
  writeFileSync(join(repo, "manifest.json"), `${JSON.stringify({ ...m, dataModelRevision: 10 }, null, 2)}\n`);
}

function runSteps(repo, steps, problems) {
  for (const step of steps ?? []) {
    const env = srs(repo, step.cli);
    if (!env.ok) problems.push(`step ${step.cli.join(" ")} failed: ${JSON.stringify(env.errors ?? env.diagnostics)}`);
    for (const [path, want] of Object.entries(step.expect ?? {})) {
      const got = get(env, path);
      if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`step ${step.cli.join(" ")}: ${path} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
  }
}

let failures = 0;
const fixtureFiles = snapshot(FIXTURE);
for (const raw of doc.scenarios) {
  const sc = sub(raw);
  const problems = [];
  const repo = join(mkdtempSync(join(tmpdir(), "arrangement-storage-")), "repo");
  try {
    cpSync(FIXTURE, repo, { recursive: true });
    if (sc.given?.flatten) flatten(repo);
    for (const [path, content] of Object.entries(sc.given?.files ?? {})) {
      const p = join(repo, path);
      if (content === null) rmSync(p, { recursive: true, force: true });
      else {
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, line(content));
      }
    }
    if (sc.git) {
      git(repo, ["init", "-q", "-b", "main"]);
      git(repo, ["add", "-A"]);
      git(repo, ["commit", "-q", "--no-gpg-sign", "-m", "base"]);
      for (const [branch, steps] of Object.entries(sc.git.branches)) {
        git(repo, ["checkout", "-q", "-b", branch, "main"]);
        runSteps(repo, steps, problems);
        git(repo, ["add", "-A"]);
        git(repo, ["commit", "-q", "--no-gpg-sign", "--allow-empty", "-m", branch]);
      }
      const [into, from] = sc.git.merge;
      git(repo, ["checkout", "-q", into]);
      const clean = git(repo, ["merge", "-q", "--no-edit", "--no-gpg-sign", from], false);
      const want = sc.expect.merge;
      if (want === "clean" && !clean) problems.push("the merge conflicted, expected a clean merge");
      if (want === "conflict" && clean) problems.push("the merge was clean, expected a visible conflict");
      // [R10]: a merge MAY conflict more than the per-path rule, but a clean result MUST equal it.
      if (!clean) {
        if (problems.length === 0) console.log(`  ✓ ${sc.name} (merge conflicted)`);
        else {
          failures++;
          console.error(`  ✗ ${sc.name}\n${problems.map((p) => `      ${p}`).join("\n")}`);
        }
        continue;
      }
    }
    const before = snapshot(repo);
    runSteps(repo, sc.steps, problems);
    const after = snapshot(repo);
    const e = sc.expect ?? {};

    for (const [cid, want] of Object.entries(e.outline ?? {})) {
      const got = srs(repo, ["container", "get", cid]).payload?.container?.memberInstanceIds ?? null;
      if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`outline of ${cid} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
    if (e.writes) {
      const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((p) => before[p] !== after[p]).sort();
      const want = Object.keys(e.writes).sort();
      if (JSON.stringify(paths) !== JSON.stringify(want)) problems.push(`wrote ${JSON.stringify(paths)}, expected exactly ${JSON.stringify(want)}`);
      for (const [p, content] of Object.entries(e.writes)) {
        const got = after[p] ?? null;
        const exp = content === null ? null : line(content);
        if (got !== exp) problems.push(`${p} is ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`);
      }
    }
    if (e.diagnostics || e.fatal || e.noArrangementWarnings) {
      const v = srs(repo, ["repo", "validate"]);
      const diags = [...(v.payload?.diagnostics ?? []), ...(v.diagnostics ?? [])];
      for (const want of e.diagnostics ?? []) {
        if (!diags.some((d) => codeOf(d) === want.code && (d.severity ?? "error") === want.severity)) {
          problems.push(`repo validate reports no ${want.severity} ${want.code}: ${JSON.stringify(diags.map(codeOf))}`);
        }
      }
      if (e.fatal) {
        const loadFailed = diags.some((d) => (typeof d === "string" ? d : d.message).includes(`catalog load failed: 1 fatal diagnostic(s); first: ${e.fatal}`));
        if (v.ok || !loadFailed) problems.push(`expected ${e.fatal} to make the catalog unloadable; ok=${v.ok}, ${JSON.stringify(diags.map(codeOf))}`);
      } else if (e.diagnostics && diags.some((d) => typeof d !== "string" && (d.message ?? "").includes("catalog load failed"))) {
        problems.push("the catalog failed to load, expected only the listed diagnostics");
      }
      if (e.noArrangementWarnings && diags.some((d) => codeOf(d).startsWith("arrangement-"))) {
        problems.push(`arrangement-* diagnostics remain: ${JSON.stringify(diags.map(codeOf))}`);
      }
    }
    if (e.fixtureBytes) {
      for (const p of [...new Set([...Object.keys(fixtureFiles), ...Object.keys(after)])]) {
        if (fixtureFiles[p] !== after[p]) problems.push(`${p} differs from the committed fixture`);
      }
    }
  } catch (err) {
    problems.push(String(err.message ?? err));
  } finally {
    rmSync(dirname(repo), { recursive: true, force: true });
  }
  if (problems.length === 0) console.log(`  ✓ ${sc.name}`);
  else {
    failures++;
    console.error(`  ✗ ${sc.name}\n${problems.map((p) => `      ${p}`).join("\n")}`);
  }
}

if (failures) {
  console.error(`\n✗ ${failures} of ${doc.scenarios.length} RFC-051 storage scenario(s) failed`);
  process.exit(1);
}
console.log(`\n✓ all ${doc.scenarios.length} RFC-051 storage scenarios pass against the pinned srs CLI`);
