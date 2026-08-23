#!/usr/bin/env node
/**
 * check-invariant-placement.mjs — every `com.semanticops.spec/invariant` record lives in the RFC-016
 * projection root, fail-closed (srs#410).
 *
 * The defect this closes: RFC-016 [R1] is literal — "every `com.semanticops.spec/invariant` record
 * present in the repository MUST appear in the rendered Key Invariants section" — and until now that
 * was true only by convention; nothing enforced it. The three RFC-011 invariants (011-1/2/3) lived
 * under `srs/package/records/` for weeks with [R1] silently false, papered over by a
 * publication-reachability exclusion whose stated reason ("RFC-011 is not accepted") was itself
 * wrong: RFC-011 is Accepted, so the exclusion was hiding a real [R1] violation rather than
 * documenting a deliberate one (srs#410, rfc-decision `invariant-placement-is-ratification`).
 *
 * `check-publication-reachability.mjs` (#285) already refuses to treat a `records/invariants/`
 * sibling or subdirectory as published — but that guard's escape hatch is the exclusion list, which
 * is exactly the lever that let the RFC-011 records sit outside the root indefinitely. This guard
 * has no escape hatch: an invariant-typed record outside `records/invariants/` is always an error,
 * never something a `publication-reachability-exclusions.json` entry can excuse. That is the point —
 * per the srs#410 decision, invariant normativity is "RFC acceptance + projection-root placement";
 * placement in the root IS the ratification act, so a stray invariant is a diagnostic to fix by
 * relocating (and renumbering, per that decision), not a fact to declare and move past.
 *
 * The projection root is imported from `render-invariants.mjs` rather than restated, for the same
 * reason the #285 guard does: two definitions of "the root" would drift silently.
 *
 * Node pipeline only, per ADR-004 — the embedded binary has no notion of "an invariant record
 * outside the projection root"; this is an authoring-corpus rule, not a load-time invariant.
 *
 *   node scripts/check-invariant-placement.mjs [root]   # root defaults to the repo root
 */
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadInstances } from "./lib/rfc-038-tree.mjs";
import { INVARIANT_PROJECTION_ROOT, isInInvariantProjectionRoot } from "./render-invariants.mjs";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = `${ROOT}/srs`;

const TYPE_NAMESPACE = "com.semanticops.spec";
const TYPE_NAME = "invariant";

async function main() {
  const instances = await loadInstances(REPO);
  const invariants = instances.filter(
    ({ record }) => record?.typeNamespace === TYPE_NAMESPACE && record?.typeName === TYPE_NAME,
  );

  console.log("Invariant placement (srs#410)");

  // A guard that checked nothing is not a guard that found nothing — the fail-open mode this class
  // of check exists to close, one level up. The live corpus carries well over 100.
  if (invariants.length === 0) {
    console.log(`\n✗ No ${TYPE_NAMESPACE}/${TYPE_NAME} records found anywhere under ${REPO}.`);
    console.log(`  This repository normally carries well over 100 — an empty walk means the root is wrong.`);
    process.exit(1);
  }

  console.log(`  ${TYPE_NAMESPACE}/${TYPE_NAME} records checked: ${invariants.length}`);
  console.log(`  Projection root: ${INVARIANT_PROJECTION_ROOT}/`);

  const stray = invariants.filter(({ path }) => !isInInvariantProjectionRoot(path));

  if (stray.length > 0) {
    console.log("");
    for (const { path, record } of stray) {
      console.log(`  ✗ ${path}`);
      console.log(
        `    ${TYPE_NAMESPACE}/${TYPE_NAME} record ${record.instanceId} is outside ${INVARIANT_PROJECTION_ROOT}/ — ` +
          `RFC-016 [R1] is literal: every invariant record in the repository must be projected, and this ` +
          `guard has no exclusion escape (srs#410). Relocate it into ${INVARIANT_PROJECTION_ROOT}/, renumbering ` +
          `to the next canonical I-<n> if it does not already carry one, or delete it if it is not meant to be ` +
          `a ratified invariant.`,
      );
    }
    console.log(`\n✗ ${stray.length} invariant record(s) found outside ${INVARIANT_PROJECTION_ROOT}/.`);
    process.exit(1);
  }

  console.log(`\n✓ Every ${TYPE_NAMESPACE}/${TYPE_NAME} record lives in ${INVARIANT_PROJECTION_ROOT}/`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
