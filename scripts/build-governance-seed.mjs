#!/usr/bin/env node
/**
 * Build the reproducible empty-governance-document.srsj seed.
 *
 * The seed is the artifact srs-web bundles to let a clerk create a brand-new
 * governance document (the-greenman/muDemocracy.org#38, story #35): the canonical
 * com.mudemocracy.governance package installed with ZERO records, stamped
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
 * Version defaults to 1.1.0 (this script's original scope) — pass another
 * published version dir name (e.g. `1.2.1`) as the first positional arg to
 * (re)build its seed instead.
 *
 * Known engine gap (srs#548, srs-rust#930): the pinned CLI's Protocol
 * deserializer still requires the retired `protocol`-prefixed shape
 * (protocolId/protocolNamespace/...) that srs#379 replaced everywhere else
 * (schema, prose, every published package/ tree). `srs repo copy` therefore
 * cannot load a governance package version whose protocol definition is
 * already on the ratified unprefixed shape (every version 1.0.0+ as of
 * srs#545) — it fails the whole copy, not just the protocol file. This
 * script tries the CLI path first (so it goes back to full engine-verified
 * provenance automatically once srs-rust#930 ships and the pin advances) and
 * falls back to a plain filesystem flatten — identical output shape, just
 * produced without asking the engine to parse content it doesn't understand
 * yet — ONLY when the failure matches that specific, already-tracked gap.
 * Any other failure still aborts the build.
 *
 * Usage (cwd-independent):
 *   node scripts/build-governance-seed.mjs [version]
 *   node scripts/build-governance-seed.mjs [version] --check   # build to a temp file and diff against the committed seed
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR); // srs/
const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const PACKAGE_VERSION = args.find((a) => a !== '--check') || '1.1.0';
const PKG_VERSION_DIR = join(REPO_ROOT, 'packages', 'com.mudemocracy.governance', PACKAGE_VERSION);
const PACKAGE_DIR = join(PKG_VERSION_DIR, 'package');
const SEED_DIR = join(PKG_VERSION_DIR, 'seed');
const SEED_PATH = join(SEED_DIR, 'empty-governance-document.srsj');

// Stable identity + timestamps so the build is byte-for-byte reproducible.
const PACKAGE_ID = '1cd9622e-3d05-4214-a683-4cb81d0c44d9';
const PACKAGE_NAMESPACE = 'com.mudemocracy.governance';
const PACKAGE_NAME = 'governance';
const SEED_REPOSITORY_ID = 'e2e8489a-5ada-4309-9b26-90ccc263146d';
const STAMP_TIME = '2026-01-01T00:00:00Z';
// RFC-033/#265 generation stamp for the scaffolded seed repo itself — kept at
// the current data-model generation (docs/schema/2.0/manifest.json's
// dataModelRevision description) so the seed doesn't ship pre-declared as an
// older, narrower generation than the shapes it actually contains.
const SEED_DATA_MODEL_REVISION = 7;

const SRS_BIN = process.env.SRS_BIN || 'srs';

/** Recursively flatten a directory into a { relPath: parsedJson } map, POSIX-separated. */
function flattenDir(root, dir = root, out = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      flattenDir(root, abs, out);
    } else if (entry.name.endsWith('.json')) {
      const relPath = relative(root, abs).split(sep).join('/');
      out[relPath] = JSON.parse(readFileSync(abs, 'utf8'));
    }
  }
  return out;
}

/** Known, already-tracked engine gap: srs-rust#930 hasn't renamed Protocol's Rust
 * struct to the srs#379-ratified unprefixed shape yet, so `repo copy`/`repo
 * validate` reject any package whose protocol definition already uses it. */
function isKnownProtocolShapeGap(message) {
  return /protocol\.json/.test(message) && /protocolId.*required property/.test(message);
}

