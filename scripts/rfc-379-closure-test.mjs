#!/usr/bin/env node
/**
 * rfc-379-closure-test.mjs — Tier-2 structural closure for the ext:protocol entities srs#379 ruled
 * and modelled: Protocol, ProtocolStage, and FieldRef.
 *
 * Same discipline and shared machinery as rfc-272-closure-test.mjs/rfc-541-closure-test.mjs
 * (scripts/lib/schema-closure.mjs): asserts `emitter ⊆ committed seed` over the properties this
 * unit's metamodel Types cover. AUTHORSHIP DOES NOT FLIP (srs#260 is owner-held):
 * docs/schema/2.0/protocol.json remains the loaded artifact; this test proves the metamodel
 * *could* generate it, never overwrites it.
 *
 * Protocol and ProtocolStage are BOTH top-level-shaped for this test's purposes: Protocol is the
 * file's own top-level object; ProtocolStage and FieldRef are nested $defs (`$defs.ProtocolStage`,
 * `$defs.FieldRef`), spread with the file's own `$defs` bag so schema-closure's resolveRefs can
 * resolve ProtocolStage's own internal $refs (to FieldRef and to the shared AiGuidance def).
 *
 * No per-entity EXCLUSIONS: srs#379's ruling covers every property on all three entities (unlike
 * #526/#541, which left several seed-only properties unmodelled) — every property projects into
 * the seed. One documented DIVERGENCE: `protocol.targetType` is a required, structured LINEAGE
 * reference with an empty-string sentinel (`oneOf: [{format:uuid}, {const:""}]`, for loose
 * exploratory Protocols) — a shape the metamodel's plain bare-UUID Field (matching every other
 * LINEAGE reference in the model, e.g. `lifecycleRef`) cannot express. Same class of approximation
 * as RFC-035's `type.aiGuidance` divergence: registered, not silently skipped.
 *
 * Node pipeline only (ADR-004). Runs under scripts/validate-all.mjs.
 */
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity } from "./lib/schema-emitter.mjs";
import { prep, isSub, compareEntity } from "./lib/schema-closure.mjs";

const HERE = resolve(fileURLToPath(new URL(".", import.meta.url)));
const REPO = resolve(HERE, "..");
const MM = join(REPO, "srs/package/metamodel");
const SEED = join(REPO, "docs/schema/2.0");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

const nestedDef = (file, defName) => {
  const doc = load(join(SEED, file));
  return { ...doc.$defs[defName], $defs: doc.$defs };
};

// See header: protocol.targetType's empty-string sentinel is not expressible by a bare-UUID Field.
const DIVERGENCE = { protocol: { targetType: true } };

const ENTITIES = [
  ["protocol", () => load(join(SEED, "protocol.json"))],
  ["protocol-stage", () => nestedDef("protocol.json", "ProtocolStage")],
  ["field-ref", () => nestedDef("protocol.json", "FieldRef")],
];

const ctx = loadPackage(MM);
const errs = [];
const divergencesSeen = [];
let totalMatched = 0;
const excludedByEntity = {};

for (const [typeName, loadSeed] of ENTITIES) {
  const emitted = emitEntity(ctx, typeName);
  const seed = loadSeed();
  const divergence = DIVERGENCE[typeName] || {};
  const { matched, excluded } = compareEntity(emitted, seed, typeName, { divergence, errs, divergencesSeen });
  totalMatched += matched;
  excludedByEntity[typeName] = excluded;
}

console.log("RFC-379 (srs#379) Tier-2 closure — ext:protocol (emitter ⊆ committed seed):");
console.log(`  authoritative properties consistent : ${totalMatched}`);
console.log(`  documented divergences (register)   : ${divergencesSeen.length}  [${divergencesSeen.join(", ")}]`);
for (const [ent, ex] of Object.entries(excludedByEntity)) {
  console.log(`  excluded seed-only props (${ent})${" ".repeat(Math.max(0, 26 - ent.length))}: ${ex.length}  [${ex.join(", ")}]`);
}

if (errs.length) {
  console.error(`\n✗ ${errs.length} closure failure(s):`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\n✓ closure holds: every property of Protocol/ProtocolStage/FieldRef projects consistently`);
console.log(`  into the committed docs/schema/2.0/protocol.json seed; the one intentional divergence`);
console.log(`  is registered, no exclusions needed.`);
