#!/usr/bin/env node
/**
 * migrate-substrate-properties-to-meta.mjs — rfc-decision-6fc7e142 (properties -> meta), srs#433.
 * A rename is a migration (rfc-decision-628cf6c4): this is the registered migration half of it.
 *
 * Renames the substrate escape-bag key `properties` -> `meta` wherever a VocabularyEntry
 * specialization stores it: Term (nested in a Vocabulary's `terms[]`), RelationTypeDefinition
 * (top-level `properties`), and LifecycleState/LifecycleTransition (nested in a Lifecycle's
 * `states[]`/`transitions[]`). Definitions have no bag (Field/Type are untouched — #237's ruled
 * table). Detection is shape-based, not directory-scoped: the three kinds live under differently
 * named per-package folders (`vocabularies/`, `relation-types/`, `lifecycles/`) that vary per
 * package, so a fixed SCOPE constant (the pattern the sibling migrations use) would silently miss
 * a new package's folder. Walks the whole repo except `.git`, `node_modules`, and
 * `docs/schema/2.0` (the schemas themselves, edited separately in this same change) — ordinary
 * JSON-Schema `"properties"` keywords live only under the excluded schema directory, so nothing
 * outside it is misidentified.
 *
 *   node scripts/migrate-substrate-properties-to-meta.mjs           # apply (writes files)
 *   node scripts/migrate-substrate-properties-to-meta.mjs --check   # dry run: exit 1 if drift remains
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, relative, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root (this file lives in scripts/)
const CHECK = process.argv.includes("--check");
const EXCLUDE_DIR_NAMES = new Set([".git", "node_modules"]);
const EXCLUDE_ABS_DIRS = [join(ROOT, "docs", "schema", "2.0")];

function isExcludedDir(absPath) {
  return EXCLUDE_ABS_DIRS.some((d) => absPath === d || absPath.startsWith(`${d}/`));
}

async function findJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (EXCLUDE_DIR_NAMES.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (isExcludedDir(abs)) continue;
    if (entry.isDirectory()) out.push(...(await findJsonFiles(abs)));
    else if (entry.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

/** Rebuilds an object with `properties` renamed to `meta` in the same key position (minimal
 * diff). Returns null if the object carries no own `properties` key (nothing to do). */
function renameEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  if (!Object.prototype.hasOwnProperty.call(entry, "properties")) return null;
  const rebuilt = {};
  for (const [k, v] of Object.entries(entry)) {
    if (k === "properties") rebuilt.meta = v;
    else rebuilt[k] = v;
  }
  return rebuilt;
}

/** Detects which known substrate shape a parsed JSON document is, and migrates in place.
 * Returns the number of `properties` -> `meta` renames applied (0 if the doc matches no shape or
 * needs no change). Mutates `doc` directly — caller decides whether to persist it. */
function migrateDoc(doc) {
  if (!doc || typeof doc !== "object") return 0;
  let renamed = 0;

  // Vocabulary: `terms[]` of Term entries.
  if (Array.isArray(doc.terms) && typeof doc.mode === "string") {
    doc.terms = doc.terms.map((term) => {
      const rebuilt = renameEntry(term);
      if (rebuilt) renamed++;
      return rebuilt ?? term;
    });
  }

  // Lifecycle: `states[]` of LifecycleState + `transitions[]` of LifecycleTransition.
  if (Array.isArray(doc.states) && Array.isArray(doc.transitions) && typeof doc.initialState === "string") {
    doc.states = doc.states.map((state) => {
      const rebuilt = renameEntry(state);
      if (rebuilt) renamed++;
      return rebuilt ?? state;
    });
    doc.transitions = doc.transitions.map((transition) => {
      const rebuilt = renameEntry(transition);
      if (rebuilt) renamed++;
      return rebuilt ?? transition;
    });
  }

  // RelationTypeDefinition: top-level `properties`, identified by its required-together fields
  // (category is unique to this shape among the substrate kinds).
  if (typeof doc.category === "string" && typeof doc.key === "string" && typeof doc.namespace === "string") {
    const rebuilt = renameEntry(doc);
    if (rebuilt) {
      renamed++;
      Object.keys(doc).forEach((k) => delete doc[k]);
      Object.assign(doc, rebuilt);
    }
  }

  return renamed;
}

async function main() {
  const files = await findJsonFiles(ROOT);
  let drift = 0;
  let migrated = 0;

  for (const path of files) {
    let doc;
    try {
      doc = JSON.parse(await readFile(path, "utf8"));
    } catch {
      continue; // not JSON we can parse — not a substrate definition file either
    }
    const count = migrateDoc(doc);
    if (count === 0) continue;

    drift += count;
    const relPath = relative(ROOT, path);
    if (CHECK) {
      console.log(`✗ ${relPath}: still carries ${count} legacy substrate \`properties\` bag(s)`);
      continue;
    }
    await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`);
    migrated += count;
    console.log(`  migrated ${relPath}: ${count} \`properties\` -> \`meta\` rename(s)`);
  }

  if (CHECK) {
    if (drift > 0) {
      console.log(`\n✗ ${drift} substrate escape-bag occurrence(s) still carry the legacy \`properties\` key.`);
      process.exit(1);
    }
    console.log("✓ No Term/RelationTypeDefinition/LifecycleState/LifecycleTransition carries the legacy `properties` key.");
    return;
  }
  console.log(`✓ Migrated ${migrated} substrate escape-bag occurrence(s).`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
