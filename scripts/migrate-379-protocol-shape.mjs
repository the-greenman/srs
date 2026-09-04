#!/usr/bin/env node
/**
 * migrate-379-protocol-shape.mjs — one-off corpus migration for the srs#379 Protocol shape ruling.
 *
 * Renames Protocol's identity/structural properties from the interim `protocol`-prefixed shape
 * (#297/#378) to the ruled, unprefixed shape (rfc-decision, srs#379: `protocolId` -> `id`, etc.,
 * matching every other package-declared definition entity), and converts each ProtocolStage's
 * plain-string `aiGuidance` into the closed, structured `{ purpose }` object (structured over
 * serialised). ProtocolStage's own property names are unchanged.
 *
 * Scope, deliberately narrow: this repo's OWN vendored `packages/com.mudemocracy.governance/*`
 * copies, validated only by this repo's Node/AJV pipeline (validate-package.mjs). It does NOT
 * touch `docs/spec/examples/gallery-project-v2/package/protocols/*.json` — that corpus is
 * structurally validated by the PINNED Rust binary (check-gallery-conformance.mjs), whose typed
 * `Protocol` struct still requires the old prefixed shape; migrating it is gated on the srs-rust
 * follow-up (struct rename + a supporting release) landing first, per the standard revision-bump
 * choreography (rfc-decision-628cf6c4). Not a registered `srs repo apply-migration` (that mechanism
 * lives in srs-rust and operates on data model revisions; this is spec-repo-side corpus content
 * with no dataModelRevision of its own to bump — additive/renamed package content, same class as
 * scripts/migrate-rfc-032-field-type.mjs).
 *
 * Usage:
 *   node scripts/migrate-379-protocol-shape.mjs           # rewrite files
 *   node scripts/migrate-379-protocol-shape.mjs --check   # fail if any target file still carries
 *                                                          # the old shape
 */
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const TARGETS = [
  'packages/com.mudemocracy.governance/1.0.0/package/protocols/decision-7a088176.json',
  'packages/com.mudemocracy.governance/1.1.0/package/protocols/decision-7a088176.json',
  'packages/com.mudemocracy.governance/1.2.0/package/protocols/decision-7a088176.json',
  'packages/com.mudemocracy.governance/1.2.1/package/protocols/decision-7a088176.json',
];

const RENAME = {
  protocolId: 'id',
  protocolNamespace: 'namespace',
  protocolName: 'name',
  protocolVersion: 'version',
  protocolDescription: 'description',
  protocolTargetType: 'targetType',
  protocolStages: 'stages',
  protocolTags: 'tags',
  protocolCreatedAt: 'createdAt',
};

function migrateStage(stage) {
  const out = { ...stage };
  if (typeof out.aiGuidance === 'string') {
    out.aiGuidance = { purpose: out.aiGuidance };
  }
  return out;
}

function migrateProtocol(doc) {
  const out = {};
  for (const [key, value] of Object.entries(doc)) {
    const newKey = RENAME[key] ?? key;
    out[newKey] = newKey === 'stages' ? value.map(migrateStage) : value;
  }
  return out;
}

function isOldShape(doc) {
  return Object.prototype.hasOwnProperty.call(doc, 'protocolId');
}

let failed = false;
for (const rel of TARGETS) {
  const path = join(ROOT, rel);
  const raw = await readFile(path, 'utf8');
  const doc = JSON.parse(raw);
  if (!isOldShape(doc)) {
    console.log(`${rel}: already migrated, skipping`);
    continue;
  }
  if (CHECK) {
    console.error(`${rel}: still carries the old protocol-prefixed shape`);
    failed = true;
    continue;
  }
  const migrated = migrateProtocol(doc);
  await writeFile(path, JSON.stringify(migrated, null, 2) + '\n');
  console.log(`${rel}: migrated`);
}

if (failed) {
  console.error('\n✗ migrate-379-protocol-shape --check found unmigrated files');
  process.exit(1);
}
console.log(CHECK ? '\n✓ all targets already migrated' : '\n✓ migration complete');
