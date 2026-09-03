#!/usr/bin/env node
/**
 * rfc-541-closure-test.mjs — Tier-2 structural closure for the six residual instance-layer entities
 * srs#541 modelled (the ones srs#526/PR#533 parked): RelationTypeDefinition, DiscoveryQuery, the
 * shared ExportConfig, Manifest, Composition, and View (plus View's own FieldView/RecordPropertyView
 * row shapes).
 *
 * Same discipline and shared machinery as rfc-272-closure-test.mjs (scripts/lib/schema-closure.mjs):
 * asserts `emitter ⊆ committed seed` over the properties this unit's metamodel Types cover.
 * AUTHORSHIP DOES NOT FLIP (srs#260 is owner-held): docs/schema/2.0/{relation-type,discovery,
 * manifest,composition,view}.json remain the loaded artifacts; this test proves the metamodel
 * *could* generate them, never overwrites them.
 *
 * Two kinds of entity in ENTITIES:
 *   - top-level: the seed IS the file's own top-level object (relation-type-definition, manifest,
 *     composition, view).
 *   - nested: the seed is one $def inside a file that has no top-level entity of its own (discovery-
 *     query lives in discovery.json's `$defs` bag, which is ALL $defs — no top-level object; export-
 *     config/field-view/record-property-view are $defs nested inside an owning file that IS a
 *     top-level entity elsewhere). The nested $def object is spread together with its file's `$defs`
 *     bag (schema-closure's resolveRefs needs that sibling context to resolve internal `$ref`s).
 *
 * Per-entity EXCLUSIONS (documented, not silently dropped — the seed may always carry more, same
 * latitude every rfc-272-closure-test.mjs entity already has):
 *   - `discovery-query`: `tier` (a bare untyped-integer enum — the #534-tracked emitter gap
 *     discovery.json's own standalone generation is gated on; per srs#541's own scope, modelling
 *     everything else does not need to wait on #534).
 *   - `manifest`: `changelogPath` (deprecated, no per-property deprecation mechanism modelled — same
 *     reason as Container.containerType in rfc-272); `meta` (an openly-shaped bag with one
 *     documented-but-optional legacy nested key, not a clean map like RelationTypeDefinition.meta).
 *   - `composition`: `containerType` (deprecated, reused from container.json's own precedent);
 *     `aiGuidance`/`lineage`/`provenance` (bare `{type:object}` in this file, no real structure — same
 *     reasoning as Blueprint's own in rfc-272).
 *   - `view`: `fieldViews`, `lineage`/`provenance` (same bare-object reasoning as composition's).
 *     `fieldViews` is a NEW finding, not covered by #534's three gaps (map-of-$ref, $defs-only
 *     bundles, untyped-integer enums): it is a JSON-Schema `oneOf` of two different $refs
 *     (FieldView | RecordPropertyView), and DocumentSection.source (SectionSource, composition.json)
 *     is the same class of gap — a `oneOf` of two anonymous, differently-required object branches
 *     with no flat `properties` bag outside the union. The metamodel's FieldType system has no
 *     discriminated-union datatype (every Type composes to one flat object), so neither shape can be
 *     modelled without either restructuring the committed seed or adding a new emitter capability —
 *     filed as its own gap, srs#543, sibling to #534 (the #535 lifecycle precedent: a real
 *     shape disagreement is a FINDING, never fudged closed). FieldView and RecordPropertyView are
 *     each independently modelled and closure-proven below against their OWN `$def` (both are plain
 *     flat objects on their own) — the exclusion is scoped to exactly the discriminated wrapper.
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

/** A $def nested inside `file`, spread with its file's own `$defs` bag so schema-closure's
 * resolveRefs can resolve any internal `$ref` the nested def itself carries. */
const nestedDef = (file, defName) => {
  const doc = load(join(SEED, file));
  return { ...doc.$defs[defName], $defs: doc.$defs };
};

// No DIVERGENCE register: every covered property below matches its seed exactly (verified during
// authoring — see the per-entity exclusion list in the file header for what is NOT covered).
const DIVERGENCE = {};

// entity (metamodel Type name) -> a loader returning its seed object (already carrying whatever
// `$defs` bag it needs for internal $ref resolution).
const ENTITIES = [
  ["relation-type-definition", () => load(join(SEED, "relation-type.json"))],
  ["discovery-query", () => nestedDef("discovery.json", "DiscoveryQuery")],
  ["export-config", () => nestedDef("composition.json", "ExportConfig")],
  ["manifest", () => load(join(SEED, "manifest.json"))],
  ["composition", () => load(join(SEED, "composition.json"))],
  ["view", () => load(join(SEED, "view.json"))],
  ["field-view", () => nestedDef("view.json", "FieldView")],
  ["record-property-view", () => nestedDef("view.json", "RecordPropertyView")],
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

console.log("RFC-541 (srs#541) Tier-2 closure — the residual instance-layer entities #526 parked (emitter ⊆ committed seed):");
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
console.log(`\n✓ closure holds: every covered authoritative property of RelationTypeDefinition/DiscoveryQuery/`);
console.log(`  ExportConfig/Manifest/Composition/View/FieldView/RecordPropertyView projects consistently into its`);
console.log(`  committed docs/schema/2.0/*.json seed; seed-only properties are the documented exclusion set.`);
