#!/usr/bin/env node
/**
 * Build the reproducible empty-governance-document.srsj seed.
 *
 * The seed is the artifact srs-web bundles to let a clerk create a brand-new
 * governance document (the-greenman/muDemocracy.org#38, story #35): the canonical
 * com.mudemocracy.governance @1.0.0 package installed with ZERO records, stamped
 * with upstream-package provenance (the hook for the upgrade/drift story #37).
 *
 * Strategy: drive the `srs` CLI to assemble a clean file repo (package at the
 * conventional `package/` path so package-level Lifecycle/Vocabulary resolve),
 * export it to a self-contained `.srsj` bundle via `srs repo copy`, then stamp
 * `manifest.meta.upstreamPackage` into the bundle. `srs repo copy` does not
 * preserve manifest `meta` (the engine has no import-tracking wiring yet — that
 * is RFC-003 / #37), so the provenance stamp is injected here. The output is
 * deterministic: re-running this script reproduces the seed byte-for-byte.
 *
 * Usage (cwd-independent):
 *   node scripts/build-governance-seed.mjs
 *   node scripts/build-governance-seed.mjs --check   # build to a temp file and diff against the committed seed
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR); // srs/
const PKG_VERSION_DIR = join(REPO_ROOT, 'packages', 'com.mudemocracy.governance', '1.0.0');
const PACKAGE_DIR = join(PKG_VERSION_DIR, 'package');
const SEED_DIR = join(PKG_VERSION_DIR, 'seed');
const SEED_PATH = join(SEED_DIR, 'empty-governance-document.srsj');

// Stable identity + timestamps so the build is byte-for-byte reproducible.
const PACKAGE_ID = '1cd9622e-3d05-4214-a683-4cb81d0c44d9';
const PACKAGE_NAMESPACE = 'com.mudemocracy.governance';
const PACKAGE_NAME = 'governance';
const PACKAGE_VERSION = '1.0.0';
const SEED_REPOSITORY_ID = '395ebea2-d8f6-497b-b18c-04c9eacafc94';
const STAMP_TIME = '2026-01-01T00:00:00Z';

const checkMode = process.argv.includes('--check');

function srs(args, opts = {}) {
  const out = execFileSync('srs', args, { encoding: 'utf8', ...opts });
  return out.trim() ? JSON.parse(out) : null;
}

/** Deterministic JSON: recursively sorted keys, 2-space indent, no trailing newline. */
function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
    }
    return v;
  };
  return JSON.stringify(sort(value), null, 2);
}

function build(outPath) {
  if (!existsSync(join(PACKAGE_DIR, 'package.json'))) {
    throw new Error(`Package not found at ${PACKAGE_DIR}`);
  }

  const work = mkdtempSync(join(tmpdir(), 'governance-seed-'));
  try {
    // 1. Assemble a clean file repo: package at the conventional `package/` path.
    const repo = join(work, 'repo');
    mkdirSync(repo, { recursive: true });
    cpSync(PACKAGE_DIR, join(repo, 'package'), { recursive: true });
    const sourceManifest = {
      $schema: 'https://srs.semanticops.com/schema/2.0/manifest.json',
      srsVersion: '2.0-draft',
      repositoryId: SEED_REPOSITORY_ID,
      namespace: PACKAGE_NAMESPACE,
      title: 'Empty Governance Document',
      description:
        'An empty governance document: the canonical MuDemocracy governance package installed with zero records, ready for a clerk to capture their first decision.',
      packageRef: { mode: 'local', path: 'package' },
      instanceIndex: [],
      createdAt: STAMP_TIME,
    };
    writeFileSync(join(repo, 'manifest.json'), `${JSON.stringify(sourceManifest, null, 2)}\n`);

    // 2. Export to a self-contained .srsj bundle (package definitions inlined).
    const bundlePath = join(work, 'seed.srsj');
    srs(['repo', 'copy', '--from', repo, '--to', bundlePath]);

    // 3. Stamp upstream-package provenance into the bundle manifest. `repo copy`
    //    drops manifest.meta, so this is the authoritative place to add it.
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

    // `srs repo copy` emits the inlined package.json index arrays (fields, types,
    // relationTypes, ...) in nondeterministic HashMap order. These are non-semantic
    // file lists, so sort them for a byte-for-byte reproducible seed.
    const pkg = bundle.data?.['package/package.json'];
    if (pkg) {
      for (const key of ['fields', 'types', 'views', 'documentViews', 'blueprints', 'protocols', 'relationTypes', 'lifecycles', 'themes', 'vocabularies']) {
        if (Array.isArray(pkg[key])) pkg[key] = [...pkg[key]].sort();
      }
    }
    bundle.manifest.meta = {
      ...(bundle.manifest.meta ?? {}),
      upstreamPackage: {
        packageId: PACKAGE_ID,
        namespace: PACKAGE_NAMESPACE,
        name: PACKAGE_NAME,
        version: PACKAGE_VERSION,
        installedAt: STAMP_TIME,
      },
    };
    writeFileSync(outPath, stableStringify(bundle));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function validate(path) {
  const res = srs(['repo', 'validate', '--repo', path]);
  const summary = res.payload.summary;
  const errors = res.payload.diagnostics.filter((d) => d.severity === 'error');
  if (summary.errors !== 0 || errors.length !== 0) {
    console.error('Seed validation FAILED:', JSON.stringify(res.payload, null, 2));
    process.exit(1);
  }
  const instances = res.payload.summary.checked;
  if (instances !== 0) {
    console.error(`Seed must have 0 instances, found ${instances}`);
    process.exit(1);
  }
  // Confirm the package resolves (types listable) inside the bundle.
  const types = srs(['type', 'list', '--repo', path]).payload.types;
  console.log(`  validate: ${summary.errors} errors, ${summary.warnings} warnings, ${instances} instances, ${types.length} types resolve`);
}

if (checkMode) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'governance-seed-check-')), 'empty-governance-document.srsj');
  build(tmp);
  validate(tmp);
  const committed = existsSync(SEED_PATH) ? readFileSync(SEED_PATH, 'utf8') : null;
  const fresh = readFileSync(tmp, 'utf8');
  if (committed !== fresh) {
    console.error('DRIFT: committed seed differs from a fresh build. Run: node scripts/build-governance-seed.mjs');
    process.exit(1);
  }
  console.log(`  check: committed seed matches a fresh build (${SEED_PATH})`);
} else {
  mkdirSync(SEED_DIR, { recursive: true });
  build(SEED_PATH);
  validate(SEED_PATH);
  console.log(`Wrote ${SEED_PATH}`);
}
