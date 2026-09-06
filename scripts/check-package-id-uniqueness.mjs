#!/usr/bin/env node
/**
 * check-package-id-uniqueness.mjs — UUID and canonical-name identity guard over packages (#295, #584).
 *
 * A UUID is the primary identity in SRS and is globally stable: two entities must never share one.
 * Nothing detected a violation of that at the package layer, and one had gone live —
 * `com.semanticops.srs/metamodel` and `com.semanticops.spec/spec-authoring-core` both claimed
 * `4a000001-…-001`, because RFC-033 Change A pinned an id that was already taken. Both are resolved
 * by `srs/manifest.json`, so any consumer keying packages by id (a registry, RFC-014 import
 * tracking, a bundle index, a cache) would have seen one package where there are two.
 *
 * #584 found the mirror defect: two UUIDs answering to one CANONICAL NAME (`namespace/name@version`,
 * or `namespace/key@version` for a RelationType) — `com.semanticops.srs/lifecycle@1`,
 * `.../term@1` and `.../vocabulary@1` each had two ids. The Earth column principle
 * (rfc-decision-cce3c00e) holds this fatal, never resolved by precedence: canonical name is how a
 * definition is cited in prose, in RFC integration manifests and by humans, so two ids answering to
 * one is exactly the identity conflict a UUID-only check cannot see.
 *
 * A second blind spot surfaced on #592 the same evening: `check-package-id-uniqueness` only ever
 * indexed what a package manifest's arrays DECLARE. A definition-shaped file sitting on disk that no
 * manifest lists — `spec-rfc-process/views/rfc-document-view.json`, a dead pre-rename orphan
 * carrying the same UUID as the live Composition at `compositions/rfc-document-view.json` — was
 * invisible to it, because it was never in `views[]` or `compositions[]`. Assertion 2 below now also
 * sweeps each resolved package's directory tree for definition-shaped files regardless of whether any
 * manifest lists them, so one UUID (or one canonical name) with two homes is caught even when only
 * one home is declared.
 *
 * Three assertions:
 *
 *   1. RESOLVED PACKAGE IDS ARE UNIQUE. Every package `srs/manifest.json` resolves through
 *      `packageRefs` carries an id, and no two share one. This is the assertion #295 asks for.
 *
 *   2. RESOLVED AND ON-DISK DEFINITION IDENTITY IS UNIQUE. Over every Field, Type, View, Composition,
 *      Theme, RelationType, Vocabulary, Lifecycle, Blueprint and Protocol reachable from a resolved
 *      package — both those *listed in* its manifest arrays and every definition-shaped `.json` file
 *      found by walking its directory tree — no two may share a UUID, and no two may share a
 *      canonical name (`namespace/name@version`, or `namespace/key@version` where the kind has no
 *      `name`) while differing in UUID. A file is "definition-shaped" when it carries a UUID-shaped
 *      `id`, a string `namespace`, a numeric `version` and a `name` or `key` — the shape every
 *      definition kind shares and no package manifest matches (a manifest's `version` is a semver
 *      string, never a number).
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
 *   node scripts/check-package-id-uniqueness.mjs [root]   # root defaults to the repo root
 */
import { readdir, readFile } from 'fs/promises';
import { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { definitionKinds, PROPERTY_SCHEMA } from './check-schema-kind-correspondence.mjs';

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree,
// the same seam the sibling #308/#311/#391 guards expose.
// `fileURLToPath`, not `new URL(..).pathname`, which is percent-encoded and resolves wrong under a
// checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRS_REPO = join(ROOT, 'srs');

// Every tree that may hold package manifests, for assertion 3.
const SEARCH_ROOTS = ['srs', 'packages', 'conformance', 'docs/spec/examples', 'rfcs'];

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reverse of PROPERTY_SCHEMA, to classify a discovered file's kind from its `$schema`.
const SCHEMA_FILE_TO_KIND = Object.fromEntries(
  Object.entries(PROPERTY_SCHEMA)
    .filter(([, schemaFile]) => schemaFile)
    .map(([kind, schemaFile]) => [schemaFile, kind]),
);

function kindFromSchema(doc) {
  const schemaFile = typeof doc.$schema === 'string' ? doc.$schema.split('/').pop() : undefined;
  return schemaFile ? SCHEMA_FILE_TO_KIND[schemaFile] : undefined;
}

/**
 * A file is "definition-shaped" either because its `$schema` names one of the ten definition
 * schemas directly, or — for the files that predate `$schema` being written at all — because it has
 * the shape every current definition kind shares (a manifest's `version` is a semver string, never a
 * number, which is what keeps a package manifest out of this set).
 *
 * The `$schema` branch matters on its own: a pre-`version`-field, pre-rename artifact can carry a
 * recognisable `$schema` while missing `version` and `name` entirely (srs#584 found exactly one —
 * `spec-authoring-core/views/spec-document-view.json`, a `view.json`-shaped orphan with no `version`
 * or `name`, still sharing its UUID with the live Composition at
 * `compositions/spec-document-view.json`). Requiring the full shape would have missed it a second
 * time, the same way #592's orphan hid from the array-only scan.
 */
function isDefinitionShaped(doc) {
  if (!doc || typeof doc !== 'object' || typeof doc.id !== 'string' || !UUID_RE.test(doc.id)) {
    return false;
  }
  if (kindFromSchema(doc)) return true;
  return Boolean(
    typeof doc.namespace === 'string' &&
    typeof doc.version === 'number' &&
    (typeof doc.name === 'string' || typeof doc.key === 'string'),
  );
}

/**
 * Canonical name, scoped by KIND ('fields', 'types', ...). A Field and a Type sharing one
 * `namespace/name@version` is normal (the metamodel's `lineage` Field backs a `lineage` Type) — the
 * identity conflict #584 is about is two definitions of the SAME kind claiming one canonical name.
 * RelationType has no `name`, only `key`; everything else that reaches here has `name`.
 */
function canonicalName(kind, doc) {
  return `${kind}:${doc.namespace}/${doc.name ?? doc.key}@${doc.version}`;
}

async function loadJsonQuiet(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null; // not this guard's job to report a parse failure in a file it is only sniffing
  }
}

