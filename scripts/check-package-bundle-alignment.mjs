#!/usr/bin/env node
/**
 * check-package-bundle-alignment.mjs — package-bundle.json carries what package-manifest.json
 * declares, and the two names `packageDependencies` / `dependencyRefs` keep one meaning each
 * (RFC-044, srs#855). Spec-authoring lints on this repository, not implementation conformance:
 *
 *   (a) [R6] every definition kind package-manifest.json declares (read through the same
 *       derivation check-schema-kind-correspondence.mjs uses) is an array property of
 *       package-bundle.json — "what a container can hold, a bundle can carry" (rfc-decision-8948e43f).
 *   (b) [R8] the two local `$defs.DependencyRef` copies are deep-equal.
 *   (c) [R7] no record under srs/records/ says `Package.packageDependencies` (the abstract Package
 *       model's definition-reference list is `dependencyRefs`).
 *   (d) [R2] the DependencyRef.version pattern accepts and rejects the RFC's fixture versions.
 *
 *   node scripts/check-package-bundle-alignment.mjs [root]   # root defaults to the repo root
 */
import { readFile, readdir } from "fs/promises";
import { join, resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { isDeepStrictEqual } from "util";
import { definitionKinds } from "./check-schema-kind-correspondence.mjs";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = join(ROOT, "docs/schema/2.0");

const SEMVER_VALID = ["1.2.0", "0.1.0", "1.0.0-rc.1", "1.0.0-rc.1+b5"];
const SEMVER_INVALID = ["1.0", "01.0.0", "v1.0.0", "1.0.0-01"];

const loadJson = async (p) => JSON.parse(await readFile(p, "utf8"));

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith(".json")) yield p;
  }
}

async function main() {
  console.log("Package bundle alignment (RFC-044)");
  const errors = [];
  const manifest = await loadJson(join(SCHEMA_DIR, "package-manifest.json"));
  const bundle = await loadJson(join(SCHEMA_DIR, "package-bundle.json"));

  // (a) [R6]
  const { kinds, composed } = await definitionKinds(ROOT);
  if (composed.length > 0 || kinds.length === 0) {
    errors.push("package-manifest.json yields no usable definition-kind list (see check-schema-kind-correspondence.mjs)");
  }
  for (const { kind } of kinds) {
    if (bundle.properties?.[kind]?.type !== "array") {
      errors.push(`[R6] package-manifest.json declares definition kind "${kind}" but package-bundle.json has no array property "${kind}"`);
    }
  }

  // (b) [R8]
  const m = manifest.$defs?.DependencyRef;
  const b = bundle.$defs?.DependencyRef;
  if (!m || !b) errors.push("[R8] $defs.DependencyRef missing from package-manifest.json or package-bundle.json");
  else if (!isDeepStrictEqual(m, b)) errors.push("[R8] package-bundle.json $defs.DependencyRef differs from package-manifest.json $defs.DependencyRef");

  // (c) [R7]
  const recordsDir = join(ROOT, "srs/records");
  let scanned = 0;
  for await (const p of walk(recordsDir)) {
    scanned++;
    if ((await readFile(p, "utf8")).includes("Package.packageDependencies")) {
      errors.push(`[R7] ${relative(ROOT, p)} says "Package.packageDependencies"; the definition-reference list is Package.dependencyRefs`);
    }
  }
  if (scanned === 0) errors.push(`no records found under ${relative(ROOT, recordsDir) || "."}; a scan of nothing is not a pass`);

  // (d) [R2]
  const pattern = m?.properties?.version?.pattern;
  if (!pattern) errors.push("[R2] DependencyRef.version has no pattern");
  else {
    const re = new RegExp(pattern, "u");
    for (const v of SEMVER_VALID) if (!re.test(v)) errors.push(`[R2] DependencyRef.version pattern rejects valid "${v}"`);
    for (const v of SEMVER_INVALID) if (re.test(v)) errors.push(`[R2] DependencyRef.version pattern accepts invalid "${v}"`);
  }

  if (errors.length > 0) {
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    console.log(`\n✗ ${errors.length} package bundle alignment problem(s).`);
    process.exit(1);
  }
  console.log(`  ${kinds.length} definition kinds carried; DependencyRef copies equal; ${scanned} records scanned`);
  console.log("\n✓ package-bundle.json is aligned with package-manifest.json");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
