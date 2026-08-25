#!/usr/bin/env node
/**
 * rfc-035-closure-test.mjs — RFC-035 Tier-2 STRUCTURAL closure (acceptance for #259; discharges RFC-033 [R4](b)).
 *
 * Asserts the reference emitter's output for the meta-model entities is projection-consistent with the FROZEN
 * seed (docs/schema/2.0/{field,type}.json) as an `emitter ⊆ seed` relation over the covered authoritative
 * features, under the Change F normalization:
 *   (a) full $ref resolution (inline expansion) on BOTH sides — so the emitter's `$ref`+`$def` for a value
 *       object compares equal to a seed INLINE subschema (the field-type.constraints case);
 *   (b) an explicit EXCLUSION set — the `$schema` envelope meta-property, `type.tags`, RFC-033 Change A
 *       deferred facets, and the seed's hand-authored APPROXIMATED envelopes (allOf/if/then + x-srs-range-type);
 *   (c) annotation stripping (description/$comment/deprecated/title);
 *   (d) `required[]` compared as a set-subset.
 * Intentional divergences (the metamodel's `type.aiGuidance` upgrade to full AiGuidance) are enumerated in a
 * DIVERGENCE REGISTER: asserted-and-documented, never silently passed. The excluded seed-property list is
 * PRINTED each run so a future coverage regression cannot hide inside the subset exclusion.
 *
 * This is Tier 2 (semantic). Byte-for-byte reproducibility is Tier 1 (tests/rfc-035/run.mjs). Runs under
 * scripts/validate-all.mjs. ADR-004: Node pipeline only, never the binary.
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

// Annotations + hand-authored approximated envelopes stripped on BOTH sides before comparison.
// `default` (RFC-040 Unit 1, srs#477): a JSON-Schema ANNOTATION keyword, never affects validation;
// the model deliberately has no default mechanism post-Change-D (seed sites: RequiresRelation
// direction/enforcement). Not currently load-bearing here (isSub only requires emitter keys ⊆ seed,
// and the emitter never emits `default`) — stripped anyway so both closure tests document the same rule.
const ANNOT = new Set(["description", "$comment", "deprecated", "title", "$id", "$schema", "x-srs-range-type", "default"]);
const ENVELOPE = new Set(["allOf", "if", "then", "else", "oneOf", "anyOf", "not"]);

// DIVERGENCE REGISTER (Change F): covered authoritative properties where emitter ≠ seed BY DESIGN.
const DIVERGENCE = {
  type: {
    aiGuidance:
      "Metamodel unifies type-level guidance on the full AiGuidance value-object (adds `examples` + required `purpose`); the frozen seed carries a narrowed inline {purpose,extraction,negativeGuidance}. Intentional upgrade — #260 regularizes the seed (OQ4).",
  },
};

/** Resolve every `$ref` against `defs`, inlining recursively. The inline-ref graph is acyclic (the one
 * back-edge, field-assignment.fieldId, is mode:reference → an id shape, not a $ref), so this terminates. */
function resolveRefs(node, defs, seen = new Set()) {
  if (Array.isArray(node)) return node.map((n) => resolveRefs(n, defs, seen));
  if (node && typeof node === "object") {
    if (typeof node.$ref === "string") {
      const key = node.$ref.replace("#/$defs/", "");
      if (seen.has(key)) return {}; // cycle guard (defensive; not expected)
      const target = defs[key];
      if (!target) throw new Error(`closure: unresolved $ref ${node.$ref}`);
      const resolved = resolveRefs(target, defs, new Set([...seen, key]));
      for (const [k, v] of Object.entries(node)) if (k !== "$ref") resolved[k] = resolveRefs(v, defs, seen);
      return resolved;
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = resolveRefs(v, defs, seen);
    return out;
  }
  return node;
}

/** Strip annotations + approximated envelopes recursively (both sides). `inPropertiesBag` marks a
 * node whose OWN keys are property names (the value of a `properties` keyword), never annotation
 * keywords, even when a property happens to be named e.g. "description" (RFC-040 Unit 1, srs#477 —
 * a Field literally named `description` was being deleted from both sides before comparison,
 * silently exempting Field.description/Type.description/FieldAssignment.description from closure).
 * `k === "properties"` only introduces a NEW bag when we are not already inside one — a Field can be
 * named `properties` too (LifecycleState/LifecycleTransition's open `properties` bag field), and its
 * own schema value is a leaf fragment, not a nested properties bag (the `!inPropertiesBag` guard
 * below); one level further down, `inPropertiesBag` is false again, so a genuine nested `properties`
 * keyword on that field's own value is still detected correctly. */
function normalize(node, inPropertiesBag = false) {
  if (Array.isArray(node)) return node.map((n) => normalize(n));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (!inPropertiesBag && (ANNOT.has(k) || ENVELOPE.has(k))) continue;
      out[k] = normalize(v, !inPropertiesBag && k === "properties");
    }
    return out;
  }
  return node;
}

const prep = (schema) => normalize(resolveRefs(schema, schema.$defs || {}));
const setEq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** Recursive `emitter ⊆ seed`: every emitter property/keyword must be present-and-consistent in the seed;
 * the seed may carry more (deprecated/deferred). `required` is a set-subset; leaf constraints must be equal. */
