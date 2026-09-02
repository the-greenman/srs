/**
 * schema-closure.mjs — shared `emitter ⊆ seed` structural comparison, factored out of
 * rfc-035-closure-test.mjs (srs#526, Task 4b/2) so a second closure test (rfc-272-closure-test.mjs,
 * over the instance-layer entities) does not re-implement the same $ref-resolution/annotation-
 * stripping/subset-comparison logic a second time (one way per goal). No behavior change to the
 * RFC-035 test: this is the same code, moved.
 *
 * `isSub(emitter, seed)` asserts every emitter property/keyword is present-and-consistent in the
 * seed; the seed may carry more (deprecated/deferred/uncovered). `required` is a set-subset; leaf
 * constraints must be equal. Both sides are `prep()`-ed first: `$ref`s fully resolved (inline
 * expansion) and annotations (`description`/`$comment`/`deprecated`/`title`/`$id`/`$schema`/
 * `x-srs-range-type`/`default`) + approximated envelopes (`allOf`/`if`/`then`/`else`/`oneOf`/
 * `anyOf`/`not`) stripped — except inside a `properties` bag, where a Field may itself be named
 * e.g. `description` and must not be deleted as if it were the annotation keyword.
 */

/** Resolve every `$ref` against `defs`, inlining recursively. Acyclic for every schema this repo
 * emits (the one back-edge, field-assignment.fieldId, is mode:reference — an id shape, not a $ref). */
export function resolveRefs(node, defs, seen = new Set()) {
  if (Array.isArray(node)) return node.map((n) => resolveRefs(n, defs, seen));
  if (node && typeof node === "object") {
    if (typeof node.$ref === "string") {
      const key = node.$ref.replace("#/$defs/", "");
      if (seen.has(key)) return {}; // cycle guard (defensive; not expected)
      const target = defs[key];
      if (!target) throw new Error(`schema-closure: unresolved $ref ${node.$ref}`);
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

export const ANNOT = new Set(["description", "$comment", "deprecated", "title", "$id", "$schema", "x-srs-range-type", "default"]);
export const ENVELOPE = new Set(["allOf", "if", "then", "else", "oneOf", "anyOf", "not"]);

/** Strip annotations + approximated envelopes recursively (both sides). `inPropertiesBag` marks a
 * node whose OWN keys are property names, never annotation keywords, even when a property happens
 * to be named e.g. "description" (a Field literally named `description` must not be silently
 * exempted from closure — the RFC-040 Unit 1 fix this guard preserves). */
export function normalize(node, inPropertiesBag = false) {
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

/** Fully resolve `$ref`s then strip annotations/envelopes — the one preparation step both sides of
 * every comparison go through before `isSub`. */
export const prep = (schema) => normalize(resolveRefs(schema, schema.$defs || {}));

const setEq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** Recursive `emitter ⊆ seed`: every emitter property/keyword must be present-and-consistent in the
 * seed; the seed may carry more. `required` is a set-subset; leaf constraints must be equal. */
export function isSub(e, s, path, errs) {
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

/**
 * Compare one emitted entity schema against its committed seed counterpart, both already `prep()`-
 * ed. Walks the top-level `properties` bag: divergence-register keys are counted and skipped;
 * emitter-only properties absent from the seed are errors; everything else goes through `isSub`.
 * Returns `{ matched, excluded }` — `excluded` is the list of seed-only properties not covered by
 * the emitter (surfaced by the caller so a coverage regression cannot hide inside the exclusion).
 * `errs` is appended to in place, and `divergencesSeen` (an array) collects which registered keys
 * actually fired, so the caller can assert the register doesn't contain a rotted no-op entry.
 */
export function compareEntity(emitted, seed, entityLabel, { divergence = {}, errs, divergencesSeen }) {
  const e = prep(emitted);
  const s = prep(seed);
  let matched = 0;
  for (const [pk, pv] of Object.entries(e.properties)) {
    if (pk in divergence) { divergencesSeen.push(`${entityLabel}.${pk}`); continue; }
    if (!(pk in s.properties)) { errs.push(`${entityLabel}.properties.${pk}: emitter-only property absent from seed`); continue; }
    const before = errs.length;
    isSub(pv, s.properties[pk], `${entityLabel}.${pk}`, errs);
    if (errs.length === before) matched++;
  }
  const sreq = new Set(s.required || []);
  for (const r of e.required || []) if (!(r in divergence) && !sreq.has(r)) errs.push(`${entityLabel}.required: emitter requires "${r}" not required in seed`);
  // `$schema` (RFC-031 R1 carve-out): a property NAME every entity file may carry as self-reference
  // metadata, emitted structurally rather than walked as a FieldAssignment — never modelled, by design.
  const excluded = Object.keys(s.properties).filter((k) => k !== "$schema" && !(k in e.properties));
  return { matched, excluded };
}
