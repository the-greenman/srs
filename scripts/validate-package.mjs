#!/usr/bin/env node
/**
 * Validate a package directory using the SRS repo's JSON schemas plus manifest checks.
 *
 * ALL TEN definition kinds are covered (#391). Until this change, `fields`, `types`, `views` and
 * `relationTypes` were path-checked and only the first, second and fourth were schema-validated;
 * `documentViews`, `themes`, `vocabularies`, `lifecycles`, `blueprints` and `protocols` were
 * neither. Live packages declare them — `srs/package/base`, and
 * `packages/com.mudemocracy.governance/1.1.0` declares 4 documentViews, 1 view, 1 lifecycle,
 * 1 blueprint and 1 protocol — so a malformed blueprint, or one listed at a path that does not
 * exist, passed `validate-all.mjs` in silence while #311's gate correctly reported
 * `blueprints → blueprint.json ✓`. A schema existing is not a validator being wired up.
 *
 * The kind list is DERIVED, never written here: `definitionKinds()` in
 * `check-schema-kind-correspondence.mjs` reads the properties `docs/schema/2.0/package-manifest.json`
 * declares and classifies each one against that file's total PROPERTY_SCHEMA table. One table, two
 * consumers. Listing the kinds again in this file would rebuild the exact "declared but never
 * checked" gap #391 is about, one file over — an eleventh kind would be added to the schema, given
 * a schema file to satisfy #311's gate, and still go unvalidated here.
 *
 * Usage:
 *   node scripts/validate-package.mjs
 *   node scripts/validate-package.mjs package/spec-authoring-core
 *   node scripts/validate-package.mjs package/spec-authoring-core /path/to/root   # tests only
 */
import { access, readdir, readFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';
import { definitionKinds } from './check-schema-kind-correspondence.mjs';

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree,
// the same seam both #308/#311 guards expose. Defaults to the repo root rather than `process.cwd()`
// so the script no longer silently validates nothing when run from elsewhere.
// `fileURLToPath`, not `new URL(..).pathname`, which is percent-encoded and resolves wrong under a
// checkout path containing a space.
const ROOT = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = join(ROOT, 'docs/schema/2.0');
const SRS_REPO = join(ROOT, 'srs');
const packageDir = process.argv[2] ?? 'package/spec-authoring-core';

const errors = [];
const warnings = [];

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`Failed to load ${path}: ${error.message}`);
    return null;
  }
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function rel(path) {
  if (path.startsWith(`${SRS_REPO}/`)) return path.slice(SRS_REPO.length + 1);
  // Published packages under `packages/**` are reached as `../packages/...` and so fall outside
  // SRS_REPO; without this they would be reported as absolute paths that differ per machine.
  if (path.startsWith(`${ROOT}/`)) return path.slice(ROOT.length + 1);
  return path;
}

function pushSchemaErrors(label, schemaErrors) {
  for (const schemaError of schemaErrors) {
    errors.push(`${label}: ${schemaError}`);
  }
}

async function validatePackageManifest(dirPath) {
  const manifestPath = join(dirPath, 'package.json');
  const manifest = await loadJson(manifestPath);
  if (!manifest) return null;
  return manifest;
}

async function validateManifestPaths(dirPath, manifest, subdir) {
  const listed = new Set();
  const manifestEntries = Array.isArray(manifest[subdir]) ? manifest[subdir] : [];

  for (const relativePath of manifestEntries) {
    const fullPath = join(dirPath, relativePath);
    listed.add(relativePath);
    if (!(await fileExists(fullPath))) {
      errors.push(`${rel(join(dirPath, 'package.json'))}: listed ${subdir.slice(0, -1)} file missing: ${relativePath}`);
    }
  }

  const folderPath = join(dirPath, subdir);
  if (!(await fileExists(folderPath))) return listed;

  const presentFiles = (await readdir(folderPath))
    .filter(name => name.endsWith('.json'))
    .map(name => `${subdir}/${name}`);

  for (const presentFile of presentFiles) {
    if (!listed.has(presentFile)) {
      warnings.push(`${rel(join(dirPath, 'package.json'))}: ${presentFile} exists but is not listed in package.json`);
    }
  }

  return listed;
}

async function main() {
  console.log(`Validating package in ${packageDir}...`);

  const packageManifestSchema = await loadSchema(join(SCHEMA_DIR, 'package-manifest.json'));

  const { kinds, unclassified } = await definitionKinds(ROOT);
  for (const property of unclassified) {
    // Reported, not skipped. A property package-manifest.json declares that PROPERTY_SCHEMA does
    // not classify means the table is incomplete, and quietly validating the kinds it does
    // recognise would be the same fail-open #311 exists to close. #311's own gate says the same
    // thing about the same property; this one refuses to claim the package was fully checked.
    errors.push(
      `docs/schema/2.0/package-manifest.json declares "${property}", which has no row in ` +
      `PROPERTY_SCHEMA (scripts/check-schema-kind-correspondence.mjs) — this package cannot be ` +
      `fully validated until it is classified.`,
    );
  }

  const dirPath = join(SRS_REPO, packageDir);
  const manifest = await validatePackageManifest(dirPath);
  if (!manifest) {
    process.exit(1);
  }

  pushSchemaErrors(rel(join(dirPath, 'package.json')), validateJsonSchema(manifest, packageManifestSchema));

  for (const { kind, schemaFile } of kinds) {
    await validateManifestPaths(dirPath, manifest, kind);

    const entries = Array.isArray(manifest[kind]) ? manifest[kind] : [];
    // Load the schema even when the package declares no entries of this kind: a kind mapped to a
    // schema file that is not there must fail, and skipping the load on an empty list would hide
    // exactly that — the state `protocols` was in until #378, arrived at from the other side.
    const schema = await loadSchema(join(SCHEMA_DIR, schemaFile)).catch((error) => {
      errors.push(`${kind}: cannot load docs/schema/2.0/${schemaFile}: ${error.message}`);
      return null;
    });

    console.log(`  Checking ${entries.length} ${kind} definitions against ${schemaFile}...`);
    if (!schema) continue;
    for (const relativePath of entries) {
      const fullPath = join(dirPath, relativePath);
      const definition = await loadJson(fullPath);
      if (!definition) continue;
      pushSchemaErrors(rel(fullPath), validateJsonSchema(definition, schema));
    }
  }

  console.log(`\n  Errors: ${errors.length}`);
  errors.forEach(error => console.log(`    ✗ ${error}`));

  console.log(`  Warnings: ${warnings.length}`);
  warnings.forEach(warning => console.log(`    ⚠ ${warning}`));

  const valid = errors.length === 0;
  console.log(`\n  ${valid ? '✓ Package is valid' : '✗ Package validation failed'}`);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
