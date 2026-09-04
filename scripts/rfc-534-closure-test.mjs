#!/usr/bin/env node
/**
 * rfc-534-closure-test.mjs — Tier-2 structural closure for the two files PR#533/#544 parked on
 * emitter-capability gaps (srs#534: map-of-$ref values, $defs-only entities, untyped integer
 * enums), plus the owed {srsj,manifest,data} archive envelope (docs/schema/2.0/srsj-envelope.json,
 * srs#522/RFC-038/RFC-039), authored and modelled in the same unit.
 *
 * Same discipline and shared machinery as rfc-272-closure-test.mjs / rfc-541-closure-test.mjs
 * (scripts/lib/schema-closure.mjs): asserts `emitter ⊆ committed seed` over the properties this
 * unit's metamodel Types cover. AUTHORSHIP DOES NOT FLIP (srs#260 is owner-held):
 * docs/schema/2.0/{theme,discovery,srsj-envelope}.json remain the loaded artifacts; this test
 * proves the metamodel *could* generate them, never overwrites them.
 *
 * Three kinds of entity in ENTITIES:
 *   - top-level, plain emitEntity: `theme` (theme.json IS its own top-level entity) and
 *     `srsj-envelope` (docs/schema/2.0/srsj-envelope.json, authored this unit).
 *   - top-level via emitDefsOnlyBundle (srs#534's new $defs-only capability): discovery.json has
 *     NO top-level entity of its own — it is ALL $defs (DiscoveryQuery/TextSegment/
 *     ConformanceScenario/ExpectedSegments). `emitDefsOnlyBundle` is exercised once below and its
 *     per-entity $defs entries are compared against discovery.json's own $defs, proving the bundle
 *     mechanism actually produces usable per-entity output (not just defined and left uncalled).
 *
 * Per-entity EXCLUSIONS (documented, not silently dropped — the seed may always carry more, same
 * latitude every existing closure test entity already has):
 *   - `theme`: `lineage`, `provenance` (bare `{type:object}` in this file, no real structure — same
 *     reasoning as Blueprint/Composition/View elsewhere in this ledger); nested
 *     `elementTemplates.compositeRendererConfig` (a hybrid `additionalProperties:true` + declared
 *     named properties this Type system cannot express — every Type-generated object schema always
 *     emits `additionalProperties:false`; the seed's own doc comment says "the key grammar is
 *     deliberately not constrained here", i.e. it resists static modelling by design); `assets` — a
 *     TOOLING PARITY GAP, not a modelling gap (see below), the one property left out of the LIVE
 *     corpus for a reason distinct from every other exclusion in this file.
 *   - `discovery-query`: `tier` — the SAME kind of tooling-parity exclusion as `theme.assets` (see
 *     below).
 *   - `text-segment`/`expected-segments`/`conformance-scenario`/`srsj-envelope`: none — every
 *     property of all four is covered.
 *
 * `theme.assets` and `discovery-query.tier` — TOOLING PARITY, not a modelling gap. Both emitter
 * capabilities (map-of-$ref, untyped integer enum) ARE implemented (rfc-032-fieldtype.mjs /
 * schema-emitter.mjs) and proven against synthetic fixtures
 * (tests/rfc-534-emitter-capabilities/run.mjs) — but the two metamodel Fields that would exercise
 * them (`assets`, `tier`) are deliberately NOT added to the LIVE `com.semanticops.srs/metamodel`
 * corpus: doing so makes `srs repo validate --repo srs` (and therefore rendering) fail to load the
 * catalog entirely under the pinned srs-rust binary (build.320), whose embedded copy of
 * `field.json`'s FieldType schema predates both capabilities. Same class of gap srs-rust#868
 * already parked a schema-touching srs-side change for (`FieldAssignment.description`,
 * `packageDependencies`): land the mechanism + the schema capability now, park the corpus
 * population until a compatible srs-rust release ships (srs-rust#932).
 * See `gen-metamodel-package.mjs`'s own notes at field numbers 225 (`tier`) and 255 (`assets`).
 *
 * Node pipeline only (ADR-004). Runs under scripts/validate-all.mjs.
 */
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity, emitDefsOnlyBundle } from "./lib/schema-emitter.mjs";
import { prep, compareEntity } from "./lib/schema-closure.mjs";

const HERE = resolve(fileURLToPath(new URL(".", import.meta.url)));
const REPO = resolve(HERE, "..");
const MM = join(REPO, "srs/package/metamodel");
const SEED = join(REPO, "docs/schema/2.0");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

const ctx = loadPackage(MM);
const errs = [];
const divergencesSeen = [];
const DIVERGENCE = {};
let totalMatched = 0;
const excludedByEntity = {};

function check(label, emitted, seed) {
  const { matched, excluded } = compareEntity(emitted, seed, label, { divergence: DIVERGENCE[label] || {}, errs, divergencesSeen });
  totalMatched += matched;
  excludedByEntity[label] = excluded;
}

// --- top-level entities (plain emitEntity) --------------------------------------------------
check("theme", emitEntity(ctx, "theme"), load(join(SEED, "theme.json")));
check("srsj-envelope", emitEntity(ctx, "srsj-envelope"), load(join(SEED, "srsj-envelope.json")));

// --- discovery.json: $defs-only bundle (srs#534's new capability), exercised here -----------
const discoverySeed = load(join(SEED, "discovery.json"));
const bundle = emitDefsOnlyBundle(ctx, {
  id: discoverySeed.$id,
  title: discoverySeed.title,
  description: discoverySeed.description,
  entities: ["discovery-query", "text-segment", "expected-segments", "conformance-scenario"],
});
const BUNDLE_KEY = { "discovery-query": "DiscoveryQuery", "text-segment": "TextSegment", "expected-segments": "ExpectedSegments", "conformance-scenario": "ConformanceScenario" };
for (const [typeName, pascalKey] of Object.entries(BUNDLE_KEY)) {
  // Self-consistency: emitDefsOnlyBundle's per-entity output must equal what emitEntity produces
  // for the same Type (the bundle capability is a different top-level assembly, not a different
  // per-node projection) — proves the new capability is actually load-bearing, not merely defined.
  const viaBundle = { ...bundle.$defs[pascalKey], $defs: bundle.$defs };
  const viaEntity = emitEntity(ctx, typeName);
  const bundleErrs = [];
  compareEntity(viaEntity, prep(viaBundle), `${typeName}(bundle-self-check)`, { errs: bundleErrs, divergencesSeen: [] });
  if (bundleErrs.length) errs.push(...bundleErrs.map((e) => `emitDefsOnlyBundle self-consistency: ${e}`));

  // seed-only $defs entry, sibling-spread with the file's own $defs bag for internal $ref resolution.
  const seedDef = { ...discoverySeed.$defs[pascalKey], $defs: discoverySeed.$defs };
  check(typeName, viaEntity, seedDef);
}

console.log("RFC-534 (srs#534) Tier-2 closure — theme.json, discovery.json (via $defs-only bundle), srsj-envelope.json (emitter ⊆ committed seed):");
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
console.log("\n✓ closure holds: theme/discovery-query/text-segment/expected-segments/conformance-scenario/srsj-envelope");
console.log("  each project consistently into their committed docs/schema/2.0/*.json seed; seed-only properties are");
console.log("  the documented exclusion set. emitDefsOnlyBundle's output is self-consistent with emitEntity's per-type output.");