/** Every `.json` file under `dir`, package manifests excluded, for the on-disk sweep. */
async function walkJsonFiles(dir) {
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
    if (entry.isDirectory()) out.push(...(await walkJsonFiles(full)));
    else if (entry.name.endsWith('.json') && entry.name !== 'package.json') out.push(full);
  }
  return out;
}

// 2 — resolved AND on-disk definition identity is unique, by UUID and by canonical name.
//
// The declared-array keys are the live derivation `definitionKinds()` reads from
// `docs/schema/2.0/package-manifest.json` (#311/#391's own source of truth) rather than a second
// hardcoded list — a hardcoded copy is exactly how this check went stale before (it named
// `documentViews`, retired by rfc-decision-92d2da05, and never named `compositions`, `themes`,
// `lifecycles` or `protocols` at all). The on-disk sweep below is what keeps those kinds covered even
// while this derivation catches up, but a wrong "declared" count would still misreport #584's own
// scope.
async function checkDefinitionIdentity(packages) {
  const byId = new Map();
  const byName = new Map();
  const visited = new Set();
  let declaredCount = 0;
  let discoveredCount = 0;

  const { kinds, composed, properties } = await definitionKinds(ROOT);
  if (composed.length > 0 || kinds.length === 0) {
    errors.push(
      `docs/schema/2.0/package-manifest.json yields no usable definition-kind list ` +
      `(${properties.length} properties, composed via ${composed.join(', ') || 'none'}) — ` +
      `declared definition identity cannot be checked. See scripts/check-schema-kind-correspondence.mjs.`,
    );
    return { byId, count: 0, discoveredCount: 0 };
  }
  const definitionKeys = kinds.map((k) => k.kind);

  function record(path, doc, kind) {
    visited.add(path);
    const priorId = byId.get(doc.id);
    if (priorId && priorId.path !== path) {
      errors.push(
        `definition id ${doc.id} claimed twice: ${rel(priorId.path)} and ${rel(path)}`,
      );
    } else if (!priorId) {
      byId.set(doc.id, { path, doc });
    }

    // A discovered file with no recognisable `$schema` cannot be classified by kind, so it is not
    // safe to compare its name against anything — that would risk exactly the Field/Type false
    // positive this function exists to avoid. Nor can a file missing `namespace`/`version`/`name`
    // (or `key`) contribute a canonical name at all — it is still covered by the id check above,
    // which is how the pre-`version`-field orphan in the class comment gets caught.
    if (!kind) return;
    if (
      typeof doc.namespace !== 'string' ||
      typeof doc.version !== 'number' ||
      (typeof doc.name !== 'string' && typeof doc.key !== 'string')
    ) return;

    const name = canonicalName(kind, doc);
    const priorName = byName.get(name);
    if (priorName && priorName.doc.id !== doc.id) {
      errors.push(
        `canonical name ${name} claimed by two definitions with different ids: ` +
        `${priorName.doc.id} (${rel(priorName.path)}) and ${doc.id} (${rel(path)}) — ` +
        `identity conflicts are fatal, never resolved by precedence`,
      );
    } else if (!priorName) {
      byName.set(name, { path, doc });
    }
  }

  // Declared: every entry a resolved package's manifest arrays list.
  for (const pkg of packages) {
    for (const key of definitionKeys) {
      for (const entry of pkg.doc[key] ?? []) {
        const path = join(pkg.dir, entry);
        const doc = await loadJson(path);
        if (!doc) continue;
        declaredCount += 1;
        if (!doc.id) {
          errors.push(`${rel(path)}: ${key.slice(0, -1)} definition has no id`);
          continue;
        }
        record(path, doc, key);
      }
    }
  }

  // Discovered: every definition-shaped file under a resolved package's directory, declared or not —
  // the #592 blind spot. A file already visited above is not re-read.
  for (const pkg of packages) {
    for (const path of await walkJsonFiles(pkg.dir)) {
      if (visited.has(path)) continue;
      const doc = await loadJsonQuiet(path);
      if (!isDefinitionShaped(doc)) continue;
      discoveredCount += 1;
      record(path, doc, kindFromSchema(doc));
    }
  }

  return { byId, count: declaredCount, discoveredCount };
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
  const { byId: definitionIds, count, discoveredCount } = await checkDefinitionIdentity(packages);
  console.log(
    `  Checked ${packageIds.size} package ids and ${count} declared definition ids ` +
    `(+${discoveredCount} discovered on disk but undeclared), by id and by canonical name`,
  );

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
