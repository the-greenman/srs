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

/**
 * `View.fieldViews` is one mixed presentation sequence (FieldView | RecordPropertyView).
 * JSON Schema's uniqueItems compares whole objects, so it cannot enforce that their shared
 * `order` property is unique. Keep the semantic constraint beside schema validation rather than
 * pretending a duplicate order yields a deterministic presentation.
 */
function validateViewRowOrders(label, definition) {
  if (!Array.isArray(definition.fieldViews)) return;
  const seen = new Map();
  definition.fieldViews.forEach((row, index) => {
    if (!row || typeof row.order !== 'number') return; // structural schema reports this separately
    const first = seen.get(row.order);
    if (first !== undefined) {
      errors.push(`${label}: fieldViews[${index}].order ${row.order} duplicates fieldViews[${first}].order; View row order must be unique`);
    } else {
      seen.set(row.order, index);
    }
  });
}

async function validatePackageManifest(dirPath) {
  const manifestPath = join(dirPath, 'package.json');
  const manifest = await loadJson(manifestPath);
  if (!manifest) return null;
  return manifest;
}

async function validateManifestPaths(dirPath, manifest, kind) {
  const manifestEntries = Array.isArray(manifest[kind]) ? manifest[kind] : [];

  for (const relativePath of manifestEntries) {
    if (!(await fileExists(join(dirPath, relativePath)))) {
      // The kind name verbatim. `kind.slice(0, -1)` produced "listed vocabularie file missing" —
      // naive de-pluralisation is wrong here for the same reason it is wrong for kind → schema.
      errors.push(`${rel(join(dirPath, 'package.json'))}: listed ${kind} entry missing: ${relativePath}`);
    }
  }
}

/**
 * Warn about definition files that sit beside indexed ones but are not themselves indexed.
 *
 * Scans exactly the directories the manifest's own entries live in — the dirname of every listed
 * path, across every kind. That is derived from the data, so it works for the kebab-case folders
 * (`document-views/`, `relation-types/`) where a `join(dirPath, kind)` lookup finds nothing and the
 * check silently stops existing for precisely the kinds #391 added.
 *
 * Deliberately NOT a walk of the whole package directory. `srs/package` is both a package and the
 * parent of five others, each with its own manifest and its own separately-validated definitions,
 * so a recursive walk reports every sub-package's files as "unlisted" — 181 warnings where 1 is
 * real, which buries the finding it exists to surface. It would also flag nested `package.json`
 * files, which are not definitions. (`package/records/` — the RFC-011 stub and its rfc-change
 * records, previously excluded here too — was relocated into `records/tier-2/` per srs#530; it no
 * longer exists, so this walk no longer needs to know about it.)
 *
 * The folder set is the union of two sources, because neither alone is enough. Dirnames of listed
 * entries alone would drop the folders where NOTHING is indexed — `spec-authoring-core/views/`
 * holds three unlisted view files today and master warns about them; with an empty `views` array
 * there is no entry to take a dirname from. A kind-named folder alone is the kebab-case bug. So
 * both: every dirname the manifest references, plus every kind-named folder that actually exists on
 * disk (checked, never constructed — `documentViews/` does not exist and is simply not found).
 *
 * Folders inside a SUB-PACKAGE are then dropped, which is what makes the "does not descend" claim
 * above true of the dirname half too: a manifest may index across the boundary —
 * `srs/package/package.json` indexes five relation types that live under `spec-authoring-core/` —
 * and without this the parent's run scans a directory the child owns.
 *
 * That closes the parent side only, and deliberately. The mirror case is not fixed and cannot be
 * fixed here: if the CHILD manifest also indexes something in that folder, the child's run acquires
 * a dirname for it and reports the five parent-indexed files as unlisted, because from a
 * per-package check's point of view they are. Verified, not theorised — indexing a sixth relation
 * type in `spec-authoring-core/package.json` produces exactly those five spurious warnings today.
 * Teaching this function about other packages' manifests is a much larger change than the warning
 * is worth; the real lesson is that indexing across a package boundary is the smell. It is
 * currently harmless only because that child indexes no relation types at all, so no dirname
 * exists — which is the same limit recorded below, doing accidental duty as protection.
 *
 * Known limit, stated because the fix for it is a guess this file refuses to make: a kebab-case
 * folder is only reached when the manifest indexes at least one entry in it. Drop the whole
 * `documentViews` array and leave the files, and they go unwarned — there is no dirname left to
 * derive and `documentViews/` does not exist on disk. camelCase kinds (`fields`, `types`, `views`)
 * have no such hole, since the kind-named-folder check covers them. Closing it needs a kind →
 * folder mapping, which is the string surgery this codebase already refuses for kind → schema.
 */
