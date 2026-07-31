#!/usr/bin/env node
/**
 * check-package-id-uniqueness.mjs — UUID identity guard over packages (#295).
 *
 * A UUID is the primary identity in SRS and is globally stable: two entities must never share one.
 * Nothing detected a violation of that at the package layer, and one had gone live —
 * `com.semanticops.srs/metamodel` and `com.semanticops.spec/spec-authoring-core` both claimed
 * `4a000001-…-001`, because RFC-033 Change A pinned an id that was already taken. Both are resolved
 * by `srs/manifest.json`, so any consumer keying packages by id (a registry, RFC-014 import
 * tracking, a bundle index, a cache) would have seen one package where there are two.
 *
 * Three assertions:
 *
 *   1. RESOLVED PACKAGE IDS ARE UNIQUE. Every package `srs/manifest.json` resolves through
 *      `packageRefs` carries an id, and no two share one. This is the assertion #295 asks for.
 *
 *   2. RESOLVED DEFINITION IDS ARE UNIQUE. Same rule one layer down, over every Field, Type, View,
 *      DocumentView, RelationType, Blueprint and Vocabulary *listed in* a resolved package's index.
 *      Files present on disk but absent from the index are not members and are not checked here —
 *      `validate-package.mjs` already warns about those.
 *
 *   3. A PACKAGE ID MEANS ONE PACKAGE EVERYWHERE. Across every package tree in the repo (released
 *      artifacts under `packages/`, conformance fixtures, RFC proposal trees), the same package id
 *      must always carry the same `namespace/name`. A proposal or released copy of the *same*
 *      package legitimately repeats its id; two *different* packages sharing one is the #295 defect
 *      in a tree the first assertion does not reach.
 *
 * Cross-kind reuse — one id serving both a package and a definition — is reported as a warning, not
 * a failure: entity kind disambiguates it, and one such pair predates this check.
 *
 *   node scripts/check-package-id-uniqueness.mjs
 */
import { readdir, readFile } from 'fs/promises';
import { join, relative, resolve } from 'path';

const ROOT = resolve(new URL('..', import.meta.url).pathname); // srs repo root
const SRS_REPO = join(ROOT, 'srs');

// Every tree that may hold package manifests, for assertion 3.
const SEARCH_ROOTS = ['srs', 'packages', 'conformance', 'docs/spec/examples', 'rfcs'];

// Index keys in a package manifest that list definition files.
const DEFINITION_KEYS = [
  'fields', 'types', 'views', 'documentViews', 'relationTypes', 'blueprints', 'vocabularies',
];

const errors = [];
const warnings = [];

const rel = (path) => relative(ROOT, path);

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`Failed to load ${rel(path)}: ${error.message}`);
    return null;
  }
}

async function findPackageManifests(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findPackageManifests(full)));
    else if (entry.name === 'package.json') out.push(full);
  }
  return out;
}

/** A package manifest, as distinct from an npm package.json or any other same-named file. */
function isPackageManifest(doc) {
  return Boolean(doc && typeof doc === 'object' && doc.id && doc.namespace && doc.name);
}

function label(doc) {
  return `${doc.namespace}/${doc.name}`;
}

async function resolvedPackages() {
  const manifest = await loadJson(join(SRS_REPO, 'manifest.json'));
  if (!manifest) return [];
  const refs = manifest.packageRefs ?? (manifest.packageRef ? [manifest.packageRef] : []);
  const packages = [];
  for (const ref of refs) {
    if (ref.mode !== 'local') {
      warnings.push(`srs/manifest.json: packageRef mode '${ref.mode}' not resolvable offline; skipped`);
      continue;
    }
    const dir = join(SRS_REPO, ref.path);
    const doc = await loadJson(join(dir, 'package.json'));
    if (doc) packages.push({ dir, path: join(dir, 'package.json'), doc });
  }
  return packages;
}

// 1 — resolved package ids are unique.
function checkPackageIds(packages) {
  const byId = new Map();
  for (const pkg of packages) {
    if (!pkg.doc.id) {
      errors.push(`${rel(pkg.path)}: package manifest has no id`);
      continue;
    }
    const prior = byId.get(pkg.doc.id);
    if (prior) {
      errors.push(
        `package id ${pkg.doc.id} claimed by two resolved packages: ` +
        `${label(prior.doc)} (${rel(prior.path)}) and ${label(pkg.doc)} (${rel(pkg.path)})`,
      );
      continue;
    }
    byId.set(pkg.doc.id, pkg);
  }
  return byId;
}

// 2 — resolved definition ids are unique.
async function checkDefinitionIds(packages) {
  const byId = new Map();
  let count = 0;
  for (const pkg of packages) {
    for (const key of DEFINITION_KEYS) {
      for (const entry of pkg.doc[key] ?? []) {
        const path = join(pkg.dir, entry);
        const doc = await loadJson(path);
        if (!doc) continue;
        count += 1;
        if (!doc.id) {
          errors.push(`${rel(path)}: ${key.slice(0, -1)} definition has no id`);
          continue;
        }
        const prior = byId.get(doc.id);
        if (prior) {
          errors.push(
            `definition id ${doc.id} claimed twice: ${rel(prior.path)} and ${rel(path)}`,
          );
          continue;
        }
        byId.set(doc.id, { path, doc });
      }
    }
  }
  return { byId, count };
}

// 3 — a package id means one package everywhere in the repo.
async function checkPackageIdentityAcrossTrees() {
  const byId = new Map();
  let count = 0;
  for (const root of SEARCH_ROOTS) {
    for (const path of await findPackageManifests(join(ROOT, root))) {
      const doc = await loadJson(path);
      if (!isPackageManifest(doc)) continue;
      count += 1;
      const prior = byId.get(doc.id);
      if (!prior) {
        byId.set(doc.id, { path, doc });
        continue;
      }
      if (label(prior.doc) !== label(doc)) {
        errors.push(
          `package id ${doc.id} names two different packages: ` +
          `${label(prior.doc)} (${rel(prior.path)}) and ${label(doc)} (${rel(path)})`,
        );
      }
    }
  }
  return count;
}

async function main() {
  console.log('Checking package UUID uniqueness...');

  const packages = await resolvedPackages();
  console.log(`  Resolved ${packages.length} packages from srs/manifest.json`);

  const packageIds = checkPackageIds(packages);
  const { byId: definitionIds, count } = await checkDefinitionIds(packages);
  console.log(`  Checked ${packageIds.size} package ids and ${count} definition ids`);

  for (const id of packageIds.keys()) {
    const definition = definitionIds.get(id);
    if (!definition) continue;
    warnings.push(
      `id ${id} serves both a package (${label(packageIds.get(id).doc)}) and a definition ` +
      `(${rel(definition.path)}) — disambiguated only by entity kind`,
    );
  }

  const scanned = await checkPackageIdentityAcrossTrees();
  console.log(`  Scanned ${scanned} package manifests across ${SEARCH_ROOTS.join(', ')}`);

  console.log(`\n  Errors: ${errors.length}`);
  errors.forEach(error => console.log(`    ✗ ${error}`));
  console.log(`  Warnings: ${warnings.length}`);
  warnings.forEach(warning => console.log(`    ⚠ ${warning}`));

  const valid = errors.length === 0;
  console.log(`\n  ${valid ? '✓ Package UUIDs are unique' : '✗ Package UUID uniqueness failed'}`);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
