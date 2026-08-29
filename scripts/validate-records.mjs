#!/usr/bin/env node
/**
 * Validate instance files under records/ using their declared structural schema.
 * Run from the repo root (parent of srs/).
 *
 * Usage:
 *   node scripts/validate-records.mjs
 *   node scripts/validate-records.mjs records
 */
import { readFile, readdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';
import { loadRelations } from './lib/rfc-038-tree.mjs';

const ROOT = resolve('.');
const SCHEMA_DIR = join(ROOT, 'docs/schema/2.0');
const recordsDir = process.argv[2] ?? 'records';

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

async function findRecordFiles(dir, basePath = '') {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...await findRecordFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.json') && !entry.name.endsWith('.revisions.json')) {
      // `.revisions.json` is an ext:addressability sidecar (per-field revision history), not an
      // instance — same exclusion as rfc-038-tree.mjs's walkJson, restated here because this
      // walk predates that shared helper and hasn't been unified with it (srs#447 fixup).
      files.push({ fullPath, relativePath });
    }
  }

  return files;
}

const SRS_RECORDS_ROOT = join(ROOT, 'srs');

function rel(path) {
  return path.startsWith(`${SRS_RECORDS_ROOT}/`) ? path.slice(SRS_RECORDS_ROOT.length + 1) : path;
}

// RFC-038 [R5]: a local package root is PRESENCE-keyed (any directory under `package/` holding a
// `package.json`), not `packageRefs`-keyed — `srs/manifest.json` only lists 5 of the local package
// roots that actually exist on disk. `package/core/package.json` (the canonical seven relation
// types: contains, depends-on, supersedes, refines, derived-from, evidences, precedes) is one of
// the roots a `packageRefs`-only read misses, which is why every relation using them reported "no
// installed definition" despite the definitions being live in the tree.
async function findPackageManifests(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  // Sorted, and excluding only `node_modules` — matching validate-all.mjs's discoverPackages(),
  // whose walk this mirrors, so the two cannot silently diverge on which roots they find.
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await findPackageManifests(full));
    } else if (entry.name === 'package.json') {
      out.push(full);
    }
  }
  return out;
}

async function loadInstalledRelationTypes() {
  // Sorted traversal order (above) makes a same-key collision across two roots deterministic —
  // last-write-wins by path, not by whatever order the filesystem happens to hand back entries in.
  const manifestPaths = await findPackageManifests(join(SRS_RECORDS_ROOT, 'package'));
  const defs = new Map();
  for (const manifestPath of manifestPaths) {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    } catch (error) {
      errors.push(`${rel(manifestPath)}: package manifest does not parse (${error.message}); its relation types cannot be resolved`);
      continue;
    }
    // Each manifest's `relationTypes` entries are relative to that manifest's OWN directory, not to
    // `package/` — true of every local package root, including the root manifest itself (whose
    // entries reach into `spec-authoring-core/` by prefix, relative to `package/`).
    const packageDir = dirname(manifestPath);
    for (const relativePath of manifest.relationTypes ?? []) {
      try {
        const def = JSON.parse(await readFile(join(packageDir, relativePath), 'utf8'));
        const defKey = def.key ?? def.relationType;
        if (defKey) defs.set(defKey, def);
      } catch {
        // missing file will be caught by validate-package
      }
    }
  }
  return defs;
}

async function validateRelations(relDefs) {
  // RFC-038 [R11]: one Relation per file under relations/. There is no relationsPath.
  const loaded = await loadRelations(SRS_RECORDS_ROOT);
  console.log(`  Checking ${loaded.length} relations against installed definitions...`);

  for (const { path: relationsPath, relation } of loaded) {
    const rt = relation.relationType;
    if (!rt) {
      errors.push(`${relationsPath}: relation ${relation.relationId ?? '(unknown)'} missing relationType`);
      continue;
    }
    const def = relDefs.get(rt);
    if (!def) {
      errors.push(`${relationsPath}: relation ${relation.relationId}: relationType "${rt}" has no installed definition`);
      continue;
    }
    const status = def.status ?? 'active';
    if (status === 'retired') {
      errors.push(`${relationsPath}: relation ${relation.relationId}: relationType "${rt}" definition is retired`);
    } else if (status === 'deprecated' || status === 'tombstone') {
      warnings.push(`${relationsPath}: relation ${relation.relationId}: relationType "${rt}" definition is ${status}`);
    }
    if (def.irreflexive && relation.sourceInstanceId === relation.targetInstanceId) {
      errors.push(`${relationsPath}: relation ${relation.relationId}: relationType "${rt}" is irreflexive but source === target`);
    }
  }
}

