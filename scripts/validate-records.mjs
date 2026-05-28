#!/usr/bin/env node
/**
 * Validate instance files under records/ using their declared structural schema.
 *
 * Usage:
 *   node scripts/validate-records.mjs
 *   node scripts/validate-records.mjs records
 */
import { readFile, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';

const ROOT = resolve('.');
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

function rel(path) {
  return path.startsWith(`${ROOT}/`) ? path.slice(ROOT.length + 1) : path;
}

async function main() {
  console.log(`Validating instances in ${recordsDir}...`);

  const schemasByUrl = new Map([
    [
      'https://srs.semanticops.com/schema/2.0/record.json',
      await loadSchema(join(ROOT, 'schemas/record.json'))
    ],
    [
      'https://srs.semanticops.com/schema/2.0/note.json',
      await loadSchema(join(ROOT, 'schemas/note.json'))
    ],
    [
      'https://srs.semanticops.com/schema/2.0/typed-record.json',
      await loadSchema(join(ROOT, 'schemas/typed-record.json'))
    ]
  ]);

  const recordFiles = await findRecordFiles(join(ROOT, recordsDir));
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
