#!/usr/bin/env node
/**
 * check-repository-cell.mjs — no manifest.json carries the retired `instanceIndex` key (srs#651).
 *
 * The grid census cycle-three read-out (`scripts/grid-census/readout-2026-09-06.md`, PR #645)
 * found the **repository** cell carrying zero enforcement checks, against three corpus statements
 * that all restate the same rule: `srs/records/invariants/invariant-049.json` (I-49),
 * `invariant-050.json` (I-50), `invariant-080.json` (I-80), and `07-15-ext-repository`'s own
 * conformance text all say membership is tree-authoritative (RFC-038 [R1]) and that a manifest
 * `instanceIndex` is retired (RFC-038 [R2]) — a repository's instance set is enumerated from the
 * tree, never read out of a manifest index. The smallest honest check, as the issue proposed it: a
 * mechanical parse asserting no `manifest.json` anywhere in the corpus carries that key.
 *
 * Whole-repo walk, not a fixed list of roots (srs/, programme/, docs/spec/examples/**,
 * conformance/**, packages/**) — same reasoning as check-versioning-cell.mjs and
 * check-field-name-convention.mjs: a fixed list silently excludes whatever tree grows a
 * manifest.json next. Every file literally named `manifest.json` is a candidate, whether it is a
 * repository manifest (docs/schema/2.0/manifest.json's shape) or a package manifest
 * (srs/package/metamodel/{fields,types}/manifest.json's different, unrelated shape) — the rule
 * under test is just "no top-level `instanceIndex` key", which a package manifest could never
 * legitimately carry either, so one predicate covers both without needing to classify the file
 * first.
 *
 * One live corpus violation: `conformance/discovery/fixture-repo/manifest.json`. That fixture is
 * deliberately NOT migrated to RFC-038 tree-authoritative storage — RFC-038 Rev 7 kept it as frozen
 * pre-cutover test data for the `ext:discovery` conformance runner rather than inventing repository
 * identity for it (see `conformance/discovery/README.md`, "Two layers, migrated independently").
 * Allowlisted with `disposition: "permanent"`, same shape as
 * `scripts/publication-reachability-exclusions.json`: `{ path, reason, disposition, issue }`,
 * reused rather than inventing a bespoke shape (carried-context-61cee7c6) — this check has no git
 * history to diff, so `scripts/versioning-cell-allowlist.json`'s commit-range fields do not apply.
 *
 *   node scripts/check-repository-cell.mjs [root]   # root defaults to the repo root
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree.
// `fileURLToPath`, not `new URL(..).pathname`: the latter is percent-encoded.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST = join(ROOT, "scripts/repository-cell-allowlist.json");

async function findManifests(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const abs = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      out.push(...(await findManifests(abs)));
      continue;
    }
    if (e.name === "manifest.json") out.push(abs);
  }
  return out;
}

const isObject = (o) => o != null && typeof o === "object" && !Array.isArray(o);

async function loadAllowlist() {
  if (!existsSync(ALLOWLIST)) return []; // the guard fixtures under tests/guards/run.mjs carry none
  const parsed = JSON.parse(await readFile(ALLOWLIST, "utf8"));
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

function allowlistEntryProblems(e, i) {
  const where = `${ALLOWLIST} entries[${i}]`;
  const problems = [];
  for (const key of ["path", "reason", "disposition", "issue"]) {
    if (typeof e?.[key] !== "string" || !e[key].trim()) problems.push(`${where} is missing "${key}"`);
  }
  if (e?.disposition !== "permanent" && e?.disposition !== "pending") {
    problems.push(`${where} disposition ${JSON.stringify(e?.disposition)} must be "permanent" or "pending"`);
  }
  if (typeof e?.issue !== "string" || !/^#[1-9]\d*$/.test(e.issue)) {
    problems.push(`${where} issue ${JSON.stringify(e?.issue)} is not a GitHub issue reference of the form #<number>`);
  }
  return problems;
}

async function main() {
  const manifests = (await findManifests(ROOT)).sort();

  const violations = [];
  const unreadable = [];

  for (const abs of manifests) {
    const relPath = relative(ROOT, abs);
    let raw;
    try {
      raw = await readFile(abs, "utf8");
    } catch (error) {
      unreadable.push({ path: relPath, error: error.message });
      continue;
    }
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch (error) {
      unreadable.push({ path: relPath, error: error.message });
      continue;
    }
    if (isObject(doc) && Object.prototype.hasOwnProperty.call(doc, "instanceIndex")) {
      violations.push({ path: relPath });
    }
  }

  if (unreadable.length > 0) {
    console.log(`✗ ${unreadable.length} manifest.json file(s) could not be parsed as JSON:`);
    for (const u of unreadable) {
      console.log(`  - ${u.path}: ${u.error}`);
    }
  }

  const allowlist = await loadAllowlist();
  const allowlistProblems = allowlist.flatMap((e, i) => allowlistEntryProblems(e, i));

  const matchedEntryPaths = new Set();
  const unallowlisted = [];
  for (const v of violations) {
    const entry = allowlist.find((e) => e.path === v.path);
    if (entry == null) unallowlisted.push(v);
    else matchedEntryPaths.add(entry.path);
  }
  const staleEntries = allowlist
    .map((e, i) => ({ entry: e, index: i }))
    .filter(({ entry }) => !matchedEntryPaths.has(entry.path));

  if (unallowlisted.length > 0) {
    console.log(`✗ repository cell: ${unallowlisted.length} manifest.json file(s) carry the retired instanceIndex key:`);
    for (const v of unallowlisted) {
      console.log(`  - ${v.path} — instanceIndex is retired (RFC-038 [R2]); membership is tree-authoritative (RFC-038 [R1])`);
    }
    console.log(`  Remove instanceIndex, or add an entry citing a live issue to ${ALLOWLIST}.`);
  }

  if (staleEntries.length > 0) {
    console.log(`✗ ${staleEntries.length} ${ALLOWLIST} entry/entries no longer match a violation:`);
    for (const { entry, index } of staleEntries) {
      console.log(`  - entries[${index}]: ${entry.path} — remove it (shrink discipline)`);
    }
  }

  if (allowlistProblems.length > 0) {
    console.log(`✗ ${allowlistProblems.length} problem(s) in ${ALLOWLIST}:`);
    for (const p of allowlistProblems) console.log(`  - ${p}`);
  }

  if (
    unreadable.length > 0 ||
    unallowlisted.length > 0 ||
    staleEntries.length > 0 ||
    allowlistProblems.length > 0
  ) {
    process.exit(1);
  }

  const allowlistNote = allowlist.length > 0 ? ` (${allowlist.length} known violation(s) allowlisted)` : "";
  console.log(
    `✓ repository cell: ${manifests.length} manifest.json file(s) checked — none carry the retired instanceIndex key${allowlistNote}`,
  );
}

main();
