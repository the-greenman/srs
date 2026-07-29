#!/usr/bin/env node
/**
 * tests/rfc-035/run.mjs — RFC-035 Tier-1 DETERMINISM golden (acceptance for #259).
 *
 * Emits the two meta-model entity schemas (`field`, `type`) + the generated-schema bundle envelope from the
 * frozen `com.semanticops.srs/metamodel` records via scripts/lib/schema-emitter.mjs, and asserts the output
 * is byte-for-byte identical to the committed goldens under tests/rfc-035/goldens/.
 *
 * This is byte-for-byte because it compares the emitter to ITSELF (Change F Tier 1): it proves determinism
 * and freezes the emitter-owned spellings ($defs keys, ordering). Seed CONFORMANCE is the separate Tier-2
 * closure (scripts/rfc-035-closure-test.mjs). ADR-004: Node pipeline only, never the binary.
 *
 *   node tests/rfc-035/run.mjs            # assert against committed goldens
 *   node tests/rfc-035/run.mjs --update   # (re)write goldens, then assert
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity, emitBundle, readDataModelRevision } from "../../scripts/lib/schema-emitter.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");
const MM = join(REPO, "srs/package/metamodel");
const GOLDENS = join(HERE, "goldens");
const UPDATE = process.argv.includes("--update");

const ser = (obj) => JSON.stringify(obj, null, 2) + "\n";
const ctx = loadPackage(MM);
const rev = readDataModelRevision(join(REPO, "srs/manifest.json"));

const artifacts = {
  "field.json": emitEntity(ctx, "field"),
  "type.json": emitEntity(ctx, "type"),
  "bundle.json": emitBundle(ctx, { entities: ["field", "type"], dataModelRevision: rev }),
};

if (UPDATE && !existsSync(GOLDENS)) mkdirSync(GOLDENS, { recursive: true });

let fail = 0;
for (const [name, obj] of Object.entries(artifacts)) {
  const path = join(GOLDENS, name);
  const got = ser(obj);
  if (UPDATE) {
    writeFileSync(path, got);
    console.log(`  wrote ${name}`);
    continue;
  }
  const want = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (want === got) {
    console.log(`  ✓ ${name} matches golden (byte-for-byte)`);
  } else {
    fail++;
    console.error(`  ✗ ${name} differs from golden (run with --update to refresh if intended)`);
    if (want == null) console.error(`      (no golden committed at ${path})`);
  }
}

if (UPDATE) {
  console.log("RFC-035 Tier-1: goldens updated.");
} else if (fail) {
  console.error(`\n✗ RFC-035 Tier-1 determinism: ${fail} artifact(s) drifted from committed goldens.`);
  process.exit(1);
} else {
  console.log("\n✓ RFC-035 Tier-1 determinism: emitter output is byte-for-byte reproducible.");
}
