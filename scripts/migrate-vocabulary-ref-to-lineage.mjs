#!/usr/bin/env node
/**
 * migrate-vocabulary-ref-to-lineage.mjs — rfc-decision-c8704763 item 6 (vocabularyRef -> LINEAGE).
 *
 * Rewrites every Field definition's `fieldType.vocabularyRef` from the legacy
 * `namespace/name@version` pattern string to a bare UUID (format: uuid), per the reference
 * taxonomy's LINEAGE strength. There is no installed Vocabulary these fixture strings actually
 * resolve to (they are self-contained conformance fixtures), so the replacement UUID is derived
 * deterministically via UUIDv5 (RFC 4122) over the old string — same input always yields the same
 * output, so the migration is re-runnable and needs no separate mapping file to keep in sync.
 *
 * Scope: `tests/rfc-032/package/fields/**` — the only Field definitions in this repository's own
 * tree still carrying the legacy pattern (the spec's own corpus, srs/package/**, has none). Other
 * first-party corpora are out of scope here per RFC-040 (follow-up).
 *
 *   node scripts/migrate-vocabulary-ref-to-lineage.mjs           # apply (writes files)
 *   node scripts/migrate-vocabulary-ref-to-lineage.mjs --check   # dry run: exit 1 if drift remains
 */
import { createHash } from "crypto";
import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SCOPE = join(ROOT, "tests", "rfc-032", "package", "fields");
const CHECK = process.argv.includes("--check");
const LEGACY_PATTERN = /^[^/@]+\/[^/@]+@[0-9]+$/;

// A fixed private namespace UUID (this repo's own, minted once) — the "namespace" argument UUIDv5
// requires. Never reused for anything else.
const MIGRATION_NAMESPACE = "5f8204bc-0000-4000-a000-000000000c87";

/** UUIDv5 (RFC 4122 §4.3): SHA-1 over namespace bytes + name bytes, with the version/variant bits set. */
function uuidv5(name, namespace) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = createHash("sha1").update(Buffer.concat([nsBytes, nameBytes])).digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function main() {
  let entries;
  try {
    entries = await readdir(SCOPE, { withFileTypes: true });
  } catch {
    entries = [];
  }
  let drift = 0;
  let migrated = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const path = join(SCOPE, entry.name);
    const doc = JSON.parse(await readFile(path, "utf8"));
    const ref = doc.fieldType?.vocabularyRef;
    if (typeof ref !== "string" || !LEGACY_PATTERN.test(ref)) continue;

    drift++;
    const uuid = uuidv5(ref, MIGRATION_NAMESPACE);
    if (CHECK) {
      console.log(`✗ ${entry.name}: fieldType.vocabularyRef still legacy-shaped (${ref})`);
      continue;
    }
    doc.fieldType.vocabularyRef = uuid;
    await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`);
    migrated++;
    console.log(`  migrated ${entry.name}: ${ref} -> ${uuid}`);
  }

  if (CHECK) {
    if (drift > 0) {
      console.log(`\n✗ ${drift} Field definition(s) still carry a legacy vocabularyRef.`);
      process.exit(1);
    }
    console.log(`✓ No Field definition under tests/rfc-032/package/fields carries a legacy vocabularyRef.`);
    return;
  }
  console.log(`✓ Migrated ${migrated} Field definition(s).`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
