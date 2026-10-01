#!/usr/bin/env node
/**
 * check-composition-container-literal.mjs — a Composition names no Container by id (RFC-043 ruling M, srs#851).
 *
 * A Composition is a type-layer template (rfc-decision-0750c62f, layer rule 1). Writing the id of a
 * specific Container into one of its `container-subset` sources is the same layer leak RFC-043
 * removes for record ids (`memberOrder`): the template names content. RFC-043 makes `containerId`
 * optional on an arranged section (the section then renders the container being rendered) and rules
 * (owner, 2026-10-01) that the literals already in the corpus may stay FOR NOW, as an ENFORCED
 * allowlist tied to srs#851, not prose: this check fails on any `container-subset` source carrying a
 * string `containerId` that is not listed in `scripts/composition-container-literal-allowlist.json`,
 * and on any listed entry that no longer matches a literal. srs#851 removes the literals and then the
 * allowlist file; "make sure we don't forget" is carried by the stale-entry failure and the registry
 * `expiry` in scripts/checks.json.
 *
 * Whole-tree walk of every `*.json` and `*.srsj` (not a fixed list of roots, same reasoning as
 * check-repository-cell.mjs): a literal is any object with `type: "container-subset"` and a string
 * `containerId`, wherever it sits (a package Composition, an embedded copy in an archive).
 * Allowlist entries are keyed by file path + JSON pointer to the source object + the literal itself,
 * so a changed or moved literal is a new violation, never silently absorbed.
 *
 *   node scripts/check-composition-container-literal.mjs [root]   # root defaults to the repo root
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST = join(ROOT, "scripts/composition-container-literal-allowlist.json");

async function findFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".") || e.isSymbolicLink()) continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findFiles(abs)));
    else if (e.name.endsWith(".json") || e.name.endsWith(".srsj")) out.push(abs);
  }
  return out;
}

function* literals(node, pointer = "") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* literals(node[i], `${pointer}/${i}`);
  } else if (node != null && typeof node === "object") {
    if (node.type === "container-subset" && typeof node.containerId === "string") {
      yield { pointer, containerId: node.containerId };
    }
    for (const [k, v] of Object.entries(node)) yield* literals(v, `${pointer}/${k}`);
  }
}

const keyOf = (e) => `${e.path}\u0000${e.pointer}\u0000${e.containerId}`;

function allowlistEntryProblems(e, i) {
  const where = `${ALLOWLIST} entries[${i}]`;
  const problems = [];
  for (const key of ["path", "pointer", "containerId", "reason", "disposition", "issue"]) {
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
  const files = (await findFiles(ROOT)).sort();
  const found = [];
  const unreadable = [];
  for (const abs of files) {
    const path = relative(ROOT, abs);
    let doc;
    try {
      doc = JSON.parse(await readFile(abs, "utf8"));
    } catch {
      // Not every .json under the tree is a JSON document we own (templates, fixtures); a parse
      // failure cannot hide a literal that validate-package/validate-records would not also reject.
      unreadable.push(path);
      continue;
    }
    for (const l of literals(doc)) found.push({ path, ...l });
  }

  let allowlist = [];
  if (existsSync(ALLOWLIST)) {
    const parsed = JSON.parse(await readFile(ALLOWLIST, "utf8"));
    allowlist = Array.isArray(parsed.entries) ? parsed.entries : [];
  }
  const problems = allowlist.flatMap((e, i) => allowlistEntryProblems(e, i));
  const listed = new Set(allowlist.map(keyOf));
  const seen = new Set(found.map(keyOf));

  const unlisted = found.filter((f) => !listed.has(keyOf(f)));
  const stale = allowlist.map((e, i) => ({ e, i })).filter(({ e }) => !seen.has(keyOf(e)));

  if (unlisted.length > 0) {
    console.log(`✗ ${unlisted.length} Composition container-subset source(s) name a Container by id (a type-layer template naming content):`);
    for (const f of unlisted) console.log(`  - ${f.path} ${f.pointer}: containerId ${f.containerId}`);
    console.log(
      `  Omit containerId on an arranged section (RFC-043 Change B: it then renders the container being rendered), ` +
        `or add an entry citing a live issue to ${relative(ROOT, ALLOWLIST)}.`,
    );
  }
  if (stale.length > 0) {
    console.log(`✗ ${stale.length} ${relative(ROOT, ALLOWLIST)} entry/entries no longer match a literal:`);
    for (const { e, i } of stale) console.log(`  - entries[${i}]: ${e.path} ${e.pointer} — remove it (shrink discipline)`);
  }
  if (problems.length > 0) {
    console.log(`✗ ${problems.length} problem(s) in ${relative(ROOT, ALLOWLIST)}:`);
    for (const p of problems) console.log(`  - ${p}`);
  }
  if (unlisted.length > 0 || stale.length > 0 || problems.length > 0) process.exit(1);

  const note = allowlist.length > 0 ? ` (${allowlist.length} known literal(s) allowlisted, srs#851)` : "";
  console.log(`✓ composition container literal: ${files.length - unreadable.length} JSON file(s) walked — no unlisted container-subset containerId literal${note}`);
}

main();
