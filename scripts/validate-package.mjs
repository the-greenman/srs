#!/usr/bin/env node
/**
 * Validate a package directory using the repo's JSON schemas plus manifest checks.
 *
 * Usage:
 *   node scripts/validate-package.mjs
 *   node scripts/validate-package.mjs package/spec-authoring-core
 */
import { access, readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadSchema, validateJsonSchema } from './lib/json-schema-lite.mjs';

const ROOT = resolve('.');
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
  return path.startsWith(`${ROOT}/`) ? path.slice(ROOT.length + 1) : path;
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

  const requiredKeys = ['id', 'namespace', 'name', 'version', 'title', 'description', 'status', 'fields', 'types', 'views', 'createdAt'];
  for (const key of requiredKeys) {
    if (!(key in manifest)) {
      errors.push(`${rel(manifestPath)}: missing ${key}`);
    }
  }

  for (const listKey of ['fields', 'types', 'views']) {
    if (listKey in manifest && !Array.isArray(manifest[listKey])) {
      errors.push(`${rel(manifestPath)}: ${listKey} must be an array`);
    }
  }

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

  const [fieldSchema, typeSchema] = await Promise.all([
    loadSchema(join(ROOT, 'schemas/field.json')),
    loadSchema(join(ROOT, 'schemas/type.json')),
  ]);

  const dirPath = join(ROOT, packageDir);
  const manifest = await validatePackageManifest(dirPath);
  if (!manifest) {
    process.exit(1);
  }

  await validateManifestPaths(dirPath, manifest, 'fields');
  await validateManifestPaths(dirPath, manifest, 'types');
  await validateManifestPaths(dirPath, manifest, 'views');

  const fieldEntries = Array.isArray(manifest.fields) ? manifest.fields : [];
  console.log(`  Checking ${fieldEntries.length} field definitions...`);
  for (const relativePath of fieldEntries) {
    const fullPath = join(dirPath, relativePath);
    const field = await loadJson(fullPath);
    if (!field) continue;
    pushSchemaErrors(rel(fullPath), validateJsonSchema(field, fieldSchema));
  }

  const typeEntries = Array.isArray(manifest.types) ? manifest.types : [];
  console.log(`  Checking ${typeEntries.length} type definitions...`);
  for (const relativePath of typeEntries) {
    const fullPath = join(dirPath, relativePath);
    const type = await loadJson(fullPath);
    if (!type) continue;
    pushSchemaErrors(rel(fullPath), validateJsonSchema(type, typeSchema));
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
