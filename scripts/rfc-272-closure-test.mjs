#!/usr/bin/env node
/**
 * rfc-272-closure-test.mjs — Tier-2 structural closure for the instance-layer entities modelled at
 * srs#526 (Task 4b/2, epic #256/#272): Record, Note, Relation, Container, Blueprint, Term,
 * Vocabulary, Lifecycle (installable), SourceDocumentMeta.
 *
 * Same discipline as scripts/rfc-035-closure-test.mjs (RFC-033/RFC-040's frozen `field`/`type`
 * bootstrap), reusing its shared comparison machinery (scripts/lib/schema-closure.mjs): asserts
 * `emitter ⊆ committed seed` (docs/schema/2.0/{record,note,relation,container,blueprint,term,
 * vocabulary,lifecycle,source-document-meta}.json) over the properties this unit's metamodel Types
 * cover. AUTHORSHIP DOES NOT FLIP (srs#260 is owner-held): the committed files above remain the
 * loaded artifacts; this test proves the metamodel *could* generate them, never overwrites them.
 *
 * Two things distinguish this from the field/type test, both because the instance-layer entities
 * are structurally different from the definition-layer bootstrap:
 *
 *   - `facing`: Record/Note/Relation/Container/SourceDocumentMeta are emitted with
 *     `{ facing: "instance" }` so the emitter synthesizes their bare `meta: {type:"object"}` escape
 *     property (matching their committed shape, which has no `additionalProperties` on `meta`);
 *     Blueprint/Term/Vocabulary/Lifecycle use the default `"definition"` facing (no top-level `meta`
 *     in their committed shape — Term's nested `meta` is instead a REAL FieldAssignment, since Term
 *     is also emitted as a $def inside Vocabulary, where facing-synthesis does not apply).
 *   - a per-entity EXCLUSION note (not a divergence — nothing here is emitter ≠ seed for a covered
 *     property; these are simply not modelled, same "seed may carry more" latitude every entity
 *     already has): each entity's own hand-authored `$schema` const-pin (no per-entity string-const
 *     fieldType primitive exists yet — generic across every entity, handled by compareEntity itself);
 *     Container's deprecated `containerType`; Blueprint's bare "implementation-defined" aiGuidance/
 *     lineage/provenance bags (no real internal structure to model). Printed each run, same as the
 *     RFC-035 test's excluded-seed-only-props line, so a real coverage regression is still visible.
 *
 * Entities explicitly OUT OF SCOPE for this unit (ledger-gated on later #272 units, or a blocking
 * issue) are not covered here: `view.json` (#247, after Composition rename + exportConfig
 * relocation), `document-view.json`→`composition.json` and `document-view-output.json` (the
 * Composition rename, #523), `relation-type.json` (after the semanticObjectType collapse, #524/
 * #372), `manifest.json` (coupled to the Composition rename via renderedPresentations[].viewId),
 * `protocol.json` (blocked on #379), `package-bundle.json` (#390 decision) — see
 * docs/schema/2.0/generation-ledger.md.
 *
 * Node pipeline only (ADR-004). Runs under scripts/validate-all.mjs.
 */
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity } from "./lib/schema-emitter.mjs";
import { prep, isSub, compareEntity } from "./lib/schema-closure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const MM = join(REPO, "srs/package/metamodel");
const SEED = join(REPO, "docs/schema/2.0");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

