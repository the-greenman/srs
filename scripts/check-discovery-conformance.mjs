#!/usr/bin/env node
/**
 * check-discovery-conformance.mjs — evaluates the `expectedSegments` expectation kind (srs#483).
 *
 * The `ext:discovery` conformance fixture's `expectedInstanceIds`/`exactMatch` pair can only assert
 * that an instance matched a query — it cannot express segment COUNT or ORDER. I-120 requires a
 * list-cardinality Field to emit "one segment per array element in order"; #317 found that claim
 * untestable through the existing interface and the #317-F2 disposition added a new expectation
 * kind, `expectedSegments`, to close it. This script is that expectation's runner.
 *
 * It is deliberately narrow: it does not reimplement the full Text Projection algorithm (tier
 * dispatch, searchability predicate, normalization) — that oracle already lives in srs-rust's
 * discovery_conformance test, which the existing expectedInstanceIds scenarios exercise. This
 * script only projects ONE named field of ONE named instance into its ordered segment list, using
 * the single rule expectedSegments exists to test: a list-cardinality value emits one segment per
 * array element, in array order; a scalar value emits one segment. Building the whole algorithm a
 * second time here would be a second implementation of the same goal (see repo convention: one
 * mechanism per goal) — the goal here is only "can segment count/order be asserted at all".
 *
 * Node pipeline only, no `srs` binary involved: fixture-repo is intentionally NOT readable by the
 * pinned CLI (RFC-038 Rev 7 exemption, see conformance/discovery/README.md), so this reads the
 * tree directly, the same way srs-rust's discovery_conformance test does.
 *
 * Wired into scripts/validate-all.mjs.
 */
import { readFile } from "fs/promises";
import { join, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const CONFORMANCE_DIR = join(ROOT, "conformance", "discovery");
const FIXTURE_REPO = join(CONFORMANCE_DIR, "fixture-repo");

/** One segment per array element in order (I-120); a scalar value is a single segment. */
function projectSegments(value) {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [String(value)];
}

async function loadInstance(manifest, instanceId) {
  const entry = manifest.instanceIndex.find((e) => e.instanceId === instanceId);
  if (!entry) return null;
  const record = JSON.parse(await readFile(join(FIXTURE_REPO, entry.path), "utf-8"));
  return record;
}

async function main() {
  const scenarios = JSON.parse(
    await readFile(join(CONFORMANCE_DIR, "scenarios.json"), "utf-8"),
  ).scenarios;
  const manifest = JSON.parse(
    await readFile(join(FIXTURE_REPO, "manifest.json"), "utf-8"),
  );

  const withExpectedSegments = scenarios.filter((s) => s.expectedSegments);
  if (withExpectedSegments.length === 0) {
    console.log("No expectedSegments scenarios found in conformance/discovery/scenarios.json.");
    process.exit(1);
  }

  let allValid = true;
  for (const scenario of withExpectedSegments) {
    const { instanceId, fieldName, segments: expected } = scenario.expectedSegments;
    const record = await loadInstance(manifest, instanceId);
    if (!record) {
      console.log(`✗ ${scenario.name}: instance ${instanceId} not found in fixture-repo manifest`);
      allValid = false;
      continue;
    }
    const rawValue = record.fieldValues?.[fieldName];
    if (rawValue === undefined) {
      console.log(`✗ ${scenario.name}: field '${fieldName}' not found on instance ${instanceId}`);
      allValid = false;
      continue;
    }
    const actual = projectSegments(rawValue);

    if (actual.length !== expected.length) {
      console.log(
        `✗ ${scenario.name}: segment COUNT mismatch for '${fieldName}' on ${instanceId} — expected ${expected.length} [${expected.join(", ")}], got ${actual.length} [${actual.join(", ")}]`,
      );
      allValid = false;
      continue;
    }

    const orderMismatch = expected.findIndex((text, i) => text !== actual[i]);
    if (orderMismatch !== -1) {
      console.log(
        `✗ ${scenario.name}: segment ORDER mismatch for '${fieldName}' on ${instanceId} at index ${orderMismatch} — expected [${expected.join(", ")}], got [${actual.join(", ")}]`,
      );
      allValid = false;
      continue;
    }

    console.log(`✓ ${scenario.name}: ${actual.length} segments, order matches`);
  }

  process.exit(allValid ? 0 : 1);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
