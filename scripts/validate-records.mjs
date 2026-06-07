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
import { join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';

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
    } else if (entry.name.endsWith('.json')) {
      files.push({ fullPath, relativePath });
    }
  }

  return files;
}

const SRS_RECORDS_ROOT = join(ROOT, 'srs');

function rel(path) {
  return path.startsWith(`${SRS_RECORDS_ROOT}/`) ? path.slice(SRS_RECORDS_ROOT.length + 1) : path;
}

async function loadInstalledRelationTypes() {
  const manifestPath = join(SRS_RECORDS_ROOT, 'package/package.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return new Map();
  }
  const defs = new Map();
  for (const relativePath of manifest.relationTypes ?? []) {
    try {
      const def = JSON.parse(await readFile(join(SRS_RECORDS_ROOT, 'package', relativePath), 'utf8'));
      const defKey = def.key ?? def.relationType;
      if (defKey) defs.set(defKey, def);
    } catch {
      // missing file will be caught by validate-package
    }
  }
  return defs;
}

async function validateRelations(relDefs) {
  const manifestPath = join(SRS_RECORDS_ROOT, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return;
  }
  const relationsPath = manifest.relationsPath ?? 'relations/relations.json';
  const fullRelPath = join(SRS_RECORDS_ROOT, relationsPath);
  let collection;
  try {
    collection = JSON.parse(await readFile(fullRelPath, 'utf8'));
  } catch {
    return;
  }

  const relations = collection.relations ?? [];
  console.log(`  Checking ${relations.length} relations against installed definitions...`);

  for (const relation of relations) {
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
    ],
    [
      'https://srs.semanticops.com/schema/2.0/typed-record.json',
      await loadSchema(join(SCHEMA_DIR, 'typed-record.json'))
    ]
  ]);

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

  const valid = invalidCount === 0;
  console.log(`\n  ${valid ? '✓ All instances are valid' : '✗ Instance validation failed'}`);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