function srs(args, opts = {}) {
  const out = execFileSync(SRS_BIN, args, { encoding: 'utf8', ...opts });
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
      // RFC-038: membership is the tree, so the scaffolded manifest carries no
      // instanceIndex ([R2] denies it) and declares the storage generation the
      // package is at ([R21] rejects an absent revision as generation 0).
      dataModelRevision: SEED_DATA_MODEL_REVISION,
      createdAt: STAMP_TIME,
    };
    writeFileSync(join(repo, 'manifest.json'), `${JSON.stringify(sourceManifest, null, 2)}\n`);

    // 2. Export to a self-contained .srsj bundle (package definitions inlined).
    //    Prefer the engine (`repo copy`); fall back to a plain flatten only for
    //    the specific, already-tracked srs-rust#930 gap (see header comment).
    const bundlePath = join(work, 'seed.srsj');
    let bundle;
    try {
      srs(['repo', 'copy', '--from', repo, '--to', bundlePath]);
      bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
    } catch (err) {
      const message = String(err.stdout || err.message || err);
      if (!isKnownProtocolShapeGap(message)) throw err;
      console.warn(
        '  WARNING: `srs repo copy` cannot load this package yet (srs-rust#930 — Protocol struct still expects the retired prefixed shape). Falling back to a plain filesystem flatten for the same {srsj, manifest, data} envelope shape. Re-run once srs-rust#930 ships to get engine-verified provenance back.',
      );
      const { packageRef: _packageRef, ...manifestSansPackageRef } = sourceManifest;
      bundle = {
        srsj: '2',
        manifest: {
          ...manifestSansPackageRef,
          container: { containerId: SEED_REPOSITORY_ID, title: sourceManifest.title },
        },
        data: flattenDir(repo),
      };
      delete bundle.data['manifest.json'];
    }

    // 3. Stamp upstream-package provenance into the bundle manifest. `repo copy`
    //    drops manifest.meta, so this is the authoritative place to add it.

    // `srs repo copy` emits the inlined package.json index arrays (fields, types,
    // relationTypes, ...) in nondeterministic HashMap order. These are non-semantic
    // file lists, so sort them for a byte-for-byte reproducible seed.
    const pkg = bundle.data?.['package/package.json'];
    if (pkg) {
      for (const key of ['fields', 'types', 'views', 'documentViews', 'blueprints', 'protocols', 'relationTypes', 'lifecycles', 'themes', 'vocabularies']) {
        if (Array.isArray(pkg[key])) pkg[key] = [...pkg[key]].sort();
      }
    }
    // RFC-014: upstreamPackage is normative at the manifest top level; the
    // meta.upstreamPackage subkey is deprecated but kept alongside for the
    // committed seeds' existing back-compat convention.
    const upstreamPackage = {
      packageId: PACKAGE_ID,
      namespace: PACKAGE_NAMESPACE,
      name: PACKAGE_NAME,
      version: PACKAGE_VERSION,
      installedAt: STAMP_TIME,
    };
    bundle.manifest.upstreamPackage = upstreamPackage;
    bundle.manifest.meta = { ...(bundle.manifest.meta ?? {}), upstreamPackage };
    // Newer CLIs stamp manifest.createdAt with the build wall-clock; pin it so
    // the seed stays byte-for-byte reproducible.
    if (bundle.manifest.createdAt) bundle.manifest.createdAt = STAMP_TIME;
    writeFileSync(outPath, stableStringify(bundle));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function validate(path) {
  const res = srs(['repo', 'validate', '--repo', path]);
  // A fatal catalog-load failure (can't even open the repo) reports as a
  // top-level `diagnostics` array with no `payload` at all — distinct from
  // the normal ok:true-or-false-with-payload.diagnostics shape. Tolerate it
  // ONLY for the known, already-tracked srs-rust#930 protocol-shape gap.
  if (!res.payload) {
    const message = (res.diagnostics || []).join('\n');
    if (isKnownProtocolShapeGap(message)) {
      console.warn(
        '  WARNING: engine-side `repo validate`/`type list` cannot load this bundle yet (srs-rust#930). Content was validated the Node/AJV way instead (scripts/validate-all.mjs); skipping the engine acceptance check.',
      );
      return;
    }
    console.error('Seed validation FAILED (fatal catalog load):', JSON.stringify(res, null, 2));
    process.exit(1);
  }
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
