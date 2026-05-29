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
const SCHEMA_DIR = join(ROOT, '../docs/schema/2.0');
const RFC_TYPE_ID = '6a000001-0000-4000-a000-000000000001';
const RFC_CHANGE_TYPE_ID = '6a000002-0000-4000-a000-000000000002';
const RFC_REVISION_TYPE_ID = '6a000003-0000-4000-a000-000000000003';
const RFC_PROPOSED_ARTIFACT_TYPE_ID = '6a000006-0000-4000-a000-000000000006';
const F_RFC_NUMBER = '5a000001-0000-4000-a000-000000000001';
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
  return path === 'package' || path.startsWith('package/') || path === 'docs/schema' || path.startsWith('docs/schema/');
}

async function validatePackageWithSchemas(packageDir, fieldSchemaPath, typeSchemaPath) {
  const manifestPath = join(ROOT, packageDir, 'package.json');
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

  for (const relativePath of manifest.relationTypes ?? []) {
    const fullPath = join(ROOT, packageDir, relativePath);
    const relationType = await loadJson(fullPath);
    if (!relationType) continue;
    for (const schemaError of validateJsonSchema(relationType, relationTypeSchema)) {
      errors.push(`${rel(fullPath)}: ${schemaError}`);
    }
  }
}

async function main() {
  console.log('Validating RFC process boundaries...');

  const manifest = await loadJson(join(ROOT, 'manifest.json'));
  const relationsCollection = await loadJson(join(ROOT, 'relations/relations.json'));
  const relations = relationsCollection?.relations ?? [];
  const indexedRecords = new Map();
  const indexedRecordPaths = new Map();
  for (const indexEntry of manifest?.instanceIndex ?? []) {
    const instancePath = typeof indexEntry === 'string' ? indexEntry : indexEntry.path;
    const fullPath = join(ROOT, instancePath);
    const record = await loadJson(fullPath);
    if (record?.instanceId) {
      indexedRecords.set(record.instanceId, record);
      indexedRecordPaths.set(record.instanceId, instancePath);
    }
  }

  const rfcDir = join(ROOT, 'records/rfcs');
  const filenames = (await readdir(rfcDir)).filter(name => name.endsWith('.json'));

  for (const filename of filenames) {
    const fullPath = join(rfcDir, filename);
    const record = await loadJson(fullPath);
    if (!record || record.typeId !== RFC_TYPE_ID) continue;

    const status = fieldValue(record, F_STATUS);
    const rfcNumber = fieldValue(record, F_RFC_NUMBER);
    const artifactPath = fieldValue(record, F_PROPOSAL_ARTIFACT_PATH);

    if (!rfcNumber) {
      errors.push(`${rel(fullPath)}: missing rfc-number`);
    }

    if (artifactPath && isActivePath(artifactPath)) {
      errors.push(`${rel(fullPath)}: proposal artifact path must not point at active package/schema state: ${artifactPath}`);
    }

    if (['draft', 'proposed', 'accepted'].includes(status) && artifactPath) {
      const fullArtifactPath = join(ROOT, artifactPath);
      if (!(await exists(fullArtifactPath))) {
        errors.push(`${rel(fullPath)}: proposal artifact path does not exist: ${artifactPath}`);
      }
    }

    for (const relationType of ['rfc-change-sequence', 'rfc-revision-sequence', 'rfc-proposed-artifact-sequence']) {
      const sequence = relations.find(relation => (relation.relationType ?? relation.type) === relationType && (relation.from ?? relation.sourceInstanceId) === record.instanceId);
      if (!sequence) continue;
      if (!Array.isArray(sequence.members) || sequence.members.length === 0) {
        errors.push(`relations/relations.json: ${sequence.id} must contain a non-empty members array`);
        continue;
      }

      const expectedType = {
        'rfc-change-sequence': RFC_CHANGE_TYPE_ID,
        'rfc-revision-sequence': RFC_REVISION_TYPE_ID,
        'rfc-proposed-artifact-sequence': RFC_PROPOSED_ARTIFACT_TYPE_ID,
      }[relationType];

      for (const memberId of sequence.members) {
        const member = indexedRecords.get(memberId);
        if (!member) {
          errors.push(`relations/relations.json: ${sequence.id} references unknown member ${memberId}`);
          continue;
        }
        if (member.typeId !== expectedType) {
          errors.push(`relations/relations.json: ${sequence.id} member ${memberId} has wrong type ${member.typeName}`);
        }
      }
    }
  }

  const rfc004 = [...indexedRecords.values()].find(record => record.typeId === RFC_TYPE_ID && fieldValue(record, F_RFC_NUMBER) === '004');
  if (rfc004) {
    for (const relationType of ['rfc-change-sequence', 'rfc-revision-sequence', 'rfc-proposed-artifact-sequence']) {
      if (!relations.some(relation => (relation.relationType ?? relation.type) === relationType && (relation.from ?? relation.sourceInstanceId) === rfc004.instanceId)) {
        errors.push(`relations/relations.json: RFC-004 is missing ${relationType}`);
      }
    }
  }

  for (const relation of relations.filter(relation => (relation.relationType ?? relation.type) === 'rfc-targets-section')) {
    const from = relation.from ?? relation.sourceInstanceId;
    const to = relation.to ?? relation.targetInstanceId;
    if (!indexedRecords.has(from)) {
      errors.push(`relations/relations.json: ${relation.id ?? relation.relationId} has unknown RFC source ${from}`);
    }
    if (!indexedRecords.has(to)) {
      errors.push(`relations/relations.json: ${relation.id ?? relation.relationId} has unknown target ${to}`);
    }
  }

  const rfc004Root = join(ROOT, 'rfcs/rfc-004');
  if (await exists(rfc004Root)) {
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-core',
      join(ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(ROOT, 'docs/schema/2.0/type.json'),
    );
    await validatePackageWithSchemas(
      'rfcs/rfc-004/proposed-package/spec-authoring-json-schema',
      join(ROOT, 'rfcs/rfc-004/proposed-schemas/field.json'),
      join(ROOT, 'docs/schema/2.0/type.json'),
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
