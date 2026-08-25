#!/usr/bin/env node
/**
 * check-schema-regenerate-drift.mjs — RFC-040 Unit 3 (srs#479) byte-closure gate.
 *
 * The byte-closure contract's "empty diff" criterion, given a mechanism (the byte-closure contract
 * section of RFC-040, "Unit 3 (emitter)" row): a full regenerate of the two frozen meta-model
 * entities, `docs/schema/2.0/field.json` and `docs/schema/2.0/type.json`, from the
 * `com.semanticops.srs/metamodel` package MUST produce content identical to what is committed —
 * modulo only the documented-divergence register (docs/schema/2.0/projection-rules.md), whose one
 * entry (`type.aiGuidance`, booked to #260) is excluded from this comparison by name, never silently.
 *
 * This is a whole-FILE byte check (unlike tests/rfc-035/run.mjs, which checks the emitter against its
 * OWN committed goldens under tests/rfc-035/goldens/ — determinism, not seed conformance). Before this
 * gate existed, "empty diff" was an unenforced acceptance criterion (RFC-040's opening-move finding).
 *
 * Node pipeline only (ADR-004): no binary involved. Runs under scripts/validate-all.mjs.
 */
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity } from "./lib/schema-emitter.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const MM = join(REPO, "srs/package/metamodel");
const SEED = join(REPO, "docs/schema/2.0");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));
const ser = (obj) => JSON.stringify(obj, null, 2) + "\n";

// The one sanctioned exception (docs/schema/2.0/projection-rules.md "Documented-divergence
// register"): the metamodel unifies type-level guidance on the full AiGuidance value-object; the
// frozen seed carries a narrower inline shape, intentionally, booked to #260. Named explicitly, never
// a wildcard — a future survivor here is asserted-and-documented, not silently passed.
const DIVERGENCE_PATHS = { type: ["properties", "aiGuidance"] };

function withoutDivergence(obj, path) {
  if (!path) return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  let node = clone;
  for (const seg of path.slice(0, -1)) node = node[seg];
  delete node[path[path.length - 1]];
  return clone;
}

function atPath(obj, path) {
  let node = obj;
  for (const seg of path) node = node?.[seg];
  return node;
}

const ctx = loadPackage(MM);
let fail = 0;
for (const entity of ["field", "type"]) {
  const regenerated = ser(emitEntity(ctx, entity));
  const committedRaw = readFileSync(join(SEED, `${entity}.json`), "utf8");
  const committed = ser(load(join(SEED, `${entity}.json`)));
  if (committedRaw !== committed) {
    // Defensive: the committed file itself isn't canonically-serialized JSON — a different failure
    // mode than drift, but still worth surfacing distinctly.
    console.error(`✗ ${entity}.json: committed file is not canonically serialized (2-space indent, trailing newline)`);
    fail++;
    continue;
  }
  const path = DIVERGENCE_PATHS[entity];
  if (path) {
    // The register entry must still genuinely diverge — an entry that no longer differs has rotted
    // into a silent no-op and should be removed (mirrors rfc-035-closure-test.mjs's own assertion).
    const regenValue = atPath(emitEntity(ctx, entity), path);
    const seedValue = atPath(load(join(SEED, `${entity}.json`)), path);
    if (JSON.stringify(regenValue) === JSON.stringify(seedValue)) {
      fail++;
      console.error(`  ✗ divergence register: ${entity}.${path.join(".")} no longer diverges — remove it from the register`);
    }
  }
  const regeneratedMinusDivergence = ser(withoutDivergence(emitEntity(ctx, entity), path));
  const committedMinusDivergence = ser(withoutDivergence(load(join(SEED, `${entity}.json`)), path));
  if (regeneratedMinusDivergence === committedMinusDivergence) {
    console.log(`  ✓ ${entity}.json regenerates byte-identical to the committed seed (modulo the documented divergence register)`);
  } else {
    fail++;
    console.error(`  ✗ ${entity}.json: regenerate differs from the committed seed`);
    const a = regeneratedMinusDivergence.split("\n"), b = committedMinusDivergence.split("\n");
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) console.error(`      line ${i + 1}: regenerated[${a[i]}] committed[${b[i]}]`);
    }
  }
}

if (fail) {
  console.error(`\n✗ schema regenerate-and-diff: ${fail} entity file(s) drifted from the committed seed.`);
  console.error(`  Run: node scripts/gen-metamodel-package.mjs, then re-derive docs/schema/2.0/{field,type}.json from the emitter, or fix the emitter/model.`);
  process.exit(1);
}
console.log("\n✓ schema regenerate-and-diff: docs/schema/2.0/{field,type}.json equal a full regenerate, modulo the documented-divergence register.");
