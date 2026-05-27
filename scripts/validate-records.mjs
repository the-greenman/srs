#!/usr/bin/env node
/**
 * Validate all records in Tier 2 format
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

async function validateRecord(path, record) {
  const issues = [];

  // Check Tier 2 format
  if (!record.instanceId) issues.push('missing instanceId');
  if (!record.typeId) issues.push('missing typeId');
  if (!record.typeVersion) issues.push('missing typeVersion');
  if (!record.typeNamespace) issues.push('missing typeNamespace');
  if (!record.typeName) issues.push('missing typeName');

  // Check fieldValues
  if (!record.fieldValues || !Array.isArray(record.fieldValues)) {
    issues.push('missing fieldValues array');
  } else {
    for (const fv of record.fieldValues) {
      if (!fv.fieldId) issues.push('fieldValue missing fieldId');
      if (!fv.hasOwnProperty('value')) issues.push('fieldValue missing value');
    }
  }

  // Check sourceRefs
  if (!record.sourceRefs || !Array.isArray(record.sourceRefs)) {
    warnings.push(`${path}: missing sourceRefs (optional but recommended)`);
  } else {
    for (const sr of record.sourceRefs) {
      if (!sr.sourceType) issues.push('sourceRef missing sourceType');
      if (!sr.sourceId) issues.push('sourceRef missing sourceId');
    }
  }

  return issues;
}

async function findRecordFiles(dir, basePath = '') {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await findRecordFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.json')) {
      files.push({ fullPath, relativePath });
    }
  }

  return files;
}

async function validateRecords() {
  console.log('Validating records...');

  const recordFiles = await findRecordFiles('records');
  console.log(`  Found ${recordFiles.length} record files`);

  let validCount = 0;
  let invalidCount = 0;

  for (const { fullPath, relativePath } of recordFiles) {
    const record = await loadJSON(fullPath);
    if (!record) {
      invalidCount++;
      continue;
    }

    const issues = await validateRecord(relativePath, record);
    if (issues.length > 0) {
      errors.push(`${relativePath}: ${issues.join(', ')}`);
      invalidCount++;
    } else {
      validCount++;
    }
  }

  // Report
  console.log(`\n  Valid: ${validCount}`);
  console.log(`  Invalid: ${invalidCount}`);

  if (errors.length > 0) {
    console.log(`\n  Errors (${errors.length}):`);
    errors.forEach(e => console.log(`    ✗ ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\n  Warnings (${warnings.length}):`);
    warnings.forEach(w => console.log(`    ⚠ ${w}`));
  }

  const valid = invalidCount === 0;
  console.log(`\n  ${valid ? '✓ All records are valid' : '✗ Record validation failed'}`);

  return { errors, warnings, valid, validCount, invalidCount };
}

validateRecords().then(result => {
  process.exit(result.valid ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
