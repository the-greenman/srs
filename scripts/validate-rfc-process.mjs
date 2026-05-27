#!/usr/bin/env node
/**
 * Validate RFC process boundaries.
 *
 * Draft/proposed RFC artifacts must live outside active package/schema roots.
 * RFC-owned proposed packages may be validated with RFC-owned proposed schemas.
 */
import { access, readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';

const ROOT = resolve('.');
const RFC_TYPE_ID = '6a000001-0000-4000-a000-000000000001';
const F_STATUS = '5a000002-0000-4000-a000-000000000002';
const F_PROPOSAL_ARTIFACT_PATH = '5a000016-0000-4000-a000-000000000016';

const errors = [];
const warnings = [];

function rel(path) {
  return path.startsWith(`${ROOT}/`) ? path.slice(ROOT.length + 1) : path;
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

function isActivePath(path) {
  return path === 'package' || path.startsWith('package/') || path === 'schemas' || path.startsWith('schemas/');
}

async function validatePackageWithSchemas(packageDir, fieldSchemaPath, typeSchemaPath) {
  const manifestPath = join(ROOT, packageDir, 'package.json');
  if (!(await exists(manifestPath))) return;

  const manifest = await loadJson(manifestPath);
  if (!manifest) return;

  const [fieldSchema, typeSchema] = await Promise.all([
    loadSchema(fieldSchemaPath),
    loadSchema(typeSchemaPath),
  ]);

  for (const relativePath of manifest.fields ?? []) {
    const fullPath = join(ROOT, packageDir, relativePath);
    const field = await loadJson(fullPath);
    if (!field) continue;
    for (const schemaError of validateJsonSchema(field, fieldSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }

  for (const relativePath of manifest.types ?? []) {
    const fullPath = join(ROOT, packageDir, relativePath);
    const type = await loadJson(fullPath);
    if (!type) continue;
    for (const schemaError of validateJsonSchema(type, typeSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }
}

async function main() {
  console.log('Validating RFC process boundaries...');

  const rfcDir = join(ROOT, 'records/rfcs');
  const filenames = (await readdir(rfcDir)).filter(name => name.endsWith('.json'));

  for (const filename of filenames) {
    const fullPath = join(rfcDir, filename);
    const record = await loadJson(fullPath);
    if (!record || record.typeId !== RFC_TYPE_ID) continue;

    const status = fieldValue(record, F_STATUS);
    const artifactPath = fieldValue(record, F_PROPOSAL_ARTIFACT_PATH);

    if (artifactPath && isActivePath(artifactPath)) {
      errors.push(`${rel(fullPath)}: proposal artifact path must not point at active package/schema state: ${artifactPath}`);
    }

    if (['draft', 'proposed', 'accepted'].includes(status) && artifactPath) {
      const fullArtifactPath = join(ROOT, artifactPath);
      if (!(await exists(fullArtifactPath))) {
        errors.push(`${rel(fullPath)}: proposal artifact path does not exist: ${artifactPath}`);
      }
    }
  }

  const rfc004Root = join(ROOT, 'rfcs/rfc-004');
  if (await exists(rfc004Root)) {
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-core',
      join(ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(ROOT, 'schemas/type.json'),
    );
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-json-schema',
      join(ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(ROOT, 'schemas/type.json'),
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
