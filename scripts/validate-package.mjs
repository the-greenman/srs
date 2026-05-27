#!/usr/bin/env node
/**
 * Validate package structure
 */
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const errors = [];
const warnings = [];

async function loadJSON(path) {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    errors.push(`Failed to load ${path}: ${e.message}`);
    return null;
  }
}

async function validatePackage() {
  console.log('Validating package...');

  // Load package.json
  const pkg = await loadJSON('package/package.json');
  if (!pkg) return { errors, warnings, valid: false };

  // Check required fields
  if (!pkg.id) warnings.push('package.json missing id');
  if (!pkg.namespace) errors.push('package.json missing namespace');
  if (!pkg.name) errors.push('package.json missing name');
  if (!pkg.version) errors.push('package.json missing version');

  // Validate fields
  const fieldFiles = await readdir('package/fields');
  const jsonFieldFiles = fieldFiles.filter(f => f.endsWith('.json'));

  console.log(`  Checking ${jsonFieldFiles.length} field definitions...`);

  for (const fieldFile of jsonFieldFiles) {
    const field = await loadJSON(join('package/fields', fieldFile));
    if (!field) continue;

    if (!field.id) errors.push(`Field ${fieldFile} missing id`);
    if (!field.namespace) errors.push(`Field ${fieldFile} missing namespace`);
    if (!field.name) errors.push(`Field ${fieldFile} missing name`);
    if (!field.valueType) errors.push(`Field ${fieldFile} missing valueType`);
    if (!field.aiGuidance) warnings.push(`Field ${fieldFile} missing aiGuidance`);
  }

  // Validate types
  const typeFiles = await readdir('package/types');
  const jsonTypeFiles = typeFiles.filter(f => f.endsWith('.json'));

  console.log(`  Checking ${jsonTypeFiles.length} type definitions...`);

  for (const typeFile of jsonTypeFiles) {
    const type = await loadJSON(join('package/types', typeFile));
    if (!type) continue;

    if (!type.id) errors.push(`Type ${typeFile} missing id`);
    if (!type.namespace) errors.push(`Type ${typeFile} missing namespace`);
    if (!type.name) errors.push(`Type ${typeFile} missing name`);
    if (!type.fields || !Array.isArray(type.fields)) {
      errors.push(`Type ${typeFile} missing fields array`);
    }
  }

  // Report
  console.log(`\n  Errors: ${errors.length}`);
  errors.forEach(e => console.log(`    ✗ ${e}`));

  console.log(`  Warnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`    ⚠ ${w}`));

  const valid = errors.length === 0;
  console.log(`\n  ${valid ? '✓ Package is valid' : '✗ Package validation failed'}`);

  return { errors, warnings, valid };
}

validatePackage().then(result => {
  process.exit(result.valid ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
