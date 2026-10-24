#!/usr/bin/env node
/**
 * check-governance-seed-root-container.mjs — srs#947.
 *
 * RFC-025 [R1] (Accepted): "The com.mudemocracy.governance package seed MUST ship
 * manifest.container.containerId equal to 54432eb2-7961-4538-ac16-9e25dcfa2f42." (From dataModelRevision 10, RFC-052,
 * that id is manifest.rootContainerId; srs#948.) No check ever
 * enforced [R1], so all four seeds published before this fix
 * (packages/com.mudemocracy.governance/{1.0.0,1.1.0,1.2.0,1.2.1}/seed/empty-governance-document.srsj)
 * carried e2e8489a-5ada-4309-9b26-90ccc263146d instead — scripts/build-governance-seed.mjs's
 * SEED_REPOSITORY_ID constant, which also becomes manifest.repositoryId.
 *
 * The published versions are immutable (srs#947's decided fix is "the next seed version", not a
 * rewrite of history), so this check only guards the CURRENT version
 * (scripts/lib/governance-versions.mjs), same exemption discipline as the existing
 * governance-seed-drift check (srs#550). Plain Node/JSON, no pinned CLI needed — runs under
 * validate-all.mjs.
 */
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { latestGovernanceVersion } from './lib/governance-versions.mjs';

const HERE = resolve(fileURLToPath(new URL('.', import.meta.url)));
const REPO = resolve(HERE, '..');

// RFC-025 [R1]'s provenance-anchored root container id.
const REQUIRED_CONTAINER_ID = '54432eb2-7961-4538-ac16-9e25dcfa2f42';

const version = latestGovernanceVersion(REPO);
const seedPath = join(REPO, 'packages', 'com.mudemocracy.governance', version, 'seed', 'empty-governance-document.srsj');
const rel = seedPath.slice(REPO.length + 1);

let doc;
try {
  doc = JSON.parse(await readFile(seedPath, 'utf8'));
} catch (err) {
  console.error(`✗ check-governance-seed-root-container: failed to read/parse ${rel} — ${err.message}`);
  process.exit(1);
}

// RFC-052 [R1]: the current seed is at dataModelRevision 10, so the manifest names its root by rootContainerId.
const containerId = doc.manifest?.rootContainerId;
const repositoryId = doc.manifest?.repositoryId;

const problems = [];
if (containerId !== REQUIRED_CONTAINER_ID) {
  problems.push(`manifest.rootContainerId is ${JSON.stringify(containerId)}, expected ${JSON.stringify(REQUIRED_CONTAINER_ID)} (RFC-025 [R1])`);
}
if (repositoryId !== REQUIRED_CONTAINER_ID) {
  problems.push(`manifest.repositoryId is ${JSON.stringify(repositoryId)}, expected ${JSON.stringify(REQUIRED_CONTAINER_ID)} (RFC-025 [R1] — the seed's scaffolded repositoryId must match the root container it ships)`);
}

if (problems.length) {
  console.error(`✗ ${rel} (CURRENT version ${version}) violates RFC-025 [R1]:`);
  for (const p of problems) console.error(`    - ${p}`);
  process.exit(1);
}

console.log(`✓ ${rel} (CURRENT version ${version}) ships the RFC-025 [R1] root container id ${REQUIRED_CONTAINER_ID}.`);
console.log('  (packages/com.mudemocracy.governance/{1.0.0,1.1.0,1.2.0,1.2.1,1.2.2,1.2.3} are prior published history and are exempt — srs#947, srs#948, srs#949.)');