// DIVERGENCE REGISTER: covered top-level properties where the emitter genuinely differs from the
// committed seed BY DESIGN (never silently passed — asserted to still diverge, below). One entry,
// on `lifecycle.states`: `lifecycle-state` is REUSED verbatim (srs#526's whole point — this Type
// and its `requiresRelation`/`relation-type` value objects already exist for RFC-040's inline
// `type-lifecycle` facet, and Invariant 4 — "at least one state, exactly one isInitial" — governs
// an installable Lifecycle exactly as it governs the inline facet). Reuse surfaces a PRE-EXISTING
// drift in the committed seed, not something this unit introduces:
//   (a) `type.json`'s inline `TypeLifecycle.states` already declares `minItems: 1`; the committed
//       `lifecycle.json`'s `states` does not — an inconsistency between the two committed files for
//       what should be the same invariant, surfaced by reuse, not created by it.
//   (b) `lifecycle.json`'s own `$defs.RequiresRelation.relationType` is still the PRE-RFC-032-Rev-7
//       `oneOf: [string, string[]]` form; `type.json`'s copy was already normalized to list-only
//       (Field #71's own doc comment: "RFC-032 Change F normalized this declaration form from
//       string|string[] to a list (length >= 1); the single-string form is removed"). `lifecycle.json`
//       was evidently never updated to match — a real, pre-existing fidelity gap on the SEED side,
//       flagged here and in the PR body for a future fixup unit (Door 1: execute the already-ratified
//       RFC-032 Rev-7 normalization onto the one committed file that missed it), not hand-edited now.
const DIVERGENCE = {
  lifecycle: {
    states:
      "lifecycle-state (incl. its nested requiresRelation/relation-type) is reused verbatim from the RFC-040 type-lifecycle facet. The reused Field's minItems:1 (Invariant 4) and normalized list-only RequiresRelation.relationType are both correct against the model; lifecycle.json's committed `states`/`requiresRelation.relationType` have not been updated to match (pre-existing drift between type.json and lifecycle.json, surfaced by this unit's reuse — a Door-1 fixup candidate, not actioned here).",
  },
};

// entity (metamodel Type name) -> [seed file, facing].
const ENTITIES = [
  ["note", "note.json", "instance"],
  ["record", "record.json", "instance"],
  ["relation", "relation.json", "instance"],
  ["container", "container.json", "instance"],
  ["blueprint", "blueprint.json", "definition"],
  ["term", "term.json", "definition"],
  ["vocabulary", "vocabulary.json", "definition"],
  ["lifecycle", "lifecycle.json", "definition"],
  ["source-document-meta", "source-document-meta.json", "instance"],
];

const ctx = loadPackage(MM);
const errs = [];
const divergencesSeen = [];
let totalMatched = 0;
const excludedByEntity = {};

for (const [typeName, seedFile, facing] of ENTITIES) {
  const emitted = emitEntity(ctx, typeName, { facing });
  const seed = load(join(SEED, seedFile));
  const divergence = DIVERGENCE[typeName] || {};
  const { matched, excluded } = compareEntity(emitted, seed, typeName, { divergence, errs, divergencesSeen });
  totalMatched += matched;
  excludedByEntity[typeName] = excluded;
}

// Assert every register entry still genuinely diverges (mirrors rfc-035-closure-test.mjs) — a
// register entry that no longer differs has rotted into a silent no-op and must be removed.
for (const [typeName, div] of Object.entries(DIVERGENCE)) {
  const [, seedFile, facing] = ENTITIES.find(([t]) => t === typeName);
  const e = prep(emitEntity(ctx, typeName, { facing }));
  const s = prep(load(join(SEED, seedFile)));
  for (const pk of Object.keys(div)) {
    const local = [];
    if (pk in e.properties && pk in s.properties) isSub(e.properties[pk], s.properties[pk], `${typeName}.${pk}`, local);
    if (local.length === 0) errs.push(`divergence register: ${typeName}.${pk} no longer diverges — remove it from the register`);
  }
}

console.log("RFC-272 (srs#526) Tier-2 closure — instance-layer entities (emitter ⊆ committed seed):");
console.log(`  authoritative properties consistent : ${totalMatched}`);
console.log(`  documented divergences (register)   : ${divergencesSeen.length}  [${divergencesSeen.join(", ")}]`);
for (const [ent, ex] of Object.entries(excludedByEntity)) {
  console.log(`  excluded seed-only props (${ent})${" ".repeat(Math.max(0, 22 - ent.length))}: ${ex.length}  [${ex.join(", ")}]`);
}

if (errs.length) {
  console.error(`\n✗ ${errs.length} closure failure(s):`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\n✓ closure holds: every covered authoritative property of Record/Note/Relation/Container/`);
console.log(`  Blueprint/Term/Vocabulary/Lifecycle/SourceDocumentMeta projects consistently into its`);
console.log(`  committed docs/schema/2.0/*.json seed; seed-only properties are the documented exclusion set.`);
