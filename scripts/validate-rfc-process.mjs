#!/usr/bin/env node
/**
 * Validate RFC process boundaries.
 *
 * This is the structural companion to scripts/check-rfc-integration.mjs (the drift gate).
 * It enforces the *boundary* rules that keep RFC proposal material separate from active spec
 * state, and validates the RFC-004 proposed-package fixture (the demonstration that a proposed
 * package can be validated against proposed schemas without touching live schemas):
 *
 *   1. A proposal-artifact-path (5a000016) must never point at active package/ or docs/schema/
 *      state — proposals live under rfcs/, active spec lives under package/ + docs/schema/.
 *   2. Any rfc-targets-section relation must reference indexed instances on both ends.
 *   3. The rfcs/rfc-004 proposed-package validates against its proposed schemas.
 *
 * Self-locating (runs from anywhere). The stale sequence/hyperedge checks that assumed a
 * members[] relation format were removed — the live relation model is binary
 * (sourceInstanceId/targetInstanceId) and no rfc-*-sequence relations exist.
 */
import { access, readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';

const SRS_ROOT = resolve(new URL('..', import.meta.url).pathname); // the srs repo root
const REPO_ROOT = join(SRS_ROOT, 'srs'); // the self-describing spec repo
const SCHEMA_DIR = join(SRS_ROOT, 'docs', 'schema', '2.0');

const RFC_TYPE_ID = '6a000001-0000-4000-a000-000000000001';
const F_RFC_NUMBER = '5a000001-0000-4000-a000-000000000001';
const F_PROPOSAL_ARTIFACT_PATH = '5a000016-0000-4000-a000-000000000016';

const errors = [];
const warnings = [];

function rel(path) {
  return path.startsWith(`${SRS_ROOT}/`) ? path.slice(SRS_ROOT.length + 1) : path;
}

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`${rel(path)}: ${error.message}`);
    return null;
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function fieldValue(record, fieldId) {
  return record.fieldValues?.find(field => field.fieldId === fieldId)?.value;
}

// A proposal artifact path (ROOT-relative) must not live inside the active spec's package or
// schema roots. Proposals live under rfcs/; active spec state lives under package/ + docs/schema/.
function isActivePath(path) {
  return path === 'package' || path.startsWith('package/') || path === 'docs/schema' || path.startsWith('docs/schema/');
}

async function validatePackageWithSchemas(packageDir, fieldSchemaPath, typeSchemaPath) {
  const manifestPath = join(SRS_ROOT, packageDir, 'package.json');
  if (!(await exists(manifestPath))) return;

  const manifest = await loadJson(manifestPath);
  if (!manifest) return;

  const relationTypeSchemaPath = join(SCHEMA_DIR, 'relation-type.json');
  const [fieldSchema, typeSchema, relationTypeSchema] = await Promise.all([
    loadSchema(fieldSchemaPath),
    loadSchema(typeSchemaPath),
    loadSchema(relationTypeSchemaPath),
  ]);

  for (const relativePath of manifest.fields ?? []) {
    const fullPath = join(SRS_ROOT, packageDir, relativePath);
    const field = await loadJson(fullPath);
    if (!field) continue;
    for (const schemaError of validateJsonSchema(field, fieldSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }

  for (const relativePath of manifest.types ?? []) {
    const fullPath = join(SRS_ROOT, packageDir, relativePath);
    const type = await loadJson(fullPath);
    if (!type) continue;
    for (const schemaError of validateJsonSchema(type, typeSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }

  for (const relativePath of manifest.relationTypes ?? []) {
    const fullPath = join(SRS_ROOT, packageDir, relativePath);
    const relationType = await loadJson(fullPath);
    if (!relationType) continue;
    for (const schemaError of validateJsonSchema(relationType, relationTypeSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }
}

async function main() {
  console.log('Validating RFC process boundaries...');

  const manifest = await loadJson(join(REPO_ROOT, 'manifest.json'));
  const relationsCollection = await loadJson(join(REPO_ROOT, 'relations/relations.json'));
  const relations = relationsCollection?.relations ?? [];

  const indexedRecords = new Map();
  for (const indexEntry of manifest?.instanceIndex ?? []) {
    const instancePath = typeof indexEntry === 'string' ? indexEntry : indexEntry.path;
    const record = await loadJson(join(REPO_ROOT, instancePath));
    if (record?.instanceId) indexedRecords.set(record.instanceId, record);
  }

  // 1. Boundary rule: proposal artifacts must not point at active package/schema state.
  const rfcDir = join(REPO_ROOT, 'records/rfcs');
  const filenames = (await readdir(rfcDir)).filter(name => name.endsWith('.json'));
  for (const filename of filenames) {
    const fullPath = join(rfcDir, filename);
    const record = await loadJson(fullPath);
    if (!record || record.typeId !== RFC_TYPE_ID) continue;

    if (!fieldValue(record, F_RFC_NUMBER)) {
      errors.push(`${rel(fullPath)}: missing rfc-number`);
    }

    const artifactPath = fieldValue(record, F_PROPOSAL_ARTIFACT_PATH);
    if (artifactPath && isActivePath(artifactPath)) {
      errors.push(`${rel(fullPath)}: proposal artifact path must not point at active package/schema state: ${artifactPath}`);
    }
  }

  // 2. rfc-targets-section relations (binary) must resolve on both ends.
  for (const relation of relations.filter(r => (r.relationType ?? r.type) === 'rfc-targets-section')) {
    const source = relation.sourceInstanceId;
    const target = relation.targetInstanceId;
    const id = relation.relationId ?? '(unknown)';
    if (!indexedRecords.has(source)) {
      errors.push(`relations/relations.json: ${id} has unknown RFC source ${source}`);
    }
    if (!indexedRecords.has(target)) {
      errors.push(`relations/relations.json: ${id} has unknown target ${target}`);
    }
  }

  // 3. RFC-004 proposed-package fixture validates against its proposed schemas.
  const rfc004Root = join(SRS_ROOT, 'rfcs/rfc-004');
  if (await exists(rfc004Root)) {
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-core',
      join(SRS_ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(SCHEMA_DIR, 'type.json'),
    );
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-json-schema',
      join(SRS_ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(SCHEMA_DIR, 'type.json'),
    );
  }

  console.log(`  Errors: ${errors.length}`);
  errors.forEach(error => console.log(`    ✗ ${error}`));

  console.log(`  Warnings: ${warnings.length}`);
  warnings.forEach(warning => console.log(`    ⚠ ${warning}`));

  const valid = errors.length === 0;
  console.log(`\n  ${valid ? '✓ RFC process is valid' : '✗ RFC process validation failed'}`);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
