#!/usr/bin/env node
/**
 * migrate-sourceref-relationtype-to-sourcerole.mjs — RFC-023 Change A/B, executed by srs#480
 * (RFC-040 Change I, train unit 4a-4).
 *
 * Renames every stored `SourceReference.relationType` -> `sourceRole` — at both array sites the
 * schema defines (the top-level `sourceRefs` and each per-field `fieldMeta.<field>.sourceRefs`,
 * RFC-039 Change C) — applying RFC-023's Change B
 * value mapping: `evidence`/`quoted-from`/`inspired-by` map identically, `derived-from` ->
 * `extracted-from` (removes the exact collision with the canonical Relation type of the same name),
 * and a legacy `supersedes-context` has no successor value (RFC-023 [R4]) — it is intentionally
 * dropped, not carried forward under any name.
 *
 * No `srs` CLI command can write `sourceRefs`: `record update`/`note update` accept only
 * `fieldValues`/`fieldMeta`/`typeVersion` on stdin (confirmed empirically against the current
 * released binary — a `sourceRefs` key in the update payload is silently ignored, the stored value
 * is untouched). This is the narrow "no tool can express the operation" exception in
 * srs-usage.md #2: this script writes the instance files directly, and `srs repo validate` /
 * `validate-all.mjs` confirm zero diagnostics immediately after.
 *
 *   node scripts/migrate-sourceref-relationtype-to-sourcerole.mjs           # apply (writes files)
 *   node scripts/migrate-sourceref-relationtype-to-sourcerole.mjs --check   # dry run: exit 1 if drift remains
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root
const SCOPE = join(ROOT, "srs", "records"); // the only tree in this repository carrying sourceRefs
const CHECK = process.argv.includes("--check");

// RFC-023 Change B (rfcs/rfc-023-sourceref-vocabulary-disjointness.md, "Migration window" table).
// `null` means "no successor" (RFC-023 [R4]): the role is dropped, not renamed.
const VALUE_MAP = {
  evidence: "evidence",
  "derived-from": "extracted-from",
  "quoted-from": "quoted-from",
  "inspired-by": "inspired-by",
  "supersedes-context": null,
};

async function findJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findJsonFiles(abs)));
    else if (e.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

/** Rebuild a SourceReference object with `relationType` replaced by `sourceRole` in the same key
 * position (minimal diff), applying the Change B value mapping. Returns null if the entry carries
 * no legacy `relationType` (nothing to do). Throws on a value outside the legacy enum. */
function migrateEntry(entry) {
  if (!Object.prototype.hasOwnProperty.call(entry, "relationType")) return null;
  const legacyValue = entry.relationType;
  if (!Object.prototype.hasOwnProperty.call(VALUE_MAP, legacyValue)) {
    throw new Error(`unrecognized legacy relationType value: ${JSON.stringify(legacyValue)}`);
  }
  const successor = VALUE_MAP[legacyValue];
  const rebuilt = {};
  for (const [k, v] of Object.entries(entry)) {
    if (k === "relationType") {
      if (successor !== null) rebuilt.sourceRole = successor;
      // supersedes-context: intentionally dropped, no key emitted (RFC-023 [R4]).
    } else {
      rebuilt[k] = v;
    }
  }
  return { rebuilt, legacyValue, successor };
}

/** Every array-of-SourceReference site the record.json/note.json schema defines: the top-level
 * `sourceRefs`, and each per-field `fieldMeta.<field>.sourceRefs` (RFC-039 Change C — same
 * `$defs/SourceReference` shape, keyed identically to fieldValues). */
function sourceRefArraySites(doc) {
  const sites = [{ get: () => doc.sourceRefs, set: (v) => (doc.sourceRefs = v) }];
  if (doc.fieldMeta && typeof doc.fieldMeta === "object") {
    for (const key of Object.keys(doc.fieldMeta)) {
      const meta = doc.fieldMeta[key];
      if (meta && typeof meta === "object") {
        sites.push({ get: () => meta.sourceRefs, set: (v) => (meta.sourceRefs = v) });
      }
    }
  }
  return sites;
}

async function main() {
  const files = await findJsonFiles(SCOPE);
  let filesWithDrift = 0;
  let entriesMigrated = 0;
  let entriesDropped = 0;
  const counts = {};

  for (const abs of files) {
    const raw = await readFile(abs, "utf8");
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch {
      continue; // structural load failures are validate-package.mjs's job to report
    }

    let touched = false;
    for (const site of sourceRefArraySites(doc)) {
      const refs = site.get();
      if (!Array.isArray(refs) || refs.length === 0) continue;

      let siteTouched = false;
      const nextRefs = refs.map((entry) => {
        const result = migrateEntry(entry);
        if (!result) return entry;
        siteTouched = true;
        touched = true;
        counts[result.legacyValue] = (counts[result.legacyValue] || 0) + 1;
        if (result.successor === null) entriesDropped++;
        else entriesMigrated++;
        return result.rebuilt;
      });
      if (siteTouched) site.set(nextRefs);
    }

    if (!touched) continue;
    filesWithDrift++;

    if (CHECK) {
      console.log(`✗ ${abs.slice(ROOT.length + 1)}: still carries legacy sourceRef relationType`);
      continue;
    }
    const trailingNewline = raw.endsWith("\n") ? "\n" : "";
    await writeFile(abs, JSON.stringify(doc, null, 2) + trailingNewline);
    console.log(`  migrated ${abs.slice(ROOT.length + 1)}`);
  }

  const summary = Object.entries(counts)
    .map(([k, n]) => `${k}: ${n}`)
    .join(", ");

  if (CHECK) {
    if (filesWithDrift > 0) {
      console.log(`\n✗ ${filesWithDrift} file(s) still carry a legacy sourceRef relationType (${summary}).`);
      process.exit(1);
    }
    console.log("✓ No sourceRef in srs/records carries a legacy relationType.");
    return;
  }

  console.log(
    `✓ Migrated ${entriesMigrated} sourceRef(s) across ${filesWithDrift} file(s) (${summary}).` +
      (entriesDropped > 0 ? ` ${entriesDropped} supersedes-context entrie(s) dropped (no successor).` : ""),
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