function isSub(e, s, path, errs) {
  if (e && typeof e === "object" && !Array.isArray(e)) {
    if (!(s && typeof s === "object" && !Array.isArray(s))) {
      errs.push(`${path}: emitter object vs seed ${JSON.stringify(s)}`);
      return;
    }
    for (const [k, v] of Object.entries(e)) {
      if (k === "properties") {
        const sp = s.properties || {};
        for (const [pk, pv] of Object.entries(v)) {
          if (!(pk in sp)) { errs.push(`${path}.properties.${pk}: emitter-only property absent from seed`); continue; }
          isSub(pv, sp[pk], `${path}.${pk}`, errs);
        }
      } else if (k === "required") {
        const sreq = new Set(s.required || []);
        for (const r of v) if (!sreq.has(r)) errs.push(`${path}.required: emitter requires "${r}" not required in seed`);
      } else {
        if (!(k in s)) { errs.push(`${path}.${k}: emitter keyword "${k}" absent from seed`); continue; }
        isSub(v, s[k], `${path}.${k}`, errs);
      }
    }
    return;
  }
  if (Array.isArray(e) || Array.isArray(s)) {
    if (!setEq(e || [], s || [])) errs.push(`${path}: emitter array ${JSON.stringify(e)} ⊄ seed ${JSON.stringify(s)}`);
    return;
  }
  if (e !== s) errs.push(`${path}: emitter ${JSON.stringify(e)} != seed ${JSON.stringify(s)}`);
}

const ctx = loadPackage(MM);
const errs = [];
let matched = 0;
const divergencesSeen = [];
const excludedByEntity = {};

for (const entity of ["field", "type"]) {
  // RFC-040 Unit 3 (srs#479): effective-Type resolution (Change A) is now wired INSIDE `emitEntity`
  // itself (`resolveForEmission`) — `type` is compared as its effective Type (core + every extending
  // facet Type, single-level) automatically; no caller-side pre-merge. (Pre-merging here, as this test
  // did before Unit 3, would now double-apply the sibling-merge, since `emitEntity` would merge an
  // already-merged ctx a second time.)
  const e = prep(emitEntity(ctx, entity));
  const s = prep(load(join(SEED, `${entity}.json`)));
  const div = DIVERGENCE[entity] || {};

  for (const [pk, pv] of Object.entries(e.properties)) {
    if (pk in div) { divergencesSeen.push(`${entity}.${pk}`); continue; }
    if (!(pk in s.properties)) { errs.push(`${entity}.properties.${pk}: emitter-only property absent from seed`); continue; }
    const before = errs.length;
    isSub(pv, s.properties[pk], `${entity}.${pk}`, errs);
    if (errs.length === before) matched++;
  }
  // required set-subset (excluding divergence keys)
  const sreq = new Set(s.required || []);
  for (const r of e.required || []) if (!(r in div) && !sreq.has(r)) errs.push(`${entity}.required: emitter requires "${r}" not required in seed`);
  // excluded seed props (coverage/envelope) — surfaced so a coverage regression is visible.
  // `$schema` (RFC-031 R1 carve-out, reused here) is the one PERMANENT structural exemption: as a
  // PROPERTY NAME (not the JSON-Schema `$schema` meta-keyword — that's stripped as an annotation
  // above) it is self-reference metadata every entity file may carry, emitted structurally at the
  // top level (`emitEntity`'s `out.$schema`) rather than walked as a FieldAssignment — it will never
  // have a modelled counterpart by design (byte-level answer: Unit 3, per the Unit 1 gap analysis).
  excludedByEntity[entity] = Object.keys(s.properties).filter((k) => k !== "$schema" && !(k in e.properties));
}

console.log("RFC-035 Tier-2 closure (emitter ⊆ frozen seed, authoritative subset):");
console.log(`  authoritative properties consistent : ${matched}`);
console.log(`  documented divergences (register)   : ${divergencesSeen.length}  [${divergencesSeen.join(", ")}]`);
for (const [ent, ex] of Object.entries(excludedByEntity)) {
  console.log(`  excluded seed-only props (${ent})    : ${ex.length}  [${ex.join(", ")}]`);
}
// Assert the register entries genuinely diverge (so a register entry can't rot into a silent no-op).
for (const [entity, div] of Object.entries(DIVERGENCE)) {
  const e = prep(emitEntity(ctx, entity));
  const s = prep(load(join(SEED, `${entity}.json`)));
  for (const pk of Object.keys(div)) {
    const local = [];
    if (pk in e.properties && pk in s.properties) isSub(e.properties[pk], s.properties[pk], `${entity}.${pk}`, local);
    if (local.length === 0) errs.push(`divergence register: ${entity}.${pk} no longer diverges — remove it from the register`);
  }
}

if (errs.length) {
  console.error(`\n✗ ${errs.length} closure failure(s):`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\n✓ closure holds: every covered authoritative property projects consistently into the frozen seed;`);
console.log(`  intentional divergences are registered; seed-only properties are the documented exclusion set.`);