async function warnUnlistedFiles(dirPath, manifest, kinds) {
  const listed = new Set(
    kinds.flatMap(({ kind }) => (Array.isArray(manifest[kind]) ? manifest[kind] : [])),
  );
  const folders = new Set(
    [...listed].map((entry) => entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : ''),
  );
  for (const { kind } of kinds) {
    if (await fileExists(join(dirPath, kind))) folders.add(kind);
  }

  // Drop anything owned by a sub-package: a directory under this one whose own `package.json`
  // makes it a separate package, validated on its own iteration of validate-all.mjs.
  const ownedBySubPackage = async (folder) => {
    const segments = folder.split('/').filter(Boolean);
    for (let i = 1; i <= segments.length; i++) {
      if (await fileExists(join(dirPath, ...segments.slice(0, i), 'package.json'))) return true;
    }
    return false;
  };
  for (const folder of [...folders]) {
    if (await ownedBySubPackage(folder)) folders.delete(folder);
  }

  for (const folder of [...folders].sort()) {
    let names;
    try {
      names = await readdir(join(dirPath, folder));
    } catch {
      continue; // a listed path whose folder is missing is already an error, reported above
    }
    for (const name of names.sort()) {
      if (!name.endsWith('.json')) continue;
      const relativePath = folder ? `${folder}/${name}` : name;
      if (relativePath === 'package.json') continue;
      if (!listed.has(relativePath)) {
        warnings.push(`${rel(join(dirPath, 'package.json'))}: ${relativePath} exists but is not listed in package.json`);
      }
    }
  }
}

async function main() {
  console.log(`Validating package in ${packageDir}...`);

  const packageManifestSchema = await loadSchema(join(SCHEMA_DIR, 'package-manifest.json'));

  const { properties, composed, kinds, unclassified } = await definitionKinds(ROOT);

  // The derivation's own preconditions, enforced here and not only in #311's gate. A
  // package-manifest.json whose properties are composed behind an allOf/$ref yields an EMPTY kind
  // list, and validating zero kinds without complaint prints "✓ Package is valid" over a package
  // this script never opened a single file of. Inside validate-all.mjs the sibling #311 run would
  // also go red, but a standalone per-package run would not — and that is the invocation a human
  // reaches for.
  if (composed.length > 0) {
    errors.push(
      `docs/schema/2.0/package-manifest.json composes its properties via ${composed.join(', ')} — ` +
      `the definition-kind list derived from it is incomplete, so this package cannot be fully ` +
      `validated. See scripts/check-schema-kind-correspondence.mjs.`,
    );
  }
  if (properties.length === 0 || kinds.length === 0) {
    errors.push(
      `docs/schema/2.0/package-manifest.json yielded no definition kinds ` +
      `(${properties.length} properties declared) — this script is not reading what it thinks it ` +
      `is, and a vacuous pass would be worse than a failure.`,
    );
  }

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

  await warnUnlistedFiles(dirPath, manifest, kinds);

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
      if (kind === 'views') validateViewRowOrders(rel(fullPath), definition);
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