async function main() {
  console.log(`Validating instances in ${recordsDir}...`);

  const schemasByUrl = new Map([
    [
      'https://srs.semanticops.com/schema/2.0/record.json',
      await loadSchema(join(SCHEMA_DIR, 'record.json'))
    ],
    [
      'https://srs.semanticops.com/schema/2.0/note.json',
      await loadSchema(join(SCHEMA_DIR, 'note.json'))
    ]
  ]);

  // rfc-decision-53635966 (srs#448): Tier 1 (TypedRecord) is removed from the standard —
  // typed-record.json no longer exists. A file still declaring that $schema is never silently
  // skipped or generically "unsupported": it is rejected by name, citing the decision, so a
  // stray Tier-1 file reads as a migration error rather than a mystery schema mismatch.
  const RETIRED_TYPED_RECORD_SCHEMA = 'https://srs.semanticops.com/schema/2.0/typed-record.json';

  const [relDefs, recordFiles] = await Promise.all([
    loadInstalledRelationTypes(),
    findRecordFiles(join(SRS_RECORDS_ROOT, recordsDir)),
  ]);
  console.log(`  Found ${recordFiles.length} instance files`);

  let validCount = 0;
  let invalidCount = 0;

  for (const { fullPath, relativePath } of recordFiles) {
    const record = await loadJson(fullPath);
    if (!record) {
      invalidCount++;
      continue;
    }

    const declaredSchema = record.$schema;

    if (declaredSchema === RETIRED_TYPED_RECORD_SCHEMA) {
      invalidCount++;
      errors.push(`${recordsDir}/${relativePath}: Tier 1 (TypedRecord) is retired (rfc-decision-53635966, srs#448) — typed-record.json no longer exists; migrate this instance to a Note (Tier 0) or a Record (Tier 2)`);
      continue;
    }

    const schema = schemasByUrl.get(declaredSchema);

    if (!schema) {
      invalidCount++;
      errors.push(`${recordsDir}/${relativePath}: unsupported or missing $schema: ${declaredSchema ?? '(missing)'}`);
      continue;
    }

    const schemaErrors = validateJsonSchema(record, schema);
    if (!record.sourceRefs) {
      warnings.push(`${recordsDir}/${relativePath}: missing sourceRefs (optional but recommended)`);
    }

    if (schemaErrors.length > 0) {
      invalidCount++;
      errors.push(...schemaErrors.map(error => `${recordsDir}/${relativePath}: ${error}`));
      continue;
    }

    validCount++;
  }

  await validateRelations(relDefs);

  console.log(`\n  Valid: ${validCount}`);
  console.log(`  Invalid: ${invalidCount}`);

  if (errors.length > 0) {
    console.log(`\n  Errors (${errors.length}):`);
    errors.forEach(error => console.log(`    ✗ ${error}`));
  }

  if (warnings.length > 0) {
    console.log(`\n  Warnings (${warnings.length}):`);
    warnings.forEach(warning => console.log(`    ⚠ ${warning}`));
  }

  // `errors` accumulates more than schema invalidity — relation-type resolution failures (#465) and
  // package-manifest parse failures land here too. A run that prints them and exits 0 anyway is the
  // defect #465 found: 222 relation errors were live on master while every CI run stayed green.
  const valid = invalidCount === 0 && errors.length === 0;
  console.log(`\n  ${valid ? '✓ All instances are valid' : '✗ Instance validation failed'}`);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
