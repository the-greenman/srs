/**
 * rfc-038-tree.mjs — tree-authoritative enumeration for the Node pipeline.
 *
 * RFC-038 [R1] makes the tree the membership authority: `manifest.json` carries no
 * `instanceIndex`, `containerIndex`, `sourceDocumentIndex` or `relationsPath`, and [R2]
 * denies those properties outright at data-model revision >= 2. Relations are one object
 * per file under `relations/` ([R11]); the collection form describes generation-<=1
 * artifacts only.
 *
 * These helpers are the single place the Node scripts enumerate a repository, so the
 * discovery rule is stated once rather than re-derived per script. The `srs` binary is
 * the authority on the model; this mirrors its enumeration for the checks that must run
 * without it (ADR-004).
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/** Reserved instance roots ([R3]): `records/` at the repository root, and `records/`
 *  immediately below any local package root. */
export async function instanceRoots(repoRoot) {
  const roots = [];
  if (existsSync(join(repoRoot, "records"))) roots.push("records");
  const pkg = join(repoRoot, "package");
  if (existsSync(join(pkg, "package.json")) && existsSync(join(pkg, "records"))) {
    roots.push("package/records");
  }
  return roots;
}

async function walkJson(dir, base, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walkJson(abs, rel, out);
    // `.revisions.json` is an ext:addressability sidecar, not an instance.
    else if (entry.name.endsWith(".json") && !entry.name.endsWith(".revisions.json")) out.push(rel);
  }
}

/** Every instance file path, repo-relative, sorted. Replaces `manifest.instanceIndex`. */
export async function instancePaths(repoRoot) {
  const out = [];
  for (const root of await instanceRoots(repoRoot)) {
    await walkJson(join(repoRoot, root), root, out);
  }
  return out.sort();
}

/** Every instance as `{ path, record }`, skipping unparseable files. */
export async function loadInstances(repoRoot) {
  const results = [];
  for (const path of await instancePaths(repoRoot)) {
    try {
      results.push({ path, record: JSON.parse(await readFile(join(repoRoot, path), "utf8")) });
    } catch {
      /* malformed files are the binary validator's diagnostic to raise, not ours */
    }
  }
  return results;
}

/** Every Relation as `{ path, relation }` from `relations/<relationId>.json` ([R11]). */
export async function loadRelations(repoRoot) {
  const dir = join(repoRoot, "relations");
  if (!existsSync(dir)) return [];
  const results = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith(".json")) continue;
    const path = `relations/${name}`;
    let obj;
    try {
      obj = JSON.parse(await readFile(join(dir, name), "utf8"));
    } catch {
      continue;
    }
    if (Array.isArray(obj?.relations)) {
      throw new Error(
        `${path} is a relations collection — RFC-038 [R11] denies the collection form at ` +
          `generation 2. Run the rfc038-storage migration.`,
      );
    }
    if (obj?.relationId) results.push({ path, relation: obj });
  }
  return results;
}
